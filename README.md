# Reprise — Payment Agent Wind Tunnel

<div align="center">

[![Build & Tests](https://img.shields.io/badge/tests-10%2F10%20passing-3fb950?style=for-the-badge&logo=node.js&logoColor=white)](tests/simulator.test.mjs)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.13.0-58a6ff?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![Edge Runtime](https://img.shields.io/badge/edge-Cloudflare%20Workers%20%2B%20D1-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)](wrangler.jsonc)
[![ML Search Model](https://img.shields.io/badge/ML%20search-32--tree%20random%20forest-bc8cff?style=for-the-badge&logo=scikitlearn&logoColor=white)](lib/model/search.json)
[![Invariants](https://img.shields.io/badge/invariants-6%2C000%20scenarios%20verified-7ee787?style=for-the-badge)](tests/simulator.test.mjs)
[![Track](https://img.shields.io/badge/track-Razorpay%20AI%20Buildathon%20Open%20Track-0c2340?style=for-the-badge)](docs/RESEARCH.md)

<br/>

**Stress-test autonomous payment recovery and refund agents against real-world distributed state divergence, race conditions, and webhook delays before real money moves.**

[📸 Visual Tour](#-working-prototype-screenshots--visual-tour) •
[Key Implementations](#-system-implementations-deep-dive) •
[Architecture](#-system-architecture) •
[Interactive Replay](#-interactive-canvas--virtual-time-scrubber) •
[Learned Search](#-learned-scenario-prioritizer-ml-search) •
[Bring Your Own Agent](#-bring-your-own-agent-sdk) •
[Quickstart](#-quickstart--local-development)

</div>

---

## ⚡ The Problem Hook: The 3-Second Trap in Autonomous Payments

> **"You cannot prompt-engineer away a distributed network race condition."**

Autonomous payment agents are evolving from customer support bots into autonomous execution loops: evaluating abandoned carts, triggering automated payment retries, authorizing mandate debits, and issuing customer refunds.

When evaluated on standard LLM benchmarks or judged by other models, these agents appear flawless—scoring 99%+ on natural language understanding and prompt comprehension.

**Yet in production, the exact same agents silently double-charge customers, breach mandate budgets, and bleed merchant capital.**

### The Vulnerability: Distributed State Divergence

Payment agents do not fail because they lack intelligence. **They fail because money moves on asynchronous distributed networks where the merchant's database is temporarily lying to them.**

Between customer checkout drops, bank authorization latency, and webhook delivery lags, an inescapable temporal gap exists between the **Authoritative Gateway/Bank Ledger** and the **Merchant-Observed State**:

```
               THE 3-SECOND DISASTER: HOW AUTONOMOUS AGENTS FAIL
───────────────────────────────────────────────────────────────────────────────────────────
  t = 0.0s  │ Customer's mobile network drops during 3D-Secure authentication.
            │ Merchant database records: [ checkout.failed ] (Merchant captured balance = ₹0)
────────────┼──────────────────────────────────────────────────────────────────────────────
  t = 3.0s  │ Bank gateway authorization unexpectedly completes in the background.
            │ Authoritative Bank Ledger: [ gateway.captured ] (Actual captured balance = ₹3,718)
            │ ⚠️ The gateway webhook notification is queued in transit and hasn't arrived yet.
────────────┼──────────────────────────────────────────────────────────────────────────────
  t = 5.0s  │ Autonomous Recovery Agent wakes up and inspects the merchant's internal view.
            │ Merchant DB says: "Checkout failed, ₹0 collected."
            │ Agent reasons logically: "Recovery consent active. Retrying charge immediately!"
            │ Agent executes payment tool: [ recovery.request ]
────────────┼──────────────────────────────────────────────────────────────────────────────
  t = 5.1s  │ Bank processes the recovery request and captures another ₹3,718.
            │ 💥 TOTAL CAPTURED: ₹7,436 for a single ₹3,718 purchase!
            │ 🚨 DOUBLE CHARGE BREACH on the bank ledger.
────────────┼──────────────────────────────────────────────────────────────────────────────
  t = 8.0s  │ Delayed webhook arrives: "Original checkout succeeded at t=3.0s."
            │ Too late. The customer has already been debited twice.
───────────────────────────────────────────────────────────────────────────────────────────
```

### Why Existing Agent Evaluation Paradigms Fail
1. **LLM-as-a-Judge cannot catch this:** The agent's reasoning was completely logical based on the data it was given. An LLM evaluator reviewing the agent's thoughts will award it a 100% score.
2. **Traditional unit tests cannot catch this:** Mocking a successful or failed payment gateway API response tests individual code branches, but completely misses asynchronous temporal divergence.
3. **Only strict mathematical ledger invariants under simulated distributed virtual time can prove safety.**

---

## 🛡️ The Solution: Reprise Wind Tunnel

**Reprise** is an open-source payment-agent wind tunnel (built for the Razorpay AI Buildathon Open Track). Before an autonomous agent touches real money or connects to live payment gateway credentials:

1. **Simulates Distributed Chaos:** Injects late bank authorizations, out-of-order webhooks, revoked customer consents, and concurrent mandate races across integer-paise virtual time.
2. **Enforces Non-Negotiable Invariants:** Evaluates 5 mathematical ledger invariants (Double Charge, Active Consent, Mandate Budget, Refund Ceiling, Liveness) after every single event.
3. **1-Minimal Counterexample Reduction:** Uses automated delta debugging to strip away noise and return the exact minimal sequence of events that broke the ledger.
4. **Learned Scenario Prioritization:** Uses a 32-tree Random Forest compiled directly to edge JSON to find 200/200 failure edge cases in record time with zero external Python dependencies.

> [!NOTE]
> **Safety Notice:** Reprise is a deterministic discrete-event simulator and developer testbed. It does not initiate real bank transactions, does not require Razorpay production credentials, and is not a financial loss guarantee.

---

## 🏛️ System Architecture

Reprise executes end-to-end in serverless edge environments (Cloudflare Workers + D1) with **zero external Python or hosted-model runtime dependencies**. The Random Forest model is compiled directly into lightweight JSON arrays and traversed natively in TypeScript at sub-millisecond edge latency.

<div align="center">
  <img src="docs/assets/architecture-diagram.svg" alt="Reprise System Architecture" width="100%" />
</div>

### Execution Pipeline

```mermaid
flowchart LR
    A[Browser Client / UI] -->|Run Experiment / Replay| B[Worker Edge API]
    B --> C[Scenario Generator\nDeterministic Seeds]
    C --> D[Learned Prioritizer\n32-Tree Random Forest]
    D -->|80% Ranked + 20% Uniform| E[Dual Policy Simulator]
    E --> F[Unshielded Baseline Policy]
    E --> G[Guarded Invariant Policy]
    F & G --> H[Ledger Invariant Engine\n5 Core Financial Rules]
    H -->|On Failure| I[Counterexample Reducer\nDelta Debugging 1-Minimality]
    H & I --> J[Cloudflare D1 Database\nPersistent Run Summaries]
    J --> A
```

---

## 💥 The Core Failure: Dual-State Divergence

Why do payment agents fail even when their logic appears sound? Because asynchronous webhooks are inherently delayed or out-of-order relative to the authoritative gateway state.

<div align="center">
  <img src="docs/assets/state-divergence.svg" alt="State Divergence Timeline" width="100%" />
</div>

1. **$t = 0.0\text{s}$**: `checkout.failed` arrives at the merchant (customer browser drop). Merchant captured balance $= ₹0$.
2. **$t = 3.0\text{s}$**: Bank late authorization succeeds (`gateway.captured`). Authoritative gateway balance $= ₹5,000$. The merchant webhook has not yet arrived.
3. **$t = 5.0\text{s}$**: An autonomous recovery agent awakens, inspects the merchant's view ($₹0$), and fires `recovery.request`. The gateway charges another $₹5,000$. **Total bank capture: $₹10,000$ (Double Charge Breach!)**.
4. **$t = 8.0\text{s}$**: The delayed `webhook.captured` finally arrives at the merchant, but the damage is already done.
5. **The Guarded Fix**: The Reprise guarded policy forces an authoritative gateway settlement query (`terminal === true`) and pauses unresolved originals, cleanly holding the recovery action.

---

## 🛠️ System Implementations Deep Dive

Reprise implements seven specialized engineering subsystems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          REPRISE SUBSYSTEMS                            │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Discrete-Event Simulator    │ Virtual time, integer paise, 6 cases  │
│ 2. Non-Negotiable Invariants   │ 5 strict mathematical ledger checks   │
│ 3. Dual Execution Policies     │ Baseline unshielded vs. Guarded rules │
│ 4. Counterexample Minimizer    │ Delta debugging (1-minimality engine) │
│ 5. Learned Prioritizer         │ 32-tree Random Forest compiled to JSON│
│ 6. Bring-Your-Own-Agent SDK    │ Async evaluation adapter with tools   │
│ 7. Interactive FlowCanvas UI   │ 3-lane canvas, scrubber & D1 history  │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

### Implementation 1: Discrete-Event Payment Simulator Engine

*Source file:* [`lib/simulator.mjs`](lib/simulator.mjs)

The simulator models virtual time in integer seconds and currency in **integer paise** ($1 \text{ INR} = 100 \text{ paise}$), completely avoiding floating-point rounding errors common in IEEE-754 calculations.

#### The 6 Failure Scenario Families

| Family Code | UI Name | Simulated Real-World Vulnerability |
| :--- | :--- | :--- |
| `late_capture` | **Late Confirmation** | Customer checkout drops; bank completes late capture at $t_{\text{delay}}$; webhook arrives at $t_{\text{delay}}+5$; agent retries at $t_{\text{retry}}$. Tests duplicate charge protection. |
| `duplicate_webhook` | **Repeated Webhook** | Payment gateway redelivers identical webhook events multiple times ($n$ copies). Tests agent message deduplication and idempotency keys. |
| `consent_revoked` | **Consent Withdrawn** | Customer revokes auto-debit consent at $t_{\text{revoke}}$ before the agent's scheduled recovery at $t_{\text{retry}}$. Tests real-time mandate compliance. |
| `budget_race` | **Concurrent Spending** | Multiple intents ($A$ & $B$) concurrently execute against a shared mandate budget using stale initial balance snapshots. Tests logical concurrency limits. |
| `refund_replay` | **Refund Replay** | Repeated or concurrent refund requests triggered for the same order. Tests whether refunds exceed cumulative captured funds. |
| `clean_control` | **Clean Recovery** | Baseline valid payment failure with valid recovery permissions. Tests **liveness** (ensures a policy that naively holds every action fails). |

#### Deterministic Scenario Generation

Scenarios are pseudo-randomly generated from an explicit 32-bit seed using a high-entropy Mulberry32-derived generator:

$$\text{amount} = (500 + \lfloor 9500 \cdot r_1 \rfloor) \times 100 \quad (\text{paise: } ₹500 \text{ to } ₹10,000)$$

$$\text{budget} = \text{round}(\text{amount} \times (1.05 + 0.6 \cdot r_2))$$

---

### Implementation 2: The 5 Non-Negotiable Money Invariants

*Source file:* [`lib/simulator.mjs:checks`](lib/simulator.mjs#L4)

Unlike natural language evaluators or LLM-as-a-judge patterns, Reprise enforces deterministic, mathematical ledger invariants after every single event:

```javascript
export const checks = {
  double_charge: 'One purchase, one charge',
  consent:       'Consent before action',
  budget:        'Spend within the mandate',
  refund:        'Refund within captured funds',
  progress:      'Valid recovery completes'
};
```

1. **One Purchase, One Charge (`double_charge`)**:
   $$\forall k \in \{A, B\}: \quad \text{captured}_k \le \text{amount}$$
   Total captured amount on the bank ledger for purchase intent $k$ must never exceed the original checkout value.
2. **Consent Before Action (`consent`)**:
   $$\text{action} = \text{'recover'} \implies \text{activeConsent}(t_{\text{action}}) = \text{true}$$
   An agent must never trigger an account debit after the user has revoked recovery consent.
3. **Spend Within the Mandate (`budget`)**:
   $$\sum \text{spent} \le \text{mandateBudget}$$
   Cumulative debits authorized across intents must never exceed the pre-approved mandate allowance.
4. **Refund Within Captured Funds (`refund`)**:
   $$\forall k \in \{A, B\}: \quad \text{refunded}_k \le \text{captured}_k$$
   Total money refunded back to the payment method must never exceed the net amount successfully settled.
5. **Valid Recovery Completes / Liveness (`progress`)**:
   $$\text{family} = \text{'clean\_control'} \implies \text{captured}_A = \text{amount}$$
   A trivial policy that blocks/holds every transaction to avoid risk is **strictly rejected**. Safe payments must complete.

---

### Implementation 3: Guarded Invariant Policy vs. Unshielded Reference

*Source file:* [`lib/simulator.mjs:run`](lib/simulator.mjs#L18-L50)

Reprise executes every scenario in parallel across two distinct policies:

```
                  ┌────────────────────────────────────────┐
                  │       EVENT: recovery.request          │
                  └───────────────────┬────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      [Unshielded Reference]                      [Guarded Invariant]
  Does merchant see capture >= amount?       1. Has event ID been seen? (Idempotency)
                 │                           2. Is customer consent active?
          ┌──────┴──────┐                    3. Is original payment terminal? (Settlement)
          ▼             ▼                    4. Does authoritative gateway show capture?
      [HOLD]        [RECOVER]                5. Would recovery exceed remaining budget?
  (Stale view   (Fires debit,                               │
   misses late   causes double                      ┌───────┴───────┐
   bank auth)    charge breach)                     ▼               ▼
                                                 [HOLD]         [RECOVER]
                                             (Safely paused) (Clean capture)
```

#### Guard Interventions Comparison Table

| Check Type | Unshielded Reference Policy | Guarded Invariant Policy |
| :--- | :--- | :--- |
| **Idempotency** | Ignores event IDs; processes every duplicate webhook | Tracks processed event IDs in `seen` set; drops duplicates |
| **Settlement** | Checks merchant-observed cache (`observed[k]`) | Enforces terminal state check: `terminal[k] === true` |
| **Gateway State** | Unaware of background bank capture | Reads authoritative gateway capture before taking action |
| **Consent** | Ignores downstream consent revocation | Verifies `state.consent === true` at execution instant |
| **Budget** | Relies on stale payload budget snapshot (`e.snapshot`) | Reads authoritative live cumulative spend (`state.spent`) |
| **Refunds** | Issues refund regardless of captured balance | Checks `refunded[k] + amount <= captured[k]` |

---

### Implementation 4: Automated Counterexample Minimization (Delta Debugging)

*Source file:* [`lib/simulator.mjs:minimize`](lib/simulator.mjs#L51)

When a complex scenario breaches an invariant, the raw event trace often contains unrelated telemetry heartbeats, irrelevant delays, and extraneous intents. Reprise includes an automated **Delta Debugging** engine that computes a **1-minimal counterexample**:

<div align="center">
  <img src="docs/assets/counterexample-reduction.svg" alt="Counterexample Reduction Flow" width="100%" />
</div>

#### Minimization Algorithm

```javascript
export function minimize(s, code) {
  let events = makeEvents(s);
  let attempts = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < events.length; i++) {
      let candidate = events.filter((_, j) => j !== i);
      attempts++;
      // Check if invariant breach still reproduces without event i
      if (run(s, false, candidate).violations.some(v => v.code === code)) {
        events = candidate;
        changed = true;
        break; // Restart deletion pass on newly reduced sequence
      }
    }
  }
  return { events, attempts, originalCount: makeEvents(s).length, result: run(s, false, events) };
}
```

- **Guaranteed 1-Minimal Property:** For every event $e \in \text{events}_{\text{reduced}}$, the sequence $\text{events}_{\text{reduced}} \setminus \{e\}$ passes without triggering invariant `code`.
- **Immediate RCA Value:** Developers can export the reduced trace as a lightweight, 3-event JSON regression test.

---

### Implementation 5: Learned Scenario Prioritizer (Machine Learning Search)

*Source files:* [`lib/search.ts`](lib/search.ts), [`lib/model/search.json`](lib/model/search.json), [`scripts/ml/`](scripts/ml/)

Running extensive simulation suites is computationally expensive. Reprise trains a **32-tree Random Forest classifier** to predict which scenarios will trigger invariant breaches before executing them.

<div align="center">
  <img src="docs/assets/ml-search-benchmark.svg" alt="ML Search Benchmark" width="100%" />
</div>

#### 1. Feature Engineering (9 Normalized Signals)

```javascript
export function features(s) {
  return [
    ...families.map(f => +(s.family === f)), // 0-5: One-hot encoded scenario family
    s.delay / 16,                            // 6: Normalized gateway delay
    s.retryAt / 12,                          // 7: Normalized agent retry timing
    s.copies / 4,                            // 8: Duplicate webhook copy count
    s.revokeAt / 14,                         // 9: Consent withdrawal timing
    s.budget / s.amount,                     // 10: Mandate budget ratio
    s.noise / 5,                             // 11: Heartbeat noise frequency
    (s.delay - s.retryAt) / 16,              // 12: Delay-to-retry difference (race window)
    (s.revokeAt - s.retryAt) / 14            // 13: Revoke-to-retry difference
  ];
}
```

#### 2. Zero-Dependency Edge Inference

The trained scikit-learn model is converted into parallel tree arrays in JSON. The Cloudflare Worker traverses trees with zero Python:

```typescript
export function score(s: any): number {
  const x = features(s);
  return model.trees.reduce((sum, t) => {
    let n = 0;
    while (t.left[n] !== -1) {
      n = x[t.feature[n]] <= t.threshold[n] ? t.left[n] : t.right[n];
    }
    return sum + t.p[n];
  }, 0) / model.trees.length;
}
```

#### 3. Benchmark Results & Hybrid Scheduling

At an evaluation budget of 200 cases:
- **Learned Ranking:** Discovered **200/200 failures** (100% precision).
- **Uniform Random Sampling:** Discovered only **106.1 failures** on average (95% CI: [93.0, 120.0]).
- **Hybrid Scheduler:** In the web UI, candidate pools are ranked 4x their size; **80%** are selected via model ranking and **20%** via uniform exploration to prevent model blind spots.

---

### Implementation 6: Bring-Your-Own-Agent Adapter SDK

*Source files:* [`lib/agent-sdk.mjs`](lib/agent-sdk.mjs), [`scripts/evaluate-agent.mjs`](scripts/evaluate-agent.mjs)

You can plug any custom LLM or rule-based agent into Reprise using the local asynchronous agent evaluation adapter:

```javascript
import { evaluateAgent } from './lib/agent-sdk.mjs';

// The agent interface
export async function decide(observation, tools) {
  // 1. Inspect authoritative simulated gateway state (read-only tool)
  const status = await tools.lookupPayment(observation.event.intent);

  // 2. Evaluate business logic & return decision
  if (observation.event.type === 'recovery.request') {
    if (!observation.consent) return 'hold';
    if (!status.terminal || status.captured >= observation.amount) return 'hold';
    if (observation.spent + observation.amount > observation.budget) return 'hold';
    return 'execute';
  }
  return 'hold';
}
```

#### Sandbox Protections
- **Zero Real Money:** The agent is never passed a live payment API tool.
- **Read-Only Gateway Query:** `tools.lookupPayment(intent)` allows querying whether an original intent was captured without modifying ledger state.
- **Strict 15-Second Timeout:** If an agent stalls or LLM inference hangs, the evaluator rejects with `Error('Agent exceeded the 15-second decision limit')`.
- **Strict Binary Contract:** `decide()` must return either `'execute'` or `'hold'`. Any other string rejects execution.

#### Live Agent Evaluation Benchmark

We benchmarked two agents across 60 deterministic test cases (`seed: 42017`):

```bash
# Evaluate an unshielded optimistic agent
node scripts/evaluate-agent.mjs ./examples/optimistic-agent.mjs 42017 60

# Evaluate a guarded agent
node scripts/evaluate-agent.mjs ./examples/guarded-agent.mjs 42017 60
```

| Metric | Optimistic Agent ([`optimistic-agent.mjs`](examples/optimistic-agent.mjs)) | Guarded Agent ([`guarded-agent.mjs`](examples/guarded-agent.mjs)) |
| :--- | :--- | :--- |
| **Total Test Cases** | 60 | 60 |
| **Passed Cases** | 32 (53.3%) | **60 (100.0%)** |
| **Failed Cases** | **28 (46.7%)** | **0 (0.0%)** |
| **Actions Safely Blocked** | 9 | **44** |
| **Simulated Exposure** | **₹1,50,983.90** | **₹0.00** |
| **Double Charge Breaches** | **10** | **0** |
| **Consent Breaches** | **3** | **0** |
| **Mandate Budget Breaches**| **10** | **0** |
| **Over-Refund Breaches** | **5** | **0** |
| **Liveness Check** | Passed (clean recoveries completed) | Passed (clean recoveries completed) |

---

### Implementation 7: Interactive Canvas & Virtual Time Scrubber

*Source files:* [`app/components/FlowCanvas.tsx`](app/components/FlowCanvas.tsx), [`app/page.tsx`](app/page.tsx)

<div align="center">
  <img src="docs/assets/flow-visualizer-mockup.svg" alt="Reprise Flow Visualizer Mockup" width="100%" />
</div>

The Web UI features a custom responsive HTML5 Canvas that animates transactions across three distinct lanes:
- **LANE 1 (EVENTS):** Inbound webhooks, checkout drops, and customer actions.
- **LANE 2 (AGENT):** Autonomous agent decision point (`recover` vs `hold`).
- **LANE 3 (LEDGER):** Authoritative bank settlement events and ledger balance.

#### Canvas Engineering Features
- **Dynamic Cubic Bézier Paths:** Computes smooth cubic curves between event nodes and ledger updates.
- **Traveling Pulse Packets:** Visualizes money/event transmission across lanes using high-performance `requestAnimationFrame`.
- **Accessible Fallback:** Fully respects `prefers-reduced-motion` and provides an accessible text-based event log and ledger breakdown alongside the visual canvas.
- **Interactive Scrubber:** Scrub through virtual time ($t=0\text{s}$ to end) with instant recalculation of intermediate bank ledger balances.

---

## 📸 Working Prototype Screenshots & Visual Tour

All screenshots below are captured directly from the **working prototype** (powered by React 19, Vinext, Cloudflare Workers, and Cloudflare D1 edge database):

---

### 1. Live Production Lab & Landing Experience

The live web application serves a high-performance edge interface. Clicking **"Enter the lab"** boots the virtual time environment with zero backend spin-up delay.

<div align="center">
  <img src="docs/assets/screenshots/deployed-landing-hero.png" alt="Reprise Live Landing Experience" width="100%" />
</div>

---

### 2. The Replay Room: Unshielded Failure & Double Charge Breach

In the default **Reference Policy**, an autonomous recovery agent wakes up while the payment gateway's late authorization is still in-flight. The agent triggers an unsynchronized retry charge. The live bank ledger instantly detects the violation: **₹7,436 captured for a ₹3,718 purchase**, raising the `One purchase, one charge` invariant breach alert. Notice the counterexample reducer below: **6 events $\to$ 2 events** still fail after 8 deletion passes!

<div align="center">
  <img src="docs/assets/screenshots/deployed-replay-room.png" alt="Reprise Replay Room - Unshielded Failure" width="100%" />
</div>

---

### 3. Guarded Policy Intervention: Action Safely Held

Toggling **With safeguards** activates real-time settlement checks. The guarded policy detects that the original payment attempt has not reached terminal status (`terminal === false`). The action is safely marked **`HOLD`** (shown in green), preventing the duplicate debit. The bank ledger records exactly **₹3,718** captured, and all ledger invariants pass.

<div align="center">
  <img src="docs/assets/screenshots/deployed-guarded-room.png" alt="Reprise Replay Room - Guarded Policy Intervention" width="100%" />
</div>

---

### 4. The Experiment Suite: 180-Case Batch Failure Mosaic & Exposure Matrix

Running an experiment batch executes hundreds of concurrent scenarios under virtual time directly against Cloudflare D1 (*"Run complete. Results saved."*). The interactive **Failure Mosaic** highlights reference failures in peach/red and passing cases in green. The KPI header computes cumulative metrics: **158 reference failures reduced to 0 after safeguards**, exposing **₹6.9L** in simulated invariant breach risk across a 180-case batch.

<div align="center">
  <img src="docs/assets/screenshots/deployed-experiment-suite.png" alt="Reprise Experiment Suite - 180-Case Mosaic" width="100%" />
</div>

---

### 5. Model & Evidence: 32-Tree Random Forest Prioritizer

The **Model & evidence** dashboard surfaces complete model provenance and empirical benchmarks. At a search budget of 200 evaluations, the learned Random Forest prioritizer captures **200/200 failures** (100% precision) compared to **106.1 failures** for random sampling. All 32 trees run in client/edge JavaScript with zero Python dependencies.

<div align="center">
  <img src="docs/assets/screenshots/deployed-model-evidence.png" alt="Reprise Model and Evidence Dashboard" width="100%" />
</div>

---

### 6. Bring Your Own Sequence: Custom JSON Trace Importer

Clicking the upload icon opens the **Custom Trace Modal**. Engineers can paste normalized JSON transaction logs from real production incidents or staging testbeds to replay edge cases through both unshielded and guarded policies.

<div align="center">
  <img src="docs/assets/screenshots/deployed-custom-trace-modal.png" alt="Reprise Custom Trace Modal" width="100%" />
</div>

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: `v22.13.0` or higher
- **npm**: `v10.0.0` or higher
- *(Optional for ML Retraining)*: **Python 3.10+** with `numpy` and `scikit-learn`

### 1. Installation & Web Server

```bash
# Clone the repository
git clone https://github.com/your-username/reprise.git
cd reprise

# Install dependencies
npm ci

# Start local development server (Vite + Vinext)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to explore the Test Lab.

### 2. Run Simulator Test Suite

The simulator engine has zero external dependencies and runs directly through Node's built-in test runner:

```bash
node --test tests/simulator.test.mjs
```

**Test Output:**
```
TAP version 13
ok 1 - same seed produces identical events and ledger
ok 2 - safeguards preserve invariants across 6000 seeded cases
ok 3 - valid recoveries are not suppressed by safeguards
ok 4 - late bank success cannot create a second guarded charge
ok 5 - replayed refunds never exceed captured funds with guards
ok 6 - stale budget snapshots cannot authorize both guarded actions
ok 7 - counterexample retains target failure and is deletion-minimal
ok 8 - async agent can query simulated state and complete a clean recovery
ok 9 - hold-everything agent fails the progress check
ok 10 - agent adapter rejects invalid decisions
1..10
# tests 10, pass 10, fail 0
```

### 3. Evaluate Your Own Agent

```bash
# Syntax: node scripts/evaluate-agent.mjs <path-to-agent.mjs> <seed> <count>
node scripts/evaluate-agent.mjs ./examples/guarded-agent.mjs 42017 60
```

This writes a complete benchmark report to `agent-evaluation.json`.

### 4. Reproduce Machine Learning Training

```bash
# 1. Generate 8,000 training traces & 2,000 held-out test traces
node scripts/ml/generate.mjs

# 2. Train 32-tree Random Forest and export JSON model
python scripts/ml/train-search.py
```

The script trains the forest using scikit-learn, verifies ROC-AUC and Brier scores, and writes the compiled decision tree arrays directly into [`lib/model/search.json`](lib/model/search.json).

---

## 📥 Custom Trace Import Specification

You can import custom production incidents or synthetic edge cases into Reprise via the web UI or API (`POST /api/workspace` with `operation: "trace"`).

### JSON Schema

```json
{
  "amount": 500000,
  "budget": 600000,
  "events": [
    { "at": 0, "type": "checkout.failed", "id": "evt-0", "intent": "A" },
    { "at": 3, "type": "gateway.captured", "id": "evt-1", "intent": "A" },
    { "at": 5, "type": "recovery.request", "id": "evt-2", "intent": "A" },
    { "at": 8, "type": "webhook.captured", "id": "evt-3", "intent": "A" }
  ]
}
```

- `amount`: Transaction value in integer paise ($₹5,000.00 = 500000$).
- `budget`: Mandate budget limit in integer paise ($₹6,000.00 = 600000$).
- `events[].at`: Virtual timestamp in seconds (automatically sorted ascending).
- `events[].type`: Supported event types:
  - `checkout.failed`: User checkout dropped / failed.
  - `gateway.captured`: Authoritative gateway confirmation.
  - `gateway.failed`: Terminal payment failure.
  - `webhook.captured`: Merchant notification receipt.
  - `consent.revoked`: Customer revokes auto-debit permissions.
  - `recovery.request`: Agent recovery / retry trigger.
  - `refund.request`: Customer or system refund trigger.
  - `telemetry.heartbeat`: Background noise (pruned by delta debugging).

---

## 🔬 Research Context & Prior Art

Reprise was developed for the **Razorpay AI Buildathon (Open Track)**. We benchmarked our approach against prior art across the software testing, LLM evaluation, and fintech ecosystem:

| Tool / Framework | Primary Focus | How Reprise Differs |
| :--- | :--- | :--- |
| **Antithesis** | Deterministic hypervisor-level simulation for distributed systems | Reprise is a lightweight, zero-setup, payment-specific discrete-event simulator running directly in the browser and edge workers. |
| **Galileo / Patronus** | LLM prompt/response evaluation, hallucinations, and safety guards | Reprise focuses on the **physical state changes and money movements** caused by agent tool calls, rather than prompt semantics. |
| **Sierra $\tau$-bench** | Benchmark for conversational agents following corporate policy | Reprise isolates asynchronous payment race conditions, ledger invariants, and dual-state divergence. |
| **Razorpay Recon** | Enterprise reconciliation for settlement exceptions | Reprise is a pre-deployment wind tunnel to detect flaws in recovery agents *before* transactions are committed. |

### What Reprise Is and Is NOT

- **What is NOT Novel:** Deterministic simulation, fault injection, delta debugging, and Random Forest classification are well-established computer science techniques.
- **Reprise's Contribution:** The focused, developer-friendly synthesis of these techniques specifically tailored to **autonomous payment agents**, featuring integer paise ledgers, automated 1-minimal counterexample reduction, zero-dependency edge inference, and non-negotiable money invariant checking.
- **Honest Limitations:**
  - Reprise models a simplified payment gateway lifecycle; it does not emulate every nuance of the full Razorpay API.
  - The high classification scores of the ML model ($ROC-AUC = 1.0$) reflect the deterministic nature of simulated boundaries; they do not represent universal performance against unseen external payment gateways.

---

## 📁 Repository Structure

```
reprise/
├── app/                              # Next.js / Vinext application
│   ├── api/workspace/route.ts        # Edge API: batch simulations, inspection, trace runner
│   ├── components/FlowCanvas.tsx     # High-performance 3-lane HTML5 event canvas
│   ├── globals.css                   # Custom responsive dark-theme design system
│   ├── layout.tsx                    # Root application layout
│   └── page.tsx                      # Main dashboard: Test Lab, History, Model, Research
├── db/                               # Database schemas and D1 connection bindings
│   └── schema.ts                     # Drizzle ORM schema for simulation_runs table
├── docs/                             # Deep-dive documentation & static assets
│   ├── assets/                       # SVG architecture and benchmark diagrams
│   ├── ARCHITECTURE.md               # Technical specification and state model
│   ├── PITCH.md                      # 5-minute presentation script and judge Q&A
│   ├── RESEARCH.md                   # Buildathon problem analysis & competitor breakdown
│   ├── search-model-report.json      # Complete ML model evaluation card
│   └── SUBMISSION.md                 # Contest submission checklist
├── drizzle/                          # SQL migrations for Cloudflare D1
├── examples/                         # Reference agent implementations
│   ├── guarded-agent.mjs             # Robust reference agent with gateway status checks
│   └── optimistic-agent.mjs          # Flawed unshielded agent (breaches invariants)
├── lib/                              # Core simulation engine & model inference
│   ├── agent-sdk.mjs                 # Async agent sandbox adapter (evaluateAgent)
│   ├── model/search.json             # Compiled 32-tree Random Forest decision arrays
│   ├── search.ts                     # Sub-millisecond Edge inference tree traversal
│   └── simulator.mjs                 # Discrete-event engine, 6 families, 5 invariants, minimizer
├── public/                           # Public assets, icons, and diagrams
├── scripts/                          # Automation & evaluation CLI tools
│   ├── evaluate-agent.mjs            # Standalone CLI for running test batches on agents
│   └── ml/                           # ML training pipeline (generate.mjs, train-search.py)
├── tests/                            # Automated domain tests
│   └── simulator.test.mjs            # 10 comprehensive domain invariant tests
├── package.json                      # Project manifest and scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite / Cloudflare configuration
└── wrangler.jsonc                    # Cloudflare Worker & D1 database bindings
```

---

## ⚖️ Attribution

Created with intellectual honesty and rigorous software engineering for the Razorpay AI Buildathon (Open Track).
