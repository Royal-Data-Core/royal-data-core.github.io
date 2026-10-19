# Runbook: Lockfile Synchronization

## Metadata
- **Scenario**: lockfile-sync
- **Severity Trigger**: P2
- **Estimated MTTR**: 15 minutes
- **Last Validated**: 2026-10-15
- **Owner**: devops-platform

## Preconditions
- [Required access: GitHub repo admin]
- [Required tools: gh CLI, node 22 LTS]
- [Required state: CI green on last commit]

## Procedure
1. npm install
2. git add package-lock.json
3. git commit -m "chore: sync lockfile"
4. git push origin main

## Verification
- [Check for npm audit pass]
- [Verify lockfile hash matches package.json]

## Rollback of this Procedure
- [Revert last commit with git reset --hard]

## Post-Incident
- [Update DORA metrics]
- [File preventive spec if root cause is systemic]