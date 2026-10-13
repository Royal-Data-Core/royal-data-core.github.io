## Rollback Procedure

1. **Identify the last stable commit** via `git log`.
2. **Create a rollback branch**:
   ```bash
   git checkout -b rollback-<timestamp>
   ```
3. **Reset to the stable commit**:
   ```bash
   git reset --hard <commit-hash>
   ```
4. **Open a PR** to merge into `main`.
5. **Merge the PR** after CI/CD validation.