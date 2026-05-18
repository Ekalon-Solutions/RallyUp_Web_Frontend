Fix the following bug in the RallyUp Web Frontend.

BUG:
$ARGUMENTS

---

Follow this process:

1. **Reproduce first.** Understand exactly what is failing and why before touching any code. Read the relevant page, component, and API call in `lib/api.ts`.

2. **Find the root cause** — not just the symptom. Trace: UI interaction → state/handler → API call → response handling.

3. **Minimal fix.** Change only what is broken. Do not refactor surrounding code or clean up unrelated things.

4. **Check for the same bug elsewhere** — if the same pattern is used in other components, flag it (but only fix what the ticket covers).

5. At the end, output:
   - Root cause (one sentence)
   - Files changed (list)
   - How to verify the fix (navigation steps + what to check)
   - Any related components at risk of the same bug
