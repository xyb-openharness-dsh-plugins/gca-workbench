# 变更记录

只增不删；每条写清"改了什么 + 为什么 + 用户可见结果"。版本号与 VERSION、package.json 三处必须一致。

## 0.1.0 — 2026-11-14（首版）

- 由家族脚手架 dsh-wb-cli 初始化建仓（M0），并完成病种语义文档集的 GCA 原创重写：SPEC / DEV-REQUIREMENTS / DIFF-MATRIX / PATIENT-FLOW / SCENARIOS / USER-RESEARCH / INTERACTION-DESIGN / CLINICAL-DATA / DEV-PLAN / SOURCES / DISEASE-PRIMER / SCHEMA / HVT-REVIEW / CHECKPOINTS-M2 / BRIEF / DESIGN-REVIEW / HISTORY / README；与移植底本的重名率实测写入 DIFF-MATRIX §一。
- 全部医学阈值、求助短语、指南条目号为【待核】占位：0 患者访谈、0 临床审核如实标注；视力预警提醒文案为占位，临床审核前不定稿。
- 临床试验线口径按 35 号四段链路写入 CLINICAL-DATA §六；ClinicalTrials.gov query.cond=giant cell arteritis 联网实测 195 条（2026-11-14），仓内快照未建立，通道失败则如实 FAILED。
- 病种定位：巨细胞动脉炎（GCA），罕见病目录 #35【待核】，R2 非肿瘤慢性病型 · T2，NCCN 不适用；品牌占位小脉宝 GcaPal。
- 本版不包含发布段：未发布、未装机、市场投稿未授权（不适用）。
