/* 小脉宝 GcaPal · GCA M2 项目探针：对 prototypes/v0.2 真实浏览器断言（IP/C/MT/Q/A 组）
 * 通用铁律：先证明被测对象非空，再断言具体内容；SKIP 不计覆盖；失败不放宽断言。
 * 全量路由探针：覆盖 VIEWS 全部 32 条叶子路由（与 app.js VIEWS 键一一对应）。
 * 用法：node scripts/probe-gca-m2.mjs [--port N] [--url http://...] —— 显式 --url 打本仓原型，禁 examples 假绿。
 * 依赖：puppeteer-core + 本机 Chrome（CHROME_PATH 可覆盖）。
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const args = process.argv.slice(2)
const argOf = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(argOf('--port') || 8142)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }

/* 全量叶子路由（与 app.js VIEWS 键一一对应；漏一条 check-probe-coverage 就会红） */
const LEAF_ROUTES = [
  'dashboard/overview', 'dashboard/next', 'dashboard/changes',
  'basics/diagnosis', 'basics/imaging', 'basics/comorbidity',
  'episodes/list', 'episodes/timeline',
  'treatment/current', 'treatment/pathway', 'treatment/sideeffects',
  'labs/cards', 'labs/chart', 'labs/refs',
  'symptoms/headache', 'symptoms/stiffness', 'symptoms/log', 'symptoms/impact',
  'screening/ultrasound', 'screening/biopsy', 'screening/cta', 'screening/petct', 'screening/pmr',
  'followup/cadence', 'followup/prep', 'followup/todos',
  'records/import', 'records/files', 'records/export',
  'trials/search', 'trials/saved', 'trials/sources',
]

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ]
  return candidates.find(existsSync) || null
}

const SELF_TEST = process.argv.includes('--self-test')
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return }
    const file = normalize(join(ROOT, urlPath))
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return }
    let body = await readFile(file)
    /* --self-test：反向对照——拆掉收藏/发作录入入口后，SV/EF 断言必须变红（证明探针有效） */
    if (SELF_TEST && urlPath.includes('app.js')) {
      const mutated = body.toString('utf8')
        .replaceAll('data-save-trial', 'data-save-trial-x')
        .replaceAll('data-trial-state', 'data-trial-state-x')
        .replaceAll("id=\"save-episode\"", "id=\"save-episode-x\"")
        .replaceAll("id=\"episode-form\"", "id=\"episode-form-x\"")
      body = Buffer.from(mutated)
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch { res.writeHead(404); res.end('not found') }
})

const results = []
function t(id, desc, pass, detail) {
  results.push({ id, desc, pass: !!pass, detail: detail === undefined ? '' : String(detail) })
  console.log((pass ? 'PASS ' : 'FAIL ') + id + '  ' + desc + (detail !== undefined ? '  — ' + JSON.stringify(detail).slice(0, 220) : ''))
}

const serverReady = new Promise(r => server.listen(PORT, '127.0.0.1', r))
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
/* 与 app.js daysSince 同口径：本地日期，不走 UTC（东八区凌晨不退一天） */
function expectedDaysSince(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today - d) / 86400000))
}
/* 与 app.js cadenceNodes 同口径：起点 +N 个月，月末夹取，本地时区 */
function expectedCadenceNode(startStr, months) {
  const d = new Date(startStr + 'T00:00:00')
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() < day) d.setDate(0)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

async function main() {
  await serverReady
  const chrome = findChrome()
  if (!chrome) { console.log('FAIL env  找不到 Chrome：设置 CHROME_PATH 后重试。'); process.exit(2) }
  let puppeteer
  try {
    const famRequire = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/')
    puppeteer = famRequire('puppeteer-core')
  } catch {
    puppeteer = require('puppeteer-core')
  }
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
  await page.setViewport({ width: 1280, height: 860 })
  const url = argOf('--url') || `http://127.0.0.1:${PORT}/prototypes/v0.2/index.html`
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__GCA_APP__ && document.querySelector('#view') && document.querySelector('#view').innerText.trim().length > 0, { timeout: 5000 })
  await sleep(200)

  /* 演示数据值（LCG 抖动后为确定性小数）：断言直接读页面 DEMO，不硬抄数字 */
  const demoLabs = await page.evaluate(() => {
    const A = window.DEMO.profiles.find(p => p.key === 'A')
    const first = A.labs[0].items.find(i => i.code === 'ESR')
    const lastRow = A.labs[A.labs.length - 1]
    const lastEsr = lastRow.items.find(i => i.code === 'ESR')
    return { firstEsr: first.value, lastEsr: lastEsr.value, lastEsrRefHigh: lastEsr.refHigh, lastRowDate: lastRow.date }
  })

  /* ---------- hash 路由跳转助手：先证路由生效（state 命中 + #view 非空），返回视图文本 ---------- */
  async function go(route) {
    const errBefore = errors.length
    await page.evaluate((r) => { location.hash = '#' + r }, route)
    await page.waitForFunction((r) => {
      const a = window.__GCA_APP__
      return a && (a.state.view + '/' + a.state.sub) === r
        && document.querySelector('#view') && document.querySelector('#view').innerText.trim().length > 0
    }, { timeout: 4000 }, route)
    await sleep(80)
    const since = errors.slice(errBefore)
    const view = await page.evaluate(() => ({ text: document.querySelector('#view').innerText, htmlLen: document.querySelector('#view').innerHTML.length }))
    return { ...view, routeErrors: since }
  }

  /* ---------- IP2/X1：32 条叶子路由全部经 hash 直达渲染非空，且无未捕获异常 ---------- */
  const walked = []
  for (const r of LEAF_ROUTES) {
    const v = await go(r)
    walked.push({ route: r, htmlLen: v.htmlLen, textLen: v.text.trim().length, err: v.routeErrors.length })
  }
  const orphans = walked.filter(w => w.textLen <= 0 || w.htmlLen <= 0)
  const errRoutes = walked.filter(w => w.err > 0)
  t('IP2', '32 条叶子路由全部 hash 直达渲染非空（孤儿页=0）', orphans.length === 0, { total: LEAF_ROUTES.length, orphans })
  t('X1', '全量路由渲染无未捕获异常/console error', errRoutes.length === 0, errRoutes.map(w => w.route + ': ' + w.err))

  /* ---------- X2：深链接（浏览器刷新后 hash 仍在，boot 时 applyHash 直达） ---------- */
  await go('labs/chart')
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__GCA_APP__ && document.querySelector('#view') && document.querySelector('#view').innerText.trim().length > 0, { timeout: 5000 })
  await sleep(150)
  const deep = await page.evaluate(() => ({
    hash: location.hash,
    view: window.__GCA_APP__.state.view + '/' + window.__GCA_APP__.state.sub,
    text: document.querySelector('#view').innerText
  }))
  t('X2', '刷新后 #labs/chart 深链直达（boot 时 applyHash 生效）', deep.hash === '#labs/chart' && deep.view === 'labs/chart' && deep.text.includes('一图秀'), { hash: deep.hash, view: deep.view })

  /* ---------- 抽样具体内容断言（档案 A · 刚确诊）：≥10 条路由 ---------- */
  /* dashboard/overview：随访第 N 天从 startedAt 锚点算，不手填 */
  const ov = await go('dashboard/overview')
  const dayN = expectedDaysSince('2026-10-21')
  t('OV1', 'dashboard/overview 状态卡锚点派生：随访第 N 天 = 距开始用药日天数', ov.text.includes(`随访第 ${dayN} 天`) && ov.text.includes('锚点 2026-10-21'), { expectedDay: dayN })
  /* dashboard/next：参考节点 = 起点 +6 个月（只列今天之后） */
  const nx = await go('dashboard/next')
  const node6 = expectedCadenceNode('2026-10-21', 6)
  t('NX1', 'dashboard/next 列出起点+6 个月参考节点（读时推算）', nx.text.includes(node6) && nx.text.includes('个月参考节点') && nx.text.includes('天后'), { expected: node6 })
  /* dashboard/changes：ESR 首末 + 一图秀三条线 */
  const ch = await go('dashboard/changes')
  const chSvg = await page.evaluate(() => document.querySelectorAll('#view svg.chart path[fill="none"]').length)
  t('CH1', 'dashboard/changes 列 ESR 首次/最近并画 3 条趋势线', ch.text.includes('ESR 首次') && ch.text.includes(String(demoLabs.firstEsr)) && ch.text.includes(String(demoLabs.lastEsr)) && chSvg === 3, { svgPaths: chSvg, first: demoLabs.firstEsr, last: demoLabs.lastEsr })
  /* basics/diagnosis：确诊要素三态 + 原文来源 */
  const dx = await go('basics/diagnosis')
  t('DX1', 'basics/diagnosis 照抄确诊日期与 ANA 三态（未检测）+ 主要影像', dx.text.includes('确诊日期') && dx.text.includes('2026-10-14') && dx.text.includes('ANA') && dx.text.includes('未检测') && dx.text.includes('颞动脉超声'), {})
  /* basics/imaging：档案 A 有确诊期影像 → 原文照录（不判血管受累进展） */
  const fb = await go('basics/imaging')
  t('FB1', 'basics/imaging 影像原文照录（晕环 halo 征）且写明不判进展', fb.text.includes('影像与复查') && fb.text.includes('晕环') && fb.text.includes('不判断血管受累进展') && !fb.text.includes('没能画出来'), {})
  /* basics/comorbidity（A） */
  const cbA = await go('basics/comorbidity')
  t('CB1', 'basics/comorbidity（A）显示「未见合并症记录」', cbA.text.includes('未见合并症记录') && cbA.text.includes('合并症档案'), {})
  /* episodes/list（A）：空态 + 近 90 天发作读时算 */
  const epA = await go('episodes/list')
  t('EP1', 'episodes/list（A）空态给下一步按钮，近 90 天发作 0 次（读时算）', epA.text.includes('近 90 天发作 0 次') && epA.text.includes('还没有发作记录') && epA.text.includes('记一次发作'), {})
  /* treatment/current：用药原文 + 漏服累计 */
  const tx = await go('treatment/current')
  t('TX1', 'treatment/current 列泼尼松原文与漏服累计 1 次（0+1 读时算）', tx.text.includes('泼尼松片') && tx.text.includes('获批状态未核实') && tx.text.includes('累计漏服 1 次'), {})
  /* treatment/pathway：折叠卡 + 固定五块声明 */
  const pw = await go('treatment/pathway')
  const pwFolds = await page.evaluate(() => document.querySelectorAll('#view details.phase-fold').length)
  t('PW1', 'treatment/pathway 折叠卡 ≥2 张且五块声明在场', pwFolds >= 2 && pw.text.includes('每张卡固定五块'), { folds: pwFolds })
  /* labs/cards：ESR 值、参考区间徽章、分组系列 */
  const lc = await go('labs/cards')
  const lcStats = await page.evaluate(() => ({
    mcards: document.querySelectorAll('#view .mcard').length,
    series: document.querySelectorAll('#view .metric-series').length
  }))
  t('LC1', 'labs/cards 显示最近一次 ESR 与「有参考区间」徽章（单据原文口径）', lc.text.includes('血沉 ESR') && lc.text.includes(String(demoLabs.lastEsr)) && lc.text.includes('有参考区间'), { esr: demoLabs.lastEsr })
  t('LC2', 'labs/cards 按系列分组（5 组）且指标卡 ≥8 张', lcStats.series === 5 && lcStats.mcards >= 8, lcStats)
  /* labs/chart：三条默认线 + 口径说明 */
  const lch = await go('labs/chart')
  const lchSvg = await page.evaluate(() => ({
    paths: document.querySelectorAll('#view svg.chart path[fill="none"]').length,
    circles: document.querySelectorAll('#view svg.chart circle').length,
    legend: [...document.querySelectorAll('#view .chart-legend .legend-item')].map(x => x.textContent.trim())
  }))
  t('LCH1', 'labs/chart 默认 ESR/CRP/Hb 三条线（path=3、点 >0、图例齐）', lchSvg.paths === 3 && lchSvg.circles >= 3 && lchSvg.legend.join(',').includes('ESR') && lch.text.includes('各自归一化'), lchSvg)
  /* labs/refs：三种徽章说明 + 参考区间/缺上限计数 */
  const lg = await go('labs/refs')
  t('LG1', 'labs/refs 三种徽章说明 + 有参考/缺上限计数在场', lg.text.includes('单据未印上限') && lg.text.includes('无参考值') && lg.text.includes('本次有参考区间项') && lg.text.includes('缺上限项'), {})
  /* symptoms/headache：滑杆真实值 */
  const si = await go('symptoms/headache')
  const siSlider = await page.evaluate(() => ({ v: document.querySelector('#headache')?.value, save: !!document.querySelector('#save-headache') }))
  t('SI1', 'symptoms/headache 滑杆 0–10 真实存在（默认 5，保存按钮在场）', siSlider.v === '5' && siSlider.save && si.text.includes('不是医学量表'), siSlider)
  /* symptoms/stiffness：三档分段 */
  const sf = await go('symptoms/stiffness')
  const sfSeg = await page.evaluate(() => document.querySelectorAll('#view [data-stiffness]').length)
  t('SF1', 'symptoms/stiffness 三档分段（30 分钟内/约 1 小时/超过 1 小时）', sfSeg === 3 && sf.text.includes('不是晨僵分级量表'), { seg: sfSeg })
  /* symptoms/log：并列「感受 vs 同日指标」 */
  const sl = await go('symptoms/log')
  t('SL1', 'symptoms/log 列 2 条感受 + 同日 ESR 并列（头痛 6/10、左颞部胀痛）', sl.text.includes('共 2 条') && sl.text.includes('头痛 6/10') && sl.text.includes('左颞部胀痛，梳头都疼') && sl.text.includes('同日指标'), {})
  /* symptoms/impact：读时算计数 */
  const sp = await go('symptoms/impact')
  t('SP1', 'symptoms/impact 视力症状 0/2 条、下颌跛行 0 条（读时算）+ 就医提醒在场', sp.text.includes('视力症状记录') && sp.text.includes('0 / 2 条') && sp.text.includes('下颌跛行记录') && sp.text.includes('当日就医'), {})
  /* screening/ultrasound（A）：报告原文 */
  const sm = await go('screening/ultrasound')
  t('SM1', 'screening/ultrasound 照抄报告原文（低回声晕环 halo 征）', sm.text.includes('颞动脉超声（晕轮征 halo sign）') && sm.text.includes('低回声晕环'), {})
  /* screening/biopsy（A）：已安排未做 */
  const sfb = await go('screening/biopsy')
  t('SFB1', 'screening/biopsy（A）已安排未做 + 记录表单在场', sfb.text.includes('医生已安排，待做') && sfb.text.includes('记一次颞动脉活检（医生安排时）的结果'), {})
  /* screening/pmr（A）：空态 */
  const sen = await go('screening/pmr')
  t('SEN1', 'screening/pmr（A）无记录空态', sen.text.includes('还没有记录') && sen.text.includes('PMR 随访'), {})
  /* followup/cadence：起点 +6/+12 个月，月末夹取口径 */
  const fc = await go('followup/cadence')
  const node12 = expectedCadenceNode('2026-10-21', 12)
  t('FC1', 'followup/cadence 两个参考节点（+6 月 ' + node6 + '、+12 月 ' + node12 + '）', fc.text.includes(node6) && fc.text.includes(node12) && fc.text.includes('±30 天为显示带宽'), {})
  /* followup/prep：问题清单 checkbox 数与档案一致 */
  const fp = await go('followup/prep')
  const fpChecks = await page.evaluate(() => document.querySelectorAll('#view input[type="checkbox"]').length)
  t('FP1', 'followup/prep 3 条待问问题（checkbox 数=3）+ 加清单入口', fpChecks === 3 && fp.text.includes('加进清单') && fp.text.includes('ESR 降到多少算控制住'), { checks: fpChecks })
  /* followup/todos：待问条数与未勾选数一致 */
  const ft = await go('followup/todos')
  t('FT1', 'followup/todos 待问 3 条（读 questions undone）', ft.text.includes('待问医生的') && ft.text.includes('3 条'), {})
  /* records/import：候选逐项核对 + 零副作用声明 */
  const ri = await go('records/import')
  t('RI1', 'records/import 候选 3 项 + 确认/拒收双按钮 + 零副作用口径', ri.text.includes('候选（逐项核对）') && ri.text.includes('确认这 3 项') && ri.text.includes('全部拒收') && ri.text.includes('拒收不改变任何已存记录'), {})
  /* records/files：原件份数与解析态 */
  const rf = await go('records/files')
  t('RF1', 'records/files 列 2 份原件（1 已解析 1 未解析）', rf.text.includes('2 份') && rf.text.includes('2026-10 颞动脉超声报告.pdf') && rf.text.includes('已解析') && rf.text.includes('未解析'), {})
  /* records/export：私密口径在场 */
  const re = await go('records/export')
  t('RE1', 'records/export 声明「私密标记的内容不会进导出」+ 生成快照入口', re.text.includes('导出给医生') && re.text.includes('私密标记的内容不会进导出') && re.text.includes('生成快照'), {})
  /* trials/search（A）：分层卡片（符合/待确认）+ 粗筛符合度 + 口径 */
  const ts = await go('trials/search')
  const tsCards = await page.evaluate(() => document.querySelectorAll('#view .trial-card').length)
  t('TS1', 'trials/search（A）分层卡片 1 张：符合 1 / 待确认 1 / 粗筛符合度大字', tsCards === 1 && ts.text.includes('符合 1') && ts.text.includes('待确认 1') && ts.text.includes('粗筛符合度') && ts.text.includes('用来对照的病理特点'), { cards: tsCards })
  t('TS2', 'trials/search 口径：登记状态未核实 + 硬性单列 + 可对照<2 不给百分数', ts.text.includes('登记状态，未核实') && ts.text.includes('硬性') && ts.text.includes('可对照条款不足 2 条时不出百分数'), {})
  /* trials/saved / trials/sources */
  const tv = await go('trials/saved')
  t('TV1', 'trials/saved 空收藏态（收藏存本机）', tv.text.includes('还没有收藏') && tv.text.includes('存'), {})
  const tc = await go('trials/sources')
  t('TC1', 'trials/sources 列真实来源 + 快照已载口径（已载 221 / 相关 + 不是全库扫描 + FAILED 如实）', tc.text.includes('WHO ICTRP') && tc.text.includes('ChiCTR') && tc.text.includes('已载') && tc.text.includes('不是全库扫描') && tc.text.includes('failed'), {})
  /* treatment/sideeffects：不归因不评级 */
  const se = await go('treatment/sideeffects')
  t('SE1', 'treatment/sideeffects 只记时间与原文（不归因、不评级）', se.text.includes('副作用记录') && se.text.includes('不归因、不评级'), {})

  /* ---------- C10：prefers-reduced-motion 下曲线可见（无入场动画遮挡） ---------- */
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const rm = await go('labs/chart')
  const rmChart = await page.evaluate(() => {
    const path = document.querySelector('#view svg.chart path[fill="none"]')
    if (!path) return { exists: false }
    const off = parseFloat(getComputedStyle(path).strokeDashoffset) || 0
    const bb = path.getBoundingClientRect()
    return { exists: true, dashoffset: off, len: path.getTotalLength(), visible: bb.width > 0 || path.getAttribute('d').length > 10 }
  })
  t('C10', 'prefers-reduced-motion 下曲线可见（path 存在、dashoffset=0、有真实 d）', rmChart.exists && rmChart.dashoffset === 0 && rmChart.len > 10, rmChart)
  await page.emulateMediaFeatures([])

  /* ---------- Q35 隐私三出口：注入私密症状 → 看板摘要 / 导出预览 / AI 上下文排除 ---------- */
  await page.evaluate(() => {
    const a = window.__GCA_APP__
    a.state.localSymptoms.push({
      date: '2026-11-12', headache: 9, stiffness: 3, scalp: true, jaw: true, vision: true,
      note: '【私密注入】凌晨痛醒', visibility: 'private',
    })
  })
  const privDash = await go('dashboard/overview')
  /* 看板「最近一次记录的感受」只列数字与日期：私密条（2026-11-12，头痛 9）不进，
     回退到最近一条共享记录（2026-11-01，头痛 6/10 · 晨僵 2/3）。 */
  t('Q35a', '看板摘要排除私密记录（最近感受回退到共享条 2026-11-01，不是私密 11-12）', privDash.text.includes('头痛 6/10 · 晨僵 2/3') && privDash.text.includes('2026-11-01') && !privDash.text.includes('头痛 9/10') && !privDash.text.includes('【私密注入】'), {})
  const privCtx = await page.evaluate(() => window.__GCA_APP__.draftContext('看板'))
  t('Q35c', 'AI 上下文（draftContext）排除私密感受（头痛取共享最近 6/10，非私密 9/10）', privCtx.includes('头痛 6/10') && !privCtx.includes('【私密注入】'), { ctx: privCtx.slice(-40) })
  const privLog = await go('symptoms/log')
  t('Q35d', '本机「我的记录」仍可见私密条（3 条），只对外出口过滤', privLog.text.includes('共 3 条') && privLog.text.includes('【私密注入】'), {})
  /* 导出预览（整页视图层）：私密排除 + 条数说明 */
  await go('records/export')
  const histBefore = await page.evaluate(() => history.length)
  await page.evaluate(() => document.querySelector('#do-export').click())
  await page.waitForSelector('.pv-overlay:not([hidden])', { timeout: 3000 })
  await sleep(100)
  const pv = await page.evaluate(() => {
    const o = document.querySelector('.pv-overlay')
    const r = o.getBoundingClientRect()
    return {
      visible: !o.hidden && r.height > window.innerHeight * 0.8,
      hasBack: !!o.querySelector('[data-pv="back"]'),
      hasClose: !!o.querySelector('[data-pv="close"]'),
      title: o.querySelector('.pv-title').textContent,
      bodyText: o.querySelector('.pv-body').innerText,
      hist: history.length,
      statePv: (history.state && history.state.pv) || null,
      hash: location.hash
    }
  })
  /* 注：Chrome 的 history.length 有 ~50 上限，32 路由走完已饱和，不能用它断言入栈；
     改断 pushState 真实写入了 {pv:1}（A2 再用 Esc→history.back 验证出栈）。 */
  t('A1', '导出预览整页层打开（高度≥80%视口、返回+关闭双入口、pushState {pv:1} 进 #page-view）', pv.visible && pv.hasBack && pv.hasClose && pv.statePv === 1 && pv.hash === '#page-view', { visible: pv.visible, statePv: pv.statePv, hash: pv.hash })
  t('Q35b', '导出预览排除私密原文并给出「已排除私密 1 条」说明（共享感受仍在）', !pv.bodyText.includes('【私密注入】') && pv.bodyText.includes('已排除私密 1 条') && pv.bodyText.includes('左颞部胀痛，梳头都疼') && pv.bodyText.includes('【感受记录】'), {})
  t('A9', '导出预览标题无「未命名」且与内容一致', pv.title === '导出预览', { title: pv.title })
  await page.keyboard.press('Escape')
  await sleep(500)
  const pvClosed = await page.evaluate(() => ({ hidden: document.querySelector('.pv-overlay').hidden, hash: location.hash }))
  t('A2', 'Esc 关一层（预览层关闭、hash 回到子页路由）', pvClosed.hidden && pvClosed.hash === '#records/export', pvClosed)

  /* ---------- Q14/Q17/Q19：AI 按钮与草稿（EMBEDDED=false 独立打开：本地演示出口 + 诚实文案） ---------- */
  await page.evaluate(() => {
    window.__drafts__ = []
    window.__msgs__ = []
    document.addEventListener('gca:agent-draft', (e) => window.__drafts__.push({ prompt: e.detail && e.detail.prompt, context: e.detail && e.detail.context, channel: e.detail && e.detail.channel }))
    window.addEventListener('message', (e) => window.__msgs__.push(e.data && e.data.type))
  })
  await go('labs/cards')
  await page.evaluate(() => document.querySelector('[data-draft]').focus())
  await page.click('[data-draft]')
  await sleep(150)
  const draft = await page.evaluate(() => ({
    toastHidden: document.querySelector('#toast').hidden,
    toastText: document.querySelector('#toast').textContent,
    drafts: window.__drafts__,
    msgs: window.__msgs__
  }))
  t('Q14', '页面「AI 帮我填」派发本地草稿事件（prompt+context 到 gca:agent-draft）', draft.drafts.length === 1 && draft.drafts[0].prompt.includes('化验') && draft.drafts[0].context.includes('档案 A'), draft.drafts[0] ? draft.drafts[0].prompt : draft.drafts)
  t('Q17', '草稿只填不发（独立打开无 postMessage、无私密上下文泄漏）', draft.msgs.length === 0 && !draft.drafts[0].context.includes('【私密注入】'), { msgs: draft.msgs })
  t('Q19b', '独立打开时文案诚实：明说「没有会话面板」（原型态不假装已接通）', !draft.toastHidden && draft.toastText.includes('独立打开时没有会话面板'), { toast: draft.toastText })
  await page.click('#btn-ai')
  await sleep(150)
  const aiToast = await page.evaluate(() => ({ hidden: document.querySelector('#toast').hidden, text: document.querySelector('#toast').textContent }))
  t('Q19', '顶栏「对话」独立打开时明说没有会话面板（EMBEDDED=false 实际行为）', !aiToast.hidden && aiToast.text.includes('独立打开时没有会话面板'), { toast: aiToast.text })

  /* ---------- MT13：档案 A/B 切换不串档（B 特有内容出现→切回消失） ---------- */
  await page.click('#profile-btn')
  await sleep(200)
  const bLabel = await page.evaluate(() => ({ footer: document.querySelector('#footer-profile').textContent, key: window.__GCA_APP__.state.profileKey }))
  const cbB = await go('basics/comorbidity')
  t('MT13a', '切到档案 B：合并症出现 B 特有「风湿性多肌痛（PMR）」', bLabel.key === 'B' && cbB.text.includes('风湿性多肌痛（PMR）'), { footer: bLabel.footer })
  const epB = await go('episodes/list')
  const epB2 = await page.evaluate(() => {
    /* 行动计划原文在折叠 details 里：先全部展开再读 innerText（先证非空再断言） */
    document.querySelectorAll('#view details.phase-fold').forEach((d) => { d.open = true })
    return { folds: document.querySelectorAll('#view details.phase-fold').length, text: document.querySelector('#view').innerText }
  })
  t('EP2', 'episodes/list（B）4 次发作折叠卡 + 行动计划原文在场 + 近 90 天 0 次如实', epB2.folds === 4 && epB2.text.includes('近 90 天发作 0 次') && epB2.text.includes('当天联系风湿科值班电话') && epB2.text.includes('2025-01-18 起的发作'), { folds: epB2.folds })
  const tsB = await go('trials/search')
  const tsBCards = await page.evaluate(() => document.querySelectorAll('#view .trial-card').length)
  t('TS3', 'trials/search（B）分层卡片 2 张（长期随访 + 复发频率与托珠单抗研究）', tsBCards === 2 && tsB.text.includes('GCA 长期随访观察研究') && tsB.text.includes('GCA 复发频率与托珠单抗研究'), { cards: tsBCards })
  const bep = await go('screening/ultrasound')
  t('BEP1', 'screening/ultrasound（B）有记录 + 距上次月数 + 复查间隔以医生安排为准', bep.text.includes('晕环较前对照变薄') && bep.text.includes('距上次') && bep.text.includes('复查间隔以医生安排为准'), {})
  const lcB = await go('labs/cards')
  t('LC3', 'labs/cards（B）ESR 卡与分组系列仍在（B 档最近一次化验）', lcB.text.includes('血沉 ESR') && lcB.text.includes('参考上限'), {})
  await page.click('#profile-btn')
  await sleep(200)
  const aBack = await page.evaluate(() => ({ footer: document.querySelector('#footer-profile').textContent, key: window.__GCA_APP__.state.profileKey }))
  const cbBack = await go('basics/comorbidity')
  const epBack = await go('episodes/list')
  t('MT13b', '切回档案 A：PMR 消失、发作回空态（MT13 不串档）', aBack.key === 'A' && !cbBack.text.includes('风湿性多肌痛（PMR）') && cbBack.text.includes('未见合并症记录') && epBack.text.includes('还没有发作记录') && !epBack.text.includes('当天联系风湿科值班电话'), { footer: aBack.footer })

  /* ---------- SV/EF：收藏链路 + 发作录入（35 号四段呈现/收藏 + 发作空态修复） ----------
     断言前置缺失时显式记 FAIL（self-test 反向对照依赖这一点），不许静默跳过。 */
  await go('trials/search')
  const svBtn = await page.evaluate(() => document.querySelector('#view [data-save-trial]')?.getAttribute('data-save-trial') || null)
  if (svBtn) {
    await page.click('#view [data-save-trial]')
    await sleep(200)
    const svSaved = await go('trials/saved')
    const svInfo = await page.evaluate(() => ({
      rows: document.querySelectorAll('#view ul.list > li').length,
      states: [...document.querySelectorAll('#view [data-trial-state]')].map((b) => b.getAttribute('data-trial-state')),
      hasTimelineNote: document.querySelector('#view').innerText.includes('没有登记状态时间线'),
    }))
    t('SV1', '收藏：卡上有收藏按钮 → 点击 → 收藏页 1 条 + 三态 + 无登记时间线声明',
      svInfo.rows === 1 && svInfo.states.length === 3 && svInfo.hasTimelineNote, { svBtn, ...svInfo })
    const firstState = await page.evaluate(() => {
      [...document.querySelectorAll('#view [data-trial-state]')].find((b) => b.getAttribute('data-trial-state').endsWith('|asking'))?.click()
      return true
    })
    await sleep(150)
    const svState = await page.evaluate(() => ({ saved: (JSON.parse(localStorage.getItem('gca.savedTrials') || '[]')[0] || {}).state || null }))
    t('SV1b', '收藏三态切换落本机（在跟 → 准备问）', firstState && svState.saved === 'asking', svState)
    const rm = await page.evaluate(() => { document.querySelector('#view [data-trial-remove]')?.click(); return true })
    await sleep(150)
    const svAfterRemove = await page.evaluate(() => JSON.parse(localStorage.getItem('gca.savedTrials') || '[]').length)
    t('SV2', '收藏移除后恢复空收藏（可恢复）', rm && svAfterRemove === 0, { count: svAfterRemove })
    await go('trials/search')
    await page.click('#view [data-save-trial]')
    await sleep(150)
    await page.click('#view [data-save-trial]')
    await sleep(150)
    const svDup = await page.evaluate(() => JSON.parse(localStorage.getItem('gca.savedTrials') || '[]').length)
    t('SV3', '重复收藏拒收且无副作用（仍 1 条）', svDup === 1, { count: svDup })
  } else {
    t('SV1', '收藏：卡上有收藏按钮 → 点击 → 收藏页 1 条 + 三态 + 无登记时间线声明', false, { svBtn: null })
    t('SV1b', '收藏三态切换落本机（在跟 → 准备问）', false, { reason: 'no save button' })
    t('SV2', '收藏移除后恢复空收藏（可恢复）', false, { reason: 'no save button' })
    t('SV3', '重复收藏拒收且无副作用（仍 1 条）', false, { reason: 'no save button' })
  }
  {
    const epEmpty = await go('episodes/list')
    const hasForm = await page.evaluate(() => !!document.getElementById('episode-form'))
    if (hasForm) {
      await page.evaluate(() => document.querySelector('#view .empty button')?.click())
      await sleep(200)
      const noClickErr = errors.filter((e) => String(e).includes('Unexpected')).length === 0
      await page.evaluate(() => {
        document.getElementById('ep-start').value = '2026-11-10'
        document.getElementById('ep-signs').value = '头痛加重伴头皮压痛'
      })
      await page.click('#save-episode')
      await sleep(200)
      const efInfo = await page.evaluate(() => ({
        folds: document.querySelectorAll('#view details.phase-fold').length,
        text: document.querySelector('#view').innerText,
        toast: document.getElementById('toast') ? document.getElementById('toast').textContent : '',
      }))
      t('EF1', '发作空态按钮无报错 + 表单保存 → 列表 1 条折叠卡（demo 内存）+ 演示态提示',
        efInfo.folds === 1 && efInfo.toast.includes('演示') && noClickErr, { folds: efInfo.folds, toast: efInfo.toast.slice(0, 40), noClickErr })
    } else {
      t('EF1', '发作空态按钮无报错 + 表单保存 → 列表 1 条折叠卡（demo 内存）+ 演示态提示', false, { reason: 'no episode form' })
    }
  }

  /* ---------- C9：390 宽无横向溢出（CDP 设备仿真） ---------- */
  const client = await page.target().createCDPSession()
  await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await sleep(300)
  const narrow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  await client.send('Emulation.clearDeviceMetricsOverride')
  await page.setViewport({ width: 1280, height: 860 })
  await sleep(300)
  t('C9', '390 宽无横向溢出（scrollWidth===clientWidth===390）', narrow.sw === 390 && narrow.cw === 390, narrow)

  /* ---------- 全局页面错误 ---------- */
  t('ERR', '全程无页面错误（pageerror/console.error）', errors.length === 0, errors.slice(0, 3))

  await browser.close()
  const fails = results.filter(r => !r.pass)
  const counts = { total: results.length, pass: results.length - fails.length, fail: fails.length }
  console.log(`\nSUMMARY: ${counts.pass}/${counts.total} pass, ${counts.fail} fail` + (fails.length ? ' → ' + fails.map(f => f.id).join(', ') : ''))
  console.log('SUMMARY_JSON ' + JSON.stringify({ pass: fails.length === 0, counts }))
  if (SELF_TEST) {
    /* 反向对照：SV1/SV1b/SV2/SV3/EF1 五条必须全红，证明拆掉入口后探针有效 */
    const ids = ['SV1', 'SV1b', 'SV2', 'SV3', 'EF1']
    const broken = ids.every((id) => results.some((r) => r.id === id && !r.pass))
    console.log(broken ? 'self-test：反向对照已证明探针会红（PASS）' : 'self-test：反向对照没有变红（探针失效）')
    process.exit(broken ? 0 : 2)
  }
  process.exit(fails.length ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
