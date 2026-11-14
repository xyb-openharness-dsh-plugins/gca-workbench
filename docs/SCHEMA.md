# 数据主体—关系—表（GCA 实例草案）

版本 v0.1 · 2026-11-14 · 自动签认状态：HTML 确认前为候选模型；确认对应模块后复核并落实生产 schema/API。

## 实体与表

| 实体 | 稳定 ID | 主体/外键 | 核心字段/类型 | 约束/索引 | 来源/确认 | 生命周期 |
| --- | --- | --- | --- | --- | --- | --- |
| subject | subj_id | — | 名称、出生年代段（不存精确生日）、备注 | unique(subj_id) | 用户建档 | 软删=in_use=false |
| document | doc_id | subject | relative_path/hash/mime/来源机构/日期 | hash unique | original/candidate | 不可变，更正=新版本 |
| lab_observation | obs_id | subject/metric_definition | time/value/unit/方法/机构/可比组 | (subject,metric,time) | candidate→confirmed | 只增不改 |
| metric_definition | metric_id | — | 名称（ESR/CRP/血常规等）、单位、分类 | unique(metric_id) | 内置目录+用户扩展 | in_use |
| dose_segment | dose_id | subject/drug_id | 起始日期/剂量 mg/d/医嘱原文/私密 | (subject,drug,start_date) | candidate→confirmed | 只增；更正=新版本 |
| drug_record | drug_id | subject | 药名（泼尼松/托珠单抗等）、途径、频次、医嘱原文、版本 | (subject,drug,revision) | candidate→confirmed | 版本化 |
| episode | ep_id | subject | 开始/缓解时间、症状集（头痛/头皮压痛/下颌跛行/肢体跛行/晨僵）、体温、就医、行动计划原文、私密 | (subject,start_time) | candidate→confirmed | 只增不改 |
| symptom_entry | sym_id | subject | 类别（视力预警/头面/全身）、原文、日期、记录人、私密 | (subject,date,category) | 用户录入 | 只增不改 |
| imaging_record | img_id | subject | 类型（颞动脉超声/CTA/MRA/PET-CT/活检）、日期、所见原文（如晕轮征）、来源 | (subject,type,date) | candidate→confirmed | 只增不改 |
| screening_followup | sf_id | subject | 条目（PMR 随访等）、医生安排原文、最近日期、间隔 | (subject,entry) | 医生安排口径 | 只增不改 |
| vision_alert | va_id | subject/episode | 症状原文、发生时间、提醒展示日期（仅记录不判读） | (subject,occurred_at) | 用户录入 | 只增不改 |
| trial_candidate | tc_id | subject/nct_id | NCTId、标题、状态、快照日期、收藏、匹配理由 | (subject,nct_id) | snapshot+用户收藏 | 收藏可删，快照只读 |

## 关键语义约束

- dose_segment 是「段」不是「点」：mg/d + 起始日期，阶梯表读时按日期拼接。
- ESR/CRP 不生成活动度派生列；vision_alert 只记录不判读。
- episode 症状集为受控枚举 + 原文备注；不塞任意 JSON 进核心关系。

## 扩展策略与迁移

定义目录新增 vs 结构迁移边界；迁移 ledger/旧库 fixture/备份/事务/回滚兼容逐项留证据。数据根选择、相对路径校验、公共/私人数据分离；统一读模型与跨页一致性验收。SQLite（schema/0001_initial.sql）为主存储；偏好/摘要为可重建缓存。

## 前端与业务流程变化矩阵（建库前必填）

| 变化情境 | 不变的事实/关系 | 配置/投影/API变化 | 迁移/旧记录读取与恢复 | 验收证据 |
| --- | --- | --- | --- | --- |
| 改导航/布局/同一事实多视图 | 全部实体 | 读模型/组件映射 | 无迁移 | 截图+探针 |
| 新字段/指标/可选记录类型 | 既有表 | metric_definition/表新增列 | 补充迁移 000x | 迁移日志 |
| 流程插入/跳过/重开 | 实体不变 | 流程定义版本 | 实例按版本读取 | 实走记录 |
| 来源更正/删除/缓存失效 | 只增不改约束 | 读模型失效重建 | 更正=新版本 | probe 断言 |
| 旧数据库/旧API客户端升级 | schema 兼容 | API 版本 | fixture 回放 | 兼容测试 |

不把 UI 模拟数据当表；HTML 确认前是候选模型/模拟 adapter。详见 docs/14-HTML-AND-DATA-CONTRACT.md。
