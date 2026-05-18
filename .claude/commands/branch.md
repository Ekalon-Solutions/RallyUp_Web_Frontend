Create a new feature branch for the following ticket, then implement it.

TICKET:
$ARGUMENTS

---

Steps:
1. Run: `git checkout staging && git pull origin staging`
2. Extract a short kebab-case branch name from the ticket title (e.g. `feature/venue-tier-matrix`)
3. Run: `git checkout -b <branch-name>`
4. Confirm the branch was created, then implement the feature following the same rules as /feature:
   - Read relevant files first
   - api.ts → page → component → form
   - End with: files changed, test steps, QA checklist, merge command to run after QA
