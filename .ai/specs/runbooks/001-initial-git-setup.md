# Runbook 001: Initial Git & GitHub Setup (Greenfield)

## Status
**ONE-TIME EXECUTION** — Run this once at project inception. Archive after completion.

## Prerequisites
- Git installed (`git --version`)
- GitHub CLI installed (`gh --version`)
- GitHub account with SSH key or HTTPS token configured
- Project files present in current directory (Astro project initialized)

## Execution Steps

### Step 1: Initialize Local Git Repository
Run these commands in the project root:

    git init
    git branch -M main

Expected output: "Initialized empty Git repository in /path/to/project/.git/"

### Step 2: Configure `.gitignore`
Create `.gitignore` with Astro + Node.js defaults:

    # Dependencies
    node_modules/
    .pnp
    .pnp.js
    
    # Build output
    dist/
    .astro/
    
    # Environment
    .env
    .env.local
    .env.*.local
    
    # IDE
    .vscode/
    .idea/
    *.swp
    *.swo
    *~
    
    # OS
    .DS_Store
    Thumbs.db
    
    # Logs
    *.log
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*
    
    # Testing
    coverage/
    test-results/
    playwright-report/
    
    # Misc
    .cache/
    .tmp/

Verify with: `cat .gitignore`

### Step 3: Initial Commit
Stage all files and create the first commit:

    git add .
    git commit -m "chore: initial project setup with Astro + Tailwind"

Verify with: `git log --oneline` (should show one commit)

### Step 4: Create GitHub Repository
Use `gh` CLI to create the remote repository and push:

    gh repo create <your-username>/<repo-name> --public --source=. --remote=origin --push

Replace `<your-username>` and `<repo-name>` with actual values.

Expected output: Repository created on GitHub, local `main` branch pushed.

Verify with: `gh repo view`

### Step 5: Enable GitHub Pages
Enable GitHub Pages with GitHub Actions as the build source:

    gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow

Replace `{owner}` and `{repo}` with actual values (e.g., `leonardo/my-consultancy`).

Expected output: JSON response with Pages configuration.

Verify with: `gh api repos/{owner}/{repo}/pages`

### Step 6: Configure Branch Protection
Protect the `main` branch to require PRs and CI checks:

    gh api repos/{owner}/{repo}/branches/main/protection -X PUT \
      -f required_status_checks='{"strict":true,"contexts":["ci"]}' \
      -f enforce_admins=true \
      -f required_pull_request_reviews='{"required_approving_review_count":1}' \
      -f restrictions=null

Replace `{owner}` and `{repo}` with actual values.

Expected output: JSON response with branch protection rules.

Verify with: `gh api repos/{owner}/{repo}/branches/main/protection`

### Step 7: Verify Setup
Run these verification commands:

    git status
    gh repo view
    gh pr list

Expected output:
- `git status`: "On branch main, nothing to commit, working tree clean"
- `gh repo view`: Shows repository details
- `gh pr list`: "There are no open pull requests"

## Rollback
If any step fails:

1. Delete local `.git/` directory: `rm -rf .git/`
2. Delete remote repo: `gh repo delete <owner>/<repo> --yes`
3. Restart from Step 1.

## Post-Execution
- Archive this runbook: `mkdir -p .ai/specs/runbooks/archive && mv .ai/specs/runbooks/001-initial-git-setup.md .ai/specs/runbooks/archive/`
- Notify `devops-platform` agent that initial setup is complete.
- Proceed to ADR-001 (stack and blueprint) with `architect-sdd`.

## Troubleshooting

### Issue: `gh: Not logged in`
Solution: Run `gh auth login` and follow the prompts.

### Issue: `fatal: remote origin already exists`
Solution: Remove existing remote: `git remote remove origin`, then re-run Step 4.

### Issue: `API returns 404`
Solution: Verify repository name and permissions. Ensure you have admin access to the repo.

### Issue: Branch protection fails
Solution: Ensure you're using the correct owner/repo format. Some GitHub plans require Pro for branch protection.
