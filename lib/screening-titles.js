/* 筛查随访与影像复查的分节定义 —— 唯一来源（gca-workbench GCA 版）。
 * 播种、读模型、演示数据三处共用；顺序即库里 ord 的顺序。
 * GCA 边界：共病 PMR 与视力随访条目只以「医生已安排的随访」口径呈现，无判读。 */
export const SCREENING_KEYS = Object.freeze(['us_temporal', 'biopsy', 'cta', 'petct', 'pmr_followup'])

export const SCREENING_TITLES = Object.freeze({
  us_temporal: '颞动脉超声（晕轮征 halo sign）',
  biopsy: '颞动脉活检（医生安排时）',
  cta: 'CTA / MRA（大血管成像）',
  petct: 'PET-CT（医生安排时）',
  pmr_followup: 'PMR 随访（医生已安排）',
})

export function screeningTitle(key) {
  return SCREENING_TITLES[key] ?? key
}
