#!/usr/bin/env python3
"""
Testes unitários para o parser de YAML do Nexus — contrato v8.0.0-AFA.

Uso:
    python scripts/test_nexus_parser.py

Requisitos:
    scripts/validate_nexus_yaml.py acessível via sys.path
"""
import sys

sys.path.insert(0, "scripts")
from validate_nexus_yaml import validate  # noqa: E402

HEADING = "### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)"


def _directive(yaml_body: str) -> str:
    """Envolve um corpo YAML no heading + fence esperados pelo parser."""
    return (
        "\n"
        f"{HEADING}\n"
        "```yaml\n"
        f"{yaml_body}\n"
        "```\n"
    )


def test_valid_delegate():
    yaml_body = (
        "action: delegate\n"
        "target_agent: spec-engineer\n"
        "constraints_enforced:\n"
        "  - zod_content_validation\n"
        "  - strict_typescript\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, msg = validate(response)
    assert ok, f"Falha: {msg}"
    print("✅ test_valid_delegate")


def test_valid_block():
    yaml_body = (
        "action: block\n"
        "target_agent: Human\n"
        "constraints_enforced:\n"
        "  - no_heavy_trackers\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, msg = validate(response)
    assert ok, f"Falha: {msg}"
    print("✅ test_valid_block")


def test_valid_require_clarification():
    yaml_body = (
        "action: require_clarification\n"
        "target_agent: Human\n"
        "constraints_enforced: []\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, msg = validate(response)
    assert ok, f"Falha: {msg}"
    print("✅ test_valid_require_clarification")


def test_invalid_agent():
    yaml_body = (
        "action: delegate\n"
        "target_agent: invalid-agent\n"
        "constraints_enforced: []\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "Deveria falhar com agent inválido"
    print("✅ test_invalid_agent")


def test_new_agents_v8():
    """spec-auditor e static-analysis-enforcer devem ser aceitos."""
    for agent in ("spec-auditor", "static-analysis-enforcer"):
        yaml_body = (
            "action: delegate\n"
            f"target_agent: {agent}\n"
            "constraints_enforced: []\n"
            "bypass_pillars_verified: false\n"
            "kill_switch_active: true"
        )
        response = _directive(yaml_body)
        ok, msg = validate(response)
        assert ok, f"Falha para {agent}: {msg}"
    print("✅ test_new_agents_v8")


def test_missing_fence():
    """Resposta sem fence de fechamento deve falhar."""
    response = (
        "\n"
        f"{HEADING}\n"
        "```yaml\n"
        "action: delegate\n"
        "target_agent: frontend-astro\n"
        "constraints_enforced: []\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true\n"
        # Nota: fence de fechamento ausente propositalmente
    )
    ok, _ = validate(response)
    assert not ok, "Deveria falhar sem fence de fechamento"
    print("✅ test_missing_fence")


def test_topology_block_requires_human():
    """action=block exige target_agent=Human."""
    yaml_body = (
        "action: block\n"
        "target_agent: frontend-astro\n"
        "constraints_enforced: []\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "block para não-Human deve falhar"
    print("✅ test_topology_block_requires_human")


def test_constraints_limit():
    """6 constraints deve falhar (limite é 5)."""
    yaml_body = (
        "action: delegate\n"
        "target_agent: frontend-astro\n"
        "constraints_enforced:\n"
        "  - zero_js_default\n"
        "  - tailwind_only\n"
        "  - b2b_cta_required\n"
        "  - strict_typescript\n"
        "  - csp_strict\n"
        "  - form_honeypot\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "6 constraints deve falhar (limite 5)"
    print("✅ test_constraints_limit")


def test_unknown_constraint_slug():
    yaml_body = (
        "action: delegate\n"
        "target_agent: frontend-astro\n"
        "constraints_enforced:\n"
        "  - slug_inexistente\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: true"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "Slug desconhecido deve falhar"
    print("✅ test_unknown_constraint_slug")


def test_kill_switch_must_be_true():
    yaml_body = (
        "action: delegate\n"
        "target_agent: frontend-astro\n"
        "constraints_enforced: []\n"
        "bypass_pillars_verified: false\n"
        "kill_switch_active: false"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "kill_switch_active=false deve falhar"
    print("✅ test_kill_switch_must_be_true")


def test_missing_v8_keys():
    """Diretiva sem bypass_pillars_verified/kill_switch_active deve falhar."""
    yaml_body = (
        "action: delegate\n"
        "target_agent: frontend-astro\n"
        "constraints_enforced: []"
    )
    response = _directive(yaml_body)
    ok, _ = validate(response)
    assert not ok, "Contrato v8 incompleto deve falhar"
    print("✅ test_missing_v8_keys")


if __name__ == "__main__":
    test_valid_delegate()
    test_valid_block()
    test_valid_require_clarification()
    test_invalid_agent()
    test_new_agents_v8()
    test_missing_fence()
    test_topology_block_requires_human()
    test_constraints_limit()
    test_unknown_constraint_slug()
    test_kill_switch_must_be_true()
    test_missing_v8_keys()
    print("\n🎉 Todos os 11 testes passaram!")
