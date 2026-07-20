# identical_pairs_repr — closest REPRESENTATIVE eval↔train RLM trajectory per case

Exactly **9 samples** — one closest eval↔train trajectory pair per RLM case (6 length-gen tasks +
3 strategy-gen panels). Each is **representative**: both sides reward>0.5, trained checkpoints, and
**eval checkpoint ≥ train checkpoint** (the model could only have trained on that sample *before*
producing the eval).

## Method
- **Global search** (`scripts/global_search.py`): every eval traj (all checkpoints) vs every positive-
  reward train traj (all checkpoints, `train.step ≤ eval.step`); length-gen pools BOTH hints+nohints RLM
  runs; ranked by token-LCS on the behaviour view (REPL stdout stripped, so the match reflects the
  agent's actions not per-instance data).
- **Displayed examples are RAW** (`scripts/save_raw_pairs.py`): `eval.txt`/`train.txt` show the full raw
  trajectory — assistant turns + `REPL output:` stdout (truncated as in the rollout) + `Turn N/M:` nudges.
  `pair.json` carries `sims_behaviour_view` (selection score) and `sims_raw` (recomputed on raw text).
- **Sub-agent verification**: turn-by-turn line-up + 0-100 score (`<dir>/verdict.md`); strategy/decomposition
  confirmed identical for all 9 (`DECOMPOSITION.md`).

## Results (token_lcs = behaviour-view selection score; all satisfy eval_step ≥ train_step)

| case | verdict | lined-up | token_lcs | token_lev | eval@step (r/turns) | train@step (r/turns) | dir |
|---|---|---|---|---|---|---|---|
| **OOLONG** | NEARLY_IDENTICAL | 93/100 | 0.824 | 0.723 | @131 (r1.00/8) | @118 (r1.00/8) | `OOLONG/` |
| **LongBenchPro** | NEARLY_IDENTICAL | 95/100 | 0.767 | 0.665 | @131 (r1.00/4) | @43 (r1.00/4) | `LongBenchPro/` |
| **GraphWalks** | NEARLY_IDENTICAL | 93/100 | 0.621 | 0.476 | @121 (r1.00/6) | @118 (r1.00/6) | `GraphWalks/` |
| **OOLONG-Pairs** | MOSTLY_SAME | 84/100 | 0.628 | 0.469 | @91 (r0.91/6) | @54 (r0.81/6) | `OOLONG-Pairs/` |
| **AdaLEval-BestAnswer** | SAME_STRATEGY | 84/100 | 0.564 | 0.413 | @111 (r1.00/6) | @87 (r1.00/7) | `AdaLEval-BestAnswer/` |
| **MRCR** | SAME_STRATEGY | 82/100 | 0.667 | 0.518 | @61 (r1.00/7) | @43 (r1.00/5) | `MRCR/` |
| **SG-OBLIQ-twitter-wildchat** | SAME_STRATEGY | 86/100 | 0.599 | 0.470 | @181 (r1.00/6) | @172 (r0.63/6) | `SG-OBLIQ-twitter-wildchat/` |
| **SG-OOLONG-trec-spam** | NEARLY_IDENTICAL | 92/100 | 0.514 | 0.360 | @161 (r1.00/5) | @150 (r1.00/5) | `SG-OOLONG-trec-spam/` |
| **SG-OBLIQ-writing-math** | NEARLY_IDENTICAL | 93/100 | 0.494 | 0.314 | @281 (r1.00/5) | @266 (r0.57/5) | `SG-OBLIQ-writing-math/` |

## Per-case pair identities

- **OOLONG** (NEARLY_IDENTICAL, 93/100) — `lengthgen-oolong-nohints/eval@131/23` ↔ `lengthgen-oolong-nohints/train@118/57`
- **LongBenchPro** (NEARLY_IDENTICAL, 95/100) — `lengthgen-longbenchpro-nohint/eval@131/100` ↔ `lengthgen-longbenchpro-nohint/train@43/0`
- **GraphWalks** (NEARLY_IDENTICAL, 93/100) — `lengthgen-graphwalks/eval@121/8` ↔ `lengthgen-graphwalks/train@118/29`
- **OOLONG-Pairs** (MOSTLY_SAME, 84/100) — `lengthgen-oolong-pairs-cap1k-iter30-nohints/eval@91/16` ↔ `lengthgen-oolong-pairs-cap1k-iter30-nohints/train@54/36`
- **AdaLEval-BestAnswer** (SAME_STRATEGY, 84/100) — `lengthgen-adaleval-bestanswer-8k-to-128k/eval@111/45` ↔ `lengthgen-adaleval-bestanswer-8k-to-128k/train@87/25`
- **MRCR** (SAME_STRATEGY, 82/100) — `lengthgen-mrcr-nohints/eval@61/17` ↔ `lengthgen-mrcr-nohints/train@43/32`
- **SG-OBLIQ-twitter-wildchat** (SAME_STRATEGY, 86/100) — `strategygen-obliq-twitter-to-wildchat/eval@181/0` ↔ `strategygen-obliq-twitter-to-wildchat/train@172/60`
- **SG-OOLONG-trec-spam** (NEARLY_IDENTICAL, 92/100) — `strategygen-oolong-trec32k-to-spam132k/eval@161/25` ↔ `strategygen-oolong-trec32k-to-spam132k/train@150/0`
- **SG-OBLIQ-writing-math** (NEARLY_IDENTICAL, 93/100) — `strategygen-obliq-writing-to-math/eval@281/20` ↔ `strategygen-obliq-writing-to-math/train@266/50`

## Notes
- **GraphWalks** is a genuine edge-parse→reverse-adjacency→lookup solve (an earlier scan-loop candidate was discarded).
- **SG-OOLONG-trec-spam** is a length-matched 5-turn pair (an earlier 11-vs-4 mismatch was discarded).
- **SG-OBLIQ-writing-math** is a length-matched 5-turn inspect→parse→batch-score→sort→submit pair (an earlier 13-vs-6-turn debug-heavy pair was discarded).

## Similarity figures (`../../plots/`) — causal (train at/before eval), TF-IDF dropped
- `similarity_lengthgen.png` — 5 length-gen tasks, RLM-hints vs base Transformer (MRCRv2 excluded).
- `similarity_strategygen.png` — 3 strategy-gen panels, RLM vs base Transformer.
- `similarity_combined.png` — all 8 panels (2×4). y = Similarity to Nearest Prior Train Sample (1 = identical).
  Script `scripts/plot_similarity.py`; data `../distance/<slug>/` (regen with `scripts/run_distance.py`).

