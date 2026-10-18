#!/usr/bin/env python3
"""
Validador de diretivas YAML do Nexus L0 — contrato v8.0.0-AFA.
Uso: python scripts/validate_nexus_yaml.py <arquivo_com_resposta.txt>
Ou:  cat resposta.txt | python scripts/validate_nexus_yaml.py
"""
import re
import sys
import yaml

# Roster completo do nexus-prime v8 (seção 0.3) — 11 agentes + Human
VALID_AGENTS = {
    "architect-sdd", "spec-engineer", "frontend-astro", "content-strategist","project-analyst",
    "devops-platform", "integrations-security", "qa-shiftleft",
    "reviewer-gatekeeper", "spec-auditor", "static-analysis-enforcer",
    "Human",
}

VALID_ACTIONS = {"delegate", "block", "require_clarification", "consult"}

# Contrato YAML v8: 5 chaves obrigatórias (seção 10 do nexus-prime)
ALLOWED_KEYS = {
    "action", "target_agent", "constraints_enforced",
    "bypass_pillars_verified", "kill_switch_active",
    "requesting_agent","question", "parallel_safe",
}

MAX_PARALLEL_AGENTS = 3
MAX_CONSULTATIONS_PER_TASK = 3

# Registro de slugs completo (seção 9 do nexus-prime v8)
CONSTRAINT_VOCAB = {
    # Security
    "secrets_env_only", "csp_strict", "form_honeypot", "npm_audit_clean",
    "lgpd_privacy_by_default", "no_eval_dynamic_code", "oidc_least_privilege",
    # Performance
    "zero_js_default", "bundle_budget_js_50kb", "bundle_budget_css_30kb",
    "image_webp_avif", "cls_zero_explicit_dims", "lighthouse_95_min",
    "ssg_build_budget_8min",
    # Code quality
    "strict_typescript", "tailwind_only", "no_inline_styles",
    "no_third_party_ui_libs", "no_heavy_trackers", "zod_content_validation",
    # SEO / a11y / conversion
    "seo_meta_baselayout", "jsonld_schema", "semantic_html_a11y",
    "wcag_aa_contrast", "b2b_cta_required",
    # Ops
    "ci_cd_gated_deploy", "no_manual_deploy", "conventional_commits_en",
    # AFA Protocols
    "afa_kill_switch_active", "bypass_protocol_enforced",
    "foss_exit_strategy_documented", "half_duplex_return_mandatory",
    # Analysis
    "project_analysis_scope_defined", "directive_traceability_enforced",
    "roi_prioritization_applied", "health_metrics_reported",
}

MAX_CONSTRAINTS = 5

HEADING = re.escape("### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)")
DIRECTIVE_RE = re.compile(
    rf"{HEADING}\s*```yaml\s*\n(.*?)\n```",
    re.DOTALL,
)


def validate(response: str) -> tuple[bool, str]:
    """Retorna (válido, mensagem)."""
    match = DIRECTIVE_RE.search(response)
    if not match:
        return False, "❌ Bloco YAML não encontrado ou malformado (falta fence de fechamento?)"

    try:
        data = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        return False, f"❌ Erro de sintaxe YAML: {exc}"

    if not isinstance(data, dict):
        return False, f"❌ YAML deve ser um dicionário, não {type(data).__name__}"

    keys = set(data.keys())
    if keys != ALLOWED_KEYS:
        return False, f"❌ Chaves inválidas: {sorted(keys)}. Esperado: {sorted(ALLOWED_KEYS)}"

    action = data["action"]
    if action not in VALID_ACTIONS:
        return False, f"❌ Action inválido: {action}. Esperado: {sorted(VALID_ACTIONS)}"

    target = data["target_agent"]
    if target not in VALID_AGENTS:
        return False, f"❌ Agent inválido: {target}. Esperado: {sorted(VALID_AGENTS)}"

    if action != "delegate" and target != "Human":
        return False, f"❌ Topologia inválida: action={action} exige target_agent=Human"

    constraints = data["constraints_enforced"]
    if not isinstance(constraints, list):
        return False, f"❌ constraints_enforced deve ser lista, não {type(constraints).__name__}"
    if len(constraints) > MAX_CONSTRAINTS:
        return False, f"❌ Máximo {MAX_CONSTRAINTS} constraints, recebeu {len(constraints)}"
    for slug in constraints:
        if slug not in CONSTRAINT_VOCAB:
            return False, f"❌ Slug desconhecido: {slug}"

    # Contrato v8: campos booleanos obrigatórios
    if not isinstance(data["bypass_pillars_verified"], bool):
        return False, "❌ bypass_pillars_verified deve ser booleano"
    if data["kill_switch_active"] is not True:
        return False, "❌ kill_switch_active deve ser sempre true (inegociável)"

    return True, (
        f"✅ YAML válido: {action} -> {target} | "
        f"{len(constraints)} constraints | bypass={data['bypass_pillars_verified']}"
    )


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            response = f.read()
    else:
        response = sys.stdin.read()

    válido, msg = validate(response)
    print(msg)
    sys.exit(0 if válido else 1)


if __name__ == "__main__":
    main()
