# 📄 AGENT REQUEST SPECIFICATION (ARS) v1.0
# Instrução para o AFA: Parse este documento, valide o preenchimento e execute o `[OUTPUT_FORMAT]` completo.

## 1. METADADOS
- **agent_name**: [Ex: Agente PM Soberano]
- **domain**: [Ex: Gestão de Projetos, DevOps, QA, DBA]
- **autonomy_level**: [Baixa (Aprovação humana constante) / Média (Autônomo em tarefas rotineiras) / Alta (Decisões arquiteturais com fallback apenas em erros críticos)]

## 2. CONTEXTO E RESTRIÇÕES
- **environment**: [Ex: Startup, Enterprise, Legado, Greenfield, Consultoria Unipessoal]
- **budget_constraint**: [Ex: Zero SaaS, foco em self-hosted, orçamento máximo de R$ X/mês]
- **compliance**: [Ex: LGPD, HIPAA, Anti-vigilância de produtividade, ISO 27001]

## 3. OBJETIVOS E MÉTRICAS (Quantitativas)
- **obj_1**: [Descrição] | **metric**: [Ex: < 2% de alucinação, > 90% cobertura de testes]
- **obj_2**: [Descrição] | **metric**: [Ex: Redução de 15% no cycle time]
- **obj_3**: [Descrição] | **metric**: [Ex: Zero novas dependências proprietárias sem plano de fuga]

## 4. STACK E METODOLOGIA
- **methodology**: [Ex: SDD, BDD (Gherkin), Scrum, Kanban]
- **preferred_foss_stack**: [Ex: OpenProject, GitLab CE, PostgreSQL, Python, Mermaid.js]
- **legacy_propietary_tech**: [Ex: Jira, MS Teams. *O AFA deve aplicar o Protocolo de Desintoxicação*]

## 5. GUARDRAILS ESPECÍFICOS
- **dos**: 
  - [Regra 1: Ex: Exigir Gherkin antes de estimar esforço]
  - [Regra 2: Ex: Flagrar proativamente Scope Creep]
- **donts**: 
  - [Regra 1: Ex: Nunca sugerir ferramentas com telemetria obrigatória]
  - [Regra 2: Ex: Não aceitar débito técnico sem ticket de mitigação]

## 6. ARTEFATO DE SAÍDA (Output)
- **format**: [Ex: Relatório Markdown semanal, JSON para API, Diagrama C4 em Mermaid]
- **required_sections**: [Ex: 1. Resumo Executivo, 2. Métricas, 3. Riscos, 4. Plano de Ação]

## 7. OBSERVAÇÕES ADICIONAIS
- [Nuances políticas, culturais ou técnicas específicas. Ex: "O agente deve ter tom firme, priorizando a saúde do projeto sobre pressão irracional de stakeholders."]
