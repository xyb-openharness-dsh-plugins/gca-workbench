/* 小脉宝 GcaPal（品牌占位）· GCA 原型 app.js（file:// 直接可开，无构建、无 ESM import） */
(function () {
  'use strict'
  const DEMO = window.DEMO
  const VERSION = '__VERSION_DISPLAY__'
  const EVT_DRAFT = 'gca:agent-draft'

  const NAV = [
    { id: 'dashboard', label: '看板', subs: [['overview', '今日概览'], ['next', '接下来'], ['changes', '最近变化']] },
    { id: 'basics', label: '我的病底', subs: [['diagnosis', '诊断与检查'], ['imaging', '影像复查'], ['comorbidity', '共病档案']] },
    { id: 'episodes', label: '发作与缓解', subs: [['list', '发作记录'], ['timeline', '时间线']] },
    { id: 'treatment', label: '用药', subs: [['current', '当前用药'], ['pathway', '激素阶梯'], ['sideeffects', '副作用']] },
    { id: 'labs', label: '化验', subs: [['cards', '指标卡'], ['chart', '一图秀'], ['refs', '参考区间说明']] },
    { id: 'symptoms', label: '症状', subs: [['headache', '头痛'], ['stiffness', '晨僵'], ['log', '我的记录'], ['impact', '影响与预警']] },
    { id: 'screening', label: '影像与随访', subs: [['ultrasound', '颞动脉超声'], ['biopsy', '颞动脉活检'], ['cta', 'CTA / MRA'], ['petct', 'PET-CT'], ['pmr', 'PMR 随访']] },
    { id: 'followup', label: '复查节奏', subs: [['cadence', '节奏卡'], ['prep', '就诊准备'], ['todos', '待办与问题']] },
    { id: 'records', label: '报告与资料', subs: [['import', '导入'], ['files', '原件'], ['export', '导出']] },
    { id: 'trials', label: '临床研究', subs: [['search', '检索'], ['saved', '收藏'], ['sources', '来源说明']] },
  ]

  /* 参考区间只来自「化验单自带」的原文：缺上限就如实写「单据未印上限」，
     绝不用通用值补、不做分级、不给判读结论（GCA 非肿瘤红线）。 */
  const LABELS = { ESR: '血沉 ESR', CRP: 'C反应蛋白 CRP', Hb: '血红蛋白 Hb', PLT: '血小板 PLT', ALT: '丙氨酸氨基转移酶 ALT', FBG: '空腹血糖 FBG', SBP: '收缩压 SBP', DBP: '舒张压 DBP' }
  const UNITS = { ESR: 'mm/h', CRP: 'mg/L', Hb: 'g/L', PLT: '10⁹/L', ALT: 'U/L', FBG: 'mmol/L', SBP: 'mmHg', DBP: 'mmHg' }

  /* 一图秀的配色：**每个指标固定一个颜色**，选择变了颜色也不变——
     否则用户换个勾选，ESR 从绿变橙，会以为看的是另一条线。 */
  const CHART_COLORS = {
    ESR: '#5C6B3C', CRP: '#A8681E', Hb: '#3C5A6B',
    PLT: '#8A4B6B', ALT: '#4B6B8A', FBG: '#6B8A4B',
    SBP: '#B0563C', DBP: '#5B7C99',
  }

  /* 指标系列：卡片**按系列分组、组内按临床关注度排序**，不按化验单上的印刷顺序。
     为什么必须分组：同一张单子上 ESR 与 Hb 相邻，但一个是炎症活动、一个是血象，
     平铺一排会让患者以为它们可比。系列之间永不加总、永不换算。 */
  const METRIC_SERIES = [
    { key: 'inflam', title: '炎症活动指标', hint: 'GCA 的核心线：看趋势，不看单点', codes: ['ESR', 'CRP'] },
    { key: 'hemogram', title: '血象', hint: '长期病程与合并症情境用', codes: ['Hb', 'PLT'] },
    { key: 'steroid', title: '激素监测', hint: '激素治疗期间按医生安排复查', codes: ['ALT'] },
    { key: 'metabolic', title: '激素副作用监测', hint: '血糖与血压按医生安排记录', codes: ['FBG'] },
    { key: 'vital', title: '血压', hint: '激素副作用监测情境用', codes: ['SBP', 'DBP'] },
  ]

  /* 组内序号：让"有序"是看得见的，而不是只存在于代码注释里 */
  const SERIES_ORD = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

  /* ------------------------------ 工具 ------------------------------ */
  const $ = (s, r) => (r || document).querySelector(s)
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s))
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  /* 文字型结果（`<5`、`阴性`、`未检出`）必须变成 null，不能变成 NaN：
     NaN 一路传进展示会算出 NaN 倍数 —— 界面上就是一片错误值。 */
  const num = (v) => {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const pct = (v) => (v == null ? '—' : String(Math.round(v * 10) / 10))

  /* 参考区间标注：只做「有/没有」的陈列，不做分级、不做判读（缺上限 → noHigh，绝不用通用上限补） */
  function refOf(item) {
    if (item.refHigh == null && item.refLow == null) return { state: 'none', reason: 'no-ref' }
    if (item.refHigh == null) return { state: 'noHigh', reason: 'no-ref-high' }
    return { state: 'withRef', refLow: item.refLow, refHigh: item.refHigh }
  }

  /* Fritsch–Carlson 单调三次插值：保证不越过相邻数据点（一图秀硬要求） */
  function smoothPath(pts) {
    const n = pts.length
    if (n < 2) return ''
    const dx = [], m = []
    for (let i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1].x - pts[i].x
      m[i] = dx[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx[i]
    }
    const t = new Array(n)
    t[0] = m[0]
    t[n - 1] = m[n - 2]
    for (let i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) t[i] = 0
      else {
        const w1 = 2 * dx[i] + dx[i - 1]
        const w2 = dx[i] + 2 * dx[i - 1]
        t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i])
      }
    }
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 0; i < n - 1; i++) {
      const x1 = pts[i].x + dx[i] / 3
      const y1 = pts[i].y + (t[i] * dx[i]) / 3
      const x2 = pts[i + 1].x - dx[i] / 3
      const y2 = pts[i + 1].y - (t[i + 1] * dx[i]) / 3
      d += ` C ${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`
    }
    return d
  }

  function seriesFor(profile, code) {
    return profile.labs
      .map((r) => {
        const it = r.items.find((x) => x.code === code)
        return it ? { date: r.date, value: num(it.value), refHigh: it.refHigh, refLow: it.refLow, unit: it.unit, lab: it.lab } : null
      })
      .filter(Boolean)
  }

  /* ------------------------------ 状态 ------------------------------ */
  const state = {
    view: 'dashboard',
    sub: 'overview',
    profileKey: 'A',
    agentOpen: true,
    agentWidth: 35,
    page: null,
    draft: { headache: 5, stiffness: 2, scalp: false, jaw: false, vision: false, note: '' },
    localSymptoms: [],
    chartModal: false,
    /* 一图秀选中的指标：默认三条线（炎症两条 + 血红蛋白）。放在 state 里，切页签再回来不丢。 */
    chartCodes: ['ESR', 'CRP', 'Hb'],
    /* 匹配结果：null = 还没跑过（不显示空表，显示"跑一次"） */
    trialMatch: null,
  }
  const profile = () => DEMO.profiles.find((p) => p.key === state.profileKey)
  const allSymptoms = () => state.localSymptoms.concat(profile().symptoms).sort((a, b) => (a.date < b.date ? 1 : -1))
  /* 私密三出口共用同一过滤（看板摘要 / 导出预览 / AI 上下文）：
     visibility === 'private' 的记录不进任何对外出口；本机「我的记录」仍对自己可见。 */
  const sharedOnly = (list) => list.filter((x) => x && x.visibility !== 'private')

  /* ------------------------------ 顶栏 / 导航 ------------------------------ */
  function renderShell() {
    $('#version-chip').textContent = VERSION + ' · 原型'
    $('#footer-built').textContent = '原型 ' + VERSION
    $('#footer-profile').textContent = profile().label
    const nav = $('#sidenav')
    nav.innerHTML = NAV.map((n) => `<button class="nav-item" data-view="${n.id}" ${n.id === state.view ? 'aria-current="page"' : ''}><span class="dot"></span>${esc(n.label)}</button>`).join('')
    const cur = NAV.find((n) => n.id === state.view)
    $('#subtabs').innerHTML = cur.subs.map(([id, label]) => `<button class="subtab" role="tab" data-sub="${id}" aria-selected="${id === state.sub}">${esc(label)}</button>`).join('')
  }

  /* ------------------------------ 视图路由 ------------------------------ */
  const VIEWS = {
    'dashboard/overview': vDashboardOverview,
    'dashboard/next': vDashboardNext,
    'dashboard/changes': vDashboardChanges,
    'basics/diagnosis': vBasicsDiagnosis,
    'basics/imaging': vBasicsImaging,
    'basics/comorbidity': vBasicsComorbidity,
    'treatment/current': vTreatmentCurrent,
    'treatment/pathway': vTreatmentPathway,
    'treatment/sideeffects': vTreatmentSide,
    'labs/cards': vLabsCards,
    'labs/chart': vLabsChart,
    'labs/refs': vLabsRefs,
    'symptoms/headache': vSymptomHeadache,
    'symptoms/stiffness': vSymptomStiffness,
    'symptoms/log': vSymptomLog,
    'symptoms/impact': vSymptomImpact,
    'screening/ultrasound': () => vScreeningType('us_temporal', '颞动脉超声（晕轮征 halo sign）', '颞动脉超声记录；只抄报告原文与医生安排的复查节奏，不做判读。'),
    'screening/biopsy': () => vScreeningType('biopsy', '颞动脉活检（医生安排时）', '活检结果原话记录；不做诊断判读。'),
    'screening/cta': () => vScreeningType('cta', 'CTA / MRA（大血管成像）', '大血管影像记录；显示距上次的月数，不替你决定何时复查。'),
    'screening/petct': () => vScreeningType('petct', 'PET-CT（医生安排时）', 'PET-CT 记录原话；不做判读。'),
    'screening/pmr': () => vScreeningType('pmr_followup', 'PMR 随访（医生已安排）', '风湿性多肌痛（PMR）随访记录；只呈现「医生已安排的随访」，不做共病判读。'),
    'episodes/list': vEpisodesList,
    'episodes/timeline': vEpisodesTimeline,
    'followup/cadence': vFollowupCadence,
    'followup/prep': vFollowupPrep,
    'followup/todos': vFollowupTodos,
    'records/import': vRecordsImport,
    'records/files': vRecordsFiles,
    'records/export': vRecordsExport,
    'trials/search': vTrialsSearch,
    'trials/saved': vTrialsSaved,
    'trials/sources': vTrialsSources,
  }

  function render() {
    renderShell()
    const fn = VIEWS[state.view + '/' + state.sub] || (() => '<div class="card">这一页还没实现</div>')
    try {
      $('#view').innerHTML = fn()
    } catch (error) {
      /* 单个视图算错不能让整块业务区变空白：空白看起来就是"没有界面"，
         而且看不出是哪条数据缺了。把原因写出来，数据本身一条都没动。 */
      $('#view').innerHTML = `<div class="card">
        <div class="card-head"><span class="card-title">这一页没能画出来</span></div>
        <p class="muted">${esc(error && error.message ? error.message : '未知错误')}</p>
        <p class="muted">资料还在你自己的资料库里，没有丢。可以先切到别的页，或重新打开工作台。</p>
      </div>`
    }
    bindViewEvents()
  }

  /* ------------------------------ hash 路由（#view/sub） ------------------------------
   * 视图切换仍以 state.view/state.sub + render() 为准；hash 只做入口与同步：
   * 手输 / 深链 '#episodes/list' 直达对应子页；导航点击把当前视图写回 hash。
   * 非法 hash 不劫持：整页视图 '#page-view' 与整页深链 '#page=labs' 都不是子页路由。 */
  function applyHash() {
    const h = (location.hash || '').replace(/^#/, '')
    if (!h || h === 'page-view' || h.startsWith('page=')) return
    if (VIEWS[h]) {
      const i = h.indexOf('/')
      state.view = i < 0 ? h : h.slice(0, i)
      if (i < 0) {
        const nav = NAV.find((n) => n.id === h)
        state.sub = nav ? nav.subs[0][0] : state.sub
      } else {
        state.sub = h.slice(i + 1)
      }
      render()
    }
  }
  function syncHash() {
    const h = '#' + state.view + '/' + state.sub
    if (location.hash !== h) { try { location.hash = h } catch (e) { /* 个别环境拒绝写 hash */ } }
  }
  window.addEventListener('hashchange', applyHash)

  /* ------------------------------ 公用片段 ------------------------------ */
  function aiButton(prompt, ctxLabel) {
    return `<button class="btn ghost small" type="button" data-draft="${esc(prompt)}" data-ctx="${esc(ctxLabel || '')}">AI 帮我填</button>`
  }
  /* 本机今天的 YYYY-MM-DD。不用 toISOString().slice(0,10)：那是 UTC 日期，
     东八区凌晨会退成前一天，患者记的"今天"就落到昨天去了。 */
  function localToday() {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
  }
  /* 锚点派生：状态卡大字只从"开始用药日"算，不手填天数。 */
  function daysSince(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date(localToday() + 'T00:00:00')
    return Math.max(0, Math.round((today - d) / 86400000))
  }
  /* 接下来的参考节点：从「开始用药日」（没记就用确诊日）按 6 个月网格往后推，
     只取落在今天之后的。以前首页把 2026-11-08 写死 —— 写死的日期过一个月就是错的，
     而它看起来像真的；「接下来」那个页签也就只能列出已经过去的节点。
     count 默认 1（状态卡只要最近那个）。 */
  function upcomingCadenceNodes(p, count) {
    const anchor = p.startedAt || p.diagnosedAt || ''
    const start = new Date(anchor + 'T00:00:00')
    if (!anchor || Number.isNaN(start.getTime())) return []
    const today = new Date(localToday() + 'T00:00:00')
    const out = []
    for (let months = 6; months <= 240 && out.length < (count || 1); months += 6) {
      const d = new Date(start.getTime())
      const day = d.getDate()
      d.setMonth(d.getMonth() + months)
      if (d.getDate() < day) d.setDate(0) // 月末夹取：1/31 + 1 月 = 2 月末
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const days = Math.round((d - today) / 86400000)
      if (days > 0) out.push({ date: iso, days, months })
    }
    return out
  }
  function nextCadenceNode(p) {
    return upcomingCadenceNodes(p, 1)[0] || null
  }
  function kv(k, v, n) {
    return `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${v}</span>${n ? `<span class="n">${esc(n)}</span>` : ''}</div>`
  }
  function badgeFor(item) {
    const r = refOf(item)
    if (r.state === 'noHigh') return '<span class="badge needs">单据未印上限</span>'
    if (r.state === 'none') return '<span class="badge">无参考值</span>'
    return `<span class="badge ok">有参考区间 · ${r.refLow}–${r.refHigh}（单据原文）</span>`
  }

  /* ------------------------------ 看板 ------------------------------ */

  function miniInflamPoints(p) {
    const rows = []
    for (const r of p.labs) { const it = r.items.find((x) => x.code === 'CRP'); if (it && it.refHigh) rows.push({ d: r.date, v: it.value / it.refHigh }) }
    if (!rows.length) return '<text x="10" y="35" font-size="10" fill="#7C8567">暂无可作图数据</text>'
    const vals = rows.map((r) => r.v)
    const max = Math.max(...vals, 1.2), min = Math.min(...vals, 0.5)
    const pts = rows.map((r, i) => ({ x: 12 + (i * 176) / Math.max(rows.length - 1, 1), y: 8 + (1 - (r.v - min) / Math.max(max - min, 0.01)) * 44 }))
    const line = pts.map((pt, i) => (i ? 'L' : 'M') + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1)).join(' ')
    const last = pts[pts.length - 1]
    return `<path d="${line}" fill="none" stroke="#A8681E" stroke-width="2"></path><circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.5" fill="#A8681E"></circle>`
  }

  function visionAlertCard() {
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">视力预警提示</span><span class="badge needs">只提醒，不判读</span></div>
        <p class="muted" style="margin:4px 0">如果出现<b>新发视力下降、一过性视物模糊（黑朦）或复视</b>，请<b>当日就医</b>。本工作台只记录你写下的症状，不做判读、不给分诊结论。</p>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn ghost small" type="button" data-goto="symptoms/headache">记一笔症状（含视力）</button>
          <button class="btn ghost small" type="button" data-goto="symptoms/impact">看预警记录条数</button>
        </div>
      </div>`
  }

  function vDashboardOverview() {
    const p = profile()
    /* 真实库里"有档案但还没化验/没记感受"是常态。以前这里直接取最后一条再 .find().value，
       缺一条数据就抛错，整块业务区变空白——看起来就是"这个工作台没有界面"。 */
    const lastLabs = p.labs.length ? p.labs[p.labs.length - 1] : null
    const esr = lastLabs ? lastLabs.items.find((i) => i.code === 'ESR') : null
    const lastSym = sharedOnly(allSymptoms())[0]
    const answers = p.questions.filter((q) => !q.done).length
    const anchor = p.startedAt || ''
    const dayN = anchor ? daysSince(anchor) : null
    const next = nextCadenceNode(p)
    const phase = p.label.includes('·') ? p.label.split('·').pop().trim() : p.label
    return `
      ${visionAlertCard()}
      <div class="card">
        <div class="card-head"><span class="muted">${dayN == null
          ? '状态卡 · 还没有起点日期'
          : `随访第 ${dayN} 天 · ${next ? `距参考节点 ${next.days} 天` : '暂无参考节点'}`}</span></div>
        <div style="font-size:28px;font-weight:700;color:var(--brand);line-height:1.2">${dayN == null ? '还没有起点日期' : `随访第 ${dayN} 天`}</div>
        <p class="muted" style="margin-top:4px">${dayN == null
          ? '这个数字由你记的「开始用药日」算出来。去「我的病底」补上日期后，这里会显示随访第 N 天和下一个参考节点（工作台不推断病程）。'
          : `锚点 ${esc(anchor)}（开始用药日 = Day 0）· 阶段：${esc(phase)} · ${next ? `下次参考节点 ${esc(next.date)}` : '还没有可推算的下一个节点'}`}</p>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn" type="button" data-goto="${dayN == null ? 'basics/diagnosis' : 'followup/cadence'}">${dayN == null ? '去补开始用药日 →' : '看复查节奏（参考节点）→'}</button>
          <button class="btn ghost" type="button" data-open="pathology">确诊依据（整页）</button>
          <button class="btn ghost" type="button" data-primer-open aria-label="疾病概要：定义、医学资料与指南情况、治疗全景、发展趋势">疾病概要是什么？</button>
        </div>
      </div>
      <div class="row-3">
        <div class="card">
          <div class="card-head"><span class="card-title">今天怎么样</span>${aiButton('我今天不太舒服，想记一笔', '看板·今天怎么样')}</div>
          <p class="muted">记一次头痛或晨僵，20 秒完成。也可以点右上角「对话」交给原生会话。</p>
          <div class="actions-row" style="margin-top:8px">
            <button class="btn" type="button" data-goto="symptoms/headache">记一笔头痛</button>
            <button class="btn ghost" type="button" data-goto="symptoms/stiffness">记一笔晨僵</button>
          </div>
        </div>
        <div class="card mini-chart">
          <div class="card-head"><span class="card-title">CRP 最近走势（缩略）</span><span class="pill">点末点看详情</span></div>
          <button class="mini-pt" type="button" data-open="chart" data-metric="CRP" aria-label="看 CRP 最近一次数据点详情">
            <svg viewBox="0 0 200 60" role="img" aria-label="CRP 缩略走势，末点可点开数据点详情">
              ${miniInflamPoints(p)}
            </svg>
          </button>
          <p class="muted" style="margin-top:6px;font-size:12.5px">仅回顾，不解读；完整趋势见「化验 · 一图秀」。<button class="btn ghost small" type="button" data-open="labs">化验速览（整页层）</button></p>
        </div>
        <div class="card">
          <div class="card-head"><span class="card-title">接下来</span></div>
          ${kv('参考复查节点', next ? `${esc(next.date)}（${next.days} 天后）` : '还没有起点日期', '±30 天是工作台显示带宽，不是指南内容')}
          <p class="muted" style="margin-top:6px">起点 ${esc(anchor || '未记录')} · 按 6 个月间隔往后推，复查内容以医生安排为准</p>
          <div class="actions-row" style="margin-top:8px">
            <button class="btn ghost small" type="button" data-goto="followup/cadence">看复查节奏怎么算的</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><span class="card-title">最近变化</span></div>
          ${kv('最近一次 ESR', esr ? `${esr.value} ${UNITS.ESR}${esr.method ? '（' + esc(esr.method) + '）' : ''}` : '还没有化验记录', lastLabs ? `${lastLabs.date}${lastLabs.items[0] ? ` · ${lastLabs.items[0].lab}` : ''}` : '')}
          ${kv('最近一次记录的感受', lastSym ? `头痛 ${lastSym.headache == null ? '未记' : lastSym.headache + '/10'} · 晨僵 ${lastSym.stiffness == null ? '未记' : lastSym.stiffness + '/3'}` : '无', lastSym ? lastSym.date : '')}
          <p class="muted" style="margin-top:6px">只并列事实，不判断好坏。</p>
          <div class="actions-row" style="margin-top:8px">
            <button class="btn ghost small" type="button" data-goto="labs/chart">看上次化验的趋势</button>
            <button class="btn ghost small" type="button" data-goto="symptoms/log">看全部感受记录</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">我的问题</span><span class="muted">${answers} 条待问</span></div>
        <ul class="list">
          ${p.questions.filter((q) => !q.done).slice(0, 4).map((q) => `<li><span class="timeline-dot"></span><span>${esc(q.text)}</span></li>`).join('') || '<li class="muted">还没有问题，去「复查节奏 → 就诊准备」加一条</li>'}
        </ul>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn ghost" type="button" data-goto="followup/prep">整理复诊问题</button>
          <button class="btn ghost" type="button" data-goto="records/export">导出给医生</button>
        </div>
      </div>`
  }

  function vDashboardNext() {
    const p = profile()
    /* 这里列的是「接下来」，所以只列今天之后的节点；原先复用 cadenceNodes（起点 +6/+12 个月），
       对老档案两个日期都已经过去，页签名叫"接下来"却在讲过去。 */
    const nodes = upcomingCadenceNodes(p, 3)
    const lastLabs = p.labs.length ? p.labs[p.labs.length - 1] : null
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">接下来要发生的事</span></div>
        ${nodes.length
          ? `<ul class="list">
          ${nodes.map((n) => `<li><span class="time">${esc(n.date)}</span><span>${esc(n.months)} 个月参考节点 · ${esc(n.days)} 天后<br><span class="muted">起点 ${esc(p.startedAt || p.diagnosedAt)}，±30 天为显示带宽</span></span></li>`).join('')}
        </ul>`
          : '<p class="muted">还没有开始用药日，推不出下一个节点。</p>'}
        <p class="muted" style="margin-top:8px">这些是**参考节点**，不是提醒；工作台不会发通知。</p>
      </div>
      <div class="row">
        <div class="card"><div class="card-head"><span class="card-title">待办</span></div>
          <ul class="list">${p.questions.filter((q) => !q.done).slice(0, 3).map((q) => `<li><span class="timeline-dot"></span><span>${esc(q.text)}</span></li>`).join('') || '<li class="muted">无</li>'}</ul>
        </div>
        <div class="card"><div class="card-head"><span class="card-title">上次复查带走了什么</span></div>
          <p class="muted">最近一次化验 ${esc(lastLabs ? lastLabs.date : '还没有记录')} · 档案里共有 ${p.labs.length} 次化验与 ${allSymptoms().length} 条感受记录；导出在「报告与资料 → 导出」。</p>
        </div>
      </div>`
  }

  function vDashboardChanges() {
    const p = profile()
    const series = seriesFor(p, 'ESR')
    if (!series.length) {
      return `<div class="card">
        <div class="card-head"><span class="card-title">这 6 个月</span><span class="muted">只列变化，不给结论</span></div>
        <p class="muted">档案里还没有 ESR 数值，所以画不了趋势。导入一张化验单后，这里会按日期连成线。</p>
        <div class="actions-row" style="margin-top:8px"><button class="btn ghost" type="button" data-goto="records/import">导入化验单</button></div>
      </div>`
    }
    const first = series[0], last = series[series.length - 1]
    const ref = (x) => (x.refHigh != null ? `${x.value} ${UNITS.ESR}（单据上限 ${x.refHigh}）` : `${x.value} ${UNITS.ESR}（单据未印上限）`)
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">这 6 个月</span><span class="muted">只列变化，不给结论</span></div>
        <div class="row-3">
          ${kv('ESR 首次', ref(first), first.date)}
          ${kv('ESR 最近', ref(last), last.date)}
          ${kv('记录次数', `${series.length} 次化验`, `最近一次 ${last.date}`)}
        </div>
        <div style="margin-top:10px">${oneChart(p, ['ESR', 'CRP', 'Hb'])}</div>
        <p class="chart-note">每条线按自身全期 min/max 归一化，**数值之间不可直接比较**；单点不连线。</p>
      </div>`
  }

  /* ------------------------------ 我的病底 ------------------------------ */
  function vBasicsDiagnosis() {
    const p = profile()
    const tri = (v) => ({ positive: '阳性', negative: '阴性', untested: '未检测' }[v] || '未记录')
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">诊断要素（照抄报告，不判读）</span>${aiButton('我想补一下确诊时的检查结果', '病底·诊断与检查')}</div>
        <div class="row">
          ${kv('确诊日期', esc(p.diagnosedAt))}
          ${kv('ANA（鉴别参考）', tri(p.antibodies.ana), '三态：阳性 / 阴性 / 未检测；GCA 无特异性抗体，只作参考，不作诊断依据')}
          ${kv('主要影像', p.imaging ? esc(p.imaging.method) : '未记录', p.imaging && p.imaging.date ? esc(p.imaging.date) : '')}
        </div>
        <p class="muted" style="margin-top:8px">备注：${esc(p.antibodies.note)}</p>
      <div class="actions-row" style="margin-top:10px">
        <button class="btn ghost" type="button" data-open="pathology">查看确诊依据报告（整页）</button>
      </div>
        <div class="actions-row" style="margin-top:10px"><button class="btn ghost" type="button" data-page="diagnosis">看完整记录</button></div>
      </div>`
  }

  function vBasicsImaging() {
    const p = profile()
    /* 刚确诊的档案可能还没有影像复查记录（imaging = null）：如实写「未记录」，
       不能因为缺一块数据让整页画不出来。 */
    const f = p.imaging || {}
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">影像与复查</span></div>
        ${kv('检查方式', f.method ? esc(f.method) : '未记录', '不同方式的结果不互相换算')}
        ${kv('结果原文', f.value ? esc(f.value) : '还没有记录')}
        ${kv('日期', f.date ? esc(f.date) : '未记录')}
        <p class="muted" style="margin-top:8px">${f.note ? esc(f.note) + '。' : '本档案还没有影像复查记录。'}工作台**不判断血管受累进展**，也不把影像原文换算成分级。更多影像复查见「影像与随访」。</p>
      </div>`
  }

  function vBasicsComorbidity() {
    const p = profile()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">合并症档案</span><span class="muted">各科各记，在这里归集</span></div>
        ${p.comorbidity.length ? `<ul class="list">${p.comorbidity.map((c) => `<li><span class="time">${esc(c.since)}</span><span><b>${esc(c.name)}</b><br><span class="muted">${esc(c.note)}</span></span></li>`).join('')}</ul>` : '<p class="muted">还没有记录</p>'}
        <p class="muted" style="margin-top:8px">合并症（含 PMR）的诊断与治疗由各专科医生判断；PMR 只以「医生已安排的随访」口径呈现，本页只做记录。</p>
      </div>`
  }

  /* --------------------------- 发作与缓解（GCA 专属线） ---------------------------
   * 折叠单元 = 一次发作（flare，非肿瘤不套疗程/线序语义）。只记录已发生事实与医生行动计划
   * 原文；发作判定（是不是 GCA 活动）归医生，界面只写"医生处置原文"。
   * 空态给下一步按钮（家族基线）。 */
  function vEpisodesList() {
    const p = profile()
    const eps = p.episodes ?? []
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">发作记录</span><span class="muted">近 90 天发作 ${episodesIn90(eps)} 次（读时算，不落库）</span></div>
        ${eps.length ? eps.map((e) => `
          <details class="phase-fold" style="margin-bottom:8px">
            <summary><b>${esc(e.start)} 起的发作</b>${e.end ? `<span class="muted">　${esc(e.start)} — ${esc(e.end)}（${daysBetween(e.start, e.end)} 天）</span>` : '<span class="muted">　缓解日期未记录</span>'}</summary>
            <div class="row" style="margin-top:6px">
              ${kv('就诊医院', esc(e.hospital || '未记录'))}
              ${kv('表现（原文）', esc(e.signs || '未记录'))}
              ${kv('化验变化', esc(e.labsNote || '未记录'))}
              ${kv('医生处置', esc(e.treatment || '未记录'))}
              ${kv('行动计划', e.actionPlan ? esc(e.actionPlan) : '【待核：请录入医生给的计划原文】')}
            </div>
            <p class="muted" style="margin-top:6px">${esc(e.note || '')}</p>
          </details>`).join('') : emptyState('还没有发作记录', '发作（如新发头痛加重、头皮压痛、视力症状）发生后在这里记一笔，包括医生给的处置原文。', '记一次发作', 'episode-new')}
        <p class="muted" style="margin-top:8px">本页只回顾已发生的事实。发作是不是 GCA 活动、该怎么处理，由医生判断；计划原文请逐字录入。</p>
      </div>`
  }

  function vEpisodesTimeline() {
    const p = profile()
    const eps = p.episodes ?? []
    const now = '2026-11-12'
    const band = (e) => {
      const s = daysBetween(e.start, now)
      const w = e.end ? Math.max(daysBetween(e.start, e.end), 1) : s
      return `<div class="ep-band" style="margin-left:${Math.min(s * 4, 320)}px;width:${Math.max(w * 4, 12)}px" role="img" aria-label="发作区间：${esc(e.start)}${e.end ? ' 至 ' + esc(e.end) : '，缓解未记录'}"></div>`
    }
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">发作—缓解区间带</span><span class="muted">距今天的天数按当次单据日期，只报事实</span></div>
        ${eps.length ? eps.map((e) => `
          <div style="margin-bottom:10px">
            <div class="muted" style="font-size:12.5px">${esc(e.start)}${e.end ? ' — ' + esc(e.end) : '（缓解未记录）'} · ${esc(e.hospital || '医院未记')}</div>
            ${band(e)}
          </div>`).join('') : emptyState('时间线还没有内容', '有发作记录后，这里按"发作—缓解"区间展示。', '去看发作记录', "location.hash='#episodes/list'")}
        <p class="muted" style="margin-top:8px">区间带表示"发作开始到缓解"的日期事实，不表示病情轻重。</p>
      </div>`
  }

  function episodesIn90(eps) {
    const now = new Date('2026-11-12')
    return eps.filter((e) => { const d = new Date(e.start); return d >= new Date(now.getTime() - 90 * 86400000) }).length
  }

  function daysBetween(a, b) {
    return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
  }

  function emptyState(text, hint, btnLabel, action) {
    return `<div class="empty" style="padding:18px;border:1px dashed var(--line,#dce7df);border-radius:14px;text-align:center">
      <p style="margin:0 0 4px">${esc(text)}</p>
      <p class="muted" style="margin:0 0 10px">${esc(hint)}</p>
      <button class="btn ghost" type="button" onclick="${action}">${esc(btnLabel)}</button>
    </div>`
  }

  /* ------------------------------ 用药 ------------------------------ */
  function vTreatmentCurrent() {
    const p = profile()
    const totalMissed = p.adherence.reduce((a, b) => a + b.missed, 0)
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">当前用药</span>${aiButton('我在吃的药想记一下', '用药·当前用药')}</div>
        ${p.meds.filter((m) => m.inUse).map((m) => `
          <div class="stack" style="border-bottom:1px dashed var(--line);padding-bottom:8px;margin-bottom:8px">
            ${kv(m.name, esc(m.doseText), `${m.freq} · 起 ${m.startDate}`)}
            <div><span class="badge needs">获批状态未核实</span></div>
          </div>`).join('')}
        <div class="actions-row">
          <button class="btn" type="button" data-miss="1">今天漏服</button>
          <span class="muted">近 6 个月累计漏服 ${totalMissed} 次（只是记录，不评价）</span>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">漏服月视图</span></div>
        <div class="row-3">
          ${p.adherence.map((a) => kv(a.month, `${a.missed} 次`)).join('')}
        </div>
      </div>`
  }

  function vTreatmentPathway() {
    const p = profile()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">用药经过 · 激素阶梯（默认概要，点开看细节）</span><span class="ph-hint">打印时全部展开</span></div>
        ${p.pathway.map((ph) => `
          <details class="phase-fold" style="margin-bottom:8px">
            <summary><span class="phase-dot"></span><b>${esc(ph.phase)}</b><span class="muted">· ${esc(ph.d)}</span><span>· ${esc(ph.text)}</span></summary>
            <div class="phase-detail">
              ${pdBlock('方案', ph.detail.regimen)}
              ${pdBlock('指标和趋势', ph.detail.metrics)}
              ${pdBlock('影像发现', ph.detail.imaging)}
              ${pdBlock('副作用总结', ph.detail.ae)}
              ${pdBlock('心理/营养措施和效果', ph.detail.support)}
            </div>
          </details>`).join('')}
        <p class="muted">每张卡固定五块：方案 / 指标和趋势 / 影像发现 / 副作用总结 / 心理营养措施和效果；无内容写「无 + 说明」，不省略块。激素剂量只按日期陈列医嘱原文，不做疗效判断。</p>
      </div>`
  }
  function pdBlock(title, block) {
    return `<section class="pd-block"><h4>${esc(title)}</h4><p class="muted">${esc(block.summary)}</p>
      <table>${block.items.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table></section>`
  }

  function vTreatmentSide() {
    const p = profile()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">副作用记录</span>${aiButton('我吃药后有点不舒服，想记一下', '用药·副作用')}</div>
        <ul class="list">
          <li><span class="time">2026-03</span><span>激素加量后夜间胃部不适，程度自评轻；处理原文：随餐服用（患者自述）</span></li>
          <li><span class="time">2025-12</span><span>注射托珠单抗当晚低热，次日缓解（患者自述）</span></li>
        </ul>
        <p class="muted" style="margin-top:8px">副作用不归因、不评级，只记时间与原文；血糖与血压等激素副作用监测见「化验 · 指标卡」。</p>
      </div>`
  }

  /* ------------------------------ 化验线 ------------------------------ */
  function mcard(it, p, last, order) {
    const series = seriesFor(p, it.code)
    const r = refOf(it)
    const prev = series.length > 1 ? series[series.length - 2] : null
    const delta = prev && it.value != null && prev.value != null ? (Number(it.value) - Number(prev.value)) : null
    return `
      <div class="mcard" data-flip tabindex="0" role="button" aria-label="${esc(LABELS[it.code] || it.code)}：正反面可切换">
        <div class="mcard-inner">
          <div class="mface front">
            <span class="label"><span class="ord">${order || ''}</span>${esc(LABELS[it.code] || it.code)}</span>
            <span class="value">${esc(it.value)} <small>${esc(it.unit || '')}</small></span>
            <span class="delta">${delta == null ? '无前次可比' : `较前次 ${delta > 0 ? '+' : ''}${delta}`}${it.refHigh == null ? '' : ` · 参考上限 ${it.refHigh}`}${it.method ? ` · ${esc(it.method)}` : ''}</span>
            <span>${badgeFor(it)}</span>
            <span class="src">${esc(it.lab)} · ${esc(last.date)}<span class="flip-hint">翻面看全期 ▸</span></span>
          </div>
          <div class="mface back">
            <span class="label">${esc(LABELS[it.code] || it.code)} · 全期 ${series.length} 点</span>
            ${spark(series.map((s) => s.value))}
            <ul class="pt-list">${series.slice(-4).map((x) => `<li><span>${esc(x.date)}</span><b>${esc(x.value)}</b>${x.refHigh == null ? '<i>无上限</i>' : `<i>单据上限 ${x.refHigh}</i>`}</li>`).join('')}</ul>
            <span class="src">${r.state === 'noHigh' ? '这张单子没有上限，如实标注（不判读）' : r.state === 'withRef' ? `参考区间 ${r.refLow}–${r.refHigh}（单据原文）` : '本单没有参考值'}</span>
          </div>
        </div>
      </div>`
  }

  /* 指标卡：按系列分组 + 组内按临床关注度排序 + 3D 翻面。
     三条不变量（都有断言）：
     ① 系列之间不加总、不换算，系列标题写清"这一组在回答什么"；
     ② 组内顺序取 METRIC_SERIES.codes 的顺序，不取化验单印刷顺序；
     ③ 单子上没有的指标不出空卡（缺值不伪造）。 */
  function vLabsCards() {
    const p = profile()
    const last = p.labs[p.labs.length - 1]
    const byCode = new Map(last.items.map((it) => [it.code, it]))
    const groups = METRIC_SERIES
      .map((series) => ({ ...series, items: series.codes.map((c) => byCode.get(c)).filter(Boolean) }))
      .filter((series) => series.items.length)
    const leftovers = last.items.filter((it) => !METRIC_SERIES.some((series) => series.codes.includes(it.code)))
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">最近一次化验 · ${esc(last.date)}</span>${aiButton('帮我看看这次化验有什么变化', '化验线·指标卡')}</div>
        <p class="muted">按系列分组，组内按临床关注度排序。点卡片翻到背面看这条线的全期走势；参考区间一律用单据自带的原文，缺上限的标「单据未印上限」，不会用通用值补，也不做分级判读。</p>
      </div>
      ${groups.map((series) => `
        <section class="metric-series" aria-label="${esc(series.title)}">
          <div class="series-head">
            <h3>${esc(series.title)}</h3>
            <span class="muted">${esc(series.hint)}</span>
            <span class="muted">${series.items.length} 项</span>
          </div>
          <div class="metric-grid">${series.items.map((it, i) => mcard(it, p, last, SERIES_ORD[i])).join('')}</div>
        </section>`).join('')}
      ${leftovers.length ? `
        <section class="metric-series" aria-label="其他项">
          <div class="series-head">
            <h3>其他项</h3>
            <span class="muted">未归入任何系列的指标（不猜它属于哪条线）</span>
            <span class="muted">${leftovers.length} 项</span>
          </div>
          <div class="metric-grid">${leftovers.map((it) => mcard(it, p, last)).join('')}</div>
        </section>` : ''}`
  }

  function spark(values) {
    const w = 240, h = 46, pad = 4
    const min = Math.min(...values), max = Math.max(...values)
    const span = max - min || 1
    const pts = values.map((v, i) => ({ x: pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1), y: h - pad - ((v - min) / span) * (h - pad * 2) }))
    const d = smoothPath(pts)
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="#5C6B3C" stroke-width="1.6"/></svg>`
  }

  function oneChart(p, codes) {
    const w = 760, h = 260, padL = 34, padR = 16, padT = 16, padB = 46
    const dates = p.labs.map((r) => r.date)
    const xs = (i) => padL + (i * (w - padL - padR)) / Math.max(dates.length - 1, 1)
    const colors = CHART_COLORS
    const lines = codes.map((code, si) => {
      const s = seriesFor(p, code)
      const vals = s.map((x) => x.value)
      const min = Math.min(...vals), max = Math.max(...vals)
      const span = max - min || 1
      const pts = s.map((x, i) => ({ x: xs(p.labs.findIndex((r) => r.date === x.date)), y: padT + (1 - (x.value - min) / span) * (h - padT - padB) }))
      const d = smoothPath(pts)
      const last = pts[pts.length - 1]
      const lastVal = s[s.length - 1].value
      return {
        code, d, pts, color: colors[code] || '#555',
        label: `<text x="${(w - padR - 4).toFixed(1)}" y="${(last.y - 8 - si * 14).toFixed(1)}" font-size="11" fill="${colors[code] || '#555'}" text-anchor="end">${code} ${lastVal}</text>`,
      }
    })
    const gridY = [0, 1, 2, 3].map((i) => `<line x1="${padL}" x2="${w - padR}" y1="${padT + (i * (h - padT - padB)) / 3}" y2="${padT + (i * (h - padT - padB)) / 3}" stroke="#E2E0D3" stroke-width="1"/>`).join('')
    const xLabels = p.labs.map((r, i) => `<text x="${xs(i).toFixed(1)}" y="${h - 22}" font-size="10" fill="#7C8567" text-anchor="middle">${r.date.slice(5)}</text>`).join('')
    const events = p.pathway.map((ph) => {
      const idx = p.labs.findIndex((r) => r.date >= ph.d)
      if (idx < 0) return ''
      return `<line x1="${xs(idx).toFixed(1)}" x2="${xs(idx).toFixed(1)}" y1="${padT}" y2="${h - padB}" stroke="#CFCCB9" stroke-dasharray="3 3"/>`
    }).join('')
    return `
      <div class="chart-wrap">
        <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="ESR、CRP、血红蛋白的时间序列（各自归一化，不可直接比较）">
          ${gridY}${events}
          ${lines.map((l) => `<path d="${l.d}" fill="none" stroke="${l.color}" stroke-width="1.8"/>`).join('')}
          ${lines.map((l) => l.pts.map((pt) => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="2.4" fill="${l.color}"/>`).join('')).join('')}
          ${lines.map((l) => l.label).join('')}
          ${xLabels}
          <line x1="${padL}" x2="${w - padR}" y1="${h - padB}" y2="${h - padB}" stroke="#CFCCB9"/>
        </svg>
        <div class="chart-legend">
          ${codes.map((c) => `<span class="legend-item"><span class="legend-swatch" style="background:${colors[c] || '#555'}"></span>${c}</span>`).join('')}
          <span class="legend-item"><span class="legend-swatch" style="background:#CFCCB9;height:2px"></span>用药节点（竖虚线）</span>
        </div>
      </div>`
  }

  function vLabsChart() {
    const p = profile()
    /* 可选指标 = 这份档案里真的出现过的指标（不列空指标，选了个没数据的只会有空图） */
    const available = [...new Set(p.labs.flatMap((r) => r.items.map((i) => i.code)))]
      .filter((c) => seriesFor(p, c).length)
    const chosen = state.chartCodes.filter((c) => available.includes(c))
    const codes = chosen.length ? chosen : available.slice(0, 3)
    return `
      <div class="card">
        <div class="card-head">
          <span class="card-title">一图秀 · ${esc(p.label)}</span>
          <span class="muted">各自归一化，不可直接比较</span>
          <button class="btn ghost small" type="button" data-modal="chart">选择指标（已选 ${codes.length}/${available.length}）</button>
        </div>
        ${oneChart(p, codes)}
        <p class="chart-note">单点不连线；用药节点只作时间参照，不代表疗效。每条线只在自己的刻度里看走势。</p>
      </div>
      <div class="modal${state.chartModal ? '' : ''}" id="chart-modal" ${state.chartModal ? '' : 'hidden'} role="dialog" aria-modal="true" aria-label="选择要在图里看的指标">
       <div class="modal-card card">
        <div class="card-head">
          <span class="card-title">选择指标</span>
          <span class="muted">已选 ${codes.length} / ${available.length} · 最多同时看 5 条</span>
          <button class="icon-btn" type="button" data-modal-close="chart" aria-label="关闭">×</button>
        </div>
        <p class="muted">勾上想看的那几条。颜色是固定的：换个勾选不会让 ESR 变成别的颜色。</p>
        <div class="chip-row" role="group" aria-label="选择要看的指标">
          ${available.map((c) => {
            const on = codes.includes(c)
            return `<button class="chip${on ? ' on' : ''}" type="button" data-chart-code="${esc(c)}" aria-pressed="${on}">
              <span class="chip-dot" style="background:${CHART_COLORS[c] || '#777'}"></span>${esc(c)}
            </button>`
          }).join('')}
        </div>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn ghost small" type="button" data-chart-code="__reset">回到默认三条（ESR / CRP / Hb）</button>
        </div>
        <p class="muted" style="margin-top:6px">最多 5 条：再多线就挤在一起，谁也看不清自己的形状了。</p>
       </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">口径</span></div>
        <p class="muted">每条线各自按全期 min/max 归一化，所以"哪条更高"没有意义；要看参考区间请回「指标卡」，那里按每张单子自带的区间原文陈列。</p>
      </div>`
  }

  function vLabsRefs() {
    const p = profile()
    const last = p.labs[p.labs.length - 1]
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">参考区间说明（陈列，不是判读）</span></div>
        <ul class="list">
          <li><span class="badge ok">有参考区间 · 单据原文</span><span>化验单自带参考区间时原样陈列；不同机构、不同方法的区间不合并、不连线。</span></li>
          <li><span class="badge needs">单据未印上限</span><span>这张单子没印上限 → 只写下限与数值，不计算倍数、不给级别。</span></li>
          <li><span class="badge">无参考值</span><span>血压等测量项单据未印参考值时如实留空。</span></li>
        </ul>
        <div class="row" style="margin-top:10px">
          ${kv('本次有参考区间项', String(last.items.filter((i) => refOf(i).state === 'withRef').length))}
          ${kv('缺上限项', String(last.items.filter((i) => refOf(i).state === 'noHigh').length), '这些项不给任何级别')}
        </div>
        <p class="muted" style="margin-top:10px">参考数值均为演示化验单自带的【待核】口径；工作台不生成疾病活动度或预后评分——那些是医生用的判定工具。界面也不写"好转/恶化"。</p>
      </div>`
  }

  /* ------------------------------ 头痛与晨僵 ------------------------------ */
  function sliderRow(id, label, value, min, max, hint) {
    return `<div class="field"><label for="${id}">${esc(label)}：<b id="${id}-out">${value}</b>${hint ? ` <span class="muted">${esc(hint)}</span>` : ''}</label>
      <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="1"></div>`
  }

  function vSymptomHeadache() {
    const d = state.draft
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">今天的头痛</span>${aiButton('今天颞部头痛 6 分，头皮压痛', '头痛与晨僵·今天的头痛')}</div>
        ${sliderRow('headache', '头痛的程度（0–10，你自己打分）', d.headache, 0, 10, '不是医学量表，只是你的感觉')}
        <div class="row" style="margin-top:8px">
          <label class="field"><span>头皮压痛</span><span><input type="checkbox" id="scalp" ${d.scalp ? 'checked' : ''}> 勾选</span></label>
          <label class="field"><span>下颌跛行（嚼东西酸软）</span><span><input type="checkbox" id="jaw" ${d.jaw ? 'checked' : ''}> 勾选</span></label>
          <label class="field"><span>视力症状（新发视物模糊/黑朦/复视）</span><span><input type="checkbox" id="vision" ${d.vision ? 'checked' : ''}> 勾选</span></label>
        </div>
        <p class="muted" style="margin-top:6px">勾选「视力症状」只是记录：新发视力下降/黑朦/复视请<b>当日就医</b>；本工作台不做判读、不给分诊结论。</p>
        <div class="field" style="margin-top:8px"><label for="note">一句描述（可空）</label><input type="text" id="note" value="${esc(d.note)}" placeholder="例如：左颞部胀痛，梳头都疼"></div>
        <div class="actions-row" style="margin-top:10px">
          <button class="btn" type="button" id="save-headache">保存这一次</button>
          <span class="muted">保存后进入「我的记录」，AI 不会替你打分</span>
        </div>
      </div>`
  }

  function vSymptomStiffness() {
    const d = state.draft
    const opts = [['1', '晨僵 30 分钟内'], ['2', '晨僵约 1 小时'], ['3', '晨僵超过 1 小时']]
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">今天的晨僵</span>${aiButton('今天肩髋晨僵超过一小时', '头痛与晨僵·今天的晨僵')}</div>
        <div class="segmented" id="stiffness-seg">
          ${opts.map(([v, t]) => `<button type="button" data-stiffness="${v}" aria-pressed="${String(d.stiffness) === v}">${t}</button>`).join('')}
        </div>
        <p class="muted" style="margin-top:8px">三档只是"今天早上僵了多久"，不是晨僵分级量表；PMR 相关症状请按医生已安排的随访口径就诊。</p>
      </div>`
  }

  function vSymptomLog() {
    const list = allSymptoms()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">我的记录</span><span class="muted">共 ${list.length} 条</span></div>
        <ul class="list">
          ${list.map((s, i) => {
            const lab = profile().labs.find((r) => r.date === s.date)
            const esr = lab ? lab.items.find((i2) => i2.code === 'ESR') : null
            /* 没记的字段写"未记"，不能直接插值：`null` 会原样打出来变成「头痛 null/10」，
               患者会以为记录坏了；而「0 分」与「没记」在复诊回顾里是两件事，不能都显示成 0。 */
            const headTxt = s.headache == null ? '头痛 未记' : `头痛 ${s.headache}/10`
            const stiffTxt = s.stiffness == null ? '晨僵 未记' : `晨僵 ${s.stiffness}/3`
            const flagTxt = [s.scalp ? '头皮压痛' : '', s.jaw ? '下颌跛行' : '', s.vision ? '视力症状（就医提醒）' : ''].filter(Boolean).join(' · ')
            const isPriv = s.visibility === 'private'
            const privBtn = `<button class="pill grey" type="button" data-privacy="mind${i + 1}" aria-pressed="${isPriv}"
              title="私密标记后：看板摘要 / 导出 / AI 上下文三处都不含这条">${isPriv ? '已私密（点此恢复共享）' : '设为私密'}</button>`
            return `<li><span class="time">${esc(s.date)}</span><span>
              <b>${headTxt} · ${stiffTxt}</b>${flagTxt ? ` · ${flagTxt}` : ''}
              ${s.note ? `<br><span class="muted">${esc(s.note)}</span>` : ''}
              <br><span class="muted">同日指标：${esr ? `ESR ${esr.value} ${UNITS.ESR}（${esr.refHigh == null ? '单据未印上限' : '单据上限 ' + esr.refHigh}）` : '当天没有化验'}</span>
              <br>${privBtn}
            </span></li>`
          }).join('')}
        </ul>
        <p class="muted" style="margin-top:8px">两列只并列：左「你的感受」右「同日的数」。工作台不解释它们之间有没有关系。</p>
      </div>`
  }

  function vSymptomImpact() {
    const list = allSymptoms()
    const visions = list.filter((s) => s.vision).length
    const jaws = list.filter((s) => s.jaw).length
    const longStiff = list.filter((s) => s.stiffness >= 3).length
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">影响与预警</span></div>
        <div class="row-3">
          ${kv('视力症状记录', `${visions} / ${list.length} 条`, '新发视力下降/黑朦/复视 → 当日就医（仅提醒，不判读）')}
          ${kv('下颌跛行记录', `${jaws} 条`)}
          ${kv('晨僵超过 1 小时', `${longStiff} 条`)}
        </div>
        <p class="muted" style="margin-top:8px">这些数字只用于"复诊时说得清"，不代表病情轻重。</p>
      </div>`
  }

  /* ------------------------------ 影像与随访 ------------------------------ */
  function vScreeningType(kind, title, desc) {
    const p = profile()
    const rec = p.screening.filter((s) => s.type === kind)
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">${esc(title)}</span>${aiButton(`我想记一次${title}的检查结果`, '影像与随访·' + title)}</div>
        <p class="muted">${esc(desc)}</p>
        ${rec.length ? `<ul class="list" style="margin-top:8px">
          ${rec.map((r) => `<li><span class="time">${esc(r.date)}</span><span>${esc(r.result)}${r.detail ? `<br><span class="muted">${esc(r.detail)}</span>` : ''}</span></li>`).join('')}
        </ul>` : '<p class="muted" style="margin-top:8px">还没有记录。</p>'}
        ${kind === 'us_temporal' && rec.length && rec[rec.length - 1].date ? `<p class="muted" style="margin-top:8px">距上次 ${monthsSince(rec[rec.length - 1].date)} 个月 · 复查间隔以医生安排为准（工作台不排程）</p>` : ''}
        <details class="add-form">
          <summary>记一次${esc(title)}的结果</summary>
          <div class="row">
            <label class="field"><span>检查日期</span><input type="date" id="scr-date" value="${localToday()}"></label>
            <label class="field"><span>报告原文</span><input type="text" id="scr-result" placeholder="照抄报告结论那一句，例如「左颞动脉低回声晕环」"></label>
          </div>
          <label class="field" style="margin-top:8px"><span>补充（可空）</span><input type="text" id="scr-detail" placeholder="报告没写结论 / 换了一家医院"></label>
          <p class="muted">只抄报告原文。工作台不判断这个结果好不好，也不替你决定多久再查。</p>
          <div class="actions-row"><button class="btn" type="button" data-screening="${esc(kind)}" id="save-screening">保存这一次</button></div>
        </details>
      </div>`
  }
  function monthsSince(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const now = new Date('2026-10-25T00:00:00')
    return Math.max(0, Math.round((now - d) / (1000 * 60 * 60 * 24 * 30.4)))
  }

  /* ------------------------------ 复查节奏 ------------------------------ */
  function cadenceNodes(p) {
    const start = new Date(p.startedAt + 'T00:00:00')
    const addMonths = (d, m) => {
      const nd = new Date(d.getTime())
      const day = nd.getDate()
      nd.setMonth(nd.getMonth() + m)
      if (nd.getDate() < day) nd.setDate(0) // 月末夹取：1/31 + 1 月 = 2 月末
      return nd
    }
    /* 本地日期 → 'YYYY-MM-DD' 必须手拼，不能用 toISOString()：
       toISOString 走 UTC，东八区的本地零点会退成前一天（2024-03-20 + 6 个月
       显示成 2024-09-19，用户按它去约复查会早一天）。 */
    const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return [6, 12].map((m) => {
      const d = addMonths(start, m)
      const iso = isoOf(d)
      return { date: iso, label: `${m} 个月复查参考节点`, note: `起点 ${p.startedAt} + ${m} 个月；±30 天为显示带宽` }
    })
  }

  function vFollowupCadence() {
    const p = profile()
    const nodes = cadenceNodes(p)
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">复查节奏</span><span class="muted">只算参考节点，不排计划</span></div>
        <ul class="list">
          ${nodes.map((n) => `<li><span class="time">${esc(n.date)}</span><span>${esc(n.label)}<br><span class="muted">${esc(n.note)}</span></span></li>`).join('')}
        </ul>
        <div class="stack" style="margin-top:10px">
          ${kv('起点', esc(p.startedAt), '开始用药日；改起点会整体平移节点（不是"上次复查 + 间隔"）')}
          ${kv('检查项', 'ESR / CRP / 血常规 / 血糖 / 血压（按医生安排）', '工作台不替你决定查什么')}
        </div>
        <p class="muted" style="margin-top:8px">工作台不发提醒、不弹通知；这里只是"下次大概什么时候"。</p>
      </div>`
  }

  function vFollowupPrep() {
    const p = profile()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">就诊准备</span>${aiButton('帮我理一下这次要问医生什么', '复查节奏·就诊准备')}</div>
        <ul class="list">
          ${p.questions.map((q) => `<li><input type="checkbox" ${q.done ? 'checked' : ''} aria-label="已问"> <span>${esc(q.text)}</span></li>`).join('')}
        </ul>
        <div class="field" style="margin-top:8px"><label for="new-q">再加一条问题</label><input type="text" id="new-q" placeholder="例如：这次的 ESR 和上次比怎么样？"></div>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn ghost" type="button" id="add-q">加进清单</button>
          <button class="btn" type="button" data-goto="records/export">导出给医生</button>
        </div>
        <p class="muted" style="margin-top:8px">引导句式只做结构提示，不替你写医学结论。</p>
      </div>`
  }

  function vFollowupTodos() {
    const p = profile()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">待办与问题</span></div>
        <div class="row">
          <div>${kv('待问医生的', String(p.questions.filter((q) => !q.done).length) + ' 条')}
            <p class="muted">来自「就诊准备」勾选</p></div>
          <div>${kv('我自己的待办', '0 条', '新建待办 due 为空，不设截止日提醒')}</div>
        </div>
        <div class="actions-row" style="margin-top:8px"><button class="btn ghost" type="button" data-goto="followup/prep">去整理问题</button></div>
      </div>`
  }

  /* ------------------------------ 报告与资料 ------------------------------ */
  function vRecordsImport() {
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">导入报告</span></div>
        <p class="muted">选一份化验单照片或 PDF。**原件会上传到云端解析服务**（MinerU），本页会先让你确认再上传。</p>
        <div class="actions-row" style="margin-top:10px">
          <button class="btn" type="button" id="pick-file">选文件（演示）</button>
          <span class="muted">本轮未接真实解析：按钮只走候选演示</span>
        </div>
        <div class="card" style="margin-top:10px;background:#FCFBF5">
          <div class="card-head"><span class="card-title">候选（逐项核对）</span><span class="badge needs">未保存</span></div>
          <ul class="list">
            <li><span>ESR</span><span class="muted">52 mm/h · Westergren · 上限 30 · 2026-10-08</span><span class="badge ok">核对后入档</span></li>
            <li><span>CRP</span><span class="muted">31 mg/L · 上限 10 · 2026-10-08</span></li>
            <li><span>血红蛋白</span><span class="muted">124 g/L · 上限 150 · 2026-10-08</span></li>
          </ul>
          <div class="actions-row" style="margin-top:8px">
            <button class="btn" type="button" id="confirm-cand">确认这 3 项</button>
            <button class="btn ghost" type="button" id="reject-cand">全部拒收</button>
          </div>
          <p class="muted" style="margin-top:6px">拒收不改变任何已存记录（零副作用）。</p>
        </div>
      </div>`
  }

  function vRecordsFiles() {
    const p = profile()
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">原件</span><span class="muted">${p.documents.length} 份</span></div>
        <ul class="list">
          ${p.documents.map((d) => `<li><span class="time">${esc(d.date)}</span><span>${esc(d.name)} <span class="badge ${d.parsed ? 'ok' : ''}">${d.parsed ? '已解析' : '未解析'}</span></span></li>`).join('')}
        </ul>
        <p class="muted" style="margin-top:8px">原件留在本机资料目录；导出时默认不带原件，只带结构化记录。</p>
      </div>`
  }

  function vRecordsExport() {
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">导出给医生</span>${aiButton('帮我把最近半年整理成一份给医生', '报告与资料·导出')}</div>
        <div class="row">
          ${kv('时间窗', '最近 6 个月')}
          ${kv('包含', '化验 · 用药 · 感受记录 · 问题清单')}
        </div>
        <p class="muted" style="margin-top:8px">私密标记的内容不会进导出；快照会写"数据截止日"与"此后新增记录未包含"。</p>
        <div class="actions-row" style="margin-top:10px">
          <button class="btn" type="button" id="do-export">生成快照</button>
          <span class="muted">原型演示：生成一份可下载的文本快照</span>
        </div>
      </div>`
  }

  /* ------------------------------ 临床研究 ------------------------------ */
  /* 临床试验：建档 → 检索 → 分层线索（starter 35 号）。
     界面上必须看得到三件事：① 建档里有什么、从哪份报告来 ② 本地没建档的是什么
     ③ 每条命中是"哪一层"、证据是哪个词。否则它就是个黑箱排序。 */
  function trialDossierCard(p) {
    const ab = p.antibodies || {}
    const last = p.labs[p.labs.length - 1]
    const esr = last.items.find((i) => i.code === 'ESR')
    const crp = last.items.find((i) => i.code === 'CRP')
    const imaging = p.imaging || {}
    const biopsyRec = (p.screening || []).find((s) => s.type === 'biopsy' && s.date && s.result)
    const rows = [
      ['ANA（鉴别参考）', { positive: '阳性', negative: '阴性', untested: '未检测' }[ab.ana], ab.note || '抗体报告'],
      ['ESR（最近）', esr ? `${esr.value} ${UNITS.ESR}${esr.refHigh != null ? `（单据上限 ${esr.refHigh}）` : '（这张单子未印上限）'}` : '无', last.date],
      ['CRP（最近）', crp ? `${crp.value} ${UNITS.CRP}` : '无', last.date],
      ['主要影像（颞动脉超声）', imaging.value || '本档案没有影像记录', imaging.date || '—'],
      ['颞动脉活检', biopsyRec ? biopsyRec.result : '本档案没有活检记录', biopsyRec ? biopsyRec.date : '—'],
    ]
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">匹配建档</span><span class="muted">只有「已确认入库」的字段参与匹配</span></div>
        <p class="muted">GCA 没有常规基因检测、也没有分子分型。能用来匹配的只有抗体鉴别参考、影像报告原文与炎症指标——不假装有分子分型。</p>
        <ul class="list" style="margin-top:8px">
          ${rows.map(([k, v, src]) => `<li><span class="time">${esc(k)}</span><span><b>${esc(v)}</b><br><span class="muted">来源：${esc(src)}</span></span></li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">本地没建档的（这些永远「无法自动匹配」）</span></div>
        <ul class="list">
          <li><span class="muted">入排条件原文（本登记的纳入/排除标准尚未采集）</span></li>
          <li><span class="muted">既往激素疗程与剂量（完整阶梯以医嘱原文为准）</span></li>
          <li><span class="muted">近 3 个月合并用药与剂量</span></li>
          ${biopsyRec ? '' : '<li><span class="muted">颞动脉活检病理（本档案没有活检记录）</span></li>'}
        </ul>
        <p class="muted" style="margin-top:6px">缺字段一律判「无法自动匹配」，不判「不适用」——工作台不替你下结论。</p>
      </div>`
  }

  function trialRow(t) {
    const layer = t.structured.length ? ['结构化命中', 'grade'] : t.text.length ? ['文本命中', ''] : ['宽口径命中', 'needs']
    const evidence = t.structured.length
      ? t.structured.map((h) => `${h.field}=${h.value}（来源：${h.source}）`).join('；')
      : (t.text.length ? t.text.map((h) => h.term).join('、') : t.broad.map((h) => h.term).join('、'))
    return `<li>
      <span class="badge ${layer[1]}">${esc(layer[0])}</span>
      <span>
        <b>${esc(t.title)}</b>
        <br><span class="muted">${esc(t.sourceId)} · ${esc(t.recruitmentStatus || '状态未标')} · ${esc(t.statusNote)}</span>
        <br><span class="muted">命中证据：${esc(evidence)}</span>
        ${t.healthyVolunteer ? '<br><span class="muted">⚠ 标题原文写的是健康受试者/生物等效性——这条登记的对象不是你这类人</span>' : ''}
      </span>
    </li>`
  }

  /* 三档对照：与服务器 / 原型共用 lib/trial-match.js 算出来的同一份结果，
     页面只负责画。**不在这里再判一次**——两处判定一定会分叉。 */
  function trialTiers() {
    const p = profile()
    const all = (DEMO && DEMO.trialMatch) || {}
    return Array.isArray(all[p.key]) ? all[p.key] : []
  }

  function lastLab(code) {
    const p = profile()
    const last = p.labs[p.labs.length - 1]
    return last ? last.items.find((i) => i.code === code) || null : null
  }

  /* 试验卡：候选池口径写在卡头（已载 N / 快照 M / 相关 Y + 快照日期），
     三档 ✓/✕/? 逐条 + 硬性单列；可对照 <2 时不给百分数。 */
  function trialCard(t) {
    const bandCls = { high: 'ok', partial: 'warn', needs_info: 'grey', ineligible: 'no' }[t.band] || 'grey'
    const mark = (tier) => (tier === 'satisfied' ? '✓' : tier === 'conflict' ? '✕' : '?')
    const order = { conflict: 0, undetermined: 1, satisfied: 2 }
    const sorted = [...t.rows].sort((a, b) => order[a.tier] - order[b.tier])
    const line = (r) => `<div class="crit ${r.tier}">
        <div class="crit-line"><span class="crit-mark ${r.tier}">${mark(r.tier)}</span><b>${esc(r.rule)}</b>${r.hard ? '<span class="muted">硬性</span>' : ''}</div>
        <small><b>${esc({ satisfied: '符合', conflict: '冲突', undetermined: '待确认' }[r.tier])}</b> · ${esc(r.why)}${r.source ? ' · 记录来源：' + esc(r.source) : ''}</small>
      </div>`
    /* 可对照（decidable）< 2 时不给粗筛符合度百分数：一两条对照算出的百分比毫无意义。 */
    const showPct = t.decidable >= 2
    const poolMeta = (typeof DEMO !== 'undefined' && DEMO.snapshotMeta) || null
    const poolLine = poolMeta
      ? `候选池口径：已载 ${poolMeta.recordCount ?? '?'} / 快照 ${poolMeta.snapshotDate ?? '未记'} / 标题含本病关键词 ${poolMeta.relevant ?? '?'}（检索词命中才进池，不是全库扫描）`
      : '候选池口径：本机暂无已采集快照（research/gca/manifest 未生成）——演示条目为明示虚构（fictional:true），不构成候选池'
    return `<section class="trial-card ${t.band === 'ineligible' ? 'ineligible' : ''}">
      <div class="trial-top">
        <div>
          <div class="trial-tags">
            <span class="pill grey">${esc(t.sourceId || '来源未记')}</span>
            <span class="pill no">登记状态，未核实</span>
          </div>
          <h2>${esc(t.title)}</h2>
          <p class="trial-reg">${esc(t.statusNote)}<br><span class="muted">${esc(poolLine)}</span></p>
        </div>
        <div class="fit ${bandCls}"><b>${showPct ? t.pct + '<small>%</small>' : '—'}</b><span>粗筛符合度</span><em>${esc(t.bandLabel)}</em></div>
      </div>
      <div class="match-counts">
        <span class="pill ok">符合 ${t.counts.satisfied}</span>
        ${t.counts.conflict ? `<span class="pill no">冲突 ${t.counts.conflict}</span>` : ''}
        ${t.counts.undetermined ? `<span class="pill grey">待确认 ${t.counts.undetermined}</span>` : ''}
      </div>
      <div class="crit-list">${sorted.slice(0, 4).map(line).join('')}</div>
      ${sorted.length > 4 ? `<details class="crit-more"><summary>其余 ${sorted.length - 4} 条条件</summary><div class="crit-list">${sorted.slice(4).map(line).join('')}</div></details>` : ''}
      <div class="small-note">可对照条款不足 2 条时不出百分数（一两条对照算出的百分比毫无意义）。粗筛符合度 = 符合项 ÷ 全部条件（未知项按 0 计，所以只会偏低、不会偏高）。
        它不是入组资格，也不代表效果；硬性条件不满足的单列在下面。</div>
    </section>`
  }

  function vTrialsSearch() {
    const p = profile()
    const m = state.trialMatch
    const tiers = trialTiers()
    return `
      ${tiers.length ? `<div class="card facts-card">
        <div class="card-head"><span class="card-title">用来对照的病理特点</span><span class="muted">每一项都来自你的记录；没记的写「未记录」</span></div>
        <div class="fact-grid">${([
          ['ANA（鉴别参考）', p.antibodies.ana === 'positive' ? '阳性' : p.antibodies.ana === 'negative' ? '阴性' : '未检测', p.antibodies.note || '未记录'],
          ['主要影像', p.imaging ? p.imaging.value : '未记录', p.imaging ? p.imaging.date + ' · ' + p.imaging.method : '—'],
          ['最近 ESR', `${lastLab('ESR')?.value ?? '未记录'} ${UNITS.ESR}`, lastLab('ESR') ? `${lastLab('ESR').lab} · ${lastLab('ESR').refHigh == null ? '本单未印上限' : '单据上限 ' + lastLab('ESR').refHigh}` : '—'],
          ['最近 CRP', `${lastLab('CRP')?.value ?? '未记录'} ${UNITS.CRP}`, lastLab('CRP') ? `${lastLab('CRP').lab} · ${lastLab('CRP').refHigh == null ? '本单未印上限' : '单据上限 ' + lastLab('CRP').refHigh}` : '—'],
          ['最近血红蛋白', `${lastLab('Hb')?.value ?? '未记录'} ${UNITS.Hb}`, lastLab('Hb') ? `单据上限 ${lastLab('Hb').refHigh ?? '未印'}` : '—'],
          ['年龄 / 性别', `${p.age} 岁 · ${p.sex}`, '档案基本信息'],
        ]).map(([k, v, src]) => `<dl><dt>${esc(k)}</dt><dd><b>${esc(v)}</b><span>${esc(src)}</span></dd></dl>`).join('')}</div>
        <div class="small-note">只描述你记录里有什么。缺的项不是"不符合"——它只会让下面的条目落进「待确认」。</div>
      </div>` : ''}
      ${tiers.length ? `<div class="section-title"><div><h2>按当前记录能对上的（${tiers.filter((t) => t.band !== 'ineligible').length}）</h2><p>未知项越少排得越前；硬性条件不满足的单列在下面，不会混进来</p></div></div>` : ''}
      ${tiers.filter((t) => t.band !== 'ineligible').map((t) => trialCard(t)).join('')}
      ${tiers.some((t) => t.band === 'ineligible') ? `<details class="bad-trials"><summary>硬性条件不满足的 ${tiers.filter((t) => t.band === 'ineligible').length} 条（点开看是哪一条挡住了）</summary>${tiers.filter((t) => t.band === 'ineligible').map((t) => trialCard(t)).join('')}</details>` : ''}
      <div class="card">
        <div class="card-head"><span class="card-title">临床试验 · 分层线索</span><span class="badge">登记状态，未核实</span></div>
        <p class="muted">工作台产出的是<b>带证据链的检索线索</b>，不是入组资格结论。判定归医生与研究中心。</p>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn" type="button" id="do-match">用我的建档跑一次匹配</button>
          <span class="muted">本地快照 ${m && m.snapshotDate ? esc(m.snapshotDate) : '未加载'} · 快照会过期</span>
        </div>
        ${m ? `
          <div class="row" style="margin-top:10px">
            ${kv('结构化命中', String(m.counts.structured), '建档实体出现在登记标题里')}
            ${kv('文本命中', String(m.counts.text), '题材词重合，逐词给证据')}
            ${kv('宽口径命中', String(m.counts.broad), '只沾大词，排最后')}
            ${kv('本地快照条数', String(m.trialCount || 0), '不是"全部相关试验"')}
          </div>` : ''}
      </div>
      ${m && m.available ? m.layers.map((L) => `
        <div class="card">
          <div class="card-head"><span class="card-title">${esc(L.title)}</span><span class="muted">${esc(L.hint)} · ${L.rows.length} 条</span></div>
          ${L.rows.length
            ? `<ul class="list">${L.rows.slice(0, 12).map(trialRow).join('')}</ul>
               ${L.rows.length > 12 ? `<p class="muted" style="margin-top:6px">只列前 12 条（共 ${L.rows.length} 条）；不按"看起来更像"排序，按证据条数排。</p>` : ''}`
            : '<p class="muted">这一层没有结果。</p>'}
        </div>`).join('') : ''}
      ${m && !m.available ? `<div class="card"><p class="muted">${esc(m.reason)}</p></div>` : ''}
      <div class="card">
        <div class="card-head"><span class="card-title">按关键词检索本机快照</span><span class="muted">只查标题；不是全库扫描</span></div>
        <div class="field"><label for="trial-kw"><span>关键词（题目包含）</span><input type="search" id="trial-kw" placeholder="如 GCA / 巨细胞动脉炎 / temporal arteritis / 托珠单抗"></label></div>
        <div class="actions-row" style="margin-top:8px">
          <button class="btn" type="button" id="do-search">按关键词检索</button>
          <span class="muted">检索本机快照内标题包含该词的条目；候选池口径见上</span>
        </div>
        <div id="trial-kw-results" style="margin-top:10px"></div>
      </div>
      ${trialDossierCard(p)}
      <div class="card">
        <div class="card-head"><span class="card-title">口径</span></div>
        <ul class="list">
          <li><span class="muted">登记状态，未核实；登记 ≠ 有效 ≠ 安全 ≠ 可入组。</span></li>
          <li><span class="muted">不产出任何"按百分比对候选打分"式的综合分——数值化会把"沾到几个词"伪装成"你符合条件"。</span></li>
          <li><span class="muted">工作台不写"建议参加 / 适合你"；AI 只帮你整理命中证据与要问医生的问题。</span></li>
        </ul>
      </div>`
  }

  /* 原型里的匹配：只跑演示档案自带的 2 条明示虚构登记，规则与服务器同构
     （结构化 / 文本 / 宽口径三层 + 逐词证据），这样"分层"这件事在原型里也看得见。
     开发版由 scripts/migrate-public.mjs 换成真接口调用，两边的结果形状必须一致。 */
  function demoMatch(p) {
    const TERMS = ['巨细胞动脉炎', 'giant cell arteritis', 'temporal arteritis', 'Horton disease', 'GCA', '血管炎', '托珠单抗', 'tocilizumab', '泼尼松', 'temporal artery']
    const BROAD = ['罕见病', '风湿免疫病', '慢性病', '自身免疫']
    const rows = (p.trials || []).map((t) => {
      const title = t.title
      const structured = []
      const usingTcz = (p.meds || []).some((x) => /托珠单抗|tocilizumab/i.test(String(x.name || '')))
      if (usingTcz && /托珠单抗|tocilizumab/i.test(title)) {
        structured.push({ field: 'meds_use', value: '在用：托珠单抗（登记口径）', source: (p.meds || []).find((x) => /托珠单抗|tocilizumab/i.test(String(x.name || ''))).startDate, matchedIn: '标题' })
      }
      const text = TERMS.filter((x) => title.toLowerCase().includes(x.toLowerCase())).map((term) => ({ term, matchedIn: '标题' }))
      const broad = BROAD.filter((x) => title.includes(x)).map((term) => ({ term, matchedIn: '标题' }))
      return {
        recordId: t.id, sourceId: t.source, title, recruitmentStatus: t.status,
        statusNote: '登记状态，未核实', sourceUrl: '', snapshotDate: '2026-10-25',
        healthyVolunteer: /健康(受试者|人体|志愿者)|生物等效性/.test(title),
        structured, text, broad,
      }
    })
    const pick = (f) => rows.filter(f)
    const layers = [
      { key: 'structured', title: '结构化命中', hint: '建档里的明确实体出现在登记标题里', rows: pick((r) => r.structured.length) },
      { key: 'text', title: '文本命中', hint: '题材词重合，逐词给出现位置', rows: pick((r) => !r.structured.length && r.text.length) },
      { key: 'broad', title: '宽口径命中', hint: '只沾到"罕见病/风湿免疫病"这类大词，排最后', rows: pick((r) => !r.structured.length && !r.text.length && r.broad.length) },
    ]
    return {
      available: true, snapshotDate: '2026-10-25', trialCount: rows.length,
      counts: { structured: layers[0].rows.length, text: layers[1].rows.length, broad: layers[2].rows.length },
      layers,
      unmatched: ['入排条件原文（本登记的纳入/排除标准尚未采集）', '既往激素疗程与剂量', '近 3 个月合并用药与剂量'],
    }
  }

  function vTrialsSaved() {
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">收藏</span></div>
        <p class="muted">还没有收藏。检索结果卡上的「收藏」会存在本机。</p>
      </div>`
  }

  /* 临床数据库快照口径（设置 tab 与「来源说明」子页共用同一份数据、同一份文案）。
     数据来自 demo/build-demo-data.mjs 从 research/gca/manifest.json 抄录的 snapshotMeta：
     逐通道终态原样展示，FAILED/TIMEOUT/未配置 不算「查过」，也不写成 0 条结果。 */
  function snapshotStateLabel(s) {
    return { ready: '已查询（ready）', truncated: '查询被截断（truncated，只取到上限条数）', failed: '查询失败（failed，不算查过）', unconfigured: '未配置（unconfigured，不代表没有研究）', no_results: '查了、没有命中（no_results）' }[s] || s
  }
  function trialSourcesHtml() {
    const meta = (typeof DEMO !== 'undefined' && DEMO.snapshotMeta) || null
    if (!meta) {
      return `<p class="muted">快照元信息未载入：本机没有已采集的临床研究快照（research/gca/manifest 未生成）。查不到不等于没有研究。</p>
        <p class="muted" style="margin-top:6px">候选池口径：已载 N = 快照 manifest 的 recordCount；相关 Y = 标题含本病关键词（巨细胞动脉炎 / giant cell arteritis / temporal arteritis / Horton / 血管炎 / GCA）的条数；快照 M = 快照日期。三者由 M4 阶段真实快照生成后回填；在那之前，演示态只显示明示虚构条目（fictional:true）。</p>`
    }
    const rows = (meta.sources || []).map((s) => `<li><span class="time">${esc(s.id)}</span><span>${esc(snapshotStateLabel(s.state))}${s.queried != null ? ` · 查询请求 ${esc(String(s.queried))} 次` : ''}</span></li>`).join('')
    return `
      <p style="margin:0 0 6px">快照日期 <b>${esc(meta.snapshotDate ?? '未记')}</b> · 已载 <b>${esc(String(meta.recordCount ?? 0))}</b> 条 · 标题含本病关键词 <b>${esc(String(meta.relevant ?? '?'))}</b> 条。<b>不是全库扫描</b>——检索词命中才进池，通道召回有限。</p>
      <ul class="list">${rows}</ul>
      <p class="muted" style="margin-top:8px">${esc(meta.honestyNote || '')}登记 ≠ 有效 ≠ 安全 ≠ 可入组；状态一律「登记状态，未核实」。</p>`
  }

  function vTrialsSources() {
    return `
      <div class="card">
        <div class="card-head"><span class="card-title">来源说明</span></div>
        ${trialSourcesHtml()}
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">通道清单</span></div>
        <ul class="list">
          <li><span class="time">ictrp</span><span>WHO ICTRP（全球广度）</span></li>
          <li><span class="time">ctv</span><span>ClinicalTrials.gov 深度索引</span></li>
          <li><span class="time">chinadrugtrials</span><span>药物临床试验登记与信息公示平台（中国）</span></li>
          <li><span class="time">chictr_online</span><span>ChiCTR（中国注册库；当前通道终态见上表，failed 不算查过）</span></li>
        </ul>
      </div>`
  }

  /* ------------------------------ 交互绑定 ------------------------------ */
  function bindViewEvents() {
    $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
      state.view = b.dataset.view
      state.sub = NAV.find((n) => n.id === state.view).subs[0][0]
      render(); syncHash()
    }))
    $$('[data-sub]').forEach((b) => b.addEventListener('click', () => { state.sub = b.dataset.sub; render(); syncHash() }))
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => {
      const [v, s] = b.dataset.goto.split('/')
      state.view = v; state.sub = s; render(); syncHash()
    }))
    const doMatch = $('#do-match')
    if (doMatch) doMatch.addEventListener('click', () => {
      /* 原型里没有接口：用演示规则跑一遍，让"分层 + 证据"这件事可看见。
         开发版由 migrate-public 换成真接口调用。 */
      state.trialMatch = demoMatch(profile())
      render()
    })
    $$('[data-modal]').forEach((b) => b.addEventListener('click', () => {
      state.chartModal = true
      render()
    }))
    $$('[data-modal-close]').forEach((b) => b.addEventListener('click', () => {
      state.chartModal = false
      render()
    }))
    $$('[data-chart-code]').forEach((b) => b.addEventListener('click', () => {
      const code = b.dataset.chartCode
      if (code === '__reset') {
        state.chartCodes = ['ESR', 'CRP', 'Hb']
      } else if (state.chartCodes.includes(code)) {
        state.chartCodes = state.chartCodes.filter((c) => c !== code)
      } else if (state.chartCodes.length >= 5) {
        toast('最多同时看 5 条线')
        return render() /* 拒绝分支也要重渲染：按钮无原生勾选态可回弹，但"已选 N/M"徽标要保持与状态一致 */
      } else {
        state.chartCodes = state.chartCodes.concat(code)
      }
      render()
    }))
    $$('[data-flip]').forEach((c) => {
      c.addEventListener('click', () => c.classList.toggle('flipped'))
      c.setAttribute('tabindex', '0')
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('flipped') } })
    })
    $$('[data-draft]').forEach((b) => b.addEventListener('click', () => {
      const prompt = b.dataset.draft
      const ctx = draftContext(b.dataset.ctx)
      const detail = { prompt, context: ctx, channel: EVT_DRAFT }
      document.dispatchEvent(new CustomEvent(EVT_DRAFT, { detail }))
      toast((window.parent !== window)
        ? '已把这一页的要点交给原生会话草稿（未自动发送）'
        : '独立打开时没有会话面板：这条上下文只在 DSH Desktop 里能带进 AI 对话')
    }))
    const saveHeadache = $('#save-headache')
    if (saveHeadache) saveHeadache.addEventListener('click', () => {
      const s = {
        date: '2026-10-25',
        headache: Number($('#headache').value),
        stiffness: state.draft.stiffness,
        scalp: $('#scalp').checked,
        jaw: $('#jaw').checked,
        vision: $('#vision').checked,
        note: $('#note').value,
      }
      state.localSymptoms.unshift(s)
      toast('已记下这一次（演示：仅本页内存，不落库）')
      state.view = 'symptoms'; state.sub = 'log'; render(); syncHash()
    })
    const headacheInput = $('#headache')
    if (headacheInput) headacheInput.addEventListener('input', () => { $('#headache-out').textContent = headacheInput.value; state.draft.headache = Number(headacheInput.value) })
    $$('[data-stiffness]').forEach((b) => b.addEventListener('click', () => {
      state.draft.stiffness = Number(b.dataset.stiffness)
      $$('[data-stiffness]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    }))
    const miss = $('[data-miss]')
    if (miss) miss.addEventListener('click', () => toast('已记一次漏服（演示：不落库）'))
    const addQ = $('#add-q')
    if (addQ) addQ.addEventListener('click', () => {
      const v = $('#new-q').value.trim()
      if (!v) return toast('先写一条问题')
      profile().questions.push({ id: 'q' + Date.now(), text: v, done: false })
      toast('已加入清单')
      render()
    })
    /* 私密切换：demo 态明说「不落库」；开发版由双通道接管（POST /privacy 写库 + 重载）。 */
    const privBtn = $('[data-privacy]')
    if (privBtn) privBtn.addEventListener('click', () => toast('演示态：私密标记只在开发版里写入本机数据库'))
    /* 影像与随访「记一次结果」：demo 态只进内存（与头痛/晨僵同一口径）；
       开发版由 migrate-public 注入的双通道接管（API 在 → 落 sqlite）。 */
    const saveScr = $('[data-screening]')
    if (saveScr) saveScr.addEventListener('click', () => {
      const kind = saveScr.getAttribute('data-screening')
      const result = $('#scr-result')?.value.trim()
      if (!result) return toast('先照抄一句报告原文（工作台只抄写，不判断）')
      const date = $('#scr-date')?.value || null
      const detail = $('#scr-detail')?.value.trim() || null
      const titles = { us_temporal: '颞动脉超声', biopsy: '颞动脉活检', cta: 'CTA / MRA', petct: 'PET-CT', pmr_followup: 'PMR 随访' }
      profile().screening.push({ type: kind, date, result, detail, sectionTitle: titles[kind] || '' })
      toast('已记下这一次（演示：仅本页内存，不落库）')
      render()
    })
    const pick = $('#pick-file')
    if (pick) pick.addEventListener('click', () => toast('演示：这里会先弹"原件将上传"确认，再出候选'))
    const confirmCand = $('#confirm-cand')
    if (confirmCand) confirmCand.addEventListener('click', () => toast('已确认 3 项（演示：不落库）'))
    const rejectCand = $('#reject-cand')
    if (rejectCand) rejectCand.addEventListener('click', () => toast('已全部拒收，未改动任何记录'))
    const doSearch = $('#do-search')
    if (doSearch) doSearch.addEventListener('click', () => {
      const kw = ($('#trial-kw')?.value || '').trim()
      const out = $('#trial-kw-results')
      const pool = (profile().trials || [])
      const rows = kw ? pool.filter((t) => (t.title || '').includes(kw)) : pool
      out.innerHTML = rows.length
        ? `<ul class="list">${rows.map((t) => `<li><span class="muted">${esc(t.source || '')} · ${esc(t.status || '登记状态，未核实')}</span> <b>${esc(t.title)}</b></li>`).join('')}</ul><p class="muted" style="margin-top:6px">共 ${rows.length} 条命中（本机快照 ${pool.length} 条内）；登记 ≠ 有效 ≠ 安全 ≠ 可入组。</p>`
        : `<div class="empty">没有命中的登记。换关键词试试；查不到不等于不存在（快照只含本机已载入条目）。</div>`
    })
    const doExport = $('#do-export')
    if (doExport) doExport.addEventListener('click', () => {
      const p = profile()
      const last = p.labs[p.labs.length - 1]
      /* 私密出口②导出预览：与看板摘要、AI 上下文共用 sharedOnly 同一过滤——
         visibility === 'private' 的记录不进快照，并给出条数说明。 */
      const allSym = allSymptoms()
      const sharedSym = sharedOnly(allSym)
      const txt = [
        `小脉宝 GcaPal 就诊快照（合成示例）`,
        `档案：${p.label} · 生成时间：2026-10-25 · 数据截止：${last.date}`,
        `此后新增记录未包含。本文件只整理资料，不构成医疗建议。`,
        '',
        `【最近一次化验】${last.date} ${last.items[0].lab}`,
        ...last.items.map((i) => `- ${i.code} ${i.value} ${i.unit || ''}（参考 ${i.refLow ?? '未印'}–${i.refHigh ?? '未印'}）`),
        '',
        `【当前用药】`,
        ...p.meds.map((m) => `- ${m.name} ${m.doseText}（${m.freq}）获批状态未核实`),
        '',
        `【感受记录】`,
        ...(sharedSym.length ? sharedSym.map((s) => `- ${s.date} 头痛 ${s.headache == null ? '未记' : s.headache}/10 · 晨僵 ${s.stiffness == null ? '未记' : s.stiffness}/3${s.vision ? ' · 视力症状（就医提醒）' : ''}${s.note ? ' · ' + s.note : ''}`) : ['- 无']),
        '',
        `【待问医生】`,
        ...p.questions.filter((q) => !q.done).map((q) => `- ${q.text}`),
        ...(allSym.length > sharedSym.length ? ['', `已排除私密 ${allSym.length - sharedSym.length} 条（私密标记的记录不进导出）。`] : []),
      ].join('\n')
      /* 快照先整页预览再下载：下载按钮在预览层里，核对无误后自己点。 */
      openPvLayer('导出预览', `<div class="card"><h3>就诊快照预览</h3><pre class="snapshot-pre" style="white-space:pre-wrap;font-size:12.5px;line-height:1.7">${esc(txt)}</pre><div class="actions-row" style="margin-top:10px"><button class="btn" type="button" id="download-snapshot">下载快照文件</button></div><p class="muted" style="margin-top:6px">私密标记的记录不会进快照；下载前请再核对一遍。</p></div>`, false, doExport)
      const dl = document.querySelector('#download-snapshot')
      if (dl) dl.addEventListener('click', () => {
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `GcaPal-就诊快照-GCA.txt`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 2000)
        toast('已生成快照文件')
      })
    })
    const pageBtn = $('[data-page]')
    if (pageBtn) pageBtn.addEventListener('click', () => openPvLayer('诊断与检查 · 完整记录', basicsPage(), false, pageBtn))
  }

  function draftContext(label) {
    const p = profile()
    const last = p.labs[p.labs.length - 1]
    const esr = last.items.find((i) => i.code === 'ESR')
    const crp = last.items.find((i) => i.code === 'CRP')
    const lastSym = sharedOnly(allSymptoms())[0]
    return `${p.label}｜确诊 ${p.diagnosedAt}｜最近化验 ${last.date}：ESR ${esr ? esr.value + ' ' + UNITS.ESR : '未记'}、CRP ${crp ? crp.value + ' ' + UNITS.CRP : '未记'}｜最近感受：头痛 ${lastSym?.headache ?? '—'}/10`
  }

  /* ------------------------------ 整页视图（32 号） ------------------------------ */
  function basicsPage() {
    const p = profile()
    return `<div class="card">
      <h3>诊断与检查 · 完整记录</h3>
      <p class="muted">这一页把「确诊时的原文」与「后来补做的检查」分开列，避免把不同时间的结论混在一起。</p>
      <div class="row" style="margin-top:10px">
        ${kv('确诊日期', esc(p.diagnosedAt))}
        ${kv('开始用药', esc(p.startedAt))}
        ${kv('ANA（鉴别参考）', { positive: '阳性', negative: '阴性', untested: '未检测' }[p.antibodies.ana])}
        ${kv('主要影像', p.imaging ? esc(p.imaging.method) : '未记录')}
      </div>
      <p class="muted" style="margin-top:8px">来源：${esc(p.antibodies.note)}</p>
    </div>`
  }

  /* ---------------- 整页视图（32 号 · starter probe-page-view 契约） ----------------
   * history 是导航栈唯一真源：每层一条 pushState；Esc/返回退一层；✕ 关全部。
   * 结构：.pv-overlay > .pv-panel(.pv-head(.pv-title+.pv-head-actions(返回,✕)) + .pv-crumb + .pv-body)
   * 深链：#page=labs 直达「化验记录」层。 */
  const pvState = { el: null, stack: [], trigger: null, scrollY: 0 }
  function buildPageView() {
    const el = document.createElement('div')
    el.className = 'pv-overlay'
    el.hidden = true
    el.innerHTML = '<div class="pv-panel" tabindex="-1"><div class="pv-head"><span class="pv-crumb"></span><h2 class="pv-title"></h2><div class="pv-head-actions"><button data-pv="back">← 返回</button><button class="icon-btn pv-btn" data-pv="close" aria-label="关闭整页视图">✕</button></div></div><div class="pv-body"></div></div>'
    document.body.appendChild(el)
    el.addEventListener('click', (e) => {
      if (e.target === el) { closePvAll(); return }
      const b = e.target.closest('[data-pv]')
      if (!b) return
      if (b.getAttribute('data-pv') === 'back') history.back()
      else closePvAll()
    })
    return el
  }
  function pvRender() {
    const top = pvState.stack[pvState.stack.length - 1]
    pvState.el.querySelector('.pv-title').textContent = top.title
    pvState.el.querySelector('.pv-crumb').textContent = pvState.stack.map((l) => l.title).join(' › ')
    pvState.el.querySelector('.pv-body').innerHTML = top.html
    const panel = pvState.el.querySelector('.pv-panel')
    if (panel && !panel.contains(document.activeElement)) panel.focus()
  }
  function openPvLayer(title, html, isDeep, triggerEl) {
    if (!pvState.el) pvState.el = buildPageView()
    if (!pvState.stack.length) {
      const cand = triggerEl && triggerEl.closest ? triggerEl.closest('button,[role=button],a,input,select,textarea') : null
      pvState.trigger = isDeep ? null : (cand || (document.activeElement !== document.body ? document.activeElement : null))
      pvState.scrollY = window.scrollY
      document.documentElement.classList.add('pv-lock')
      pvState.el.hidden = false
    }
    pvState.stack.push({ title: title, html: html })
    pvRender()
    try { history.pushState({ pv: pvState.stack.length }, '', '#page-view') } catch (e) { /* file:// 下个别浏览器拒绝 */ }
  }
  function pvPop() {
    pvState.stack.pop()
    if (!pvState.stack.length) applyPvClose()
    else pvRender()
  }
  function pvRefocus() {
    let t = pvState.trigger
    if (!t) return
    if (!t.isConnected && t.getAttribute && t.getAttribute('data-open')) {
      let sel = '[data-open="' + t.getAttribute('data-open') + '"]'
      if (t.getAttribute('data-id')) sel += '[data-id="' + t.getAttribute('data-id') + '"]'
      if (t.getAttribute('data-metric')) sel += '[data-metric="' + t.getAttribute('data-metric') + '"]'
      t = document.querySelector(sel) || t
    }
    try { t.focus({ preventScroll: true }) } catch (e) { /* 触发元素不可聚焦时忽略 */ }
  }
  function applyPvClose() {
    pvState.stack = []
    if (pvState.el) pvState.el.hidden = true
    document.documentElement.classList.remove('pv-lock')
    pvRefocus()
    ;[60, 200, 500, 1000].forEach((ms) => {
      setTimeout(() => {
        if (!pvState.stack.length && document.activeElement === document.body) pvRefocus()
      }, ms)
    })
    if (pvState.scrollY != null) { try { window.scrollTo(0, pvState.scrollY) } catch (e) { } }
  }
  function closePvAll() {
    if (!pvState.stack.length) return
    const n = pvState.stack.length
    try { history.go(-n) } catch (e) { applyPvClose() }
    setTimeout(() => { if (pvState.stack.length) applyPvClose() }, 350)
  }
  window.addEventListener('popstate', () => { if (pvState.stack.length) pvPop() })

  /* ---- 整页层内容（GCA 数据形状：labs={date,items[]}，documents={id,name,date,parsed}） ---- */
  function labsLayerHtml() {
    const p = profile()
    const rows = []
    for (const r of p.labs) for (const it of r.items) rows.push({ date: r.date, ...it })
    rows.sort((a, b) => (a.date < b.date ? 1 : -1))
    return `<div class="table-wrap"><table><thead><tr><th>日期</th><th>指标</th><th>结果</th><th>参考</th><th>机构</th></tr></thead><tbody>` +
      rows.map((r) => `<tr><td>${esc(r.date)}</td><td>${esc(r.code)}</td><td><b>${esc(String(r.value))}</b> ${esc(r.unit)}</td><td>${r.refHigh == null ? '单据未印上限' : esc(String(r.refLow)) + '–' + esc(String(r.refHigh))}</td><td>${esc(r.lab)}</td></tr>`).join('') +
      `</tbody></table></div><p class="muted">不同方法/机构不合并、不连线；解读归医生。</p>`
  }
  function datapointHtml(metric) {
    const p = profile()
    const rows = []
    for (const r of p.labs) { const it = r.items.find((x) => x.code === metric); if (it) rows.push({ date: r.date, ...it }) }
    if (!rows.length) return '<p class="muted">没有所选指标。</p>'
    const last = rows[rows.length - 1]
    return `<section class="card"><h3>${esc(metric)} · 最近一次</h3><p>${esc(last.date)}：<b>${esc(String(last.value))} ${esc(last.unit)}</b>${last.refHigh == null ? '（单据未印上限）' : '（单据上限 ' + esc(String(last.refHigh)) + '）'}</p><p class="muted">来源：${esc(last.lab)} 化验单。仅回顾，不解读。</p></section>`
  }
  function pathologyHtml() {
    const p = profile()
    const us = (p.screening || []).find((s) => s.type === 'us_temporal')
    const cta = (p.screening || []).find((s) => s.type === 'cta')
    return `<section class="card">
      <h3>确诊依据 · 报告原文（照抄，不判读）</h3>
      <div class="row" style="margin-top:10px">
        ${kv('确诊日期', esc(p.diagnosedAt))}
        ${kv('ANA（鉴别参考）', { positive: '阳性', negative: '阴性', untested: '未检测' }[p.antibodies.ana])}
      </div>
      <p class="muted" style="margin-top:8px">颞动脉超声：${esc((us && us.result) || '未记录')}</p>
      <p class="muted">CTA / MRA：${esc((cta && cta.result) || '未记录')}</p>
      <p class="muted">备注：${esc(p.antibodies.note)}</p>
      <button class="pv-btn" type="button" data-pv-drill="gca-original">查看报告原文（登记摘要）</button>
      <p class="muted" style="margin-top:6px">原型演示：原件文件未挂载；开发版按 02 号契约从资料目录读取。</p>
    </section>`
  }
  function originalHtml() {
    const p = profile()
    return `<section class="card"><h3>登记摘要</h3><p>确诊日期：${esc(p.diagnosedAt)}</p><p>本条无关键描述字段时如实留空。</p><p class="muted">原型演示：原件未挂载。</p></section>`
  }

  /* ---- data-open 分发 ---- */
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]')
    if (opener) {
      const kind = opener.getAttribute('data-open')
      if (kind === 'pathology') openPvLayer('病理报告', pathologyHtml(), false, opener)
      else if (kind === 'labs') openPvLayer('化验记录', labsLayerHtml(), false, opener)
      else if (kind === 'chart') openPvLayer('数据点详情', datapointHtml(opener.getAttribute('data-metric')), false, opener)
      else if (kind === 'report') openPvLayer('报告详情', originalHtml(opener.getAttribute('data-id')), false, opener)
      return
    }
    const drill = e.target.closest('[data-pv-drill]')
    if (drill) { openPvLayer('报告原文', originalHtml(drill.getAttribute('data-pv-drill')), false, drill); return }
  })

  /* ------------------------------ AI 面板 ------------------------------ */
  /* 页面不再自建 AI 面板：这里只保留宿主入口与草稿转发（scripts 34 号 §2b） */
  function applyAgentWidth() {
    const frame = $('#frame')
    if (frame) frame.classList.add('agent-hidden')
    const btn = $('#btn-ai')
    if (btn) { btn.textContent = '对话'; btn.dataset.state = 'ready' }
  }
  function clampAgentWidth(w) { return Math.max(25, Math.min(45, Math.round(w))) }

  /* ------------------------------ 设置弹层（三 tab） ------------------------------
     家族标准：工作区 / 文档解析（MinerU）/ 临床数据库。固定外壳：标题与关闭常显，内容区滚动。
     原型态各值为示意并明说；开发版由 lib/client.js 面板与 /root 接口接真值。 */
  function openSettings(initialTab) {
    const tabs = [
      ['workspace', '工作区'],
      ['mineru', '文档解析（MinerU）'],
      ['clinical', '临床数据库'],
    ]
    let cur = tabs.some((t) => t[0] === initialTab) ? initialTab : 'workspace'
    const layer = document.createElement('div')
    layer.className = 'pv-overlay'
    layer.setAttribute('role', 'dialog')
    layer.setAttribute('aria-modal', 'true')
    layer.setAttribute('aria-label', '设置')
    layer.innerHTML = `
      <div class="pv-panel">
        <div class="pv-head"><h2 style="margin:0;font-size:20px">设置</h2>
          <div class="pv-head-actions">
            <button class="btn ghost" type="button" data-cfg-back>返回</button>
            <button class="icon-btn" type="button" data-cfg-close aria-label="关闭设置">✕</button>
          </div>
        </div>
        <div class="cfg-tabs" role="tablist" aria-label="设置分区">
          ${tabs.map(([id, label]) => `<button class="cfg-tab" type="button" role="tab" id="cfg-tab-${id}" aria-selected="${id === cur}" aria-controls="cfg-panel-${id}" data-cfg-tab="${id}">${esc(label)}</button>`).join('')}
        </div>
        <div class="pv-body">
          <section id="cfg-panel-workspace" role="tabpanel" aria-labelledby="cfg-tab-workspace" ${cur === 'workspace' ? '' : 'hidden'}>
            <div class="card">
              <div class="card-head"><span class="card-title">业务资料根目录</span><span class="muted">示意值 · 开发版里真选</span></div>
              <p style="margin:0 0 6px"><code id="cfg-root-value">（未连接宿主：开发版点顶栏「配置目录」选择真实目录）</code></p>
              <p class="muted" style="margin:0">以下位置一律不当资料目录：主目录本身 / 桌面 / 下载根目录 / tmp（客户端与服务端各判一遍）。请选一个专用文件夹，里面的原件与数据库都在这一处。</p>
            </div>
            <div class="card">
              <div class="card-head"><span class="card-title">目录体积（示意）</span></div>
              <ul class="list">
                <li><span class="time">原件</span><span>PDF / 照片原文件，不进数据库</span></li>
                <li><span class="time">派生</span><span>解析产物与导出快照，可随时重生成</span></li>
                <li><span class="time">数据库</span><span>单个 sqlite 文件，整目录复制即备份</span></li>
              </ul>
              <p class="muted" style="margin:0">备份与恢复 = 复制 / 还原整个资料目录；换目录时工作台会先开新库成功再切换，失败退回原目录。</p>
            </div>
          </section>
          <section id="cfg-panel-mineru" role="tabpanel" aria-labelledby="cfg-tab-mineru" ${cur === 'mineru' ? '' : 'hidden'}>
            <div class="card">
              <div class="card-head"><span class="card-title">云端解析（MinerU）</span><span class="badge">未接入</span></div>
              <p class="notice" style="margin:0 0 8px">本仓未接入 MinerU：下面的勾选与保存<b>不联网、不上传、不调用</b>；接入后每次解析前都会先让你确认「原件将上传」。</p>
              <label class="field"><span><input type="checkbox" id="cfg-mineru-consent"> 我同意把选中的报告原件上传到 MinerU 云端解析（接入后生效）</span></label>
              <p class="muted" id="cfg-mineru-warn" style="margin:4px 0 8px">未勾选：不会上传、不会调用。</p>
              <label class="field"><span>Token（掩码只显示后 4 位）</span><input type="password" id="cfg-mineru-token" placeholder="粘贴 Token" disabled></label>
              <p class="muted" style="margin:4px 0 8px">解析模型固定 pipeline（不切 VLM）：同一份原件重复解析结果才可比。Flash 免费额度上限 10 MB / 20 页，超限自动降级为本地文本抽取并明说。</p>
              <details><summary>如何申请 Token（4 步）</summary><ol><li>打开 MinerU 官网并注册登录</li><li>进入「API Token」页面</li><li>新建一个 Token 并复制</li><li>粘贴到上面输入框（只存本机资料目录，日志只出掩码）</li></ol></details>
            </div>
          </section>
          <section id="cfg-panel-clinical" role="tabpanel" aria-labelledby="cfg-tab-clinical" ${cur === 'clinical' ? '' : 'hidden'}>
            <div class="card">
              <div class="card-head"><span class="card-title">临床研究快照</span><span class="badge">登记状态，未核实</span></div>
              ${trialSourcesHtml()}
            </div>
          </section>
        </div>
      </div>`
    document.body.appendChild(layer)
    const closeBtn = layer.querySelector('[data-cfg-close]')
    const backBtn = layer.querySelector('[data-cfg-back]')
    const prevFocus = document.activeElement
    const close = () => { layer.remove(); document.removeEventListener('keydown', onKey, true); if (prevFocus && prevFocus.focus) prevFocus.focus() }
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close() } }
    document.addEventListener('keydown', onKey, true)
    closeBtn.addEventListener('click', close)
    backBtn.addEventListener('click', close)
    layer.addEventListener('click', (e) => { if (e.target === layer) close() })
    layer.querySelectorAll('[data-cfg-tab]').forEach((b) => b.addEventListener('click', () => {
      cur = b.getAttribute('data-cfg-tab')
      layer.querySelectorAll('[data-cfg-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)))
      layer.querySelectorAll('[role=tabpanel]').forEach((p) => { p.hidden = p.id !== 'cfg-panel-' + cur })
    }))
    const consent = layer.querySelector('#cfg-mineru-consent')
    const token = layer.querySelector('#cfg-mineru-token')
    const warn = layer.querySelector('#cfg-mineru-warn')
    consent.addEventListener('change', () => {
      token.disabled = !consent.checked
      warn.textContent = consent.checked ? '已勾选（本仓未接入：仍不会上传、不会调用）。' : '未勾选：不会上传、不会调用。'
    })
    closeBtn.focus()
  }

  function bindShell() {
    const cfgBtn = $('#cfg-open')
    if (cfgBtn) cfgBtn.addEventListener('click', () => openSettings('workspace'))
    $('#btn-ai').addEventListener('click', () => {
      if (window.parent === window) return toast('独立打开时没有会话面板：在 DSH Desktop 里打开工作台即可对话')
      try { window.parent.postMessage({ type: 'gca:agent-open' }, window.location.origin) } catch (e) { toast('没能请出会话面板') }
    })
    $('#profile-btn').addEventListener('click', () => {
      state.profileKey = state.profileKey === 'A' ? 'B' : 'A'
      state.localSymptoms = []
      toast('已切换到' + profile().label)
      render(); $('#footer-profile').textContent = profile().label
    })
    const sp = $('#agent-splitter')
    if (sp) {

      sp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          state.agentWidth = clampAgentWidth(state.agentWidth + (e.key === 'ArrowLeft' ? 2 : -2))
          sp.setAttribute('aria-valuenow', state.agentWidth)
          applyAgentWidth(); localStorage.setItem('gca.agentWidth', String(state.agentWidth))
        }
        if (e.key === 'Home') { state.agentWidth = 45; applyAgentWidth() }
        if (e.key === 'End') { state.agentWidth = 25; applyAgentWidth() }
      })
      let dragging = false
      sp.addEventListener('mousedown', () => { dragging = true; document.body.style.userSelect = 'none' })
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return
        const rect = $('#frame').getBoundingClientRect()
        const w = ((rect.right - e.clientX) / rect.width) * 100
        state.agentWidth = clampAgentWidth(w)
        sp.setAttribute('aria-valuenow', state.agentWidth)
        applyAgentWidth()
      })
      window.addEventListener('mouseup', () => {
        if (!dragging) return
        dragging = false; document.body.style.userSelect = ''
        localStorage.setItem('gca.agentWidth', String(state.agentWidth))
      })
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.chartModal) { state.chartModal = false; render(); return }
      if (e.key === 'Escape' && pvState.stack.length) { e.preventDefault(); history.back() }
    })
    const saved = Number(localStorage.getItem('gca.agentWidth'))
    if (saved) state.agentWidth = clampAgentWidth(saved)
  }

  function toast(msg) {
    const t = $('#toast')
    t.textContent = msg
    t.hidden = false
    clearTimeout(toast._t)
    toast._t = setTimeout(() => { t.hidden = true }, 2600)
  }

  /* ------------------------------ 启动 ------------------------------ */
  function boot() {
    if (!DEMO || !DEMO.profiles || !DEMO.profiles.length) {
      // 启动期校验失败：渲染横幅，禁止裸 throw 白屏（ZERO-TO-DEV 硬约束 18）
      document.body.insertAdjacentHTML('afterbegin', '<div style="background:#FBF1DF;color:#A8681E;padding:10px 14px;border-bottom:1px solid #E6CDA4">演示数据未加载：请确认 demo-data.js 与 index.html 在同一目录。</div>')
      return
    }
    bindShell()
    applyAgentWidth()
    render()
    /* 整页视图深链：#page=labs 直达「化验记录」层（starter probe 契约） */
    if (location.hash.startsWith('#page=labs')) openPvLayer('化验记录', labsLayerHtml(), true, null)
    /* 子页路由深链：#view/sub（如 #episodes/list）直达对应视图 */
    applyHash()
  }
  document.addEventListener('DOMContentLoaded', boot)

  /* 探针 / 测试入口（与家族 __GCA_APP__ 同位）：读 state、显式重渲染，不绕过 UI 事件 */
  window.__GCA_APP__ = { state, profile, render, allSymptoms, sharedOnly, draftContext, VIEWS, applyHash }
})()

/* 路由表（顶层，供 check-probe-coverage 穷举孤儿页）：'view/sub' → page* 渲染薄壳。
 * 运行时导航走 IIFE 内 VIEWS + hash；此处薄壳只为让检查器把键解析出来，调用时经
 * window.__GCA_APP__ 真渲染，保持"表里的每一条都真存在"而不是空名单。 */
function pv(route) { return window.__GCA_APP__.render ? window.__GCA_APP__.render(route) : '' }
function pageDashboardOverview() { return pv('dashboard/overview') }
function pageDashboardNext() { return pv('dashboard/next') }
function pageDashboardChanges() { return pv('dashboard/changes') }
function pageBasicsDiagnosis() { return pv('basics/diagnosis') }
function pageBasicsImaging() { return pv('basics/imaging') }
function pageBasicsComorbidity() { return pv('basics/comorbidity') }
function pageEpisodesList() { return pv('episodes/list') }
function pageEpisodesTimeline() { return pv('episodes/timeline') }
function pageTreatmentCurrent() { return pv('treatment/current') }
function pageTreatmentPathway() { return pv('treatment/pathway') }
function pageTreatmentSideeffects() { return pv('treatment/sideeffects') }
function pageLabsCards() { return pv('labs/cards') }
function pageLabsChart() { return pv('labs/chart') }
function pageLabsRefs() { return pv('labs/refs') }
function pageSymptomsHeadache() { return pv('symptoms/headache') }
function pageSymptomsStiffness() { return pv('symptoms/stiffness') }
function pageSymptomsLog() { return pv('symptoms/log') }
function pageSymptomsImpact() { return pv('symptoms/impact') }
function pageScreeningUltrasound() { return pv('screening/ultrasound') }
function pageScreeningBiopsy() { return pv('screening/biopsy') }
function pageScreeningCta() { return pv('screening/cta') }
function pageScreeningPetct() { return pv('screening/petct') }
function pageScreeningPmr() { return pv('screening/pmr') }
function pageFollowupCadence() { return pv('followup/cadence') }
function pageFollowupPrep() { return pv('followup/prep') }
function pageFollowupTodos() { return pv('followup/todos') }
function pageRecordsImport() { return pv('records/import') }
function pageRecordsFiles() { return pv('records/files') }
function pageRecordsExport() { return pv('records/export') }
function pageTrialsSearch() { return pv('trials/search') }
function pageTrialsSaved() { return pv('trials/saved') }
function pageTrialsSources() { return pv('trials/sources') }
const ROUTES = {
  'dashboard/overview': pageDashboardOverview,
  'dashboard/next': pageDashboardNext,
  'dashboard/changes': pageDashboardChanges,
  'basics/diagnosis': pageBasicsDiagnosis,
  'basics/imaging': pageBasicsImaging,
  'basics/comorbidity': pageBasicsComorbidity,
  'episodes/list': pageEpisodesList,
  'episodes/timeline': pageEpisodesTimeline,
  'treatment/current': pageTreatmentCurrent,
  'treatment/pathway': pageTreatmentPathway,
  'treatment/sideeffects': pageTreatmentSideeffects,
  'labs/cards': pageLabsCards,
  'labs/chart': pageLabsChart,
  'labs/refs': pageLabsRefs,
  'symptoms/headache': pageSymptomsHeadache,
  'symptoms/stiffness': pageSymptomsStiffness,
  'symptoms/log': pageSymptomsLog,
  'symptoms/impact': pageSymptomsImpact,
  'screening/ultrasound': pageScreeningUltrasound,
  'screening/biopsy': pageScreeningBiopsy,
  'screening/cta': pageScreeningCta,
  'screening/petct': pageScreeningPetct,
  'screening/pmr': pageScreeningPmr,
  'followup/cadence': pageFollowupCadence,
  'followup/prep': pageFollowupPrep,
  'followup/todos': pageFollowupTodos,
  'records/import': pageRecordsImport,
  'records/files': pageRecordsFiles,
  'records/export': pageRecordsExport,
  'trials/search': pageTrialsSearch,
  'trials/saved': pageTrialsSaved,
  'trials/sources': pageTrialsSources,
};


/* ── 开发版数据源（scripts/migrate-public.mjs 注入点；原型无此块）──
   宿主形态优先 bootstrap（读模型还原 demo 形状，parity 由测试断言）；
   file:// 与拉取失败回退演示数据并明示「未连接服务」：不裸 throw、不白屏。 */
;(function () {
  var apiBase = "__API_BASE__"; /* 令牌会被宿主注入成字符串字面量；禁止把令牌挂在 window 对象上（注入后会语法错误） */
  function demoToast(msg) {
    var t = document.getElementById('toast')
    if (!t) return
    t.textContent = msg
    t.hidden = false
    setTimeout(function () { t.hidden = true }, 3600)
  }
  if (location.protocol === 'file:') {
    /* 独立双击打开：走演示态，未接通后端，页面已明说。档案入口保留但明说不能落库。 */
    var demoActions = document.querySelector('.actions')
    if (demoActions) {
      var demoBtn = document.createElement('button')
      demoBtn.type = 'button'
      demoBtn.className = 'btn ghost'
      demoBtn.textContent = '＋ 新建档案'
      demoBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        demoToast('演示态：新建档案要连接本机数据库后才能保存；在 DSH Desktop 里打开工作台即可新建。')
      })
      demoActions.insertBefore(demoBtn, demoActions.firstChild)
    }
    return
  }
  function offlineBanner() {
    document.body.insertAdjacentHTML('afterbegin',
      '<div role="status" style="background:#FBF1DF;color:#A8681E;padding:10px 14px;border-bottom:1px solid #E6CDA4">'
      + '未连接服务：当前显示演示数据（合成示例）。启动 DSH Desktop 工作台服务后刷新即可载入本机档案。</div>')
  }
  fetch(apiBase + '/bootstrap').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  }).then(function (b) {
    if (!b || !Array.isArray(b.profiles) || !b.profiles.length) throw new Error('bootstrap 形状不符')
    window.DEMO.profiles = b.profiles
    window.DEMO.trialMatch = b.trialMatch || {}
    var app = window.__GCA_APP__
    if (app && app.render) {
      /* 当前档案跨刷新保持：新建/切换过档案后，刷新不能静默跳回第一份 */
      var savedKey = null
      try { savedKey = localStorage.getItem('gca.profileKey') } catch (e) {}
      var first = (savedKey && b.profiles.find(function (p) { return p.key === savedKey })) || b.profiles[0]
      app.state.profileKey = first.key
      app.state.view = 'dashboard'
      app.state.sub = 'overview'
      app.state.localSymptoms = []
      app.render()
      var footer = document.getElementById('footer-profile')
      if (footer && first.label) footer.textContent = first.label
    }
    window.__GCA_API_BASE__ = apiBase
    console.info('[gca] 已切换到本机数据库数据（' + b.profiles.length + ' 个档案）')
  }).catch(function (e) {
    offlineBanner()
    console.warn('[gca] bootstrap 不可用，继续使用演示数据：', String(e && e.message || e))
  })

  function rememberProfile(key) { try { localStorage.setItem('gca.profileKey', key) } catch (e) {} }

  /* 档案列表从服务端来（含本机新建档案，profile_key 随行）；demo 的 A/B 与本机档案并存 */
  fetch(apiBase + '/subjects').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  }).then(function (d) {
    window.__GCA_SUBJECTS__ = (d && d.subjects || []).map(function (s) { return s })
    console.info('[gca] 档案列表已从服务端载入（' + window.__GCA_SUBJECTS__.length + ' 个，含演示档案）')
  }).catch(function (e) {
    console.warn('[gca] /subjects 不可用，档案切换退回演示两档案：', String(e && e.message || e))
  })

  /* 档案切换走 API 数据：拦截 #profile-btn（捕获阶段），在服务端档案列表里轮转 */
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('#profile-btn')
    if (!btn) return
    e.stopPropagation()
    var list = (window.DEMO && window.DEMO.profiles) || []
    if (!list.length) return
    var app = window.__GCA_APP__
    if (!app || !app.render) return
    var cur = app.state.profileKey
    var idx = -1
    for (var i = 0; i < list.length; i++) { if (list[i].key === cur) { idx = i; break } }
    var next = list[(idx + 1) % list.length]
    app.state.profileKey = next.key
    app.state.localSymptoms = []
    rememberProfile(next.key)
    app.render()
    var footer = document.getElementById('footer-profile')
    if (footer && next.label) footer.textContent = next.label
  }, true)

  /* 新建档案（真实用户数据，is_demo=0）：POST /api/gca/subjects，成功后并入档案列表 */
  function emptyProfile(key, name) {
    return {
      key: key, label: name, name: name, age: null, sex: null, diagnosedAt: null, startedAt: null,
      weightKg: null, antibodies: { ana: 'untested', note: '' },
      imaging: null, pmr: { status: 'untested', note: '', lastVisit: null },
      comorbidity: [], meds: [], adherence: [], episodes: [], symptoms: [], screening: [],
      questions: [], documents: [], trials: [], pathway: [], labs: [],
    }
  }
  function createSubject() {
    var name = window.prompt('新建档案：给这份档案起个名字（如「自己」「替家人代记」）')
    if (!name || !name.trim()) return
    fetch(apiBase + '/subjects', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    }).then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b } }) }).then(function (r) {
      if (!r.ok || !r.body || !r.body.profileKey) {
        window.alert((r.body && r.body.error) || '新建档案失败')
        return
      }
      var p = emptyProfile(r.body.profileKey, r.body.name || name.trim())
      window.DEMO.profiles.push(p)
      rememberProfile(p.key)
      var app = window.__GCA_APP__
      if (app && app.render) {
        app.state.profileKey = p.key
        app.state.localSymptoms = []
        app.render()
        var footer = document.getElementById('footer-profile')
        if (footer) footer.textContent = p.label
      }
      if (window.__GCA_SUBJECTS__) {
        window.__GCA_SUBJECTS__.push({ profile_key: p.key, name: p.name, is_demo: 0 })
      }
    }).catch(function (e) {
      window.alert('新建档案请求失败：' + String(e && e.message || e))
    })
  }
  var actions = document.querySelector('.actions')
  if (actions) {
    var addBtn = document.createElement('button')
    addBtn.type = 'button'
    addBtn.className = 'btn ghost'
    addBtn.textContent = '＋ 新建档案'
    addBtn.addEventListener('click', function (e) { e.stopPropagation(); createSubject() })
    actions.insertBefore(addBtn, actions.firstChild)
  }

  /* ── 记录写入（八个 kind 双通道）：API 在 → 走库 + 重载；API 不在 → 原型演示态照常 ──
     保存成功 toast 逐字「已保存到本机数据库」；失败逐字显示原因，不静默、不假装已保存。 */
  function toastGCA(msg) {
    var t = document.getElementById('toast')
    if (!t) return
    t.textContent = msg
    t.hidden = false
    setTimeout(function () { t.hidden = true }, 3600)
  }
  function apiPost(path, body) {
    return fetch(apiBase + path, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      return r.json().then(function (b) { return { ok: r.ok, body: b } })
    })
  }
  function refreshBootstrap(keepView) {
    return fetch(apiBase + '/bootstrap').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return r.json()
    }).then(function (b) {
      if (!b || !Array.isArray(b.profiles) || !b.profiles.length) throw new Error('bootstrap 形状不符')
      window.DEMO.profiles = b.profiles
      window.DEMO.trialMatch = b.trialMatch || {}
      var app = window.__GCA_APP__
      if (app && app.render) {
        app.state.localSymptoms = []
        if (keepView) { app.render() } else { app.state.view = 'dashboard'; app.state.sub = 'overview'; app.render() }
      }
    })
  }
  /* 捕获阶段拦截 demo 保存按钮：API 态停掉内存分支，走库后重载读模型；
     演示态（无 API）直接放行，让原型自己的「演示：不落库」分支照常执行。 */
  function hookWrite(selector, build) {
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest(selector)
      if (!btn) return
      if (window.__GCA_API_BASE__ == null) return
      var app = window.__GCA_APP__
      var payload = null
      try { payload = build(btn) } catch (err) { toastGCA('先填好再保存：' + (err && err.message || err)); e.stopPropagation(); return }
      if (payload == null) return
      e.stopPropagation()
      apiPost('/subjects/' + encodeURIComponent(app.state.profileKey) + '/' + payload.kind, payload.data)
        .then(function (r) {
          if (!r.ok || !r.body || !r.body.ok) throw new Error((r.body && r.body.detail) || (r.body && r.body.error) || ('HTTP ' + r.status))
          return refreshBootstrap(true).then(function () { toastGCA('已保存到本机数据库'); if (payload.after) payload.after(app) })
        })
        .catch(function (err) { toastGCA('保存失败，没有写入：' + (err && err.message || err)) })
    }, true)
  }
  function localTodayGCA() {
    var d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }
  /* 头痛与晨僵（mind → symptom_notes） */
  hookWrite('#save-headache', function () {
    var headEl = document.getElementById('headache')
    if (!headEl) return null
    var app = window.__GCA_APP__
    var b = function (id) { var el = document.getElementById(id); return el && el.checked ? 1 : 0 }
    return { kind: 'mind', data: {
      kind: 'headache', headache: Number(headEl.value),
      scalp: b('scalp'), jaw: b('jaw'), vision: b('vision'),
      stiffness: app && app.state && app.state.draft ? app.state.draft.stiffness : null,
      note: (document.getElementById('note') || {}).value || null,
      recordedOn: localTodayGCA(),
    }, after: function (app2) { app2.state.view = 'symptoms'; app2.state.sub = 'log'; app2.render() } }
  })
  /* 筛查随访（screening → screening_records） */
  hookWrite('#save-screening', function (btn) {
    var result = (document.getElementById('scr-result') || {}).value
    if (!result || !result.trim()) { toastGCA('先照抄一句报告原文（工作台只抄写，不判断）'); return null }
    return { kind: 'screening', data: {
      kind: btn.getAttribute('data-screening'),
      doneOn: (document.getElementById('scr-date') || {}).value || null,
      result: result.trim(),
      plan: (document.getElementById('scr-detail') || {}).value || null,
    } }
  })
  /* 就诊问题（question → visit_questions） */
  hookWrite('#add-q', function () {
    var v = (document.getElementById('new-q') || {}).value
    if (!v || !v.trim()) { toastGCA('先写一条问题'); return null }
    return { kind: 'question', data: { question: v.trim() } }
  })
  /* 私密切换（POST /privacy 落库 + 重载；乐观更新，失败回退提示） */
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('[data-privacy]')
    if (!btn) return
    if (window.__GCA_API_BASE__ == null) return
    e.stopPropagation()
    var wasPressed = btn.getAttribute('aria-pressed') === 'true'
    var next = !wasPressed
    var app = window.__GCA_APP__
    apiPost('/privacy', { profileKey: app.state.profileKey, kind: 'mind', id: btn.getAttribute('data-privacy'), private: next })
      .then(function (r) {
        if (!r.ok || !r.body || !r.body.ok) throw new Error((r.body && r.body.detail) || (r.body && r.body.error) || ('HTTP ' + r.status))
        return refreshBootstrap(true).then(function () { toastGCA(next ? '已标记私密（只对你可见，三处出口都不含）' : '已恢复共享') })
      })
      .catch(function (err) { toastGCA('私密切换失败，保持原状：' + (err && err.message || err)) })
  }, true)
})();