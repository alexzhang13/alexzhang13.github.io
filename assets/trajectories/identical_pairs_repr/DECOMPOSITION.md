# Strategy / decomposition confirmation — all 9 representative pairs

One sub-agent per case independently wrote the ordered sub-step decomposition of BOTH
the eval and the train trajectory (ignoring task constants), aligned them, and judged whether
the *strategy shape* is the same. All 9 pairs satisfy eval_step ≥ train_step (see README).

**Result: 9/9 share the same task decomposition** — 5 turn-for-turn identical, 4 identical-up-to
incidental probe/verify/debug turns. **0/9 had a different or reordered conceptual pipeline.**

| case | verdict | the shared decomposition | the only difference (if any) |
|---|---|---|---|
| OOLONG | DECOMPOSITION_IDENTICAL | recon len+head/tail → split lines → filter User:/Instance: → parse (user,question) → filter to target user → llm_query_batched classify into 6 cats → count 2 cats → compare+submit | none (task constants only) |
| GraphWalks | DECOMPOSITION_IDENTICAL | inspect head/tail → split lines → filter `->` edges → build reverse-adjacency parents dict → lookup target → submit | train adds blank-line guard / defensive split (within-step) |
| LongBenchPro | DECOMPOSITION_IDENTICAL | SHOW_VARS → peek context → count each keyword into dict → sort + submit | case-sensitivity tweak inside the count step |
| OOLONG-Pairs | DECOMPOSITION_IDENTICAL | inspect → parse (user,instance) → batch-classify into 6 cats → group-by-user + filter target labels → emit (u1<u2) pairs → submit | set-vs-list label store (within-step) |
| SG-OOLONG (trec→spam) | DECOMPOSITION_IDENTICAL | inspect format → filter lines by User:<id> → batched sub-LM classify → tally 2 labels → compare+submit | task constants only (binary vs 6-way, batch size) |
| MRCR | EQUIVALENT_MINOR_DIFFS | 3 escalating context probes → substring-locate request + extract Assistant response between markers → prepend hash → submit | eval adds a standalone verify turn and splits build/submit (7 vs 5 turns); no reordering |
| AdaLEval | EQUIVALENT_MINOR_DIFFS | inspect → regex-parse A-labeled candidates → llm_query_batched relevance filter → extract survivors → pairwise llm_query pick → submit | train has an extra leading SHOW_VARS() probe (no conceptual step) |
| SG-OBLIQ twitter→wildchat | EQUIVALENT_MINOR_DIFFS | inspect → regex extract doc_ids → define relevance-scoring prompt → batched llm_query_batched score → sort desc → submit ranked ids | train runs a 1-doc prompt smoke-test before batching (within the define-prompt step) |
| SG-OBLIQ writing→math | DECOMPOSITION_IDENTICAL | inspect (len+preview) → parse '--- doc_id --- text' into (doc_id,text) → define relevance prompt + batch llm_query_batched (bs=20) → zip+sort desc → submit ranked ids | none structural (length-matched 5-turn pair; parse idiom / score scale differ) |

Full per-case decompositions + alignment tables are in each `<case>/verdict.md`.

## Takeaway
Across both length-gen and strategy-gen (including cross-domain transfers), every eval trajectory
decomposes its task into the **same ordered pipeline** as a training trajectory the model had already
seen — the "minor diffs" are extra environment probes, a verification turn, or debug-retry loops, never
a genuinely different strategy.
