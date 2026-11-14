# INSPECTOR REPORT · 小脉宝 GcaPal v0.1.0（2026-11-14 夜间巡检）

- 审查人：独立 Inspector（只读，未改任何业务代码）
- 对象仓：`/Users/qinxiaoqiang/Downloads/gca-workbench`（prototypes/v0.2/）
- 基准仓：小粉宝 `breast-cancer-workbench/prototypes/v0.4/`（成熟基准）、小橙宝 `aml-workbench/prototypes/v0.2/`（结构基准）
- 审查提示词：`xyb-workbench-starter/prompts/FAMILY-INSPECTOR.md`（§A–§I）
- 截图：`docs/screenshots-d2/`（本台 10 个一级页签 1280×860 + 390 宽 + 设置三 tab + 一图秀 + 临床研究三子页 + 两基准首屏）

## 一句话总评

门禁与探针全绿（check/test/audit/4 探针/self-test 全过），病种语义残留仅 1 处注释级残留，数据层与红线扎实；**主要缺口集中在原型交互层：发作空态按钮点击报错（P0）、收藏链路无 UI（P1）、一图秀未按家族 rail 规格实现（P1）、录入三态按钮未落地（P1）、就医信息无前端落点（P1）**，另有侧栏品牌块/档案卡/导航图标三处 UI 形态与小粉宝差异较大。

---

## 二、回归数字汇总（照抄实测）

| 项 | 结果 | 备注 |
| --- | --- | --- |
| `npm run check` | exit 0 | 25 步检查链全过（含 check-trial-snapshot / check-schema-words / check-wording / ui-parity） |
| `npm test` | 48/48 pass · 0 fail · 0 skipped | exit 0 |
| `npm run audit` | 44/44 通过 · 0 失败 · 0 待人工 | exit 0 |
| `probe-gca-m2.mjs --url http://127.0.0.1:8142/prototypes/v0.2/index.html` | **54/54 pass, 0 fail**（含 MT13 不串档、Q35 私密三出口、C9 390 宽、ERR 0 页面错误） | 探针自带服务器 |
| `probe-disease-primer.mjs --url` 同上 | **10/10 通过**（P1–P9 + E0） | 四段 id definition›evidence›landscape›trend |
| `probe-page-view.mjs --url` 同上 | **13/13 PASS** | 整页视图 A1–A10 |
| `probe-gca-write.mjs`（无参） | **5 pass, 0 fail, 3 skip**（PR1/PR2/PR3/PR4 API 态实过；PR2/3/4-demo SKIP：本形态无 API） | SKIP 不计覆盖 |
| self-test：`probe-page-view --self-test` | FAIL 9/13，注入 3 缺陷全被点到 → 闸门会红 | 通过 |
| self-test：`probe-disease-primer --self-test --url` | 7/10，3 失败 → 闸门会红 | 通过 |
| self-test：`probe-gca-write --self-test` | 「反向对照已证明探针会红（PASS）」 | 通过 |
| self-test：`probe-gca-m2 --self-test` | **未实现**——脚本内无 `--self-test` 分支，带该参数只是正常跑一遍（54/54） | 见 P1-6 |
| `check-trial-snapshot.mjs` | records=221/221 sourceStatuses=48，PASS | 三方计数一致 |

## 三、专项核对（今晚最易错五项）

| # | 项 | 结论 | 证据 |
| --- | --- | --- | --- |
| ① | 病种语义残留（PSC/胆管/ALP 等） | **通过（1 处注释级残留，见 P2-1）** | `grep -rniE "psc|胆管|胆汁|胆红素|ALP|GGT|熊去氧|内镜|肠镜|IBD"` 在 prototypes/public/lib/dsh/schema 命中均为 `scalp/realpath` 子串误报；真残留仅 `dsh/mineru.js:11` 注释。`pbc:` 0 命中；肿瘤词（分期/线序/疗效/粒缺/D+N/癌）0 命中（「复发」仅用于「头痛复发」临床事实原话语境） |
| ② | demo 两档案切换串档 | **通过** | probe MT13a/MT13b：切 B 出现 PMR 合并症、发作 4 条；切回 A PMR 消失、发作回空态；切换时 `state.localSymptoms` 清空（app.js bindShell `#profile-btn`） |
| ③ | 快照口径卡头与 manifest 一致 | **通过** | manifest.json：recordCount=221 / relevant=149 / snapshotDate=2026-11-14，sourceStates 6 条逐通道（failed/unconfigured/ready×3/truncated）与 demo-data.js:1589 `snapshotMeta` 逐字段一致；设置·临床数据库 tab 与 trials/sources 同源展示，FAILED 如实写「查询失败（failed，不算查过）」 |
| ④ | primer 四段 id | **通过** | probe P2：definition›evidence›landscape›trend 顺序正确；P8 数据四段齐全、每段有来源、趋势段无禁止词 |
| ⑤ | 视力预警卡只记录不判读 | **通过** | app.js:284 `visionAlertCard()` badge「只提醒，不判读」，文案「不做判读、不给分诊结论」；symptom_notes.vision_alert（0002）只存档位事实；化验参考区间缺上限如实写「单据未印上限」不补通用值 |

---

## 四、逐项四态表

### §A 视觉对齐（截图见 docs/screenshots-d2/）

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| A1 品牌块 | **薄弱（P2-2）** | 小粉宝/小橙宝侧栏顶部为「渐变 Logo 方块（含品牌字）+ 中文名 + 英文副标」；本台仅顶栏一行 20px 花形 SVG + 小脉宝 + GcaPal + 版本 chip，无渐变 Logo 块、无侧栏品牌块（index.html:11-31） |
| A2 档案卡 | **薄弱（P2-2）** | 两基准侧栏有「头像方块+档案名/标签两行+展开箭头」档案卡；本台为顶栏 ghost 按钮「切换档案」（A↔B 硬切换），无档案列表弹层、无头像卡 |
| A3 导航 | **薄弱** | 菜单项只有圆点 dot 无线性图标（app.js:136）；家族脚注缺侧栏底（页脚有全局说明但非「家族脚注」形态）；选中态浅底 pill 达标 |
| A4 声明条 | **薄弱** | 无页面最顶部深底高对比声明条；「模拟/合成示例」信息分散在版本 chip「v0.1.0 · 原型」与页脚「演示数据为合成示例，未连接宿主」（信息在场、形态不符两基准） |
| A5 首屏大状态卡 | **通过（薄弱）** | 「随访第 24 天」大字状态 + 辅导句 + 参考节点；但字号 28px（app.js:314），小粉宝同位约 42px |
| A6 行动带 | **通过** | 视力预警提示带（暖底 + 主按钮组）与发作空态 CTA 结构在 |
| A7 快捷卡三连 | **通过** | 今天怎么样 / CRP 最近趋势 / 接下来 三卡可点进对应页 |
| A8 字号层级 | **薄弱** | H1/大状态 28px（≥27px 达标但低于家族 42px 气质）；指标大数字 22px（style.css:167），低于「≥30px 品牌色」标准 |
| A9 AI 面板 | **通过（口径不同，有出处）** | 本台不自建页内 AI 面板，「AI 对话＝宿主原生会话」（index.html:34-35），与小粉宝 v0.4 口径一致；小橙宝 v0.2 是页内 agent-pane 形态。独立打开 toast 明说没有会话面板（probe Q19） |
| A10 断点 | **通过** | 1180/900/600 三档齐（style.css:359-372）；390 宽 scrollWidth===390（probe C9） |

### §B 菜单完整性

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| B1 菜单对照 | **通过（两条 L 线缺「如实裁剪说明」，P1-7）** | 本台一级：看板/我的病底/发作与缓解/用药/化验/症状/影像与随访/复查节奏/报告与资料/临床研究。对照小粉宝（病情整理/一图秀/临床/营养支持/心理支持/全程与康复/收藏与回顾）：**营养线（starter 26 号 L6「强烈建议」）与心理与家庭线（L7「强烈建议」）整线缺失**，docs/ 内未见「不上/为什么」的显式裁剪记录（grep 营养/心理 仅命中 starter 同名家族文档）。starter 26 号要求每条候选线显式回答「上/不上/为什么」，沉默缺失=失误 |
| B2 临床线落点 | **通过** | 设置三 tab 含「临床数据库」；临床研究一级菜单保留（§E 全查） |
| B3 每页真实内容 | **失败（P0-1）** | 10 个一级页签逐屏截图均有内容与交互；但 **episodes/list 档案 A 空态的「记一次发作」按钮点击即报错且无任何发作录入表单**（见 P0-1）；trials/saved 空态只有一句文案、无下一步按钮（app.js:1225-1226，P2） |
| B4 二级页签 | **通过** | NAV 32 个 (view,sub) 全部在 VIEWS 路由表有实现、无「这一页还没实现」兜底命中；check-probe-coverage 入 check 链 |

### §C 设置三 tab

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| C1 tab 结构 | **通过** | 工作区/文档解析（MinerU）/临床数据库，tablist+aria-selected（app.js:1618-1620），单 layer 内 hidden 切换不丢状态 |
| C2 工作区 | **通过** | 根目录示意值 + 拒绝清单（主目录/桌面/下载根/tmp 客服端与服务端各判一遍）+ 原件/派生/数据库三块 + 备份恢复口径 |
| C3 MinerU | **通过** | 未勾选黄字「不会上传、不会调用」；Token 掩码后 4 位说明、未勾选时 disabled（app.js:1644,1695）；固定 pipeline 不切 VLM + 原因；Flash 10MB/20 页降级说明；**「不联网、不上传、不调用」如实标注在场**；4 步申请指南在 details |
| C4 临床数据库 | **通过** | 快照 221/149/2026-11-14；逐通道终态如实（failed/unconfigured/truncated 原样）；「登记状态，未核实」pill；与 trials/sources 同一份数据同一文案（C10/E10 联动达标） |
| C5 口径在场 | **通过** | 顶栏「记录不是诊断 · 处置由治疗团队判断」、页脚「不构成医疗建议」、化验/图/试验各页「不合并、不连线」「不可直接比较」「判定归医生」 |

### §D 一图秀

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| D1 rail 双栏布局 | **失败（P1-2）** | 本台一图秀是单卡 SVG 多线图 + 「选择指标」居中 modal（app.js:711-760），**没有 238px 左 rail + 右主图结构**，≤900 折单列无从谈起 |
| D2 rail 三节 | **失败（P1-2）** | 缺：时间范围 chips（全部/近 3 月/近 6 月/近 12 月）；按指标分类分组的 checkbox（有分类概念但选择器是无分组平铺 chips，且不带最近值）；显示内容 chips（治疗/置换节点开关）。上限 5 条（家族口径 4 条）。保留：每项带固定色点、已选 n/m 计数 |
| D3 绘图纪律 | **通过（部分）** | 各线按全期 min/max 独立归一化 + 「不可直接比较」标注；末点数值标签（CRP 31 / ESR 54）；单点不连线（文案+实现）；用药节点竖虚线；空窗无数据时有 honest 文案路径。缺「关闭节点层不改数据线」开关（无节点层开关，探针无此断言） |
| D4 点数据点→原始报告弹层 | **失败（P1-2）** | 数据点 circle（app.js:699）无任何点击 handler，不能打开原始报告 |
| D5 私密不进图 | **通过（N/A）** | 化验记录无私密标记语义；私密过滤走感受记录三出口（Q35 系列过） |

### §E 临床试验线

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| E1 菜单与保留 | **通过** | 一级「临床研究」在位，无静默裁剪 |
| E2 三子页 | **部分失败（P1-3）** | 三子页在（检索/收藏/来源说明），但「匹配」没有独立子页——建档网格+匹配卡+关键词检索全塞在 trials/search 一页，违反「一次只回答一个问题」 |
| E3 四段链路 | **通过（3/4）** | 建档：dossier 卡「只有已确认入库字段参与」+「本地没建档的永远无法自动匹配」（app.js:1030-1046）✓；检索：关键词+本地快照、分层结构化/文本/宽口径、逐词证据 ✓（在线通道走 check-trial-chain 门禁核）；匹配：三档证据链、`undetermined≠不符合`、无综合分 ✓；呈现/收藏：呈现 ✓，**收藏入口 ✗（P1-4）** |
| E4 匹配卡结构 | **通过（口径更严，有出处）** | 不产百分比为仓级设计决定（trial-match.js:1-24 注释 + PF-ILD 仓先例）；`decidable>=2` 才给「粗筛符合度」，分母用「符合 N/冲突 N/待确认 N」三 pill 明示；硬性条件单列。与 E4「分数方块+百分数」形态不同但防误读意图更强，见 P1-5 待人工确认家族口径 |
| E5 详情浮窗 | **失败（P1-3）** | 无右侧浮窗详情（卡片平铺）；无官方登记页出口（demo 条目明示虚构、无登记号，demo 态可接受；真快照接入后需补）；入排原文缺失声明在（app.js:1042,1218） |
| E6 证据链 | **通过** | 每条三态 ✓/✕/? + 类别 + 硬性标记 + why + 记录来源；不符合/待确认排前（`order conflict:0, undetermined:1`，app.js:1085）；其余折叠（details「其余 N 条条件」）；「条目无法结构化」落待确认 |
| E7 五条红线 | **通过** | ①判据只来自快照/档案真实字段（factsOf 只放非空）；②GCA 无靶点检测语义，天然不进分母（trial-match.js:20-27 明示）；③decidable<2 不给百分数（app.js:1089）；④无 wildtype/阴性反转语境问题（ANA 三态含「未检测」）；⑤候选池口径写在卡头（已载 221/快照 2026-11-14/相关 149 + 非全库扫描，app.js:1096） |
| E8 收藏 | **失败（P1-4）** | saved_trials 表在（schema 0001），但 **UI 无任何「收藏」按钮**（grep 收藏 仅命中收藏子页静态文案「检索结果卡上的收藏会存在本机」——该按钮不存在）；收藏子页是静态 stub（app.js:1224-1228），无收藏日期/在跟/准备问/已归档 |
| E9 检查器 | **通过** | check-trial-matching/check-trial-chain/check-trial-snapshot 均入 check 链且全过；`eligible/suitability/匹配指数/入选概率` 0 命中；「登记状态，未核实 + 快照会过期」在场 |
| E10 与设置 tab 联动 | **通过** | 同一 `snapshotMeta`/`trialSourcesHtml()` 两处共用（app.js:1230-1246） |

### §F 录入窗口（逐页盘点表）

| 页面 | 盘点前 | 处理结论 |
| --- | --- | --- |
| 发作（episodes/list） | 需要录入、多记录 | **失败（P0-1）**：无录入表单；空态 CTA 点击报错（app.js:490 → emptyState:529 `onclick="episode-new"` 非法 JS，pageerror「Unexpected end of input」实测复现） |
| 化验（records/import） | 需要录入、候选批量核对 | 通过（演示态）：候选逐项核对 + 确认/拒收双按钮；真写库走 API 态（probe-gca-write 实证 8 kind） |
| 感受笔记（symptoms/headache·log） | 需要录入、支持连续多条 | **部分失败（P1-8）**：有滑杆+勾选+保存（app.js:788-796），但单按钮「保存这一次」，无「保存并继续录入」三态 |
| 筛查/影像（screening/*） | 需要录入 | 有表单（日期/结果/补充 ≤6 字段）+「保存这一次」，同缺三态 |
| 复诊问题清单（followup/prep） | 需要录入、多条 | 通过：「再加一条问题」+「加进清单」，可连续加（app.js:939-944） |
| 用药/调药（treatment/current） | 需要录入 | **失败（P1-8）**：只有「今天漏服」记录按钮，无调药/新增用药录入窗（写库 API 支持 kind=treatment，前端无落点） |
| 资料登记（records/import·files） | 需要录入 | 通过（演示态，选文件只走候选演示并如实标注） |
| 就医信息（医院） | 需要多家医院逐条卡片 | **失败（P1-9）**：hospitals 表在（schema 0001:118）、写库 API 支持 kind=hospital 且明确拒收档案归属（dsh/workbench.js:275-281），但**前端无就医信息页**——医院只作为发作卡的一个字段显示（app.js:483,509），无逐条卡片/修改/添加/联系方式 |

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| F3 三态按钮 | **失败（P1-8）** | 全原型 grep「保存并继续录入/保存并关闭」0 命中；所有录入窗均为单「保存这一次」按钮 |
| F4 字段≤6/数字键盘/必填提示 | **通过（部分）** | 筛查表单 4 字段；发作/用药缺表单无从验；inputmode 未用（数字靠滑杆规避） |
| F5 无裸删除 | **通过（薄弱）** | 全原型无删除按钮 ✓；但更正=新版本、版本号显示、「查看历史」入口/占位均缺（写库层 ver 列在，展示层无） |
| F7 医生原话照录 | **通过** | 行动计划/处置原文【原话照录】口径在（schema freeze-contract + episodes 卡原文在场） |
| F8 编辑入口 ≤1 | **通过** | 各列表页主按钮 1 个 |

### §G 数据层

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| G1 schema 冻结 | **通过（文档数字错，P2-1）** | 0001_initial.sql 冻结 + freeze-contract sha256 与文件一致（test 32 过）；0002_gca_m5.sql 新增 profile_facts/app_setting，幂等（test 36）。**但 freeze-contract.md:5 两处写「15 表」，实际 0001 建 19 表（表清单枚举 2+3+7+3+3+1=19，枚举本身正确、汇总数字写错）** |
| G2 判读列断言 | **通过** | test 37「全表全列 0 命中」；check-schema-words 入链 |
| G3 读模型同形 | **通过** | test 34（demo 唯一源装载、两档案字段齐备）+ test 46（8 kind 同形回读）；页面无写死数字（版本十处同源 + check-ui-parity） |
| G4 sqlite 盘点 | **通过** | ①快照库 `research/gca/gca_trials_2026.sqlite`：4 表（trials/source_states/source_statuses/query_log），trials 221 行；②工作台库：运行态落 `config.root=dshHomePath('gca')` 用户目录（project.config.json），测试用内存库，迁移账本=0001 冻结 19 表 + 0002 补 2 表（共 21）+ 幂等重跑不执行（test 36） |
| G5 新增录入先核 schema | **通过（UI 缺口见 P1-9）** | hospitals 表已支持多家医院；meds 有版本语义；缺口在前端不在 schema |

### §H 红线复扫

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| H1 私密三出口 | **通过** | `sharedOnly()` 单一过滤函数供看板摘要/导出/AI 上下文（app.js:127）；probe Q35a/b/c/d 四断言全过（含「已排除私密 1 条」说明与本机可见） |
| H2 禁词 | **通过** | check-wording 入链 + 运行态探针 ERR 0；「匹配指数/入选概率/建议参加」0 命中 |
| H3 非肿瘤语义 | **通过** | 分期/线序/疗效/粒缺/D+N/癌 0 命中；「发作—缓解」表达正确（缓解未记→end_date NULL、随访第 N 天/距上次节点） |
| H4 诚实标注 | **通过** | README:7「0 患者访谈、0 临床审核」；阈值【待核】（CLINICAL-DATA/demo）；复查间隔「以医生安排为准」（probe BEP1） |
| H5 不替医生说话 | **通过** | 视力预警只提醒就医不判读；紧急口径无生成句；AI 草稿只填不发（Q17） |

### §I 回归与交付

| 编号 | 结论 | 证据/说明 |
| --- | --- | --- |
| I1 数字照抄 | **通过** | 见 §二 |
| I2 截图含版本 / README 五段 | **通过** | 截图文件名含 v0.1.0；README 疾病概要/关键功能/怎么用/数据与口径/开发五段齐；装机截图「待 GCA 版产出后补」如实标注 |
| I4 报告格式 | 本报告 | 四态计数见 §五 |

## 五、四态计数汇总

| 态 | 计数 | 条目 |
| --- | --- | --- |
| **通过** | 33 | A5/A6/A7/A9/A10、B1(菜单在位部分)/B2/B4、C1–C5、D3/D5、E1/E3(建档检索匹配)/E4/E6/E7/E9/E10、F4(部分)/F5/F7/F8、G1(冻结纪律)/G2/G3/G4/G5、H1–H5、I1/I2、专项①②③④⑤ |
| **失败** | 9 | P0-1（发作空态按钮报错+无录入窗）、P1-1（F2 发作/用药/就医三处录入缺）、P1-2（D1/D2/D4 一图秀规格）、P1-3（E2 匹配子页+E5 详情浮窗）、P1-4（E8 收藏链路无 UI）、P1-7（L6/L7 裁剪无说明）、P1-8（F3 三态按钮）、P1-9（F6 就医信息前端）、P2-1（freeze-contract 表数写错） |
| **跳过** | 4 | probe-gca-m2 --self-test（未实现）、probe-gca-write 3 条 demo 态（无 API，如实 SKIP） |
| **待人工** | 3 | P1-5（三档代替百分比的家族口径确认）、真机 UI/DSH Desktop 会话授权/装机（本环境无法验）、AI 面板 25–45% 拖拽（页内面板不存在，宿主形态无法验） |

（薄弱项 A1/A2/A3/A4/A8/F4/G1 文档数字计入失败栏之 P2 或在条目内标注，不重复计数。）

## 六、P0/P1 问题清单（带 file:line）

### P0（阻断）

- **P0-1 发作空态「记一次发作」按钮点击报错，且全原型没有发作录入表单**
  - `prototypes/v0.2/app.js:490`（emptyState 第 4 参 `'episode-new'`）→ `app.js:529`（`onclick="${action}"`）——`episode-new` 不是合法 JS，点击抛 pageerror「Failed to execute 'click' on 'HTMLElement': Unexpected end of input」（无头实测复现，档案 A episodes/list 空态）。
  - 关联：F2 发作录入窗整段缺失；`public/app.js` 同步产物同 bug（ui-parity 同源）。
  - 修复：改为合法 action（如 `location.hash='#records/import'` 或补 episode 录入窗 + `data-*` 事件绑定），并把发作录入窗（日期/缓解日期/症状勾选/医院/处置原话）补上；谁补谁写进 CHANGELOG。

### P1（缺口）

- **P1-1 录入窗口覆盖不全（F2）**：发作（见 P0-1）、用药/调药（`app.js:544-548` 只有漏服按钮）、就医信息（见 P1-9）三处无录入窗。
- **P1-2 一图秀未按家族 rail 规格（D1/D2/D4）**：无 238px rail、无时间范围/分组指标（带最近值）/显示内容三节、数据点无点击进原始报告（`app.js:699` circle 无 handler、`app.js:711-760` 单卡+居中 modal 实现）。对照基准：`breast-cancer-workbench/prototypes/v0.4/` 一图秀 rail 双栏。
- **P1-3 临床研究「匹配」无独立子页、详情无右侧浮窗（E2/E5）**：全部塞 `trials/search`（`app.js:1122-1185`）；无详情浮窗三关闭口/焦点恢复/官方登记页出口。
- **P1-4 收藏链路无 UI（E8）**：`app.js:1224-1228` 收藏子页静态 stub；trial 卡无「收藏」按钮（grep 全文件 0 命中）；saved_trials 表空转。收藏日期 + 在跟/准备问/已归档 无落点。
- **P1-5 百分比口径待家族确认（E4）**：本仓「三档、无综合分、decidable≥2 才给粗筛符合度」（`prototypes/v0.2/trial-match.js:1-24`、`app.js:1085-1120`）与 FAMILY-INSPECTOR §E4「分数方块+百分数+n/m」形态不同（更严）。请晨审裁决：按家族口径改回，还是把本仓口径写进家族 35 号文档作为允许变体。
- **P1-6 probe-gca-m2 无 --self-test**：`scripts/probe-gca-m2.mjs` 全文无 self-test 分支（grep 0 命中），带参只正常跑。其余三探针 self-test 均 real 红。补注入缺陷反向用例。
- **P1-7 营养线（L6）与心理线（L7）整线缺失且无裁剪说明（B1）**：starter `docs/26-CANCER-FEATURE-LINES.md` §2 要求每条线显式回答「上/不上/为什么」；本仓 docs/SPEC/DEV-PLAN/BRIEF 均无 L6/L7 裁剪记录。GCA 心理支持有真实场景（确诊期焦虑/家属），至少补「如实裁剪/延后」说明。
- **P1-8 录入三态按钮未落地（F3）**：「保存并继续录入/保存并关闭/取消」0 命中（`app.js:795/880` 均单按钮）。
- **P1-9 就医信息无前端落点（F6/G5）**：schema `schema/0001_initial.sql:118`（hospitals 表）+ 写库 `dsh/workbench.js:213,275-281`（kind=hospital，明确拒收档案归属）都支持，但原型无就医信息页/多医院卡片/修改/添加。

### P2（薄弱/打磨）

- **P2-1 `schema/freeze-contract.md:5`「15 表」两处应为 19 表**（枚举清单本身 19 项正确，汇总数字写错；test 36 亦证 19+2=21）。
- **P2-2 `dsh/mineru.js:11` 注释残留肝胆语义**：「GCA 指标字典：胆汁淤积/肝细胞/合成/血象/肾功能」——字典实体（ESR/CRP/Hb/PLT/ALT/FBG/SBP/DBP）已是 GCA 语境，仅注释行是 PSC 底本残留，改为「炎症活动/血象/激素监测/代谢/血压」。
- **P2-3 UI 形态薄弱**：侧栏品牌块/档案卡/导航图标/顶部声明条四处与两基准形态差异（§A A1/A2/A3/A4，`prototypes/v0.2/index.html:11-31`、`app.js:136`）；大状态卡 28px（`app.js:314`）、指标大数字 22px（`style.css:167`）低于家族 42px/30px 标准。
- **P2-4 trials/saved 空态无 CTA（B3）**：`app.js:1225-1226` 只有一句文案（修 P1-4 时一并补）。

## 七、未验证项（如实标注）

- **真机/DSH Desktop 形态**：会话授权、`gca:agent-draft` 在 Desktop 内的实际投递、`verify-desktop-load` 装机路径——本巡检只验浏览器独立打开形态（probe Q17/Q19 已验「如实说没有会话面板」）。
- **MinerU 真实云解析**：仓内如实标注未接入，本巡检未做真实上传验证。
- **在线试验双通道（unified-trial-mcp）**：门禁核对契约与快照一致性，未发起真实在线查询。
- **AI 面板宽度拖拽（A9 25–45%）**：页内面板不存在（宿主原生会话形态），无法验。
- **装机（M6）与市场发布**：未执行，`release/`、`xyb-community-gca-workbench-0.1.0.tgz` 存在但未做装机走查。

## 八、修复建议排序

1. **P0-1**：修发作空态 CTA + 补发作录入窗（阻断级，用户第一步就撞）。
2. **P1-4/P1-3**：补收藏按钮与收藏子页真实现、匹配独立子页/详情浮窗（35 号链路收尾）。
3. **P1-8/P1-9/P1-1**：录入三态按钮统一组件 + 就医信息页 + 用药录入窗。
4. **P1-2**：一图秀按 16-ONE-CHART-SPEC 重排 rail 双栏（可复用小粉宝实现）。
5. **P1-5/P1-6/P1-7**：口径裁决 + probe-gca-m2 self-test + L6/L7 裁剪说明（文档与闸门级，改动小）。
6. **P2 系**：freeze-contract 数字、mineru.js 注释、UI 形态对齐（品牌块/档案卡/图标/声明条/字号）。

> 修复执行按家族惯例：谁补谁写进 CHANGELOG；本轮修复完成后复跑 §二全部命令与 P0-1 复现步骤。
