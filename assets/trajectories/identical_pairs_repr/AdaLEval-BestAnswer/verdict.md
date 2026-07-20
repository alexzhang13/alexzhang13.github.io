VERDICT: SAME_STRATEGY   lined-up score: 84/100 (sub-agent)   [eval_step >= train_step: eval@111 >= train@87]
eval@111/45 (t6, r1.0) <-> train@87/25 (t7, r1.0), both trained checkpoints.
Same 5-stage pipeline (one-turn offset: train opens with an extra SHOW_VARS() probe): inspect context ->
regex-extract A-labeled candidates -> llm_query_batched relevance filter -> dump the 2 survivors ->
pairwise llm_query pick -> answer[content]=label. Diffs: relevant/irrelevant vs Yes/No vocab, eval slices a
'Candidate answers:' section first, comparison-prompt justification wording. Task content differs (UILabel vs Rails).
