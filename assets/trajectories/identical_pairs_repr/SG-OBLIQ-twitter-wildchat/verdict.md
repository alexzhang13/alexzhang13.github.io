VERDICT: SAME_STRATEGY   lined-up score: 86/100 (sub-agent)   [eval_step >= train_step: eval@181 >= train@172]
[STRATEGY-GEN cross-domain: train=twitter stance -> eval=wildchat failure-mode]
eval@181/0 (t6, r1.0) <-> train@172/60 (t6, r0.63), both trained checkpoints, matched 6 turns.
Same 6-turn LLM-as-relevance-judge rank-and-submit pipeline: print len+peek -> regex extract_doc_id ->
define scoring prompt -> batched llm_query_batched score -> zip+sort desc -> answer[content]=ranked_doc_ids.
Diffs: doc_id regex (\S+ vs \d+), batch 12 vs 10, train adds a live prompt smoke-test in turn 3, score-parse
robustness. Query text is the intended domain shift.
