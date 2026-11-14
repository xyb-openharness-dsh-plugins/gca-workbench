/* 36 号 · 疾病概要数据（window.DISEASE_PRIMER）—— gca-workbench GCA 版
 *
 * 内容口径：
 *   - 四段固定顺序 definition → evidence → landscape → trend，缺段不删；
 *   - 病种内容只写本仓 README 与 docs/ 已写明的说法，不写判定、不复制指南条文；
 *     非肿瘤固定出口「按受累器官与病情轻重排列」；
 *   - 指南链接按「官方指南页 / 期刊全文页 / 未取得原件」三态如实标注；
 *   - 未核实的数字一律【待核】，链接本版尚未跑 verify-links 脚本逐条验活——如实标注「待验活」。
 */
window.DISEASE_PRIMER = {
  brand: '小脉宝 GcaPal（品牌占位）',
  name: '巨细胞动脉炎',
  en: 'Giant Cell Arteritis（GCA）',
  updated: '2026-11-14',
  sections: [
    {
      id: 'definition',
      title: '定义',
      intro: '巨细胞动脉炎（Giant Cell Arteritis，GCA）是 50 岁以上发病的大/中血管肉芽肿性血管炎，颅动脉（颞动脉）受累为主，常见表现为新发头痛、头皮压痛、下颌跛行与视力症状；可合并风湿性多肌痛（PMR）。本工作台围绕化验（ESR/CRP 等）、发作与缓解、影像复查、症状与共病监测整理病程记录。',
      points: [
        '本台面向已确诊 GCA 的成人患者本人，家属照护者可选用同一套记录（含代记）。',
        '化验按每张化验单自带的方法、单位与机构分组——不同方法/机构不合并、不连线、不做差；ESR 参考上限 30【待核】、方法 Westergren，CRP 参考 <10【待核】。',
        '发作（flare）作为独立功能线记录区间事实；头痛、头皮压痛、下颌跛行、晨僵按天记录，与同日化验只并列、不推断。',
        '视力预警（新发视力下降/黑朦/复视）只记录与提醒「当日就医」，本台不做判读、不给分诊结论。',
        '本段只写仓内已写明的疾病事实；不复制指南条文、不做定义或分期判定。',
      ],
      sources: [
        { org: '本仓 README', doc: '疾病概要 · 定义', version: '0.1.0', nolink: true, note: '仓内文档，无公开 URL' },
        { org: '本仓 docs/research/medical-topics.md', doc: '医学约束研究（2026-11-14）', nolink: true, note: '仓内文档；罕见病目录收录序号 35【待核：以官方目录原件为准】' },
      ],
    },
    {
      id: 'evidence',
      title: '医学资料规范和指南情况',
      intro: '本台把可公开点开的指南页 / 期刊全文页与「未取得原件」分开标注；不写页码、不复制条文，也不把栏目页冒充原件。',
      table: {
        head: ['机构', '文件', '版本 / 年份', '原件', '本台用途'],
        rows: [
          [
            'EULAR（欧洲抗风湿病联盟）',
            'Large vessel vasculitis management recommendations（大血管炎管理建议）',
            '2018（后续更新【待核】）',
            {
              text: '期刊全文页（ARD）',
              kind: 'fulltext',
              url: 'https://ard.bmj.com/content/77/12/1736',
              note: 'Annals of the Rheumatic Diseases；公开全文页，本仓未存 PDF（待验活）',
            },
            '国际口径的治疗手段与随访背景',
          ],
          [
            'Vasculitis Foundation（血管炎基金会）',
            'Giant Cell Arteritis 患者教育页',
            '持续更新',
            {
              text: '官方患者教育页',
              kind: 'hub',
              url: 'https://www.vasculitisfoundation.org/education/forms/giant-cell-arteritis/',
              note: '官方页；本仓未取得原件（患者教育口径，待验活）',
            },
            '患者教育口径并列引用（不采频率数字进界面）',
          ],
          [
            'ClinicalTrials.gov',
            'Giant Cell Arteritis 公开检索入口',
            '实时',
            {
              text: '官方检索入口页',
              kind: 'hub',
              url: 'https://clinicaltrials.gov/search?cond=Giant%20Cell%20Arteritis',
              note: 'ClinicalTrials.gov 官方检索入口；非原件（待验活）',
            },
            '临床试验检索词口径：giant cell arteritis / temporal arteritis / Horton disease / vasculitis / tocilizumab',
          ],
          [
            '国家卫生健康委员会等',
            '罕见病目录（收录 GCA，序号 35）',
            '【待核】',
            {
              text: '官方原件未取得',
              nolink: true,
              note: '官方目录原件未取得；序号 35 为待核口径，据二次来源',
            },
            '罕见病目录收录事实（待核）',
          ],
        ],
      },
      sources: [
        { org: 'EULAR', doc: 'Large vessel vasculitis management recommendations（2018）', original: true, kind: 'fulltext', url: 'https://ard.bmj.com/content/77/12/1736', note: '期刊全文页；本仓未存 PDF（待验活）' },
        { org: 'Vasculitis Foundation', doc: 'Giant Cell Arteritis 患者教育页', original: false, secondaryUrl: 'https://www.vasculitisfoundation.org/education/forms/giant-cell-arteritis/', note: '官方患者教育页（hub），原件未取得' },
        { org: 'ClinicalTrials.gov', doc: 'Giant Cell Arteritis 公开检索入口', original: false, secondaryUrl: 'https://clinicaltrials.gov/search?cond=Giant%20Cell%20Arteritis', note: '官方检索入口页（hub），非原件' },
        { org: '国家卫生健康委员会等', doc: '罕见病目录（序号 35【待核】）', nolink: true, note: '官方原件未取得，序号待核' },
      ],
    },
    {
      id: 'landscape',
      title: '目前治疗全景概要',
      intro: '以下只写本仓文档里已经写明的手段与记录范围，按受累器官与病情轻重排列；不排序、不比优劣。',
      groups: [
        {
          label: '随访与监测（本仓文档已写明）',
          points: [
            '化验定期复查（常用 ESR、CRP、血常规，激素治疗期间监测 ALT 与空腹血糖、血压）；复查节奏由主诊医生确定，本台只按起点与间隔显示参考节点，不排计划、不发提醒。',
            '影像复查（颞动脉超声「晕轮征 halo sign」、CTA/MRA/PET-CT、颞动脉活检）按医生安排记录；本台不做血管受累进展判读。',
            '共病 PMR（风湿性多肌痛）只呈现「医生已安排的随访」，本台不做共病判读。',
          ],
        },
        {
          label: '症状与日常记录',
          points: [
            '头痛、头皮压痛、下颌跛行、晨僵没有客观指标可替代，本台按天记录强度与影响，不换算成评分结论。',
            '发作（新发头痛加重、视力症状等）只记录已发生事实与医生行动计划原文；发作判定与处理归医生。',
            '视力预警只记录与提醒「当日就医」，不做判读、不给分诊结论。',
          ],
        },
        {
          label: '用药与治疗手段',
          points: [
            '用药只留医生医嘱原文（药名、剂量、频次、起止）；泼尼松/泼尼松龙起始 40–60 mg/d【待核】，按医嘱阶梯减量，mg/d 按日期记录；本台不给用药建议。',
            '托珠单抗（tocilizumab，皮下 162 mg 每周或隔周【待核】）与小剂量阿司匹林（医生安排）均以医嘱原文呈现，不做指征判断。',
          ],
        },
      ],
      points: [
        '以上是文献与指南里列出的手段与记录范围，按受累器官与病情轻重排列，不代表任何一项适合你。选哪一个，这一句需要问你的医生。',
      ],
      sources: [
        { org: '本仓 docs/SPEC.md', doc: '项目规格 §问题、用户与最小闭环', nolink: true, note: '仓内文档，无公开 URL' },
        { org: '本仓 docs/CLINICAL-DATA.md', doc: '医学约束与临床数据台账 · 随访与筛查条目', nolink: true, note: '仓内文档；节律与剂量数字一律【待核】' },
        { org: '本仓 docs/research/medical-topics.md', doc: '医学约束研究（2026-11-14）', nolink: true, note: '仓内文档，无公开 URL' },
      ],
    },
    {
      id: 'trend',
      title: '发展趋势',
      intro: '只记已发生的事实与日期，不预测、不评价。',
      points: [
        '本仓尚未采集 GCA 临床试验快照：ClinicalTrials.gov 以 query.cond=giant cell arteritis 的实测计数暂缺【待核：M4 阶段真实快照回填】；其余来源通道未查过。',
        '检索词口径：giant cell arteritis / temporal arteritis / Horton disease / vasculitis / tocilizumab；检索入口见「医学资料规范和指南情况」段的 ClinicalTrials.gov 官方检索页。',
        '本台不做化验分级、不生成疾病活动度或预后评分（活动度评分类工具是医生的判定工具）。',
        '药物研发进展（托珠单抗等）见 ClinicalTrials.gov 公开检索入口（国际口径）；本台不判断哪些适合你。',
        '指南链接逐条验活脚本尚未跑，标注「待验活」。',
      ],
      sources: [
        { org: '本仓 docs/CLINICAL-DATA.md', doc: '临床试验线 · 快照口径（M4 回填）', nolink: true, note: '仓内文档，无公开 URL；快照计数待真实采集' },
        { org: 'ClinicalTrials.gov', doc: 'Giant Cell Arteritis 检索页', original: false, secondaryUrl: 'https://clinicaltrials.gov/search?cond=Giant%20Cell%20Arteritis', note: '公开检索入口；与上述检索词口径一致' },
        { org: '本仓 docs/research/medical-topics.md', doc: '医学约束研究（2026-11-14）', nolink: true, note: '仓内文档，无公开 URL' },
      ],
    },
  ],
}
