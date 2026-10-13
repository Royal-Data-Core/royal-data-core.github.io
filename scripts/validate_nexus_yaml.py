#!/usr/bin/env python3
"""
Validador de diretivas YAML do Nexus L0.
Uso: python scripts/validate_nexus_yaml.py <arquivo_com_resposta.txt>
Ou: cat resposta.txt | python scripts/validate_nexus_yaml.py
"""

import re
import sys
import yaml

VALID_AGENTS = {
    "architect-sdd", "spec-engineer", "frontend-astro", "content-strategist",
    "devops-platform", "integrations-security", "qa-shiftleft",
    "reviewer-gatekeeper", "Human",
}
VALID_ACTIONS = {"delegate", "block", "require_clarification"}
ALLOWED_KEYS = {"action", "target_agent", "constraints_enforced"}
CONSTRAINT_VOCAB = {
    "secrets_env_only", "csp_strict", "form_honeypot", "npm_audit_clean",
    "lgpd_privacy_by_default", "no_eval_dynamic_code", "zero_js_default",
    "bundle_budget_js_50kb", "bundle_budget_css_30kb", "image_webp_avif",
    "cls_zero_explicit_dims", "lighthouse_95_min", "strict_typescript",
    "tailwind_only", "no_inline_styles", "no_third_party_ui_libs",
    "no_heavy_trackers", "zod_content_validation", "seo_meta_baselayout",
    "jsonld_schema", "semantic_html_a11y", "wcag_aa_contrast",
    "b2b_cta_required", "ci_cd_gated_deploy", "no_manual_deploy",
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
        return False, f"❌ Action inválido: {action}. Esperado: {VALID_ACTIONS}"

    target = data["target_agent"]
    if target not in VALID_AGENTS:
        return False, f"❌ Agent inválido: {target}. Esperado: {VALID_AGENTS}"

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

    return True, f"✅ YAML válido: {action} -> {target} com {len(constraints)} constraints"


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
