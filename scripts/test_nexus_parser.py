#!/usr/bin/env python3
"""Testes unitários para o parser de YAML do Nexus."""

import sys
sys.path.insert(0, 'scripts')
from validate_nexus_yaml import validate

def test_valid_delegate():
    response = """
### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)
```yaml
action: delegate
target_agent: spec-engineer
constraints_enforced:
  - zod_content_validation
  - strict_typescript
```
"""
    válido, msg = validate(response)
    assert válido, f"Falha: {msg}"
    print("✅ test_valid_delegate passed")

def test_valid_block():
    response = """
### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)
```yaml
action: block
target_agent: Human
constraints_enforced:
  - no_heavy_trackers
```
"""
    válido, msg = validate(response)
    assert válido, f"Falha: {msg}"
    print("✅ test_valid_block passed")

def test_invalid_agent():
    response = """
### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)
```yaml
action: delegate
target_agent: invalid-agent
constraints_enforced: []
```
"""
    válido, msg = validate(response)
    assert not válido, "Deveria falhar com agent inválido"
    print("✅ test_invalid_agent passed")

def test_missing_fence():
    response = """
### ⚙️ INTER-AGENT DIRECTIVES (MACHINE READABLE)
```yaml
action: delegate
target_agent: frontend-astro
constraints_enforced: []
"""
    válido, msg = validate(response)
    assert not válido, "Deveria falhar sem fence de fechamento"
    print("✅ test_missing_fence passed")

if __name__ == "__main__":
    test_valid_delegate()
    test_valid_block()
    test_invalid_agent()
    test_missing_fence()
    print("\n🎉 Todos os testes passaram!")
