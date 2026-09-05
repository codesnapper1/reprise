# Five-minute pitch and demo

Use the Open Track. Say “prototype” and “simulated exposure.” Do not say “we prevented real losses,” “world first,” or “guaranteed safe.”

## 0:00–0:35 — Problem

“Payment agents are starting to execute actions, not just answer questions. But a successful tool call can still leave the customer charged twice. The hard part is the time between a request, a bank confirmation and the webhook reaching the merchant. Reprise is a wind tunnel for those moments.”

## 0:35–1:35 — Show the failure

Open the default late-confirmation scenario. Start the replay. Point out the initial failure, the recovery request and the bank's capture. Show the total captured exceeding the value of one purchase. Read the failed rule. Explain that the reference policy is intentionally flawed; you are demonstrating the evaluator, not accusing a named LLM of failing.

## 1:35–2:10 — Make the evidence small

Select “Replay reduced trace.” Explain that Reprise removes events and reruns the workflow, retaining a deletion only if the same rule still breaks. The final trace is deletion-minimal, not a magic natural-language explanation. Export the JSON.

## 2:10–2:50 — Test the safeguard

Switch to “With safeguards.” Inspect the held action and bank ledger. Then choose Clean recovery to show a valid payment still completes. “A system that refuses everything is not correct either.”

## 2:50–3:40 — Batch evidence

Run 180 cases. Show failures before and after guards, inspect one refund replay, then show all five rule counts. Call the amount “simulated rule-breach exposure,” not recovered revenue. Explain that scenario selection mixes learned priority with exploration.

## 3:40–4:20 — Meaningful AI

Show Model & evidence: 8,000 executed training traces, 2,000 held-out cases, 32 trees. At a 200-case budget pure ranking found 200 reference-policy failures versus a random mean of 106.1. “These results cover this simple reference policy. We have not established performance on unseen agents. AI chooses where to look; code decides whether money rules were broken.”

## 4:20–5:00 — Product value and honesty

Show imported traces and the local async agent adapter in the public repository. “Our focused contribution is a repeatable payment-failure experiment that an engineer can inspect, reduce and keep as a regression. Our next validation is an independently written agent and a sanitized merchant incident, checked against Razorpay test mode.”

## Questions judges may ask

**Isn't this just unit testing?** It includes systematic scenario variation, two simultaneous views of transaction state, learned prioritization and automatic failing-trace reduction. Unit tests remain useful and are included. We are not claiming these testing techniques are new.

**Why not Antithesis or Galileo?** Those are strong established products. Our narrower prototype packages specific payment-state checks into a small accessible replay workflow. We have not conducted a head-to-head product comparison.

**Is AI necessary?** Correctness checks should be deterministic. The learned component prioritizes a limited execution budget. We measured it against random selection, but must still compare it with a strong hand-built risk heuristic and test unknown agents.

**Where is Razorpay?** The documented webhook and late-authorisation behaviors motivate the scenarios. v1 does not call Razorpay or emulate its entire API. It belongs in Open Track, not a claim of completing the test-mode-commerce track.

**Why are the metrics so high?** Because the included policy and scenario family boundaries are simple and deterministic. New seeds do not equal unseen production behavior.

**Can it test my agent?** Yes, locally through the async decide(observation, tools) adapter, with a limited execute/hold action contract. Hosted import accepts event JSON, not arbitrary agent code.

**Is this safe for production?** No. It is a development testing prototype. Test passing is scoped to defined scenarios and rules, not proof of safety.
