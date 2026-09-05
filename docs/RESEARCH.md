# Research and idea selection

Research date: 5 September 2026. The recommendation is a judgment based on public material, not a claim that no participant or company has built something similar.

## Official brief

[Razorpay AI Buildathon](https://razorpay.com/buildathon/) is a student-only hiring program with five tracks. Submission asks for public code, architecture and a five-minute pitch. Open Track requires a real problem, a functioning product, meaningful AI and value evidence. The page describes a Bangalore internship starting in September. The application form could not be read in this session; the official landing page did not expose a verified deadline or year-of-study restriction. Confirm both before relying on eligibility or timing. Do not infer first-year eligibility from “students only.”

## Candidates examined

| Direction | Existing overlap found | Decision |
|---|---|---|
| Payment recovery assistant | Razorpay Intelligent Payment Retry and Agent Studio subscription recovery/cart conversion | Rejected as the main pitch; intent reconstruction alone did not justify novelty |
| Finance reconciliation agent | Razorpay Recon and its case-resolution workflow | Rejected as the main pitch without proprietary exception data |
| Dispute evidence and deductions agent | Chargeflow and HighRadius already automate substantial portions | Rejected without a narrow, validated underserved merchant workflow |
| Conversational agent checkout | Razorpay Agentic Payments and AP2 | Rejected as a generic integration project |
| Payment-agent failure simulation | Antithesis, Galileo, Patronus and agent benchmarks are substantial prior art | Selected only as a narrow executable contribution: payment state divergence, money invariants, replay, reduction and learned scenario prioritization |

## Why Reprise is the current recommendation

It offers a five-minute demonstration with a visible cause and a measurable outcome. A late gateway capture and a recovery can both succeed while the merchant's webhook view is stale. The prototype reproduces the duplicate charge, reduces the event sequence, and reruns the same sequence with state checks. It also tests refund replay, consent changes, stale concurrent budget decisions and clean progress.

Its evidence is software execution, so no invented merchant ROI or fabricated fraud dataset is necessary. The learned search is a measured prioritization component, not the source of truth for correctness. This is a plausible contest contribution, not proof of commercial product-market fit.

## What is NOT novel

Deterministic simulation, fault injection, idempotency, ledger limits, agent evaluation, random forests and delta debugging are established ideas. Reprise's proposed differentiation is their focused, accessible combination for payment-agent workflows. Search cannot establish the absence of competing implementations. A narrow prototype does not match the full capabilities of established testing vendors.

## Primary sources

1. [Buildathon brief](https://razorpay.com/buildathon/): track requirements and submission format.
2. [Razorpay Intelligent Payment Retry](https://razorpay.com/blog/razorpay-intelligent-payment-retry/): existing next-best-action retry product.
3. [Razorpay Agent Studio](https://razorpay.com/agent-studio/): subscription recovery, cart conversion and other operational agents.
4. [Razorpay Recon launch](https://razorpay.com/newsroom/razorpay-pos-launches-industry-first-ai-powered-razorpay-recon-to-automate-reconciliation-for-businesses-boosting-financial-operations-efficiency-by-80/): existing reconciliation offering. Vendor improvement claims were not independently verified or used as our measurements.
5. [Razorpay late-authorisation handling](https://razorpay.com/docs/payments/payments/late-authorisation/handle/): motivation for state changes after initial failure.
6. [Razorpay webhook FAQs](https://razorpay.com/docs/webhooks/faqs/): event IDs and repeat delivery handling. Some documentation routes returned unsupported markdown through the browsing interface; indexed official excerpts were used where necessary.
7. [Razorpay Agentic Payments](https://razorpay.com/agentic-payments/): existing agent commerce products.
8. [AP2](https://ap2-protocol.org/): secure authorization for agent payments; Reprise does not implement or claim AP2 compliance.
9. [HighRadius deductions](https://www.highradius.com/product/deductions-management-automation-software/): prior art in deductions and dispute workflows.
10. [Chargeflow](https://www.chargeflow.io/): existing dispute management and prevention.
11. [Antithesis deterministic simulation](https://antithesis.com/docs/resources/deterministic_simulation_testing/): prior art for reproducible failure exploration.
12. [Galileo](https://galileo.ai/): existing agent evaluation and observability.
13. [Patronus agent evaluation](https://www.patronus.ai/agents): trajectory analysis and replay prior art.
14. [Sierra τ-bench](https://sierra.ai/blog/benchmarking-ai-agents): policy-aware tool-agent evaluation.
15. [Anthropic evaluation engineering](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): deterministic outcome checks and useful failure evidence.

## What would increase confidence next

Get one merchant engineer to supply a sanitized incident timeline, test an independently written agent, and compare the learned scheduler against an explicit risk heuristic and random sampling under equal budgets. Keep one failure family out of training. Record where the simulator disagrees with Razorpay test-mode behavior. These steps matter more than adding more dashboard features or claiming a winning probability.
