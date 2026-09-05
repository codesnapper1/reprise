# Reprise — Payment Agent Wind Tunnel

A working Open Track prototype for the Razorpay AI Buildathon. Reprise executes payment failure scenarios, checks integer-money invariants, reduces failures to reproducible counterexamples, and compares a reference workflow with safeguards enabled. A trained random forest prioritizes scenarios worth running.

**This is a simulator, not a live payment gateway.** The intentionally flawed reference workflow is not a commercial LLM. Test exposure is not actual revenue saved. No claim of global novelty or guaranteed selection is made.

## Use the product

1. Open Test lab. The initial late-confirmation replay works immediately.
2. Scrub the event timeline. Compare the merchant's notification with the bank ledger.
3. Switch to **With safeguards** and inspect why an action was held.
4. Use **Replay reduced trace** to view a deletion-minimal explanation.
5. Run a 60, 180 or 360-case experiment. Click a failure cell to inspect it.
6. Open Model & evidence for the measured ranking experiment and its limitations.
7. Import a normalized JSON event sequence or export any replay/run.

Run summaries persist in Cloudflare D1. If storage is unavailable, simulations still execute and reports can be downloaded; the interface explicitly reports the save failure.

## Local development

Requires Node.js 22.13+ and npm. The full web application uses Vinext, React and Cloudflare Workers/D1. Use Linux, macOS with GNU coreutils, or WSL for the supplied build scripts.

```bash
npm ci
npm run dev
```

The simulator is independent of the web runtime and needs no npm packages:

```bash
node --test tests/simulator.test.mjs
node scripts/evaluate-agent.mjs ./examples/guarded-agent.mjs 42017 60
```

The standalone agent evaluation writes `agent-evaluation.json`. Without a provisioned local D1 database, the web UI runs simulations but cannot save history. For full local persistence, apply `drizzle/0000_dazzling_wolf_cub.sql` to the local DB binding using your Cloudflare Wrangler configuration. Production Sites provisioning applies the migration automatically.

## Bring your own agent

Export `async decide(observation, tools)` from a local JavaScript module. Return `execute` or `hold`. You may call an LLM or your own planner inside that function; keep its API key in your local environment. `tools.lookupPayment(intent)` is a simulated, read-only gateway lookup. The observation includes the current event, merchant-known capture state, consent, mandate budget, refund total and past decisions. A decision has a 15-second timeout.

```bash
node scripts/evaluate-agent.mjs ./your-agent.mjs 12345 60
```

The adapter supports a deliberately small action surface: execute/hold a recovery or refund. It does not emulate all Razorpay API operations. The hosted app imports JSON event sequences; it never runs arbitrary uploaded code.

## Reproduce the learned scenario search

Python dependencies: numpy 2.3.5 and scikit-learn 1.8.0 were used for the recorded training run.

```bash
node scripts/ml/generate.mjs
python scripts/ml/train-search.py
```

The generator runs the reference workflow 10,000 times. Training and test seeds are disjoint. Labels come from actual simulator outcomes. Training exports 32 depth-limited decision trees as JSON; the Worker performs tree traversal directly, without Python or a hosted-model subscription.

Recorded pure-ranking result at a 200-case budget: 200 failures found versus a mean of 106.1 for random selection across 1,000 draws. This is a result on the simple included reference policy and known failure families. It does **not** establish performance on unseen agents. The UI uses 80% ranking plus 20% exploration, so its results are different from the pure-ranking experiment.

## Validation

- Ten domain tests pass.
- Safeguards checked against 6,000 deterministic scenarios.
- Valid clean recoveries still complete; holding everything fails the liveness check.
- Counterexample reduction checked for preserved failure and 1-minimality.
- Async agent adapter checked for actual status-tool usage, valid recovery and invalid decisions.
- Production Worker build succeeds.
- Browser visual testing has not been performed in this session.

## Layout

- `lib/simulator.mjs`: event generation, reference workflow, ledger invariants, reduction.
- `lib/agent-sdk.mjs`: async local agent adapter.
- `lib/search.ts`, `lib/model/search.json`: trained priority model and runtime inference.
- `app/api/workspace/route.ts`: batch execution, custom trace validation, inspection, history.
- `app/page.tsx`, `app/components/FlowCanvas.tsx`: working UI and animated event visualization.
- `docs/RESEARCH.md`: evidence, alternatives and novelty limits.
- `docs/ARCHITECTURE.md`: system design, checks and known gaps.
- `docs/PITCH.md`: five-minute demo outline and judge questions.
- `docs/SUBMISSION.md`: remaining submission steps.

## Before submission or production claims

Test at least one real agent through the adapter, add held-out workflow implementations, compare model ranking with a hand-built risk heuristic, and validate the modeled lifecycle against Razorpay test mode. Make the repository public and record your own five-minute walkthrough. The current deployment is private to its owner; judges cannot use that private URL.
