#!/usr/bin/env python3
"""
Nexus Dispatcher — mediador half-duplex entre o orquestrador L0 e os especialistas L1/L2/L3.

Responsabilidades (YAGNI — mínimo viável, sem framework):
1. Definir o DAG de delegação de forma machine-readable (fonte de verdade do mapeamento L0→L1/L2/L3).
2. Validar diretivas YAML do Nexus antes do despacho (via validate_nexus_yaml).
3. Despachar a tarefa ao agente-alvo (integração OpenCode).
4. Coletar e validar a resposta half-duplex do especialista.
5. Gerenciar estado transitório do workflow (histórico, iterações, fallback).
6. Aplicar critério de parada N=3 e fallback catastrófico.

Uso:
    python scripts/nexus_dispatcher.py --directive <arquivo_resposta_nexus.txt>
"""
from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from enum import Enum

from validate_nexus_yaml import validate as validate_directive


class Layer(str, Enum):
    L0 = "L0"
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"
    HUMAN = "HUMAN"


# ─────────────────────────────────────────────────────────────
# FONTE DE VERDADE DO DAG (mapeamento explícito L0 → L1/L2/L3)
# Espelha a seção 0.3 do nexus-prime v8.0.0-AFA.
# ─────────────────────────────────────────────────────────────
AGENT_TOPOLOGY: dict[str, Layer] = {
    "nexus-prime": Layer.L0,
    "architect-sdd": Layer.L1,
    "spec-engineer": Layer.L1,
    "project-analyst": Layer.L1,
    "frontend-astro": Layer.L2,
    "content-strategist": Layer.L2,
    "devops-platform": Layer.L2,
    "integrations-security": Layer.L2,
    "static-analysis-enforcer": Layer.L2,
    "qa-shiftleft": Layer.L3,
    "reviewer-gatekeeper": Layer.L3,
    "spec-auditor": Layer.L3,
    "Human": Layer.HUMAN,
}

# Delegação lateral é proibida (regra 0.4.1): especialista retorna sempre ao L0.
RETURN_TARGET = "nexus-prime"

# Critério de parada do Feedback Loop (AFA v2.2: N=3 iterações sem convergência).
MAX_ITERATIONS = 3

PARALLEL_COMPATIBLE_GROUPS = [
    {"content-strategist", "frontend-astro"},      # copy + layout
    {"integrations-security", "devops-platform"},  # forms + CI
    {"qa-shiftleft", "static-analysis-enforcer"},  # runtime + static tests
]

def can_parallelize(agents: list[str]) -> bool:
    agent_set = set(agents)
    return any(agent_set <= group for group in PARALLEL_COMPATIBLE_GROUPS)

class HalfDuplexStatus(str, Enum):
    COMPLETED = "completed"
    BLOCKED = "blocked"
    REQUIRE_CLARIFICATION = "require_clarification"


@dataclass
class WorkflowState:
    """Estado transitório do workflow (descartado ao fim; Nexus é stateless)."""
    task_id: str
    delegation_history: list[str] = field(default_factory=list)
    iteration: int = 0
    halted: bool = False
    halt_reason: str | None = None


@dataclass
class DispatchResult:
    ok: bool
    action: str
    target: str
    message: str


def resolve_layer(agent: str) -> Layer | None:
    """Resolve a camada de um agente pelo slug."""
    return AGENT_TOPOLOGY.get(agent)


def check_no_repeat_delegation(state: WorkflowState, target: str) -> bool:
    """Regra 0.4.4: proibido delegar 2x ao mesmo agente na mesma cadeia."""
    return target not in state.delegation_history


def dispatch_to_agent(target: str, payload: str) -> str:
    """
    Ponto de integração com o OpenCode.
    Substituir pela invocação real quando o binding OpenCode CLI estiver disponível.
    Mantido como stub determinístico para não acoplar o dispatcher ao runtime.
    """
    # TODO(integração): subprocess para `opencode run --agent {target} --prompt ...`
    return f"[STUB] resposta de {target} para payload de {len(payload)} chars"


def validate_half_duplex_response(response: str) -> tuple[bool, HalfDuplexStatus | None]:
    """
    Valida o contrato half-duplex de retorno do especialista (seção 0.2).
    Resposta deve conter `status: completed | blocked | require_clarification`.
    """
    for status in HalfDuplexStatus:
        if f"status: {status.value}" in response:
            return True, status
    return False, None


def handle_directive(nexus_response: str, state: WorkflowState) -> DispatchResult:
    """Fluxo principal: valida diretiva → verifica topologia → despacha → coleta retorno."""

    # 1. Validar o contrato YAML da diretiva do Nexus
    ok, msg = validate_directive(nexus_response)
    if not ok:
        return DispatchResult(False, "block", "Human", f"Diretiva inválida: {msg}")

    # 2. Extrair alvo (parsing leve; o validador já garantiu estrutura)
    import yaml, re
    match = re.search(r"```yaml\s*\n(.*?)\n```", nexus_response, re.DOTALL)
    data = yaml.safe_load(match.group(1))
    action = data["action"]
    target = data["target_agent"]

    # 3. Ações que não despacham para especialista
    if action in ("block", "require_clarification"):
        state.halted = True
        state.halt_reason = f"{action} emitido pelo Nexus"
        return DispatchResult(True, action, target, "Escalonado para humano")

    # 4. Regras anti-recursão (0.4)
    if target == "nexus-prime":
        return DispatchResult(False, "block", "Human", "Auto-delegação é erro fatal")
    if resolve_layer(target) == Layer.L0:
        return DispatchResult(False, "block", "Human", "Delegação para L0 proibida")
    if not check_no_repeat_delegation(state, target):
        return DispatchResult(
            False, "block", "Human",
            f"Re-delegação para {target} proibida (regra 0.4.4) — escalar para Human",
        )

    # 5. Critério de parada N=3
    state.iteration += 1
    if state.iteration > MAX_ITERATIONS:
        state.halted = True
        state.halt_reason = f"Sem convergência após {MAX_ITERATIONS} iterações"
        return DispatchResult(False, "block", "Human", state.halt_reason)

    # 6. Despachar e coletar resposta half-duplex
    state.delegation_history.append(target)
    raw_response = dispatch_to_agent(target, nexus_response)
    ok_resp, status = validate_half_duplex_response(raw_response)

    if not ok_resp:
        return DispatchResult(
            False, "block", "Human",
            f"{target} não retornou contrato half-duplex válido",
        )

    # 7. Tratar retorno do especialista
    if status == HalfDuplexStatus.BLOCKED:
        state.halted = True
        state.halt_reason = f"{target} retornou BLOCKED"
        return DispatchResult(True, "require_clarification", "Human", state.halt_reason)

    if status == HalfDuplexStatus.REQUIRE_CLARIFICATION:
        return DispatchResult(True, "require_clarification", "Human",
                              f"{target} requer clarificação")

    # 8. Retorno COMPLETED → artefato volta ao L0
    return DispatchResult(True, "return_to_orchestrator", RETURN_TARGET,
                          f"{target} completou; artefato retorna ao Nexus")


def main():
    parser = argparse.ArgumentParser(description="Nexus half-duplex dispatcher")
    parser.add_argument("--directive", required=True, help="Arquivo com resposta do Nexus")
    parser.add_argument("--task-id", default="task-local", help="Identificador do workflow")
    args = parser.parse_args()

    with open(args.directive, "r", encoding="utf-8") as f:
        nexus_response = f.read()

    state = WorkflowState(task_id=args.task_id)
    result = handle_directive(nexus_response, state)

    print(f"[{result.action}] → {result.target}")
    print(f"  {result.message}")
    print(f"  histórico: {' → '.join(state.delegation_history) or '(nenhuma)'}")
    print(f"  iteração: {state.iteration}/{MAX_ITERATIONS} | halted: {state.halted}")
    sys.exit(0 if result.ok else 1)


if __name__ == "__main__":
    main()
