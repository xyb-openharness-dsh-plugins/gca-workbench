# PROGRESS · 小脉宝 GcaPal（巨细胞动脉炎 GCA 工作台）

## 当前状态：M0–M6 + D1–D4 全链完成（v0.1.1 已装机）；V3 真机走查待人工；M7/M8 冻结草稿；M9 回流完成

| 阶段 | 状态 | 证据 |
| --- | --- | --- |
| M0 骨架 | ✅ 自动签认 | init 253 文件 · config.root: dshHomePath('gca') · 基线 staticPass=true |
| M1 文档九件 | ✅ 自动签认 | 19 篇 GCA 原创 · DIFF-MATRIX 重名率 41.8%（≤70% 实测） |
| M2 原型 | ✅ 自动签认 | probe-gca-m2 59/59 · DP 10/10 · page-view 13/13 · 两套档案不串档 · primer 四段 |
| M3 数据模型 | ✅ 自动签认 | 0001+0002（app_setting/profile_facts/vision_alert）· 判读列 0 · freeze sha256 |
| M4 临床库 | ✅ 自动签认 | 快照 221 条（相关 149）· 六通道终态（chictr_online FAILED 如实）· 三处对账一致 |
| M5 开发版 | ✅ 自动签认 | check exit 0 · test 48/48 · audit 44/44 · 版本十处同源 0.1.1 |
| M6 装机 | ✅ 自动签认 | tgz 0.1.1（sha256 57c9d15d…）装 Desktop 实际 profile · bundles 78 含本包 · verify-desktop-load ✓ · 装机副本三件逐字节一致 |
| V3 真机 | ⏸ 待人工 | Desktop 运行中（pid 61933），代理不重启宿主；需用户重开后点三条 |
| D2 独立体检 | ✅ 完成 | 33过/9败/4跳/3待人工 · P0×1 · docs/INSPECTOR-REPORT-2026-11-14.md |
| D3 验收自修 | ✅ 完成 | P0-1 修复 + 收藏链路 + 发作录入 + probe self-test；P1×8 修 3 留 5（见体检报告 §六） |
| D4 装机复验 | ✅ 完成 | 0.1.1 remove-then-add 重装（L85 口径）+ 三件 diff 一致 + V2 复跑 ✓ |
| M9 回流 | ✅ 完成 | starter LESSONS L116–L118 + 待实施⑩ + CHANGELOG rc.54（commit daefddf） |

## 试线报数（35 号口径）
- 快照 221 条 / 相关 149 / snapshotDate 2026-11-14 / 通道终态 chinadrugtrials:SUCCESS(9) · ctv:SUCCESS(2) · ictrp:SUCCESS(210) · xyb_archive:NO_RESULTS · chictr_online:FAILED · pancreatic_archive:NEEDS_SETUP
- check-trial-snapshot PASS（严格形态，无 --if-present）· check-trial-matching PASS（self-test 11/11 反例）· probe SV1–SV3 3/3

## 写入链报数
- createProfile ✓（probe PR2 mine:1 demo:2 共存）· addEntry 8 类+episode ✓ · setPrivacy 双寻址 ✓ · listProfiles ✓
- test/write-api 4 组 ✓ · probe PR1–PR4 API 态 4/4 · demo 态 SKIP 如实 · reload 持久化 ✓

## 下一步（晨审）
① 用户重启 Desktop → V3 三条走查 ② 追认签认与默认值 ③ 授权后执行 M7/M8（草稿已备）④ P1×5 排期
