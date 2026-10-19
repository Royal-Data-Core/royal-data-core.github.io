#!/usr/bin/env python3
"""
Testes de integração do project-analyst no ecossistema SDD.

Arquivo de destino: scripts/test_project_analyst_integration.py

Uso:
    python scripts/test_project_analyst_integration.py

Pré-requisito:
    scripts/validate_nexus_yaml.py deve estar atualizado com:
    - "project-analyst" em VALID_AGENTS
    - Novos slugs em CONSTRAINT_VOCAB:
      project_analysis_scope_defined, directive_traceability_enforced,
      roi_prioritization_applied, health_metrics_reported
"""
import sys

sys.path.insert(0, "scripts")
from validate_nexus_yaml import validate, VALID_AGENTS, CONSTRAINT_VOCAB  # noqa: E402

HEADING = "### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)"

NEW_ANALYSIS_SLUGS = [
    "project_analysis_scope_defined",
    "directive_traceability_enforced",
    "roi_prioritization_applied",
    "health_metrics_reported",
]


def _directive(yaml_body: str) -> str:
    """Envolve um corpo YAML no heading + fence esperados pelo parser.

    Construído por concatenação com \\n explícitos para evitar
    conflito de fences markdown dentro de strings Python.
    """
    return (
        "\n"
        f"{HEADING}\n"
        "```yaml\n"
        f"{yaml_body}\n"
        "```\n"
    )


def test_project_analyst_in_roster():
    """project-analyst deve estar registrado como agente válido."""
    assert "project-analyst" in VALID_AGENTS, (
        "project-analyst ausente de VALID_AGENTS. "
        "Aplique o patch em scripts/validate_nexus_yaml.py."
    )
    print("✅ test_project_analyst_in_roster")


def test_new_constraint_slugs():
    """Os 4 novos slugs de análise devem estar no vocabulário."""
    for slug in NEW_ANALYSIS_SLUGS:
        assert slug in CONSTRAINT_VOCAB, (
            f"Slug '{slug}' ausente de CONSTRAINT_VOCAB. "
            "Aplique o patch em scripts/validate_nexus_yaml.py."
        )
    print("✅ test_new_constraint_slugs")


def test_valid_delegation_to_project_analyst():
    """Delegação para project-analyst com slugs de análise deve passar."""
    yaml_body = (
        "action: delegate\n"
        "target_agent: project-analyst\n"
        "constraints_enforced:\n"
        "  - project_analysis_scope_defined\n"
        "  - roi_prioritization_applied\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, msg = validate(response)
    assert ok, f"Falha: {msg}"
    print("✅ test_valid_delegation_to_project_analyst")


def test_delegation_with_all_analysis_slugs():
    """Delegação usando os 4 slugs de análise simultaneamente deve passar."""
    yaml_body = (
        "action: delegate\n"
        "target_agent: project-analyst\n"
        "constraints_enforced:\n"
        "  - project_analysis_scope_defined\n"
        "  - directive_traceability_enforced\n"
        "  - roi_prioritization_applied\n"
        "  - health_metrics_reported\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, msg = validate(response)
    assert ok, f"Falha: {msg}"
    print("✅ test_delegation_with_all_analysis_slugs")


def test_block_from_project_analyst_requires_human():
    """Retorno blocked do project-analyst deve escalar para Human."""
    yaml_body = (
        "action: block\n"
        "target_agent: Human\n"
        "constraints_enforced:\n"
        "  - project_analysis_scope_defined\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, msg = validate(response)
    assert ok, f"Falha: {msg}"
    print("✅ test_block_from_project_analyst_requires_human")


def test_lateral_delegation_rejected():
    """project-analyst NÃO pode ser alvo de ação block (topologia DAG)."""
    yaml_body = (
        "action: block\n"
        "target_agent: project-analyst\n"
        "constraints_enforced: []\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "block para project-analyst deve falhar (topologia exige Human)"
    print("✅ test_lateral_delegation_rejected")


def test_unknown_analysis_slug_rejected():
    """Slug de análise inexistente deve ser rejeitado."""
    yaml_body = (
        "action: delegate\n"
        "target_agent: project-analyst\n"
        "constraints_enforced:\n"
        "  - slug_analise_inexistente\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "Slug desconhecido deve falhar"
    print("✅ test_unknown_analysis_slug_rejected")


if __name__ == "__main__":
    test_project_analyst_in_roster()
    test_new_constraint_slugs()
    test_valid_delegation_to_project_analyst()
    test_delegation_with_all_analysis_slugs()
    test_block_from_project_analyst_requires_human()
    test_lateral_delegation_rejected()
    test_unknown_analysis_slug_rejected()
    print("\n🎉 Todos os 7 testes passaram!")
