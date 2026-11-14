#!/usr/bin/env node
/**
 * 演示数据唯一来源（gca-workbench GCA 版）。
 *
 * 一个文件同时产出两件产物，两者必须同构：
 *   1) prototypes/v0.2/demo-data.js   —— 原型 `file://` 直接引用（纯数据，挂全局）
 *   2) demo/demo-data.sqlite          —— schema/00*.sql + dsh/demo.js 播种（M3 起接入；
 *                                        dsh/demo.js 缺席时本产物跳过，如实记录）
 *
 * 纪律：
 * - 被 import 时只导出 `buildDemoProfiles()` 纯数据，**不碰磁盘**（`import.meta.main` 才写文件）。
 * - 不使用 Math.random：用固定种子的 LCG，重跑逐字节可复现。
 * - 演示人名与数值全部虚构，页面必须显著标「合成示例」；临床试验条目明示 fictional:true。
 * - GCA 边界：无分期/线序/疗效判读；发作—缓解区间带；阈值待核不入库判定；
 *   视力预警只记录与提醒，不做判读；共病 PMR 只以「医生已安排的随访」口径呈现。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

import { screeningTitle } from '../lib/screening-titles.js'
import { criteriaOf, factsOf, matchAll } from '../lib/trial-match.js'

/** 固定种子线性同余：保证重跑一致。 */
function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/* 档案 A：刚确诊，化验少、多处未知；档案 B：多年随访，化验与发作都多。 */
const MONTHS_A = ['2026-10', '2026-11']
const MONTHS_B = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']

// 参考区间取"演示化验单自带的"值，刻意让两家实验室的上限不同（ESR 30 vs 20），
// 用来证明"不同方法不合并"：跨实验室、跨方法不做差、不连线。
// 参考数值均为【待核】口径：只抄单子，不在库内做任何判定。
const LAB_DEFS = {
  A: { name: '市一院检验科', refs: { ESR: [0, 30], CRP: [0, 10], Hb: [115, 150], PLT: [125, 350], ALT: [7, 40], FBG: [3.9, 6.1], SBP: null, DBP: null } },
  B: { name: '区中心医院', refs: { ESR: [0, 20], CRP: [0, 8], Hb: [112, 148], PLT: [120, 340], ALT: [8, 45], FBG: [3.9, 6.1], SBP: null, DBP: null } },
}

const UNITS = { ESR: 'mm/h', CRP: 'mg/L', Hb: 'g/L', PLT: '10⁹/L', ALT: 'U/L', FBG: 'mmol/L', SBP: 'mmHg', DBP: 'mmHg' }
const METHODS = { ESR: 'Westergren（魏氏法）', SBP: '诊室血压测量', DBP: '诊室血压测量' }

/** 一条化验：items 里缺 refHigh 的那条刻意留 null，用来演示「单据没印上限」如实留空。 */
function makeLabs(profileKey, seed, trend, months) {
  const rnd = lcg(seed)
  const def = LAB_DEFS[profileKey]
  return months.map((m, i) => {
    const jitter = () => 1 + (rnd() - 0.5) * 0.08
    const base = {
      ESR: trend.esr[i] * jitter(),
      CRP: trend.crp[i] * jitter(),
      Hb: trend.hb[i] * jitter(),
      PLT: trend.plt[i] * jitter(),
      ALT: trend.alt[i] * jitter(),
      FBG: trend.fbg[i] * jitter(),
      SBP: trend.sbp[i] * jitter(),
      DBP: trend.dbp[i] * jitter(),
    }
    const items = Object.entries(base).map(([code, value]) => {
      const ref = def.refs[code]
      // 第一张：模拟"外院单子没印上限"——只给下限，上限 null（不许用通用值补）
      const missingHigh = i === 0 && code === 'ESR'
      return {
        code,
        value: Number(value.toFixed(code === 'FBG' ? 1 : 0)),
        unit: UNITS[code],
        method: METHODS[code] ?? null,
        refLow: ref ? ref[0] : null,
        refHigh: missingHigh ? null : (ref ? ref[1] : null),
        lab: missingHigh ? '外院报告（未印上限）' : def.name,
      }
    })
    return { date: `${m}-08`, items }
  })
}

/* A 档案：刚确诊 1 个月，记录少、多处未知、无发作记录。 */
function buildProfileA() {
  return {
    key: 'A',
    /* label 是"档案名"，不是结论。档案名只描述"这是哪一份"，不描述"结果好不好"。 */
    label: '档案 A · 刚确诊',
    name: '虚构患者甲',
    age: 68,
    sex: '男',
    diagnosedAt: '2026-10-14',
    startedAt: '2026-10-21',
    weightKg: 72,
    antibodies: { ana: 'untested', note: '2026-10 首诊报告抄录；ANA 未查（GCA 无特异性抗体，仅鉴别参考）' },
    imaging: { method: '颞动脉超声（多普勒）', value: '左颞动脉管壁低回声晕环（halo 征）（报告原文抄录）', date: '2026-10-14', note: '报告原文抄录，未判读' },
    pmr: { status: 'untested', note: 'PMR 症状尚未排查，医生已安排随访', lastVisit: null }, // PMR 共病：未知态
    comorbidity: [{ name: '未见合并症记录', since: null, note: '刚确诊，还没排查完' }],
    meds: [{ name: '泼尼松片', doseText: '45 mg 每日 1 次（晨服，医生医嘱原文抄录；起始 40–60 mg/d【待核】）', freq: '每日 1 次', startDate: '2026-10-21', approval: 'unverified', inUse: true }],
    adherence: [{ month: '2026-10', missed: 0 }, { month: '2026-11', missed: 1 }],
    episodes: [], // 刚确诊，还没有发作记录：空态示例
    symptoms: [
      { date: '2026-11-01', headache: 6, stiffness: 2, scalp: true, jaw: false, vision: false, note: '左颞部胀痛，梳头都疼' },
      { date: '2026-10-25', headache: 3, stiffness: 1, scalp: false, jaw: false, vision: false, note: '' },
    ],
    screening: [
      { type: 'us_temporal', date: '2026-10-14', result: '颞动脉超声：左颞动脉管壁低回声晕环（halo 征）（报告原文抄录）', detail: '确诊依据之一' },
      { type: 'biopsy', date: null, result: null, detail: '医生已安排，待做' }, // 未知值/待办示例
    ],
    questions: [
      { id: 'q1', text: 'ESR 降到多少算控制住？我的目标值是什么？', done: false },
      { id: 'q2', text: '激素要怎么减量？减量节奏谁说了算？', done: false },
      { id: 'q3', text: '如果突然看东西模糊，我应该怎么处理？', done: false },
    ],
    documents: [
      { id: 'd1', name: '2026-10 颞动脉超声报告.pdf', date: '2026-10-14', parsed: false },
      { id: 'd2', name: '2026-11 化验单.pdf', date: '2026-11-08', parsed: true },
    ],
    trials: [
      { id: 't1', title: '【虚构示例】GCA 症状负担登记研究', source: 'ctgov', phase: '登记', status: '登记状态，未核实', area: '上海', fictional: true },
    ],
    pathway: [
      {
        d: '2026-10-14', phase: '确诊', text: '新发头痛伴头皮压痛，颞动脉超声见晕环征后确诊',
        detail: {
          regimen: { summary: '尚未开始用药', items: [['方案', '无'], ['说明', '确诊当次未开药']] },
          metrics: { summary: 'ESR 76 mm/h（Westergren，单据未印上限）', items: [['ESR', '76 mm/h'], ['CRP', '68 mg/L']] },
          imaging: { summary: '颞动脉超声：左颞动脉低回声晕环（halo 征）', items: [['报告原文', '左颞动脉管壁低回声晕环，管腔未见闭塞']] },
          ae: { summary: '无记录', items: [['说明', '此阶段未开始用药，未记副作用']] },
          support: { summary: '无记录', items: [['说明', '未记录支持措施']] },
        },
      },
      {
        d: '2026-10-21', phase: '开始激素', text: '医生开了泼尼松，医嘱原文如记录',
        detail: {
          regimen: { summary: '泼尼松 45 mg 每日 1 次（晨服）', items: [['药名', '泼尼松片'], ['剂量原文', '45 mg 每日 1 次（晨服）'], ['频次', '每日 1 次'], ['获批状态', '未核实']] },
          metrics: { summary: '2026-11 复查 ESR 52 mm/h、CRP 31 mg/L', items: [['2026-11 ESR', '52 mm/h'], ['2026-11 CRP', '31 mg/L']] },
          imaging: { summary: '本阶段未复查影像', items: [['说明', '无记录，不等于没做']] },
          ae: { summary: '无记录', items: [['说明', '未记录']] },
          support: { summary: '"这个病我第一次听说"', items: [['患者原话', '这个病我第一次听说，医生说的名字我都记不住']] },
        },
      },
    ],
  }
}

/* B 档案：8 年随访，发作 4 次、化验 6 个月、激素阶梯与共病都多。 */
function buildProfileB() {
  return {
    key: 'B',
    label: '档案 B · 长期随访',
    name: '虚构患者乙',
    age: 72,
    sex: '女',
    diagnosedAt: '2018-09-05',
    startedAt: '2018-09-18',
    weightKg: 58,
    antibodies: { ana: 'negative', note: '2018 年报告抄录；GCA 无特异性抗体，ANA 仅鉴别参考' },
    imaging: { method: '颞动脉超声（多普勒）', value: '右颞动脉管壁低回声晕环（halo 征），较前对照变薄（报告原文抄录）', date: '2026-03-11', note: '报告原文抄录，未判读' },
    pmr: { status: 'diagnosed', note: '风湿性多肌痛（PMR），风湿科已安排随访', lastVisit: '2026-04-30' },
    comorbidity: [
      { name: '风湿性多肌痛（PMR）', since: '2020', note: '风湿科，医生已安排随访' },
      { name: '甲状腺功能减退', since: '2021', note: '内分泌科，左甲状腺素 50 µg' },
    ],
    meds: [
      { name: '泼尼松片', doseText: '55 mg 每日 1 次（晨服，起始 40–60 mg/d【待核】，医嘱原文抄录）', freq: '每日 1 次', startDate: '2018-09-18', approval: 'unverified', inUse: false },
      { name: '泼尼松片', doseText: '40 mg 每日 1 次（减量阶梯，医嘱原文抄录）', freq: '每日 1 次', startDate: '2018-12-10', approval: 'unverified', inUse: false },
      { name: '泼尼松片', doseText: '20 mg 每日 1 次（减量阶梯，医嘱原文抄录）', freq: '每日 1 次', startDate: '2019-06-20', approval: 'unverified', inUse: false },
      { name: '泼尼松片', doseText: '7.5 mg 每日 1 次（减量阶梯，医嘱原文抄录）', freq: '每日 1 次', startDate: '2020-03-15', approval: 'unverified', inUse: false },
      { name: '泼尼松片', doseText: '5 mg 每日 1 次（维持剂量，医嘱原文抄录）', freq: '每日 1 次', startDate: '2020-09-01', approval: 'unverified', inUse: true },
      { name: '托珠单抗注射液', doseText: '162 mg 皮下注射 每周 1 次【待核：间隔以医生医嘱为准】', freq: '每周 1 次', startDate: '2025-02-20', approval: 'unverified', inUse: true },
      { name: '阿司匹林肠溶片', doseText: '100 mg 每日 1 次（小剂量，医生安排）', freq: '每日 1 次', startDate: '2025-02-25', approval: 'unverified', inUse: true },
      { name: '左甲状腺素钠片', doseText: '50 µg 每日 1 次', freq: '每日 1 次（另一科开）', startDate: '2021-05-01', approval: 'unverified', inUse: true },
    ],
    adherence: [{ month: '2026-05', missed: 0 }, { month: '2026-06', missed: 1 }, { month: '2026-07', missed: 0 }, { month: '2026-08', missed: 3 }, { month: '2026-09', missed: 0 }, { month: '2026-10', missed: 1 }],
    episodes: [
      {
        id: 'e1', start: '2021-04-12', end: '2021-05-02', hospital: '市一院',
        signs: '新发双侧颞部头痛、头皮压痛明显', labsNote: 'ESR 88 mm/h、CRP 56 mg/L（当时化验原件未存，口头转述）',
        treatment: '住院甲泼尼龙静脉治疗后改口服（医生处置原文大意）', actionPlan: null,
        note: '第一次发作，当时不知道这就是 GCA 活动', visibility: 'shared',
      },
      {
        id: 'e2', start: '2023-02-10', end: '2023-02-24', hospital: '区中心医院',
        signs: '头痛复发伴下颌跛行（嚼东西咬不动）', labsNote: 'ESR 76 mm/h',
        treatment: '激素加量口服；医生调整减量节奏（原文大意）', actionPlan: '医生给的计划原文：若再次出现头痛明显加重或看东西模糊，当天联系风湿科值班电话，不要等到复诊',
        note: '这次记住了先打电话', visibility: 'shared',
      },
      {
        id: 'e3', start: '2025-01-18', end: '2025-01-27', hospital: '市一院',
        signs: '右眼一过性视物模糊，半小时自行缓解（按医生要求当日就诊）', labsNote: 'CRP 47 mg/L',
        treatment: '医生安排加用托珠单抗（2025-02-20 起，医嘱原文见用药）', actionPlan: '同上次医生计划（2023-02 记录）；另嘱：视力症状再发当日就诊',
        note: '视力症状这次及时去了医院', visibility: 'shared',
      },
      {
        id: 'e4', start: '2026-04-30', end: '2026-05-12', hospital: '市一院',
        signs: '肩髋晨僵加重（PMR 症状）伴低热', labsNote: 'ESR 34 mm/h、CRP 21 mg/L',
        treatment: '门诊调整激素后好转；医生调了复查节奏', actionPlan: '同上次医生计划（2023-02 记录）',
        note: '', visibility: 'shared',
      },
    ],
    symptoms: [
      { date: '2026-10-05', headache: 2, stiffness: 2, scalp: false, jaw: false, vision: false, note: '晨僵半小时，活动后好' },
      { date: '2026-09-18', headache: 3, stiffness: 2, scalp: true, jaw: false, vision: false, note: '' },
      { date: '2026-08-22', headache: 5, stiffness: 3, scalp: true, jaw: true, vision: false, note: '颞部跳痛，嚼东西发酸' },
      { date: '2026-07-11', headache: 2, stiffness: 1, scalp: false, jaw: false, vision: true, note: '一过性视物模糊，当天按医生要求就诊' },
      { date: '2026-06-09', headache: 4, stiffness: 3, scalp: false, jaw: false, vision: true, note: '午后视物模糊数分钟，医生让记录下来' },
      { date: '2026-05-16', headache: 1, stiffness: 2, scalp: false, jaw: false, vision: false, note: '' },
    ],
    screening: [
      { type: 'us_temporal', date: '2026-03-11', result: '颞动脉超声：右颞动脉晕环较前对照变薄（报告原文）', detail: '按医生节奏复查，未判读' },
      { type: 'cta', date: '2025-06-18', result: 'CTA：升主动脉及主动脉弓管壁增厚较前相仿（报告原文）', detail: '大血管评估，医生安排时做' },
      { type: 'petct', date: null, result: null, detail: '医生已安排，待做' },
      { type: 'pmr_followup', date: '2026-04-30', result: '风湿科 PMR 随访：晨僵情况记录（就诊记录抄录）', detail: '医生说按他的节奏复查' },
    ],
    questions: [
      { id: 'q1', text: '激素还要吃多久？减量节奏怎么定？', done: false },
      { id: 'q2', text: '打完托珠单抗有点发热要紧吗？', done: false },
      { id: 'q3', text: '阿司匹林和我的其他药要错开吃吗？', done: false },
      { id: 'q4', text: '这次颞动脉超声结果和上次比怎么样？', done: true },
    ],
    documents: [
      { id: 'd1', name: '2026-03 颞动脉超声.pdf', date: '2026-03-11', parsed: true },
      { id: 'd2', name: '2025-06 CTA.pdf', date: '2025-06-18', parsed: true },
      { id: 'd3', name: '2025-01 出院小结.pdf', date: '2025-01-27', parsed: false },
    ],
    trials: [
      { id: 't1', title: '【虚构示例】GCA 长期随访观察研究', source: 'ictrp', phase: '观察性', status: '登记状态，未核实', area: '广州', fictional: true },
      { id: 't2', title: '【虚构示例】GCA 复发频率与托珠单抗研究', source: 'ctgov', phase: '登记', status: '登记状态，未核实', area: '北京', fictional: true },
    ],
    pathway: [
      {
        d: '2018-09-18', phase: '确诊并开始激素', text: '颞部头痛伴头皮压痛，超声与活检后确诊，开始泼尼松',
        detail: {
          regimen: { summary: '泼尼松 55 mg 每日 1 次（晨服）', items: [['药名', '泼尼松片'], ['剂量原文', '55 mg 每日 1 次（晨服）'], ['获批状态', '未核实']] },
          metrics: { summary: '确诊时 ESR 92 mm/h、CRP 61 mg/L', items: [['2018-09 ESR', '92 mm/h'], ['2018-09 CRP', '61 mg/L']] },
          imaging: { summary: '颞动脉超声：右颞动脉低回声晕环（halo 征）', items: [['报告原文', '右颞动脉管壁低回声晕环']] },
          ae: { summary: '无记录', items: [['说明', '无记录']] },
          support: { summary: '无记录', items: [['说明', '无记录']] },
        },
      },
      {
        d: '2023-02-10', phase: '第一次发作', text: '头痛复发伴下颌跛行，激素加量后缓解',
        detail: {
          regimen: { summary: '激素加量（医嘱原文见调药记录）', items: [['方案', '泼尼松加量，医生原文照录']] },
          metrics: { summary: 'ESR 76 mm/h、CRP 39 mg/L', items: [['说明', '当时化验原件未留存，只有口头转述']] },
          imaging: { summary: '住院期间颞动脉超声', items: [['说明', '报告未存档']] },
          ae: { summary: '无新增', items: [['说明', '无记录']] },
          support: { summary: '"医生给了发作时的电话"', items: [['患者原话', '这次医生给了值班电话，心里踏实多了']] },
        },
      },
      {
        d: '2025-02-20', phase: '加用托珠单抗', text: '视力症状发作后，医生安排加用托珠单抗',
        detail: {
          regimen: { summary: '托珠单抗 162 mg 皮下注射 每周 1 次【待核】', items: [['药名', '托珠单抗注射液'], ['剂量原文', '162 mg 皮下注射 每周 1 次'], ['获批状态', '未核实']] },
          metrics: { summary: '发作时 CRP 47 mg/L，加用后 1 个月 12 mg/L', items: [['发作时 CRP', '47 mg/L'], ['1 个月后 CRP', '12 mg/L']] },
          imaging: { summary: 'CTA：主动脉管壁增厚较前相仿', items: [['报告原文', '升主动脉及主动脉弓管壁增厚较前相仿']] },
          ae: { summary: '注射当晚低热', items: [['记录', '注射当晚低热，次日自行缓解']] },
          support: { summary: '"记下来就不慌"', items: [['患者原话', '把每次的数记下来，去医院就不慌了']] },
        },
      },
      {
        d: '2026-03-11', phase: '影像复查与化验评估', text: '按医生节奏复查颞动脉超声与化验',
        detail: {
          regimen: { summary: '维持原用药', items: [['方案', '未变更']] },
          metrics: { summary: 'ESR 24 mm/h、CRP 8 mg/L', items: [['2026-03 ESR', '24 mm/h'], ['2026-03 CRP', '8 mg/L']] },
          imaging: { summary: '颞动脉超声：晕环较前对照变薄', items: [['报告原文', '右颞动脉晕环较前对照变薄（未判读）']] },
          ae: { summary: '无新增', items: [['说明', '无记录']] },
          support: { summary: '"记下来就不慌"', items: [['患者原话', '把每次的数记下来，去医院就不慌了']] },
        },
      },
    ],
  }
}

/** 纯函数：被 import 时只返回数据，不写盘。 */
export function buildDemoProfiles() {
  const A = buildProfileA()
  const B = buildProfileB()
  A.labs = makeLabs('A', 20241101, {
    esr: [76, 52], crp: [68, 31], hb: [118, 124], plt: [383, 331],
    alt: [28, 26], fbg: [5.2, 5.6], sbp: [138, 132], dbp: [82, 78],
  }, MONTHS_A)
  B.labs = makeLabs('B', 20241102, {
    esr: [38, 33, 29, 26, 24, 25], crp: [14, 11, 9, 8, 7, 8],
    hb: [124, 126, 127, 125, 126, 127], plt: [260, 248, 240, 246, 251, 247],
    alt: [30, 34, 42, 38, 35, 36], fbg: [6.1, 5.8, 6.3, 6.0, 5.9, 6.1],
    sbp: [136, 132, 130, 134, 131, 133], dbp: [80, 78, 77, 80, 79, 78],
  }, MONTHS_B)
  /* 补齐读模型会返回、而上面手写数据里想省掉的列（形状由 demo-data 决定）。 */
  for (const p of [A, B]) {
    p.comorbidity = p.comorbidity.map((c) => ({ ...c, dept: c.dept ?? null, visibility: c.visibility ?? 'shared' }))
    p.meds = p.meds.map((m) => ({ ...m, inUse: m.inUse ?? true }))
    p.symptoms = p.symptoms.map((x) => ({ ...x, visibility: x.visibility ?? 'shared' }))
    p.episodes = (p.episodes ?? []).map((x) => ({ ...x, end: x.end ?? null, actionPlan: x.actionPlan ?? null, visibility: x.visibility ?? 'shared' }))
    p.screening = p.screening.map((x) => ({ ...x, sectionTitle: x.sectionTitle ?? screeningTitle(x.type) }))
    p.documents = p.documents.map((d) => ({ ...d, parseState: d.parseState ?? (d.parsed ? 'parsed' : 'unparsed') }))
  }
  return [A, B]
}

/* ------------------------------- 产物 1：ESM ------------------------------- */
const HEADER = `/* 由 demo/build-demo-data.mjs 生成，勿手改。重跑：npm run demo:data */\n`

/* 快照元信息（设置 · 临床数据库 tab 与临床页卡头共用的同一口径，读 research/gca/manifest）。
   relevant = 标题/研究类型里含本病关键词的条数——「已载 N」不等于「相关 N」，两数分开写。 */
function snapshotMetaFromManifest() {
  const manifestPath = join(ROOT, 'research', 'gca', 'manifest.json')
  if (!existsSync(manifestPath)) return null
  try {
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'))
    let relevant = null
    try {
      const lines = readFileSync(join(ROOT, 'research', 'gca', 'trials-2026.jsonl'), 'utf8').split('\n').filter(Boolean)
      const RE = /巨细胞动脉炎|giant cell arteritis|temporal arteritis|horton|血管炎|\bGCA\b/i
      relevant = lines.filter((l) => { try { return RE.test(JSON.parse(l).title || '') } catch { return false } }).length
    } catch { relevant = null }
    return {
      snapshotDate: m.snapshotDate ?? null,
      recordCount: m.recordCount ?? null,
      relevant,
      sources: (m.sourceStates ?? []).map((s) => ({ id: s.source_id, state: s.state, queried: s.queried ?? null })),
      honestyNote: m.honesty?.queriedMeaning ?? '只有 SUCCESS 与 NO_RESULTS 表示该来源真的被查询并给出答案；其余终态不代表「没有试验」',
    }
  } catch { return null }
}

export function renderDemoModule(profiles, snapshotMeta) {
  const trialMatch = Object.fromEntries(profiles.map((p) => [
    p.key,
    matchAll((p.trials ?? []).map((t) => ({ ...t, criteria: criteriaOf(t) })), factsOf(p)),
  ]))
  const payload = JSON.stringify({ generatedAt: 'fixed-for-reproducibility', profiles, trialMatch, snapshotMeta: snapshotMeta ?? null }, null, 2)
  return `${HEADER}(function (root) {\n  const DEMO = ${payload}\n  root.DEMO = DEMO\n})(typeof window !== 'undefined' ? window : globalThis)\n`
}

/* ------------------------------ 产物 2：SQLite ----------------------------- */
/* 用真实 schema + 真实播种器。dsh/demo.js 在 M3 接入；缺席时跳过并如实输出 skipped。 */
export async function buildDemoDatabase(file, profiles) {
  if (!existsSync(join(ROOT, 'dsh/demo.js'))) {
    return { skipped: 'dsh/demo.js 未就绪（M3 接入后产出演示库）' }
  }
  const { DatabaseSync } = await import('node:sqlite')
  const { readdirSync, readFileSync } = await import('node:fs')
  const { seedDemo } = await import('../dsh/demo.js')
  mkdirSync(dirname(file), { recursive: true })
  /* 连 -wal/-shm 一起清：只删主文件时旧 WAL 会在重开后回放旧 schema（实测踩过）。 */
  try { rmSync(file, { force: true }); rmSync(file + '-wal', { force: true }); rmSync(file + '-shm', { force: true }) } catch { /* 首次构建 */ }
  const db = new DatabaseSync(file)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA journal_mode = WAL')
  const dir = join(ROOT, 'schema')
  for (const name of readdirSync(dir).filter((x) => /^\d{4}_[a-z0-9_]+\.sql$/.test(x)).sort()) {
    db.exec(readFileSync(join(dir, name), 'utf8'))
  }
  try {
    seedDemo(db, profiles)
  } finally {
    db.close()
  }
  return { ok: true }
}

async function main() {
  const profiles = buildDemoProfiles()
  const jsOut = join(ROOT, 'prototypes/v0.2/demo-data.js')
  const dbOut = join(ROOT, 'demo/demo-data.sqlite')
  mkdirSync(dirname(jsOut), { recursive: true })
  writeFileSync(jsOut, renderDemoModule(profiles, snapshotMetaFromManifest()))
  const dbResult = await buildDemoDatabase(dbOut, profiles)
  console.log(JSON.stringify({ ok: true, js: jsOut, db: dbOut, dbResult, profiles: profiles.length }, null, 2))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
