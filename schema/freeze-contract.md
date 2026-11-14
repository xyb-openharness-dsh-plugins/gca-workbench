# freeze-contract · gca-workbench

- 冻结文件：schema/0001_initial.sql
- sha256：`72d4852da59b6b80e5cd7095d9a6eccd0ff5f83ccd439f4a86917268f93386c1`
- 冻结时间：2026-11-14（M3 冻结；2026-11-14 PSC→GCA 病种语义移植同步重冻结——结构（15 表）不变，仅改注释语境与 symptom_notes 症状列名）
- 纪律：G3 后结构变更只能新增 000N_*.sql；改冻结文件会被 check 拦下。判读列断言（check-schema-words）已入 check 链。
- 表清单（15）：档案级 2（subjects / section_titles）· 指标 3（metric_defs / lab_results / metric_group_titles）· 通用 7（reports / hospitals / visit_questions / symptom_notes / viewpoints / documents / meds）· 专属 3（episode_events / imaging_events / screening_records）· 导入 3（import_batches / import_candidates / import_conflicts）· 试验收藏 1（saved_trials，35 号四段链路）
- 语境要点：episode_events.end_date IS NULL=发作未记缓解；action_plan/treatment_text/plan_text 全部【原话照录】不生成；screening_records 无 next_due 排程列；imaging_events.finding_text 只存原文不判血管受累进展；lab_results.ref_high NULL=单据未印上限不许补通用值；全部派生值（随访第 N 天/距上次发作 N 天/近 90 天发作次数/距上次影像复查 N 月）读时计算不落库；symptom_notes.vision_alert（0002）只记录视力预警症状，不做判读。
