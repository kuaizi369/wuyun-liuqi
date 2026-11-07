/*! 五运六气浏览器版 —— 由 build.js 从 lib/ CommonJS 源码打包生成，勿手改 */
(function () {
'use strict';
var __modules = {};
__modules['lib/yunqi.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

// 五运六气核心引擎
// 年份取农历干支纪年（以立春分界可选；默认按农历年干支，与《内经》"先立其年以明其气"一致）
// 客气六步：三之气=司天，按三阴三阳次序排布（《运气要诀·客气司天在泉间气歌》）

const {
  GAN, ZHI, GAN_YUN, WUXING_YIN, ZHI_QI, QI_ORDER, QI_ORGANS, QI_TO_WUXING,
  ZHU_QI, ZHU_YUN_STEPS, KE_QI_LAYOUT, SAN_QI_ZHI, YUN_BING, QI_KE_ZHU_BING,
  ZAI_QUAN_ZHI, SI_TIAN_ZHI, SHENG_ZHI, FU_ZHI, YU_FA,
  FIVE_STARS, STAR_OMEN, WUXING_BIAN, YUN_FANG_SHI, NAN_BEI_ZHENG, BING_JI
} = require('./laws');
const { SIXTY_YEARS, ZHI_GROUPS, LIN_YUN_RULES } = require('./data60');

const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 我生
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };     // 我克
const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);

function ganzhiOfYear(year) {
  const idx = ((year - 4) % 60 + 60) % 60; // 公元4年为甲子
  return { gan: GAN[idx % 10], zhi: ZHI[idx % 12], idx60: idx };
}

function ganzhiOfMonth(year, month) {
  // 月干支：年干定寅月干（五虎遁），节气月以立春（约公历2/4）为寅月开始
  const { gan } = ganzhiOfYear(year);
  const yinStart = { 甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲' }[gan];
  const yinIdx = 2; // 寅在 ZHI 中的索引
  const mIdx = (((month - 2) % 12 + 12) % 12) + yinIdx; // 公历2月→寅，5月→巳
  const zhi = ZHI[mIdx % 12];
  const ganIdx = (GAN.indexOf(yinStart) + (mIdx - yinIdx)) % 10;
  return { gan: GAN[ganIdx], zhi, label: `${GAN[ganIdx]}${zhi}月` };
}

function lookupSixty(year) {
  const { gan, zhi } = ganzhiOfYear(year);
  return SIXTY_YEARS.find((r) => r.ganzhi === gan + zhi) || null;
}

// 中运推算：阳干太过、阴干不及
function getZhongYun(year) {
  const { gan } = ganzhiOfYear(year);
  const wuxing = GAN_YUN[gan];
  const level = YANG_GAN.has(gan) ? 'taiGuo' : 'buJi';
  const yin = WUXING_YIN[wuxing];
  const taiShao = level === 'taiGuo' ? '太' : '少';
  return { gan, wuxing, level, yin, taiShao: taiShao + yin };
}

// 客气排布：按地支组取表（《运气要诀》）
function getKeQi(zhiGroup) {
  return KE_QI_LAYOUT[zhiGroup];
}

// 客主加临顺逆：客生气/主气为从为顺，主克客为逆（《运气要诀·六气胜复歌》：主胜客逆客胜从）
function jiaLin(ke, zhu) {
  const kw = QI_ORDER.indexOf(ke), zw = QI_ORDER.indexOf(zhu);
  const keWx = { 厥阴风木: '木', 少阴君火: '火', 太阴湿土: '土', 少阳相火: '火', 阳明燥金: '金', 太阳寒水: '水' }[ke];
  const zhuWx = { 厥阴风木: '木', 少阴君火: '火', 太阴湿土: '土', 少阳相火: '火', 阳明燥金: '金', 太阳寒水: '水' }[zhu];
  if (ke === zhu) return { relation: '同气', label: '客主同气', ok: true };
  if (KE[keWx] === zhuWx) return { relation: '客胜主', label: `客气${keWx}克主气${zhuWx}——客胜主为从，其病轻`, ok: true };
  if (KE[zhuWx] === keWx) return { relation: '主胜客', label: `主气${zhuWx}克客气${keWx}——主胜客为逆，其病重`, ok: false };
  return { relation: '相得', label: `客${keWx}与主${zhuWx}生克相得`, ok: true };
}

// 天符/岁会/太乙天符/同天符/同岁会判定（《运气要诀·天符太乙天符岁会同天符同岁会歌》）
function getFuHui(year) {
  const { gan, zhi } = ganzhiOfYear(year);
  const yun = GAN_YUN[gan];
  const siTianWx = QI_TO_WUXING[ZHI_QI[zhi]];
  const zhiGroup = zhiGroupOf(zhi);
  const zaiQuanWx = ZHI_GROUPS[zhiGroup] ? ZHI_GROUPS[zhiGroup].zaiQuan.wuxing : '';
  const marks = [];
  if (yun === siTianWx) marks.push('天符');
  const zhengWei = { 卯: '木', 午: '火', 酉: '金', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土' };
  if (yun === zhengWei[zhi]) marks.push('岁会');
  if (yun === siTianWx && yun === zhengWei[zhi]) marks.push('太一天符');
  if (yun === zaiQuanWx && YANG_GAN.has(gan)) marks.push('同天符');
  if (yun === zaiQuanWx && !YANG_GAN.has(gan)) marks.push('同岁会');
  return marks;
}

function zhiGroupOf(zhi) {
  const g = { 子: '子午', 午: '子午', 丑: '丑未', 未: '丑未', 寅: '寅申', 申: '寅申', 卯: '卯酉', 酉: '卯酉', 辰: '辰戌', 戌: '辰戌', 巳: '巳亥', 亥: '巳亥' };
  return g[zhi];
}

// 运气相临（六十年上下相临）
function getLinYun(ganzhi) {
  const rule = LIN_YUN_RULES.find((r) => r.years.includes(ganzhi));
  return rule ? { type: rule.type, desc: rule.desc } : null;
}

// 平气判定（优先采用《六元正纪》标注，辅以规则推算）
function getPingQi(year, record) {
  const { gan, zhi } = ganzhiOfYear(year);
  const yun = GAN_YUN[gan];
  const zhiGroup = zhiGroupOf(zhi);
  const group = ZHI_GROUPS[zhiGroup];
  const isYang = YANG_GAN.has(gan);
  const reasons = [];
  if (record && record.pingQi) reasons.push(record.pingQi);
  const stWx = group ? QI_TO_WUXING[group.siTian.qi] : '';
  // 太过而被司天所克（如戊辰戌火太过遇太阳寒水司天）
  if (isYang && stWx && KE[stWx] === yun) {
    reasons.push(`中运${yun}太过，被司天${group.siTian.qi}所抑，反得其平`);
  }
  // 不及而得司天同气之助（如乙卯乙酉金不及遇阳明燥金司天）
  if (!isYang && stWx && stWx === yun) {
    reasons.push(`中运${yun}不及，得司天${group.siTian.qi}同气之助，化为平气`);
  }
  return reasons.filter(Boolean);
}

// 中运与司天生克（用于病情轻重判断）
function yunSiTianRelation(year) {
  const { gan, zhi } = ganzhiOfYear(year);
  const yunWx = GAN_YUN[gan];
  const siTian = ZHI_QI[zhi];
  const stWx = QI_TO_WUXING[siTian];
  if (yunWx === stWx) return { label: `中运${yunWx}与司天${siTian}同气（天符）——同气偏胜，亢害尤甚`, weight: '重' };
  if (KE[stWx] === yunWx) return { label: `司天${stWx}克中运${yunWx}（天刑）——不相得，其病速而危`, weight: '重' };
  if (SHENG[stWx] === yunWx) return { label: `司天${stWx}生中运${yunWx}（顺化）——相得之岁`, weight: '轻' };
  if (SHENG[yunWx] === stWx) return { label: `中运${yunWx}生司天${siTian}（小逆）——子居母上，主微病`, weight: '中' };
  if (KE[yunWx] === stWx) return { label: `中运${yunWx}克司天${siTian}（不和）——以下克上，主病甚`, weight: '重' };
  return { label: '运气相得', weight: '轻' };
}

// 年度完整盘
function getYearYunqi(year) {
  const gz = ganzhiOfYear(year);
  const zhiGroup = zhiGroupOf(gz.zhi);
  const group = ZHI_GROUPS[zhiGroup];
  const record = lookupSixty(year);
  const zhongYun = getZhongYun(year);
  const keQi = getKeQi(zhiGroup);
  const fuHui = getFuHui(year);
  const linYun = getLinYun(gz.gan + gz.zhi);
  const relation = yunSiTianRelation(year);
  const pingQi = getPingQi(year, record);

  const sanQi = (record && pingQi.length ? 'ping' : zhongYun.level);
  const sanQiInfo = SAN_QI_ZHI[pingQi.length ? 'ping' : zhongYun.level][zhongYun.wuxing] || SAN_QI_ZHI[zhongYun.level][zhongYun.wuxing];

  const yunBing = YUN_BING[zhongYun.level][zhongYun.wuxing];
  const siTianBing = QI_KE_ZHU_BING[group.siTian.qi];
  const steps = ZHU_QI.map((z, i) => ({
    ...z,
    keQi: keQi[i],
    jiaLin: jiaLin(keQi[i], z.qi),
    bing: (group && group.steps ? group.steps[i] : ''),
    jiBing: {
      siTian: i === 2 ? `${group.siTian.qi}司天主上半年：${siTianBing.siTianBing}` : null
    }
  }));

  return {
    year,
    ganzhi: gz.gan + gz.zhi,
    zhiGroup,
    zheng: group.zheng,
    yunZhu: `气化营运${group.yunZhu}`,
    zhongYun: {
      ...zhongYun,
      sanQiName: sanQiInfo.name,
      sanQiDesc: sanQiInfo.desc,
      jing: sanQiInfo.jing || ''
    },
    siTian: { ...group.siTian, organs: QI_ORGANS[group.siTian.qi], zhiZhi: SI_TIAN_ZHI[group.siTian.qi], bing: siTianBing.siTianBing },
    zaiQuan: { ...group.zaiQuan, organs: QI_ORGANS[group.zaiQuan.qi], zhiZhi: ZAI_QUAN_ZHI[group.zaiQuan.qi], bing: siTianBing.zaiQuanBing },
    keQi,
    zhuQi: ZHU_QI,
    steps,
    fuHui,
    linYun,
    relation,
    pingQi,
    shengFu: record && record.shengFu ? record.shengFu : '',
    zaiGong: record ? record.zaiGong : '',
    qiYun: record ? record.qiYun : '',
    qiHua: record ? record.qiHua : '',
    qiBian: record ? record.qiBian : '',
    qiBingYun: record ? record.qiBingYun : '',
    huaShu: record ? record.huaShu : null,
    yaoShiYi: record ? record.yaoShiYi : null,
    minBing: group.zongBing,
    suiYi: group.suiYi,
    shiGu: group.shiGu,
    tianXiang: group.tiangXiang,
    starOmen: pingQi.length ? STAR_OMEN.ping(zhongYun.wuxing) : (zhongYun.level === 'taiGuo' ? STAR_OMEN.taiGuo(zhongYun.wuxing) : STAR_OMEN.buJi(zhongYun.wuxing)),
    wuxingBian: WUXING_BIAN[zhongYun.wuxing],
    yunBing,
    yuFa: YU_FA[zhongYun.wuxing],
    fangJi: {
      yunFang: YUN_FANG_SHI[zhongYun.level][zhongYun.wuxing],
      qiFang: group.fangJi
    },
    nanBeiZheng: (gz.gan === '甲' || gz.gan === '己') ? { zheng: '南政', note: NAN_BEI_ZHENG.nanZheng } : { zheng: '北政', note: NAN_BEI_ZHENG.beiZheng },
    bingJi: BING_JI[zhongYun.wuxing],
    note: record && record.fuHui && record.fuHui.length ? record.fuHui : fuHui
  };
}

// 六步定位：给定月/日返回所在步（近似节气：初之气大寒1/20，春分3/21，小满5/21，大暑7/23，秋分9/23，小雪11/22）
const JIE_QI_BOUNDARY = [[1, 20], [3, 21], [5, 21], [7, 23], [9, 23], [11, 22]];
function getStepByDate(y, m, d) {
  const point = m * 100 + d;
  // 小雪11/22 起为终之气，跨年到大寒
  if (point >= 1122 || point < 120) return { index: 5, ...ZHU_QI[5] };
  for (let i = 0; i < 5; i++) {
    const [sm, sd] = JIE_QI_BOUNDARY[i];
    const [em, ed] = JIE_QI_BOUNDARY[(i + 1) % 6];
    const s = sm * 100 + sd, e = em * 100 + ed;
    if (point >= s && point < e) return { index: i, ...ZHU_QI[i] };
  }
  return { index: 0, ...ZHU_QI[0] };
}

function getMonthYunqi(year, month, day) {
  const yq = getYearYunqi(year);
  const step = getStepByDate(year, month, day || 15);
  const gzMonth = ganzhiOfMonth(year, month);
  // 主运五步定位（近似）：初运大寒~春分后12日 约到4/2；二运到6/21；三运到8/29；四运到11/11；五运到小寒末
  let zhuYunIdx = 0;
  const p = month * 100 + (day || 15);
  if (p >= 120 && p < 403) zhuYunIdx = 0;
  else if (p >= 403 && p < 620) zhuYunIdx = 1;
  else if (p >= 620 && p < 829) zhuYunIdx = 2;
  else if (p >= 829 && p < 1111) zhuYunIdx = 3;
  else zhuYunIdx = 4;
  // 客运：以年中运为初运，五行相生轮
  const zhongWx = yq.zhongYun.wuxing;
  const chain = [zhongWx];
  for (let i = 1; i < 5; i++) chain.push(SHENG[chain[i - 1]]);
  const keYunWx = chain[zhuYunIdx];
  const level = yq.zhongYun.level; // 年运太少定主运太少（《五音主客太少相生歌》：以客取主太少生）
  const yin = WUXING_YIN[keYunWx];
  const taiShaoKe = (level === 'taiGuo' ? ['太', '少', '太', '少', '太'] : ['少', '太', '少', '太', '少'])[zhuYunIdx];

  return {
    year, month, day: day || null,
    ganzhi: yq.ganzhi,
    monthGanzhi: gzMonth.label,
    step: {
      index: step.index,
      name: step.name,
      period: step.period,
      months: step.months,
      zhuQi: step.qi,
      keQi: yq.keQi[step.index],
      jiaLin: jiaLin(yq.keQi[step.index], step.qi),
      bing: yq.steps[step.index].bing
    },
    yunStep: {
      zhuYun: ZHU_YUN_STEPS[zhuYunIdx],
      keYun: { wuxing: keYunWx, yin, taiShao: taiShaoKe + yin, note: '客运以年中运为初运，五行相生轮转；太少由年中运太少相生而定' }
    },
    yongYao: {
      stepZhi: yq.steps[step.index].bing ? `本步病候：${yq.steps[step.index].bing}` : '',
      yaoShiYi: yq.yaoShiYi,
      fangJi: yq.fangJi
    }
  };
}

module.exports = {
  ganzhiOfYear, ganzhiOfMonth, getZhongYun, getKeQi, getFuHui, zhiGroupOf,
  getLinYun, getPingQi, yunSiTianRelation, getYearYunqi, getStepByDate, getMonthYunqi,
  jiaLin, lookupSixty
};
};
__modules['lib/laws.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

// 运气规则知识层
// 数据源：《素问·气交变大论》《素问·五常政大论》《素问·至真要大论》
//         《运气要诀》《素问玄机原病式》《三因极一病证方论》

// ===== 干支基础 =====
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干化五运（《天元纪大论》）：甲己之岁土运统之……
const GAN_YUN = { 甲: '土', 己: '土', 乙: '金', 庚: '金', 丙: '水', 辛: '水', 丁: '木', 壬: '木', 戊: '火', 癸: '火' };
// 五音（《运气要诀·五音主客太少相生歌》）
const WUXING_YIN = { 土: '宫', 金: '商', 水: '羽', 木: '角', 火: '征' };
// 地支化六气（《天元纪大论》）：子午之岁上见少阴……
const ZHI_QI = {
  子: '少阴君火', 午: '少阴君火',
  丑: '太阴湿土', 未: '太阴湿土',
  寅: '少阳相火', 申: '少阳相火',
  卯: '阳明燥金', 酉: '阳明燥金',
  辰: '太阳寒水', 戌: '太阳寒水',
  巳: '厥阴风木', 亥: '厥阴风木'
};
const QI_WUXING = { 风木: '木', 君火: '火', 相火: '火', 湿土: '土', 燥金: '金', 寒水: '水' };
const QI_TO_WUXING = {
  '厥阴风木': '木', '少阴君火': '火', '太阴湿土': '土',
  '少阳相火': '火', '阳明燥金': '金', '太阳寒水': '水'
};
// 三阴三阳次序（《运气要诀·起主客定位指掌歌》：一生二，二生三，三复生一）
const QI_ORDER = ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水'];

// 六气对应脏腑（《运气合脏腑十二经络歌》）
const QI_ORGANS = {
  '厥阴风木': '肝、胆', '少阴君火': '心、小肠', '太阴湿土': '脾、胃',
  '少阳相火': '三焦、包络', '阳明燥金': '肺、大肠', '太阳寒水': '膀胱、肾'
};

// 主气六步（年年不变）
const ZHU_QI = [
  { name: '初之气', qi: '厥阴风木', period: '大寒~春分', months: '约1月下旬~3月下旬' },
  { name: '二之气', qi: '少阴君火', period: '春分~小满', months: '约3月下旬~5月下旬' },
  { name: '三之气', qi: '少阳相火', period: '小满~大暑', months: '约5月下旬~7月下旬' },
  { name: '四之气', qi: '太阴湿土', period: '大暑~秋分', months: '约7月下旬~9月下旬' },
  { name: '五之气', qi: '阳明燥金', period: '秋分~小雪', months: '约9月下旬~11月下旬' },
  { name: '终之气', qi: '太阳寒水', period: '小雪~大寒', months: '约11月下旬~次年1月下旬' }
];

// 主运五步（《运气要诀·运气分主节令歌》：初大二春十三日，三运芒种十日甫，四运处暑后七日，五运立冬四日主）
const ZHU_YUN_STEPS = [
  { name: '初运', yin: '角', wuxing: '木', start: '大寒日', note: '大寒日起，至春分后十二日' },
  { name: '二运', yin: '征', wuxing: '火', start: '春分后十三日', note: '春分后十三日起，至芒种后九日' },
  { name: '三运', yin: '宫', wuxing: '土', start: '芒种后十日', note: '芒种后十日起，至处暑后六日' },
  { name: '四运', yin: '商', wuxing: '金', start: '处暑后七日', note: '处暑后七日起，至立冬后三日' },
  { name: '五运', yin: '羽', wuxing: '水', start: '立冬后四日', note: '立冬后四日起，至小寒末日' }
];

// 客气排布：三之气=司天；按三阴三阳次序倒推初气
// 子午：初太阳 二厥阴 三少阴 四太阴 五少阳 六阳明（《客气司天在泉间气歌》）
const KE_QI_LAYOUT = {
  子午: ['太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金'],
  丑未: ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水'],
  寅申: ['少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水', '厥阴风木'],
  卯酉: ['太阴湿土', '少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火'],
  辰戌: ['少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土'],
  巳亥: ['阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火']
};

// ===== 三气之纪（《五常政大论》+《运气要诀·五运平气太过不及歌》） =====
const SAN_QI_ZHI = {
  ping: {
    木: { name: '敷和', desc: '木德周行，阳舒阴布，五化宣平；其候温和，其令风' },
    火: { name: '升明', desc: '正阳而治，德施周普，五化均衡；其候炎暑，其令热' },
    土: { name: '备化', desc: '气协天休，德流四政，五化齐修；其候溽蒸，其令湿' },
    金: { name: '审平', desc: '收而不争，杀而无犯，五化宣明；其候清切，其令燥' },
    水: { name: '静顺', desc: '藏而勿害，治而善下，五化咸整；其候凝肃，其令寒' }
  },
  taiGuo: {
    木: { name: '发生', desc: '生气淳化，万物以荣；其病怒；其变振拉摧拔；不务其德则收气复，秋气劲切，甚则肃杀，邪伤肝', jing: '足厥阴少阳' },
    火: { name: '赫曦', desc: '炎暑施化，物得以昌；其病笑疟疮疡血流狂妄目赤；暴烈其政则时见凝惨，甚则雨水霜雹切寒，邪伤心', jing: '手少阴太阳、手厥阴少阳' },
    土: { name: '敦阜', desc: '厚德清静，顺长以盈，至阴内实，物化充成；其病腹满四肢不举；大风迅至，邪伤脾', jing: '足太阴阳明' },
    金: { name: '坚成', desc: '天气洁，地气明，燥行其政，物以司成；其病喘喝胸凭仰息；政暴变则名木不荣，邪伤肺', jing: '手太阴阳明' },
    水: { name: '流衍', desc: '寒司物化，天地严凝，藏政以布，长令不扬；其病胀；政过则化气大举，埃昏气交，大雨时降，邪伤肾', jing: '足少阴太阳' }
  },
  buJi: {
    木: { name: '委和', desc: '生气不政，化气乃扬，长气自平，收令乃早，凉雨时降，风云并兴，草木晚荣；其病摇动注恐、肢废痈肿疮疡；萧飋肃杀则炎赫沸腾（复），眚于三', jing: '足厥阴少阳' },
    火: { name: '伏明', desc: '长气不宣，脏气反布，收气自政，寒清数举，暑令乃薄；其病昏惑悲忘；凝惨凛冽则豪雨霖霪（复），眚于九', jing: '手少阴太阳' },
    土: { name: '卑监', desc: '化气不令，生政独彰，长气整，雨乃愆，收气平，风寒并兴，草木荣美，秀而不实；其病留满痞塞、飧泄；振拉飘扬则苍干散落（复），眚于四维', jing: '足太阴阳明' },
    金: { name: '从革', desc: '收气乃后，生气乃扬，长化合德，火政乃宣，庶类以蕃；其病嚏咳鼽衄；炎光赫烈则冰雪霜雹（复），眚于七', jing: '手太阴阳明' },
    水: { name: '涸流', desc: '藏令不举，化气乃昌，长气宣布，蛰虫不藏，土润水泉减；其病痿厥坚下、癃闭；埃昏骤雨则振拉摧拔（复），眚于一', jing: '足少阴太阳' }
  }
};

// ===== 五运太过/不及病候（《气交变大论》+《运气要诀·五运客运太过为病歌》） =====
const YUN_BING = {
  taiGuo: {
    木: { head: '岁木太过（六壬年），风气流行，脾土受邪', bing: '民病飧泄食减，体重烦冤，肠鸣腹支满；甚则忽忽善怒，眩冒巅疾、胁痛吐甚。木胜衰则金复：更见善怒颠疾、摇落之复', tian: '上应岁星；甚则云物飞动，草木不宁；复则上应太白星', maiJue: '冲阳脉绝者死不治（脾胃绝）', fuBing: '复病在肺：胸痛引背、两胁满且痛引少腹' },
    火: { head: '岁火太过（六戊年），炎暑流行，肺金受邪', bing: '民病疟，少气咳喘，血溢血泄注下，嗌燥耳聋，中热肩背热；甚则胸中痛，胁支满胁痛，膺背肩胛间痛，两臂内痛，身热骨痛而为浸淫', tian: '上应荧惑星；收气不行，长气独明，雨水霜寒；上临少阴少阳则火燔焫水泉涸，病反谵妄狂越，咳喘息鸣，下甚血溢泄不已', maiJue: '太渊脉绝者死不治（肺绝）', fuBing: '复病在肾心：谵语狂乱，胸背痛，雨冰雹早霜寒之复' },
    土: { head: '岁土太过（六甲年），雨湿流行，肾水受邪', bing: '民病腹痛，清厥意不乐，体重烦冤；甚则肌肉萎，足痿不收，行善瘈，脚下痛，饮发中满食减，四肢不举', tian: '上应镇星；泉涌河衍，涸泽生鱼，风雨大至，土崩溃，鳞见于陆', maiJue: '太溪脉绝者死不治（肾绝）', fuBing: '复病在肝脾：腹满溏泄肠鸣，风雨大至之复' },
    金: { head: '岁金太过（六庚年），燥气流行，肝木受邪', bing: '民病两胁下少腹痛，目赤痛眦疡，耳无所闻；肃杀而甚则体重烦冤，胸痛引背，两胁满且痛引少腹；甚则喘咳逆气，肩背痛，尻阴股膝髀腨胻足皆病，咳逆甚而血溢', tian: '上应太白星；收气峻，生气下，草木敛，苍干雕陨；复则上应荧惑星', maiJue: '太冲脉绝者死不治（肝绝）', fuBing: '复病在心肝：暴痛胠胁不可反侧，苍干焦槁之复' },
    水: { head: '岁水太过（六丙年），寒气流行，邪害心火', bing: '民病身热烦心躁悸，阴厥上下中寒，谵妄心痛，寒气早至；甚则腹大胫肿，喘咳，寝汗出憎风', tian: '上应辰星；大雨至，埃雾朦郁；上临太阳则雨冰雪霜不时降，病反腹满肠鸣溏泄食不化，渴而妄冒', maiJue: '神门脉绝者死不治（心绝）', fuBing: '复病在脾肾：肿、喘、中寒，腹满溏泻肠鸣，饮食不化之复' }
  },
  buJi: {
    木: { head: '岁木不及（六丁年），燥乃大行，生气失应，草木晚荣', bing: '民病中清，胠胁痛，少腹痛，肠鸣溏泄；复则炎暑流火，病寒热疮疡痱胗痈痤，咳而鼽', tian: '上应太白星；复则上应荧惑、太白星；其谷苍', zheng: '木不及，春有鸣条律畅之化则秋有雾露清凉之政；春有惨凄残贼之胜则夏有炎暑燔烁之复；其眚东，其脏肝，其病内舍胠胁，外在关节', xiang: '上临阳明（丁卯丁酉）生气失政，草木再荣' },
    火: { head: '岁火不及（六癸年），寒乃大行，长政不用，物荣而下', bing: '民病胸中痛，胁支满，两胁痛，膺背肩胛间及两臂内痛，郁冒朦昧，心痛暴喑，胸腹大，胁下与腰背相引而痛，甚则屈不能伸，髋髀如别；复则埃郁大雨且至，病鹜溏腹满，食饮不下，寒中肠鸣，泄注腹痛，暴挛痿痹，足不任身', tian: '上应辰星；复则上应镇星、辰星；其谷丹', zheng: '火不及，夏有炳明光显之化则冬有严肃霜寒之政；夏有惨凄凝冽之胜则不时有埃昏大雨之复；其眚南，其脏心，其病内舍膺胁，外在经络' },
    土: { head: '岁土不及（六己年），风乃大行，化气不令，草木茂荣，飘扬而甚，秀而不实', bing: '民病飧泄霍乱，体重腹痛，筋骨繇复，肌肉瞤酸，善怒，咸病寒中；复则收政严峻，名木苍雕，胸胁暴痛，下引少腹，善太息，虫食甘黄，气客于脾，民食少失味', tian: '上应岁星；复则上应太白、岁星；其谷黅', zheng: '土不及，四维有埃云润泽之化则春有鸣条鼓拆之政；四维发振拉飘腾之变则秋有肃杀霖霪之复；其眚四维，其脏脾，其病内舍心腹，外在肌肉四肢', xiang: '上临厥阴（己巳己亥）流水不冰，蛰虫来见，民乃康' },
    金: { head: '岁金不及（六乙年），炎火乃行，生气乃用，长气专胜，燥烁以行', bing: '民病肩背瞀重，鼽嚏血便注下；复则寒雨暴至，乃零冰雹霜雪杀物，阴厥且格，阳反上行，头脑户痛，延及囟顶发热，民病口疮，甚则心痛', tian: '上应荧惑星；复则上应辰星；其谷坚芒', zheng: '金不及，夏有光显郁蒸之令则冬有严凝整肃之应；夏有炎烁燔燎之变则秋有冰雹霜雪之复；其眚西，其脏肺，其病内舍膺胁肩背，外在皮毛' },
    水: { head: '岁水不及（六辛年），湿乃大行，长气反用，其化乃速，暑雨数至', bing: '民病腹满身重，濡泄寒疡流水，腰股痛发，腘腨股膝不便，烦冤足痿清厥，脚下痛，甚则跗肿，肾气不衡；复则大风暴发，草偃木零，面色时变，筋骨并辟，肉瞤瘛，目视䀮䀮，肌肉胗发，气并膈中，痛于心腹', tian: '上应辰星；复则上应岁星；其谷眚于北', zheng: '水不及，四维有湍润埃云之化则不时有和风生发之应；四维发埃昏骤注之变则不时有飘荡振拉之复；其眚北，其脏肾，其病内舍腰脊骨髓，外在溪谷踹膝', xiang: '上临太阴（辛丑辛未）大寒数举，民病寒疾于下，甚则腹满浮肿' }
  }
};

// ===== 六气客气主病（《运气要诀·六气客气主病歌》） =====
const QI_KE_ZHU_BING = {
  '少阴君火': { siTianBing: '少阴司天热下临，肺气上从病肺心；燥行于地肝应病，燥热交加民病生：喘咳血溢及血泻，寒热鼽嚏涕流频，疮疡目赤嗌干肿，厥心胁痛苦呻吟', zaiQuanBing: '岁少阴在泉，热淫所胜：民病腹中常鸣，气上冲胸，喘不能久立，寒热皮肤痛，目瞑齿痛䪿肿，恶寒发热如疟，少腹中痛腹大' },
  '太阴湿土': { siTianBing: '太阴司天湿下临，肾气上从病肾阴；寒行于地心脾病，寒湿交攻内外淫：民病身重足跗肿，霍乱痞满腹胀髀，肢厥拘急脚下痛，少腹腰疼转动屯', zaiQuanBing: '岁太阴在泉，湿淫所胜：民病饮积，心痛，耳聋浑浑焞焞，嗌肿喉痹，阴病血见，少腹痛肿，不得小便，病冲头痛，目似脱，项似拔，腰似折' },
  '少阳相火': { siTianBing: '少阳司天火下临，肺气上从火刑金；风行于地肝木胜，风火为灾是乃因：民病热中咳失血，目赤喉痹聋眩瞑，疮疡心痛瞀瘛冒，暴死皆因臣犯君', zaiQuanBing: '岁少阳在泉，火淫所胜：民病注泄赤白，少腹痛溺赤，甚则血便。少阴同候' },
  '阳明燥金': { siTianBing: '阳明司天燥下临，肝气上从病肝筋；热行于地心肺害，清燥风热互交侵：民病寒热咳鼽郁，掉振筋痿力难伸，烦冤胁痛心热痛，目痛眦红小便熏', zaiQuanBing: '岁阳明在泉，燥淫所胜：民病喜呕，呕有苦，善大息，心胁痛不能反侧，甚则嗌干面尘，身无膏泽，足外反热' },
  '太阳寒水': { siTianBing: '太阳司天寒下临，心气上从病脉心；湿行于地脾肉病，寒湿热内去推寻：民病寒中终反热，痈疽火郁病缠身，皮瘖肉苛足痿软，濡泻满肿乃湿根', zaiQuanBing: '岁太阳在泉，寒淫所胜：民病少腹控睾，引腰脊，上冲心痛，血见，嗌痛颔肿' },
  '厥阴风木': { siTianBing: '厥阴司天风下临，脾气上从脾病生；火行于地冬温化，风火寒湿为病民：耳鸣掉眩风化病，支满肠鸣飧泻频，体重食减肌肉痿，温厉为灾火化淫', zaiQuanBing: '岁厥阴在泉，风淫所胜：民病洒洒振寒，善伸数欠，心痛支满，两胁里急，饮食不下，膈咽不通，食则呕，腹胀善噫' }
};

// ===== 治则体系（《至真要大论》） =====
// 1) 六气在泉淫胜治则
const ZAI_QUAN_ZHI = {
  '厥阴风木': '风淫于内，治以辛凉，佐以苦，以甘缓之，以辛散之',
  '少阴君火': '热淫于内，治以咸寒，佐以甘苦，以酸收之，以苦发之',
  '太阴湿土': '湿淫于内，治以苦热，佐以酸淡，以苦燥之，以淡泄之',
  '少阳相火': '火淫于内，治以咸冷，佐以苦辛，以酸收之，以苦发之',
  '阳明燥金': '燥淫于内，治以苦温，佐以甘辛，以苦下之',
  '太阳寒水': '寒淫于内，治以甘热，佐以苦辛，以咸泻之，以辛润之，以苦坚之'
};
// 2) 六气司天淫胜治则
const SI_TIAN_ZHI = {
  '厥阴风木': '风淫所胜，平以辛凉，佐以苦甘，以甘缓之，以酸泻之',
  '少阴君火': '热淫所胜，平以咸寒，佐以苦甘，以酸收之',
  '太阴湿土': '湿淫所胜，平以苦热，佐以酸辛，以苦燥之，以淡泄之；湿上甚而热，治以苦温，佐以甘辛，以汗为故而止',
  '少阳相火': '火淫所胜，平以酸冷，佐以苦甘，以酸收之，以苦发之，以酸复之，热淫同',
  '阳明燥金': '燥淫所胜，平以苦温，佐以酸辛，以苦下之',
  '太阳寒水': '寒淫所胜，平以辛热，佐以甘苦，以咸泻之'
};
// 3) 六气之胜治则
const SHENG_ZHI = {
  '厥阴风木': '厥阴之胜，治以甘清，佐以苦辛，以酸泻之。主病：耳鸣头眩，愦愦欲吐，胃膈如寒，大风数举，胁气并化而为热，小便黄赤，胃脘当心而痛，上支两胁，肠鸣飧泄',
  '少阴君火': '少阴之胜，治以辛寒，佐以苦咸，以甘泻之。主病：心下热善饥，脐下反动，气游三焦，炎暑至，呕逆躁烦，腹满痛溏泄，传为赤沃',
  '太阴湿土': '太阴之胜，治以咸热，佐以辛甘，以苦泻之。主病：火气内郁，疮疡于中，流散于外，病在胠胁，甚则心痛热格，头痛喉痹项强，雨数至，少腹满，腰脽重强，足胫胕肿，饮发于中',
  '少阳相火': '少阳之胜，治以辛寒，佐以甘咸，以甘泻之。主病：热客于胃，烦心心痛，目赤欲呕，呕酸善饥，耳痛溺赤，善惊谵妄，暴热消烁，少腹痛，下沃赤白',
  '阳明燥金': '阳明之胜，治以酸温，佐以辛甘，以苦泄之。主病：清发于中，左胠胁痛溏泄，内为嗌塞，外发㿉疝，大凉肃杀，华英改容，胸中不便，嗌塞而咳',
  '太阳寒水': '太阳之胜，治以甘热，佐以辛酸，以咸泻之。主病：凝凛且至，非时水冰，痔疟发，寒厥入胃则内生心痛，血脉凝泣，或为血泄，皮肤痞肿，腹满食减，头项囟顶脑户中痛，目如脱，寒入下焦传为濡泻'
};
// 4) 六气之复读治则
const FU_ZHI = {
  '厥阴风木': '厥阴之复，治以酸寒，佐以甘辛，以酸泻之，以甘缓之。主病：少腹坚满，里急暴痛，偃木飞沙，厥心痛，汗发呕吐，饮食不入，筋骨掉眩清厥，甚则入脾食痹而吐（冲阳绝死不治）',
  '少阴君火': '少阴之复，治以咸寒，佐以苦辛，以甘泻之，以酸收之，辛苦发之，以咸软之。主病：燠热内作，烦躁鼽嚏，少腹绞痛，嗌燥，咳，皮肤痛，暴喑心痛，郁冒不知人，寒已而热，渴而欲饮，病痱胗疮疡痈疽痤痔，甚则入肺咳而鼻渊（天府绝死不治）',
  '太阴湿土': '太阴之复，治以苦热，佐以酸辛，以苦泻之，燥之泄之。主病：湿变乃举，体重中满，食饮不化，阴气上厥，饮发于中，咳喘有声，大雨时行，头顶痛重而掉瘛尤甚，呕而密默，唾吐清液，甚则入肾窍泻无度（太溪绝死不治）',
  '少阳相火': '少阳之复，治以咸冷，佐以苦辛，以咸软之，以酸收之，辛苦发之；发不远热，无犯温凉。主病：大热将至，枯燥燔爇，惊瘛咳衄，心热烦躁，便数憎风，面如浮埃，目乃瞤瘛，上为口糜呕逆，血溢血泄，发而为疟，甚则入肺咳而血泄（尺泽绝死不治）',
  '阳明燥金': '阳明之复，治以辛温，佐以苦甘，以苦泄之，以苦下之，以酸补之。主病：清气大举，森木苍干，病生胠胁，气归于左，善太息，甚则心痛痞满，腹胀而泄，呕苦咳哕烦心，头痛，甚则入肝惊骇筋挛（太冲绝死不治）',
  '太阳寒水': '太阳之复，治以咸热，佐以甘辛，以苦坚之。主病：厥气上行，水凝雨冰，心胃生寒，胸膈不利，心痛痞满，头痛善悲，时眩仆，食减，腰脽反痛，屈伸不便，少腹控睾引腰脊上冲心，甚则入心善忘善悲（神门绝死不治）'
};
// 5) 五郁之发与治则（《六元正纪大论》+《运气要诀·五运郁极乃发歌》）
const YU_FA = {
  木: { faShi: '发无恒时（木善行数变，其气无常）', zhengZhao: '太虚苍埃，天山一色，或气浊色，黄黑郁若，横云不起雨；长川草偃，柔叶呈阴，松吟高山', tian: '太虚埃昏，云物以扰，大风乃至，屋发折木', bing: '民病胃脘当心而痛，上支两胁，膈咽不通，食饮不下，甚则耳鸣眩转，目不识人，善暴僵仆', zhi: '木郁达之：宜以辛散之、疏之，以甘调之、缓之，以苦涌之、平之' },
  火: { faShi: '待三气火时而发（其气四）', zhengZhao: '刻终大温，汗濡玄府；华发水凝，山川冰雪，焰阳午泽', tian: '太虚肿翳，大明不彰，炎火行，大暑至，山泽燔燎，材木流津', bing: '民病少气，疮疡痈肿，胁腹胸背面首四肢膹愤胪胀，疡痱呕逆，瘛疭骨痛，注下温疟，腹中暴痛，血溢流注，目赤心热，甚则瞀闷懊憹，善暴死', zhi: '火郁发之：宜以辛温发之，以辛甘扬之，以辛凉解之，以辛苦散之' },
  土: { faShi: '待四气土时而发（以其四气）', zhengZhao: '云横天山，浮游生灭，怫之先兆', tian: '岩谷震惊，雷殷气交，埃昏黄黑，化为白气，飘骤高深，击石飞空，洪水乃从', bing: '民病心腹胀，肠鸣而为数后，甚则心痛胁䐜，呕吐霍乱，饮发注下，胕肿身重', zhi: '土郁夺之：在外者汗之，在内者攻之，在上者吐之，在下者利之' },
  金: { faShi: '待五气金时而发（其气五）', zhengZhao: '夜零白露，林莽声凄', tian: '天洁地明，风清气切，大凉乃举，草树浮烟，燥气以行，霿雾数起，杀气来至，草木苍干', bing: '民病咳逆，心胁满引少腹，善暴痛，不可反侧，嗌干面尘色恶', zhi: '金郁泄之：宜以辛宣之、疏之、润之，以苦泄之、降之、清之' },
  水: { faShi: '不待终气，每发于二气三气二火时前后（水阴性险，见阳初退即进乘之）', zhengZhao: '太虚深玄，气犹麻散，微见而隐，色黑微黄', tian: '阳气乃辟，阴气暴举，大寒乃至，川泽严凝，寒雰结为霜雪，甚则黄黑昏翳，乃为霜杀', bing: '民病寒客心痛，腰脽痛，大关节不利，屈伸不便，善厥逆，痞坚腹满', zhi: '水郁折之：宜以辛苦逐之、导之，以辛淡渗之、通之' }
};

// ===== 天象预测（《气交变大论》+《运气要诀·五星所见太过不及歌》） =====
const FIVE_STARS = { 木: '岁星', 火: '荧惑星', 土: '镇星', 金: '太白星', 水: '辰星' };
const STAR_OMEN = {
  taiGuo: (wx) => `${FIVE_STARS[wx]}（${wx}星）北越：越出本度而近于北，光芒倍常之一至二，其色纯正；畏星（所胜之行）失其本色而兼生我之母色（如木太过则土星失黄而兼赤）。星速于天为逆，灾病重；稽留守度日多则灾重`,
  buJi: (wx) => `${FIVE_STARS[wx]}（${wx}星）减常之一二，光芒缩；其色兼我所不胜之色（如木不及则岁星青兼白色）。星迟于天为顺，灾病轻；稽留不进守度日少则灾轻`,
  ping: (wx) => `主岁之星不大不小，不芒不暗，不疾不徐，行所行道，守所守度，此其常也（${FIVE_STARS[wx]}守常）`
};
// 五运德政令化灾变（《五行德政令化灾变歌》）
const WUXING_BIAN = {
  木: '木德温和政舒启，其令宣发化生荣；其变烈风云物飞（风之胜），其灾摧拔殒落零',
  火: '火德彰显化蕃茂，其令为热政曜明；其变灾烈水泉涸（热之胜），其灾焦灼萎枯形',
  土: '土德溽蒸政安静，其令云雨其化丰；其变阴埃震骤注（湿之胜），其灾霖雨岸堤崩',
  金: '金德清洁政劲切，其化紧敛令露膏；其变肃杀霜早降（燥之胜），其灾苍干草木凋',
  水: '水德凄沧政坚肃，其化清谧其令寒；其变凛冽寒太甚（寒之胜），其灾冰雹霜雪连'
};

// ===== 十干运气方（《三因极一病证方论·五运时气民病证治》） =====
const YUN_FANG_SHI = {
  taiGuo: {
    木: { name: '茯苓白术汤', zhu: '治六壬年岁木太过，风气流行脾土受邪：飧泄食减，体重烦冤，肠鸣腹支满。组成：白茯苓、白术、厚朴(姜制)、半夏(汤洗)、青皮、干姜(炮)、草果、甘草(炙)各等分' },
    火: { name: '麦门冬汤', zhu: '治六戊年岁火太过，炎暑流行肺金受邪：上气咳喘，咯血痰壅，嗌干耳聋，泄泻，胸胁满痛连肩背，两臂膊疼。组成：麦门冬(去心)、香白芷、半夏、竹叶、甘草(炙)、钟乳粉、桑白皮、紫菀(取茸)、人参各等分' },
    土: { name: '附子山茱萸汤', zhu: '治六甲年岁土太过，雨湿流行肾水受邪：腹痛寒厥，足痿不收，腰脽痛，行步艰难，甚则中满食不下，肠鸣溏泄。组成：附子(炮)、山茱萸各一两，木瓜干、乌梅各半两，半夏、肉豆蔻各三分，丁香、藿香各一分' },
    金: { name: '牛膝木瓜汤', zhu: '治六庚年岁金太过，燥气流行肝木受邪：胁小腹痛，目赤胗痒，耳无闻，体重烦冤，胸痛引背，甚则喘咳逆气，肩背尻阴股膝髀腨胻足皆痛。组成：牛膝(酒浸)、木瓜各一两，芍药、杜仲(姜制)、枸杞子、黄松节、菟丝子(酒浸)、天麻各三分，甘草(炙)半两' },
    水: { name: '川连茯苓汤', zhu: '治六丙年岁水太过，寒气流行邪害心火：身热心躁，手足反寒，心腹肿痛，喘咳自汗，甚则大肠便血。组成：黄连、茯苓各一两，麦门冬、车前子(炒)、通草、远志(姜制)各半两，半夏、黄芩、甘草(炙)各一分' }
  },
  buJi: {
    木: { name: '苁蓉牛膝汤', zhu: '治六丁年岁木不及，燥乃盛行，肝虚为燥热所伤：胠胁小腹痛，肠鸣溏泄，或发热遍体疮疡，咳嗽肢满鼻鼽。组成：肉苁蓉(酒浸)、牛膝(酒浸)、木瓜干、白芍药、熟地黄、当归、甘草(炙)各等分；筋痿脚弱镑鹿角屑同煎' },
    火: { name: '黄芪茯神汤', zhu: '治六癸年岁火不及，寒乃盛行，心虚挟寒：胸中心痛，两胁连肩背支满噎塞，郁冒蒙眛，髋髀挛痛不能屈伸，或下利溏泄，手足痿痹不能任身。组成：黄芪、茯神、远志(姜制)、紫河车、酸枣仁(炒)各等分' },
    土: { name: '白术厚朴汤', zhu: '治六己年岁土不及，风气盛行，脾虚风冷所伤：心腹胀满疼痛，四肢筋骨重弱，肌肉瞤动酸瘛，善怒，霍乱吐泻，或胸胁暴痛下引小腹，食少失味。组成：白术、厚朴(姜炒)、半夏、桂心、藿香、青皮各三两，干姜(炮)、甘草(炙)各半两' },
    金: { name: '紫菀汤', zhu: '治六乙年岁金不及，炎火盛行，肺虚感热：咳嗽喘满，自汗衄血，肩背瞀重，血便注下，或脑户连囟顶痛，发热口疮心痛。组成：紫菀茸、白芷、人参、甘草(炙)、黄芪、地骨皮、杏仁(去皮尖)、桑白皮(炙)各等分' },
    水: { name: '五味子汤', zhu: '治六辛年岁水不及，湿乃盛行，肾虚湿滞：腰膝重着疼痛，腹胀满濡泄无度，步行艰难，足痿清厥，甚则浮肿面色不常，筋骨并辟目视䀮䀮。组成：五味子、附子(炮)、巴戟(去心)、鹿茸(酥炙)、山茱萸、熟地黄、杜仲(制炒)各等分' }
  }
};

// 南北政（《运气要诀·南北政年脉不应歌》）
const NAN_BEI_ZHENG = {
  rule: '甲己二干为南政年，其余乙庚丙辛丁壬戊癸为北政年。南政四十八年、北政十二年之谓误，实南政十二年、北政四十八年。少阴君火所加之位，脉不应诊（不应者其气和，应者为病）',
  nanZheng: '南政之年（甲己）：少阴司天两寸不应，在泉两尺不应；厥阴司天右寸不应；太阴司天左寸不应；厥阴在泉左尺不应；太阴在泉右尺不应',
  beiZheng: '北政之年（乙庚丙辛丁壬戊癸）：少阴司天两尺不应，在泉两寸不应；厥阴司天左尺不应；太阴司天右尺不应；厥阴在泉右寸不应；太阴在泉左寸不应',
  warning: '尺寸反（子午卯酉年）与阴阳交（辰戌丑未寅申巳亥年）皆主死候——少阴脉当寸不应反见于尺，或当左不应反见于右'
};

// 病机总纲（《素问玄机原病式·五运主病》）
const BING_JI = {
  木: '诸风掉眩，皆属肝木。掉，摇动也；眩，昏晕也。风主动旋，故病则头身摇动目昏眩晕。诸暴强直风所因：风性劲急，风入于筋，故卒然筋急强直',
  火: '诸痛痒疮疡，皆属心火。热微则燥皮作痒，热甚则灼肤作痛，热入经脉血凝则为痈疽。诸热瞀瘛、暴注下迫、呕吐酸苦亦火之化',
  土: '诸湿肿满，皆属脾土。湿蓄内外故肉肿腹满，饮乱于中故病霍乱，脾失健运故病积饮痞闭',
  金: '诸气膹郁病痿，皆属肺金。膹谓膹满，郁谓奔迫；痿谓肺痿，喘咳唾浊。诸燥涩枯涸干劲，皆属于燥（皴揭皮肤）',
  水: '诸寒收引，皆属肾水。肾属水，其化寒，敛缩拘急。吐下腥秽、澄澈清冷、厥逆禁固、骨节痛皆寒之化'
};

module.exports = {
  GAN, ZHI, GAN_YUN, WUXING_YIN, ZHI_QI, QI_WUXING, QI_TO_WUXING, QI_ORDER, QI_ORGANS,
  ZHU_QI, ZHU_YUN_STEPS, KE_QI_LAYOUT, SAN_QI_ZHI, YUN_BING, QI_KE_ZHU_BING,
  ZAI_QUAN_ZHI, SI_TIAN_ZHI, SHENG_ZHI, FU_ZHI, YU_FA,
  FIVE_STARS, STAR_OMEN, WUXING_BIAN, YUN_FANG_SHI, NAN_BEI_ZHENG, BING_JI
};
};
__modules['lib/data60.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

// 六十年逐岁运气病治全表
// 数据源：《素问·六元正纪大论篇第七十一》
//   1) 六司天政五运纪要：`太阳 太角 太阴 壬辰 壬戌 其运风，其化鸣紊启拆，其变振拉摧拔，其病眩掉目瞑`
//   2) 凡此X司天之政 总民病 + 六步逐气病候 + 岁宜治则
//   3) "凡此定期之纪" 逐岁三化数与药食宜（上/中/下 三味）
// 字段说明：
//   zhiGroup      地支组（辰戌/卯酉/…），确定司天在泉与先天后天
//   ganzhi        干支年（一组两支，如 '壬辰'/'壬戌'）
//   qiTian        司天（天气）
//   qiQuan        在泉（地气）
//   yunType       中运五音太少（太角/少角/…）
//   yunWuxing     中运五行
//   yunLevel      'taiGuo' | 'buJi'
//   shengFu       胜复描述（不及年才有，如 '清热胜复同'）
//   pingQi        平气标记（如 '同正商' / '' ）
//   fuHui         符会标记数组（岁会/天符/太一天符/同天符/同岁会）
//   qiYun         其运
//   qiHua         其化（正常气化）
//   qiBian        其变（异常灾变）
//   qiBingYun     其病（中运主病）
//   huaShu        三化数 { 上:'热化二', 中:'雨化五', 下:'燥化四' }（胜复年为胜复化）
//   zaiGong       灾宫（如 '灾七宫'，正化年无）
//   yaoShiYi      药食宜 { 上, 中, 下 }
//   minBing       凡此X政总民病（该司天半年纲）
//   steps         六步逐气病候 [初气~终气]
//   suiYi         岁宜治则总纲（食岁谷等从总纲取）

const ZHI_GROUPS = {
  '辰戌': {
    siTian: { qi: '太阳寒水', wuxing: '水' },
    zaiQuan: { qi: '太阴湿土', wuxing: '土' },
    yunZhu: '先天', // 气化营运先天
    zheng: '太阳之政',
    tiangXiang: '上应辰星镇星',
    shiGu: '其谷玄鉅（岁谷：玄/黅）',
    zongBing: '民病寒湿，发肌肉萎，足痿不收，濡泻血溢',
    steps: [
      '初之气（大寒~春分）：地气迁，气乃大温，草乃早荣，民乃厉，温病乃作，身热头痛呕吐，肌腠疮疡',
      '二之气（春分~小满）：大凉反至，民乃惨，草乃遇寒，火气遂抑，民病气郁中满，寒乃始',
      '三之气（小满~大暑）：天政布，寒气行，雨乃降。民病寒，反热中，痈疽注下，心热瞀闷，不治者死',
      '四之气（大暑~秋分）：风湿交争，风化为雨，乃长乃化乃成。民病大热少气，肌肉萎足痿，注下赤白',
      '五之气（秋分~小雪）：阳复化，草乃长乃化乃成，民乃舒',
      '终之气（小雪~大寒）：地气正，湿令行，阴凝太虚，埃昏郊野，民乃惨凄，寒风以至，反者孕乃死'
    ],
    suiYi: '岁宜苦以燥之温之，必折其郁气，先资其化源，抑其运气，扶其不胜，无使暴过而生其疾；同寒湿者燥热化，异寒湿者燥湿化',
    fangJi: { name: '静顺汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治辰戌岁太阳司天太阴在泉：身热头痛，呕吐气郁，中满瞀闷，少气足痿，注下赤白，肌腠疮疡，发为痈疽。组成：白茯苓、木瓜干各一两，附子(炮)、牛膝(酒浸)各三分，防风、诃子(炮)、甘草(炙)、干姜(炮)各半两。六步加减：大寒至春分去附子加枸杞半两；春分至小满入附子枸杞；小满至大暑去附子木瓜干姜加人参枸杞地榆白芷生姜各三分；大暑至秋分加石榴皮半两；秋分至小雪依正方；小雪至大寒去牛膝加当归芍药阿胶炒各三分。治法：用甘温以平水，酸苦以补火，抑其运气，扶其不胜' }
  },
  '卯酉': {
    siTian: { qi: '阳明燥金', wuxing: '金' },
    zaiQuan: { qi: '少阴君火', wuxing: '火' },
    yunZhu: '后天',
    zheng: '阳明之政',
    tiangXiang: '上应太白荧惑',
    shiGu: '其谷白丹',
    zongBing: '民病咳嗌塞，寒热发，暴振栗癃闭（清先而劲毛虫乃死，热后而暴介虫乃殃）',
    steps: [
      '初之气（大寒~春分）：地气迁，阴始凝，气始肃，水乃冰，寒雨化。其病中热胀，面目浮肿，善眠，鼽衄嚏欠呕，小便黄赤，甚则淋',
      '二之气（春分~小满）：阳乃布，民乃舒，物乃生荣。厉大至，民善暴死',
      '三之气（小满~大暑）：天政布，凉乃行，燥热交合，燥极而泽，民病寒热',
      '四之气（大暑~秋分）：寒雨降。病暴仆，振栗谵妄，少气嗌干引饮，及为心痛痈肿疮疡疟寒之疾，骨痿血便',
      '五之气（秋分~小雪）：春令反行，草乃生荣，民气和',
      '终之气（小雪~大寒）：阳气布，候反温，蛰虫来见，流水不冰，民乃康平，其病温'
    ],
    suiYi: '岁宜以咸以苦以辛，汗之清之散之，安其运气，无使受邪，折其郁气，资其化源；以寒热轻重少多其制，同热者多天化，同清者多地化',
    fangJi: { name: '审平汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治卯酉岁阳明司天少阴在泉：中热面浮鼻鼽，小便赤黄，甚则淋，或疠气行善暴仆，振栗谵妄，寒疟痈肿便血。组成：远志(姜制)、紫檀香各一两，天门冬、山茱萸各三分，白术、白芍药、甘草(炙)、生姜各半两。六步加减：大寒至春分加茯苓半夏紫苏生姜各半两；春分至小满加玄参白薇各半两；小满至大暑去远志山茱萸白术加丹参泽泻各半两；大暑至秋分去远志白术加酸枣仁车前子各半两；秋分后依正方。治法：宜咸寒以抑火，辛甘以助金，汗之清之散之' }
  },
  '寅申': {
    siTian: { qi: '少阳相火', wuxing: '火' },
    zaiQuan: { qi: '厥阴风木', wuxing: '木' },
    yunZhu: '先天',
    zheng: '少阳之政',
    tiangXiang: '上应荧惑岁星',
    shiGu: '其谷丹苍',
    zongBing: '民病寒中，外发疮疡，内为泄满；往复之作，民病寒热疟泄，聋瞑呕吐，上怫肿色变',
    steps: [
      '初之气（大寒~春分）：地气迁，风胜乃摇，寒乃去，候乃大温，草木早荣。温病乃起，其病气怫于上，血溢目赤，咳逆头痛，血崩胁满，肤腠中疮',
      '二之气（春分~小满）：火反郁，白埃四起，云趋雨府，风不胜湿，雨乃零，民乃康。其病热郁于上，咳逆呕吐，疮发于中，胸嗌不利，头痛身热，昏愦脓疮',
      '三之气（小满~大暑）：天政布，炎暑至，少阳临上，雨乃涯。民病热中，聋瞑血溢，脓疮咳呕，鼽衄渴嚏欠，喉痹目赤，善暴死',
      '四之气（大暑~秋分）：凉乃至，炎暑间化，白露降，民气和平，其病满身重',
      '五之气（秋分~小雪）：阳乃去，寒乃来，雨乃降，气门乃闭，刚木早雕，民避寒邪，君子周密',
      '终之气（小雪~大寒）：地气正，风乃至，万物反生，霿雾以行。其病关闭不禁，心痛，阳气不藏而咳'
    ],
    suiYi: '岁宜咸辛宜酸，渗之泄之，渍之发之，观气寒温以调其过，同风热者多寒化，异风热者少寒化',
    fangJi: { name: '升明汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治寅申岁少阳司天厥阴在泉：气郁热，血溢目赤，咳逆头痛，胁满呕吐，胸臆不利，聋瞑渴，身重心痛，阳气不藏，疮疡烦躁。组成：紫檀香、车前子(炒)、青皮、半夏(汤洗)、酸枣仁、蔷薇、生姜、甘草(炙)各半两。六步加减：大寒至春分加白薇玄参各半两；春分至小满加丁香一钱；小满至大暑加漏芦升麻赤芍各半两；大暑至秋分加茯苓半两；秋分后依正方；小雪至大寒加五味子半两。治法：宜咸寒平其上，辛温治其内，宜酸渗之泄之渍之发之' }
  },
  '丑未': {
    siTian: { qi: '太阴湿土', wuxing: '土' },
    zaiQuan: { qi: '太阳寒水', wuxing: '水' },
    yunZhu: '后天',
    zheng: '太阴之政',
    tiangXiang: '上应镇星辰星',
    shiGu: '其谷黅玄',
    zongBing: '民病寒湿，腹满身膹愤胕肿，痞逆寒厥拘急',
    steps: [
      '初之气（大寒~春分）：地气迁，寒乃去，春气正，风乃来，生布万物以荣，民气条舒，风湿相薄，雨乃后。民病血溢，筋络拘强，关节不利，身重筋痿',
      '二之气（春分~小满）：大火正，物承化，民乃和，其病温厉大行，远近咸若，湿蒸相薄，雨乃时降',
      '三之气（小满~大暑）：天政布，湿气降，地气腾，雨乃时降，寒乃随之。感于寒湿，则民病身重胕肿，胸腹满',
      '四之气（大暑~秋分）：畏火临，溽蒸化，地气腾，天气痞隔，寒风晓暮，蒸热相薄，草木凝烟，湿化不流，则白露阴布，以成秋令。民病腠理热，血暴溢疟，心腹满热胪胀，甚则胕肿',
      '五之气（秋分~小雪）：惨令已行，寒露下，霜乃早降，草木黄落，寒气及体，君子周密，民病皮腠',
      '终之气（小雪~大寒）：寒大举，湿大化，霜乃积，阴乃凝，水坚冰，阳光不治。感于寒，则病人关节禁固，腰脽痛，寒湿推于气交而为疾也'
    ],
    suiYi: '岁宜以苦燥之温之，甚者发之泄之；不发不泄则湿气外溢，肉溃皮拆而水血交流；必赞其阳火，令御甚寒；同寒者以热化，同湿者以燥化',
    fangJi: { name: '备化汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治丑未岁太阴司天太阳在泉：关节不利，筋脉拘急，身重萎弱，或温疠盛行，或胸腹满闷，甚则浮肿，寒疟血溢，腰脽痛。组成：木瓜干、茯神各一两，牛膝(酒浸)、附子(炮)各三分，熟地黄、覆盆子各半两，甘草一分，生姜三分。六步加减：大寒至春分依正方；春分至小满去附子加天麻防风各半两；小满至大暑加泽泻三分；大暑后依正方。治法：用酸以平其上，甘温治其下，以苦燥之温之，甚则发之泄之，赞其阳火令御其寒' }
  },
  '子午': {
    siTian: { qi: '少阴君火', wuxing: '火' },
    zaiQuan: { qi: '阳明燥金', wuxing: '金' },
    yunZhu: '先天',
    zheng: '少阴之政',
    tiangXiang: '上应荧惑太白',
    shiGu: '其谷丹白',
    zongBing: '民病咳喘，血溢血泄鼽嚏，目赤眦疡，寒厥入胃，心痛腰痛，腹大嗌干肿上',
    steps: [
      '初之气（大寒~春分）：地气迁，燥将去，寒乃始，蛰复藏，水乃冰，霜复降，风乃至，阳气郁，民反周密，关节禁固，腰脽痛，炎暑将起，中外疮疡',
      '二之气（春分~小满）：阳气布，风乃行，春气以正，万物应荣，寒气时至，民乃和。其病淋，目瞑目赤，气郁于上而热',
      '三之气（小满~大暑）：天政布，大火行，庶类番鲜，寒气时至。民病气厥心痛，寒热更作，咳喘目赤',
      '四之气（大暑~秋分）：溽暑至，大雨时行，寒热互至。民病寒热，嗌干黄瘅，鼽衄饮发',
      '五之气（秋分~小雪）：畏火临，暑反至，阳乃化，万物乃生乃长荣，民乃康，其病温',
      '终之气（小雪~大寒）：燥令行，余火内格，肿于上，咳喘，甚则血溢。寒气数举，则霿雾翳，病生皮腠，内舍于胁，下连少腹而作寒中，地将易也'
    ],
    suiYi: '岁宜咸以软之而调其上，甚则以苦发之；以酸收之而安其下，甚则以苦泄之；同天气者以寒清化，同地气者以温热化',
    fangJi: { name: '正阳汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治子午岁少阴司天阳明在泉：关节禁固，腰痛，气郁热，小便淋，目赤心痛，寒热更作，咳喘，或鼻鼽嗌咽吐饮，发黄瘅喘，甚则连小腹而作寒中。组成：白薇、玄参、川芎、桑白皮(炙)、当归、芍药、旋覆花、甘草(炙)、生姜各半两。六步加减：大寒至春分加杏仁升麻各半两；春分至小满加茯苓车前子各半两；小满至大暑加杏仁麻仁各一分；大暑至秋分加荆芥茵陈各一分；秋分后依正方；小雪至大寒加紫苏子半两。治法：宜咸以平其上，苦热以治其内，咸以软之，苦以发之，酸以收之' }
  },
  '巳亥': {
    siTian: { qi: '厥阴风木', wuxing: '木' },
    zaiQuan: { qi: '少阳相火', wuxing: '火' },
    yunZhu: '后天',
    zheng: '厥阴之政',
    tiangXiang: '上应岁星荧惑',
    shiGu: '其谷苍丹',
    zongBing: '风燥火热，胜复更作，蛰虫来见，流水不冰，热病行于下，风病行于上，风燥胜复形于中',
    steps: [
      '初之气（大寒~春分）：寒始肃，杀气方至，民病寒于右之下',
      '二之气（春分~小满）：寒不去，华雪水冰，杀气施化，霜乃降，名草上焦，寒雨数至，阳复化，民病热于中',
      '三之气（小满~大暑）：天政布，风乃时举，民病泣出耳鸣掉眩',
      '四之气（大暑~秋分）：溽暑湿热相薄，争于左之上，民病黄瘅而为胕肿',
      '五之气（秋分~小雪）：燥湿更胜，沉阴乃布，寒气及体，风雨乃行',
      '终之气（小雪~大寒）：畏火司令，阳乃大化，蛰虫出见，流水不冰，地气大发，草乃生，人乃舒，其病温厉'
    ],
    suiYi: '岁宜以辛调上，以咸调下，畏火之气，无妄犯之；折其郁气，资其化源，赞其运气，无使邪胜',
    fangJi: { name: '敷和汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治巳亥岁厥阴司天少阳在泉：中热而反右胁下寒，耳鸣，泪出掉眩，燥湿相搏，民病黄瘅浮肿，时作瘟疠。组成：半夏(汤洗)、枣子、五味子、枳实(麸炒)、茯苓、诃子(炮)、干姜(炮)、橘皮、甘草(炙)各半两。六步加减：大寒至春分加鼠粘子一分；春分至小满加麦门冬山药各一分；小满至大暑加紫菀一分；大暑至秋分加泽泻山栀仁各一分；秋分后依正方。治法：宜用辛凉平其上，咸寒调其下，畏火之气无妄犯之' }
  }
};

const SIXTY_YEARS = [
  // ===== 辰戌之纪：太阳寒水司天 太阴湿土在泉 =====
  { ganzhi: '壬辰', zhiGroup: '辰戌', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '眩掉目瞑', huaShu: { zhong: '风化八', qita: '寒化六，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '酸和', xia: '甘温' } },
  { ganzhi: '壬戌', zhiGroup: '辰戌', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '眩掉目瞑', huaShu: { zhong: '风化八', qita: '寒化六，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '酸和', xia: '甘温' } },
  { ganzhi: '戊辰', zhiGroup: '辰戌', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正征（太过被抑，火运平气）', fuHui: [], qiYun: '热', qiHua: '暄暑郁燠', qiBian: '炎烈沸腾', qiBingYun: '热郁', huaShu: { zhong: '热化七', qita: '寒化六，湿化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '甘和', xia: '甘温' } },
  { ganzhi: '戊戌', zhiGroup: '辰戌', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正征（太过被抑，火运平气）', fuHui: [], qiYun: '热', qiHua: '暄暑郁燠', qiBian: '炎烈沸腾', qiBingYun: '热郁', huaShu: { zhong: '热化七', qita: '寒化六，湿化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '甘和', xia: '甘温' } },
  { ganzhi: '甲辰', zhiGroup: '辰戌', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['岁会', '同天符'], qiYun: '阴埃', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '湿下重', huaShu: { zhong: '雨化五', qita: '寒化六' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '苦温', xia: '苦温' } },
  { ganzhi: '甲戌', zhiGroup: '辰戌', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['岁会', '同天符'], qiYun: '阴埃', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '湿下重', huaShu: { zhong: '雨化五', qita: '寒化六' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '苦温', xia: '苦温' } },
  { ganzhi: '庚辰', zhiGroup: '辰戌', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '凉', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '燥背瞀胸满', huaShu: { zhong: '清化九', qita: '寒化一，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '庚戌', zhiGroup: '辰戌', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '凉', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '燥背瞀胸满', huaShu: { zhong: '清化九', qita: '寒化一，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '丙辰', zhiGroup: '辰戌', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '大寒留于溪谷', huaShu: { zhong: '寒化六', qita: '雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '咸温', xia: '甘热' } },
  { ganzhi: '丙戌', zhiGroup: '辰戌', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '大寒留于溪谷', huaShu: { zhong: '寒化六', qita: '雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '咸温', xia: '甘热' } },

  // ===== 卯酉之纪：阳明燥金司天 少阴君火在泉 =====
  { ganzhi: '丁卯', zhiGroup: '卯酉', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正商（不及得助，木运平气）', fuHui: ['岁会'], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '燥化九，热化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦小温', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '丁酉', zhiGroup: '卯酉', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正商（不及得助，木运平气）', fuHui: [], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '燥化九，热化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦小温', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '癸卯', zhiGroup: '卯酉', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '同正商（不及得助，火运平气）', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '热化二', qita: '燥化九' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦小温', zhong: '咸温', xia: '咸寒' } },
  { ganzhi: '癸酉', zhiGroup: '卯酉', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '同正商（不及得助，火运平气）', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '热化二', qita: '燥化九' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦小温', zhong: '咸温', xia: '咸寒' } },
  { ganzhi: '己卯', zhiGroup: '卯酉', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风凉胜复同', pingQi: '', fuHui: [], qiYun: '雨风凉', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '清化九，热化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦小温', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '己酉', zhiGroup: '卯酉', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风凉胜复同', pingQi: '', fuHui: [], qiYun: '雨风凉', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '清化九，热化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦小温', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '乙卯', zhiGroup: '卯酉', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正商（不及得助，金运平气）', fuHui: ['天符'], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '热化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '乙酉', zhiGroup: '卯酉', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正商（不及得助，金运平气）', fuHui: ['天符', '岁会', '太一天符'], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '热化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '辛卯', zhiGroup: '卯酉', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同少宫', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '清化九，热化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '辛酉', zhiGroup: '卯酉', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同少宫', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '清化九，热化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },

  // ===== 寅申之纪：少阳相火司天 厥阴风木在泉 =====
  { ganzhi: '壬寅', zhiGroup: '寅申', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['同天符'], qiYun: '风鼓', qiHua: '鸣紊启坼', qiBian: '振拉摧拔', qiBingYun: '掉眩支胁惊骇', huaShu: { zhong: '风化八', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸和', xia: '辛凉' } },
  { ganzhi: '壬申', zhiGroup: '寅申', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['同天符'], qiYun: '风鼓', qiHua: '鸣紊启坼', qiBian: '振拉摧拔', qiBingYun: '掉眩支胁惊骇', huaShu: { zhong: '风化八', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸和', xia: '辛凉' } },
  { ganzhi: '戊寅', zhiGroup: '寅申', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '暑', qiHua: '暄嚣郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热郁血溢血泄心痛', huaShu: { zhong: '火化七', qita: '风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘和', xia: '辛凉' } },
  { ganzhi: '戊申', zhiGroup: '寅申', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '暑', qiHua: '暄嚣郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热郁血溢血泄心痛', huaShu: { zhong: '火化七', qita: '风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘和', xia: '辛凉' } },
  { ganzhi: '甲寅', zhiGroup: '寅申', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '体重胕肿痞饮', huaShu: { zhong: '雨化五', qita: '火化二，风化八' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸和', xia: '辛凉' } },
  { ganzhi: '甲申', zhiGroup: '寅申', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '体重胕肿痞饮', huaShu: { zhong: '雨化五', qita: '火化二，风化八' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸和', xia: '辛凉' } },
  { ganzhi: '庚寅', zhiGroup: '寅申', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: [], qiYun: '凉', qiHua: '雾露清切', qiBian: '肃杀雕零', qiBingYun: '肩背胸中', huaShu: { zhong: '清化九', qita: '火化七，风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '辛凉' } },
  { ganzhi: '庚申', zhiGroup: '寅申', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: [], qiYun: '凉', qiHua: '雾露清切', qiBian: '肃杀雕零', qiBingYun: '肩背胸中', huaShu: { zhong: '清化九', qita: '火化七，风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '辛凉' } },
  { ganzhi: '丙寅', zhiGroup: '寅申', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '寒肃', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒浮肿', huaShu: { zhong: '寒化六', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸温', xia: '辛温' } },
  { ganzhi: '丙申', zhiGroup: '寅申', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '寒肃', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒浮肿', huaShu: { zhong: '寒化六', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸温', xia: '辛温' } },

  // ===== 丑未之纪：太阴湿土司天 太阳寒水在泉 =====
  { ganzhi: '丁丑', zhiGroup: '丑未', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正宫（不及得助，木运平气）', fuHui: [], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '雨化五，寒化一' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦温', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '丁未', zhiGroup: '丑未', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正宫（不及得助，木运平气）', fuHui: [], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '雨化五，寒化一' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦温', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '癸丑', zhiGroup: '丑未', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: [], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '雨化五，寒化一' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦温', zhong: '咸温', xia: '甘热' } },
  { ganzhi: '癸未', zhiGroup: '丑未', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: [], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '雨化五，寒化一' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦温', zhong: '咸温', xia: '甘热' } },
  { ganzhi: '己丑', zhiGroup: '丑未', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正宫（不及得助，土运平气）', fuHui: ['天符', '太一天符'], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '寒化一' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦热', zhong: '甘和', xia: '甘热' } },
  { ganzhi: '己未', zhiGroup: '丑未', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正宫（不及得助，土运平气）', fuHui: ['天符', '太一天符'], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '寒化一' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦热', zhong: '甘和', xia: '甘热' } },
  { ganzhi: '乙丑', zhiGroup: '丑未', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '雨化五，寒化一' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦热', zhong: '酸和', xia: '甘热' } },
  { ganzhi: '乙未', zhiGroup: '丑未', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '雨化五，寒化一' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦热', zhong: '酸和', xia: '甘热' } },
  { ganzhi: '辛丑', zhiGroup: '丑未', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同正宫（不及得助，水运平气）', fuHui: ['同岁会'], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '雨化五' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦热', zhong: '苦和', xia: '苦热' } },
  { ganzhi: '辛未', zhiGroup: '丑未', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同正宫（不及得助，水运平气）', fuHui: ['同岁会'], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '雨化五' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦热', zhong: '苦和', xia: '苦热' } },

  // ===== 子午之纪：少阴君火司天 阳明燥金在泉 =====
  { ganzhi: '壬子', zhiGroup: '子午', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风鼓', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '支满', huaShu: { zhong: '风化八', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸凉', xia: '酸温' } },
  { ganzhi: '壬午', zhiGroup: '子午', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风鼓', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '支满', huaShu: { zhong: '风化八', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸凉', xia: '酸温' } },
  { ganzhi: '戊子', zhiGroup: '子午', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '炎暑', qiHua: '暄曜郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热血溢', huaShu: { zhong: '热化七', qita: '清化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘寒', xia: '酸温' } },
  { ganzhi: '戊午', zhiGroup: '子午', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符', '岁会', '太一天符'], qiYun: '炎暑', qiHua: '暄曜郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热血溢', huaShu: { zhong: '热化七', qita: '清化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘寒', xia: '酸温' } },
  { ganzhi: '甲子', zhiGroup: '子午', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润时雨', qiBian: '震惊飘骤', qiBingYun: '中满身重', huaShu: { zhong: '雨化五', qita: '热化二，燥化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '苦热', xia: '酸热' } },
  { ganzhi: '甲午', zhiGroup: '子午', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润时雨', qiBian: '震惊飘骤', qiBingYun: '中满身重', huaShu: { zhong: '雨化五', qita: '热化二，燥化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '苦热', xia: '酸热' } },
  { ganzhi: '庚子', zhiGroup: '子午', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: ['同天符'], qiYun: '凉劲', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '下清', huaShu: { zhong: '清化九', qita: '热化七，燥化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '酸温' } },
  { ganzhi: '庚午', zhiGroup: '子午', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: ['同天符'], qiYun: '凉劲', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '下清', huaShu: { zhong: '清化九', qita: '热化七，燥化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '酸温' } },
  { ganzhi: '丙子', zhiGroup: '子午', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['岁会'], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒下', huaShu: { zhong: '寒化六', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸热', xia: '酸温' } },
  { ganzhi: '丙午', zhiGroup: '子午', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒下', huaShu: { zhong: '寒化六', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸热', xia: '酸温' } },

  // ===== 巳亥之纪：厥阴风木司天 少阳相火在泉 =====
  { ganzhi: '丁巳', zhiGroup: '巳亥', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正角（不及得助，木运平气）', fuHui: ['天符'], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '火化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '辛凉', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '丁亥', zhiGroup: '巳亥', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正角（不及得助，木运平气）', fuHui: ['天符'], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '火化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '辛凉', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '癸巳', zhiGroup: '巳亥', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '风化八' }, zaiGong: '灾九宫', yaoShiYi: { shang: '辛凉', zhong: '咸和', xia: '咸寒' } },
  { ganzhi: '癸亥', zhiGroup: '巳亥', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '风化八' }, zaiGong: '灾九宫', yaoShiYi: { shang: '辛凉', zhong: '咸和', xia: '咸寒' } },
  { ganzhi: '己巳', zhiGroup: '巳亥', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正角（不及得助，土运平气）', fuHui: [], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '风化三，火化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '辛凉', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '己亥', zhiGroup: '巳亥', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正角（不及得助，土运平气）', fuHui: [], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '风化三，火化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '辛凉', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '乙巳', zhiGroup: '巳亥', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正角（不及得助，金运平气）', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '风化八，火化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '辛凉', zhong: '酸和', xia: '咸寒' } },
  { ganzhi: '乙亥', zhiGroup: '巳亥', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正角（不及得助，金运平气）', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '风化八，火化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '辛凉', zhong: '酸和', xia: '咸寒' } },
  { ganzhi: '辛巳', zhiGroup: '巳亥', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '风化三，火化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '辛凉', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '辛亥', zhiGroup: '巳亥', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '风化三，火化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '辛凉', zhong: '苦和', xia: '咸寒' } }
];

// 六十年运气上下相临关系（《运气要诀·六十年运气上下相临歌》）
// 顺化：气生运（相得）；天刑：气克运（不相得）；小逆：运生气（子居母上，主微病）；
// 不和：运克气（下克上，主病甚）；天符：运气相同（同气偏胜亢害）
const LIN_YUN_RULES = [
  { type: '顺化', desc: '司天生中运，上生下，相得之岁', years: ['癸巳','癸亥','甲子','甲午','甲寅','甲申','乙丑','乙未','辛卯','辛酉','壬辰','壬戌'] },
  { type: '天刑', desc: '司天克中运，以上克下，不相得之岁', years: ['己巳','己亥','辛丑','辛未','戊辰','戊戌','庚子','庚午','庚寅','庚申','丁卯','丁酉'] },
  { type: '小逆', desc: '中运生司天，以下生上，子居母上，主微病', years: ['癸丑','癸未','壬子','壬午','壬寅','壬申','辛巳','辛亥','庚辰','庚戌','己卯','己酉'] },
  { type: '不和', desc: '中运克司天，以下克上，不相得，主病甚', years: ['乙巳','乙亥','丙子','丙午','丙寅','丙申','丁丑','丁未','癸卯','癸酉','甲辰','甲戌'] },
  { type: '天符', desc: '运气相同，同气相临，虽曰同气，不无偏胜亢害', years: ['丁巳','丁亥','戊子','戊午','戊寅','戊申','己丑','己未','乙卯','乙酉','丙辰','丙戌'] }
];

module.exports = { SIXTY_YEARS, ZHI_GROUPS, LIN_YUN_RULES };
};
__modules['lib/bazi-yunqi.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

// 八字结合五运六气：先天禀赋推断 + 流年交互预警
// 理论依据：
//   1) 出生年岁运定先天禀赋：《五常政大论》三气之纪——阳年太过其脏偏盛、阴年不及其脏偏弱（运气体质学推法）
//   2) 司天在泉影响：《五运行大论》"气相胜者和，不相胜者病"——生年司天之气与中运的生克决定先天格局
//   3) 八字五行分布：四柱干支（含藏干加权）定五脏强弱谱
//   4) 流年交互：先天弱脏逢岁运克伐之年高发预警（《运气要诀·运气所至先后时歌》：所胜妄行刑所生……）

const { buildProfile, GAN_WUXING, ZHI_WUXING } = require('./almanac/bazi');
const { GAN_YUN, QI_TO_WUXING } = require('./laws');
const { ganzhiOfYear, getZhongYun } = require('./yunqi');

// 藏干（《类经图翼》人元藏用）
const ZHI_CANG = {
  子: [['癸', 1.0]],
  丑: [['己', 0.7], ['癸', 0.2], ['辛', 0.1]],
  寅: [['甲', 0.7], ['丙', 0.2], ['戊', 0.1]],
  卯: [['乙', 1.0]],
  辰: [['戊', 0.7], ['乙', 0.2], ['癸', 0.1]],
  巳: [['丙', 0.7], ['庚', 0.2], ['戊', 0.1]],
  午: [['丁', 0.7], ['己', 0.3]],
  未: [['己', 0.7], ['丁', 0.2], ['乙', 0.1]],
  申: [['庚', 0.7], ['壬', 0.2], ['戊', 0.1]],
  酉: [['辛', 1.0]],
  戌: [['戊', 0.7], ['辛', 0.2], ['丁', 0.1]],
  亥: [['壬', 0.7], ['甲', 0.3]]
};

const WUXING_ORGAN = {
  木: { zang: '肝', fu: '胆', bing: '诸风掉眩、胁痛、目疾、筋病、善怒' },
  火: { zang: '心', fu: '小肠', bing: '诸痛痒疮、血证、神志病、舌痛、脉病' },
  土: { zang: '脾', fu: '胃', bing: '诸湿肿满、飧泄、食减、肌痿、四肢不举' },
  金: { zang: '肺', fu: '大肠', bing: '诸气膹郁、喘咳、鼽嚏、皮毛病、便秘' },
  水: { zang: '肾', fu: '膀胱', bing: '诸寒收引、腰膝痛、骨病、二便不利、耳鸣' }
};

const WUXING_LIST = ['木', '火', '土', '金', '水'];
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 我生

// 出生地禀赋修正（《素问·异法方宜论》五方民病 + 《五常政大论》"天不足西北……阴精所奉其人寿"）
const REGION_FIVE = [
  { dir: '西', wuxing: '金', match: (lng, lat) => lng < 105, origin: '沙石之处，天地之所收引也，其民陵居而多风，水土刚强——病生于内（《异法方宜论》）', bing: '内生积滞、燥伤肺津、心肺之病（华食脂肥水土刚强）' },
  { dir: '南', wuxing: '火', match: (lng, lat) => lat < 27, origin: '天地所长养，阳之所盛处也，其地下，水土弱，雾露之所聚——其民嗜酸而食胕，病挛痹（《异法方宜论》）', bing: '湿热挛痹、心火偏亢、耗气伤阴（地下雾露湿热）' },
  { dir: '北', wuxing: '水', match: (lng, lat) => lat > 40, origin: '天地所闭藏之域也，其地高陵居，风寒冰冽——其民乐野处而乳食，脏寒生满病（《异法方宜论》）', bing: '脏寒满病、肾阳受遏、风寒痹痛（高陵冰冽）' },
  { dir: '东', wuxing: '木', match: (lng, lat) => lng > 120, origin: '鱼盐之地，海滨傍水，其民食鱼而嗜咸，皆安其处，美其食——病皆痈疡（《异法方宜论》）', bing: '痈疡疮毒、湿热蕴结、肝胆火旺（滨海嗜咸）' },
  { dir: '中', wuxing: '土', match: () => true, origin: '地平以湿，天地所以生万物也众——其民食杂而不劳，病痿厥寒热（《异法方宜论》）', bing: '痿厥寒热、脾湿不运、痰湿内生（地平以湿食杂）' }
];
// 省级气候叠加修正（key=省名关键词）
const REGION_JIAO_ZHENG = {
  广东: '岭南湿热蒸郁——脾胃湿热、痈疡湿疹易发，宜清淡化湿',
  广西: '岭南湿热兼山区寒湿——湿病尤甚',
  海南: '热带湿热耗气——心火暑湿',
  福建: '滨海湿热——痈疡肝胆火',
  浙江: '江南水乡湿热——脾湿痰热',
  江苏: '水乡湿热兼四时分明——脾湿',
  上海: '江海湿热——湿热痰火',
  湖南: '湿热交蒸嗜辛——湿热夹火',
  湖北: '江汉卑湿——湿困脾阳',
  江西: '湿热丘陵——湿热',
  四川: '盆地湿重雾露——痰湿困脾（民嗜麻辣以燥湿，天性使然）',
  重庆: '湿热雾都——痰湿湿热',
  云南: '高原寒湿兼燥——肺燥脾湿',
  贵州: '山区寒湿——寒湿痹',
  山东: '滨海咸寒刚燥——胃燥肺燥',
  河南: '中原地平以湿——痿厥寒热痰湿',
  河北: '北方寒燥——肺燥肾寒',
  山西: '黄土燥寒——肺燥脾燥',
  陕西: '关中燥寒——肺燥',
  甘肃: '西北燥寒——肺燥津亏',
  宁夏: '燥寒——同上',
  新疆: '极西燥寒沙石——肺燥津亏、风寒痹',
  青海: '高原高寒——心肺肾阳受遏',
  西藏: '极高高寒缺氧——心阳肺气不足、肾寒',
  内蒙古: '北地风寒——肾寒风寒痹',
  东北: '严寒闭藏——肾阳虚寒、关节痹痛',
  辽宁: '滨海严寒——肾寒',
  吉林: '严寒——肾寒',
  黑龙江: '极北严寒——肾阳虚寒',
  北京: '北方寒燥——肺燥肾寒',
  天津: '滨海寒燥——肾寒'
};

// 五脏饮食起居情志导引（《素问·脏气法时论》五脏宜食 + 《四气调神大论》起居 + 养生通则）
const ORGAN_LIFE = {
  木: {
    yi: '宜食甘（缓肝）：粳米、牛肉、大枣、葵菜——《脏气法时论》"肝色青，宜食甘"；辅青绿蔬菜、杞菊明目',
    ji: '忌辛散太过、酗酒、深夜不寐（人卧则血归于肝，夜不寐则肝血耗）',
    qiJu: '春三月夜卧早起，广步于庭，被发缓形，以使志生（《四气调神》）；忌久视伤血',
    qingZhi: '怒伤肝、郁则结——情志条达最要；戒怒戒郁',
    yunDong: '导引：八段锦"攒拳怒目增气力"、疏肝伸展类运动、户外踏青'
  },
  火: {
    yi: '宜食酸（收心）：《脏气法时论》"心色赤，宜食酸，小豆、犬肉、李、韭皆酸"；辅莲子、百合、麦冬养心安神',
    ji: '忌咸盛（咸走血发渴）、浓茶咖啡过扰神、大汗（汗为心液）',
    qiJu: '夏三月夜卧早起，无厌于日，使志无怒（《四气调神》）；午间小憩养心',
    qingZhi: '喜伤心、思虑焦灼耗心血——静坐养神，戒亢奋失眠',
    yunDong: '导引：静坐调息、太极养心；忌大汗淋漓之剧烈运动'
  },
  土: {
    yi: '宜食咸（润脾）：《脏气法时论》"脾色黄，宜食咸，大豆、豕肉、栗、藿皆咸"；辅山药、莲子、小米甘淡养脾',
    ji: '忌生冷瓜果过度、肥甘厚腻壅脾、久坐伤肉、思虑过度（思伤脾）',
    qiJu: '长夏避湿就燥，食后缓行百步助运化；居处忌潮湿',
    qingZhi: '思伤脾——戒思虑纠结，宽心少虑',
    yunDong: '导引：八段锦"调理脾胃须单举"、饭后散步、摩腹'
  },
  金: {
    yi: '宜食苦（宣肺）：《脏气法时论》"肺色白，宜食苦，麦、羊肉、杏、薤皆苦"；辅百合、银耳、梨润肺',
    ji: '忌辛辣过燥、悲忧过度（悲则气消）、风寒直犯（肺合皮毛）',
    qiJu: '秋三月早卧早起，与鸡俱兴，使志安宁（《四气调神》）；慎风寒、适寒温',
    qingZhi: '悲忧伤肺——戒悲戚，开怀畅志',
    yunDong: '导引：八段锦"左右开弓似射雕"、呼吸吐纳（六字诀·呬）、登高望远'
  },
  水: {
    yi: '宜食辛（润肾）：《脏气法时论》"肾色黑，宜食辛，黄黍、鸡肉、桃、葱皆辛"；辅黑豆、核桃、枸杞填精',
    ji: '忌房劳过度、熬夜耗精、恐惧惊惕（恐伤肾）、过食生冷沉寒',
    qiJu: '冬三月早卧晚起，必待日光，去寒就温，无泄皮肤（《四气调神》）；节欲保精',
    qingZhi: '恐伤肾——戒恐惧忧疑，安神定志',
    yunDong: '导引：八段锦"两手攀足固肾腰"、站桩固本、腰部温养'
  }
};

function parseBaziText(eightChar) {
  // eightChar: { year: '甲子', month: '丙寅', day: '丁卯', time: '庚子' } 形如"丙寅"
  const pillars = ['year', 'month', 'day', 'time'].map((k) => {
    const s = eightChar[k] || '';
    return { gan: s[0] || '', zhi: s[1] || '', pillar: k };
  });
  return pillars.filter((p) => p.gan);
}

function wuxingDistribution(pillars) {
  const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const detail = [];
  for (const p of pillars) {
    if (p.gan && GAN_WUXING[p.gan]) {
      score[GAN_WUXING[p.gan]] += 1.0;
      detail.push({ from: `年/月/日/时干·${p.gan}`, wuxing: GAN_WUXING[p.gan], weight: 1.0 });
    }
    if (p.zhi && ZHI_CANG[p.zhi]) {
      for (const [gan, w] of ZHI_CANG[p.zhi]) {
        const wx = GAN_WUXING[gan];
        if (wx) {
          score[wx] += w;
          if (w >= 0.7) detail.push({ from: `${p.pillar === 'year' ? '年' : p.pillar === 'month' ? '月' : p.pillar === 'day' ? '日' : '时'}支·${p.zhi}藏${gan}`, wuxing: wx, weight: w });
        }
      }
    }
  }
  const total = WUXING_LIST.reduce((s, k) => s + score[k], 0) || 1;
  const percent = {};
  WUXING_LIST.forEach((k) => { percent[k] = Math.round(score[k] / total * 100); });
  return { score, percent, detail };
}

// 先天禀赋推断
function buildConstitution(birth, locationInput) {
  const profile = buildProfile({ birth, ...locationInput });
  const birthYear = Number(String(birth).slice(0, 4));
  const gz = ganzhiOfYear(birthYear);
  const zhongYun = getZhongYun(birthYear);
  const { ZHI_QI } = require('./laws');
  const siTian = ZHI_QI[gz.zhi];
  const siTianWx = QI_TO_WUXING[siTian];

  const pillars = parseBaziText(profile.eightChar);
  const dist = wuxingDistribution(pillars);
  const region = regionEndowment(locationInput);

  // 岁运先天：太过→本脏偏盛、所胜之脏受克；不及→本脏偏弱、克我之脏易乘
  const yunOrgan = WUXING_ORGAN[zhongYun.wuxing];
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  let yunNote;
  if (zhongYun.level === 'taiGuo') {
    const shouKe = WUXING_ORGAN[KE[zhongYun.wuxing]];
    yunNote = `生年${gz.gan}${gz.zhi}，${zhongYun.wuxing}运太过（${zhongYun.taiShao}）——先天${yunOrgan.zang}气偏盛，${shouKe.zang}（${zhongYun.wuxing}所胜）易受亢气之克，后天注意${shouKe.zang}系调护`;
  } else {
    const keWo = Object.keys(KE).find((k) => KE[k] === zhongYun.wuxing);
    const keWoOrgan = WUXING_ORGAN[keWo];
    yunNote = `生年${gz.gan}${gz.zhi}，${zhongYun.wuxing}运不及（${zhongYun.taiShao}）——先天${yunOrgan.zang}气偏弱，${keWoOrgan.zang}（克${zhongYun.wuxing}者）乘衰易犯，后天尤须补养${yunOrgan.zang}系`;
  }

  // 五脏强弱谱（八字五行占比 + 岁运先天修正）
  const organs = WUXING_LIST.map((wx) => ({
    wuxing: wx,
    ...WUXING_ORGAN[wx],
    percent: dist.percent[wx],
    level: dist.percent[wx] >= 28 ? '偏旺' : dist.percent[wx] <= 8 ? '不足' : '平'
  }));
  const weak = [...organs].sort((a, b) => a.percent - b.percent).filter((o) => o.level !== '偏旺').slice(0, 2);
  const strong = [...organs].sort((a, b) => b.percent - a.percent)[0];

  return {
    birth,
    bazi: profile.eightChar,
    birthYearGanzhi: `${gz.gan}${gz.zhi}`,
    birthYun: { ...zhongYun, note: yunNote },
    birthSiTian: { qi: siTian, wuxing: siTianWx, note: `生年司天${siTian}，主司出生时天时之气，${QI_TO_WUXING[siTian]}气偏盛之境，相应脏腑（${{ 木: '肝胆', 火: '心小肠', 土: '脾胃', 金: '肺大肠', 水: '肾膀胱' }[siTianWx]})禀此气而成长` },
    pillars,
    wuxingDist: dist,
    organs,
    xianTianBuZu: weak.map((o) => ({ organ: o.zang, wuxing: o.wuxing, percent: o.percent, risk: o.bing, tiaoHu: `宜常养${o.zang}：${{ 木: '酸收甘缓、逍遥怡情、忌怒', 火: '苦坚咸软、静坐安神、忌劳心', 土: '甘淡补中、节饮食、忌思虑过度', 金: '辛润酸收、慎风寒、忌悲忧', 水: '咸泻辛润、节欲保精、忌恐惧' }[o.wuxing]}` })),
    xianTianWang: { organ: strong.zang, wuxing: strong.wuxing, percent: strong.percent, note: `${strong.zang}气先天偏旺（占${strong.percent}%），太过之年尤防其亢而害所胜` },
    region,
    grownRisks: grownCarePlan(organs, weak, zhongYun, gz, region, siTianWx).risks,
    lifeStyle: grownCarePlan(organs, weak, zhongYun, gz, region, siTianWx).life,
    dayMaster: profile.dayMaster
  };
}

// 出生地禀赋：《异法方宜论》五方 + 方位五行 + 省级气候修正
function resolveLocationRobust(locationInput) {
  if (!locationInput || !locationInput.location) return null;
  const { resolveLocation, searchRegions } = require('./almanac/bazi');
  const raw = String(locationInput.location).trim();
  let loc = null;
  try {
    const r = resolveLocation({ location: raw });
    if (r && r.name && !/^\u5317\u4eac/.test(r.name)) loc = r; // 回退北京的视为未命中
  } catch (e) { /* ignore */ }
  if (!loc) {
    // 市名歧义：searchRegions 直接命中时取其 location；原词失败后试"X市"，再不行取候选中第一个市/地区级条目
    for (const q of [raw, raw.endsWith('市') ? raw : raw + '市']) {
      try {
        const s = searchRegions(q);
        if (s.ok && s.location && s.location.lng) { loc = s.location; break; }
        if (!s.ok && Array.isArray(s.candidates)) {
          const cityLevel = s.candidates.find((c) => /^(.+[省市州盟])\s*$/.test(c.trim()));
          if (cityLevel) {
            const s2 = searchRegions(cityLevel.trim());
            if (s2.ok && s2.location && s2.location.lng) { loc = s2.location; break; }
          }
        }
      } catch (e) { /* ignore */ }
    }
  }
  return loc;
}

function regionEndowment(locationInput) {
  const loc = resolveLocationRobust(locationInput);
  if (!loc) return null;
  const five = REGION_FIVE.find((f) => f.match(loc.lng, loc.lat));
  const provKey = Object.keys(REGION_JIAO_ZHENG).find((k) => (loc.name || '').includes(k) || (loc.province || '') === k);
  return {
    location: loc.name,
    lng: loc.lng, lat: loc.lat,
    direction: five.dir,
    wuxing: five.wuxing,
    origin: five.origin,
    regionBing: five.bing,
    jiaoZheng: provKey ? REGION_JIAO_ZHENG[provKey] : '',
    note: `${five.dir}方（${five.wuxing}）禀赋——${five.origin}${provKey ? '；' + REGION_JIAO_ZHENG[provKey] : ''}`
  };
}

// 成年后疾病风险清单 + 生活饮食起居调摄（弱脏 × 岁运推演 × 地域 三源合并）
function grownCarePlan(organs, weak, zhongYun, gz, region, siTianWx) {
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const risks = [];
  const seen = new Set();
  const push = (organ, source, text) => {
    const key = organ + '|' + text.slice(0, 12);
    if (seen.has(key)) return;
    seen.add(key);
    risks.push({ organ, source, text });
  };
  for (const w of weak) {
    push(w.zang, '八字弱脏', `先天${w.zang}（${w.wuxing}）气不足（占${w.percent}%）——${w.bing}`);
  }
  if (zhongYun.level === 'taiGuo') {
    const organ = WUXING_ORGAN[zhongYun.wuxing];
    const shouKe = WUXING_ORGAN[KE[zhongYun.wuxing]];
    push(organ.zang, '生年岁运', `${zhongYun.taiShao}（${zhongYun.wuxing}运太过）——${organ.zang}气偏盛，防本脏太过之病：${organ.bing}`);
    push(shouKe.zang, '生年岁运', `${zhongYun.wuxing}亢则害所胜——${shouKe.zang}系易受克：${shouKe.bing}`);
  } else {
    const organ = WUXING_ORGAN[zhongYun.wuxing];
    const keWo = Object.keys(KE).find((k) => KE[k] === zhongYun.wuxing);
    const keWoOrgan = WUXING_ORGAN[keWo];
    push(organ.zang, '生年岁运', `${zhongYun.taiShao}（${zhongYun.wuxing}运不及）——${organ.zang}气先天偏弱，虚证易起：${organ.bing}`);
    push(keWoOrgan.zang, '生年岁运', `克${zhongYun.wuxing}者（${keWoOrgan.zang}）乘衰易犯——防${keWoOrgan.zang}系病：${keWoOrgan.bing}`);
  }
  if (region) {
    push('全身', '出生地《异法方宜》', `${region.direction}方之民多${region.regionBing}`);
    if (region.jiaoZheng) push('全身', '出生地气候', region.jiaoZheng);
  }
  // 生年司天在泉偏向
  const organSiTian = { 木: '肝胆', 火: '心小肠', 土: '脾胃', 金: '肺大肠', 水: '肾膀胱' }[siTianWx];
  push('全身', '生年司天', `生于${gz.gan}${gz.zhi}年，司天${siTianWx}气当令——${organSiTian}禀承此气，过用则伤，宜顺应调养`);

  // 生活调摄：取两个弱脏的 ORGAN_LIFE 合并 + 起居总则
  const weakLife = weak.map((o) => ({ organ: o.zang, wuxing: o.wuxing, ...ORGAN_LIFE[o.wuxing] }));
  const life = {
    perOrgan: weakLife,
    zongZe: [
      '饮食有节，五谷为养，五果为助，五畜为益，五菜为充（《素问·脏器法时论》义）；忌过饥过饱、偏嗜一味',
      '起居有常，不妄作劳；四季依《四气调神大论》春生夏长秋收冬藏调作息',
      '恬惔虚无，真气从之；精神内守，病安从来（《素问·上古天真论》）',
      '虚邪贼风，避之有时——岁运太过不及之年尤避其胜气（可查本工具流年预警）'
    ],
    yaoShi: weak.length ? `平日常备养${weak.map((w) => w.zang).join('、')}之品；岁运克伐弱脏之年，酌以岁运方加减调理（查 warn 命令）` : '五脏禀赋尚平，依四时调养即可'
  };
  return { risks, life };
}

// 流年与先天交互预警
function yearWarn(constitution, year) {
  const yq = require('./yunqi').getYearYunqi(year);
  const warns = [];
  const zhongWx = yq.zhongYun.wuxing;
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

  for (const w of constitution.xianTianBuZu) {
    if (KE[zhongWx] === w.wuxing) {
      warns.push({ level: '高', organ: w.organ, reason: `流年${yq.ganzhi}${zhongWx}运${yq.zhongYun.level === 'taiGuo' ? '太过' : '不及'}克伐${w.wuxing}，先天${w.organ}不足者受乘——《运气要诀》：不及之年，克我者乘衰而犯`, bing: w.risk, fang: `岁运方：${yq.fangJi.yunFang.name}（${yq.fangJi.yunFang.zhu.split('。')[0]}）加减，兼顾养${w.organ}` });
    } else if (zhongWx === w.wuxing && yq.zhongYun.level === 'buJi') {
      warns.push({ level: '高', organ: w.organ, reason: `流年${yq.ganzhi}${zhongWx}运不及，本脏更虚——先天${w.organ}不足者虚上加虚`, bing: w.risk, fang: `岁运方：${yq.fangJi.yunFang.name}加减，直补${w.organ}` });
    } else if (zhongWx === w.wuxing && yq.zhongYun.level === 'taiGuo') {
      warns.push({ level: '中', organ: w.organ, reason: `流年${zhongWx}运太过，本脏得岁气之助而亢——先天弱脏得助反可乘所胜，防其太过之病`, bing: WUXING_ORGAN[zhongWx].bing, fang: `平其太过：${yq.fangJi.yunFang.name}加减` });
    } else if (SHENG[zhongWx] === w.wuxing && yq.zhongYun.level === 'taiGuo') {
      warns.push({ level: '低', organ: w.organ, reason: `流年${zhongWx}运太过生助${w.wuxing}（母气及子）——先天${w.organ}不足者得岁气滋养，宜乘势进补，事半功倍`, bing: w.risk, fang: `岁运方：${yq.fangJi.yunFang.name}加减，顺势养${w.organ}` });
    }
  }
  // 司天在泉与弱脏
  const siTianWx = QI_TO_WUXING[yq.siTian.qi];
  const zaiQuanWx = QI_TO_WUXING[yq.zaiQuan.qi];
  for (const w of constitution.xianTianBuZu) {
    if (siTianWx === w.wuxing && !warns.some((x) => x.organ === w.organ)) {
      warns.push({ level: '中', organ: w.organ, reason: `司天${yq.siTian.qi}加临，${w.wuxing}气偏胜于上——先天${w.organ}不足者不胜其胜`, bing: w.risk, fang: `司天治则：${yq.siTian.zhiZhi}` });
    }
    if (zaiQuanWx === w.wuxing && !warns.some((x) => x.organ === w.organ)) {
      warns.push({ level: '中', organ: w.organ, reason: `在泉${yq.zaiQuan.qi}加临，${w.wuxing}气偏胜于下——先天${w.organ}不足者下部受邪`, bing: w.risk, fang: `在泉治则：${yq.zaiQuan.zhiZhi}` });
    }
  }
  // 天刑/不和之年病情重
  if (yq.linYun && (yq.linYun.type === '天刑' || yq.linYun.type === '不和' || yq.linYun.type === '天符')) {
    warns.push({ level: '中', organ: '全身', reason: `本年为${yq.linYun.type}之岁——${yq.linYun.desc}，病势较常年为重，调摄宜谨`, bing: yq.minBing, fang: `岁宜：${yq.suiYi}` });
  }

  return {
    year,
    yunqiSummary: { ganzhi: yq.ganzhi, zhongYun: `${yq.zhongYun.taiShao}（${zhongWx}${yq.zhongYun.level === 'taiGuo' ? '太过' : '不及'}）`, siTian: yq.siTian.qi, zaiQuan: yq.zaiQuan.qi, linYun: yq.linYun ? yq.linYun.type : '' },
    warns,
    yongYao: {
      suiYi: yq.suiYi,
      yaoShiYi: yq.yaoShiYi,
      siTianZhi: yq.siTian.zhiZhi,
      zaiQuanZhi: yq.zaiQuan.zhiZhi,
      yunFang: yq.fangJi.yunFang,
      qiFang: yq.fangJi.qiFang
    }
  };
}

module.exports = { buildConstitution, yearWarn, wuxingDistribution, WUXING_ORGAN };
};
__modules['lib/almanac/bazi.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { CITIES } = require('./constants');
const { parseYmd, pad2 } = require('./util');
const { toTrueSolarTime } = require('./astro');
const Lunar = require('../lunar.js');

const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

const LIU_HE = {
  子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午'
};

const SAN_HE = [
  ['申', '子', '辰'],
  ['亥', '卯', '未'],
  ['寅', '午', '戌'],
  ['巳', '酉', '丑']
];

const LIU_CHONG = {
  子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅',
  卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳'
};

const LIU_HAI = {
  子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅',
  卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉'
};

const XIANG_XING = [
  ['子', '卯'],
  ['寅', '巳'], ['巳', '申'], ['申', '寅'],
  ['丑', '戌'], ['戌', '未'], ['未', '丑'],
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥']
];

const GAN_WUXING = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水'
};

const ZHI_WUXING = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
};

const WUXING_SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const WUXING_KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

const REGION_FILE = path.join(__dirname, '..', '..', 'data', 'geo', 'china-regions.json');
let regionCache = null;

function loadRegions() {
  if (regionCache) return regionCache;
  regionCache = {
    list: [],
    byCounty: new Map(),
    byCity: new Map(),
    error: null
  };
  try {
    const json = JSON.parse(fs.readFileSync(REGION_FILE, 'utf8'));
    for (const r of json.regions) {
      regionCache.list.push(r);
      if (!regionCache.byCounty.has(r.n)) regionCache.byCounty.set(r.n, []);
      regionCache.byCounty.get(r.n).push(r);
      if (r.level === 'city') {
        if (!regionCache.byCity.has(r.c)) regionCache.byCity.set(r.c, []);
        regionCache.byCity.get(r.c).push(r);
      }
    }
  } catch (err) {
    regionCache.error = err.message;
  }
  return regionCache;
}

function listRegions() {
  return loadRegions().list.map((r) => ({
    key: fmtRegion(r),
    p: r.p,
    c: r.c,
    n: r.n,
    level: r.level,
    lng: r.lng,
    lat: r.lat
  }));
}

function fmtRegion(r) {
  return r.n === r.c ? `${r.p} ${r.c}` : `${r.p} ${r.c} ${r.n}`;
}

function stripSuffix(s) {
  return String(s).replace(/(特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区|自治州|地区|盟|省|市|县|区|旗)$/, '');
}

function searchRegions(query) {
  const db = loadRegions();
  if (db.error) return { ok: false, reason: 'region-table-missing', error: db.error, candidates: [] };
  const tokens = String(query).trim().split(/[\s,，、/]+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, reason: 'empty', candidates: [] };

  let matches = [];
  if (tokens.length >= 3) {
    const p = stripSuffix(tokens[0]);
    const c = stripSuffix(tokens[1]);
    const n = stripSuffix(tokens[2]);
    matches = db.list.filter((r) => r.p.startsWith(p) && r.c.startsWith(c) && r.n.startsWith(n));
  } else if (tokens.length === 2) {
    const a = stripSuffix(tokens[0]);
    const b = stripSuffix(tokens[1]);
    matches = db.list.filter((r) => r.n.startsWith(b) && (r.c.startsWith(a) || r.p.startsWith(a)));
  } else {
    const t = tokens[0];
    matches = db.byCounty.get(t) || [];
    if (matches.length === 0) matches = db.byCity.get(t) || [];
  }

  if (matches.length === 0) {
    let fuzzy = [];
    if (tokens.length === 1 && stripSuffix(tokens[0]).length >= 2) {
      const t = stripSuffix(tokens[0]);
      fuzzy = db.list.filter((r) => r.n.startsWith(t) || r.c.startsWith(t)).slice(0, 12);
    }
    return { ok: false, reason: 'no-match', candidates: fuzzy.map(fmtRegion) };
  }

  const uniq = new Map();
  for (const r of matches) uniq.set(fmtRegion(r), r);
  if (uniq.size > 1) {
    return { ok: false, reason: 'ambiguous', candidates: [...uniq.keys()].slice(0, 12) };
  }
  const r = uniq.values().next().value;
  return {
    ok: true,
    location: {
      name: fmtRegion(r),
      lng: r.lng,
      lat: r.lat,
      tz: 8,
      source: 'region-table',
      level: r.level
    }
  };
}

function formatRegionError(query, result) {
  if (result.reason === 'ambiguous') {
    return `地点「${query}」存在多处同名，请补充省市，例如：${result.candidates.join('；')}`;
  }
  if (result.reason === 'no-match') {
    const hint = result.candidates.length > 0 ? `相近地点：${result.candidates.join('；')}` : '可用「省 市 县」三段式，如：河北 邢台市 平乡县';
    return `未收录地点「${query}」。${hint}；也可用 --lng --lat 指定坐标`;
  }
  return `地点「${query}」解析失败：${result.error || result.reason}`;
}

function resolveLocation(input) {
  const opts = input || {};
  if (opts.lng != null && !Number.isNaN(Number(opts.lng))) {
    const tz = opts.tz == null ? 8 : Number(opts.tz);
    return {
      name: opts.city || opts.region || '自定义经度',
      lng: Number(opts.lng),
      lat: opts.lat == null ? null : Number(opts.lat),
      tz,
      source: 'explicit-lng'
    };
  }
  if (opts.region) {
    const result = searchRegions(opts.region);
    if (result.ok) return result.location;
    throw new Error(formatRegionError(opts.region, result));
  }
  const name = opts.city || '北京';
  const regionResult = searchRegions(name);
  if (regionResult.ok) return regionResult.location;
  const city = CITIES[name];
  if (!city) {
    throw new Error(formatRegionError(name, regionResult));
  }
  return { name, lng: city.lng, lat: city.lat, tz: city.tz, source: 'city-table' };
}

function parseBirth(text) {
  if (!text) return null;
  const s = String(text).trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error('生辰格式应为 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm，收到：' + s);
  const date = parseYmd(`${m[1]}-${m[2]}-${m[3]}`);
  const hour = m[4] == null ? 12 : Number(m[4]);
  const minute = m[5] == null ? 0 : Number(m[5]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error('生辰时间非法：' + s);
  return { date, hour, minute, raw: s };
}

function buildProfile(input) {
  if (!input || !input.birth) return null;
  const parsed = parseBirth(input.birth);
  const location = resolveLocation(input);
  const trueTime = toTrueSolarTime(
    parsed.date.y, parsed.date.m, parsed.date.d,
    parsed.hour, parsed.minute,
    location.lng, location.tz
  );
  const lunar = Lunar.Lunar.fromYmdHms(
    trueTime.y, trueTime.m, trueTime.d, trueTime.hour, trueTime.minute, 0
  );
  const eightChar = Lunar.EightChar.fromLunar(lunar);
  const yearZhi = eightChar.getYearZhi();
  const dayZhi = eightChar.getDayZhi();
  const dayGan = eightChar.getDayGan();
  return {
    birth: parsed.raw,
    gender: input.gender === 'female' || input.gender === '女' ? 'female' : 'male',
    location,
    trueSolarTime: `${trueTime.y}-${pad2(trueTime.m)}-${pad2(trueTime.d)} ${pad2(trueTime.hour)}:${pad2(trueTime.minute)}`,
    trueSolarOffset: trueTime.offset,
    lunar: {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      time: lunar.getTimeInGanZhi()
    },
    eightChar: {
      year: eightChar.getYear(),
      month: eightChar.getMonth(),
      day: eightChar.getDay(),
      time: eightChar.getTime()
    },
    yearZhi,
    dayZhi,
    dayGan,
    zodiac: ZODIAC[ZHI.indexOf(yearZhi)],
    dayMaster: {
      gan: dayGan,
      wuxing: GAN_WUXING[dayGan],
      zhi: dayZhi,
      zhiWuxing: ZHI_WUXING[dayZhi],
      naYin: lunar.getDayNaYin()
    },
    xunKong: lunar.getDayXunKong()
  };
}

function zhiRelation(a, b) {
  if (!a || !b) return { type: 'unknown', label: '地支缺失', score: 0 };
  if (LIU_CHONG[a] === b) return { type: 'chong', label: `${a}${b}相冲`, score: -35 };
  if (LIU_HAI[a] === b) return { type: 'hai', label: `${a}${b}相害`, score: -18 };
  const isXing = XIANG_XING.some((pair) => pair[0] === a && pair[1] === b || pair[0] === b && pair[1] === a);
  if (isXing) return { type: 'xing', label: `${a}${b}相刑`, score: -12 };
  if (LIU_HE[a] === b) return { type: 'liuhe', label: `${a}${b}六合`, score: 18 };
  const sanhe = SAN_HE.find((group) => group.includes(a) && group.includes(b) && a !== b);
  if (sanhe) return { type: 'sanhe', label: `${a}${b}三合（${sanhe.join('')}局）`, score: 12 };
  if (a === b) return { type: 'same', label: `${a}${b}比和`, score: 5 };
  return { type: 'none', label: `${a}${b}无特殊关系`, score: 0 };
}

function ganRelation(a, b) {
  if (!a || !b) return { type: 'unknown', label: '', score: 0 };
  const wa = GAN_WUXING[a];
  const wb = GAN_WUXING[b];
  if (a === b) return { type: 'same', label: `${a}${b}比和`, score: 3 };
  if (WUXING_SHENG[wa] === wb) return { type: 'sheng', label: `${a}${wa}生${b}${wb}`, score: 6 };
  if (WUXING_SHENG[wb] === wa) return { type: 'sheng', label: `${b}${wb}生${a}${wa}`, score: 4 };
  if (WUXING_KE[wa] === wb) return { type: 'ke', label: `${a}${wa}克${b}${wb}`, score: -4 };
  if (WUXING_KE[wb] === wa) return { type: 'ke', label: `${b}${wb}克${a}${wa}`, score: -6 };
  return { type: 'none', label: `${a}${wa}与${b}${wb}无生克`, score: 0 };
}

function wuxingOfGan(gan) {
  return GAN_WUXING[gan] || '';
}

function wuxingOfZhi(zhi) {
  return ZHI_WUXING[zhi] || '';
}

module.exports = {
  ZHI,
  ZODIAC,
  GAN_WUXING,
  ZHI_WUXING,
  resolveLocation,
  searchRegions,
  listRegions,
  parseBirth,
  buildProfile,
  zhiRelation,
  ganRelation,
  wuxingOfGan,
  wuxingOfZhi
};
};
__modules['lib/almanac/constants.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

const VERSION = '1.1.0';
const SCHEMA_VERSION = 2;

const NINE_STAR = [
  { index: 0, number: '一', color: '白', wuxing: '水', luck: '吉', name: '贪狼', position: '坎' },
  { index: 1, number: '二', color: '黑', wuxing: '土', luck: '凶', name: '巨门', position: '坤' },
  { index: 2, number: '三', color: '碧', wuxing: '木', luck: '凶', name: '禄存', position: '震' },
  { index: 3, number: '四', color: '绿', wuxing: '木', luck: '吉', name: '文曲', position: '巽' },
  { index: 4, number: '五', color: '黄', wuxing: '土', luck: '大凶', name: '廉贞', position: '中' },
  { index: 5, number: '六', color: '白', wuxing: '金', luck: '吉', name: '武曲', position: '乾' },
  { index: 6, number: '七', color: '赤', wuxing: '金', luck: '凶', name: '破军', position: '兑' },
  { index: 7, number: '八', color: '白', wuxing: '土', luck: '吉', name: '左辅', position: '艮' },
  { index: 8, number: '九', color: '紫', wuxing: '火', luck: '吉', name: '右弼', position: '离' }
];

const ZHIXING_MEANING = {
  建: '万物生育、健旺之日',
  除: '除旧布新、扫除之日',
  满: '圆满、丰盈之日',
  平: '平常、平稳之日',
  定: '安定、确定之日',
  执: '执持、操守之日',
  破: '破败、冲破之日',
  危: '危险、危惧之日',
  成: '成就、成功之日',
  收: '收成、收纳之日',
  开: '开启、通达之日',
  闭: '闭藏、休整之日'
};

const EVENTS = {
  marriage: {
    id: 'marriage',
    name: '嫁娶',
    category: '婚嫁',
    aliases: ['嫁娶', '结婚', '婚礼', '领证', '办喜事', '婚宴'],
    yi: ['嫁娶', '纳采', '订盟'],
    ji: ['嫁娶'],
    zhixing: { good: ['定', '成', '开', '满'], bad: ['破', '平', '闭', '建', '危'] },
    xiu: {
      good: ['角', '房', '尾', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '昴', '参', '鬼', '翼']
    },
    nineStar: { good: [7, 8, 0, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['巳', '午', '未', '卯'],
    taboo: ['三娘煞']
  },
  engagement: {
    id: 'engagement',
    name: '订婚',
    category: '婚嫁',
    aliases: ['订婚', '纳采', '订盟', '提亲', '文定'],
    yi: ['纳采', '订盟', '嫁娶'],
    ji: ['纳采', '订盟'],
    zhixing: { good: ['定', '成', '开', '满'], bad: ['破', '平', '闭'] },
    xiu: {
      good: ['角', '房', '尾', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '昴', '参', '鬼', '翼']
    },
    nineStar: { good: [7, 8, 0, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['巳', '午', '未', '卯'],
    taboo: ['三娘煞']
  },
  opening: {
    id: 'opening',
    name: '开业',
    category: '商业',
    aliases: ['开业', '开市', '开张', '开店', '开门营业', '公司成立'],
    yi: ['开市', '交易', '立券', '纳财', '开业'],
    ji: ['开市'],
    zhixing: { good: ['开', '成', '满', '定'], bad: ['破', '闭', '平', '收'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '卯'],
    taboo: ['杨公忌']
  },
  move: {
    id: 'move',
    name: '搬家',
    category: '居住',
    aliases: ['搬家', '入宅', '移徙', '乔迁', '迁居', '入住'],
    yi: ['入宅', '移徙', '安床'],
    ji: ['入宅', '移徙'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '建', '危'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['杨公忌']
  },
  travel: {
    id: 'travel',
    name: '出行',
    category: '出行',
    aliases: ['出行', '出差', '旅游', '远行', '赴任', '启程'],
    yi: ['出行', '赴任', '移徙'],
    ji: ['出行'],
    zhixing: { good: ['开', '成', '定', '平', '建'], bad: ['破', '闭', '危'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '壁', '娄', '胃', '毕', '张', '翼', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '参', '鬼', '柳']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: ['往亡日', '杨公忌']
  },
  groundbreaking: {
    id: 'groundbreaking',
    name: '动土',
    category: '营建',
    aliases: ['动土', '开工', '破土', '奠基', '起基', '开挖'],
    yi: ['动土', '破土', '起基', '修造'],
    ji: ['动土', '破土'],
    zhixing: { good: ['开', '成', '定', '执'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 0, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['土符', '杨公忌']
  },
  construction: {
    id: 'construction',
    name: '修造',
    category: '营建',
    aliases: ['修造', '装修', '上梁', '竖柱', '盖房', '翻修', '拆卸'],
    yi: ['修造', '上梁', '竖柱', '拆卸'],
    ji: ['修造', '上梁'],
    zhixing: { good: ['开', '成', '定', '执'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 0, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['土符', '杨公忌']
  },
  burial: {
    id: 'burial',
    name: '安葬',
    category: '丧葬',
    aliases: ['安葬', '下葬', '葬礼', '入殓', '移柩', '启钻', '立碑'],
    yi: ['安葬', '入殓', '移柩', '启钻', '谢土'],
    ji: ['安葬', '入殓'],
    zhixing: { good: ['开', '成', '定', '闭'], bad: ['破', '平', '收', '满'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [5, 7, 0, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '未', '申'],
    taboo: ['受死日', '杨公忌']
  },
  contract: {
    id: 'contract',
    name: '签约',
    category: '商业',
    aliases: ['签约', '合同', '立券', '交易', '谈判', '合作'],
    yi: ['立券', '交易', '纳财', '开市'],
    ji: ['立券', '交易'],
    zhixing: { good: ['成', '定', '开', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['杨公忌']
  },
  study: {
    id: 'study',
    name: '入学',
    category: '文教',
    aliases: ['入学', '开学', '考试', '报名', '拜师', '求学', '升学'],
    yi: ['入学', '会亲友', '祈福'],
    ji: ['入学'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [3, 0, 7, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  medical: {
    id: 'medical',
    name: '求医',
    category: '健康',
    aliases: ['求医', '看病', '手术', '治疗', '针灸', '体检'],
    yi: ['求医', '治病', '针灸'],
    ji: ['求医', '治病'],
    zhixing: { good: ['除', '开', '成', '定'], bad: ['破', '闭', '满'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [0, 5, 3, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: ['受死日']
  },
  worship: {
    id: 'worship',
    name: '祭祀祈福',
    category: '礼俗',
    aliases: ['祭祀', '祈福', '求嗣', '斋醮', '还愿', '开光', '上香'],
    yi: ['祭祀', '祈福', '求嗣', '斋醮', '开光'],
    ji: ['祭祀', '祈福'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 8, 0, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  haircut: {
    id: 'haircut',
    name: '理发',
    category: '日常',
    aliases: ['理发', '剪发', '美发', '剃头', '沐浴'],
    yi: ['理发', '沐浴', '整手足甲'],
    ji: ['理发'],
    zhixing: { good: ['除', '开', '成', '定'], bad: ['破', '闭', '建'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [0, 3, 7, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  farming: {
    id: 'farming',
    name: '栽种',
    category: '农事',
    aliases: ['栽种', '种植', '播种', '移栽', '农事', '养殖'],
    yi: ['栽种', '牧养', '纳畜'],
    ji: ['栽种'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  career: {
    id: 'career',
    name: '赴任求职',
    category: '事业',
    aliases: ['赴任', '求职', '面试', '上任', '入职', '升职'],
    yi: ['赴任', '出行', '会亲友'],
    ji: ['赴任'],
    zhixing: { good: ['开', '成', '定', '建'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: ['往亡日']
  },
  lawsuit: {
    id: 'lawsuit',
    name: '诉讼',
    category: '事务',
    aliases: ['诉讼', '打官司', '立案', '开庭', '仲裁'],
    yi: ['诉讼'],
    ji: ['诉讼'],
    zhixing: { good: ['定', '执', '开'], bad: ['破', '闭', '平', '满'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [5, 0, 7, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['受死日']
  }
};

const EVENT_ALIASES = (() => {
  const map = new Map();
  for (const key of Object.keys(EVENTS)) {
    const ev = EVENTS[key];
    map.set(key, key);
    map.set(ev.name, key);
    for (const alias of ev.aliases) map.set(alias, key);
  }
  return map;
})();

const CITIES = {
  北京: { lng: 116.4074, lat: 39.9042, tz: 8 },
  上海: { lng: 121.4737, lat: 31.2304, tz: 8 },
  广州: { lng: 113.2644, lat: 23.1291, tz: 8 },
  深圳: { lng: 114.0579, lat: 22.5431, tz: 8 },
  成都: { lng: 104.0665, lat: 30.5723, tz: 8 },
  杭州: { lng: 120.1551, lat: 30.2741, tz: 8 },
  武汉: { lng: 114.3055, lat: 30.5928, tz: 8 },
  西安: { lng: 108.9398, lat: 34.3416, tz: 8 },
  重庆: { lng: 106.5516, lat: 29.5630, tz: 8 },
  南京: { lng: 118.7969, lat: 32.0603, tz: 8 },
  天津: { lng: 117.2009, lat: 39.0842, tz: 8 },
  苏州: { lng: 120.5853, lat: 31.2989, tz: 8 },
  长沙: { lng: 112.9388, lat: 28.2282, tz: 8 },
  郑州: { lng: 113.6254, lat: 34.7466, tz: 8 },
  青岛: { lng: 120.3826, lat: 36.0671, tz: 8 },
  沈阳: { lng: 123.4315, lat: 41.8057, tz: 8 },
  哈尔滨: { lng: 126.5349, lat: 45.8038, tz: 8 },
  昆明: { lng: 102.8329, lat: 24.8801, tz: 8 },
  贵阳: { lng: 106.6302, lat: 26.6477, tz: 8 },
  南宁: { lng: 108.3669, lat: 22.8170, tz: 8 },
  福州: { lng: 119.2965, lat: 26.0745, tz: 8 },
  厦门: { lng: 118.0894, lat: 24.4798, tz: 8 },
  济南: { lng: 117.1205, lat: 36.6512, tz: 8 },
  合肥: { lng: 117.2272, lat: 31.8206, tz: 8 },
  南昌: { lng: 115.8582, lat: 28.6829, tz: 8 },
  石家庄: { lng: 114.5149, lat: 38.0428, tz: 8 },
  太原: { lng: 112.5489, lat: 37.8706, tz: 8 },
  呼和浩特: { lng: 111.7492, lat: 40.8426, tz: 8 },
  乌鲁木齐: { lng: 87.6168, lat: 43.8256, tz: 8 },
  拉萨: { lng: 91.1409, lat: 29.6456, tz: 8 },
  兰州: { lng: 103.8343, lat: 36.0611, tz: 8 },
  西宁: { lng: 101.7782, lat: 36.6171, tz: 8 },
  银川: { lng: 106.2309, lat: 38.4872, tz: 8 },
  海口: { lng: 110.1983, lat: 20.0440, tz: 8 },
  三亚: { lng: 109.5119, lat: 18.2528, tz: 8 },
  香港: { lng: 114.1694, lat: 22.3193, tz: 8 },
  澳门: { lng: 113.5439, lat: 22.1987, tz: 8 },
  台北: { lng: 121.5654, lat: 25.0330, tz: 8 },
  东京: { lng: 139.6917, lat: 35.6895, tz: 9 },
  首尔: { lng: 126.9780, lat: 37.5665, tz: 9 },
  新加坡: { lng: 103.8198, lat: 1.3521, tz: 8 },
  纽约: { lng: -74.0060, lat: 40.7128, tz: -5 },
  伦敦: { lng: -0.1276, lat: 51.5074, tz: 0 },
  洛杉矶: { lng: -118.2437, lat: 34.0522, tz: -8 },
  巴黎: { lng: 2.3522, lat: 48.8566, tz: 1 },
  悉尼: { lng: 151.2093, lat: -33.8688, tz: 10 }
};

const RULES = {
  R001: { id: 'R001', name: '日宜匹配', kind: 'positive', max: 30, field: 'lunar.getDayYi()' },
  R002: { id: 'R002', name: '日忌冲突', kind: 'negative', max: 50, field: 'lunar.getDayJi()' },
  R003: { id: 'R003', name: '建除十二神', kind: 'mixed', max: 25, field: 'lunar.getZhiXing()' },
  R004: { id: 'R004', name: '黄道黑道', kind: 'mixed', max: 15, field: 'lunar.getDayTianShenType()' },
  R005: { id: 'R005', name: '二十八宿', kind: 'mixed', max: 12, field: 'lunar.getXiu()/getXiuLuck()' },
  R006: { id: 'R006', name: '吉神加持', kind: 'positive', max: 12, field: 'lunar.getDayJiShen()' },
  R007: { id: 'R007', name: '凶煞扣减', kind: 'negative', max: 20, field: 'lunar.getDayXiongSha()' },
  R008: { id: 'R008', name: '生肖相冲', kind: 'negative', max: 40, field: 'lunar.getDayChongShengXiao()' },
  R009: { id: 'R009', name: '命主日柱关系', kind: 'mixed', max: 35, field: 'dayZhi vs profile.dayZhi' },
  R010: { id: 'R010', name: '九星吉凶', kind: 'mixed', max: 12, field: 'lunar.getDayNineStar()' },
  R011: { id: 'R011', name: '彭祖百忌', kind: 'negative', max: 15, field: 'lunar.getPengZuGan()/getPengZuZhi()' },
  R012: { id: 'R012', name: '旬空', kind: 'negative', max: 10, field: 'lunar.getDayXunKong()' },
  R013: { id: 'R013', name: '四离四绝', kind: 'negative', max: 50, field: '节气交日' },
  R014: { id: 'R014', name: '天赦日', kind: 'positive', max: 18, field: 'lunar.getDayJiShen()' },
  R015: { id: 'R015', name: '三娘煞', kind: 'negative', max: 18, field: '农历日/月' },
  R016: { id: 'R016', name: '杨公忌日', kind: 'negative', max: 18, field: '农历日' },
  R017: { id: 'R017', name: '受死日', kind: 'negative', max: 22, field: 'lunar.getDayXiongSha()' },
  R018: { id: 'R018', name: '往亡日', kind: 'negative', max: 12, field: 'lunar.getDayXiongSha()' },
  R019: { id: 'R019', name: '月相', kind: 'mixed', max: 10, field: 'lunar.getYueXiang()' },
  R020: { id: 'R020', name: '节气交接', kind: 'negative', max: 8, field: 'lunar.getJieQi()/getPrevJieQi()' },
  R021: { id: 'R021', name: '本命日', kind: 'negative', max: 8, field: 'dayGanZhi vs profile.dayGanZhi' }
};

const LEVELS = [
  { min: 90, label: '上吉', tone: 'excellent' },
  { min: 80, label: '吉', tone: 'good' },
  { min: 70, label: '小吉', tone: 'fair' },
  { min: 60, label: '平', tone: 'neutral' },
  { min: 50, label: '慎用', tone: 'caution' },
  { min: 0, label: '不宜', tone: 'bad' }
];

const SCORE = {
  base: 55,
  divisor: 2.0
};

const SAN_NIANG = [3, 7, 13, 18, 22, 27];

const YANG_GONG = [
  { month: 1, day: 13 }, { month: 2, day: 11 }, { month: 3, day: 9 },
  { month: 4, day: 7 }, { month: 5, day: 5 }, { month: 6, day: 3 },
  { month: 7, day: 1 }, { month: 7, day: 29 }, { month: 8, day: 27 },
  { month: 9, day: 25 }, { month: 10, day: 23 }, { month: 11, day: 21 },
  { month: 12, day: 19 }
];

const SI_LI = ['立春', '立夏', '立秋', '立冬'];
const SI_JUE = ['春分', '夏至', '秋分', '冬至'];

const PENGZU_GAN = {
  甲: { taboo: '开仓', note: '甲不开仓财物耗散' },
  乙: { taboo: '栽植', note: '乙不栽植千株不长' },
  丙: { taboo: '修灶', note: '丙不修灶必见灾殃' },
  丁: { taboo: '剃头', note: '丁不剃头头必生疮' },
  戊: { taboo: '受田', note: '戊不受田田主不祥' },
  己: { taboo: '破券', note: '己不破券二比并亡' },
  庚: { taboo: '经络', note: '庚不经络织机虚张' },
  辛: { taboo: '合酱', note: '辛不合酱主人不尝' },
  壬: { taboo: '泱水', note: '壬不泱水更难提防' },
  癸: { taboo: '词讼', note: '癸不词讼理弱敌强' }
};

const PENGZU_ZHI = {
  子: { taboo: '问卜', note: '子不问卜自惹祸殃' },
  丑: { taboo: '冠带', note: '丑不冠带主不还乡' },
  寅: { taboo: '祭祀', note: '寅不祭祀神鬼不尝' },
  卯: { taboo: '穿井', note: '卯不穿井水泉不香' },
  辰: { taboo: '哭泣', note: '辰不哭泣必主重丧' },
  巳: { taboo: '远行', note: '巳不远行财物伏藏' },
  午: { taboo: '苫盖', note: '午不苫盖屋主更张' },
  未: { taboo: '服药', note: '未不服药毒气入肠' },
  申: { taboo: '安床', note: '申不安床鬼祟入房' },
  酉: { taboo: '会客', note: '酉不会客醉坐颠狂' },
  戌: { taboo: '吃犬', note: '戌不吃犬作怪上床' },
  亥: { taboo: '嫁娶', note: '亥不嫁娶不利新郎' }
};

const EVENT_PENGZU_MATCH = {
  marriage: ['嫁娶'],
  engagement: ['嫁娶'],
  opening: ['开仓', '破券'],
  move: ['安床'],
  travel: ['远行'],
  groundbreaking: ['修灶', '穿井'],
  construction: ['修灶'],
  burial: ['哭泣'],
  contract: ['破券', '词讼'],
  study: ['冠带'],
  medical: ['服药'],
  worship: ['祭祀'],
  haircut: ['剃头'],
  farming: ['栽植'],
  career: ['远行'],
  lawsuit: ['词讼']
};

module.exports = {
  VERSION,
  SCHEMA_VERSION,
  NINE_STAR,
  ZHIXING_MEANING,
  EVENTS,
  EVENT_ALIASES,
  CITIES,
  RULES,
  LEVELS,
  SCORE,
  SAN_NIANG,
  YANG_GONG,
  SI_LI,
  SI_JUE,
  PENGZU_GAN,
  PENGZU_ZHI,
  EVENT_PENGZU_MATCH
};
};
__modules['lib/almanac/util.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseYmd(text) {
  if (text instanceof Date) {
    return {
      y: text.getFullYear(),
      m: text.getMonth() + 1,
      d: text.getDate()
    };
  }
  const s = String(text).trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (!m) throw new Error('日期格式应为 YYYY-MM-DD，收到：' + s);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new Error('无效日期：' + s);
  }
  return { y, m: mo, d };
}

function ymd(obj) {
  return `${obj.y}-${pad2(obj.m)}-${pad2(obj.d)}`;
}

function dateKey(obj) {
  return `${obj.y}${pad2(obj.m)}${pad2(obj.d)}`;
}

function addDays(obj, delta) {
  const dt = new Date(Date.UTC(obj.y, obj.m - 1, obj.d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function diffDays(a, b) {
  const da = Date.UTC(a.y, a.m - 1, a.d);
  const db = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((da - db) / 86400000);
}

function eachDay(start, end, limit) {
  const list = [];
  const max = limit == null ? 3660 : limit;
  let cur = { ...start };
  while (diffDays(end, cur) >= 0 && list.length < max) {
    list.push(cur);
    cur = addDays(cur, 1);
  }
  return list;
}

function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86400000) + 1;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round(n, digits) {
  const p = Math.pow(10, digits == null ? 0 : digits);
  return Math.round(n * p) / p;
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function signPayload(payload) {
  return sha256(canonicalJson(payload));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return file;
}

function unique(list) {
  return Array.from(new Set(list));
}

function includesAny(haystack, needles) {
  if (!Array.isArray(haystack)) return [];
  const set = new Set(haystack);
  return needles.filter((n) => set.has(n));
}

function countMatches(haystack, needles) {
  return includesAny(haystack, needles).length;
}

function formatDateCn(date) {
  return `${date.y}年${date.m}月${date.d}日`;
}

module.exports = {
  pad2,
  parseYmd,
  ymd,
  dateKey,
  addDays,
  diffDays,
  eachDay,
  dayOfYear,
  clamp,
  round,
  canonicalJson,
  sha256,
  signPayload,
  ensureDir,
  readJson,
  writeJson,
  unique,
  includesAny,
  countMatches,
  formatDateCn
};
};
__modules['lib/almanac/astro.js'] = function (module, exports, require, __filename, __dirname) {
'use strict';

const { NINE_STAR } = require('./constants');
const { dayOfYear, round, pad2 } = require('./util');

function equationOfTimeMinutes(y, m, d, hour) {
  const n = dayOfYear(y, m, d);
  const gamma = (2 * Math.PI / 365) * (n - 1 + (hour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

function trueSolarOffsetMinutes(y, m, d, hour, lng, tz) {
  const standardMeridian = tz * 15;
  const longitudeMinutes = (lng - standardMeridian) * 4;
  const eot = equationOfTimeMinutes(y, m, d, hour);
  return {
    standardMeridian,
    longitudeMinutes: round(longitudeMinutes, 2),
    equationOfTimeMinutes: round(eot, 2),
    totalMinutes: round(longitudeMinutes + eot, 2)
  };
}

function toTrueSolarTime(y, m, d, hour, minute, lng, tz) {
  const offset = trueSolarOffsetMinutes(y, m, d, hour, lng, tz);
  const base = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  base.setUTCSeconds(base.getUTCSeconds() + Math.round(offset.totalMinutes * 60));
  return {
    y: base.getUTCFullYear(),
    m: base.getUTCMonth() + 1,
    d: base.getUTCDate(),
    hour: base.getUTCHours(),
    minute: base.getUTCMinutes(),
    offset
  };
}

function nineStarTrace(lunar) {
  const table = lunar.getJieQiTable();
  const dongZhi = table['冬至'];
  const dongZhi2 = table['DONG_ZHI'];
  const xiaZhi = table['夏至'];
  if (!dongZhi || !dongZhi2 || !xiaZhi) {
    throw new Error('节气表缺少冬至/夏至，无法推导九星');
  }
  const lunarOf = (solar) => solar.getLunar();
  const jiaZiIndex = (lunarObj) => require('../lunar.js').LunarUtil.getJiaZiIndex(lunarObj.getDayInGanZhi());
  const dongZhiIndex = jiaZiIndex(lunarOf(dongZhi));
  const dongZhiIndex2 = jiaZiIndex(lunarOf(dongZhi2));
  const xiaZhiIndex = jiaZiIndex(lunarOf(xiaZhi));
  const solar = lunar.getSolar();
  const ymd = solar.toYmd();

  const shunBai = dongZhiIndex > 29 ? dongZhi.next(60 - dongZhiIndex) : dongZhi.next(-dongZhiIndex);
  const shunBai2 = dongZhiIndex2 > 29 ? dongZhi2.next(60 - dongZhiIndex2) : dongZhi2.next(-dongZhiIndex2);
  const niZi = xiaZhiIndex > 29 ? xiaZhi.next(60 - xiaZhiIndex) : xiaZhi.next(-xiaZhiIndex);
  const shunBaiYmd = shunBai.toYmd();
  const shunBaiYmd2 = shunBai2.toYmd();
  const niZiYmd = niZi.toYmd();

  let offset = 0;
  let phase = '';
  let formula = '';
  if (ymd >= shunBaiYmd && ymd < niZiYmd) {
    offset = solar.subtract(shunBai) % 9;
    phase = '冬至后顺飞';
    formula = `(${ymd} - ${shunBaiYmd}) mod 9`;
  } else if (ymd >= niZiYmd && ymd < shunBaiYmd2) {
    offset = 8 - (solar.subtract(niZi) % 9);
    phase = '夏至后逆飞';
    formula = `8 - ((${ymd} - ${niZiYmd}) mod 9)`;
  } else if (ymd >= shunBaiYmd2) {
    offset = solar.subtract(shunBai2) % 9;
    phase = '次年冬至后顺飞';
    formula = `(${ymd} - ${shunBaiYmd2}) mod 9`;
  } else {
    offset = (8 + shunBai.subtract(solar)) % 9;
    phase = '冬至前逆推';
    formula = `(8 + (${shunBaiYmd} - ${ymd})) mod 9`;
  }

  const star = NINE_STAR[offset];
  const lib = lunar.getDayNineStar();
  return {
    boundary: {
      winterSolstice: dongZhi.toYmdHms(),
      winterSolsticeNext: dongZhi2.toYmdHms(),
      summerSolstice: xiaZhi.toYmdHms(),
      shunBai: shunBaiYmd,
      niZi: niZiYmd,
      shunBaiNext: shunBaiYmd2
    },
    phase,
    formula,
    offset,
    star: {
      number: star.number,
      color: star.color,
      wuxing: star.wuxing,
      luck: star.luck,
      name: star.name,
      position: star.position,
      label: `${star.number}${star.color}${star.wuxing}`
    },
    library: {
      index: lib.getIndex(),
      label: `${lib.getNumber()}${lib.getColor()}${lib.getWuXing()}`,
      color: lib.getColor(),
      luck: lib.getLuckInXuanKong()
    },
    consistent: lib.getIndex() === offset && lib.getColor() === star.color
  };
}

function jieQiContext(lunar) {
  const table = lunar.getJieQiTable();
  const names = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'];
  const today = lunar.getSolar().toYmd();
  const list = [];
  for (const name of names) {
    const solar = table[name];
    if (!solar) continue;
    list.push({ name, ymd: solar.toYmd(), ymdHms: solar.toYmdHms() });
  }
  list.sort((a, b) => (a.ymd < b.ymd ? -1 : a.ymd > b.ymd ? 1 : 0));
  const prev = [...list].reverse().find((x) => x.ymd <= today) || null;
  const next = list.find((x) => x.ymd > today) || null;
  const tomorrow = lunar.next(1).getSolar().toYmd();
  const tomorrowJieQi = list.find((x) => x.ymd === tomorrow) || null;
  return {
    today: lunar.getJieQi() || '',
    isJieQiDay: Boolean(lunar.getJieQi()),
    prev,
    next,
    tomorrow,
    tomorrowJieQi,
    table: list
  };
}

function lunarPhase(lunar) {
  return lunar.getYueXiang();
}

function formatSolarTime(ts) {
  return `${ts.y}-${pad2(ts.m)}-${pad2(ts.d)} ${pad2(ts.hour)}:${pad2(ts.minute)}`;
}

module.exports = {
  equationOfTimeMinutes,
  trueSolarOffsetMinutes,
  toTrueSolarTime,
  nineStarTrace,
  jieQiContext,
  lunarPhase,
  formatSolarTime
};
};
__modules['lib/lunar.js'] = function (module, exports, require, __filename, __dirname) {
;(function(root,factory){
  if (typeof define==='function'&&define.amd){
    define(factory);
  }else if(typeof module!='undefined'&&module.exports){
    module.exports = factory();
  }else{
    var o = factory();
    for(var i in o){
      root[i] = o[i];
    }
  }
})(this,function(){
  var Solar = (function(){
    var _fromDate = function(date){
      return _fromYmdHms(date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds());
    };
    var _fromJulianDay = function(julianDay){
      var d = Math.floor(julianDay + 0.5);
      var f = julianDay + 0.5 - d;
      var c;

      if (d >= 2299161) {
        c = Math.floor((d - 1867216.25) / 36524.25);
        d += 1 + c - Math.floor(c / 4);
      }
      d += 1524;
      var year = Math.floor((d - 122.1) / 365.25);
      d -= Math.floor(365.25 * year);
      var month = Math.floor(d / 30.601);
      d -= Math.floor(30.601 * month);
      var day = d;
      if (month > 13) {
        month -= 13;
        year -= 4715;
      } else {
        month -= 1;
        year -= 4716;
      }
      f *= 24;
      var hour = Math.floor(f);

      f -= hour;
      f *= 60;
      var minute = Math.floor(f);

      f -= minute;
      f *= 60;
      var second = Math.round(f);
      if(second>59){
        second-=60;
        minute++;
      }
      if(minute>59){
        minute-=60;
        hour++;
      }
      if(hour>23){
        hour-=24;
        day+=1;
      }
      return _fromYmdHms(year,month,day,hour,minute,second);
    };
    var _fromYmdHms = function(y,m,d,hour,minute,second){
      var oy = y;
      var om = m;
      var od = d;
      var oh = hour;
      var oi = minute;
      var os = second;
      y *= 1;
      if(isNaN(y)){
        throw new Error('wrong solar year '+oy);
      }
      m *= 1;
      if(isNaN(m)){
        throw new Error('wrong solar month '+om);
      }
      d *= 1;
      if(isNaN(d)){
        throw new Error('wrong solar day '+od);
      }
      hour *= 1;
      if(isNaN(hour)){
        throw new Error('wrong hour '+oh);
      }
      minute *= 1;
      if(isNaN(minute)){
        throw new Error('wrong minute '+oi);
      }
      second *= 1;
      if(isNaN(second)){
        throw new Error('wrong second '+os);
      }
      if(1582===y && 10===m){
        if(d>4&&d<15){
          throw new Error('wrong solar year '+y+' month '+m+' day '+d);
        }
      }
      if(m<1||m>12){
        throw new Error('wrong month ' + m);
      }
      if(d<1||d>31){
        throw new Error('wrong day ' + d);
      }
      if(hour<0||hour>23){
        throw new Error('wrong hour '+hour);
      }
      if(minute<0||minute>59){
        throw new Error('wrong minute '+minute);
      }
      if(second<0||second>59){
        throw new Error('wrong second '+second);
      }
      return {
        _p:{
          year:y,
          month:m,
          day:d,
          hour:hour,
          minute:minute,
          second:second
        },
        subtract:function(solar){
          return SolarUtil.getDaysBetween(solar.getYear(), solar.getMonth(), solar.getDay(), this._p.year, this._p.month, this._p.day);
        },
        subtractMinute:function(solar){
          var days = this.subtract(solar);
          var cm = this._p.hour * 60 + this._p.minute;
          var sm = solar.getHour() * 60 + solar.getMinute();
          var m = cm - sm;
          if (m < 0) {
            m += 1440;
            days--;
          }
          m += days * 1440;
          return m;
        },
        isAfter: function(solar) {
          if (this._p.year > solar.getYear()) {
            return true;
          }
          if (this._p.year < solar.getYear()) {
            return false;
          }
          if (this._p.month > solar.getMonth()) {
            return true;
          }
          if (this._p.month < solar.getMonth()) {
            return false;
          }
          if (this._p.day > solar.getDay()) {
            return true;
          }
          if (this._p.day < solar.getDay()) {
            return false;
          }
          if (this._p.hour > solar.getHour()) {
            return true;
          }
          if (this._p.hour < solar.getHour()) {
            return false;
          }
          if (this._p.minute > solar.getMinute()) {
            return true;
          }
          if (this._p.minute < solar.getMinute()) {
            return false;
          }
          return this._p.second > solar.getSecond();
        },
        isBefore: function(solar) {
          if (this._p.year > solar.getYear()) {
            return false;
          }
          if (this._p.year < solar.getYear()) {
            return true;
          }
          if (this._p.month > solar.getMonth()) {
            return false;
          }
          if (this._p.month < solar.getMonth()) {
            return true;
          }
          if (this._p.day > solar.getDay()) {
            return false;
          }
          if (this._p.day < solar.getDay()) {
            return true;
          }
          if (this._p.hour > solar.getHour()) {
            return false;
          }
          if (this._p.hour < solar.getHour()) {
            return true;
          }
          if (this._p.minute > solar.getMinute()) {
            return false;
          }
          if (this._p.minute < solar.getMinute()) {
            return true;
          }
          return this._p.second < solar.getSecond();
        },
        getYear:function(){
          return this._p.year;
        },
        getMonth:function(){
          return this._p.month;
        },
        getDay:function(){
          return this._p.day;
        },
        getHour:function(){
          return this._p.hour;
        },
        getMinute:function(){
          return this._p.minute;
        },
        getSecond:function(){
          return this._p.second;
        },
        getWeek:function(){
          return (Math.floor(this.getJulianDay() + 0.5) + 7000001) % 7;
        },
        getWeekInChinese:function(){
          return SolarUtil.WEEK[this.getWeek()];
        },
        /**
         * 获取当天的阳历周
         * @param start 星期几作为一周的开始，1234560分别代表星期一至星期天
         */
        getSolarWeek:function(start){
          return SolarWeek.fromYmd(this._p.year, this._p.month, this._p.day, start);
        },
        isLeapYear:function(){
          return SolarUtil.isLeapYear(this._p.year);
        },
        getFestivals:function(){
          var l = [];
          var f = SolarUtil.FESTIVAL[this._p.month+'-'+this._p.day];
          if(f){
            l.push(f);
          }
          var weeks = Math.ceil(this._p.day/7);
          var week = this.getWeek();
          f = SolarUtil.WEEK_FESTIVAL[this._p.month+'-'+weeks+'-'+week];
          if(f){
            l.push(f);
          }
          if (this._p.day + 7 > SolarUtil.getDaysOfMonth(this._p.year, this._p.month)) {
            f = SolarUtil.WEEK_FESTIVAL[this._p.month + '-0-' + week];
            if (f) {
              l.push(f);
            }
          }
          return l;
        },
        getOtherFestivals:function(){
          var l=[];
          var fs=SolarUtil.OTHER_FESTIVAL[this._p.month+'-'+this._p.day];
          if(fs){
            l=l.concat(fs);
          }
          return l;
        },
        getXingzuo:function(){
          return this.getXingZuo();
        },
        getXingZuo:function(){
          var index = 11;
          var y = this._p.month*100+this._p.day;
          if (y >= 321 && y <= 419) {
            index = 0;
          } else if (y >= 420 && y <= 520) {
            index = 1;
          } else if (y >= 521 && y <= 621) {
            index = 2;
          } else if (y >= 622 && y <= 722) {
            index = 3;
          } else if (y >= 723 && y <= 822) {
            index = 4;
          } else if (y >= 823 && y <= 922) {
            index = 5;
          } else if (y >= 923 && y <= 1023) {
            index = 6;
          } else if (y >= 1024 && y <= 1122) {
            index = 7;
          } else if (y >= 1123 && y <= 1221) {
            index = 8;
          } else if (y >= 1222 || y <= 119) {
            index = 9;
          } else if (y <= 218) {
            index = 10;
          }
          return SolarUtil.XINGZUO[index];
        },
        toYmd:function(){
          var m = this._p.month;
          var d = this._p.day;
          var y = this._p.year + '';
          while (y.length < 4) {
            y = '0' + y;
          }
          return [y,(m<10?'0':'')+m,(d<10?'0':'')+d].join('-');
        },
        toYmdHms:function(){
          return this.toYmd()+' '+[(this._p.hour<10?'0':'')+this._p.hour,(this._p.minute<10?'0':'')+this._p.minute,(this._p.second<10?'0':'')+this._p.second].join(':');
        },
        toString:function(){
          return this.toYmd();
        },
        toFullString:function(){
          var s = this.toYmdHms();
          if(this.isLeapYear()){
            s += ' 闰年';
          }
          s += ' 星期'+this.getWeekInChinese();
          var festivals = this.getFestivals();
          for(var i=0,j=festivals.length;i<j;i++){
            s += ' ('+festivals[i]+')';
          }
          s += ' '+this.getXingZuo()+'座';
          return s;
        },
        nextYear:function(years){
          var oy = years;
          years *= 1;
          if (isNaN(years)) {
            throw new Error('wrong years ' + oy);
          }
          var y = this._p.year + years;
          var m = this._p.month;
          var d = this._p.day;
          if (1582 === y && 10 === m) {
            if (d > 4 && d < 15) {
              d += 10;
            }
          } else if (2 === m) {
            if (d > 28) {
              if (!SolarUtil.isLeapYear(y)) {
                d = 28;
              }
            }
          }
          return _fromYmdHms(y, m, d, this._p.hour, this._p.minute, this._p.second);
        },
        nextMonth:function(months){
          var om = months;
          months *= 1;
          if (isNaN(months)) {
            throw new Error('wrong months ' + om);
          }
          var month = SolarMonth.fromYm(this._p.year, this._p.month).next(months);
          var y = month.getYear();
          var m = month.getMonth();
          var d = this._p.day;
          if (1582 === y && 10 === m) {
            if (d > 4 && d < 15) {
              d += 10;
            }
          } else {
            var maxDay = SolarUtil.getDaysOfMonth(y, m);
            if (d > maxDay) {
              d = maxDay;
            }
          }
          return _fromYmdHms(y, m, d, this._p.hour, this._p.minute, this._p.second);
        },
        nextDay:function(days){
          var od = days;
          days *= 1;
          if (isNaN(days)) {
            throw new Error('wrong days ' + od);
          }
          var y = this._p.year;
          var m = this._p.month;
          var d = this._p.day;
          if (1582 === y && 10 === m) {
            if (d > 4) {
              d -= 10
            }
          }
          if (days > 0) {
            d += days;
            var daysInMonth = SolarUtil.getDaysOfMonth(y, m);
            while (d > daysInMonth) {
              d -= daysInMonth;
              m++;
              if (m > 12) {
                m = 1;
                y++;
              }
              daysInMonth = SolarUtil.getDaysOfMonth(y, m);
            }
          } else if (days < 0) {
            while (d + days <= 0) {
              m--;
              if (m < 1) {
                m = 12;
                y--;
              }
              d += SolarUtil.getDaysOfMonth(y, m);
            }
            d += days;
          }
          if (1582 === y && 10 === m) {
            if (d > 4) {
              d += 10;
            }
          }
          return _fromYmdHms(y, m, d, this._p.hour, this._p.minute, this._p.second);
        },
        nextWorkday:function(days){
          var od = days;
          days *= 1;
          if (isNaN(days)) {
            throw new Error('wrong days ' + od);
          }
          var solar = _fromYmdHms(this._p.year, this._p.month, this._p.day, this._p.hour, this._p.minute, this._p.second);
          if (days !== 0) {
            var rest = Math.abs(days);
            var add = days < 1 ? -1 : 1;
            while (rest > 0) {
              solar = solar.next(add);
              var work = true;
              var holiday = HolidayUtil.getHoliday(solar.getYear(), solar.getMonth(), solar.getDay());
              if (!holiday) {
                var week = solar.getWeek();
                if (0 === week || 6 === week) {
                  work = false;
                }
              } else {
                work = holiday.isWork();
              }
              if (work) {
                rest -= 1;
              }
            }
          }
          return solar;
        },
        next:function(days, onlyWorkday){
          if (onlyWorkday) {
            return this.nextWorkday(days);
          }
          return this.nextDay(days);
        },
        nextHour:function(hours){
          var oh = hours;
          hours *= 1;
          if (isNaN(hours)) {
            throw new Error('wrong hours ' + oh);
          }
          var h = this._p.hour + hours;
          var n = h < 0 ? -1 : 1;
          var hour = Math.abs(h);
          var days = Math.floor(hour / 24) * n;
          hour = (hour % 24) * n;
          if (hour < 0) {
            hour += 24;
            days--;
          }
          var solar = this.next(days);
          return _fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hour, solar.getMinute(), solar.getSecond());
        },
        getLunar:function(){
          return Lunar.fromSolar(this);
        },
        getJulianDay:function(){
          var y = this._p.year;
          var m = this._p.month;
          var d = this._p.day + ((this._p.second / 60 + this._p.minute) / 60 + this._p.hour) / 24;
          var n = 0;
          var g = false;
          if (y * 372 + m * 31 + Math.floor(d) >= 588829) {
            g = true;
          }
          if (m <= 2) {
            m += 12;
            y--;
          }
          if (g) {
            n = Math.floor(y / 100);
            n = 2 - n + Math.floor(n / 4);
          }
          return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + n - 1524.5;
        },
        getSalaryRate:function(){
          // 元旦节
          if (this._p.month === 1 && this._p.day === 1) {
            return 3;
          }
          // 劳动节
          if (this._p.month === 5 && this._p.day === 1) {
            return 3;
          }
          // 国庆
          if (this._p.month === 10 && this._p.day >= 1 && this._p.day <= 3) {
            return 3;
          }
          var lunar = this.getLunar();
          // 春节
          if (lunar.getMonth() === 1 && lunar.getDay() >= 1 && lunar.getDay() <= 3) {
            return 3;
          }
          // 端午
          if (lunar.getMonth() === 5 && lunar.getDay() === 5) {
            return 3;
          }
          // 中秋
          if (lunar.getMonth() === 8 && lunar.getDay() === 15) {
            return 3;
          }
          // 清明
          if ('清明' === lunar.getJieQi()) {
            return 3;
          }
          var holiday = HolidayUtil.getHoliday(this._p.year, this._p.month, this._p.day);
          if (holiday) {
            // 法定假日非上班
            if (!holiday.isWork()) {
              return 2;
            }
          } else {
            // 周末
            var week = this.getWeek();
            if (week === 6 || week === 0) {
              return 2;
            }
          }
          // 工作日
          return 1;
        }
      };
    };
    var _fromBaZi=function(yearGanZhi,monthGanZhi,dayGanZhi,timeGanZhi,sect,baseYear){
      sect *= 1;
      if(isNaN(sect)){
        sect = 2;
      }
      if (1 !== sect) {
        sect = 2;
      }
      baseYear *= 1;
      if(isNaN(baseYear)){
        baseYear = 1900;
      }
      var l = [];
      // 月地支距寅月的偏移值
      var m = LunarUtil.index(monthGanZhi.substring(1), LunarUtil.ZHI, -1) - 2;
      if (m < 0) {
        m += 12;
      }
      // 月天干要一致
      if (((LunarUtil.index(yearGanZhi.substring(0, 1), LunarUtil.GAN, -1) + 1) * 2 + m) % 10 !== LunarUtil.index(monthGanZhi.substring(0,1), LunarUtil.GAN, -1)) {
        return l;
      }
      // 1年的立春是辛酉，序号57
      var y = LunarUtil.getJiaZiIndex(yearGanZhi) - 57;
      if (y < 0) {
        y += 60;
      }
      y++;
      // 节令偏移值
      m *= 2;
      // 时辰地支转时刻，子时按零点算
      var h = LunarUtil.index(timeGanZhi.substring(1), LunarUtil.ZHI, -1) * 2;
      var hours = [h];
      if (0 === h && 2 === sect) {
        hours = [0, 23];
      }
      var startYear = baseYear - 1;

      // 结束年
      var endYear = new Date().getFullYear();

      while (y <= endYear) {
        if (y >= startYear) {
          // 立春为寅月的开始
          var jieQiLunar = Lunar.fromYmd(y, 1, 1);
          var jieQiList = jieQiLunar.getJieQiList();
          var jieQiTable = jieQiLunar.getJieQiTable();
          // 节令推移，年干支和月干支就都匹配上了
          var solarTime = jieQiTable[jieQiList[4 + m]];
          if (solarTime.getYear() >= baseYear) {
            // 日干支和节令干支的偏移值
            var d = LunarUtil.getJiaZiIndex(dayGanZhi) - LunarUtil.getJiaZiIndex(solarTime.getLunar().getDayInGanZhiExact2());
            if (d < 0) {
              d += 60;
            }
            if (d > 0) {
              // 从节令推移天数
              solarTime = solarTime.next(d);
            }
            for (var i = 0, j = hours.length; i < j; i++) {
              var hour = hours[i];
              var mi = 0;
              var s = 0;
              if (d === 0 && hour === solarTime.getHour()) {
                // 如果正好是节令当天，且小时和节令的小时数相等的极端情况，把分钟和秒钟带上
                mi = solarTime.getMinute();
                s = solarTime.getSecond();
              }
              // 验证一下
              var solar = Solar.fromYmdHms(solarTime.getYear(), solarTime.getMonth(), solarTime.getDay(), hour, mi, s);
              if (d === 30) {
                solar = solar.nextHour(-1);
              }
              var lunar = solar.getLunar();
              var dgz = (2 === sect) ? lunar.getDayInGanZhiExact2() : lunar.getDayInGanZhiExact();
              if (lunar.getYearInGanZhiExact() === yearGanZhi && lunar.getMonthInGanZhiExact() === monthGanZhi && dgz === dayGanZhi && lunar.getTimeInGanZhi() === timeGanZhi) {
                l.push(solar);
              }
            }
          }
        }
        y += 60;
      }
      return l;
    };
    return {
      J2000:2451545,
      fromYmd:function(y,m,d){return _fromYmdHms(y,m,d,0,0,0);},
      fromYmdHms:function(y,m,d,hour,minute,second){return _fromYmdHms(y,m,d,hour,minute,second);},
      fromDate:function(date){return _fromDate(date);},
      fromJulianDay:function(julianDay){return _fromJulianDay(julianDay);},
      fromBaZi:function(yearGanZhi,monthGanZhi,dayGanZhi,timeGanZhi,sect,baseYear){return _fromBaZi(yearGanZhi,monthGanZhi,dayGanZhi,timeGanZhi,sect,baseYear);}
    };
  })();
  var Lunar = (function(){
    var _computeJieQi = function(o,ly) {
      o['jieQiList'] = [];
      o['jieQi'] = {};
      var julianDays = ly.getJieQiJulianDays();
      for (var i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i++) {
        var key = LunarUtil.JIE_QI_IN_USE[i];
        o['jieQiList'].push(key);
        o['jieQi'][key] = Solar.fromJulianDay(julianDays[i]);
      }
    };
    var _computeYear = function(o,solar,year){
      //以正月初一开始
      var offset = year - 4;
      var yearGanIndex = offset % 10;
      var yearZhiIndex = offset % 12;

      if (yearGanIndex < 0) {
        yearGanIndex += 10;
      }

      if (yearZhiIndex < 0) {
        yearZhiIndex += 12;
      }

      //以立春作为新一年的开始的干支纪年
      var g = yearGanIndex;
      var z = yearZhiIndex;

      //精确的干支纪年，以立春交接时刻为准
      var gExact = yearGanIndex;
      var zExact = yearZhiIndex;

      var solarYear = solar.getYear();
      var solarYmd = solar.toYmd();
      var solarYmdHms = solar.toYmdHms();

      //获取立春的阳历时刻
      var liChun = o['jieQi'][I18n.getMessage('jq.liChun')];
      if (liChun.getYear() !== solarYear) {
        liChun = o['jieQi']['LI_CHUN'];
      }
      var liChunYmd = liChun.toYmd();
      var liChunYmdHms = liChun.toYmdHms();

      //阳历和阴历年份相同代表正月初一及以后
      if(year===solarYear){
        //立春日期判断
        if(solarYmd<liChunYmd) {
          g--;
          z--;
        }
        //立春交接时刻判断
        if(solarYmdHms<liChunYmdHms) {
          gExact--;
          zExact--;
        }
      }else if (year < solarYear){
        if(solarYmd>=liChunYmd) {
          g++;
          z++;
        }
        if(solarYmdHms>=liChunYmdHms) {
          gExact++;
          zExact++;
        }
      }

      o['yearGanIndex'] = yearGanIndex;
      o['yearZhiIndex'] = yearZhiIndex;
      o['yearGanIndexByLiChun'] = (g<0?g+10:g)%10;
      o['yearZhiIndexByLiChun'] = (z<0?z+12:z)%12;
      o['yearGanIndexExact'] = (gExact<0?gExact+10:gExact)%10;
      o['yearZhiIndexExact'] = (zExact<0?zExact+12:zExact)%12;
    };
    var _computeMonth = function(o,solar){
      var start = null;
      var i;
      var end;
      var size = LunarUtil.JIE_QI_IN_USE.length;

      //序号：大雪以前-3，大雪到小寒之间-2，小寒到立春之间-1，立春之后0
      var index = -3;
      for(i=0;i<size;i+=2){
        end = o.jieQi[LunarUtil.JIE_QI_IN_USE[i]];
        var ymd = solar.toYmd();
        var symd = null==start?ymd:start.toYmd();
        if(ymd>=symd&&ymd<end.toYmd()){
          break;
        }
        start = end;
        index++;
      }
      var offset = (((o.yearGanIndexByLiChun+(index<0?1:0)) % 5 + 1) * 2) % 10;
      o['monthGanIndex'] = ((index<0?index+10:index) + offset) % 10;
      o['monthZhiIndex'] = ((index<0?index+12:index) + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12;

      start = null;
      index = -3;
      for(i=0;i<size;i+=2){
        end = o.jieQi[LunarUtil.JIE_QI_IN_USE[i]];
        var time = solar.toYmdHms();
        var stime = null==start?time:start.toYmdHms();
        if(time>=stime&&time<end.toYmdHms()){
          break;
        }
        start = end;
        index++;
      }
      offset = (((o.yearGanIndexExact+(index<0?1:0)) % 5 + 1) * 2) % 10;
      o['monthGanIndexExact'] = ((index<0?index+10:index) + offset) % 10;
      o['monthZhiIndexExact'] = ((index<0?index+12:index) + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12;
    };
    var _computeDay = function(o,solar,hour,minute){
      var noon = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 12, 0, 0);
      var offset = Math.floor(noon.getJulianDay()) - 11;
      var dayGanIndex = offset % 10;
      var dayZhiIndex = offset % 12;

      o['dayGanIndex'] = dayGanIndex;
      o['dayZhiIndex'] = dayZhiIndex;
      var dayGanExact = dayGanIndex;
      var dayZhiExact = dayZhiIndex;
      o['dayGanIndexExact2'] = dayGanExact;
      o['dayZhiIndexExact2'] = dayZhiExact;
      var hm = (hour<10?'0':'')+hour+':'+(minute<10?'0':'')+minute;
      if(hm>='23:00'&&hm<='23:59'){
        dayGanExact++;
        if(dayGanExact>=10){
          dayGanExact -= 10;
        }
        dayZhiExact++;
        if(dayZhiExact>=12){
          dayZhiExact -= 12;
        }
      }
      o['dayGanIndexExact'] = dayGanExact;
      o['dayZhiIndexExact'] = dayZhiExact;
    };
    var _computeTime = function(o,hour,minute){
      var timeZhiIndex = LunarUtil.getTimeZhiIndex((hour<10?'0':'')+hour+':'+(minute<10?'0':'')+minute);
      o['timeZhiIndex'] = timeZhiIndex;
      o['timeGanIndex'] = (o['dayGanIndexExact']%5*2+timeZhiIndex)%10;
    };
    var _computeWeek = function(o,solar){
      o['weekIndex'] = solar.getWeek();
    };
    var _compute = function(year,hour,minute,second,solar,ly){
      var o = {};
      _computeJieQi(o, ly);
      _computeYear(o, solar, year);
      _computeMonth(o, solar);
      _computeDay(o, solar, hour, minute);
      _computeTime(o, hour, minute);
      _computeWeek(o, solar);
      return o;
    };
    var _fromSolar = function(solar){
      var lunarYear = 0;
      var lunarMonth = 0;
      var lunarDay = 0;
      var ly = LunarYear.fromYear(solar.getYear());
      var lms = ly.getMonths();
      for (var i = 0, j = lms.length; i < j; i++) {
        var m = lms[i];
        var days = solar.subtract(Solar.fromJulianDay(m.getFirstJulianDay()));
        if (days < m.getDayCount()) {
          lunarYear = m.getYear();
          lunarMonth = m.getMonth();
          lunarDay = days + 1;
          break;
        }
      }
      return _new(lunarYear, lunarMonth, lunarDay, solar.getHour(), solar.getMinute(), solar.getSecond(), solar, ly);
    };
    var _fromDate = function(date){
      return _fromSolar(Solar.fromDate(date));
    };
    var _fromYmdHms = function(lunarYear,lunarMonth,lunarDay,hour,minute,second) {
      var oy = lunarYear;
      var om = lunarMonth;
      var od = lunarDay;
      var oh = hour;
      var oi = minute;
      var os = second;
      lunarYear *= 1;
      if(isNaN(lunarYear)){
        throw new Error('wrong lunar year '+oy);
      }
      lunarMonth *= 1;
      if(isNaN(lunarMonth)){
        throw new Error('wrong lunar month '+om);
      }
      lunarDay *= 1;
      if(isNaN(lunarDay)){
        throw new Error('wrong lunar day '+od);
      }
      hour *= 1;
      if(isNaN(hour)){
        throw new Error('wrong hour '+oh);
      }
      minute *= 1;
      if(isNaN(minute)){
        throw new Error('wrong minute '+oi);
      }
      second *= 1;
      if(isNaN(second)){
        throw new Error('wrong second '+os);
      }
      if(hour<0||hour>23){
        throw new Error('wrong hour '+hour);
      }
      if(minute<0||minute>59){
        throw new Error('wrong minute '+minute);
      }
      if(second<0||second>59){
        throw new Error('wrong second '+second);
      }
      var y = LunarYear.fromYear(lunarYear);
      var m = y.getMonth(lunarMonth);
      if (null == m) {
        throw new Error('wrong lunar year '+lunarYear+' month '+lunarMonth);
      }
      if (lunarDay < 1) {
        throw new Error('lunar day must bigger than 0');
      }
      var days = m.getDayCount();
      if (lunarDay > days) {
        throw new Error('only '+days+' days in lunar year '+lunarYear+' month '+lunarMonth);
      }
      var noon = Solar.fromJulianDay(m.getFirstJulianDay() + lunarDay - 1);
      var solar = Solar.fromYmdHms(noon.getYear(), noon.getMonth(), noon.getDay(), hour, minute, second);
      if (noon.getYear() !== lunarYear) {
        y = LunarYear.fromYear(noon.getYear());
      }
      return _new(lunarYear, lunarMonth, lunarDay, hour, minute, second, solar, y);
    };
    var _new = function(year,month,day,hour,minute,second,solar,ly){
      var gz = _compute(year,hour,minute,second,solar,ly);
      return {
        _p:{
          lang: I18n.getLanguage(),
          year:year,
          month:month,
          day:day,
          hour:hour,
          minute:minute,
          second:second,
          timeGanIndex:gz.timeGanIndex,
          timeZhiIndex:gz.timeZhiIndex,
          dayGanIndex:gz.dayGanIndex,
          dayZhiIndex:gz.dayZhiIndex,
          dayGanIndexExact:gz.dayGanIndexExact,
          dayZhiIndexExact:gz.dayZhiIndexExact,
          dayGanIndexExact2:gz.dayGanIndexExact2,
          dayZhiIndexExact2:gz.dayZhiIndexExact2,
          monthGanIndex:gz.monthGanIndex,
          monthZhiIndex:gz.monthZhiIndex,
          monthGanIndexExact:gz.monthGanIndexExact,
          monthZhiIndexExact:gz.monthZhiIndexExact,
          yearGanIndex:gz.yearGanIndex,
          yearZhiIndex:gz.yearZhiIndex,
          yearGanIndexByLiChun:gz.yearGanIndexByLiChun,
          yearZhiIndexByLiChun:gz.yearZhiIndexByLiChun,
          yearGanIndexExact:gz.yearGanIndexExact,
          yearZhiIndexExact:gz.yearZhiIndexExact,
          weekIndex:gz.weekIndex,
          jieQi:gz.jieQi,
          jieQiList:gz.jieQiList,
          solar:solar,
          eightChar:null
        },
        getYear:function(){return this._p.year;},
        getMonth:function(){return this._p.month;},
        getDay:function(){return this._p.day;},
        getHour:function(){return this._p.hour;},
        getMinute:function(){return this._p.minute;},
        getSecond:function(){return this._p.second;},
        getTimeGanIndex:function(){return this._p.timeGanIndex;},
        getTimeZhiIndex:function(){return this._p.timeZhiIndex;},
        getDayGanIndex:function(){return this._p.dayGanIndex;},
        getDayGanIndexExact:function(){return this._p.dayGanIndexExact;},
        getDayGanIndexExact2:function(){return this._p.dayGanIndexExact2;},
        getDayZhiIndex:function(){return this._p.dayZhiIndex;},
        getDayZhiIndexExact:function(){return this._p.dayZhiIndexExact;},
        getDayZhiIndexExact2:function(){return this._p.dayZhiIndexExact2;},
        getMonthGanIndex:function(){return this._p.monthGanIndex;},
        getMonthGanIndexExact:function(){return this._p.monthGanIndexExact;},
        getMonthZhiIndex:function(){return this._p.monthZhiIndex;},
        getMonthZhiIndexExact:function(){return this._p.monthZhiIndexExact;},
        getYearGanIndex:function(){return this._p.yearGanIndex;},
        getYearGanIndexByLiChun:function(){return this._p.yearGanIndexByLiChun;},
        getYearGanIndexExact:function(){return this._p.yearGanIndexExact;},
        getYearZhiIndex:function(){return this._p.yearZhiIndex;},
        getYearZhiIndexByLiChun:function(){return this._p.yearZhiIndexByLiChun;},
        getYearZhiIndexExact:function(){return this._p.yearZhiIndexExact;},
        getGan:function(){return this.getYearGan();},
        getZhi:function(){return this.getYearZhi();},
        getYearGan:function(){return LunarUtil.GAN[this._p.yearGanIndex+1];},
        getYearGanByLiChun:function(){return LunarUtil.GAN[this._p.yearGanIndexByLiChun+1];},
        getYearGanExact:function(){return LunarUtil.GAN[this._p.yearGanIndexExact+1];},
        getYearZhi:function(){return LunarUtil.ZHI[this._p.yearZhiIndex+1];},
        getYearZhiByLiChun:function(){return LunarUtil.ZHI[this._p.yearZhiIndexByLiChun+1];},
        getYearZhiExact:function(){return LunarUtil.ZHI[this._p.yearZhiIndexExact+1];},
        getYearInGanZhi:function(){return this.getYearGan()+this.getYearZhi();},
        getYearInGanZhiByLiChun:function(){return this.getYearGanByLiChun()+this.getYearZhiByLiChun();},
        getYearInGanZhiExact:function(){return this.getYearGanExact()+this.getYearZhiExact();},
        getMonthGan:function(){return LunarUtil.GAN[this._p.monthGanIndex+1];},
        getMonthGanExact:function(){return LunarUtil.GAN[this._p.monthGanIndexExact+1];},
        getMonthZhi:function(){return LunarUtil.ZHI[this._p.monthZhiIndex+1];},
        getMonthZhiExact:function(){return LunarUtil.ZHI[this._p.monthZhiIndexExact+1];},
        getMonthInGanZhi:function(){return this.getMonthGan()+this.getMonthZhi();},
        getMonthInGanZhiExact:function(){return this.getMonthGanExact()+this.getMonthZhiExact();},
        getDayGan:function(){return LunarUtil.GAN[this._p.dayGanIndex+1];},
        getDayGanExact:function(){return LunarUtil.GAN[this._p.dayGanIndexExact+1];},
        getDayGanExact2:function(){return LunarUtil.GAN[this._p.dayGanIndexExact2+1];},
        getDayZhi:function(){return LunarUtil.ZHI[this._p.dayZhiIndex+1];},
        getDayZhiExact:function(){return LunarUtil.ZHI[this._p.dayZhiIndexExact+1];},
        getDayZhiExact2:function(){return LunarUtil.ZHI[this._p.dayZhiIndexExact2+1];},
        getDayInGanZhi:function(){return this.getDayGan()+this.getDayZhi();},
        getDayInGanZhiExact:function(){return this.getDayGanExact()+this.getDayZhiExact();},
        getDayInGanZhiExact2:function(){return this.getDayGanExact2()+this.getDayZhiExact2();},
        getTimeGan:function(){return LunarUtil.GAN[this._p.timeGanIndex+1];},
        getTimeZhi:function(){return LunarUtil.ZHI[this._p.timeZhiIndex+1];},
        getTimeInGanZhi:function(){return this.getTimeGan()+this.getTimeZhi();},
        getShengxiao:function(){return this.getYearShengXiao();},
        getYearShengXiao:function(){return LunarUtil.SHENGXIAO[this._p.yearZhiIndex+1];},
        getYearShengXiaoByLiChun:function(){return LunarUtil.SHENGXIAO[this._p.yearZhiIndexByLiChun+1];},
        getYearShengXiaoExact:function(){return LunarUtil.SHENGXIAO[this._p.yearZhiIndexExact+1];},
        getMonthShengXiao:function(){return LunarUtil.SHENGXIAO[this._p.monthZhiIndex+1];},
        getMonthShengXiaoExact:function(){return LunarUtil.SHENGXIAO[this._p.monthZhiIndexExact+1];},
        getDayShengXiao:function(){return LunarUtil.SHENGXIAO[this._p.dayZhiIndex+1];},
        getTimeShengXiao:function(){return LunarUtil.SHENGXIAO[this._p.timeZhiIndex+1];},
        getYearInChinese:function(){
          var y = this._p.year+'';
          var s = '';
          var zero = '0'.charCodeAt(0);
          for(var i=0,j=y.length;i<j;i++){
            s+=LunarUtil.NUMBER[y.charCodeAt(i)-zero];
          }
          return s;
        },
        getMonthInChinese:function(){
          var month = this._p.month;
          return (month<0?'闰':'')+LunarUtil.MONTH[Math.abs(month)];
        },
        getDayInChinese:function(){
          return LunarUtil.DAY[this._p.day];
        },
        getPengZuGan:function(){
          return LunarUtil.PENGZU_GAN[this._p.dayGanIndex+1];
        },
        getPengZuZhi:function(){
          return LunarUtil.PENGZU_ZHI[this._p.dayZhiIndex+1];
        },
        getPositionXi:function(){
          return this.getDayPositionXi();
        },
        getPositionXiDesc:function(){
          return this.getDayPositionXiDesc();
        },
        getPositionYangGui:function(){
          return this.getDayPositionYangGui();
        },
        getPositionYangGuiDesc:function(){
          return this.getDayPositionYangGuiDesc();
        },
        getPositionYinGui:function(){
          return this.getDayPositionYinGui();
        },
        getPositionYinGuiDesc:function(){
          return this.getDayPositionYinGuiDesc();
        },
        getPositionFu:function(){
          return this.getDayPositionFu();
        },
        getPositionFuDesc:function(){
          return this.getDayPositionFuDesc();
        },
        getPositionCai:function(){
          return this.getDayPositionCai();
        },
        getPositionCaiDesc:function(){
          return this.getDayPositionCaiDesc();
        },
        getDayPositionXi:function(){
          return LunarUtil.POSITION_XI[this._p.dayGanIndex+1];
        },
        getDayPositionXiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getDayPositionXi()];
        },
        getDayPositionYangGui:function(){
          return LunarUtil.POSITION_YANG_GUI[this._p.dayGanIndex+1];
        },
        getDayPositionYangGuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getDayPositionYangGui()];
        },
        getDayPositionYinGui:function(){
          return LunarUtil.POSITION_YIN_GUI[this._p.dayGanIndex+1];
        },
        getDayPositionYinGuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getDayPositionYinGui()];
        },
        getDayPositionFu:function(sect){
          return (1===sect?LunarUtil.POSITION_FU:LunarUtil.POSITION_FU_2)[this._p.dayGanIndex+1];
        },
        getDayPositionFuDesc:function(sect){
          return LunarUtil.POSITION_DESC[this.getDayPositionFu(sect)];
        },
        getDayPositionCai:function(){
          return LunarUtil.POSITION_CAI[this._p.dayGanIndex+1];
        },
        getDayPositionCaiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getDayPositionCai()];
        },
        getTimePositionXi:function(){
          return LunarUtil.POSITION_XI[this._p.timeGanIndex+1];
        },
        getTimePositionXiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getTimePositionXi()];
        },
        getTimePositionYangGui:function(){
          return LunarUtil.POSITION_YANG_GUI[this._p.timeGanIndex+1];
        },
        getTimePositionYangGuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getTimePositionYangGui()];
        },
        getTimePositionYinGui:function(){
          return LunarUtil.POSITION_YIN_GUI[this._p.timeGanIndex+1];
        },
        getTimePositionYinGuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getTimePositionYinGui()];
        },
        getTimePositionFu:function(sect){
          return (1===sect?LunarUtil.POSITION_FU:LunarUtil.POSITION_FU_2)[this._p.timeGanIndex+1];
        },
        getTimePositionFuDesc:function(sect){
          return LunarUtil.POSITION_DESC[this.getTimePositionFu(sect)];
        },
        getTimePositionCai:function(){
          return LunarUtil.POSITION_CAI[this._p.timeGanIndex+1];
        },
        getTimePositionCaiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getTimePositionCai()];
        },
        getDayPositionTaiSui:function(sect){
          var dayInGanZhi;
          var yearZhiIndex;
          switch (sect) {
            case 1:
              dayInGanZhi = this.getDayInGanZhi();
              yearZhiIndex = this._p.yearZhiIndex;
              break;
            case 3:
              dayInGanZhi = this.getDayInGanZhi();
              yearZhiIndex = this._p.yearZhiIndexExact;
              break;
            default:
              dayInGanZhi = this.getDayInGanZhiExact2();
              yearZhiIndex = this._p.yearZhiIndexByLiChun;
          }
          var p;
          if ([I18n.getMessage('jz.jiaZi'), I18n.getMessage('jz.yiChou'), I18n.getMessage('jz.bingYin'), I18n.getMessage('jz.dingMao'), I18n.getMessage('jz.wuChen'), I18n.getMessage('jz.jiSi')].join(',').indexOf(dayInGanZhi) > -1) {
            p = I18n.getMessage('bg.zhen');
          } else if ([I18n.getMessage('jz.bingZi'), I18n.getMessage('jz.dingChou'), I18n.getMessage('jz.wuYin'), I18n.getMessage('jz.jiMao'), I18n.getMessage('jz.gengChen'), I18n.getMessage('jz.xinSi')].join(',').indexOf(dayInGanZhi) > -1) {
            p = I18n.getMessage('bg.li');
          } else if ([I18n.getMessage('jz.wuZi'), I18n.getMessage('jz.jiChou'), I18n.getMessage('jz.gengYin'), I18n.getMessage('jz.xinMao'), I18n.getMessage('jz.renChen'), I18n.getMessage('jz.guiSi')].join(',').indexOf(dayInGanZhi) > -1) {
            p = I18n.getMessage('ps.center');
          } else if ([I18n.getMessage('jz.gengZi'), I18n.getMessage('jz.xinChou'), I18n.getMessage('jz.renYin'), I18n.getMessage('jz.guiMao'), I18n.getMessage('jz.jiaChen'), I18n.getMessage('jz.yiSi')].join(',').indexOf(dayInGanZhi) > -1) {
            p = I18n.getMessage('bg.dui');
          } else if ([I18n.getMessage('jz.renZi'), I18n.getMessage('jz.guiChou'), I18n.getMessage('jz.jiaYin'), I18n.getMessage('jz.yiMao'), I18n.getMessage('jz.bingChen'), I18n.getMessage('jz.dingSi')].join(',').indexOf(dayInGanZhi) > -1) {
            p = I18n.getMessage('bg.kan');
          } else {
            p = LunarUtil.POSITION_TAI_SUI_YEAR[yearZhiIndex];
          }
          return p;
        },
        getDayPositionTaiSuiDesc:function(sect){
          return LunarUtil.POSITION_DESC[this.getDayPositionTaiSui(sect)];
        },
        getMonthPositionTaiSui:function(sect){
          var monthZhiIndex;
          var monthGanIndex;
          switch (sect) {
            case 3:
              monthZhiIndex = this._p.monthZhiIndexExact;
              monthGanIndex = this._p.monthGanIndexExact;
              break;
            default:
              monthZhiIndex = this._p.monthZhiIndex;
              monthGanIndex = this._p.monthGanIndex;
          }
          var m = monthZhiIndex - LunarUtil.BASE_MONTH_ZHI_INDEX;
          if (m < 0) {
            m += 12;
          }
          return [I18n.getMessage('bg.gen'), LunarUtil.POSITION_GAN[monthGanIndex], I18n.getMessage('bg.kun'), I18n.getMessage('bg.xun')][m % 4]
        },
        getMonthPositionTaiSuiDesc:function(sect){
          return LunarUtil.POSITION_DESC[this.getMonthPositionTaiSui(sect)];
        },
        getYearPositionTaiSui:function(sect){
          var yearZhiIndex;
          switch (sect) {
            case 1:
              yearZhiIndex = this._p.yearZhiIndex;
              break;
            case 3:
              yearZhiIndex = this._p.yearZhiIndexExact;
              break;
            default:
              yearZhiIndex = this._p.yearZhiIndexByLiChun;
          }
          return LunarUtil.POSITION_TAI_SUI_YEAR[yearZhiIndex];
        },
        getYearPositionTaiSuiDesc:function(sect){
          return LunarUtil.POSITION_DESC[this.getYearPositionTaiSui(sect)];
        },
        _checkLang:function(){
          var lang = I18n.getLanguage();
          if (this._p.lang !== lang) {
            for (var i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i++) {
              var newKey = LunarUtil.JIE_QI_IN_USE[i];
              var oldKey = this._p.jieQiList[i];
              var value = this._p.jieQi[oldKey];
              this._p.jieQiList[i] = newKey;
              this._p.jieQi[newKey] = value;
            }
            this._p.lang = lang;
          }
        },
        _getJieQiSolar:function(name){
          this._checkLang();
          return this._p.jieQi[name];
        },
        getChong:function(){
          return this.getDayChong();
        },
        getChongGan:function(){
          return this.getDayChongGan();
        },
        getChongGanTie:function(){
          return this.getDayChongGanTie();
        },
        getChongShengXiao:function(){
          return this.getDayChongShengXiao();
        },
        getChongDesc:function(){
          return this.getDayChongDesc();
        },
        getSha:function(){
          return this.getDaySha();
        },
        getDayChong:function(){
          return LunarUtil.CHONG[this._p.dayZhiIndex];
        },
        getDayChongGan:function(){
          return LunarUtil.CHONG_GAN[this._p.dayGanIndex];
        },
        getDayChongGanTie:function(){
          return LunarUtil.CHONG_GAN_TIE[this._p.dayGanIndex];
        },
        getDayChongShengXiao:function(){
          var chong = this.getChong();
          for(var i=0,j=LunarUtil.ZHI.length;i<j;i++){
            if(LunarUtil.ZHI[i]===chong){
              return LunarUtil.SHENGXIAO[i];
            }
          }
          return '';
        },
        getDayChongDesc:function(){
          return '('+this.getDayChongGan()+this.getDayChong()+')'+this.getDayChongShengXiao();
        },
        getDaySha:function(){
          return LunarUtil.SHA[this.getDayZhi()];
        },
        getTimeChong:function(){
          return LunarUtil.CHONG[this._p.timeZhiIndex];
        },
        getTimeChongGan:function(){
          return LunarUtil.CHONG_GAN[this._p.timeGanIndex];
        },
        getTimeChongGanTie:function(){
          return LunarUtil.CHONG_GAN_TIE[this._p.timeGanIndex];
        },
        getTimeChongShengXiao:function(){
          var chong = this.getTimeChong();
          for(var i=0,j=LunarUtil.ZHI.length;i<j;i++){
            if(LunarUtil.ZHI[i]===chong){
              return LunarUtil.SHENGXIAO[i];
            }
          }
          return '';
        },
        getTimeChongDesc:function(){
          return '('+this.getTimeChongGan()+this.getTimeChong()+')'+this.getTimeChongShengXiao();
        },
        getTimeSha:function(){
          return LunarUtil.SHA[this.getTimeZhi()];
        },
        getYearNaYin:function(){
          return LunarUtil.NAYIN[this.getYearInGanZhi()];
        },
        getMonthNaYin:function(){
          return LunarUtil.NAYIN[this.getMonthInGanZhi()];
        },
        getDayNaYin:function(){
          return LunarUtil.NAYIN[this.getDayInGanZhi()];
        },
        getTimeNaYin:function(){
          return LunarUtil.NAYIN[this.getTimeInGanZhi()];
        },
        getSeason:function(){
          return LunarUtil.SEASON[Math.abs(this._p.month)];
        },
        _convertJieQi:function(name){
          var jq = name;
          if ('DONG_ZHI' === jq) {
            jq = I18n.getMessage('jq.dongZhi');
          } else if ('DA_HAN' === jq) {
            jq = I18n.getMessage('jq.daHan');
          } else if ('XIAO_HAN' === jq) {
            jq = I18n.getMessage('jq.xiaoHan');
          } else if ('LI_CHUN' === jq) {
            jq = I18n.getMessage('jq.liChun');
          } else if ('DA_XUE' === jq) {
            jq = I18n.getMessage('jq.daXue');
          } else if ('YU_SHUI' === jq) {
            jq = I18n.getMessage('jq.yuShui');
          } else if ('JING_ZHE' === jq) {
            jq = I18n.getMessage('jq.jingZhe');
          }
          return jq;
        },
        getJie:function(){
          for(var i=0, j=LunarUtil.JIE_QI_IN_USE.length; i<j; i+=2){
            var key = LunarUtil.JIE_QI_IN_USE[i];
            var d = this._getJieQiSolar(key);
            if(d.getYear() === this._p.solar.getYear() && d.getMonth() === this._p.solar.getMonth() && d.getDay() === this._p.solar.getDay()){
              return this._convertJieQi(key);
            }
          }
          return '';
        },
        getQi:function(){
          for(var i=1, j=LunarUtil.JIE_QI_IN_USE.length; i<j; i+=2){
            var key = LunarUtil.JIE_QI_IN_USE[i];
            var d = this._getJieQiSolar(key);
            if(d.getYear() === this._p.solar.getYear() && d.getMonth() === this._p.solar.getMonth() && d.getDay() === this._p.solar.getDay()){
              return this._convertJieQi(key);
            }
          }
          return '';
        },
        getJieQi:function(){
          for(var key in this._p.jieQi){
            var d = this._getJieQiSolar(key);
            if(d.getYear() === this._p.solar.getYear() && d.getMonth() === this._p.solar.getMonth() && d.getDay() === this._p.solar.getDay()){
              return this._convertJieQi(key);
            }
          }
          return '';
        },
        getWeek:function(){
          return this._p.weekIndex;
        },
        getWeekInChinese:function(){
          return SolarUtil.WEEK[this.getWeek()];
        },
        getXiu:function(){
          return LunarUtil.XIU[this.getDayZhi()+this.getWeek()];
        },
        getXiuLuck:function(){
          return LunarUtil.XIU_LUCK[this.getXiu()];
        },
        getXiuSong:function(){
          return LunarUtil.XIU_SONG[this.getXiu()];
        },
        getZheng:function(){
          return LunarUtil.ZHENG[this.getXiu()];
        },
        getAnimal:function(){
          return LunarUtil.ANIMAL[this.getXiu()];
        },
        getGong:function(){
          return LunarUtil.GONG[this.getXiu()];
        },
        getShou:function(){
          return LunarUtil.SHOU[this.getGong()];
        },
        getFestivals:function(){
          var l = [];
          var f = LunarUtil.FESTIVAL[this._p.month+'-'+this._p.day];
          if(f){
            l.push(f);
          }
          if (Math.abs(this._p.month) === 12 && this._p.day >= 29 && this._p.year !== this.next(1).getYear()) {
            l.push(I18n.getMessage('jr.chuXi'));
          }
          return l;
        },
        getOtherFestivals:function(){
          var l=[];
          var fs=LunarUtil.OTHER_FESTIVAL[this._p.month+'-'+this._p.day];
          if(fs){
            l=l.concat(fs);
          }
          var solarYmd = this._p.solar.toYmd();
          if(this._p.solar.toYmd() === this._getJieQiSolar(I18n.getMessage('jq.qingMing')).next(-1).toYmd()){
            l.push('寒食节');
          }

          var jq = this._getJieQiSolar(I18n.getMessage('jq.liChun'));
          var offset = 4 - jq.getLunar().getDayGanIndex();
          if (offset < 0) {
            offset += 10;
          }
          if (solarYmd === jq.next(offset + 40).toYmd()) {
            l.push('春社');
          }

          jq = this._getJieQiSolar(I18n.getMessage('jq.liQiu'));
          offset = 4 - jq.getLunar().getDayGanIndex();
          if (offset < 0) {
            offset += 10;
          }
          if (solarYmd === jq.next(offset + 40).toYmd()) {
            l.push('秋社');
          }
          return l;
        },
        getBaZi:function(){
          var bz = this.getEightChar();
          var l = [];
          l.push(bz.getYear());
          l.push(bz.getMonth());
          l.push(bz.getDay());
          l.push(bz.getTime());
          return l;
        },
        getBaZiWuXing:function(){
          var bz = this.getEightChar();
          var l = [];
          l.push(bz.getYearWuXing());
          l.push(bz.getMonthWuXing());
          l.push(bz.getDayWuXing());
          l.push(bz.getTimeWuXing());
          return l;
        },
        getBaZiNaYin:function(){
          var bz = this.getEightChar();
          var l = [];
          l.push(bz.getYearNaYin());
          l.push(bz.getMonthNaYin());
          l.push(bz.getDayNaYin());
          l.push(bz.getTimeNaYin());
          return l;
        },
        getBaZiShiShenGan:function(){
          var bz = this.getEightChar();
          var l = [];
          l.push(bz.getYearShiShenGan());
          l.push(bz.getMonthShiShenGan());
          l.push(bz.getDayShiShenGan());
          l.push(bz.getTimeShiShenGan());
          return l;
        },
        getBaZiShiShenZhi:function(){
          var bz = this.getEightChar();
          var l = [];
          l.push(bz.getYearShiShenZhi()[0]);
          l.push(bz.getMonthShiShenZhi()[0]);
          l.push(bz.getDayShiShenZhi()[0]);
          l.push(bz.getTimeShiShenZhi()[0]);
          return l;
        },
        getBaZiShiShenYearZhi:function(){
          return this.getEightChar().getYearShiShenZhi();
        },
        getBaZiShiShenMonthZhi:function(){
          return this.getEightChar().getMonthShiShenZhi();
        },
        getBaZiShiShenDayZhi:function(){
          return this.getEightChar().getDayShiShenZhi();
        },
        getBaZiShiShenTimeZhi:function(){
          return this.getEightChar().getTimeShiShenZhi();
        },
        getZhiXing:function(){
          var offset = this._p.dayZhiIndex-this._p.monthZhiIndex;
          if(offset<0){
            offset += 12;
          }
          return LunarUtil.ZHI_XING[offset+1];
        },
        getDayTianShen:function(){
          var monthZhi = this.getMonthZhi();
          var offset = LunarUtil.ZHI_TIAN_SHEN_OFFSET[monthZhi];
          return LunarUtil.TIAN_SHEN[(this._p.dayZhiIndex+offset)%12+1];
        },
        getTimeTianShen:function(){
          var dayZhi = this.getDayZhiExact();
          var offset = LunarUtil.ZHI_TIAN_SHEN_OFFSET[dayZhi];
          return LunarUtil.TIAN_SHEN[(this._p.timeZhiIndex+offset)%12+1];
        },
        getDayTianShenType:function(){
          return LunarUtil.TIAN_SHEN_TYPE[this.getDayTianShen()];
        },
        getTimeTianShenType:function(){
          return LunarUtil.TIAN_SHEN_TYPE[this.getTimeTianShen()];
        },
        getDayTianShenLuck:function(){
          return LunarUtil.TIAN_SHEN_TYPE_LUCK[this.getDayTianShenType()];
        },
        getTimeTianShenLuck:function(){
          return LunarUtil.TIAN_SHEN_TYPE_LUCK[this.getTimeTianShenType()];
        },
        getDayPositionTai:function(){
          return LunarUtil.POSITION_TAI_DAY[LunarUtil.getJiaZiIndex(this.getDayInGanZhi())];
        },
        getMonthPositionTai:function(){
          var m = this._p.month;
          if(m<0){
            return '';
          }
          return LunarUtil.POSITION_TAI_MONTH[m-1];
        },
        getDayYi:function(sect){
          sect *= 1;
          if(isNaN(sect)){
            sect = 1;
          }
          return LunarUtil.getDayYi(2 === sect ? this.getMonthInGanZhiExact() : this.getMonthInGanZhi(), this.getDayInGanZhi());
        },
        getDayJi:function(sect){
          sect *= 1;
          if(isNaN(sect)){
            sect = 1;
          }
          return LunarUtil.getDayJi(2 === sect ? this.getMonthInGanZhiExact() : this.getMonthInGanZhi(), this.getDayInGanZhi());
        },
        getDayJiShen:function(){
          return LunarUtil.getDayJiShen(this.getMonthZhiIndex(), this.getDayInGanZhi());
        },
        getDayXiongSha:function(){
          return LunarUtil.getDayXiongSha(this.getMonthZhiIndex(), this.getDayInGanZhi());
        },
        getTimeYi:function(){
          return LunarUtil.getTimeYi(this.getDayInGanZhiExact(), this.getTimeInGanZhi());
        },
        getTimeJi:function(){
          return LunarUtil.getTimeJi(this.getDayInGanZhiExact(), this.getTimeInGanZhi());
        },
        getYueXiang:function(){
          return LunarUtil.YUE_XIANG[this._p.day];
        },
        _getYearNineStar:function(yearInGanZhi){
          var indexExact = LunarUtil.getJiaZiIndex(yearInGanZhi) + 1;
          var index = LunarUtil.getJiaZiIndex(this.getYearInGanZhi()) + 1;
          var yearOffset = indexExact - index;
          if (yearOffset > 1) {
            yearOffset -= 60;
          } else if (yearOffset < -1) {
            yearOffset += 60;
          }
          var yuan = Math.floor((this._p.year + yearOffset + 2696) / 60) % 3;
          var offset = (62 + yuan * 3 - indexExact) % 9;
          if(0 === offset){
            offset = 9;
          }
          return NineStar.fromIndex(offset - 1);
        },
        getYearNineStar:function(sect){
          var yearInGanZhi;
          switch (sect) {
            case 1:
              yearInGanZhi = this.getYearInGanZhi();
              break;
            case 3:
              yearInGanZhi = this.getYearInGanZhiExact();
              break;
            default:
              yearInGanZhi = this.getYearInGanZhiByLiChun();
          }
          return this._getYearNineStar(yearInGanZhi);
        },
        getMonthNineStar:function(sect){
          var yearZhiIndex;
          var monthZhiIndex;
          switch (sect) {
            case 1:
              yearZhiIndex = this._p.yearZhiIndex;
              monthZhiIndex = this._p.monthZhiIndex;
              break;
            case 3:
              yearZhiIndex = this._p.yearZhiIndexExact;
              monthZhiIndex = this._p.monthZhiIndexExact;
              break;
            default:
              yearZhiIndex = this._p.yearZhiIndexByLiChun;
              monthZhiIndex = this._p.monthZhiIndex;
          }
          var n = 27 - (yearZhiIndex % 3 * 3);
          if (monthZhiIndex < LunarUtil.BASE_MONTH_ZHI_INDEX) {
            n -= 3;
          }
          return NineStar.fromIndex((n - monthZhiIndex) % 9);
        },
        getDayNineStar:function(){
          var solarYmd = this._p.solar.toYmd();
          var dongZhi = this._getJieQiSolar(I18n.getMessage('jq.dongZhi'));
          var dongZhi2 = this._getJieQiSolar('DONG_ZHI');
          var xiaZhi = this._getJieQiSolar(I18n.getMessage('jq.xiaZhi'));
          var dongZhiIndex = LunarUtil.getJiaZiIndex(dongZhi.getLunar().getDayInGanZhi());
          var dongZhiIndex2 = LunarUtil.getJiaZiIndex(dongZhi2.getLunar().getDayInGanZhi());
          var xiaZhiIndex = LunarUtil.getJiaZiIndex(xiaZhi.getLunar().getDayInGanZhi());
          var solarShunBai;
          var solarShunBai2;
          var solarNiZi;
          if (dongZhiIndex>29) {
            solarShunBai = dongZhi.next(60 - dongZhiIndex);
          } else {
            solarShunBai = dongZhi.next(-dongZhiIndex);
          }
          var solarShunBaiYmd = solarShunBai.toYmd();
          if (dongZhiIndex2>29) {
            solarShunBai2 = dongZhi2.next(60 - dongZhiIndex2);
          } else {
            solarShunBai2 = dongZhi2.next(-dongZhiIndex2);
          }
          var solarShunBaiYmd2 = solarShunBai2.toYmd();
          if (xiaZhiIndex>29) {
            solarNiZi = xiaZhi.next(60 - xiaZhiIndex);
          } else {
            solarNiZi = xiaZhi.next(-xiaZhiIndex);
          }
          var solarNiZiYmd = solarNiZi.toYmd();
          var offset = 0;
          if (solarYmd >= solarShunBaiYmd && solarYmd < solarNiZiYmd) {
            offset = this._p.solar.subtract(solarShunBai) % 9;
          } else if (solarYmd >= solarNiZiYmd && solarYmd < solarShunBaiYmd2){
            offset = 8 - (this._p.solar.subtract(solarNiZi) % 9);
          } else if (solarYmd >= solarShunBaiYmd2) {
            offset = this._p.solar.subtract(solarShunBai2) % 9;
          } else if (solarYmd < solarShunBaiYmd) {
            offset = (8 + solarShunBai.subtract(this._p.solar)) % 9;
          }
          return NineStar.fromIndex(offset);
        },
        getTimeNineStar:function(){
          var solarYmd = this._p.solar.toYmd();
          var asc = false;
          if((solarYmd >= this._getJieQiSolar(I18n.getMessage('jq.dongZhi')).toYmd() && solarYmd < this._getJieQiSolar(I18n.getMessage('jq.xiaZhi')).toYmd()) || solarYmd >= this._getJieQiSolar('DONG_ZHI').toYmd()){
            asc = true;
          }
          var offset = asc ? [0, 3, 6] : [8, 5, 2];
          var start = offset[this.getDayZhiIndex() % 3];
          var timeZhiIndex = this.getTimeZhiIndex();
          var index = asc ? (start + timeZhiIndex) : (start + 9 - timeZhiIndex);
          return NineStar.fromIndex(index % 9);
        },
        getSolar:function(){
          return this._p.solar;
        },
        getJieQiTable:function(){
          this._checkLang();
          return this._p.jieQi;
        },
        getJieQiList:function(){
          return this._p.jieQiList;
        },
        getNextJie:function(wholeDay){
          var conditions = [];
          for(var i=0,j=LunarUtil.JIE_QI_IN_USE.length/2;i<j;i++){
            conditions.push(LunarUtil.JIE_QI_IN_USE[i*2]);
          }
          return this._getNearJieQi(true, conditions, wholeDay);
        },
        getPrevJie:function(wholeDay) {
          var conditions = [];
          for (var i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
            conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2]);
          }
          return this._getNearJieQi(false, conditions, wholeDay);
        },
        getNextQi:function(wholeDay) {
          var conditions = [];
          for (var i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
            conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2 + 1]);
          }
          return this._getNearJieQi(true, conditions, wholeDay);
        },
        getPrevQi:function(wholeDay) {
          var conditions = [];
          for (var i = 0, j = LunarUtil.JIE_QI_IN_USE.length / 2; i < j; i++) {
            conditions.push(LunarUtil.JIE_QI_IN_USE[i * 2 + 1]);
          }
          return this._getNearJieQi(false, conditions, wholeDay);
        },
        getNextJieQi:function(wholeDay){return this._getNearJieQi(true, null, wholeDay);},
        getPrevJieQi:function(wholeDay){return this._getNearJieQi(false, null, wholeDay);},
        _buildJieQi:function(name, solar){
          var jie=false;
          var qi=false;
          for(var i=0,j=LunarUtil.JIE_QI.length;i<j;i++){
            if(LunarUtil.JIE_QI[i]===name){
              if(i%2===0){
                qi = true;
              }else{
                jie = true;
              }
              break;
            }
          }
          return {
            _p: {
              name: name,
              solar: solar,
              jie: jie,
              qi: qi
            },
            getName: function(){return this._p.name;},
            getSolar: function(){return this._p.solar;},
            setName: function(name){this._p.name=name;},
            setSolar: function(solar){this._p.solar=solar;},
            isJie: function(){return this._p.jie;},
            isQi: function(){return this._p.qi;},
            toString: function(){return this.getName();}
          };
        },
        _getNearJieQi:function(forward, conditions, wholeDay){
          var name = null;
          var near = null;
          var filters = {};
          var filter = false;
          if(null!=conditions){
            for(var i=0,j=conditions.length;i<j;i++){
              filters[conditions[i]] = true;
              filter = true;
            }
          }
          var today = this._p.solar[wholeDay ? 'toYmd' : 'toYmdHms']();
          for(var key in this._p.jieQi){
            var jq = this._convertJieQi(key);
            if(filter){
              if(!filters[jq]){
                continue;
              }
            }
            var solar = this._getJieQiSolar(key);
            var day = solar[wholeDay ? 'toYmd' : 'toYmdHms']();
            if(forward){
              if(day<=today){
                continue;
              }
              if(null == near || day < near[wholeDay ? 'toYmd' : 'toYmdHms']()){
                name = jq;
                near = solar;
              }
            }else{
              if(day>today){
                continue;
              }
              if(null == near || day > near[wholeDay ? 'toYmd' : 'toYmdHms']()) {
                name = jq;
                near = solar;
              }
            }
          }
          if(null==near){
            return null;
          }
          return this._buildJieQi(name, near);
        },
        getCurrentJieQi:function(){
          for(var key in this._p.jieQi){
            var d = this._getJieQiSolar(key);
            if(d.getYear() === this._p.solar.getYear() && d.getMonth() === this._p.solar.getMonth() && d.getDay() === this._p.solar.getDay()){
              return this._buildJieQi(this._convertJieQi(key), d);
            }
          }
          return null;
        },
        getCurrentJie:function(){
          for(var i=0, j=LunarUtil.JIE_QI_IN_USE.length; i<j; i+=2){
            var key = LunarUtil.JIE_QI_IN_USE[i];
            var d = this._getJieQiSolar(key);
            if(d.getYear() === this._p.solar.getYear() && d.getMonth() === this._p.solar.getMonth() && d.getDay() === this._p.solar.getDay()){
              return this._buildJieQi(this._convertJieQi(key), d);
            }
          }
          return null;
        },
        getCurrentQi:function(){
          for(var i=1, j=LunarUtil.JIE_QI_IN_USE.length; i<j; i+=2){
            var key = LunarUtil.JIE_QI_IN_USE[i];
            var d = this._getJieQiSolar(key);
            if(d.getYear() === this._p.solar.getYear() && d.getMonth() === this._p.solar.getMonth() && d.getDay() === this._p.solar.getDay()){
              return this._buildJieQi(this._convertJieQi(key), d);
            }
          }
          return null;
        },
        getEightChar:function(){
          if(!this._p.eightChar){
            this._p.eightChar=EightChar.fromLunar(this);
          }
          return this._p.eightChar;
        },
        next:function(days){
          return this._p.solar.next(days).getLunar();
        },
        getYearXun:function(){
          return LunarUtil.getXun(this.getYearInGanZhi());
        },
        getMonthXun:function(){
          return LunarUtil.getXun(this.getMonthInGanZhi());
        },
        getDayXun:function(){
          return LunarUtil.getXun(this.getDayInGanZhi());
        },
        getTimeXun:function(){
          return LunarUtil.getXun(this.getTimeInGanZhi());
        },
        getYearXunByLiChun:function(){
          return LunarUtil.getXun(this.getYearInGanZhiByLiChun());
        },
        getYearXunExact:function(){
          return LunarUtil.getXun(this.getYearInGanZhiExact());
        },
        getMonthXunExact:function(){
          return LunarUtil.getXun(this.getMonthInGanZhiExact());
        },
        getDayXunExact:function(){
          return LunarUtil.getXun(this.getDayInGanZhiExact());
        },
        getDayXunExact2:function(){
          return LunarUtil.getXun(this.getDayInGanZhiExact2());
        },
        getYearXunKong:function(){
          return LunarUtil.getXunKong(this.getYearInGanZhi());
        },
        getMonthXunKong:function(){
          return LunarUtil.getXunKong(this.getMonthInGanZhi());
        },
        getDayXunKong:function(){
          return LunarUtil.getXunKong(this.getDayInGanZhi());
        },
        getTimeXunKong:function(){
          return LunarUtil.getXunKong(this.getTimeInGanZhi());
        },
        getYearXunKongByLiChun:function(){
          return LunarUtil.getXunKong(this.getYearInGanZhiByLiChun());
        },
        getYearXunKongExact:function(){
          return LunarUtil.getXunKong(this.getYearInGanZhiExact());
        },
        getMonthXunKongExact:function(){
          return LunarUtil.getXunKong(this.getMonthInGanZhiExact());
        },
        getDayXunKongExact:function(){
          return LunarUtil.getXunKong(this.getDayInGanZhiExact());
        },
        getDayXunKongExact2:function(){
          return LunarUtil.getXunKong(this.getDayInGanZhiExact2());
        },
        toString:function(){
          return this.getYearInChinese()+'年'+this.getMonthInChinese()+'月'+this.getDayInChinese();
        },
        toFullString:function(){
          var s = this.toString();
          s += ' '+this.getYearInGanZhi()+'('+this.getYearShengXiao()+')年';
          s += ' '+this.getMonthInGanZhi()+'('+this.getMonthShengXiao()+')月';
          s += ' '+this.getDayInGanZhi()+'('+this.getDayShengXiao()+')日';
          s += ' '+this.getTimeZhi()+'('+this.getTimeShengXiao()+')时';
          s += ' 纳音['+this.getYearNaYin()+' '+this.getMonthNaYin()+' '+this.getDayNaYin()+' '+this.getTimeNaYin()+']';
          s += ' 星期'+this.getWeekInChinese();
          var festivals = this.getFestivals();
          var i;
          var j;
          for(i=0,j=festivals.length;i<j;i++){
            s += ' ('+festivals[i]+')';
          }
          festivals = this.getOtherFestivals();
          for(i=0,j=festivals.length;i<j;i++){
            s += ' ('+festivals[i]+')';
          }
          var jq = this.getJieQi();
          if(jq.length>0){
            s += ' ['+jq+']';
          }
          s += ' '+this.getGong()+'方'+this.getShou();
          s += ' 星宿['+this.getXiu()+this.getZheng()+this.getAnimal()+']('+this.getXiuLuck()+')';
          s += ' 彭祖百忌['+this.getPengZuGan()+' '+this.getPengZuZhi()+']';
          s += ' 喜神方位['+this.getDayPositionXi()+']('+this.getDayPositionXiDesc()+')';
          s += ' 阳贵神方位['+this.getDayPositionYangGui()+']('+this.getDayPositionYangGuiDesc()+')';
          s += ' 阴贵神方位['+this.getDayPositionYinGui()+']('+this.getDayPositionYinGuiDesc()+')';
          s += ' 福神方位['+this.getDayPositionFu()+']('+this.getDayPositionFuDesc()+')';
          s += ' 财神方位['+this.getDayPositionCai()+']('+this.getDayPositionCaiDesc()+')';
          s += ' 冲['+this.getDayChongDesc()+']';
          s += ' 煞['+this.getDaySha()+']';
          return s;
        },
        _buildNameAndIndex: function(name, index){
          return {
            _p:{
              name: name,
              index: index
            },
            getName: function(){return this._p.name;},
            setName: function(name){this._p.name = name;},
            getIndex: function(){return this._p.index;},
            setIndex: function(index){this._p.index = index;},
            toString: function(){return this.getName();},
            toFullString: function(){return this.getName()+'第'+this.getIndex()+'天';}
          };
        },
        getShuJiu:function(){
          var currentDay = Solar.fromYmd(this._p.solar.getYear(), this._p.solar.getMonth(), this._p.solar.getDay());
          var start = this._getJieQiSolar('DONG_ZHI');
          var startDay = Solar.fromYmd(start.getYear(), start.getMonth(), start.getDay());
          if (currentDay.isBefore(startDay)) {
            start = this._getJieQiSolar(I18n.getMessage('jq.dongZhi'));
            startDay = Solar.fromYmd(start.getYear(), start.getMonth(), start.getDay());
          }
          var endDay = Solar.fromYmd(start.getYear(), start.getMonth(), start.getDay()).next(81);
          if (currentDay.isBefore(startDay) || (!currentDay.isBefore(endDay))) {
            return null;
          }
          var days = currentDay.subtract(startDay);
          return this._buildNameAndIndex(LunarUtil.NUMBER[Math.floor(days / 9) + 1] + '九', days % 9 + 1);
        },
        getFu:function(){
          var currentDay = Solar.fromYmd(this._p.solar.getYear(), this._p.solar.getMonth(), this._p.solar.getDay());
          var xiaZhi = this._getJieQiSolar(I18n.getMessage('jq.xiaZhi'));
          var liQiu = this._getJieQiSolar(I18n.getMessage('jq.liQiu'));
          var startDay = Solar.fromYmd(xiaZhi.getYear(), xiaZhi.getMonth(), xiaZhi.getDay());

          // 第1个庚日
          var add = 6 - xiaZhi.getLunar().getDayGanIndex();
          if (add < 0) {
            add += 10;
          }
          // 第3个庚日，即初伏第1天
          add += 20;
          startDay = startDay.next(add);

          // 初伏以前
          if (currentDay.isBefore(startDay)) {
            return null;
          }

          var days = currentDay.subtract(startDay);
          if (days < 10) {
            return this._buildNameAndIndex('初伏', days + 1);
          }

          // 第4个庚日，中伏第1天
          startDay = startDay.next(10);

          days = currentDay.subtract(startDay);
          if (days < 10) {
            return this._buildNameAndIndex('中伏', days + 1);
          }

          // 第5个庚日，中伏第11天或末伏第1天
          startDay = startDay.next(10);

          var liQiuDay = Solar.fromYmd(liQiu.getYear(),liQiu.getMonth(),liQiu.getDay());

          days = currentDay.subtract(startDay);
          // 末伏
          if (liQiuDay.isAfter(startDay)) {
            // 中伏
            if (days < 10) {
              return this._buildNameAndIndex('中伏', days + 11);
            }
            // 末伏第1天
            startDay = startDay.next(10);
            days = currentDay.subtract(startDay);
          }
          if (days < 10) {
            return this._buildNameAndIndex('末伏', days + 1);
          }
          return null;
        },
        getLiuYao:function(){
          return LunarUtil.LIU_YAO[(Math.abs(this._p.month)+this._p.day-2)%6];
        },
        getWuHou:function(){
          var jieQi = this.getPrevJieQi(true);
          var jq = LunarUtil.find(jieQi.getName(), LunarUtil.JIE_QI);
          var current = Solar.fromYmd(this._p.solar.getYear(),this._p.solar.getMonth(),this._p.solar.getDay());
          var startSolar = jieQi.getSolar();
          var start = Solar.fromYmd(startSolar.getYear(),startSolar.getMonth(),startSolar.getDay());
          var index = Math.floor(current.subtract(start) / 5);
          if (index > 2) {
            index = 2;
          }
          return LunarUtil.WU_HOU[(jq.index * 3 + index) % LunarUtil.WU_HOU.length];
        },
        getHou:function(){
          var jieQi = this.getPrevJieQi(true);
          var days = this._p.solar.subtract(jieQi.getSolar());
          var max = LunarUtil.HOU.length - 1;
          var offset = Math.floor(days / 5);
          if (offset > max) {
            offset = max;
          }
          return jieQi.getName() + ' ' + LunarUtil.HOU[offset];
        },
        getDayLu:function(){
          var gan = LunarUtil.LU[this.getDayGan()];
          var zhi = LunarUtil.LU[this.getDayZhi()];
          var lu = gan + '命互禄';
          if (zhi) {
            lu += ' ' + zhi + '命进禄';
          }
          return lu;
        },
        getTime:function(){
          return LunarTime.fromYmdHms(this._p.year, this._p.month, this._p.day, this._p.hour, this._p.minute, this._p.second);
        },
        getTimes:function(){
          var l = [];
          l.push(LunarTime.fromYmdHms(this._p.year, this._p.month, this._p.day, 0, 0, 0));
          for(var i = 0; i < 12; i++){
            l.push(LunarTime.fromYmdHms(this._p.year, this._p.month, this._p.day, (i+1)*2-1, 0, 0));
          }
          return l;
        },
        getFoto:function(){return Foto.fromLunar(this);},
        getTao:function(){return Tao.fromLunar(this);}
      };
    };
    return {
      fromYmdHms:function(y,m,d,hour,minute,second){return _fromYmdHms(y,m,d,hour,minute,second);},
      fromYmd:function(y,m,d){return _fromYmdHms(y,m,d,0,0,0);},
      fromSolar:function(solar){return _fromSolar(solar);},
      fromDate:function(date){return _fromDate(date);}
    };
  })();
  var SolarWeek = (function(){
    var _fromDate = function(date,start){
      var solar = Solar.fromDate(date);
      return _fromYmd(solar.getYear(),solar.getMonth(), solar.getDay(), start);
    };
    var _fromYmd = function(y,m,d,start){
      var oy = y;
      var om = m;
      var od = d;
      y *= 1;
      if(isNaN(y)){
        throw new Error('wrong solar year '+oy);
      }
      m *= 1;
      if(isNaN(m)){
        throw new Error('wrong solar month '+om);
      }
      d *= 1;
      if(isNaN(d)){
        throw new Error('wrong solar day '+od);
      }
      start *= 1;
      if(isNaN(start)){
        start = 0;
      }
      return {
        _p:{
          year:y,
          month:m,
          day:d,
          start:start
        },
        getYear:function(){
          return this._p.year;
        },
        getMonth:function(){
          return this._p.month;
        },
        getDay:function(){
          return this._p.day;
        },
        getStart:function(){
          return this._p.start;
        },
        /**
         * 获取当前日期是在当月第几周
         * @return number 周序号，从1开始
         */
        getIndex:function(){
          var offset = Solar.fromYmd(this._p.year,this._p.month,1).getWeek() - this._p.start;
          if(offset < 0) {
            offset += 7;
          }
          return Math.ceil((this._p.day + offset)/7);
        },
        /**
         * 获取当前日期是在当年第几周
         * @return number 周序号，从1开始
         */
        getIndexInYear:function(){
          var offset = Solar.fromYmd(this._p.year,1,1).getWeek() - this._p.start;
          if(offset < 0) {
            offset += 7;
          }
          return Math.ceil((SolarUtil.getDaysInYear(this._p.year, this._p.month, this._p.day) + offset)/7);
        },
        /**
         * 周推移
         * @param weeks 推移的周数，负数为倒推
         * @param separateMonth 是否按月单独计算
         * @return object 推移后的阳历周
         */
        next: function (weeks, separateMonth) {
          var ow = weeks;
          weeks *= 1;
          if(isNaN(weeks)){
            throw new Error('wrong weeks ' + ow);
          }
          var start = this._p.start;
          if (0 === weeks) {
            return _fromYmd(this._p.year, this._p.month, this._p.day, start);
          }
          var solar = Solar.fromYmd(this._p.year, this._p.month, this._p.day);
          if (separateMonth) {
            var n = weeks;
            var week = _fromYmd(this._p.year, this._p.month, this._p.day, start);
            var month = this._p.month;
            var plus = n > 0;
            while (0 !== n) {
              solar = solar.next(plus ? 7 : -7);
              week = _fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
              var weekMonth = week.getMonth();
              if (month !== weekMonth) {
                var index = week.getIndex();
                if (plus) {
                  if (1 === index) {
                    var firstDay = week.getFirstDay();
                    week = _fromYmd(firstDay.getYear(), firstDay.getMonth(), firstDay.getDay(), start);
                    weekMonth = week.getMonth();
                  } else {
                    solar = Solar.fromYmd(week.getYear(), week.getMonth(), 1);
                    week = _fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
                  }
                } else {
                  var size = SolarUtil.getWeeksOfMonth(week.getYear(), week.getMonth(), start);
                  if (size === index) {
                    var lastDay = week.getFirstDay().next(6);
                    week = _fromYmd(lastDay.getYear(), lastDay.getMonth(), lastDay.getDay(), start);
                    weekMonth = week.getMonth();
                  } else {
                    solar = Solar.fromYmd(week.getYear(), week.getMonth(), SolarUtil.getDaysOfMonth(week.getYear(), week.getMonth()));
                    week = _fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
                  }
                }
                month = weekMonth;
              }
              n -= plus ? 1 : -1;
            }
            return week;
          } else {
            solar = solar.next(weeks * 7);
            return _fromYmd(solar.getYear(), solar.getMonth(), solar.getDay(), start);
          }
        },
        /**
         * 获取本周第一天的阳历日期（可能跨月）
         * @return object 本周第一天的阳历日期
         */
        getFirstDay:function(){
          var solar = Solar.fromYmd(this._p.year, this._p.month, this._p.day);
          var prev = solar.getWeek() - this._p.start;
          if(prev < 0){
            prev += 7;
          }
          return solar.next(-prev);
        },
        /**
         * 获取本周第一天的阳历日期（仅限当月）
         * @return object 本周第一天的阳历日期
         */
        getFirstDayInMonth:function(){
          var index = 0;
          var days = this.getDays();
          for(var i = 0;i<days.length;i++){
            if(this._p.month===days[i].getMonth()){
              index = i;
              break;
            }
          }
          return days[index];
        },
        /**
         * 获取本周的阳历日期列表（可能跨月）
         * @return Array 本周的阳历日期列表
         */
        getDays:function(){
          var firstDay = this.getFirstDay();
          var l = [];
          l.push(firstDay);
          for(var i = 1;i<7;i++){
            l.push(firstDay.next(i));
          }
          return l;
        },
        /**
         * 获取本周的阳历日期列表（仅限当月）
         * @return Array 本周的阳历日期列表（仅限当月）
         */
        getDaysInMonth:function(){
          var days = this.getDays();
          var l = [];
          for(var i = 0;i<days.length;i++){
            var day = days[i];
            if(this._p.month!==day.getMonth()){
              continue;
            }
            l.push(day);
          }
          return l;
        },
        toString:function(){
          return this.getYear()+'.'+this.getMonth()+'.'+this.getIndex();
        },
        toFullString:function(){
          return this.getYear()+'年'+this.getMonth()+'月第'+this.getIndex()+'周';
        }
      };
    };
    return {
      /**
       * 指定年月日生成当天所在的阳历周
       * @param y 年份
       * @param m 月份
       * @param d 日期
       * @param start 星期几作为一周的开始，1234560分别代表星期一至星期天
       * @return object 阳历周
       */
      fromYmd:function(y,m,d,start){return _fromYmd(y,m,d,start);},
      /**
       * 指定日期生成当天所在的阳历周
       * @param date 日期
       * @param start 星期几作为一周的开始，1234560分别代表星期一至星期天
       * @return object 阳历周
       */
      fromDate:function(date,start){return _fromDate(date,start);}
    };
  })();
  var SolarMonth = (function(){
    var _fromDate = function(date){
      var solar = Solar.fromDate(date);
      return _fromYm(solar.getYear(),solar.getMonth());
    };
    var _fromYm = function(y,m){
      var oy = y;
      var om = m;
      y *= 1;
      if(isNaN(y)){
        throw new Error('wrong solar year '+oy);
      }
      m *= 1;
      if(isNaN(m)){
        throw new Error('wrong solar month '+om);
      }
      return {
        _p:{
          year:y,
          month:m
        },
        getYear:function(){
          return this._p.year;
        },
        getMonth:function(){
          return this._p.month;
        },
        next:function(months){
          var om = months;
          months *= 1;
          if(isNaN(months)){
            throw new Error('wrong months ' + om);
          }
          var n = months < 0 ? -1 : 1;
          var m = Math.abs(months);
          var y = this._p.year + Math.floor(m / 12) * n;
          m = this._p.month + m % 12 * n;
          if (m > 12) {
            m -= 12;
            y++;
          } else if (m < 1) {
            m += 12;
            y--;
          }
          return _fromYm(y, m);
        },
        getDays:function(){
          var l = [];
          var d = Solar.fromYmd(this._p.year,this._p.month,1);
          l.push(d);
          var days = SolarUtil.getDaysOfMonth(this._p.year,this._p.month);
          for(var i = 1;i<days;i++){
            l.push(d.next(i));
          }
          return l;
        },
        getWeeks:function(start){
          start *= 1;
          if(isNaN(start)){
            start = 0;
          }
          var l = [];
          var week = SolarWeek.fromYmd(this._p.year, this._p.month, 1, start);
          while (true) {
            l.push(week);
            week = week.next(1, false);
            var firstDay = week.getFirstDay();
            if (firstDay.getYear() > this._p.year || firstDay.getMonth() > this._p.month) {
              break;
            }
          }
          return l;
        },
        toString:function(){
          return this.getYear()+'-'+this.getMonth();
        },
        toFullString:function(){
          return this.getYear()+'年'+this.getMonth()+'月';
        }
      };
    };
    return {
      fromYm:function(y,m){return _fromYm(y,m);},
      fromDate:function(date){return _fromDate(date);}
    };
  })();
  var SolarSeason = (function(){
    var _fromDate = function(date){
      var solar = Solar.fromDate(date);
      return _fromYm(solar.getYear(),solar.getMonth());
    };
    var _fromYm = function(y,m){
      var oy = y;
      var om = m;
      y *= 1;
      if(isNaN(y)){
        throw new Error('wrong solar year '+oy);
      }
      m *= 1;
      if(isNaN(m)){
        throw new Error('wrong solar month '+om);
      }
      return {
        _p:{
          year:y,
          month:m
        },
        getYear:function(){
          return this._p.year;
        },
        getMonth:function(){
          return this._p.month;
        },
        /**
         * 获取当月是第几季度
         * @return number 季度序号，从1开始
         */
        getIndex:function(){
          return Math.ceil(this._p.month/3);
        },
        /**
         * 季度推移
         * @param seasons 推移的季度数，负数为倒推
         * @return object 推移后的季度
         */
        next:function(seasons){
          var os = seasons;
          seasons *= 1;
          if(isNaN(seasons)){
            throw new Error('wrong seasons ' + os);
          }
          var month = SolarMonth.fromYm(this._p.year, this._p.month).next(3 * seasons);
          return _fromYm(month.getYear(), month.getMonth());
        },
        /**
         * 获取本季度的月份
         * @return Array 本季度的月份列表
         */
        getMonths:function(){
          var l = [];
          var index = this.getIndex()-1;
          for(var i=0;i<3;i++){
            l.push(SolarMonth.fromYm(this._p.year,3*index+i+1));
          }
          return l;
        },
        toString:function(){
          return this.getYear()+'.'+this.getIndex();
        },
        toFullString:function(){
          return this.getYear()+'年'+this.getIndex()+'季度';
        }
      };
    };
    return {
      fromYm:function(y,m){return _fromYm(y,m);},
      fromDate:function(date){return _fromDate(date);}
    };
  })();
  var SolarHalfYear = (function(){
    var _fromDate = function(date){
      var solar = Solar.fromDate(date);
      return _fromYm(solar.getYear(),solar.getMonth());
    };
    var _fromYm = function(y,m){
      var oy = y;
      var om = m;
      y *= 1;
      if(isNaN(y)){
        throw new Error('wrong solar year '+oy);
      }
      m *= 1;
      if(isNaN(m)){
        throw new Error('wrong solar month '+om);
      }
      return {
        _p:{
          year:y,
          month:m
        },
        getYear:function(){
          return this._p.year;
        },
        getMonth:function(){
          return this._p.month;
        },
        /**
         * 获取当月是第几半年
         * @return number 半年序号，从1开始
         */
        getIndex:function(){
          return Math.ceil(this._p.month/6);
        },
        /**
         * 半年推移
         * @param halfYears 推移的半年数，负数为倒推
         * @return object 推移后的半年
         */
        next:function(halfYears){
          var oh = halfYears;
          halfYears *= 1;
          if(isNaN(halfYears)){
            throw new Error('wong halfYears ' + oh);
          }
          var month = SolarMonth.fromYm(this._p.year, this._p.month).next(6 * halfYears);
          return _fromYm(month.getYear(), month.getMonth());
        },
        /**
         * 获取本半年的月份
         * @return Array 本半年的月份列表
         */
        getMonths:function(){
          var l = [];
          var index = this.getIndex()-1;
          for(var i=0;i<6;i++){
            l.push(SolarMonth.fromYm(this._p.year,6*index+i+1));
          }
          return l;
        },
        toString:function(){
          return this.getYear()+'.'+this.getIndex();
        },
        toFullString:function(){
          return this.getYear()+'年'+['上','下'][this.getIndex()-1]+'半年';
        }
      };
    };
    return {
      fromYm:function(y,m){return _fromYm(y,m);},
      fromDate:function(date){return _fromDate(date);}
    };
  })();
  var SolarYear = (function(){
    var _fromDate = function(date){
      return _fromYear(Solar.fromDate(date).getYear());
    };
    var _fromYear = function(y){
      var oy = y;
      y *= 1;
      if(isNaN(y)){
        throw new Error('wrong solar year '+oy);
      }
      return {
        _p:{
          year:y
        },
        getYear:function(){
          return this._p.year;
        },
        next:function(years){
          var oy = years;
          years *= 1;
          if(isNaN(years)){
            throw new Error('wrong years ' + oy);
          }
          return _fromYear(this._p.year + years);
        },
        getMonths:function(){
          var l = [];
          var m = SolarMonth.fromYm(this._p.year,1);
          l.push(m);
          for(var i = 1;i<12;i++){
            l.push(m.next(i));
          }
          return l;
        },
        toString:function(){
          return this.getYear()+'';
        },
        toFullString:function(){
          return this.getYear()+'年';
        }
      };
    };
    return {
      fromYear:function(y){return _fromYear(y);},
      fromDate:function(date){return _fromDate(date);}
    };
  })();
  var LunarYear = (function(){
    var _YUAN = ['下','上','中'];
    var _YUN = ['七','八','九','一','二','三','四','五','六'];
    var _LEAP_11 = [75, 94, 170, 265, 322, 398, 469, 553, 583, 610, 678, 735, 754, 773, 849, 887, 936, 1050, 1069, 1126, 1145, 1164, 1183, 1259, 1278, 1308, 1373, 1403, 1441, 1460, 1498, 1555, 1593, 1612, 1631, 1642, 2033, 2128, 2147, 2242, 2614, 2728, 2910, 3062, 3244, 3339, 3616, 3711, 3730, 3825, 4007, 4159, 4197, 4322, 4341, 4379, 4417, 4531, 4599, 4694, 4713, 4789, 4808, 4971, 5085, 5104, 5161, 5180, 5199, 5294, 5305, 5476, 5677, 5696, 5772, 5791, 5848, 5886, 6049, 6068, 6144, 6163, 6258, 6402, 6440, 6497, 6516, 6630, 6641, 6660, 6679, 6736, 6774, 6850, 6869, 6899, 6918, 6994, 7013, 7032, 7051, 7070, 7089, 7108, 7127, 7146, 7222, 7271, 7290, 7309, 7366, 7385, 7404, 7442, 7461, 7480, 7491, 7499, 7594, 7624, 7643, 7662, 7681, 7719, 7738, 7814, 7863, 7882, 7901, 7939, 7958, 7977, 7996, 8034, 8053, 8072, 8091, 8121, 8159, 8186, 8216, 8235, 8254, 8273, 8311, 8330, 8341, 8349, 8368, 8444, 8463, 8474, 8493, 8531, 8569, 8588, 8626, 8664, 8683, 8694, 8702, 8713, 8721, 8751, 8789, 8808, 8816, 8827, 8846, 8884, 8903, 8922, 8941, 8971, 9036, 9066, 9085, 9104, 9123, 9142, 9161, 9180, 9199, 9218, 9256, 9294, 9313, 9324, 9343, 9362, 9381, 9419, 9438, 9476, 9514, 9533, 9544, 9552, 9563, 9571, 9582, 9601, 9639, 9658, 9666, 9677, 9696, 9734, 9753, 9772, 9791, 9802, 9821, 9886, 9897, 9916, 9935, 9954, 9973, 9992];
    var _LEAP_12 = [37, 56, 113, 132, 151, 189, 208, 227, 246, 284, 303, 341, 360, 379, 417, 436, 458, 477, 496, 515, 534, 572, 591, 629, 648, 667, 697, 716, 792, 811, 830, 868, 906, 925, 944, 963, 982, 1001, 1020, 1039, 1058, 1088, 1153, 1202, 1221, 1240, 1297, 1335, 1392, 1411, 1422, 1430, 1517, 1525, 1536, 1574, 3358, 3472, 3806, 3988, 4751, 4941, 5066, 5123, 5275, 5343, 5438, 5457, 5495, 5533, 5552, 5715, 5810, 5829, 5905, 5924, 6421, 6535, 6793, 6812, 6888, 6907, 7002, 7184, 7260, 7279, 7374, 7556, 7746, 7757, 7776, 7833, 7852, 7871, 7966, 8015, 8110, 8129, 8148, 8224, 8243, 8338, 8406, 8425, 8482, 8501, 8520, 8558, 8596, 8607, 8615, 8645, 8740, 8778, 8835, 8865, 8930, 8960, 8979, 8998, 9017, 9055, 9074, 9093, 9112, 9150, 9188, 9237, 9275, 9332, 9351, 9370, 9408, 9427, 9446, 9457, 9465, 9495, 9560, 9590, 9628, 9647, 9685, 9715, 9742, 9780, 9810, 9818, 9829, 9848, 9867, 9905, 9924, 9943, 9962, 10000];
    var _CACHE_YEAR = null;
    var _YMC = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var _inLeap = function(arr, n) {
      for (var i = 0, j = arr.length; i < j; i++) {
        if (arr[i] === n) {
          return true;
        }
      }
      return false;
    };
    var _fromYear = function(lunarYear){
      var oy = lunarYear;
      lunarYear *= 1;
      if(isNaN(lunarYear)){
        throw new Error('wrong lunar year '+oy);
      }
      var _y = (function(){
        var offset = lunarYear - 4;
        var yearGanIndex = offset % 10;
        var yearZhiIndex = offset % 12;
        if (yearGanIndex < 0) {
          yearGanIndex += 10;
        }
        if (yearZhiIndex < 0) {
          yearZhiIndex += 12;
        }
        return {
          ganIndex: yearGanIndex,
          zhiIndex: yearZhiIndex
        }
      })();
      return {
        _p: {
          year: lunarYear,
          ganIndex: _y.ganIndex,
          zhiIndex: _y.zhiIndex,
          months: [],
          jieQiJulianDays: []
        },
        getYear:function(){return this._p.year;},
        getGanIndex:function(){return this._p.ganIndex;},
        getZhiIndex:function(){return this._p.zhiIndex;},
        getGan:function(){return LunarUtil.GAN[this._p.ganIndex+1];},
        getZhi:function(){return LunarUtil.ZHI[this._p.zhiIndex+1];},
        getGanZhi:function(){return this.getGan()+this.getZhi();},
        getJieQiJulianDays:function(){return this._p.jieQiJulianDays;},
        getDayCount:function(){
          var n = 0;
          for (var i = 0, j = this._p.months.length; i < j; i++) {
            var m = this._p.months[i];
            if (m.getYear() === this._p.year) {
              n += m.getDayCount();
            }
          }
          return n;
        },
        getMonthsInYear:function(){
          var l = [];
          for (var i = 0, j = this._p.months.length; i < j; i++) {
            var m = this._p.months[i];
            if (m.getYear() === this._p.year) {
              l.push(m);
            }
          }
          return l;
        },
        getMonths:function(){return this._p.months;},
        getMonth:function(lunarMonth){
          var om = lunarMonth;
          lunarMonth *= 1;
          if(isNaN(lunarMonth)){
            throw new Error('wrong lunarMonth ' + om);
          }
          for (var i = 0, j = this._p.months.length; i < j; i++) {
            var m = this._p.months[i];
            if (m.getYear() === this._p.year && m.getMonth() === lunarMonth) {
              return m;
            }
          }
          return null;
        },
        getLeapMonth:function(){
          for (var i = 0, j = this._p.months.length; i < j; i++) {
            var m = this._p.months[i];
            if (m.getYear() === this._p.year && m.isLeap()) {
              return Math.abs(m.getMonth());
            }
          }
          return 0;
        },
        _getZaoByGan:function(index, name){
          var offset = index - Solar.fromJulianDay(this.getMonth(1).getFirstJulianDay()).getLunar().getDayGanIndex();
          if (offset < 0) {
            offset += 10;
          }
          return name.replace('几', LunarUtil.NUMBER[offset+1]);
        },
        _getZaoByZhi:function(index, name){
          var offset = index - Solar.fromJulianDay(this.getMonth(1).getFirstJulianDay()).getLunar().getDayZhiIndex();
          if (offset < 0) {
            offset += 12;
          }
          return name.replace('几', LunarUtil.NUMBER[offset+1]);
        },
        getTouLiang:function(){
          return this._getZaoByZhi(0, '几鼠偷粮');
        },
        getCaoZi:function(){
          return this._getZaoByZhi(0, '草子几分');
        },
        getGengTian:function(){
          return this._getZaoByZhi(1, '几牛耕田');
        },
        getHuaShou:function(){
          return this._getZaoByZhi(3, '花收几分');
        },
        getZhiShui:function(){
          return this._getZaoByZhi(4, '几龙治水');
        },
        getTuoGu:function(){
          return this._getZaoByZhi(6, '几马驮谷');
        },
        getQiangMi:function(){
          return this._getZaoByZhi(9, '几鸡抢米');
        },
        getKanCan:function(){
          return this._getZaoByZhi(9, '几姑看蚕');
        },
        getGongZhu:function(){
          return this._getZaoByZhi(11, '几屠共猪');
        },
        getJiaTian:function(){
          return this._getZaoByGan(0, '甲田几分');
        },
        getFenBing:function(){
          return this._getZaoByGan(2, '几人分饼');
        },
        getDeJin:function(){
          return this._getZaoByGan(7, '几日得金');
        },
        getRenBing:function(){
          return this._getZaoByGan(2, this._getZaoByZhi(2, '几人几丙'));
        },
        getRenChu:function(){
          return this._getZaoByGan(3, this._getZaoByZhi(2, '几人几锄'));
        },
        getYuan:function(){
          return _YUAN[Math.floor((this._p.year+2696)/60)%3]+'元';
        },
        getYun:function(){
          return _YUN[Math.floor((this._p.year+2696)/20)%9]+'运';
        },
        getNineStar:function(){
          var index = LunarUtil.getJiaZiIndex(this.getGanZhi()) + 1;
          var yuan = Math.floor((this._p.year + 2696) / 60) % 3;
          var offset = (62 + yuan * 3 - index) % 9;
          if(0 === offset){
            offset = 9;
          }
          return NineStar.fromIndex(offset - 1);
        },
        getPositionXi:function(){
          return LunarUtil.POSITION_XI[this._p.ganIndex+1];
        },
        getPositionXiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getPositionXi()];
        },
        getPositionYangGui:function(){
          return LunarUtil.POSITION_YANG_GUI[this._p.ganIndex+1];
        },
        getPositionYangGuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getPositionYangGui()];
        },
        getPositionYinGui:function(){
          return LunarUtil.POSITION_YIN_GUI[this._p.ganIndex+1];
        },
        getPositionYinGuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getPositionYinGui()];
        },
        getPositionFu:function(sect){
          return (1===sect?LunarUtil.POSITION_FU:LunarUtil.POSITION_FU_2)[this._p.ganIndex+1];
        },
        getPositionFuDesc:function(sect){
          return LunarUtil.POSITION_DESC[this.getPositionFu(sect)];
        },
        getPositionCai:function(){
          return LunarUtil.POSITION_CAI[this._p.ganIndex+1];
        },
        getPositionCaiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getPositionCai()];
        },
        getPositionTaiSui:function(){
          return LunarUtil.POSITION_TAI_SUI_YEAR[this._p.zhiIndex];
        },
        getPositionTaiSuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getPositionTaiSui()];
        },
        toString:function(){
          return this.getYear()+'';
        },
        toFullString:function(){
          return this.getYear()+'年';
        },
        next:function(years){
          var oy = years;
          years *= 1;
          if(isNaN(years)){
            throw new Error('wrong years ' + oy);
          }
          return LunarYear.fromYear(this._p.year + years);
        },
        _compute:function(){
          this._p.months = [];
          this._p.jieQiJulianDays = [];
          // 节气
          var jq = [];
          // 合朔，即每月初一
          var hs = [];
          // 每月天数，长度15
          var dayCounts = [];
          var months = [];
          var i;
          var j;
          var currentYear = this._p.year;
          var jd = Math.floor((currentYear - 2000) * 365.2422 + 180);
          // 355是2000.12冬至，得到较靠近jd的冬至估计值
          var w = Math.floor((jd - 355 + 183) / 365.2422) * 365.2422 + 355;
          if (ShouXingUtil.calcQi(w) > jd) {
            w -= 365.2422;
          }
          // 25个节气时刻(北京时间)，从冬至开始到下一个冬至以后
          for (i = 0; i < 26; i++) {
            jq.push(ShouXingUtil.calcQi(w + 15.2184 * i));
          }
          for (i = 0, j = LunarUtil.JIE_QI_IN_USE.length; i < j; i++) {
            if (i === 0) {
              jd = ShouXingUtil.qiAccurate2(jq[0] - 15.2184);
            } else if (i <= 26) {
              jd = ShouXingUtil.qiAccurate2(jq[i - 1]);
            } else {
              jd = ShouXingUtil.qiAccurate2(jq[25] + 15.2184 * (i - 26));
            }
            this._p.jieQiJulianDays.push(jd + Solar.J2000);
          }

          // 冬至前的初一，今年首朔的日月黄经差w
          w = ShouXingUtil.calcShuo(jq[0]);
          if (w > jq[0]) {
            w -= 29.53;
          }
          // 递推每月初一
          for (i = 0; i < 16; i++) {
            hs.push(ShouXingUtil.calcShuo(w + 29.5306 * i));
          }
          // 每月
          for (i = 0; i < 15; i++) {
            dayCounts.push(Math.floor(hs[i + 1] - hs[i]));
            months.push(i);
          }

          var prevYear = currentYear - 1;
          var leapIndex = 16;
          if (_inLeap(_LEAP_11, currentYear)) {
            leapIndex = 13;
          } else if (_inLeap(_LEAP_12, currentYear)) {
            leapIndex = 14;
          } else if (hs[13] <= jq[24]) {
            i = 1;
            while (hs[i + 1] > jq[2 * i] && i < 13) {
              i++;
            }
            leapIndex = i;
          }
          for (j = leapIndex; j < 15; j++) {
            months[j] -= 1;
          }
          var fm = -1;
          var index = -1;
          var y = prevYear;
          for (i = 0; i < 15; i++) {
            var dm = hs[i] + Solar.J2000;
            var v2 = months[i];
            var mc = _YMC[v2 % 12];
            if (1724360 <= dm && dm < 1729794) {
              mc = _YMC[(v2 + 1) % 12];
            } else if (1807724 <= dm && dm < 1808699) {
              mc = _YMC[(v2 + 1) % 12];
            } else if (dm === 1729794 || dm === 1808699) {
              mc = 12;
            }
            if (fm === -1) {
              fm = mc;
              index = mc;
            }
            if (mc < fm) {
              y += 1;
              index = 1;
            }
            fm = mc;
            if (i === leapIndex) {
              mc = -mc;
            } else if (dm === 1729794 || dm === 1808699) {
              mc = -11;
            }
            this._p.months.push(LunarMonth._(y, mc, dayCounts[i], hs[i] + Solar.J2000, index));
            index++;
          }
          return this;
        }
      }._compute();
    };
    var _fromCachedYear = function(lunarYear) {
      var y;
      if (!_CACHE_YEAR || _CACHE_YEAR.getYear() !== lunarYear) {
        y = _fromYear(lunarYear);
        _CACHE_YEAR = y;
      } else {
        y = _CACHE_YEAR;
      }
      return y;
    };
    return {
      fromYear:function(lunarYear){return _fromCachedYear(lunarYear);}
    };
  })();
  var LunarMonth = (function(){
    var _fromYm = function(lunarYear,lunarMonth){
      var oy = lunarYear;
      var om = lunarMonth;
      lunarYear *= 1;
      if(isNaN(lunarYear)){
        throw new Error('wrong lunar year '+oy);
      }
      lunarMonth *= 1;
      if(isNaN(lunarMonth)){
        throw new Error('wrong lunar month '+om);
      }
      return LunarYear.fromYear(lunarYear).getMonth(lunarMonth);
    };
    var _new = function(lunarYear, lunarMonth, dayCount, firstJulianDay, index){
      return {
        _p: {
          year: lunarYear,
          month: lunarMonth,
          dayCount: dayCount,
          firstJulianDay: firstJulianDay,
          index: index,
          zhiIndex: (Math.abs(lunarMonth) - 1 + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12
        },
        getIndex:function(){return this._p.index;},
        getGanIndex:function(){
          var offset = (LunarYear.fromYear(this._p.year).getGanIndex() + 1) % 5 * 2;
          return (Math.abs(this._p.month) - 1 + offset) % 10;
        },
        getZhiIndex:function(){return this._p.zhiIndex;},
        getGan:function(){return LunarUtil.GAN[this.getGanIndex() + 1];},
        getZhi:function(){return LunarUtil.ZHI[this._p.zhiIndex + 1];},
        getGanZhi:function(){return this.getGan() + this.getZhi();},
        getYear:function(){return this._p.year;},
        getMonth:function(){return this._p.month;},
        getDayCount:function(){return this._p.dayCount;},
        getFirstJulianDay:function(){return this._p.firstJulianDay;},
        isLeap:function(){return this._p.month<0;},
        getPositionXi:function(){
          return LunarUtil.POSITION_XI[this.getGanIndex() + 1];
        },
        getPositionXiDesc:function(){
          return LunarUtil.POSITION_DESC.get(this.getPositionXi());
        },
        getPositionYangGui:function(){
          return LunarUtil.POSITION_YANG_GUI[this.getGanIndex() + 1];
        },
        getPositionYangGuiDesc:function(){
          return LunarUtil.POSITION_DESC.get(this.getPositionYangGui());
        },
        getPositionYinGui:function(){
          return LunarUtil.POSITION_YIN_GUI[this.getGanIndex() + 1];
        },
        getPositionYinGuiDesc:function(){
          return LunarUtil.POSITION_DESC.get(this.getPositionYinGui());
        },
        getPositionFu:function(sect){
          return (1 === sect ? LunarUtil.POSITION_FU : LunarUtil.POSITION_FU_2)[this.getGanIndex() + 1];
        },
        getPositionFuDesc:function(sect){
          return LunarUtil.POSITION_DESC.get(this.getPositionFu(sect));
        },
        getPositionCai:function(){
          return LunarUtil.POSITION_CAI[this.getGanIndex() + 1];
        },
        getPositionCaiDesc:function(){
          return LunarUtil.POSITION_DESC.get(this.getPositionCai());
        },
        getPositionTaiSui:function(){
          var p;
          var m = Math.abs(this._p.month);
          switch(m) {
            case 1:
            case 5:
            case 9:
              p = '艮';
              break;
            case 3:
            case 7:
            case 11:
              p = '坤';
              break;
            case 4:
            case 8:
            case 12:
              p = '巽';
              break;
            default:
              p = LunarUtil.POSITION_GAN[Solar.fromJulianDay(this.getFirstJulianDay()).getLunar().getMonthGanIndex()];
          }
          return p;
        },
        getPositionTaiSuiDesc:function(){
          return LunarUtil.POSITION_DESC[this.getPositionTaiSui()];
        },
        getNineStar:function(){
          var index = LunarYear.fromYear(this._p.year).getZhiIndex() % 3;
          var m = this._p.month;
          if (m < 0) {
            m = -m;
          }
          var monthZhiIndex = (13 + m) % 12;
          var n = 27 - (index * 3);
          if (monthZhiIndex < LunarUtil.BASE_MONTH_ZHI_INDEX) {
            n -= 3;
          }
          var offset = (n - monthZhiIndex) % 9;
          return NineStar.fromIndex(offset);
        },
        next:function(n){
          var on = n;
          n *= 1;
          if(isNaN(n)){
            throw new Error('wrong days ' + on);
          }
          if (0 === n) {
            return LunarMonth.fromYm(this._p.year, this._p.month);
          } else {
            var rest = Math.abs(n);
            var ny = this._p.year;
            var iy = ny;
            var im = this._p.month;
            var index = 0;
            var months = LunarYear.fromYear(ny).getMonths();
            var i;
            var m;
            var size;
            if (n > 0) {
              while (true) {
                size = months.length;
                for (i = 0; i < size; i++) {
                  m = months[i];
                  if (m.getYear() === iy && m.getMonth() === im) {
                    index = i;
                    break;
                  }
                }
                var more = size - index - 1;
                if (rest < more) {
                  break;
                }
                rest -= more;
                var lastMonth = months[size - 1];
                iy = lastMonth.getYear();
                im = lastMonth.getMonth();
                ny++;
                months = LunarYear.fromYear(ny).getMonths();
              }
              return months[index + rest];
            } else {
              while (true) {
                size = months.length;
                for (i = 0; i < size; i++) {
                  m = months[i];
                  if (m.getYear() === iy && m.getMonth() === im) {
                    index = i;
                    break;
                  }
                }
                if (rest <= index) {
                  break;
                }
                rest -= index;
                var firstMonth = months[0];
                iy = firstMonth.getYear();
                im = firstMonth.getMonth();
                ny--;
                months = LunarYear.fromYear(ny).getMonths();
              }
              return months[index - rest];
            }
          }
        },
        toString:function(){return this.getYear()+'年'+(this.isLeap()?'闰':'')+LunarUtil.MONTH[Math.abs(this.getMonth())]+'月('+this.getDayCount()+')天';}
      };
    };
    return {
      fromYm:function(lunarYear,lunarMonth){return _fromYm(lunarYear,lunarMonth);},
      _:function(lunarYear, lunarMonth, dayCount, firstJulianDay, index){return _new(lunarYear, lunarMonth, dayCount, firstJulianDay, index);}
    };
  })();
  var ShouXingUtil = (function(){
    var _decode = function(s) {
      var o = '0000000000';
      var o2 = o + o;
      s = s.replace(/J/g, '00');
      s = s.replace(/I/g, '000');
      s = s.replace(/H/g, '0000');
      s = s.replace(/G/g, '00000');
      s = s.replace(/t/g, '02');
      s = s.replace(/s/g, '002');
      s = s.replace(/r/g, '0002');
      s = s.replace(/q/g, '00002');
      s = s.replace(/p/g, '000002');
      s = s.replace(/o/g, '0000002');
      s = s.replace(/n/g, '00000002');
      s = s.replace(/m/g, '000000002');
      s = s.replace(/l/g, '0000000002');
      s = s.replace(/k/g, '01');
      s = s.replace(/j/g, '0101');
      s = s.replace(/i/g, '001');
      s = s.replace(/h/g, '001001');
      s = s.replace(/g/g, '0001');
      s = s.replace(/f/g, '00001');
      s = s.replace(/e/g, '000001');
      s = s.replace(/d/g, '0000001');
      s = s.replace(/c/g, '00000001');
      s = s.replace(/b/g, '000000001');
      s = s.replace(/a/g, '0000000001');
      s = s.replace(/A/g, o2 + o2 + o2);
      s = s.replace(/B/g, o2 + o2 + o);
      s = s.replace(/C/g, o2 + o2);
      s = s.replace(/D/g, o2 + o);
      s = s.replace(/E/g, o2);
      s = s.replace(/F/g, o);
      return s;
    };
    return {
      PI_2: 2*Math.PI,
      ONE_THIRD: 1.0/3,
      SECOND_PER_DAY: 86400,
      SECOND_PER_RAD: 648000 / Math.PI,
      NUT_B:[
        2.1824, -33.75705, 36e-6, -1720, 920,
        3.5069, 1256.66393, 11e-6, -132, 57,
        1.3375, 16799.4182, -51e-6, -23, 10,
        4.3649, -67.5141, 72e-6, 21, -9,
        0.04, -628.302, 0, -14, 0,
        2.36, 8328.691, 0, 7, 0,
        3.46, 1884.966, 0, -5, 2,
        5.44, 16833.175, 0, -4, 2,
        3.69, 25128.110, 0, -3, 0,
        3.55, 628.362, 0, 2, 0
      ],
      DT_AT:[
        -4000, 108371.7, -13036.80, 392.000, 0.0000,
        -500, 17201.0, -627.82, 16.170, -0.3413,
        -150, 12200.6, -346.41, 5.403, -0.1593,
        150, 9113.8, -328.13, -1.647, 0.0377,
        500, 5707.5, -391.41, 0.915, 0.3145,
        900, 2203.4, -283.45, 13.034, -0.1778,
        1300, 490.1, -57.35, 2.085, -0.0072,
        1600, 120.0, -9.81, -1.532, 0.1403,
        1700, 10.2, -0.91, 0.510, -0.0370,
        1800, 13.4, -0.72, 0.202, -0.0193,
        1830, 7.8, -1.81, 0.416, -0.0247,
        1860, 8.3, -0.13, -0.406, 0.0292,
        1880, -5.4, 0.32, -0.183, 0.0173,
        1900, -2.3, 2.06, 0.169, -0.0135,
        1920, 21.2, 1.69, -0.304, 0.0167,
        1940, 24.2, 1.22, -0.064, 0.0031,
        1960, 33.2, 0.51, 0.231, -0.0109,
        1980, 51.0, 1.29, -0.026, 0.0032,
        2000, 63.87, 0.1, 0, 0,
        2005, 64.7, 0.21, 0, 0,
        2012, 66.8, 0.22, 0, 0,
        // 2018, 69.0, 0.36, 0, 0,
        // 使用skyfeild的DE440s△T预测数据拟合
        2016, 68.1024, 0.5456, -0.0542, -0.001172,
        2020, 69.3612, 0.0422, -0.0502, 0.006216,
        2024, 69.1752, -0.0335, -0.0048, 0.000811,
        2028, 69.0206, -0.0275, 0.0055, -0.000014,
        2032, 68.9981, 0.0163, 0.0054, 0.000006,
        2036, 69.1498, 0.0599, 0.0053, 0.000026,
        2040, 69.4751, 0.1035, 0.0051, 0.000046,
        2044, 69.9737, 0.1469, 0.0050, 0.000066,
        2048, 70.6451, 0.1903, 0.0049, 0.000085,
        2050, 71.0457
      ],
      XL0:[
        10000000000,
        20, 578, 920, 1100, 1124, 1136, 1148, 1217, 1226, 1229, 1229, 1229, 1229, 1937, 2363, 2618, 2633, 2660, 2666,
        17534704567, 0.00000000000, 0.00000000000, 334165646, 4.669256804, 6283.075849991, 3489428, 4.6261024,
        12566.1517000, 349706, 2.744118, 5753.384885, 341757, 2.828866, 3.523118, 313590, 3.627670, 77713.771468,
        267622, 4.418084, 7860.419392, 234269, 6.135162, 3930.209696, 132429, 0.742464, 11506.769770, 127317, 2.037097,
        529.690965, 119917, 1.109629, 1577.343542, 99025, 5.23268, 5884.92685, 90186, 2.04505, 26.29832, 85722, 3.50849,
        398.14900, 77979, 1.17883, 5223.69392, 75314, 2.53339, 5507.55324, 50526, 4.58293, 18849.22755, 49238, 4.20507,
        775.52261, 35666, 2.91954, 0.06731, 31709, 5.84902, 11790.62909, 28413, 1.89869, 796.29801, 27104, 0.31489,
        10977.07880, 24281, 0.34481, 5486.77784, 20616, 4.80647, 2544.31442, 20539, 1.86948, 5573.14280, 20226, 2.45768,
        6069.77675, 15552, 0.83306, 213.29910, 13221, 3.41118, 2942.46342, 12618, 1.08303, 20.77540, 11513, 0.64545,
        0.98032, 10285, 0.63600, 4694.00295, 10190, 0.97569, 15720.83878, 10172, 4.26680, 7.11355, 9921, 6.2099,
        2146.1654, 9761, 0.6810, 155.4204, 8580, 5.9832, 161000.6857, 8513, 1.2987, 6275.9623, 8471, 3.6708, 71430.6956,
        7964, 1.8079, 17260.1547, 7876, 3.0370, 12036.4607, 7465, 1.7551, 5088.6288, 7387, 3.5032, 3154.6871, 7355,
        4.6793, 801.8209, 6963, 0.8330, 9437.7629, 6245, 3.9776, 8827.3903, 6115, 1.8184, 7084.8968, 5696, 2.7843,
        6286.5990, 5612, 4.3869, 14143.4952, 5558, 3.4701, 6279.5527, 5199, 0.1891, 12139.5535, 5161, 1.3328, 1748.0164,
        5115, 0.2831, 5856.4777, 4900, 0.4874, 1194.4470, 4104, 5.3682, 8429.2413, 4094, 2.3985, 19651.0485, 3920,
        6.1683, 10447.3878, 3677, 6.0413, 10213.2855, 3660, 2.5696, 1059.3819, 3595, 1.7088, 2352.8662, 3557, 1.7760,
        6812.7668, 3329, 0.5931, 17789.8456, 3041, 0.4429, 83996.8473, 3005, 2.7398, 1349.8674, 2535, 3.1647, 4690.4798,
        2474, 0.2148, 3.5904, 2366, 0.4847, 8031.0923, 2357, 2.0653, 3340.6124, 2282, 5.2220, 4705.7323, 2189, 5.5559,
        553.5694, 2142, 1.4256, 16730.4637, 2109, 4.1483, 951.7184, 2030, 0.3713, 283.8593, 1992, 5.2221, 12168.0027,
        1986, 5.7747, 6309.3742, 1912, 3.8222, 23581.2582, 1889, 5.3863, 149854.4001, 1790, 2.2149, 13367.9726, 1748,
        4.5605, 135.0651, 1622, 5.9884, 11769.8537, 1508, 4.1957, 6256.7775, 1442, 4.1932, 242.7286, 1435, 3.7236,
        38.0277, 1397, 4.4014, 6681.2249, 1362, 1.8893, 7632.9433, 1250, 1.1305, 5.5229, 1205, 2.6223, 955.5997, 1200,
        1.0035, 632.7837, 1129, 0.1774, 4164.3120, 1083, 0.3273, 103.0928, 1052, 0.9387, 11926.2544, 1050, 5.3591,
        1592.5960, 1033, 6.1998, 6438.4962, 1001, 6.0291, 5746.2713, 980, 0.999, 11371.705, 980, 5.244, 27511.468, 938,
        2.624, 5760.498, 923, 0.483, 522.577, 922, 4.571, 4292.331, 905, 5.337, 6386.169, 862, 4.165, 7058.598, 841,
        3.299, 7234.794, 836, 4.539, 25132.303, 813, 6.112, 4732.031, 812, 6.271, 426.598, 801, 5.821, 28.449, 787,
        0.996, 5643.179, 776, 2.957, 23013.540, 769, 3.121, 7238.676, 758, 3.974, 11499.656, 735, 4.386, 316.392, 731,
        0.607, 11513.883, 719, 3.998, 74.782, 706, 0.323, 263.084, 676, 5.911, 90955.552, 663, 3.665, 17298.182, 653,
        5.791, 18073.705, 630, 4.717, 6836.645, 615, 1.458, 233141.314, 612, 1.075, 19804.827, 596, 3.321, 6283.009,
        596, 2.876, 6283.143, 555, 2.452, 12352.853, 541, 5.392, 419.485, 531, 0.382, 31441.678, 519, 4.065, 6208.294,
        513, 2.361, 10973.556, 494, 5.737, 9917.697, 450, 3.272, 11015.106, 449, 3.653, 206.186, 447, 2.064, 7079.374,
        435, 4.423, 5216.580, 421, 1.906, 245.832, 413, 0.921, 3738.761, 402, 0.840, 20.355, 387, 1.826, 11856.219, 379,
        2.344, 3.881, 374, 2.954, 3128.389, 370, 5.031, 536.805, 365, 1.018, 16200.773, 365, 1.083, 88860.057, 352,
        5.978, 3894.182, 352, 2.056, 244287.600, 351, 3.713, 6290.189, 340, 1.106, 14712.317, 339, 0.978, 8635.942, 339,
        3.202, 5120.601, 333, 0.837, 6496.375, 325, 3.479, 6133.513, 316, 5.089, 21228.392, 316, 1.328, 10873.986, 309,
        3.646, 10.637, 303, 1.802, 35371.887, 296, 3.397, 9225.539, 288, 6.026, 154717.610, 281, 2.585, 14314.168, 262,
        3.856, 266.607, 262, 2.579, 22483.849, 257, 1.561, 23543.231, 255, 3.949, 1990.745, 251, 3.744, 10575.407, 240,
        1.161, 10984.192, 238, 0.106, 7.046, 236, 4.272, 6040.347, 234, 3.577, 10969.965, 211, 3.714, 65147.620, 210,
        0.754, 13521.751, 207, 4.228, 5650.292, 202, 0.814, 170.673, 201, 4.629, 6037.244, 200, 0.381, 6172.870, 199,
        3.933, 6206.810, 199, 5.197, 6262.300, 197, 1.046, 18209.330, 195, 1.070, 5230.807, 195, 4.869, 36.028, 194,
        4.313, 6244.943, 192, 1.229, 709.933, 192, 5.595, 6282.096, 192, 0.602, 6284.056, 189, 3.744, 23.878, 188,
        1.904, 15.252, 188, 0.867, 22003.915, 182, 3.681, 15110.466, 181, 0.491, 1.484, 179, 3.222, 39302.097, 179,
        1.259, 12559.038,
        62833196674749, 0.000000000000, 0.000000000000, 20605886, 2.67823456, 6283.07584999, 430343, 2.635127,
        12566.151700, 42526, 1.59047, 3.52312, 11926, 5.79557, 26.29832, 10898, 2.96618, 1577.34354, 9348, 2.5921,
        18849.2275, 7212, 1.1385, 529.6910, 6777, 1.8747, 398.1490, 6733, 4.4092, 5507.5532, 5903, 2.8880, 5223.6939,
        5598, 2.1747, 155.4204, 4541, 0.3980, 796.2980, 3637, 0.4662, 775.5226, 2896, 2.6471, 7.1135, 2084, 5.3414,
        0.9803, 1910, 1.8463, 5486.7778, 1851, 4.9686, 213.2991, 1729, 2.9912, 6275.9623, 1623, 0.0322, 2544.3144, 1583,
        1.4305, 2146.1654, 1462, 1.2053, 10977.0788, 1246, 2.8343, 1748.0164, 1188, 3.2580, 5088.6288, 1181, 5.2738,
        1194.4470, 1151, 2.0750, 4694.0030, 1064, 0.7661, 553.5694, 997, 1.303, 6286.599, 972, 4.239, 1349.867, 945,
        2.700, 242.729, 858, 5.645, 951.718, 758, 5.301, 2352.866, 639, 2.650, 9437.763, 610, 4.666, 4690.480, 583,
        1.766, 1059.382, 531, 0.909, 3154.687, 522, 5.661, 71430.696, 520, 1.854, 801.821, 504, 1.425, 6438.496, 433,
        0.241, 6812.767, 426, 0.774, 10447.388, 413, 5.240, 7084.897, 374, 2.001, 8031.092, 356, 2.429, 14143.495, 350,
        4.800, 6279.553, 337, 0.888, 12036.461, 337, 3.862, 1592.596, 325, 3.400, 7632.943, 322, 0.616, 8429.241, 318,
        3.188, 4705.732, 297, 6.070, 4292.331, 295, 1.431, 5746.271, 290, 2.325, 20.355, 275, 0.935, 5760.498, 270,
        4.804, 7234.794, 253, 6.223, 6836.645, 228, 5.003, 17789.846, 225, 5.672, 11499.656, 215, 5.202, 11513.883, 208,
        3.955, 10213.286, 208, 2.268, 522.577, 206, 2.224, 5856.478, 206, 2.550, 25132.303, 203, 0.910, 6256.778, 189,
        0.532, 3340.612, 188, 4.735, 83996.847, 179, 1.474, 4164.312, 178, 3.025, 5.523, 177, 3.026, 5753.385, 159,
        4.637, 3.286, 157, 6.124, 5216.580, 155, 3.077, 6681.225, 154, 4.200, 13367.973, 143, 1.191, 3894.182, 138,
        3.093, 135.065, 136, 4.245, 426.598, 134, 5.765, 6040.347, 128, 3.085, 5643.179, 127, 2.092, 6290.189, 125,
        3.077, 11926.254, 125, 3.445, 536.805, 114, 3.244, 12168.003, 112, 2.318, 16730.464, 111, 3.901, 11506.770, 111,
        5.320, 23.878, 105, 3.750, 7860.419, 103, 2.447, 1990.745, 96, 0.82, 3.88, 96, 4.08, 6127.66, 91, 5.42, 206.19,
        91, 0.42, 7079.37, 88, 5.17, 11790.63, 81, 0.34, 9917.70, 80, 3.89, 10973.56, 78, 2.40, 1589.07, 78, 2.58,
        11371.70, 77, 3.98, 955.60, 77, 3.36, 36.03, 76, 1.30, 103.09, 75, 5.18, 10969.97, 75, 4.96, 6496.37, 73, 5.21,
        38.03, 72, 2.65, 6309.37, 70, 5.61, 3738.76, 69, 2.60, 3496.03, 69, 0.39, 15.25, 69, 2.78, 20.78, 65, 1.13,
        7058.60, 64, 4.28, 28.45, 61, 5.63, 10984.19, 60, 0.73, 419.48, 60, 5.28, 10575.41, 58, 5.55, 17298.18, 58,
        3.19, 4732.03,
        5291887, 0.0000000, 0.0000000, 871984, 1.072097, 6283.075850, 30913, 0.86729, 12566.15170, 2734, 0.0530, 3.5231,
        1633, 5.1883, 26.2983, 1575, 3.6846, 155.4204, 954, 0.757, 18849.228, 894, 2.057, 77713.771, 695, 0.827,
        775.523, 506, 4.663, 1577.344, 406, 1.031, 7.114, 381, 3.441, 5573.143, 346, 5.141, 796.298, 317, 6.053,
        5507.553, 302, 1.192, 242.729, 289, 6.117, 529.691, 271, 0.306, 398.149, 254, 2.280, 553.569, 237, 4.381,
        5223.694, 208, 3.754, 0.980, 168, 0.902, 951.718, 153, 5.759, 1349.867, 145, 4.364, 1748.016, 134, 3.721,
        1194.447, 125, 2.948, 6438.496, 122, 2.973, 2146.165, 110, 1.271, 161000.686, 104, 0.604, 3154.687, 100, 5.986,
        6286.599, 92, 4.80, 5088.63, 89, 5.23, 7084.90, 83, 3.31, 213.30, 76, 3.42, 5486.78, 71, 6.19, 4690.48, 68,
        3.43, 4694.00, 65, 1.60, 2544.31, 64, 1.98, 801.82, 61, 2.48, 10977.08, 50, 1.44, 6836.65, 49, 2.34, 1592.60,
        46, 1.31, 4292.33, 46, 3.81, 149854.40, 43, 0.04, 7234.79, 40, 4.94, 7632.94, 39, 1.57, 71430.70, 38, 3.17,
        6309.37, 35, 0.99, 6040.35, 35, 0.67, 1059.38, 31, 3.18, 2352.87, 31, 3.55, 8031.09, 30, 1.92, 10447.39, 30,
        2.52, 6127.66, 28, 4.42, 9437.76, 28, 2.71, 3894.18, 27, 0.67, 25132.30, 26, 5.27, 6812.77, 25, 0.55, 6279.55,
        23, 1.38, 4705.73, 22, 0.64, 6256.78, 20, 6.07, 640.88,
        28923, 5.84384, 6283.07585, 3496, 0.0000, 0.0000, 1682, 5.4877, 12566.1517, 296, 5.196, 155.420, 129, 4.722,
        3.523, 71, 5.30, 18849.23, 64, 5.97, 242.73, 40, 3.79, 553.57,
        11408, 3.14159, 0.00000, 772, 4.134, 6283.076, 77, 3.84, 12566.15, 42, 0.42, 155.42,
        88, 3.14, 0.00, 17, 2.77, 6283.08, 5, 2.01, 155.42, 3, 2.21, 12566.15,
        27962, 3.19870, 84334.66158, 10164, 5.42249, 5507.55324, 8045, 3.8801, 5223.6939, 4381, 3.7044, 2352.8662, 3193,
        4.0003, 1577.3435, 2272, 3.9847, 1047.7473, 1814, 4.9837, 6283.0758, 1639, 3.5646, 5856.4777, 1444, 3.7028,
        9437.7629, 1430, 3.4112, 10213.2855, 1125, 4.8282, 14143.4952, 1090, 2.0857, 6812.7668, 1037, 4.0566,
        71092.8814, 971, 3.473, 4694.003, 915, 1.142, 6620.890, 878, 4.440, 5753.385, 837, 4.993, 7084.897, 770, 5.554,
        167621.576, 719, 3.602, 529.691, 692, 4.326, 6275.962, 558, 4.410, 7860.419, 529, 2.484, 4705.732, 521, 6.250,
        18073.705,
        903, 3.897, 5507.553, 618, 1.730, 5223.694, 380, 5.244, 2352.866,
        166, 1.627, 84334.662,
        10001398880, 0.00000000000, 0.00000000000, 167069963, 3.098463508, 6283.075849991, 1395602, 3.0552461,
        12566.1517000, 308372, 5.198467, 77713.771468, 162846, 1.173877, 5753.384885, 157557, 2.846852, 7860.419392,
        92480, 5.45292, 11506.76977, 54244, 4.56409, 3930.20970, 47211, 3.66100, 5884.92685, 34598, 0.96369, 5507.55324,
        32878, 5.89984, 5223.69392, 30678, 0.29867, 5573.14280, 24319, 4.27350, 11790.62909, 21183, 5.84715, 1577.34354,
        18575, 5.02194, 10977.07880, 17484, 3.01194, 18849.22755, 10984, 5.05511, 5486.77784, 9832, 0.8868, 6069.7768,
        8650, 5.6896, 15720.8388, 8583, 1.2708, 161000.6857, 6490, 0.2725, 17260.1547, 6292, 0.9218, 529.6910, 5706,
        2.0137, 83996.8473, 5574, 5.2416, 71430.6956, 4938, 3.2450, 2544.3144, 4696, 2.5781, 775.5226, 4466, 5.5372,
        9437.7629, 4252, 6.0111, 6275.9623, 3897, 5.3607, 4694.0030, 3825, 2.3926, 8827.3903, 3749, 0.8295, 19651.0485,
        3696, 4.9011, 12139.5535, 3566, 1.6747, 12036.4607, 3454, 1.8427, 2942.4634, 3319, 0.2437, 7084.8968, 3192,
        0.1837, 5088.6288, 3185, 1.7778, 398.1490, 2846, 1.2134, 6286.5990, 2779, 1.8993, 6279.5527, 2628, 4.5890,
        10447.3878, 2460, 3.7866, 8429.2413, 2393, 4.9960, 5856.4777, 2359, 0.2687, 796.2980, 2329, 2.8078, 14143.4952,
        2210, 1.9500, 3154.6871, 2035, 4.6527, 2146.1654, 1951, 5.3823, 2352.8662, 1883, 0.6731, 149854.4001, 1833,
        2.2535, 23581.2582, 1796, 0.1987, 6812.7668, 1731, 6.1520, 16730.4637, 1717, 4.4332, 10213.2855, 1619, 5.2316,
        17789.8456, 1381, 5.1896, 8031.0923, 1364, 3.6852, 4705.7323, 1314, 0.6529, 13367.9726, 1041, 4.3329,
        11769.8537, 1017, 1.5939, 4690.4798, 998, 4.201, 6309.374, 966, 3.676, 27511.468, 874, 6.064, 1748.016, 779,
        3.674, 12168.003, 771, 0.312, 7632.943, 756, 2.626, 6256.778, 746, 5.648, 11926.254, 693, 2.924, 6681.225, 680,
        1.423, 23013.540, 674, 0.563, 3340.612, 663, 5.661, 11371.705, 659, 3.136, 801.821, 648, 2.650, 19804.827, 615,
        3.029, 233141.314, 612, 5.134, 1194.447, 563, 4.341, 90955.552, 552, 2.091, 17298.182, 534, 5.100, 31441.678,
        531, 2.407, 11499.656, 523, 4.624, 6438.496, 513, 5.324, 11513.883, 477, 0.256, 11856.219, 461, 1.722, 7234.794,
        458, 3.766, 6386.169, 458, 4.466, 5746.271, 423, 1.055, 5760.498, 422, 1.557, 7238.676, 415, 2.599, 7058.598,
        401, 3.030, 1059.382, 397, 1.201, 1349.867, 379, 4.907, 4164.312, 360, 5.707, 5643.179, 352, 3.626, 244287.600,
        348, 0.761, 10973.556, 342, 3.001, 4292.331, 336, 4.546, 4732.031, 334, 3.138, 6836.645, 324, 4.164, 9917.697,
        316, 1.691, 11015.106, 307, 0.238, 35371.887, 298, 1.306, 6283.143, 298, 1.750, 6283.009, 293, 5.738, 16200.773,
        286, 5.928, 14712.317, 281, 3.515, 21228.392, 280, 5.663, 8635.942, 277, 0.513, 26.298, 268, 4.207, 18073.705,
        266, 0.900, 12352.853, 260, 2.962, 25132.303, 255, 2.477, 6208.294, 242, 2.800, 709.933, 231, 1.054, 22483.849,
        229, 1.070, 14314.168, 216, 1.314, 154717.610, 215, 6.038, 10873.986, 200, 0.561, 7079.374, 198, 2.614, 951.718,
        197, 4.369, 167283.762, 186, 2.861, 5216.580, 183, 1.660, 39302.097, 183, 5.912, 3738.761, 175, 2.145, 6290.189,
        173, 2.168, 10575.407, 171, 3.702, 1592.596, 171, 1.343, 3128.389, 164, 5.550, 6496.375, 164, 5.856, 10984.192,
        161, 1.998, 10969.965, 161, 1.909, 6133.513, 157, 4.955, 25158.602, 154, 6.216, 23543.231, 153, 5.357,
        13521.751, 150, 5.770, 18209.330, 150, 5.439, 155.420, 139, 1.778, 9225.539, 139, 1.626, 5120.601, 128, 2.460,
        13916.019, 123, 0.717, 143571.324, 122, 2.654, 88860.057, 121, 4.414, 3894.182, 121, 1.192, 3.523, 120, 4.030,
        553.569, 119, 1.513, 17654.781, 117, 3.117, 14945.316, 113, 2.698, 6040.347, 110, 3.085, 43232.307, 109, 0.998,
        955.600, 108, 2.939, 17256.632, 107, 5.285, 65147.620, 103, 0.139, 11712.955, 103, 5.850, 213.299, 102, 3.046,
        6037.244, 101, 2.842, 8662.240, 100, 3.626, 6262.300, 98, 2.36, 6206.81, 98, 5.11, 6172.87, 98, 2.00, 15110.47,
        97, 2.67, 5650.29, 97, 2.75, 6244.94, 96, 4.02, 6282.10, 96, 5.31, 6284.06, 92, 0.10, 29088.81, 85, 3.26,
        20426.57, 84, 2.60, 28766.92, 81, 3.58, 10177.26, 80, 5.81, 5230.81, 78, 2.53, 16496.36, 77, 4.06, 6127.66, 73,
        0.04, 5481.25, 72, 5.96, 12559.04, 72, 5.92, 4136.91, 71, 5.49, 22003.91, 70, 3.41, 7.11, 69, 0.62, 11403.68,
        69, 3.90, 1589.07, 69, 1.96, 12416.59, 69, 4.51, 426.60, 67, 1.61, 11087.29, 66, 4.50, 47162.52, 66, 5.08,
        283.86, 66, 4.32, 16858.48, 65, 1.04, 6062.66, 64, 1.59, 18319.54, 63, 5.70, 45892.73, 63, 4.60, 66567.49, 63,
        3.82, 13517.87, 62, 2.62, 11190.38, 61, 1.54, 33019.02, 60, 5.58, 10344.30, 60, 5.38, 316428.23, 60, 5.78,
        632.78, 59, 6.12, 9623.69, 57, 0.16, 17267.27, 57, 3.86, 6076.89, 57, 1.98, 7668.64, 56, 4.78, 20199.09, 55,
        4.56, 18875.53, 55, 3.51, 17253.04, 54, 3.07, 226858.24, 54, 4.83, 18422.63, 53, 5.02, 12132.44, 52, 3.63,
        5333.90, 52, 0.97, 155427.54, 51, 3.36, 20597.24, 50, 0.99, 11609.86, 50, 2.21, 1990.75, 48, 1.62, 12146.67, 48,
        1.17, 12569.67, 47, 4.62, 5436.99, 47, 1.81, 12562.63, 47, 0.59, 21954.16, 47, 0.76, 7342.46, 46, 0.27, 4590.91,
        46, 3.77, 156137.48, 45, 5.66, 10454.50, 44, 5.84, 3496.03, 43, 0.24, 17996.03, 41, 5.93, 51092.73, 41, 4.21,
        12592.45, 40, 5.14, 1551.05, 40, 5.28, 15671.08, 39, 3.69, 18052.93, 39, 4.94, 24356.78, 38, 2.72, 11933.37, 38,
        5.23, 7477.52, 38, 4.99, 9779.11, 37, 3.70, 9388.01, 37, 4.44, 4535.06, 36, 2.16, 28237.23, 36, 2.54, 242.73,
        36, 0.22, 5429.88, 35, 6.15, 19800.95, 35, 2.92, 36949.23, 34, 5.63, 2379.16, 34, 5.73, 16460.33, 34, 5.11,
        5849.36, 33, 6.19, 6268.85,
        10301861, 1.10748970, 6283.07584999, 172124, 1.064423, 12566.151700, 70222, 3.14159, 0.00000, 3235, 1.0217,
        18849.2275, 3080, 2.8435, 5507.5532, 2497, 1.3191, 5223.6939, 1849, 1.4243, 1577.3435, 1008, 5.9138, 10977.0788,
        865, 1.420, 6275.962, 863, 0.271, 5486.778, 507, 1.686, 5088.629, 499, 6.014, 6286.599, 467, 5.987, 529.691,
        440, 0.518, 4694.003, 410, 1.084, 9437.763, 387, 4.750, 2544.314, 375, 5.071, 796.298, 352, 0.023, 83996.847,
        344, 0.949, 71430.696, 341, 5.412, 775.523, 322, 6.156, 2146.165, 286, 5.484, 10447.388, 284, 3.420, 2352.866,
        255, 6.132, 6438.496, 252, 0.243, 398.149, 243, 3.092, 4690.480, 225, 3.689, 7084.897, 220, 4.952, 6812.767,
        219, 0.420, 8031.092, 209, 1.282, 1748.016, 193, 5.314, 8429.241, 185, 1.820, 7632.943, 175, 3.229, 6279.553,
        173, 1.537, 4705.732, 158, 4.097, 11499.656, 158, 5.539, 3154.687, 150, 3.633, 11513.883, 148, 3.222, 7234.794,
        147, 3.653, 1194.447, 144, 0.817, 14143.495, 135, 6.151, 5746.271, 134, 4.644, 6836.645, 128, 2.693, 1349.867,
        123, 5.650, 5760.498, 118, 2.577, 13367.973, 113, 3.357, 17789.846, 110, 4.497, 4292.331, 108, 5.828, 12036.461,
        102, 5.621, 6256.778, 99, 1.14, 1059.38, 98, 0.66, 5856.48, 93, 2.32, 10213.29, 92, 0.77, 16730.46, 88, 1.50,
        11926.25, 86, 1.42, 5753.38, 85, 0.66, 155.42, 81, 1.64, 6681.22, 80, 4.11, 951.72, 66, 4.55, 5216.58, 65, 0.98,
        25132.30, 64, 4.19, 6040.35, 64, 0.52, 6290.19, 63, 1.51, 5643.18, 59, 6.18, 4164.31, 57, 2.30, 10973.56, 55,
        2.32, 11506.77, 55, 2.20, 1592.60, 55, 5.27, 3340.61, 54, 5.54, 553.57, 53, 5.04, 9917.70, 53, 0.92, 11371.70,
        52, 3.98, 17298.18, 52, 3.60, 10969.97, 49, 5.91, 3894.18, 49, 2.51, 6127.66, 48, 1.67, 12168.00, 46, 0.31,
        801.82, 42, 3.70, 10575.41, 42, 4.05, 10984.19, 40, 2.17, 7860.42, 40, 4.17, 26.30, 38, 5.82, 7058.60, 37, 3.39,
        6496.37, 36, 1.08, 6309.37, 36, 5.34, 7079.37, 34, 3.62, 11790.63, 32, 0.32, 16200.77, 31, 4.24, 3738.76, 29,
        4.55, 11856.22, 29, 1.26, 8635.94, 27, 3.45, 5884.93, 26, 5.08, 10177.26, 26, 5.38, 21228.39, 24, 2.26,
        11712.96, 24, 1.05, 242.73, 24, 5.59, 6069.78, 23, 3.63, 6284.06, 23, 1.64, 4732.03, 22, 3.46, 213.30, 21, 1.05,
        3496.03, 21, 3.92, 13916.02, 21, 4.01, 5230.81, 20, 5.16, 12352.85, 20, 0.69, 1990.75, 19, 2.73, 6062.66, 19,
        5.01, 11015.11, 18, 6.04, 6283.01, 18, 2.85, 7238.68, 18, 5.60, 6283.14, 18, 5.16, 17253.04, 18, 2.54, 14314.17,
        17, 1.58, 7.11, 17, 0.98, 3930.21, 17, 4.75, 17267.27, 16, 2.19, 6076.89, 16, 2.19, 18073.70, 16, 6.12, 3.52,
        16, 4.61, 9623.69, 16, 3.40, 16496.36, 15, 0.19, 9779.11, 15, 5.30, 13517.87, 15, 4.26, 3128.39, 15, 0.81,
        709.93, 14, 0.50, 25158.60, 14, 4.38, 4136.91, 13, 0.98, 65147.62, 13, 3.31, 154717.61, 13, 2.11, 1589.07, 13,
        1.92, 22483.85, 12, 6.03, 9225.54, 12, 1.53, 12559.04, 12, 5.82, 6282.10, 12, 5.61, 5642.20, 12, 2.38,
        167283.76, 12, 0.39, 12132.44, 12, 3.98, 4686.89, 12, 5.81, 12569.67, 12, 0.56, 5849.36, 11, 0.45, 6172.87, 11,
        5.80, 16858.48, 11, 6.22, 12146.67, 11, 2.27, 5429.88,
        435939, 5.784551, 6283.075850, 12363, 5.57935, 12566.15170, 1234, 3.1416, 0.0000, 879, 3.628, 77713.771, 569,
        1.870, 5573.143, 330, 5.470, 18849.228, 147, 4.480, 5507.553, 110, 2.842, 161000.686, 101, 2.815, 5223.694, 85,
        3.11, 1577.34, 65, 5.47, 775.52, 61, 1.38, 6438.50, 50, 4.42, 6286.60, 47, 3.66, 7084.90, 46, 5.39, 149854.40,
        42, 0.90, 10977.08, 40, 3.20, 5088.63, 35, 1.81, 5486.78, 32, 5.35, 3154.69, 30, 3.52, 796.30, 29, 4.62,
        4690.48, 28, 1.84, 4694.00, 27, 3.14, 71430.70, 27, 6.17, 6836.65, 26, 1.42, 2146.17, 25, 2.81, 1748.02, 24,
        2.18, 155.42, 23, 4.76, 7234.79, 21, 3.38, 7632.94, 21, 0.22, 4705.73, 20, 4.22, 1349.87, 20, 2.01, 1194.45, 20,
        4.58, 529.69, 19, 1.59, 6309.37, 18, 5.70, 6040.35, 18, 6.03, 4292.33, 17, 2.90, 9437.76, 17, 2.00, 8031.09, 17,
        5.78, 83996.85, 16, 0.05, 2544.31, 15, 0.95, 6127.66, 14, 0.36, 10447.39, 14, 1.48, 2352.87, 13, 0.77, 553.57,
        13, 5.48, 951.72, 13, 5.27, 6279.55, 13, 3.76, 6812.77, 11, 5.41, 6256.78, 10, 0.68, 1592.60, 10, 4.95, 398.15,
        10, 1.15, 3894.18, 10, 5.20, 244287.60, 10, 1.94, 11856.22, 9, 5.39, 25132.30, 8, 6.18, 1059.38, 8, 0.69,
        8429.24, 8, 5.85, 242.73, 7, 5.26, 14143.50, 7, 0.52, 801.82, 6, 2.24, 8635.94, 6, 4.00, 13367.97, 6, 2.77,
        90955.55, 6, 5.17, 7058.60, 5, 1.46, 233141.31, 5, 4.13, 7860.42, 5, 3.91, 26.30, 5, 3.89, 12036.46, 5, 5.58,
        6290.19, 5, 5.54, 1990.75, 5, 0.83, 11506.77, 5, 6.22, 6681.22, 4, 5.26, 10575.41, 4, 1.91, 7477.52, 4, 0.43,
        10213.29, 4, 1.09, 709.93, 4, 5.09, 11015.11, 4, 4.22, 88860.06, 4, 3.57, 7079.37, 4, 1.98, 6284.06, 4, 3.93,
        10973.56, 4, 6.18, 9917.70, 4, 0.36, 10177.26, 4, 2.75, 3738.76, 4, 3.33, 5643.18, 4, 5.36, 25158.60,
        14459, 4.27319, 6283.07585, 673, 3.917, 12566.152, 77, 0.00, 0.00, 25, 3.73, 18849.23, 4, 2.80, 6286.60,
        386, 2.564, 6283.076, 31, 2.27, 12566.15, 5, 3.44, 5573.14, 2, 2.05, 18849.23, 1, 2.06, 77713.77, 1, 4.41,
        161000.69, 1, 3.82, 149854.40, 1, 4.08, 6127.66, 1, 5.26, 6438.50,
        9, 1.22, 6283.08, 1, 0.66, 12566.15
      ],
      XL1:[
        [22639.586, 0.78475822, 8328.691424623, 1.5229241, 25.0719, -0.123598, 4586.438, 0.1873974, 7214.06286536, -2.184756, -18.860, 0.08280, 2369.914, 2.5429520, 15542.75428998, -0.661832, 6.212, -0.04080, 769.026, 3.140313, 16657.38284925, 3.04585, 50.144, -0.2472, 666.418, 1.527671, 628.30195521, -0.02664, 0.062, -0.0054, 411.596, 4.826607, 16866.9323150, -1.28012, -1.07, -0.0059, 211.656, 4.115028, -1114.6285593, -3.70768, -43.93, 0.2064, 205.436, 0.230523, 6585.7609101, -2.15812, -18.92, 0.0882, 191.956, 4.898507, 23871.4457146, 0.86109, 31.28, -0.164, 164.729, 2.586078, 14914.4523348, -0.6352, 6.15, -0.035, 147.321, 5.45530, -7700.3894694, -1.5496, -25.01, 0.118, 124.988, 0.48608, 7771.3771450, -0.3309, 3.11, -0.020, 109.380, 3.88323, 8956.9933798, 1.4963, 25.13, -0.129, 55.177, 5.57033, -1324.1780250, 0.6183, 7.3, -0.035, 45.100, 0.89898, 25195.623740, 0.2428, 24.0, -0.129, 39.533, 3.81213, -8538.240890, 2.8030, 26.1, -0.118, 38.430, 4.30115, 22756.817155, -2.8466, -12.6, 0.042, 36.124, 5.49587, 24986.074274, 4.5688, 75.2, -0.371, 30.773, 1.94559, 14428.125731, -4.3695, -37.7, 0.166, 28.397, 3.28586, 7842.364821, -2.2114, -18.8, 0.077, 24.358, 5.64142, 16171.056245, -0.6885, 6.3, -0.046, 18.585, 4.41371, -557.314280, -1.8538, -22.0, 0.10, 17.954, 3.58454, 8399.679100, -0.3576, 3.2, -0.03, 14.530, 4.9416, 23243.143759, 0.888, 31.2, -0.16, 14.380, 0.9709, 32200.137139, 2.384, 56.4, -0.29, 14.251, 5.7641, -2.301200, 1.523, 25.1, -0.12, 13.899, 0.3735, 31085.508580, -1.324, 12.4, -0.08, 13.194, 1.7595, -9443.319984, -5.231, -69.0, 0.33, 9.679, 3.0997, -16029.080894, -3.072, -50.1, 0.24, 9.366, 0.3016, 24080.995180, -3.465, -19.9, 0.08, 8.606, 4.1582, -1742.930514, -3.681, -44.0, 0.21, 8.453, 2.8416, 16100.068570, 1.192, 28.2, -0.14, 8.050, 2.6292, 14286.150380, -0.609, 6.1, -0.03, 7.630, 6.2388, 17285.684804, 3.019, 50.2, -0.25, 7.447, 1.4845, 1256.603910, -0.053, 0.1, -0.01, 7.371, 0.2736, 5957.458955, -2.131, -19.0, 0.09, 7.063, 5.6715, 33.757047, -0.308, -3.6, 0.02, 6.383, 4.7843, 7004.513400, 2.141, 32.4, -0.16, 5.742, 2.6572, 32409.686605, -1.942, 5, -0.05, 4.374, 4.3443, 22128.51520, -2.820, -13, 0.05, 3.998, 3.2545, 33524.31516, 1.766, 49, -0.25, 3.210, 2.2443, 14985.44001, -2.516, -16, 0.06, 2.915, 1.7138, 24499.74767, 0.834, 31, -0.17, 2.732, 1.9887, 13799.82378, -4.343, -38, 0.17, 2.568, 5.4122, -7072.08751, -1.576, -25, 0.11, 2.521, 3.2427, 8470.66678, -2.238, -19, 0.07, 2.489, 4.0719, -486.32660, -3.734, -44, 0.20, 2.146, 5.6135, -1952.47998, 0.645, 7, -0.03, 1.978, 2.7291, 39414.20000, 0.199, 37, -0.21, 1.934, 1.5682, 33314.76570, 6.092, 100, -0.5, 1.871, 0.4166, 30457.20662, -1.297, 12, -0.1, 1.753, 2.0582, -8886.00570, -3.38, -47, 0.2, 1.437, 2.386, -695.87607, 0.59, 7, 0, 1.373, 3.026, -209.54947, 4.33, 51, -0.2, 1.262, 5.940, 16728.37052, 1.17, 28, -0.1, 1.224, 6.172, 6656.74859, -4.04, -41, 0.2, 1.187, 5.873, 6099.43431, -5.89, -63, 0.3, 1.177, 1.014, 31571.83518, 2.41, 56, -0.3, 1.162, 3.840, 9585.29534, 1.47, 25, -0.1, 1.143, 5.639, 8364.73984, -2.18, -19, 0.1, 1.078, 1.229, 70.98768, -1.88, -22, 0.1, 1.059, 3.326, 40528.82856, 3.91, 81, -0.4, 0.990, 5.013, 40738.37803, -0.42, 30, -0.2, 0.948, 5.687, -17772.01141, -6.75, -94, 0.5, 0.876, 0.298, -0.35232, 0, 0, 0, 0.822, 2.994, 393.02097, 0, 0, 0, 0.788, 1.836, 8326.39022, 3.05, 50, -0.2, 0.752, 4.985, 22614.84180, 0.91, 31, -0.2, 0.740, 2.875, 8330.99262, 0, 0, 0, 0.669, 0.744, -24357.77232, -4.60, -75, 0.4, 0.644, 1.314, 8393.12577, -2.18, -19, 0.1, 0.639, 5.888, 575.33849, 0, 0, 0, 0.635, 1.116, 23385.11911, -2.87, -13, 0, 0.584, 5.197, 24428.75999, 2.71, 53, -0.3, 0.583, 3.513, -9095.55517, 0.95, 4, 0, 0.572, 6.059, 29970.88002, -5.03, -32, 0.1, 0.565, 2.960, 0.32863, 1.52, 25, -0.1, 0.561, 4.001, -17981.56087, -2.43, -43, 0.2, 0.557, 0.529, 7143.07519, -0.30, 3, 0, 0.546, 2.311, 25614.37623, 4.54, 75, -0.4, 0.536, 4.229, 15752.30376, -4.99, -45, 0.2, 0.493, 3.316, -8294.9344, -1.83, -29, 0.1, 0.491, 1.744, 8362.4485, 1.21, 21, -0.1, 0.478, 1.803, -10071.6219, -5.20, -69, 0.3, 0.454, 0.857, 15333.2048, 3.66, 57, -0.3, 0.445, 2.071, 8311.7707, -2.18, -19, 0.1, 0.426, 0.345, 23452.6932, -3.44, -20, 0.1, 0.420, 4.941, 33733.8646, -2.56, -2, 0, 0.413, 1.642, 17495.2343, -1.31, -1, 0, 0.404, 1.458, 23314.1314, -0.99, 9, -0.1, 0.395, 2.132, 38299.5714, -3.51, -6, 0, 0.382, 2.700, 31781.3846, -1.92, 5, 0, 0.375, 4.827, 6376.2114, 2.17, 32, -0.2, 0.361, 3.867, 16833.1753, -0.97, 3, 0, 0.358, 5.044, 15056.4277, -4.40, -38, 0.2, 0.350, 5.157, -8257.7037, -3.40, -47, 0.2, 0.344, 4.233, 157.7344, 0, 0, 0, 0.340, 2.672, 13657.8484, -0.58, 6, 0, 0.329, 5.610, 41853.0066, 3.29, 74, -0.4, 0.325, 5.895, -39.8149, 0, 0, 0, 0.309, 4.387, 21500.2132, -2.79, -13, 0.1, 0.302, 1.278, 786.0419, 0, 0, 0, 0.302, 5.341, -24567.3218, -0.27, -24, 0.1, 0.301, 1.045, 5889.8848, -1.57, -12, 0, 0.294, 4.201, -2371.2325, -3.65, -44, 0.2, 0.293, 3.704, 21642.1886, -6.55, -57, 0.2, 0.290, 4.069, 32828.4391, 2.36, 56, -0.3, 0.289, 3.472, 31713.8105, -1.35, 12, -0.1, 0.285, 5.407, -33.7814, 0.31, 4, 0, 0.283, 5.998, -16.9207, -3.71, -44, 0.2, 0.283, 2.772, 38785.8980, 0.23, 37, -0.2, 0.274, 5.343, 15613.7420, -2.54, -16, 0.1, 0.263, 3.997, 25823.9257, 0.22, 24, -0.1, 0.254, 0.600, 24638.3095, -1.61, 2, 0, 0.253, 1.344, 6447.1991, 0.29, 10, -0.1, 0.250, 0.887, 141.9754, -3.76, -44, 0.2, 0.247, 0.317, 5329.1570, -2.10, -19, 0.1, 0.245, 0.141, 36.0484, -3.71, -44, 0.2, 0.231, 2.287, 14357.1381, -2.49, -16, 0.1, 0.227, 5.158, 2.6298, 0, 0, 0, 0.219, 5.085, 47742.8914, 1.72, 63, -0.3, 0.211, 2.145, 6638.7244, -2.18, -19, 0.1, 0.201, 4.415, 39623.7495, -4.13, -14, 0, 0.194, 2.091, 588.4927, 0, 0, 0, 0.193, 3.057, -15400.7789, -3.10, -50, 0, 0.186, 5.598, 16799.3582, -0.72, 6, 0, 0.185, 3.886, 1150.6770, 0, 0, 0, 0.183, 1.619, 7178.0144, 1.52, 25, 0, 0.181, 2.635, 8328.3391, 1.52, 25, 0, 0.181, 2.077, 8329.0437, 1.52, 25, 0, 0.179, 3.215, -9652.8694, -0.90, -18, 0, 0.176, 1.716, -8815.0180, -5.26, -69, 0, 0.175, 5.673, 550.7553, 0, 0, 0, 0.170, 2.060, 31295.0580, -5.6, -39, 0, 0.167, 1.239, 7211.7617, -0.7, 6, 0, 0.165, 4.499, 14967.4158, -0.7, 6, 0, 0.164, 3.595, 15540.4531, 0.9, 31, 0, 0.164, 4.237, 522.3694, 0, 0, 0, 0.163, 4.633, 15545.0555, -2.2, -19, 0, 0.161, 0.478, 6428.0209, -2.2, -19, 0, 0.158, 2.03, 13171.5218, -4.3, -38, 0, 0.157, 2.28, 7216.3641, -3.7, -44, 0, 0.154, 5.65, 7935.6705, 1.5, 25, 0, 0.152, 0.46, 29828.9047, -1.3, 12, 0, 0.151, 1.19, -0.7113, 0, 0, 0, 0.150, 1.42, 23942.4334, -1.0, 9, 0, 0.144, 2.75, 7753.3529, 1.5, 25, 0, 0.137, 2.08, 7213.7105, -2.2, -19, 0, 0.137, 1.44, 7214.4152, -2.2, -19, 0, 0.136, 4.46, -1185.6162, -1.8, -22, 0, 0.136, 3.03, 8000.1048, -2.2, -19, 0, 0.134, 2.83, 14756.7124, -0.7, 6, 0, 0.131, 5.05, 6821.0419, -2.2, -19, 0, 0.128, 5.99, -17214.6971, -4.9, -72, 0, 0.127, 5.35, 8721.7124, 1.5, 25, 0, 0.126, 4.49, 46628.2629, -2.0, 19, 0, 0.125, 5.94, 7149.6285, 1.5, 25, 0, 0.124, 1.09, 49067.0695, 1.1, 55, 0, 0.121, 2.88, 15471.7666, 1.2, 28, 0, 0.111, 3.92, 41643.4571, 7.6, 125, -1, 0.110, 1.96, 8904.0299, 1.5, 25, 0, 0.106, 3.30, -18.0489, -2.2, -19, 0, 0.105, 2.30, -4.9310, 1.5, 25, 0, 0.104, 2.22, -6.5590, -1.9, -22, 0, 0.101, 1.44, 1884.9059, -0.1, 0, 0, 0.100, 5.92, 5471.1324, -5.9, -63, 0, 0.099, 1.12, 15149.7333, -0.7, 6, 0, 0.096, 4.73, 15508.9972, -0.4, 10, 0, 0.095, 5.18, 7230.9835, 1.5, 25, 0, 0.093, 3.37, 39900.5266, 3.9, 81, 0, 0.092, 2.01, 25057.0619, 2.7, 53, 0, 0.092, 1.21, -79.6298, 0, 0, 0, 0.092, 1.65, -26310.2523, -4.0, -68, 0, 0.091, 1.01, 42062.5561, -1.0, 23, 0, 0.090, 6.10, 29342.5781, -5.0, -32, 0, 0.090, 4.43, 15542.4020, -0.7, 6, 0, 0.090, 3.80, 15543.1066, -0.7, 6, 0, 0.089, 4.15, 6063.3859, -2.2, -19, 0, 0.086, 4.03, 52.9691, 0, 0, 0, 0.085, 0.49, 47952.4409, -2.6, 11, 0, 0.085, 1.60, 7632.8154, 2.1, 32, 0, 0.084, 0.22, 14392.0773, -0.7, 6, 0, 0.083, 6.22, 6028.4466, -4.0, -41, 0, 0.083, 0.63, -7909.9389, 2.8, 26, 0, 0.083, 5.20, -77.5523, 0, 0, 0, 0.082, 2.74, 8786.1467, -2.2, -19, 0, 0.080, 2.43, 9166.5428, -2.8, -26, 0, 0.080, 3.70, -25405.1732, 4.1, 27, 0, 0.078, 5.68, 48857.5200, 5.4, 106, -1, 0.077, 1.85, 8315.5735, -2.2, -19, 0, 0.075, 5.46, -18191.1103, 1.9, 8, 0, 0.075, 1.41, -16238.6304, 1.3, 1, 0, 0.074, 5.06, 40110.0761, -0.4, 30, 0, 0.072, 2.10, 64.4343, -3.7, -44, 0, 0.071, 2.17, 37671.2695, -3.5, -6, 0, 0.069, 1.71, 16693.4313, -0.7, 6, 0, 0.069, 3.33, -26100.7028, -8.3, -119, 1, 0.068, 1.09, 8329.4028, 1.5, 25, 0, 0.068, 3.62, 8327.9801, 1.5, 25, 0, 0.068, 2.41, 16833.1509, -1.0, 3, 0, 0.067, 3.40, 24709.2971, -3.5, -20, 0, 0.067, 1.65, 8346.7156, -0.3, 3, 0, 0.066, 2.61, 22547.2677, 1.5, 39, 0, 0.066, 3.50, 15576.5113, -1.0, 3, 0, 0.065, 5.76, 33037.9886, -2.0, 5, 0, 0.065, 4.58, 8322.1325, -0.3, 3, 0, 0.065, 6.20, 17913.9868, 3.0, 50, 0, 0.065, 1.50, 22685.8295, -1.0, 9, 0, 0.065, 2.37, 7180.3058, -1.9, -15, 0, 0.064, 1.06, 30943.5332, 2.4, 56, 0, 0.064, 1.89, 8288.8765, 1.5, 25, 0, 0.064, 4.70, 6.0335, 0.3, 4, 0, 0.063, 2.83, 8368.5063, 1.5, 25, 0, 0.063, 5.66, -2580.7819, 0.7, 7, 0, 0.062, 3.78, 7056.3285, -2.2, -19, 0, 0.061, 1.49, 8294.9100, 1.8, 29, 0, 0.061, 0.12, -10281.1714, -0.9, -18, 0, 0.061, 3.06, -8362.4729, -1.2, -21, 0, 0.061, 4.43, 8170.9571, 1.5, 25, 0, 0.059, 5.78, -13.1179, -3.7, -44, 0, 0.059, 5.97, 6625.5702, -2.2, -19, 0, 0.058, 5.01, -0.5080, -0.3, 0, 0, 0.058, 2.73, 7161.0938, -2.2, -19, 0, 0.057, 0.19, 7214.0629, -2.2, -19, 0, 0.057, 4.00, 22199.5029, -4.7, -35, 0, 0.057, 5.38, 8119.1420, 5.8, 76, 0, 0.056, 1.07, 7542.6495, 1.5, 25, 0, 0.056, 0.28, 8486.4258, 1.5, 25, 0, 0.054, 4.19, 16655.0816, 4.6, 75, 0, 0.053, 0.72, 7267.0320, -2.2, -19, 0, 0.053, 3.12, 12.6192, 0.6, 7, 0, 0.052, 2.99, -32896.013, -1.8, -49, 0, 0.052, 3.46, 1097.708, 0, 0, 0, 0.051, 5.37, -6443.786, -1.6, -25, 0, 0.051, 1.35, 7789.401, -2.2, -19, 0, 0.051, 5.83, 40042.502, 0.2, 38, 0, 0.051, 3.63, 9114.733, 1.5, 25, 0, 0.050, 1.51, 8504.484, -2.5, -22, 0, 0.050, 5.23, 16659.684, 1.5, 25, 0, 0.050, 1.15, 7247.820, -2.5, -23, 0, 0.047, 0.25, -1290.421, 0.3, 0, 0, 0.047, 4.67, -32686.464, -6.1, -100, 0, 0.047, 3.49, 548.678, 0, 0, 0, 0.047, 2.37, 6663.308, -2.2, -19, 0, 0.046, 0.98, 1572.084, 0, 0, 0, 0.046, 2.04, 14954.262, -0.7, 6, 0, 0.046, 3.72, 6691.693, -2.2, -19, 0, 0.045, 6.19, -235.287, 0, 0, 0, 0.044, 2.96, 32967.001, -0.1, 27, 0, 0.044, 3.82, -1671.943, -5.6, -66, 0, 0.043, 5.82, 1179.063, 0, 0, 0, 0.043, 0.07, 34152.617, 1.7, 49, 0, 0.043, 3.71, 6514.773, -0.3, 0, 0, 0.043, 5.62, 15.732, -2.5, -23, 0, 0.043, 5.80, 8351.233, -2.2, -19, 0, 0.042, 0.27, 7740.199, 1.5, 25, 0, 0.042, 6.14, 15385.020, -0.7, 6, 0, 0.042, 6.13, 7285.051, -4.1, -41, 0, 0.041, 1.27, 32757.451, 4.2, 78, 0, 0.041, 4.46, 8275.722, 1.5, 25, 0, 0.040, 0.23, 8381.661, 1.5, 25, 0, 0.040, 5.87, -766.864, 2.5, 29, 0, 0.040, 1.66, 254.431, 0, 0, 0, 0.040, 0.40, 9027.981, -0.4, 0, 0, 0.040, 2.96, 7777.936, 1.5, 25, 0, 0.039, 4.67, 33943.068, 6.1, 100, 0, 0.039, 3.52, 8326.062, 1.5, 25, 0, 0.039, 3.75, 21013.887, -6.5, -57, 0, 0.039, 5.60, 606.978, 0, 0, 0, 0.039, 1.19, 8331.321, 1.5, 25, 0, 0.039, 2.84, 7211.433, -2.2, -19, 0, 0.038, 0.67, 7216.693, -2.2, -19, 0, 0.038, 6.22, 25161.867, 0.6, 28, 0, 0.038, 4.40, 7806.322, 1.5, 25, 0, 0.038, 4.16, 9179.168, -2.2, -19, 0, 0.037, 4.73, 14991.999, -0.7, 6, 0, 0.036, 0.35, 67.514, -0.6, -7, 0, 0.036, 3.70, 25266.611, -1.6, 0, 0, 0.036, 5.39, 16328.796, -0.7, 6, 0, 0.035, 1.44, 7174.248, -2.2, -19, 0, 0.035, 5.00, 15684.730, -4.4, -38, 0, 0.035, 0.39, -15.419, -2.2, -19, 0, 0.035, 6.07, 15020.385, -0.7, 6, 0, 0.034, 6.01, 7371.797, -2.2, -19, 0, 0.034, 0.96, -16623.626, -3.4, -54, 0, 0.033, 6.24, 9479.368, 1.5, 25, 0, 0.033, 3.21, 23661.896, 5.2, 82, 0, 0.033, 4.06, 8311.418, -2.2, -19, 0, 0.033, 2.40, 1965.105, 0, 0, 0, 0.033, 5.17, 15489.785, -0.7, 6, 0, 0.033, 5.03, 21986.540, 0.9, 31, 0, 0.033, 4.10, 16691.140, 2.7, 46, 0, 0.033, 5.13, 47114.589, 1.7, 63, 0, 0.033, 4.45, 8917.184, 1.5, 25, 0, 0.033, 4.23, 2.078, 0, 0, 0, 0.032, 2.33, 75.251, 1.5, 25, 0, 0.032, 2.10, 7253.878, -2.2, -19, 0, 0.032, 3.11, -0.224, 1.5, 25, 0, 0.032, 4.43, 16640.462, -0.7, 6, 0, 0.032, 5.68, 8328.363, 0, 0, 0, 0.031, 5.32, 8329.020, 3.0, 50, 0, 0.031, 3.70, 16118.093, -0.7, 6, 0, 0.030, 3.67, 16721.817, -0.7, 6, 0, 0.030, 5.27, -1881.492, -1.2, -15, 0, 0.030, 5.72, 8157.839, -2.2, -19, 0, 0.029, 5.73, -18400.313, -6.7, -94, 0, 0.029, 2.76, 16.000, -2.2, -19, 0, 0.029, 1.75, 8879.447, 1.5, 25, 0, 0.029, 0.32, 8851.061, 1.5, 25, 0, 0.029, 0.90, 14704.903, 3.7, 57, 0, 0.028, 2.90, 15595.723, -0.7, 6, 0, 0.028, 5.88, 16864.631, 0.2, 24, 0, 0.028, 0.63, 16869.234, -2.8, -26, 0, 0.028, 4.04, -18609.863, -2.4, -43, 0, 0.027, 5.83, 6727.736, -5.9, -63, 0, 0.027, 6.12, 418.752, 4.3, 51, 0, 0.027, 0.14, 41157.131, 3.9, 81, 0, 0.026, 3.80, 15.542, 0, 0, 0, 0.026, 1.68, 50181.698, 4.8, 99, -1, 0.026, 0.32, 315.469, 0, 0, 0, 0.025, 5.67, 19.188, 0.3, 0, 0, 0.025, 3.16, 62.133, -2.2, -19, 0, 0.025, 3.76, 15502.939, -0.7, 6, 0, 0.025, 4.53, 45999.961, -2.0, 19, 0, 0.024, 3.21, 837.851, -4.4, -51, 0, 0.024, 2.82, 38157.596, 0.3, 37, 0, 0.024, 5.21, 15540.124, -0.7, 6, 0, 0.024, 0.26, 14218.576, 0, 13, 0, 0.024, 3.01, 15545.384, -0.7, 6, 0, 0.024, 1.16, -17424.247, -0.6, -21, 0, 0.023, 2.34, -67.574, 0.6, 7, 0, 0.023, 2.44, 18.024, -1.9, -22, 0, 0.023, 3.70, 469.400, 0, 0, 0, 0.023, 0.72, 7136.511, -2.2, -19, 0, 0.023, 4.50, 15582.569, -0.7, 6, 0, 0.023, 2.80, -16586.395, -4.9, -72, 0, 0.023, 1.51, 80.182, 0, 0, 0, 0.023, 1.09, 5261.583, -1.5, -12, 0, 0.023, 0.56, 54956.954, -0.5, 44, 0, 0.023, 4.01, 8550.860, -2.2, -19, 0, 0.023, 4.46, 38995.448, -4.1, -14, 0, 0.023, 3.82, 2358.126, 0, 0, 0, 0.022, 3.77, 32271.125, 0.5, 34, 0, 0.022, 0.82, 15935.775, -0.7, 6, 0, 0.022, 1.07, 24013.421, -2.9, -13, 0, 0.022, 0.40, 8940.078, -2.2, -19, 0, 0.022, 2.06, 15700.489, -0.7, 6, 0, 0.022, 4.27, 15124.002, -5.0, -45, 0, 0.021, 1.16, 56071.583, 3.2, 88, 0, 0.021, 5.58, 9572.189, -2.2, -19, 0, 0.020, 1.70, -17.273, -3.7, -44, 0, 0.020, 3.05, 214.617, 0, 0, 0, 0.020, 4.41, 8391.048, -2.2, -19, 0, 0.020, 5.95, 23869.145, 2.4, 56, 0, 0.020, 0.42, 40947.927, -4.7, -21, 0, 0.019, 1.39, 5818.897, 0.3, 10, 0, 0.019, 0.71, 23873.747, -0.7, 6, 0, 0.019, 2.81, 7291.615, -2.2, -19, 0, 0.019, 5.09, 8428.018, -2.2, -19, 0, 0.019, 4.14, 6518.187, -1.6, -12, 0, 0.019, 3.85, 21.330, 0, 0, 0, 0.018, 0.66, 14445.046, -0.7, 6, 0, 0.018, 1.65, 0.966, -4.0, -48, 0, 0.018, 5.64, -17143.709, -6.8, -94, 0, 0.018, 6.01, 7736.432, -2.2, -19, 0, 0.018, 2.74, 31153.083, -1.9, 5, 0, 0.018, 4.58, 6116.355, -2.2, -19, 0, 0.018, 2.28, 46.401, 0.3, 0, 0, 0.018, 3.80, 10213.597, 1.4, 25, 0, 0.018, 2.84, 56281.132, -1.1, 36, 0, 0.018, 3.53, 8249.062, 1.5, 25, 0, 0.017, 4.43, 20871.911, -3, -13, 0, 0.017, 4.44, 627.596, 0, 0, 0, 0.017, 1.85, 628.308, 0, 0, 0, 0.017, 1.19, 8408.321, 2, 25, 0, 0.017, 1.95, 7214.056, -2, -19, 0, 0.017, 1.57, 7214.070, -2, -19, 0, 0.017, 1.65, 13870.811, -6, -60, 0, 0.017, 0.30, 22.542, -4, -44, 0, 0.017, 2.62, -119.445, 0, 0, 0, 0.016, 4.87, 5747.909, 2, 32, 0, 0.016, 4.45, 14339.108, -1, 6, 0, 0.016, 1.83, 41366.680, 0, 30, 0, 0.016, 4.53, 16309.618, -3, -23, 0, 0.016, 2.54, 15542.754, -1, 6, 0, 0.016, 6.05, 1203.646, 0, 0, 0, 0.015, 5.2, 2751.147, 0, 0, 0, 0.015, 1.8, -10699.924, -5, -69, 0, 0.015, 0.4, 22824.391, -3, -20, 0, 0.015, 2.1, 30666.756, -6, -39, 0, 0.015, 2.1, 6010.417, -2, -19, 0, 0.015, 0.7, -23729.470, -5, -75, 0, 0.015, 1.4, 14363.691, -1, 6, 0, 0.015, 5.8, 16900.689, -2, 0, 0, 0.015, 5.2, 23800.458, 3, 53, 0, 0.015, 5.3, 6035.000, -2, -19, 0, 0.015, 1.2, 8251.139, 2, 25, 0, 0.015, 3.6, -8.860, 0, 0, 0, 0.015, 0.8, 882.739, 0, 0, 0, 0.015, 3.0, 1021.329, 0, 0, 0, 0.015, 0.6, 23296.107, 1, 31, 0, 0.014, 5.4, 7227.181, 2, 25, 0, 0.014, 0.1, 7213.352, -2, -19, 0, 0.014, 4.0, 15506.706, 3, 50, 0, 0.014, 3.4, 7214.774, -2, -19, 0, 0.014, 4.6, 6665.385, -2, -19, 0, 0.014, 0.1, -8.636, -2, -22, 0, 0.014, 3.1, 15465.202, -1, 6, 0, 0.014, 4.9, 508.863, 0, 0, 0, 0.014, 3.5, 8406.244, 2, 25, 0, 0.014, 1.3, 13313.497, -8, -82, 0, 0.014, 2.8, 49276.619, -3, 0, 0, 0.014, 0.1, 30528.194, -3, -10, 0, 0.013, 1.7, 25128.050, 1, 31, 0, 0.013, 2.9, 14128.405, -1, 6, 0, 0.013, 3.4, 57395.761, 3, 80, 0, 0.013, 2.7, 13029.546, -1, 6, 0, 0.013, 3.9, 7802.556, -2, -19, 0, 0.013, 1.6, 8258.802, -2, -19, 0, 0.013, 2.2, 8417.709, -2, -19, 0, 0.013, 0.7, 9965.210, -2, -19, 0, 0.013, 3.4, 50391.247, 0, 48, 0, 0.013, 3.0, 7134.433, -2, -19, 0, 0.013, 2.9, 30599.182, -5, -31, 0, 0.013, 3.6, -9723.857, 1, 0, 0, 0.013, 4.8, 7607.084, -2, -19, 0, 0.012, 0.8, 23837.689, 1, 35, 0, 0.012, 3.6, 4.409, -4, -44, 0, 0.012, 5.0, 16657.031, 3, 50, 0, 0.012, 4.4, 16657.735, 3, 50, 0, 0.012, 1.1, 15578.803, -4, -38, 0, 0.012, 6.0, -11.490, 0, 0, 0, 0.012, 1.9, 8164.398, 0, 0, 0, 0.012, 2.4, 31852.372, -4, -17, 0, 0.012, 2.4, 6607.085, -2, -19, 0, 0.012, 4.2, 8359.870, 0, 0, 0, 0.012, 0.5, 5799.713, -2, -19, 0, 0.012, 2.7, 7220.622, 0, 0, 0, 0.012, 4.3, -139.720, 0, 0, 0, 0.012, 2.3, 13728.836, -2, -16, 0, 0.011, 3.6, 14912.146, 1, 31, 0, 0.011, 4.7, 14916.748, -2, -19, 0],
        [1.67680, 4.66926, 628.301955, -0.0266, 0.1, -0.005, 0.51642, 3.3721, 6585.760910, -2.158, -18.9, 0.09, 0.41383, 5.7277, 14914.452335, -0.635, 6.2, -0.04, 0.37115, 3.9695, 7700.389469, 1.550, 25.0, -0.12, 0.27560, 0.7416, 8956.993380, 1.496, 25.1, -0.13, 0.24599, 4.2253, -2.301200, 1.523, 25.1, -0.12, 0.07118, 0.1443, 7842.36482, -2.211, -19, 0.08, 0.06128, 2.4998, 16171.05625, -0.688, 6, 0, 0.04516, 0.443, 8399.67910, -0.36, 3, 0, 0.04048, 5.771, 14286.15038, -0.61, 6, 0, 0.03747, 4.626, 1256.60391, -0.05, 0, 0, 0.03707, 3.415, 5957.45895, -2.13, -19, 0.1, 0.03649, 1.800, 23243.14376, 0.89, 31, -0.2, 0.02438, 0.042, 16029.08089, 3.07, 50, -0.2, 0.02165, 1.017, -1742.93051, -3.68, -44, 0.2, 0.01923, 3.097, 17285.68480, 3.02, 50, -0.3, 0.01692, 1.280, 0.3286, 1.52, 25, -0.1, 0.01361, 0.298, 8326.3902, 3.05, 50, -0.2, 0.01293, 4.013, 7072.0875, 1.58, 25, -0.1, 0.01276, 4.413, 8330.9926, 0, 0, 0, 0.01270, 0.101, 8470.6668, -2.24, -19, 0.1, 0.01097, 1.203, 22128.5152, -2.82, -13, 0, 0.01088, 2.545, 15542.7543, -0.66, 6, 0, 0.00835, 0.190, 7214.0629, -2.18, -19, 0.1, 0.00734, 4.855, 24499.7477, 0.83, 31, -0.2, 0.00686, 5.130, 13799.8238, -4.34, -38, 0.2, 0.00631, 0.930, -486.3266, -3.73, -44, 0, 0.00585, 0.699, 9585.2953, 1.5, 25, 0, 0.00566, 4.073, 8328.3391, 1.5, 25, 0, 0.00566, 0.638, 8329.0437, 1.5, 25, 0, 0.00539, 2.472, -1952.4800, 0.6, 7, 0, 0.00509, 2.88, -0.7113, 0, 0, 0, 0.00469, 3.56, 30457.2066, -1.3, 12, 0, 0.00387, 0.78, -0.3523, 0, 0, 0, 0.00378, 1.84, 22614.8418, 0.9, 31, 0, 0.00362, 5.53, -695.8761, 0.6, 7, 0, 0.00317, 2.80, 16728.3705, 1.2, 28, 0, 0.00303, 6.07, 157.7344, 0, 0, 0, 0.00300, 2.53, 33.7570, -0.3, -4, 0, 0.00295, 4.16, 31571.8352, 2.4, 56, 0, 0.00289, 5.98, 7211.7617, -0.7, 6, 0, 0.00285, 2.06, 15540.4531, 0.9, 31, 0, 0.00283, 2.65, 2.6298, 0, 0, 0, 0.00282, 6.17, 15545.0555, -2.2, -19, 0, 0.00278, 1.23, -39.8149, 0, 0, 0, 0.00272, 3.82, 7216.3641, -3.7, -44, 0, 0.00270, 4.37, 70.9877, -1.9, -22, 0, 0.00256, 5.81, 13657.8484, -0.6, 6, 0, 0.00244, 5.64, -0.2237, 1.5, 25, 0, 0.00240, 2.96, 8311.7707, -2.2, -19, 0, 0.00239, 0.87, -33.7814, 0.3, 4, 0, 0.00216, 2.31, 15.9995, -2.2, -19, 0, 0.00186, 3.46, 5329.1570, -2.1, -19, 0, 0.00169, 2.40, 24357.772, 4.6, 75, 0, 0.00161, 5.80, 8329.403, 1.5, 25, 0, 0.00161, 5.20, 8327.980, 1.5, 25, 0, 0.00160, 4.26, 23385.119, -2.9, -13, 0, 0.00156, 1.26, 550.755, 0, 0, 0, 0.00155, 1.25, 21500.213, -2.8, -13, 0, 0.00152, 0.60, -16.921, -3.7, -44, 0, 0.00150, 2.71, -79.630, 0, 0, 0, 0.00150, 5.29, 15.542, 0, 0, 0, 0.00148, 1.06, -2371.232, -3.7, -44, 0, 0.00141, 0.77, 8328.691, 1.5, 25, 0, 0.00141, 3.67, 7143.075, -0.3, 0, 0, 0.00138, 5.45, 25614.376, 4.5, 75, 0, 0.00129, 4.90, 23871.446, 0.9, 31, 0, 0.00126, 4.03, 141.975, -3.8, -44, 0, 0.00124, 6.01, 522.369, 0, 0, 0, 0.00120, 4.94, -10071.622, -5.2, -69, 0, 0.00118, 5.07, -15.419, -2.2, -19, 0, 0.00107, 3.49, 23452.693, -3.4, -20, 0, 0.00104, 4.78, 17495.234, -1.3, 0, 0, 0.00103, 1.44, -18.049, -2.2, -19, 0, 0.00102, 5.63, 15542.402, -0.7, 6, 0, 0.00102, 2.59, 15543.107, -0.7, 6, 0, 0.00100, 4.11, -6.559, -1.9, -22, 0, 0.00097, 0.08, 15400.779, 3.1, 50, 0, 0.00096, 5.84, 31781.385, -1.9, 5, 0, 0.00094, 1.08, 8328.363, 0, 0, 0, 0.00094, 2.46, 16799.358, -0.7, 6, 0, 0.00094, 1.69, 6376.211, 2.2, 32, 0, 0.00093, 3.64, 8329.020, 3.0, 50, 0, 0.00093, 2.65, 16655.082, 4.6, 75, 0, 0.00090, 1.90, 15056.428, -4.4, -38, 0, 0.00089, 1.59, 52.969, 0, 0, 0, 0.00088, 2.02, -8257.704, -3.4, -47, 0, 0.00088, 3.02, 7213.711, -2.2, -19, 0, 0.00087, 0.50, 7214.415, -2.2, -19, 0, 0.00087, 0.49, 16659.684, 1.5, 25, 0, 0.00082, 5.64, -4.931, 1.5, 25, 0, 0.00079, 5.17, 13171.522, -4.3, -38, 0, 0.00076, 3.60, 29828.905, -1.3, 12, 0, 0.00076, 4.08, 24567.322, 0.3, 24, 0, 0.00076, 4.58, 1884.906, -0.1, 0, 0, 0.00073, 0.33, 31713.811, -1.4, 12, 0, 0.00073, 0.93, 32828.439, 2.4, 56, 0, 0.00071, 5.91, 38785.898, 0.2, 37, 0, 0.00069, 2.20, 15613.742, -2.5, -16, 0, 0.00066, 3.87, 15.732, -2.5, -23, 0, 0.00066, 0.86, 25823.926, 0.2, 24, 0, 0.00065, 2.52, 8170.957, 1.5, 25, 0, 0.00063, 0.18, 8322.132, -0.3, 0, 0, 0.00060, 5.84, 8326.062, 1.5, 25, 0, 0.00060, 5.15, 8331.321, 1.5, 25, 0, 0.00060, 2.18, 8486.426, 1.5, 25, 0, 0.00058, 2.30, -1.731, -4, -44, 0, 0.00058, 5.43, 14357.138, -2, -16, 0, 0.00057, 3.09, 8294.910, 2, 29, 0, 0.00057, 4.67, -8362.473, -1, -21, 0, 0.00056, 4.15, 16833.151, -1, 0, 0, 0.00054, 1.93, 7056.329, -2, -19, 0, 0.00054, 5.27, 8315.574, -2, -19, 0, 0.00052, 5.6, 8311.418, -2, -19, 0, 0.00052, 2.7, -77.552, 0, 0, 0, 0.00051, 4.3, 7230.984, 2, 25, 0, 0.00050, 0.4, -0.508, 0, 0, 0, 0.00049, 5.4, 7211.433, -2, -19, 0, 0.00049, 4.4, 7216.693, -2, -19, 0, 0.00049, 4.3, 16864.631, 0, 24, 0, 0.00049, 2.2, 16869.234, -3, -26, 0, 0.00047, 6.1, 627.596, 0, 0, 0, 0.00047, 5.0, 12.619, 1, 7, 0, 0.00045, 4.9, -8815.018, -5, -69, 0, 0.00044, 1.6, 62.133, -2, -19, 0, 0.00042, 2.9, -13.118, -4, -44, 0, 0.00042, 4.1, -119.445, 0, 0, 0, 0.00041, 4.3, 22756.817, -3, -13, 0, 0.00041, 3.6, 8288.877, 2, 25, 0, 0.00040, 0.5, 6663.308, -2, -19, 0, 0.00040, 1.1, 8368.506, 2, 25, 0, 0.00039, 4.1, 6443.786, 2, 25, 0, 0.00039, 3.1, 16657.383, 3, 50, 0, 0.00038, 0.1, 16657.031, 3, 50, 0, 0.00038, 3.0, 16657.735, 3, 50, 0, 0.00038, 4.6, 23942.433, -1, 9, 0, 0.00037, 4.3, 15385.020, -1, 6, 0, 0.00037, 5.0, 548.678, 0, 0, 0, 0.00036, 1.8, 7213.352, -2, -19, 0, 0.00036, 1.7, 7214.774, -2, -19, 0, 0.00035, 1.1, 7777.936, 2, 25, 0, 0.00035, 1.6, -8.860, 0, 0, 0, 0.00035, 4.4, 23869.145, 2, 56, 0, 0.00035, 2.0, 6691.693, -2, -19, 0, 0.00034, 1.3, -1185.616, -2, -22, 0, 0.00034, 2.2, 23873.747, -1, 6, 0, 0.00033, 2.0, -235.287, 0, 0, 0, 0.00033, 3.1, 17913.987, 3, 50, 0, 0.00033, 1.0, 8351.233, -2, -19, 0],
        [0.004870, 4.6693, 628.30196, -0.027, 0, -0.01, 0.002280, 2.6746, -2.30120, 1.523, 25, -0.12, 0.001500, 3.372, 6585.76091, -2.16, -19, 0.1, 0.001200, 5.728, 14914.45233, -0.64, 6, 0, 0.001080, 3.969, 7700.38947, 1.55, 25, -0.1, 0.000800, 0.742, 8956.99338, 1.50, 25, -0.1, 0.000254, 6.002, 0.3286, 1.52, 25, -0.1, 0.000210, 0.144, 7842.3648, -2.21, -19, 0, 0.000180, 2.500, 16171.0562, -0.7, 6, 0, 0.000130, 0.44, 8399.6791, -0.4, 3, 0, 0.000126, 5.03, 8326.3902, 3.0, 50, 0, 0.000120, 5.77, 14286.1504, -0.6, 6, 0, 0.000118, 5.96, 8330.9926, 0, 0, 0, 0.000110, 1.80, 23243.1438, 0.9, 31, 0, 0.000110, 3.42, 5957.4590, -2.1, -19, 0, 0.000110, 4.63, 1256.6039, -0.1, 0, 0, 0.000099, 4.70, -0.7113, 0, 0, 0, 0.000070, 0.04, 16029.0809, 3.1, 50, 0, 0.000070, 5.14, 8328.3391, 1.5, 25, 0, 0.000070, 5.85, 8329.0437, 1.5, 25, 0, 0.000060, 1.02, -1742.9305, -3.7, -44, 0, 0.000060, 3.10, 17285.6848, 3.0, 50, 0, 0.000054, 5.69, -0.352, 0, 0, 0, 0.000043, 0.52, 15.542, 0, 0, 0, 0.000041, 2.03, 2.630, 0, 0, 0, 0.000040, 0.10, 8470.667, -2.2, -19, 0, 0.000040, 4.01, 7072.088, 1.6, 25, 0, 0.000036, 2.93, -8.860, -0.3, 0, 0, 0.000030, 1.20, 22128.515, -2.8, -13, 0, 0.000030, 2.54, 15542.754, -0.7, 6, 0, 0.000027, 4.43, 7211.762, -0.7, 6, 0, 0.000026, 0.51, 15540.453, 0.9, 31, 0, 0.000026, 1.44, 15545.055, -2.2, -19, 0, 0.000025, 5.37, 7216.364, -3.7, -44, 0],
        [0.00001200, 1.041, -2.3012, 1.52, 25, -0.1, 0.00000170, 0.31, -0.711, 0, 0, 0]
      ],
      QI_KB:[1640650.479938, 15.21842500,
        1642476.703182, 15.21874996,
        1683430.515601, 15.218750011,
        1752157.640664, 15.218749978,
        1807675.003759, 15.218620279,
        1883627.765182, 15.218612292,
        1907369.128100, 15.218449176,
        1936603.140413, 15.218425000,
        1939145.524180, 15.218466998,
        1947180.798300, 15.218524844,
        1964362.041824, 15.218533526,
        1987372.340971, 15.218513908,
        1999653.819126, 15.218530782,
        2007445.469786, 15.218535181,
        2021324.917146, 15.218526248,
        2047257.232342, 15.218519654,
        2070282.898213, 15.218425000,
        2073204.872850, 15.218515221,
        2080144.500926, 15.218530782,
        2086703.688963, 15.218523776,
        2110033.182763, 15.218425000,
        2111190.300888, 15.218425000,
        2113731.271005, 15.218515671,
        2120670.840263, 15.218425000,
        2123973.309063, 15.218425000,
        2125068.997336, 15.218477932,
        2136026.312633, 15.218472436,
        2156099.495538, 15.218425000,
        2159021.324663, 15.218425000,
        2162308.575254, 15.218461742,
        2178485.706538, 15.218425000,
        2178759.662849, 15.218445786,
        2185334.020800, 15.218425000,
        2187525.481425, 15.218425000,
        2188621.191481, 15.218437494,
        2322147.76
      ],
      QB:_decode('FrcFs22AFsckF2tsDtFqEtF1posFdFgiFseFtmelpsEfhkF2anmelpFlF1ikrotcnEqEq2FfqmcDsrFor22FgFrcgDscFs22FgEeFtE2sfFs22sCoEsaF2tsD1FpeE2eFsssEciFsFnmelpFcFhkF2tcnEqEpFgkrotcnEqrEtFermcDsrE222FgBmcmr22DaEfnaF222sD1FpeForeF2tssEfiFpEoeFssD1iFstEqFppDgFstcnEqEpFg11FscnEqrAoAF2ClAEsDmDtCtBaDlAFbAEpAAAAAD2FgBiBqoBbnBaBoAAAAAAAEgDqAdBqAFrBaBoACdAAf1AACgAAAeBbCamDgEifAE2AABa1C1BgFdiAAACoCeE1ADiEifDaAEqAAFe1AcFbcAAAAAF1iFaAAACpACmFmAAAAAAAACrDaAAADG0'),
      SHUO_KB:[1457698.231017, 29.53067166, 1546082.512234, 29.53085106, 1640640.735300, 29.53060000, 1642472.151543, 29.53085439, 1683430.509300, 29.53086148, 1752148.041079, 29.53085097, 1807665.420323, 29.53059851, 1883618.114100, 29.53060000, 1907360.704700, 29.53060000, 1936596.224900, 29.53060000, 1939135.675300, 29.53060000, 1947168.00],
      SB:_decode('EqoFscDcrFpmEsF2DfFideFelFpFfFfFiaipqti1ksttikptikqckstekqttgkqttgkqteksttikptikq2fjstgjqttjkqttgkqtekstfkptikq2tijstgjiFkirFsAeACoFsiDaDiADc1AFbBfgdfikijFifegF1FhaikgFag1E2btaieeibggiffdeigFfqDfaiBkF1kEaikhkigeidhhdiegcFfakF1ggkidbiaedksaFffckekidhhdhdikcikiakicjF1deedFhFccgicdekgiFbiaikcfi1kbFibefgEgFdcFkFeFkdcfkF1kfkcickEiFkDacFiEfbiaejcFfffkhkdgkaiei1ehigikhdFikfckF1dhhdikcfgjikhfjicjicgiehdikcikggcifgiejF1jkieFhegikggcikFegiegkfjebhigikggcikdgkaFkijcfkcikfkcifikiggkaeeigefkcdfcfkhkdgkegieidhijcFfakhfgeidieidiegikhfkfckfcjbdehdikggikgkfkicjicjF1dbidikFiggcifgiejkiegkigcdiegfggcikdbgfgefjF1kfegikggcikdgFkeeijcfkcikfkekcikdgkabhkFikaffcfkhkdgkegbiaekfkiakicjhfgqdq2fkiakgkfkhfkfcjiekgFebicggbedF1jikejbbbiakgbgkacgiejkijjgigfiakggfggcibFifjefjF1kfekdgjcibFeFkijcfkfhkfkeaieigekgbhkfikidfcjeaibgekgdkiffiffkiakF1jhbakgdki1dj1ikfkicjicjieeFkgdkicggkighdF1jfgkgfgbdkicggfggkidFkiekgijkeigfiskiggfaidheigF1jekijcikickiggkidhhdbgcfkFikikhkigeidieFikggikhkffaffijhidhhakgdkhkijF1kiakF1kfheakgdkifiggkigicjiejkieedikgdfcggkigieeiejfgkgkigbgikicggkiaideeijkefjeijikhkiggkiaidheigcikaikffikijgkiahi1hhdikgjfifaakekighie1hiaikggikhkffakicjhiahaikggikhkijF1kfejfeFhidikggiffiggkigicjiekgieeigikggiffiggkidheigkgfjkeigiegikifiggkidhedeijcfkFikikhkiggkidhh1ehigcikaffkhkiggkidhh1hhigikekfiFkFikcidhh1hitcikggikhkfkicjicghiediaikggikhkijbjfejfeFhaikggifikiggkigiejkikgkgieeigikggiffiggkigieeigekijcijikggifikiggkideedeijkefkfckikhkiggkidhh1ehijcikaffkhkiggkidhh1hhigikhkikFikfckcidhh1hiaikgjikhfjicjicgiehdikcikggifikigiejfejkieFhegikggifikiggfghigkfjeijkhigikggifikiggkigieeijcijcikfksikifikiggkidehdeijcfdckikhkiggkhghh1ehijikifffffkhsFngErD1pAfBoDd1BlEtFqA2AqoEpDqElAEsEeB2BmADlDkqBtC1FnEpDqnEmFsFsAFnllBbFmDsDiCtDmAB2BmtCgpEplCpAEiBiEoFqFtEqsDcCnFtADnFlEgdkEgmEtEsCtDmADqFtAFrAtEcCqAE1BoFqC1F1DrFtBmFtAC2ACnFaoCgADcADcCcFfoFtDlAFgmFqBq2bpEoAEmkqnEeCtAE1bAEqgDfFfCrgEcBrACfAAABqAAB1AAClEnFeCtCgAADqDoBmtAAACbFiAAADsEtBqAB2FsDqpFqEmFsCeDtFlCeDtoEpClEqAAFrAFoCgFmFsFqEnAEcCqFeCtFtEnAEeFtAAEkFnErAABbFkADnAAeCtFeAfBoAEpFtAABtFqAApDcCGJ'),
      nutationLon2:function(t){
        var a = -1.742 * t;
        var t2 = t * t;
        var dl = 0;
        for (var i = 0, j = this.NUT_B.length; i < j; i += 5) {
          dl += (this.NUT_B[i + 3] + a) * Math.sin(this.NUT_B[i] + this.NUT_B[i + 1] * t + this.NUT_B[i + 2] * t2);
          a = 0;
        }
        return dl / 100 / this.SECOND_PER_RAD;
      },
      eLon:function(t,n){
        t /= 10;
        var v = 0;
        var tn = 1;
        var n1;
        var n2;
        var m;
        var c;
        var pn = 1;
        var n0;
        var m0 = this.XL0[pn + 1] - this.XL0[pn];
        for (var i = 0; i < 6; i++, tn *= t) {
          n1 = Math.floor(this.XL0[pn + i]);
          n2 = Math.floor(this.XL0[pn + 1 + i]);
          n0 = n2 - n1;
          if (n0 === 0) {
            continue;
          }
          if (n < 0) {
            m = n2;
          } else {
            m = Math.floor((3 * n * n0 / m0 + 0.5) + n1);
            if (i !== 0) {
              m += 3;
            }
            if (m > n2) {
              m = n2;
            }
          }
          c = 0;
          for (var j = n1; j < m; j += 3) {
            c += this.XL0[j] * Math.cos(this.XL0[j + 1] + t * this.XL0[j + 2]);
          }
          v += c * tn;
        }
        v /= this.XL0[0];
        var t2 = t * t;
        v += (-0.0728 - 2.7702 * t - 1.1019 * t2 - 0.0996 * t2 * t) / this.SECOND_PER_RAD;
        return v;
      },
      mLon:function(t,n){
        var ob = this.XL1;
        var obl = ob[0].length;
        var tn = 1;
        var v = 0;
        var j;
        var c;
        var t2 = t * t;
        var t3 = t2 * t;
        var t4 = t3 * t;
        var t5 = t4 * t;
        var tx = t - 10;
        v += (3.81034409 + 8399.684730072 * t - 3.319e-05 * t2 + 3.11e-08 * t3 - 2.033e-10 * t4) * this.SECOND_PER_RAD;
        v += 5028.792262 * t + 1.1124406 * t2 + 0.00007699 * t3 - 0.000023479 * t4 - 0.0000000178 * t5;
        if (tx > 0) {
          v += -0.866 + 1.43 * tx + 0.054 * tx * tx;
        }
        t2 /= 1e4;
        t3 /= 1e8;
        t4 /= 1e8;

        n *= 6;
        if (n < 0) {
          n = obl;
        }
        for (var i = 0, x = ob.length; i < x; i++, tn *= t) {
          var f = ob[i];
          var l = f.length;
          var m = Math.floor((n * l / obl + 0.5));
          if (i > 0) {
            m += 6;
          }
          if (m >= l) {
            m = l;
          }
          for (j = 0, c = 0; j < m; j += 6) {
            c += f[j] * Math.cos(f[j + 1] + t * f[j + 2] + t2 * f[j + 3] + t3 * f[j + 4] + t4 * f[j + 5]);
          }
          v += c * tn;
        }
        v /= this.SECOND_PER_RAD;
        return v;
      },
      gxcSunLon:function(t){
        var t2 = t * t;
        var v = -0.043126 + 628.301955 * t - 0.000002732 * t2;
        var e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t2;
        return -20.49552 * (1 + e * Math.cos(v)) / this.SECOND_PER_RAD;
      },
      ev:function(t){
        var f = 628.307585 * t;
        return 628.332 + 21 * Math.sin(1.527 + f) + 0.44 * Math.sin(1.48 + f * 2) + 0.129 * Math.sin(5.82 + f) * t + 0.00055 * Math.sin(4.21 + f) * t * t;
      },
      saLon:function(t,n){
        return this.eLon(t, n) + this.nutationLon2(t) + this.gxcSunLon(t) + Math.PI;
      },
      dtExt:function(y,jsd){
        var dy = (y - 1820) / 100;
        return -20 + jsd * dy * dy;
      },
      dtCalc:function(y){
        var size = this.DT_AT.length;
        var y0 = this.DT_AT[size - 2];
        var t0 = this.DT_AT[size - 1];
        if (y >= y0) {
          var jsd = 31;
          if (y > y0 + 100) {
            return this.dtExt(y, jsd);
          }
          return this.dtExt(y, jsd) - (this.dtExt(y0, jsd) - t0) * (y0 + 100 - y) / 100;
        }
        var i;
        for (i = 0; i < size; i += 5) {
          if (y < this.DT_AT[i + 5]) {
            break;
          }
        }
        var t1 = (y - this.DT_AT[i]) / (this.DT_AT[i + 5] - this.DT_AT[i]) * 10;
        var t2 = t1 * t1;
        var t3 = t2 * t1;
        return this.DT_AT[i + 1] + this.DT_AT[i + 2] * t1 + this.DT_AT[i + 3] * t2 + this.DT_AT[i + 4] * t3;
      },
      dtT:function(t){
        return this.dtCalc(t / 365.2425 + 2000) / this.SECOND_PER_DAY;
      },
      mv:function(t){
        var v = 8399.71 - 914 * Math.sin(0.7848 + 8328.691425 * t + 0.0001523 * t * t);
        v -= 179 * Math.sin(2.543 + 15542.7543 * t) + 160 * Math.sin(0.1874 + 7214.0629 * t) + 62 * Math.sin(3.14 + 16657.3828 * t) + 34 * Math.sin(4.827 + 16866.9323 * t) + 22 * Math.sin(4.9 + 23871.4457 * t) + 12 * Math.sin(2.59 + 14914.4523 * t) + 7 * Math.sin(0.23 + 6585.7609 * t) + 5 * Math.sin(0.9 + 25195.624 * t) + 5 * Math.sin(2.32 - 7700.3895 * t) + 5 * Math.sin(3.88 + 8956.9934 * t) + 5 * Math.sin(0.49 + 7771.3771 * t);
        return v;
      },
      saLonT:function(w){
        var t;
        var v = 628.3319653318;
        t = (w - 1.75347 - Math.PI) / v;
        v = this.ev(t);
        t += (w - this.saLon(t, 10)) / v;
        v = this.ev(t);
        t += (w - this.saLon(t, -1)) / v;
        return t;
      },
      msaLon:function(t,mn,sn){
        return this.mLon(t, mn) + (-3.4E-6) - (this.eLon(t, sn) + this.gxcSunLon(t) + Math.PI);
      },
      msaLonT:function(w){
        var t;
        var v = 7771.37714500204;
        t = (w + 1.08472) / v;
        t += (w - this.msaLon(t, 3, 3)) / v;
        v = this.mv(t) - this.ev(t);
        t += (w - this.msaLon(t, 20, 10)) / v;
        t += (w - this.msaLon(t, -1, 60)) / v;
        return t;
      },
      saLonT2:function(w){
        var v = 628.3319653318;
        var t = (w - 1.75347 - Math.PI) / v;
        t -= (0.000005297 * t * t + 0.0334166 * Math.cos(4.669257 + 628.307585 * t) + 0.0002061 * Math.cos(2.67823 + 628.307585 * t) * t) / v;
        t += (w - ShouXingUtil.eLon(t, 8) - Math.PI + (20.5 + 17.2 * Math.sin(2.1824 - 33.75705 * t)) / this.SECOND_PER_RAD) / v;
        return t;
      },
      msaLonT2:function(w){
        var t;
        var l;
        var v = 7771.37714500204;
        t = (w + 1.08472) / v;
        var t2 = t * t;
        t -= (-0.00003309 * t2 + 0.10976 * Math.cos(0.784758 + 8328.6914246 * t + 0.000152292 * t2) + 0.02224 * Math.cos(0.18740 + 7214.0628654 * t - 0.00021848 * t2) - 0.03342 * Math.cos(4.669257 + 628.307585 * t)) / v;
        t2 = t * t;
        l = this.mLon(t, 20) - (4.8950632 + 628.3319653318 * t + 0.000005297 * t2 + 0.0334166 * Math.cos(4.669257 + 628.307585 * t) + 0.0002061 * Math.cos(2.67823 + 628.307585 * t) * t + 0.000349 * Math.cos(4.6261 + 1256.61517 * t) - 20.5 / this.SECOND_PER_RAD);
        v = 7771.38 - 914 * Math.sin(0.7848 + 8328.691425 * t + 0.0001523 * t2) - 179 * Math.sin(2.543 + 15542.7543 * t) - 160 * Math.sin(0.1874 + 7214.0629 * t);
        t += (w - l) / v;
        return t;
      },
      qiHigh:function(w){
        var t = this.saLonT2(w) * 36525;
        t = t - this.dtT(t) + this.ONE_THIRD;
        var v = ((t + 0.5) % 1) * this.SECOND_PER_DAY;
        if (v < 1200 || v > this.SECOND_PER_DAY - 1200) {
          t = this.saLonT(w) * 36525 - this.dtT(t) + this.ONE_THIRD;
        }
        return t;
      },
      shuoHigh:function(w){
        var t = this.msaLonT2(w) * 36525;
        t = t - this.dtT(t) + this.ONE_THIRD;
        var v = ((t + 0.5) % 1) * this.SECOND_PER_DAY;
        if (v < 1800 || v > this.SECOND_PER_DAY - 1800) {
          t = this.msaLonT(w) * 36525 - this.dtT(t) + this.ONE_THIRD;
        }
        return t;
      },
      qiLow:function(w){
        var v = 628.3319653318;
        var t = (w - 4.895062166) / v;
        t -= (53 * t * t + 334116 * Math.cos(4.67 + 628.307585 * t) + 2061 * Math.cos(2.678 + 628.3076 * t) * t) / v / 10000000;
        var n = 48950621.66 + 6283319653.318 * t + 53 * t * t + 334166 * Math.cos(4.669257 + 628.307585 * t) + 3489 * Math.cos(4.6261 + 1256.61517 * t) + 2060.6 * Math.cos(2.67823 + 628.307585 * t) * t - 994 - 834 * Math.sin(2.1824 - 33.75705 * t);
        t -= (n / 10000000 - w) / 628.332 + (32 * (t + 1.8) * (t + 1.8) - 20) / this.SECOND_PER_DAY / 36525;
        return t * 36525 + this.ONE_THIRD;
      },
      shuoLow:function(w){
        var v = 7771.37714500204;
        var t = (w + 1.08472) / v;
        t -= (-0.0000331 * t * t + 0.10976 * Math.cos(0.785 + 8328.6914 * t) + 0.02224 * Math.cos(0.187 + 7214.0629 * t) - 0.03342 * Math.cos(4.669 + 628.3076 * t)) / v + (32 * (t + 1.8) * (t + 1.8) - 20) / this.SECOND_PER_DAY / 36525;
        return t * 36525 + this.ONE_THIRD;
      },
      calcShuo:function(jd){
        var size = this.SHUO_KB.length;
        var d = 0;
        var pc = 14;
        var i;
        jd += Solar.J2000;
        var f1 = this.SHUO_KB[0] - pc, f2 = this.SHUO_KB[size - 1] - pc, f3 = 2436935;
        if (jd < f1 || jd >= f3) {
          d = Math.floor(this.shuoHigh(Math.floor((jd + pc - 2451551) / 29.5306) * Math.PI * 2) + 0.5);
        } else if (jd >= f1 && jd < f2) {
          for (i = 0; i < size; i += 2) {
            if (jd + pc < this.SHUO_KB[i + 2]) {
              break;
            }
          }
          d = this.SHUO_KB[i] + this.SHUO_KB[i + 1] * Math.floor((jd + pc - this.SHUO_KB[i]) / this.SHUO_KB[i + 1]);
          d = Math.floor(d + 0.5);
          if (d === 1683460) {
            d++;
          }
          d -= Solar.J2000;
        } else if (jd >= f2 && jd < f3) {
          d = Math.floor(this.shuoLow(Math.floor((jd + pc - 2451551) / 29.5306) * Math.PI * 2) + 0.5);
          var from = Math.floor((jd - f2) / 29.5306);
          var n = this.SB.substring(from, from+1);
          if ('1' === n) {
            d += 1;
          } else if ('2' === n) {
            d -= 1;
          }
        }
        return d;
      },
      calcQi:function(jd){
        var size = this.QI_KB.length;
        var d = 0;
        var pc = 7, i;
        jd += Solar.J2000;
        var f1 = this.QI_KB[0] - pc, f2 = this.QI_KB[size - 1] - pc, f3 = 2436935;
        if (jd < f1 || jd >= f3) {
          d = Math.floor(this.qiHigh(Math.floor((jd + pc - 2451259) / 365.2422 * 24) * Math.PI / 12) + 0.5);
        } else if (jd >= f1 && jd < f2) {
          for (i = 0; i < size; i += 2) {
            if (jd + pc < this.QI_KB[i + 2]) {
              break;
            }
          }
          d = this.QI_KB[i] + this.QI_KB[i + 1] * Math.floor((jd + pc - this.QI_KB[i]) / this.QI_KB[i + 1]);
          d = Math.floor(d + 0.5);
          if (d === 1683460) {
            d++;
          }
          d -= Solar.J2000;
        } else if (jd >= f2 && jd < f3) {
          d = Math.floor(this.qiLow(Math.floor((jd + pc - 2451259) / 365.2422 * 24) * Math.PI / 12) + 0.5);
          var from = Math.floor((jd - f2) / 365.2422 * 24);
          var n = this.QB.substring(from, from + 1);
          if ('1' === n) {
            d += 1;
          } else if ('2' === n) {
            d -= 1;
          }
        }
        return d;
      },
      qiAccurate:function(w){
        var t = this.saLonT(w) * 36525;
        return t - this.dtT(t) + this.ONE_THIRD;
      },
      qiAccurate2:function(jd){
        var d = Math.PI / 12;
        var w = Math.floor((jd + 293) / 365.2422 * 24) * d;
        var a = this.qiAccurate(w);
        if (a - jd > 5) {
          return this.qiAccurate(w - d);
        }
        if (a - jd < -5) {
          return this.qiAccurate(w + d);
        }
        return a;
      }
    };
  })();
  var SolarUtil = (function(){
    return {
      WEEK:['{w.sun}', '{w.mon}', '{w.tues}', '{w.wed}', '{w.thur}', '{w.fri}', '{w.sat}'],
      DAYS_OF_MONTH:[31,28,31,30,31,30,31,31,30,31,30,31],
      XINGZUO:['{xz.aries}', '{xz.taurus}', '{xz.gemini}', '{xz.cancer}', '{xz.leo}', '{xz.virgo}', '{xz.libra}', '{xz.scorpio}', '{xz.sagittarius}', '{xz.capricornus}', '{xz.aquarius}', '{xz.pisces}'],
      FESTIVAL: {
        '1-1': '{jr.yuanDan}',
        '2-14': '{jr.qingRen}',
        '3-8': '{jr.fuNv}',
        '3-12': '{jr.zhiShu}',
        '3-15': '{jr.xiaoFei}',
        '4-1': '{jr.yuRen}',
        '5-1': '{jr.wuYi}',
        '5-4': '{jr.qingNian}',
        '6-1': '{jr.erTong}',
        '7-1': '{jr.jianDang}',
        '8-1': '{jr.jianJun}',
        '9-10': '{jr.jiaoShi}',
        '10-1': '{jr.guoQing}',
        '10-31': '{jr.wanShengYe}',
        '11-1': '{jr.wanSheng}',
        '12-24': '{jr.pingAn}',
        '12-25': '{jr.shengDan}'
      },
      OTHER_FESTIVAL:{
        '1-8':['周恩来逝世纪念日'],
        '1-10':['中国人民警察节'],
        '1-14':['日记情人节'],
        '1-21':['列宁逝世纪念日'],
        '1-26':['国际海关日'],
        '1-27':['国际大屠杀纪念日'],
        '2-2':['世界湿地日'],
        '2-4':['世界抗癌日'],
        '2-7':['京汉铁路罢工纪念日'],
        '2-10':['国际气象节'],
        '2-19':['邓小平逝世纪念日'],
        '2-20':['世界社会公正日'],
        '2-21':['国际母语日'],
        '2-24':['第三世界青年日'],
        '3-1':['国际海豹日'],
        '3-3':['世界野生动植物日', '全国爱耳日'],
        '3-5':['周恩来诞辰纪念日', '中国青年志愿者服务日'],
        '3-6':['世界青光眼日'],
        '3-7':['女生节'],
        '3-12':['孙中山逝世纪念日'],
        '3-14':['马克思逝世纪念日', '白色情人节'],
        '3-17':['国际航海日'],
        '3-18':['全国科技人才活动日', '全国爱肝日'],
        '3-20':['国际幸福日'],
        '3-21':['世界森林日', '世界睡眠日', '国际消除种族歧视日'],
        '3-22':['世界水日'],
        '3-23':['世界气象日'],
        '3-24':['世界防治结核病日'],
        '3-29':['中国黄花岗七十二烈士殉难纪念日'],
        '4-2':['国际儿童图书日', '世界自闭症日'],
        '4-4':['国际地雷行动日'],
        '4-7':['世界卫生日'],
        '4-8':['国际珍稀动物保护日'],
        '4-12':['世界航天日'],
        '4-14':['黑色情人节'],
        '4-15':['全民国家安全教育日'],
        '4-22':['世界地球日', '列宁诞辰纪念日'],
        '4-23':['世界读书日'],
        '4-24':['中国航天日'],
        '4-25':['儿童预防接种宣传日'],
        '4-26':['世界知识产权日', '全国疟疾日'],
        '4-28':['世界安全生产与健康日'],
        '4-30':['全国交通安全反思日'],
        '5-2':['世界金枪鱼日'],
        '5-3':['世界新闻自由日'],
        '5-5':['马克思诞辰纪念日'],
        '5-8':['世界红十字日'],
        '5-11':['世界肥胖日'],
        '5-12':['全国防灾减灾日', '护士节'],
        '5-14':['玫瑰情人节'],
        '5-15':['国际家庭日'],
        '5-19':['中国旅游日'],
        '5-20':['网络情人节'],
        '5-22':['国际生物多样性日'],
        '5-25':['525心理健康节'],
        '5-27':['上海解放日'],
        '5-29':['国际维和人员日'],
        '5-30':['中国五卅运动纪念日'],
        '5-31':['世界无烟日'],
        '6-3':['世界自行车日'],
        '6-5':['世界环境日'],
        '6-6':['全国爱眼日'],
        '6-8':['世界海洋日'],
        '6-11':['中国人口日'],
        '6-14':['世界献血日', '亲亲情人节'],
        '6-17':['世界防治荒漠化与干旱日'],
        '6-20':['世界难民日'],
        '6-21':['国际瑜伽日'],
        '6-25':['全国土地日'],
        '6-26':['国际禁毒日', '联合国宪章日'],
        '7-1':['香港回归纪念日'],
        '7-6':['国际接吻日', '朱德逝世纪念日'],
        '7-7':['七七事变纪念日'],
        '7-11':['世界人口日', '中国航海日'],
        '7-14':['银色情人节'],
        '7-18':['曼德拉国际日'],
        '7-30':['国际友谊日'],
        '8-3':['男人节'],
        '8-5':['恩格斯逝世纪念日'],
        '8-6':['国际电影节'],
        '8-8':['全民健身日'],
        '8-9':['国际土著人日'],
        '8-12':['国际青年节'],
        '8-14':['绿色情人节'],
        '8-19':['世界人道主义日', '中国医师节'],
        '8-22':['邓小平诞辰纪念日'],
        '8-29':['全国测绘法宣传日'],
        '9-3':['中国抗日战争胜利纪念日'],
        '9-5':['中华慈善日'],
        '9-8':['世界扫盲日'],
        '9-9':['毛泽东逝世纪念日', '全国拒绝酒驾日'],
        '9-14':['世界清洁地球日', '相片情人节'],
        '9-15':['国际民主日'],
        '9-16':['国际臭氧层保护日'],
        '9-17':['世界骑行日'],
        '9-18':['九一八事变纪念日'],
        '9-20':['全国爱牙日'],
        '9-21':['国际和平日'],
        '9-27':['世界旅游日'],
        '9-30':['中国烈士纪念日'],
        '10-1':['国际老年人日'],
        '10-2':['国际非暴力日'],
        '10-4':['世界动物日'],
        '10-11':['国际女童日'],
        '10-10':['辛亥革命纪念日'],
        '10-13':['国际减轻自然灾害日', '中国少年先锋队诞辰日'],
        '10-14':['葡萄酒情人节'],
        '10-16':['世界粮食日'],
        '10-17':['全国扶贫日'],
        '10-20':['世界统计日'],
        '10-24':['世界发展信息日', '程序员节'],
        '10-25':['抗美援朝纪念日'],
        '11-5':['世界海啸日'],
        '11-8':['记者节'],
        '11-9':['全国消防日'],
        '11-11':['光棍节'],
        '11-12':['孙中山诞辰纪念日'],
        '11-14':['电影情人节'],
        '11-16':['国际宽容日'],
        '11-17':['国际大学生节'],
        '11-19':['世界厕所日'],
        '11-28':['恩格斯诞辰纪念日'],
        '11-29':['国际声援巴勒斯坦人民日'],
        '12-1':['世界艾滋病日'],
        '12-2':['全国交通安全日'],
        '12-3':['世界残疾人日'],
        '12-4':['全国法制宣传日'],
        '12-5':['世界弱能人士日', '国际志愿人员日'],
        '12-7':['国际民航日'],
        '12-9':['世界足球日', '国际反腐败日'],
        '12-10':['世界人权日'],
        '12-11':['国际山岳日'],
        '12-12':['西安事变纪念日'],
        '12-13':['国家公祭日'],
        '12-14':['拥抱情人节'],
        '12-18':['国际移徙者日'],
        '12-26':['毛泽东诞辰纪念日']
      },
      WEEK_FESTIVAL:{'3-0-1':'全国中小学生安全教育日','5-2-0':'母亲节','5-3-0':'全国助残日','6-3-0':'父亲节','9-3-6':'全民国防教育日','10-1-1':'世界住房日','11-4-4':'感恩节'},
      isLeapYear:function(year){
        if (year < 1600) {
          return year % 4 === 0;
        }
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      },
      getDaysOfMonth:function(year, month){
        var oy = year;
        var om = month;
        year *= 1;
        if(isNaN(year)){
          throw new Error('wrong solar year '+oy);
        }
        month *= 1;
        if(isNaN(month)){
          throw new Error('wrong solar month '+om);
        }
        if (1582 === year && 10 === month) {
          return 21;
        }
        var m = month-1;
        var d = this.DAYS_OF_MONTH[m];
        if (m === 1 && this.isLeapYear(year)) {
          d++;
        }
        return d;
      },
      getDaysOfYear:function(year){
        var oy = year;
        year *= 1;
        if(isNaN(year)){
          throw new Error('wrong solar year '+oy);
        }
        if (1582 === year) {
          return 355;
        }
        return this.isLeapYear(year) ? 366: 365;
      },
      getDaysInYear:function(year, month, day){
        var oy = year;
        var om = month;
        var od = day;
        year *= 1;
        if(isNaN(year)){
          throw new Error('wrong solar year '+oy);
        }
        month *= 1;
        if(isNaN(month)){
          throw new Error('wrong solar month '+om);
        }
        day *= 1;
        if(isNaN(day)){
          throw new Error('wrong solar day '+od);
        }
        var days = 0;
        for (var i = 1; i < month; i++) {
          days += this.getDaysOfMonth(year, i);
        }
        var d = day;
        if (1582 === year && 10 === month) {
          if (day >= 15) {
            d -= 10;
          } else if (day > 4) {
            throw new Error('wrong solar year '+year+' month '+month+' day '+day);
          }
        }
        days += d;
        return days;
      },
      getDaysBetween:function(ay, am, ad, by, bm, bd){
        var oay = ay;
        var oam = am;
        var oad = ad;
        var oby = by;
        var obm = bm;
        var obd = bd;
        ay *= 1;
        if(isNaN(ay)){
          throw new Error('wrong solar year '+oay);
        }
        am *= 1;
        if(isNaN(am)){
          throw new Error('wrong solar month '+oam);
        }
        ad *= 1;
        if(isNaN(ad)){
          throw new Error('wrong solar day '+oad);
        }
        by *= 1;
        if(isNaN(by)){
          throw new Error('wrong solar year '+oby);
        }
        bm *= 1;
        if(isNaN(bm)){
          throw new Error('wrong solar month '+obm);
        }
        bd *= 1;
        if(isNaN(bd)){
          throw new Error('wrong solar day '+obd);
        }

        var n;
        var days;
        var i;
        if (ay === by) {
          n = this.getDaysInYear(by, bm, bd) - this.getDaysInYear(ay, am, ad);
        } else if (ay > by) {
          days = this.getDaysOfYear(by) - this.getDaysInYear(by, bm, bd);
          for (i = by + 1; i < ay; i++) {
            days += this.getDaysOfYear(i);
          }
          days += this.getDaysInYear(ay, am, ad);
          n = -days;
        } else {
          days = this.getDaysOfYear(ay) - this.getDaysInYear(ay, am, ad);
          for (i = ay + 1; i < by; i++) {
            days += this.getDaysOfYear(i);
          }
          days += this.getDaysInYear(by, bm, bd);
          n = days;
        }
        return n;
      },
      getWeeksOfMonth:function(year, month, start){
        return Math.ceil((this.getDaysOfMonth(year, month) + Solar.fromYmd(year, month, 1).getWeek() - start)/7);
      }
    };
  })();
  var LunarUtil = (function(){
    return {
      BASE_MONTH_ZHI_INDEX:2,
      JIE_QI: ['{jq.dongZhi}', '{jq.xiaoHan}', '{jq.daHan}', '{jq.liChun}', '{jq.yuShui}', '{jq.jingZhe}', '{jq.chunFen}', '{jq.qingMing}', '{jq.guYu}', '{jq.liXia}', '{jq.xiaoMan}', '{jq.mangZhong}', '{jq.xiaZhi}', '{jq.xiaoShu}', '{jq.daShu}', '{jq.liQiu}', '{jq.chuShu}', '{jq.baiLu}', '{jq.qiuFen}', '{jq.hanLu}', '{jq.shuangJiang}', '{jq.liDong}', '{jq.xiaoXue}', '{jq.daXue}'],
      JIE_QI_IN_USE: ['DA_XUE', '{jq.dongZhi}', '{jq.xiaoHan}', '{jq.daHan}', '{jq.liChun}', '{jq.yuShui}', '{jq.jingZhe}', '{jq.chunFen}', '{jq.qingMing}', '{jq.guYu}', '{jq.liXia}', '{jq.xiaoMan}', '{jq.mangZhong}', '{jq.xiaZhi}', '{jq.xiaoShu}', '{jq.daShu}', '{jq.liQiu}', '{jq.chuShu}', '{jq.baiLu}', '{jq.qiuFen}', '{jq.hanLu}', '{jq.shuangJiang}', '{jq.liDong}', '{jq.xiaoXue}', '{jq.daXue}', 'DONG_ZHI', 'XIAO_HAN', 'DA_HAN', 'LI_CHUN', 'YU_SHUI', 'JING_ZHE'],
      CHANG_SHENG_OFFSET: {
        '{tg.jia}':1,
        '{tg.bing}':10,
        '{tg.wu}':10,
        '{tg.geng}':7,
        '{tg.ren}':4,
        '{tg.yi}':6,
        '{tg.ding}':9,
        '{tg.ji}':9,
        '{tg.xin}':0,
        '{tg.gui}':3
      },
      MONTH_ZHI:['', '{dz.yin}', '{dz.mao}', '{dz.chen}', '{dz.si}', '{dz.wu}', '{dz.wei}', '{dz.shen}', '{dz.you}', '{dz.xu}', '{dz.hai}', '{dz.zi}', '{dz.chou}'],
      CHANG_SHENG:['{ds.changSheng}', '{ds.muYu}', '{ds.guanDai}', '{ds.linGuan}', '{ds.diWang}', '{ds.shuai}', '{ds.bing}', '{ds.si}', '{ds.mu}', '{ds.jue}', '{ds.tai}', '{ds.yang}'],
      XUN:[
        '{jz.jiaZi}',
        '{jz.jiaXu}',
        '{jz.jiaShen}',
        '{jz.jiaWu}',
        '{jz.jiaChen}',
        '{jz.jiaYin}'
      ],
      XUN_KONG:[
        '{dz.xu}{dz.hai}',
        '{dz.shen}{dz.you}',
        '{dz.wu}{dz.wei}',
        '{dz.chen}{dz.si}',
        '{dz.yin}{dz.mao}',
        '{dz.zi}{dz.chou}'
      ],
      LIU_YAO:[
        '{ly.xianSheng}',
        '{ly.youYin}',
        '{ly.xianFu}',
        '{ly.foMie}',
        '{ly.daAn}',
        '{ly.chiKou}'
      ],
      HOU:['{h.first}', '{h.second}', '{h.third}'],
      WU_HOU:[
        '{h.qiuYinJie}',
        '{h.miJiao}',
        '{h.shuiQuan}',
        '{h.yanBei}',
        '{h.queShi}',
        '{h.zhiShi}',
        '{h.jiShi}',
        '{h.zhengNiao}',
        '{h.shuiZe}',
        '{h.dongFeng}',
        '{h.zheChongShiZhen}',
        '{h.yuZhi}',
        '{h.taJi}',
        '{h.houYan}',
        '{h.caoMuMengDong}',
        '{h.taoShi}',
        '{h.cangGeng}',
        '{h.yingHua}',
        '{h.xuanNiaoZhi}',
        '{h.leiNai}',
        '{h.shiDian}',
        '{h.tongShi}',
        '{h.tianShu}',
        '{h.hongShi}',
        '{h.pingShi}',
        '{h.mingJiu}',
        '{h.daiSheng}',
        '{h.louGuo}',
        '{h.qiuYinChu}',
        '{h.wangGua}',
        '{h.kuCai}',
        '{h.miCao}',
        '{h.maiQiu}',
        '{h.tangLang}',
        '{h.juShi}',
        '{h.fanShe}',
        '{h.luJia}',
        '{h.tiaoShi}',
        '{h.banXia}',
        '{h.wenFeng}',
        '{h.xiShuai}',
        '{h.yingShi}',
        '{h.fuCao}',
        '{h.tuRun}',
        '{h.daYu}',
        '{h.liangFeng}',
        '{h.baiLu}',
        '{h.hanChan}',
        '{h.yingNai}',
        '{h.tianDi}',
        '{h.heNai}',
        '{h.hongYanLai}',
        '{h.xuanNiaoGui}',
        '{h.qunNiao}',
        '{h.leiShi}',
        '{h.zheChongPiHu}',
        '{h.shuiShiHe}',
        '{h.hongYanLaiBin}',
        '{h.queRu}',
        '{h.juYou}',
        '{h.caiNai}',
        '{h.caoMuHuangLuo}',
        '{h.zheChongXianFu}',
        '{h.shuiShiBing}',
        '{h.diShi}',
        '{h.zhiRu}',
        '{h.hongCang}',
        '{h.tianQi}',
        '{h.biSe}',
        '{h.heDan}',
        '{h.huShi}',
        '{h.liTing}'
      ],
      GAN:['', '{tg.jia}', '{tg.yi}', '{tg.bing}', '{tg.ding}', '{tg.wu}', '{tg.ji}', '{tg.geng}', '{tg.xin}', '{tg.ren}', '{tg.gui}'],
      POSITION_XI:['', '{bg.gen}', '{bg.qian}', '{bg.kun}', '{bg.li}', '{bg.xun}', '{bg.gen}', '{bg.qian}', '{bg.kun}', '{bg.li}', '{bg.xun}'],
      POSITION_YANG_GUI:['', '{bg.kun}', '{bg.kun}', '{bg.dui}', '{bg.qian}', '{bg.gen}', '{bg.kan}', '{bg.li}', '{bg.gen}', '{bg.zhen}', '{bg.xun}'],
      POSITION_YIN_GUI:['', '{bg.gen}', '{bg.kan}', '{bg.qian}', '{bg.dui}', '{bg.kun}', '{bg.kun}', '{bg.gen}', '{bg.li}', '{bg.xun}', '{bg.zhen}'],
      POSITION_FU:['', '{bg.xun}', '{bg.xun}', '{bg.zhen}', '{bg.zhen}', '{bg.kan}', '{bg.li}', '{bg.kun}', '{bg.kun}', '{bg.qian}', '{bg.dui}'],
      POSITION_FU_2:['', '{bg.kan}', '{bg.kun}', '{bg.qian}', '{bg.xun}', '{bg.gen}', '{bg.kan}', '{bg.kun}', '{bg.qian}', '{bg.xun}', '{bg.gen}'],
      POSITION_CAI:['', '{bg.gen}', '{bg.gen}', '{bg.kun}', '{bg.kun}', '{bg.kan}', '{bg.kan}', '{bg.zhen}', '{bg.zhen}', '{bg.li}', '{bg.li}'],
      POSITION_TAI_SUI_YEAR: ['{bg.kan}', '{bg.gen}', '{bg.gen}', '{bg.zhen}', '{bg.xun}', '{bg.xun}', '{bg.li}', '{bg.kun}', '{bg.kun}', '{bg.dui}', '{bg.kan}', '{bg.kan}'],
      POSITION_GAN: ['{bg.zhen}', '{bg.zhen}', '{bg.li}', '{bg.li}', '{ps.center}', '{ps.center}', '{bg.dui}', '{bg.dui}', '{bg.kan}', '{bg.kan}'],
      POSITION_ZHI: ['{bg.kan}', '{ps.center}', '{bg.zhen}', '{bg.zhen}', '{ps.center}', '{bg.li}', '{bg.li}', '{ps.center}', '{bg.dui}', '{bg.dui}', '{ps.center}', '{bg.kan}'],
      POSITION_TAI_DAY:[
        '{ts.zhan}{ts.men}{ts.dui} {ps.wai}{ps.dongNan}',
        '{ts.dui}{ts.mo}{ts.ce} {ps.wai}{ps.dongNan}',
        '{ts.chu}{ts.zao}{ts.lu} {ps.wai}{ps.zhengNan}',
        '{ts.cangKu}{ts.men} {ps.wai}{ps.zhengNan}',
        '{ts.fang}{ts.chuang}{ts.xi} {ps.wai}{ps.zhengNan}',
        '{ts.zhan}{ts.men}{ts.chuang} {ps.wai}{ps.zhengNan}',
        '{ts.zhan}{ts.dui}{ts.mo} {ps.wai}{ps.zhengNan}',
        '{ts.chu}{ts.zao}{ts.ce} {ps.wai}{ps.xiNan}',
        '{ts.cangKu}{ts.lu} {ps.wai}{ps.xiNan}',
        '{ts.fang}{ts.chuang}{ts.men} {ps.wai}{ps.xiNan}',
        '{ts.zhan}{ts.men}{ts.xi} {ps.wai}{ps.xiNan}',
        '{ts.dui}{ts.mo}{ts.chuang} {ps.wai}{ps.xiNan}',
        '{ts.chu}{ts.zao}{ts.dui} {ps.wai}{ps.xiNan}',
        '{ts.cangKu}{ts.ce} {ps.wai}{ps.zhengXi}',
        '{ts.fang}{ts.chuang}{ts.lu} {ps.wai}{ps.zhengXi}',
        '{ts.zhan}{ts.daMen} {ps.wai}{ps.zhengXi}',
        '{ts.dui}{ts.mo}{ts.xi} {ps.wai}{ps.zhengXi}',
        '{ts.chu}{ts.zao}{ts.chuang} {ps.wai}{ps.zhengXi}',
        '{ts.cangKu}{ts.dui} {ps.wai}{ps.xiBei}',
        '{ts.fang}{ts.chuang}{ts.ce} {ps.wai}{ps.xiBei}',
        '{ts.zhan}{ts.men}{ts.lu} {ps.wai}{ps.xiBei}',
        '{ts.dui}{ts.mo}{ts.men} {ps.wai}{ps.xiBei}',
        '{ts.chu}{ts.zao}{ts.xi} {ps.wai}{ps.xiBei}',
        '{ts.cangKu}{ts.chuang} {ps.wai}{ps.xiBei}',
        '{ts.fang}{ts.chuang}{ts.dui} {ps.wai}{ps.zhengBei}',
        '{ts.zhan}{ts.men}{ts.ce} {ps.wai}{ps.zhengBei}',
        '{ts.dui}{ts.mo}{ts.lu} {ps.wai}{ps.zhengBei}',
        '{ts.chu}{ts.zao}{ts.men} {ps.wai}{ps.zhengBei}',
        '{ts.cangKu}{ts.xi} {ps.wai}{ps.zhengBei}',
        '{ts.zhan}{ts.fang}{ts.chuang} {ps.fangNei}{ps.bei}',
        '{ts.zhan}{ts.men}{ts.dui} {ps.fangNei}{ps.bei}',
        '{ts.dui}{ts.mo}{ts.ce} {ps.fangNei}{ps.bei}',
        '{ts.chu}{ts.zao}{ts.lu} {ps.fangNei}{ps.bei}',
        '{ts.cangKu}{ts.men} {ps.fangNei}{ps.bei}',
        '{ts.fang}{ts.chuang}{ts.xi} {ps.fangNei}{ps.center}',
        '{ts.zhan}{ts.men}{ts.chuang} {ps.fangNei}{ps.center}',
        '{ts.zhan}{ts.dui}{ts.mo} {ps.fangNei}{ps.nan}',
        '{ts.chu}{ts.zao}{ts.ce} {ps.fangNei}{ps.nan}',
        '{ts.cangKu}{ts.lu} {ps.fangNei}{ps.nan}',
        '{ts.fang}{ts.chuang}{ts.men} {ps.fangNei}{ps.xi}',
        '{ts.zhan}{ts.men}{ts.xi} {ps.fangNei}{ps.dong}',
        '{ts.dui}{ts.mo}{ts.chuang} {ps.fangNei}{ps.dong}',
        '{ts.chu}{ts.zao}{ts.dui} {ps.fangNei}{ps.dong}',
        '{ts.cangKu}{ts.ce} {ps.fangNei}{ps.dong}',
        '{ts.fang}{ts.chuang}{ts.lu} {ps.fangNei}{ps.center}',
        '{ts.zhan}{ts.daMen} {ps.wai}{ps.dongBei}',
        '{ts.dui}{ts.mo}{ts.xi} {ps.wai}{ps.dongBei}',
        '{ts.chu}{ts.zao}{ts.chuang} {ps.wai}{ps.dongBei}',
        '{ts.cangKu}{ts.dui} {ps.wai}{ps.dongBei}',
        '{ts.fang}{ts.chuang}{ts.ce} {ps.wai}{ps.dongBei}',
        '{ts.zhan}{ts.men}{ts.lu} {ps.wai}{ps.dongBei}',
        '{ts.dui}{ts.mo}{ts.men} {ps.wai}{ps.zhengDong}',
        '{ts.chu}{ts.zao}{ts.xi} {ps.wai}{ps.zhengDong}',
        '{ts.cangKu}{ts.chuang} {ps.wai}{ps.zhengDong}',
        '{ts.fang}{ts.chuang}{ts.dui} {ps.wai}{ps.zhengDong}',
        '{ts.zhan}{ts.men}{ts.ce} {ps.wai}{ps.zhengDong}',
        '{ts.dui}{ts.mo}{ts.lu} {ps.wai}{ps.dongNan}',
        '{ts.chu}{ts.zao}{ts.men} {ps.wai}{ps.dongNan}',
        '{ts.cangKu}{ts.xi} {ps.wai}{ps.dongNan}',
        '{ts.zhan}{ts.fang}{ts.chuang} {ps.wai}{ps.dongNan}'
      ],
      POSITION_TAI_MONTH:[
        '{ts.zhan}{ts.fang}{ts.chuang}',
        '{ts.zhan}{ts.hu}{ts.win}',
        '{ts.zhan}{ts.men}{ts.tang}',
        '{ts.zhan}{ts.chu}{ts.zao}',
        '{ts.zhan}{ts.fang}{ts.chuang}',
        '{ts.zhan}{ts.chuang}{ts.cang}',
        '{ts.zhan}{ts.dui}{ts.mo}',
        '{ts.zhan}{ts.ce}{ts.hu}',
        '{ts.zhan}{ts.men}{ts.fang}',
        '{ts.zhan}{ts.fang}{ts.chuang}',
        '{ts.zhan}{ts.zao}{ts.lu}',
        '{ts.zhan}{ts.fang}{ts.chuang}'
      ],
      ZHI:['', '{dz.zi}', '{dz.chou}', '{dz.yin}', '{dz.mao}', '{dz.chen}', '{dz.si}', '{dz.wu}', '{dz.wei}', '{dz.shen}', '{dz.you}', '{dz.xu}', '{dz.hai}'],
      ZHI_XING:[
        '',
        '{zx.jian}',
        '{zx.chu}',
        '{zx.man}',
        '{zx.ping}',
        '{zx.ding}',
        '{zx.zhi}',
        '{zx.po}',
        '{zx.wei}',
        '{zx.cheng}',
        '{zx.shou}',
        '{zx.kai}',
        '{zx.bi}'
      ],
      JIA_ZI:[
        '{jz.jiaZi}',
        '{jz.yiChou}',
        '{jz.bingYin}',
        '{jz.dingMao}',
        '{jz.wuChen}',
        '{jz.jiSi}',
        '{jz.gengWu}',
        '{jz.xinWei}',
        '{jz.renShen}',
        '{jz.guiYou}',
        '{jz.jiaXu}',
        '{jz.yiHai}',
        '{jz.bingZi}',
        '{jz.dingChou}',
        '{jz.wuYin}',
        '{jz.jiMao}',
        '{jz.gengChen}',
        '{jz.xinSi}',
        '{jz.renWu}',
        '{jz.guiWei}',
        '{jz.jiaShen}',
        '{jz.yiYou}',
        '{jz.bingXu}',
        '{jz.dingHai}',
        '{jz.wuZi}',
        '{jz.jiChou}',
        '{jz.gengYin}',
        '{jz.xinMao}',
        '{jz.renChen}',
        '{jz.guiSi}',
        '{jz.jiaWu}',
        '{jz.yiWei}',
        '{jz.bingShen}',
        '{jz.dingYou}',
        '{jz.wuXu}',
        '{jz.jiHai}',
        '{jz.gengZi}',
        '{jz.xinChou}',
        '{jz.renYin}',
        '{jz.guiMao}',
        '{jz.jiaChen}',
        '{jz.yiSi}',
        '{jz.bingWu}',
        '{jz.dingWei}',
        '{jz.wuShen}',
        '{jz.jiYou}',
        '{jz.gengXu}',
        '{jz.xinHai}',
        '{jz.renZi}',
        '{jz.guiChou}',
        '{jz.jiaYin}',
        '{jz.yiMao}',
        '{jz.bingChen}',
        '{jz.dingSi}',
        '{jz.wuWu}',
        '{jz.jiWei}',
        '{jz.gengShen}',
        '{jz.xinYou}',
        '{jz.renXu}',
        '{jz.guiHai}'
      ],
      TIAN_SHEN:['', '{sn.qingLong}', '{sn.mingTang}', '{sn.tianXing}', '{sn.zhuQue}', '{sn.jinKui}', '{sn.tianDe}', '{sn.baiHu}', '{sn.yuTang}', '{sn.tianLao}', '{sn.xuanWu}', '{sn.siMing}', '{sn.gouChen}'],
      ZHI_TIAN_SHEN_OFFSET: {
        '{dz.zi}': 4,
        '{dz.chou}': 2,
        '{dz.yin}': 0,
        '{dz.mao}': 10,
        '{dz.chen}': 8,
        '{dz.si}': 6,
        '{dz.wu}': 4,
        '{dz.wei}': 2,
        '{dz.shen}': 0,
        '{dz.you}': 10,
        '{dz.xu}': 8,
        '{dz.hai}': 6
      },
      TIAN_SHEN_TYPE: {
        '{sn.qingLong}': '{s.huangDao}',
        '{sn.mingTang}': '{s.huangDao}',
        '{sn.jinKui}': '{s.huangDao}',
        '{sn.tianDe}': '{s.huangDao}',
        '{sn.yuTang}': '{s.huangDao}',
        '{sn.siMing}': '{s.huangDao}',
        '{sn.tianXing}': '{s.heiDao}',
        '{sn.zhuQue}': '{s.heiDao}',
        '{sn.baiHu}': '{s.heiDao}',
        '{sn.tianLao}': '{s.heiDao}',
        '{sn.xuanWu}': '{s.heiDao}',
        '{sn.gouChen}': '{s.heiDao}'
      },
      TIAN_SHEN_TYPE_LUCK:{
        '{s.huangDao}': '{s.goodLuck}',
        '{s.heiDao}': '{s.badLuck}'
      },
      PENGZU_GAN:['', '{tg.jia}不开仓财物耗散', '{tg.yi}不栽植千株不长', '{tg.bing}不修灶必见灾殃', '{tg.ding}不剃头头必生疮', '{tg.wu}不受田田主不祥', '{tg.ji}不破券二比并亡', '{tg.geng}不经络织机虚张', '{tg.xin}不合酱主人不尝', '{tg.ren}不泱水更难提防', '{tg.gui}不词讼理弱敌强'],
      PENGZU_ZHI:['', '{dz.zi}不问卜自惹祸殃', '{dz.chou}不冠带主不还乡', '{dz.yin}不祭祀神鬼不尝', '{dz.mao}不穿井水泉不香', '{dz.chen}不哭泣必主重丧', '{dz.si}不远行财物伏藏', '{dz.wu}不苫盖屋主更张', '{dz.wei}不服药毒气入肠', '{dz.shen}不安床鬼祟入房', '{dz.you}不会客醉坐颠狂', '{dz.xu}不吃犬作怪上床', '{dz.hai}不嫁娶不利新郎'],
      NUMBER:['{n.zero}', '{n.one}', '{n.two}', '{n.three}', '{n.four}', '{n.five}', '{n.six}', '{n.seven}', '{n.eight}', '{n.nine}', '{n.ten}', '{n.eleven}', '{n.twelve}'],
      MONTH:[
        '',
        '{m.one}',
        '{m.two}',
        '{m.three}',
        '{m.four}',
        '{m.five}',
        '{m.six}',
        '{m.seven}',
        '{m.eight}',
        '{m.nine}',
        '{m.ten}',
        '{m.eleven}',
        '{m.twelve}'
      ],
      SEASON:[
        '',
        '{od.first}{sz.chun}',
        '{od.second}{sz.chun}',
        '{od.third}{sz.chun}',
        '{od.first}{sz.xia}',
        '{od.second}{sz.xia}',
        '{od.third}{sz.xia}',
        '{od.first}{sz.qiu}',
        '{od.second}{sz.qiu}',
        '{od.third}{sz.qiu}',
        '{od.first}{sz.dong}',
        '{od.second}{sz.dong}',
        '{od.third}{sz.dong}'
      ],
      SHENGXIAO:['', '{sx.rat}', '{sx.ox}', '{sx.tiger}', '{sx.rabbit}', '{sx.dragon}', '{sx.snake}', '{sx.horse}', '{sx.goat}', '{sx.monkey}', '{sx.rooster}', '{sx.dog}', '{sx.pig}'],
      DAY:[
        '',
        '{d.one}',
        '{d.two}',
        '{d.three}',
        '{d.four}',
        '{d.five}',
        '{d.six}',
        '{d.seven}',
        '{d.eight}',
        '{d.nine}',
        '{d.ten}',
        '{d.eleven}',
        '{d.twelve}',
        '{d.thirteen}',
        '{d.fourteen}',
        '{d.fifteen}',
        '{d.sixteen}',
        '{d.seventeen}',
        '{d.eighteen}',
        '{d.nighteen}',
        '{d.twenty}',
        '{d.twentyOne}',
        '{d.twentyTwo}',
        '{d.twentyThree}',
        '{d.twentyFour}',
        '{d.twentyFive}',
        '{d.twentySix}',
        '{d.twentySeven}',
        '{d.twentyEight}',
        '{d.twentyNine}',
        '{d.thirty}'
      ],
      YUE_XIANG:[
        '',
        '{yx.shuo}',
        '{yx.jiShuo}',
        '{yx.eMeiXin}',
        '{yx.eMeiXin}',
        '{yx.eMei}',
        '{yx.xi}',
        '{yx.shangXian}',
        '{yx.shangXian}',
        '{yx.jiuYe}',
        '{yx.night}',
        '{yx.night}',
        '{yx.night}',
        '{yx.jianYingTu}',
        '{yx.xiaoWang}',
        '{yx.wang}',
        '{yx.jiWang}',
        '{yx.liDai}',
        '{yx.juDai}',
        '{yx.qinDai}',
        '{yx.gengDai}',
        '{yx.jianKuiTu}',
        '{yx.xiaXian}',
        '{yx.xiaXian}',
        '{yx.youMing}',
        '{yx.youMing}',
        '{yx.eMeiCan}',
        '{yx.eMeiCan}',
        '{yx.can}',
        '{yx.xiao}',
        '{yx.hui}'
      ],
      XIU: {
        '{dz.shen}1': '{xx.bi}',
        '{dz.shen}2': '{xx.yi}',
        '{dz.shen}3': '{xx.ji}',
        '{dz.shen}4': '{xx.kui}',
        '{dz.shen}5': '{xx.gui}',
        '{dz.shen}6': '{xx.di}',
        '{dz.shen}0': '{xx.xu}',
        '{dz.zi}1': '{xx.bi}',
        '{dz.zi}2': '{xx.yi}',
        '{dz.zi}3': '{xx.ji}',
        '{dz.zi}4': '{xx.kui}',
        '{dz.zi}5': '{xx.gui}',
        '{dz.zi}6': '{xx.di}',
        '{dz.zi}0': '{xx.xu}',
        '{dz.chen}1': '{xx.bi}',
        '{dz.chen}2': '{xx.yi}',
        '{dz.chen}3': '{xx.ji}',
        '{dz.chen}4': '{xx.kui}',
        '{dz.chen}5': '{xx.gui}',
        '{dz.chen}6': '{xx.di}',
        '{dz.chen}0': '{xx.xu}',
        '{dz.si}1': '{xx.wei}',
        '{dz.si}2': '{xx.zi}',
        '{dz.si}3': '{xx.zhen}',
        '{dz.si}4': '{xx.dou}',
        '{dz.si}5': '{xx.lou}',
        '{dz.si}6': '{xx.liu}',
        '{dz.si}0': '{xx.fang}',
        '{dz.you}1': '{xx.wei}',
        '{dz.you}2': '{xx.zi}',
        '{dz.you}3': '{xx.zhen}',
        '{dz.you}4': '{xx.dou}',
        '{dz.you}5': '{xx.lou}',
        '{dz.you}6': '{xx.liu}',
        '{dz.you}0': '{xx.fang}',
        '{dz.chou}1': '{xx.wei}',
        '{dz.chou}2': '{xx.zi}',
        '{dz.chou}3': '{xx.zhen}',
        '{dz.chou}4': '{xx.dou}',
        '{dz.chou}5': '{xx.lou}',
        '{dz.chou}6': '{xx.liu}',
        '{dz.chou}0': '{xx.fang}',
        '{dz.yin}1': '{xx.xin}',
        '{dz.yin}2': '{xx.shi}',
        '{dz.yin}3': '{xx.can}',
        '{dz.yin}4': '{xx.jiao}',
        '{dz.yin}5': '{xx.niu}',
        '{dz.yin}6': '{xx.vei}',
        '{dz.yin}0': '{xx.xing}',
        '{dz.wu}1': '{xx.xin}',
        '{dz.wu}2': '{xx.shi}',
        '{dz.wu}3': '{xx.can}',
        '{dz.wu}4': '{xx.jiao}',
        '{dz.wu}5': '{xx.niu}',
        '{dz.wu}6': '{xx.vei}',
        '{dz.wu}0': '{xx.xing}',
        '{dz.xu}1': '{xx.xin}',
        '{dz.xu}2': '{xx.shi}',
        '{dz.xu}3': '{xx.can}',
        '{dz.xu}4': '{xx.jiao}',
        '{dz.xu}5': '{xx.niu}',
        '{dz.xu}6': '{xx.vei}',
        '{dz.xu}0': '{xx.xing}',
        '{dz.hai}1': '{xx.zhang}',
        '{dz.hai}2': '{xx.tail}',
        '{dz.hai}3': '{xx.qiang}',
        '{dz.hai}4': '{xx.jing}',
        '{dz.hai}5': '{xx.kang}',
        '{dz.hai}6': '{xx.nv}',
        '{dz.hai}0': '{xx.mao}',
        '{dz.mao}1': '{xx.zhang}',
        '{dz.mao}2': '{xx.tail}',
        '{dz.mao}3': '{xx.qiang}',
        '{dz.mao}4': '{xx.jing}',
        '{dz.mao}5': '{xx.kang}',
        '{dz.mao}6': '{xx.nv}',
        '{dz.mao}0': '{xx.mao}',
        '{dz.wei}1': '{xx.zhang}',
        '{dz.wei}2': '{xx.tail}',
        '{dz.wei}3': '{xx.qiang}',
        '{dz.wei}4': '{xx.jing}',
        '{dz.wei}5': '{xx.kang}',
        '{dz.wei}6': '{xx.nv}',
        '{dz.wei}0': '{xx.mao}'
      },
      XIU_LUCK:{
        '{xx.jiao}': '{s.goodLuck}',
        '{xx.kang}': '{s.badLuck}',
        '{xx.di}': '{s.badLuck}',
        '{xx.fang}': '{s.goodLuck}',
        '{xx.xin}': '{s.badLuck}',
        '{xx.tail}': '{s.goodLuck}',
        '{xx.ji}': '{s.goodLuck}',
        '{xx.dou}': '{s.goodLuck}',
        '{xx.niu}': '{s.badLuck}',
        '{xx.nv}': '{s.badLuck}',
        '{xx.xu}': '{s.badLuck}',
        '{xx.wei}': '{s.badLuck}',
        '{xx.shi}': '{s.goodLuck}',
        '{xx.qiang}': '{s.goodLuck}',
        '{xx.kui}': '{s.badLuck}',
        '{xx.lou}': '{s.goodLuck}',
        '{xx.vei}': '{s.goodLuck}',
        '{xx.mao}': '{s.badLuck}',
        '{xx.bi}': '{s.goodLuck}',
        '{xx.zi}': '{s.badLuck}',
        '{xx.can}': '{s.goodLuck}',
        '{xx.jing}': '{s.goodLuck}',
        '{xx.gui}': '{s.badLuck}',
        '{xx.liu}': '{s.badLuck}',
        '{xx.xing}': '{s.badLuck}',
        '{xx.zhang}': '{s.goodLuck}',
        '{xx.yi}': '{s.badLuck}',
        '{xx.zhen}': '{s.goodLuck}'
      },
      XIU_SONG:{
        '{xx.jiao}': '角星造作主荣昌，外进田财及女郎，嫁娶婚姻出贵子，文人及第见君王，惟有埋葬不可用，三年之后主瘟疫，起工修筑坟基地，堂前立见主人凶。',
        '{xx.kang}': '亢星造作长房当，十日之中主有殃，田地消磨官失职，接运定是虎狼伤，嫁娶婚姻用此日，儿孙新妇守空房，埋葬若还用此日，当时害祸主重伤。',
        '{xx.di}': '氐星造作主灾凶，费尽田园仓库空，埋葬不可用此日，悬绳吊颈祸重重，若是婚姻离别散，夜招浪子入房中，行船必定遭沉没，更生聋哑子孙穷。',
        '{xx.fang}': '房星造作田园进，钱财牛马遍山岗，更招外处田庄宅，荣华富贵福禄康，埋葬若然用此日，高官进职拜君王，嫁娶嫦娥至月殿，三年抱子至朝堂。',
        '{xx.xin}': '心星造作大为凶，更遭刑讼狱囚中，忤逆官非宅产退，埋葬卒暴死相从，婚姻若是用此日，子死儿亡泪满胸，三年之内连遭祸，事事教君没始终。',
        '{xx.tail}': '尾星造作主天恩，富贵荣华福禄增，招财进宝兴家宅，和合婚姻贵子孙，埋葬若能依此日，男清女正子孙兴，开门放水招田宅，代代公侯远播名。',
        '{xx.ji}': '箕星造作主高强，岁岁年年大吉昌，埋葬修坟大吉利，田蚕牛马遍山岗，开门放水招田宅，箧满金银谷满仓，福荫高官加禄位，六亲丰禄乐安康。',
        '{xx.dou}': '斗星造作主招财，文武官员位鼎台，田宅家财千万进，坟堂修筑贵富来，开门放水招牛马，旺蚕男女主和谐，遇此吉宿来照护，时支福庆永无灾。',
        '{xx.niu}': '牛星造作主灾危，九横三灾不可推，家宅不安人口退，田蚕不利主人衰，嫁娶婚姻皆自损，金银财谷渐无之，若是开门并放水，牛猪羊马亦伤悲。',
        '{xx.nv}': '女星造作损婆娘，兄弟相嫌似虎狼，埋葬生灾逢鬼怪，颠邪疾病主瘟惶，为事遭官财失散，泻利留连不可当，开门放水用此日，全家财散主离乡。',
        '{xx.xu}': '虚星造作主灾殃，男女孤眠不一双，内乱风声无礼节，儿孙媳妇伴人床，开门放水遭灾祸，虎咬蛇伤又卒亡，三三五五连年病，家破人亡不可当。',
        '{xx.wei}': '危星不可造高楼，自遭刑吊见血光，三年孩子遭水厄，后生出外永不还，埋葬若还逢此日，周年百日取高堂，三年两载一悲伤，开门放水到官堂。',
        '{xx.shi}': '室星修造进田牛，儿孙代代近王侯，家贵荣华天上至，寿如彭祖八千秋，开门放水招财帛，和合婚姻生贵儿，埋葬若能依此日，门庭兴旺福无休。',
        '{xx.qiang}': '壁星造作主增财，丝蚕大熟福滔天，奴婢自来人口进，开门放水出英贤，埋葬招财官品进，家中诸事乐陶然，婚姻吉利主贵子，早播名誉著祖鞭。',
        '{xx.kui}': '奎星造作得祯祥，家内荣和大吉昌，若是埋葬阴卒死，当年定主两三伤，看看军令刑伤到，重重官事主瘟惶，开门放水遭灾祸，三年两次损儿郎。',
        '{xx.lou}': '娄星修造起门庭，财旺家和事事兴，外进钱财百日进，一家兄弟播高名，婚姻进益生贵子，玉帛金银箱满盈，放水开门皆吉利，男荣女贵寿康宁。',
        '{xx.vei}': '胃星造作事如何，家贵荣华喜气多，埋葬贵临官禄位，夫妇齐眉永保康，婚姻遇此家富贵，三灾九祸不逢他，从此门前多吉庆，儿孙代代拜金阶。',
        '{xx.mao}': '昴星造作进田牛，埋葬官灾不得休，重丧二日三人死，尽卖田园不记增，开门放水招灾祸，三岁孩儿白了头，婚姻不可逢此日，死别生离是可愁。',
        '{xx.bi}': '毕星造作主光前，买得田园有余钱，埋葬此日添官职，田蚕大熟永丰年，开门放水多吉庆，合家人口得安然，婚姻若得逢此日，生得孩儿福寿全。',
        '{xx.zi}': '觜星造作有徒刑，三年必定主伶丁，埋葬卒死多因此，取定寅年使杀人，三丧不止皆由此，一人药毒二人身，家门田地皆退败，仓库金银化作尘。',
        '{xx.can}': '参星造作旺人家，文星照耀大光华，只因造作田财旺，埋葬招疾哭黄沙，开门放水加官职，房房子孙见田加，婚姻许遁遭刑克，男女朝开幕落花。',
        '{xx.jing}': '井星造作旺蚕田，金榜题名第一光，埋葬须防惊卒死，狂颠风疾入黄泉，开门放水招财帛，牛马猪羊旺莫言，贵人田塘来入宅，儿孙兴旺有余钱。',
        '{xx.gui}': '鬼星起造卒人亡，堂前不见主人郎，埋葬此日官禄至，儿孙代代近君王，开门放水须伤死，嫁娶夫妻不久长，修土筑墙伤产女，手扶双女泪汪汪。',
        '{xx.liu}': '柳星造作主遭官，昼夜偷闭不暂安，埋葬瘟惶多疾病，田园退尽守冬寒，开门放水遭聋瞎，腰驼背曲似弓弯，更有棒刑宜谨慎，妇人随客走盘桓。',
        '{xx.xing}': '星宿日好造新房，进职加官近帝王，不可埋葬并放水，凶星临位女人亡，生离死别无心恋，要自归休别嫁郎，孔子九曲殊难度，放水开门天命伤。',
        '{xx.zhang}': '张星日好造龙轩，年年并见进庄田，埋葬不久升官职，代代为官近帝前，开门放水招财帛，婚姻和合福绵绵，田蚕人满仓库满，百般顺意自安然。',
        '{xx.yi}': '翼星不利架高堂，三年二载见瘟惶，埋葬若还逢此日，子孙必定走他乡，婚姻此日不宜利，归家定是不相当，开门放水家须破，少女恋花贪外郎。',
        '{xx.zhen}': '轸星临水造龙宫，代代为官受皇封，富贵荣华增寿禄，库满仓盈自昌隆，埋葬文昌来照助，宅舍安宁不见凶，更有为官沾帝宠，婚姻龙子入龙宫。'
      },
      ZHENG:{
        '{xx.jiao}': '{wx.mu}',
        '{xx.jing}': '{wx.mu}',
        '{xx.kui}': '{wx.mu}',
        '{xx.dou}': '{wx.mu}',
        '{xx.kang}': '{wx.jin}',
        '{xx.gui}': '{wx.jin}',
        '{xx.lou}': '{wx.jin}',
        '{xx.niu}': '{wx.jin}',
        '{xx.di}': '{wx.tu}',
        '{xx.liu}': '{wx.tu}',
        '{xx.vei}': '{wx.tu}',
        '{xx.nv}': '{wx.tu}',
        '{xx.fang}': '{wx.ri}',
        '{xx.xing}': '{wx.ri}',
        '{xx.mao}': '{wx.ri}',
        '{xx.xu}': '{wx.ri}',
        '{xx.xin}': '{wx.yue}',
        '{xx.zhang}': '{wx.yue}',
        '{xx.bi}': '{wx.yue}',
        '{xx.wei}': '{wx.yue}',
        '{xx.tail}': '{wx.huo}',
        '{xx.yi}': '{wx.huo}',
        '{xx.zi}': '{wx.huo}',
        '{xx.shi}': '{wx.huo}',
        '{xx.ji}': '{wx.shui}',
        '{xx.zhen}': '{wx.shui}',
        '{xx.can}': '{wx.shui}',
        '{xx.qiang}': '{wx.shui}'
      },
      ANIMAL:{
        '{xx.jiao}': '{dw.jiao}',
        '{xx.dou}': '{dw.xie}',
        '{xx.kui}': '{dw.lang}',
        '{xx.jing}': '{dw.han}',
        '{xx.kang}': '{dw.long}',
        '{xx.niu}': '{dw.niu}',
        '{xx.lou}': '{dw.gou}',
        '{xx.gui}': '{dw.yang}',
        '{xx.nv}': '{dw.fu}',
        '{xx.di}': '{dw.he}',
        '{xx.vei}': '{dw.zhi}',
        '{xx.liu}': '{dw.zhang}',
        '{xx.fang}': '{dw.tu}',
        '{xx.xu}': '{dw.shu}',
        '{xx.mao}': '{dw.ji}',
        '{xx.xing}': '{dw.ma}',
        '{xx.xin}': '{dw.huLi}',
        '{xx.wei}': '{dw.yan}',
        '{xx.bi}': '{dw.wu}',
        '{xx.zhang}': '{dw.lu}',
        '{xx.tail}': '{dw.hu}',
        '{xx.shi}': '{dw.zhu}',
        '{xx.zi}': '{dw.hou}',
        '{xx.yi}': '{dw.she}',
        '{xx.ji}': '{dw.bao}',
        '{xx.qiang}': '{dw.xu}',
        '{xx.can}': '{dw.yuan}',
        '{xx.zhen}': '{dw.yin}'
      },
      GONG:{
        '{xx.jiao}': '{ps.dong}',
        '{xx.jing}': '{ps.nan}',
        '{xx.kui}': '{ps.xi}',
        '{xx.dou}': '{ps.bei}',
        '{xx.kang}': '{ps.dong}',
        '{xx.gui}': '{ps.nan}',
        '{xx.lou}': '{ps.xi}',
        '{xx.niu}': '{ps.bei}',
        '{xx.di}': '{ps.dong}',
        '{xx.liu}': '{ps.nan}',
        '{xx.vei}': '{ps.xi}',
        '{xx.nv}': '{ps.bei}',
        '{xx.fang}': '{ps.dong}',
        '{xx.xing}': '{ps.nan}',
        '{xx.mao}': '{ps.xi}',
        '{xx.xu}': '{ps.bei}',
        '{xx.xin}': '{ps.dong}',
        '{xx.zhang}': '{ps.nan}',
        '{xx.bi}': '{ps.xi}',
        '{xx.wei}': '{ps.bei}',
        '{xx.tail}': '{ps.dong}',
        '{xx.yi}': '{ps.nan}',
        '{xx.zi}': '{ps.xi}',
        '{xx.shi}': '{ps.bei}',
        '{xx.ji}': '{ps.dong}',
        '{xx.zhen}': '{ps.nan}',
        '{xx.can}': '{ps.xi}',
        '{xx.qiang}': '{ps.bei}'
      },
      SHOU:{
        '{ps.dong}':'{sn.qingLong}',
        '{ps.nan}':'{sn.zhuQue}',
        '{ps.xi}':'{sn.baiHu}',
        '{ps.bei}':'{sn.xuanWu}'
      },
      FESTIVAL:{
        '1-1':'{jr.chunJie}',
        '1-15':'{jr.yuanXiao}',
        '2-2':'{jr.longTou}',
        '5-5':'{jr.duanWu}',
        '7-7':'{jr.qiXi}',
        '8-15':'{jr.zhongQiu}',
        '9-9':'{jr.chongYang}',
        '12-8':'{jr.laBa}'
      },
      OTHER_FESTIVAL:{'1-4':['接神日'],'1-5':['隔开日'],'1-7':['人日'],'1-8':['谷日','顺星节'],'1-9':['天日'],'1-10':['地日'],'1-20':['天穿节'],'1-25':['填仓节'],'1-30':['正月晦'],'2-1':['中和节'],'2-2':['社日节'],'3-3':['上巳节'],'5-20':['分龙节'],'5-25':['会龙节'],'6-6':['天贶节'],'6-24':['观莲节'],'6-25':['五谷母节'],'7-15':['中元节'],'7-22':['财神节'],'7-29':['地藏节'],'8-1':['天灸日'],'10-1':['寒衣节'],'10-10':['十成节'],'10-15':['下元节'],'12-7':['驱傩日'],'12-16':['尾牙'],'12-24':['祭灶日']},
      CHONG:['{dz.wu}', '{dz.wei}', '{dz.shen}', '{dz.you}', '{dz.xu}', '{dz.hai}', '{dz.zi}', '{dz.chou}', '{dz.yin}', '{dz.mao}', '{dz.chen}', '{dz.si}'],
      CHONG_GAN:['{tg.wu}', '{tg.ji}', '{tg.geng}', '{tg.xin}', '{tg.ren}', '{tg.gui}', '{tg.jia}', '{tg.yi}', '{tg.bing}', '{tg.ding}'],
      CHONG_GAN_TIE:['{tg.ji}', '{tg.wu}', '{tg.xin}', '{tg.geng}', '{tg.gui}', '{tg.ren}', '{tg.yi}', '{tg.jia}', '{tg.ding}', '{tg.bing}'],
      CHONG_GAN_4:['{tg.geng}', '{tg.xin}', '{tg.ren}', '{tg.gui}', '', '', '{tg.jia}', '{tg.yi}', '{tg.bing}', '{tg.ding}'],
      HE_GAN_5:['{tg.ji}', '{tg.geng}', '{tg.xin}', '{tg.ren}', '{tg.gui}', '{tg.jia}', '{tg.yi}', '{tg.bing}', '{tg.ding}', '{tg.wu}'],
      HE_ZHI_6:['{dz.chou}', '{dz.zi}', '{dz.hai}', '{dz.xu}', '{dz.you}', '{dz.shen}', '{dz.wei}', '{dz.wu}', '{dz.si}', '{dz.chen}', '{dz.mao}', '{dz.yin}'],
      SHA:{
        '{dz.zi}':'{ps.nan}',
        '{dz.chou}':'{ps.dong}',
        '{dz.yin}':'{ps.bei}',
        '{dz.mao}':'{ps.xi}',
        '{dz.chen}':'{ps.nan}',
        '{dz.si}':'{ps.dong}',
        '{dz.wu}':'{ps.bei}',
        '{dz.wei}':'{ps.xi}',
        '{dz.shen}':'{ps.nan}',
        '{dz.you}':'{ps.dong}',
        '{dz.xu}':'{ps.bei}',
        '{dz.hai}':'{ps.xi}'
      },
      POSITION_DESC:{
        '{bg.kan}':'{ps.zhengBei}',
        '{bg.gen}':'{ps.dongBei}',
        '{bg.zhen}':'{ps.zhengDong}',
        '{bg.xun}':'{ps.dongNan}',
        '{bg.li}':'{ps.zhengNan}',
        '{bg.kun}':'{ps.xiNan}',
        '{bg.dui}':'{ps.zhengXi}',
        '{bg.qian}':'{ps.xiBei}',
        '{ps.center}':'{ps.zhong}'
      },
      NAYIN:{
        '{jz.jiaZi}': '{ny.haiZhong}{wx.jin}',
        '{jz.jiaWu}': '{ny.shaZhong}{wx.jin}',
        '{jz.bingYin}': '{ny.luZhong}{wx.huo}',
        '{jz.bingShen}': '{ny.shanXia}{wx.huo}',
        '{jz.wuChen}': '{ny.daLin}{wx.mu}',
        '{jz.wuXu}': '{ny.pingDi}{wx.mu}',
        '{jz.gengWu}': '{ny.luPang}{wx.tu}',
        '{jz.gengZi}': '{ny.biShang}{wx.tu}',
        '{jz.renShen}': '{ny.jianFeng}{wx.jin}',
        '{jz.renYin}': '{ny.jinBo}{wx.jin}',
        '{jz.jiaXu}': '{ny.shanTou}{wx.huo}',
        '{jz.jiaChen}': '{ny.fuDeng}{wx.huo}',
        '{jz.bingZi}': '{ny.jianXia}{wx.shui}',
        '{jz.bingWu}': '{ny.tianHe}{wx.shui}',
        '{jz.wuYin}': '{ny.chengTou}{wx.tu}',
        '{jz.wuShen}': '{ny.daYi}{wx.tu}',
        '{jz.gengChen}': '{ny.baiLa}{wx.jin}',
        '{jz.gengXu}': '{ny.chaiChuan}{wx.jin}',
        '{jz.renWu}': '{ny.yangLiu}{wx.mu}',
        '{jz.renZi}': '{ny.sangZhe}{wx.mu}',
        '{jz.jiaShen}': '{ny.quanZhong}{wx.shui}',
        '{jz.jiaYin}': '{ny.daXi}{wx.shui}',
        '{jz.bingXu}': '{ny.wuShang}{wx.tu}',
        '{jz.bingChen}': '{ny.shaZhong}{wx.tu}',
        '{jz.wuZi}': '{ny.piLi}{wx.huo}',
        '{jz.wuWu}': '{ny.tianShang}{wx.huo}',
        '{jz.gengYin}': '{ny.songBo}{wx.mu}',
        '{jz.gengShen}': '{ny.shiLiu}{wx.mu}',
        '{jz.renChen}': '{ny.changLiu}{wx.shui}',
        '{jz.renXu}': '{ny.daHai}{wx.shui}',
        '{jz.yiChou}': '{ny.haiZhong}{wx.jin}',
        '{jz.yiWei}': '{ny.shaZhong}{wx.jin}',
        '{jz.dingMao}': '{ny.luZhong}{wx.huo}',
        '{jz.dingYou}': '{ny.shanXia}{wx.huo}',
        '{jz.jiSi}': '{ny.daLin}{wx.mu}',
        '{jz.jiHai}': '{ny.pingDi}{wx.mu}',
        '{jz.xinWei}': '{ny.luPang}{wx.tu}',
        '{jz.xinChou}': '{ny.biShang}{wx.tu}',
        '{jz.guiYou}': '{ny.jianFeng}{wx.jin}',
        '{jz.guiMao}': '{ny.jinBo}{wx.jin}',
        '{jz.yiHai}': '{ny.shanTou}{wx.huo}',
        '{jz.yiSi}': '{ny.fuDeng}{wx.huo}',
        '{jz.dingChou}': '{ny.jianXia}{wx.shui}',
        '{jz.dingWei}': '{ny.tianHe}{wx.shui}',
        '{jz.jiMao}': '{ny.chengTou}{wx.tu}',
        '{jz.jiYou}': '{ny.daYi}{wx.tu}',
        '{jz.xinSi}': '{ny.baiLa}{wx.jin}',
        '{jz.xinHai}': '{ny.chaiChuan}{wx.jin}',
        '{jz.guiWei}': '{ny.yangLiu}{wx.mu}',
        '{jz.guiChou}': '{ny.sangZhe}{wx.mu}',
        '{jz.yiYou}': '{ny.quanZhong}{wx.shui}',
        '{jz.yiMao}': '{ny.daXi}{wx.shui}',
        '{jz.dingHai}': '{ny.wuShang}{wx.tu}',
        '{jz.dingSi}': '{ny.shaZhong}{wx.tu}',
        '{jz.jiChou}': '{ny.piLi}{wx.huo}',
        '{jz.jiWei}': '{ny.tianShang}{wx.huo}',
        '{jz.xinMao}': '{ny.songBo}{wx.mu}',
        '{jz.xinYou}': '{ny.shiLiu}{wx.mu}',
        '{jz.guiSi}': '{ny.changLiu}{wx.shui}',
        '{jz.guiHai}': '{ny.daHai}{wx.shui}'
      },
      WU_XING_GAN:{
        '{tg.jia}':'{wx.mu}',
        '{tg.yi}':'{wx.mu}',
        '{tg.bing}':'{wx.huo}',
        '{tg.ding}':'{wx.huo}',
        '{tg.wu}':'{wx.tu}',
        '{tg.ji}':'{wx.tu}',
        '{tg.geng}':'{wx.jin}',
        '{tg.xin}':'{wx.jin}',
        '{tg.ren}':'{wx.shui}',
        '{tg.gui}':'{wx.shui}'
      },
      WU_XING_ZHI:{
        '{dz.yin}':'{wx.mu}',
        '{dz.mao}':'{wx.mu}',
        '{dz.si}':'{wx.huo}',
        '{dz.wu}':'{wx.huo}',
        '{dz.chen}':'{wx.tu}',
        '{dz.chou}':'{wx.tu}',
        '{dz.xu}':'{wx.tu}',
        '{dz.wei}':'{wx.tu}',
        '{dz.shen}':'{wx.jin}',
        '{dz.you}':'{wx.jin}',
        '{dz.hai}':'{wx.shui}',
        '{dz.zi}':'{wx.shui}'
      },
      SHI_SHEN:{
        '{tg.jia}{tg.jia}':'{ss.biJian}',
        '{tg.jia}{tg.yi}':'{ss.jieCai}',
        '{tg.jia}{tg.bing}':'{ss.shiShen}',
        '{tg.jia}{tg.ding}':'{ss.shangGuan}',
        '{tg.jia}{tg.wu}':'{ss.pianCai}',
        '{tg.jia}{tg.ji}':'{ss.zhengCai}',
        '{tg.jia}{tg.geng}':'{ss.qiSha}',
        '{tg.jia}{tg.xin}':'{ss.zhengGuan}',
        '{tg.jia}{tg.ren}':'{ss.pianYin}',
        '{tg.jia}{tg.gui}':'{ss.zhengYin}',
        '{tg.yi}{tg.yi}':'{ss.biJian}',
        '{tg.yi}{tg.jia}':'{ss.jieCai}',
        '{tg.yi}{tg.ding}':'{ss.shiShen}',
        '{tg.yi}{tg.bing}':'{ss.shangGuan}',
        '{tg.yi}{tg.ji}':'{ss.pianCai}',
        '{tg.yi}{tg.wu}':'{ss.zhengCai}',
        '{tg.yi}{tg.xin}':'{ss.qiSha}',
        '{tg.yi}{tg.geng}':'{ss.zhengGuan}',
        '{tg.yi}{tg.gui}':'{ss.pianYin}',
        '{tg.yi}{tg.ren}':'{ss.zhengYin}',
        '{tg.bing}{tg.bing}':'{ss.biJian}',
        '{tg.bing}{tg.ding}':'{ss.jieCai}',
        '{tg.bing}{tg.wu}':'{ss.shiShen}',
        '{tg.bing}{tg.ji}':'{ss.shangGuan}',
        '{tg.bing}{tg.geng}':'{ss.pianCai}',
        '{tg.bing}{tg.xin}':'{ss.zhengCai}',
        '{tg.bing}{tg.ren}':'{ss.qiSha}',
        '{tg.bing}{tg.gui}':'{ss.zhengGuan}',
        '{tg.bing}{tg.jia}':'{ss.pianYin}',
        '{tg.bing}{tg.yi}':'{ss.zhengYin}',
        '{tg.ding}{tg.ding}':'{ss.biJian}',
        '{tg.ding}{tg.bing}':'{ss.jieCai}',
        '{tg.ding}{tg.ji}':'{ss.shiShen}',
        '{tg.ding}{tg.wu}':'{ss.shangGuan}',
        '{tg.ding}{tg.xin}':'{ss.pianCai}',
        '{tg.ding}{tg.geng}':'{ss.zhengCai}',
        '{tg.ding}{tg.gui}':'{ss.qiSha}',
        '{tg.ding}{tg.ren}':'{ss.zhengGuan}',
        '{tg.ding}{tg.yi}':'{ss.pianYin}',
        '{tg.ding}{tg.jia}':'{ss.zhengYin}',
        '{tg.wu}{tg.wu}':'{ss.biJian}',
        '{tg.wu}{tg.ji}':'{ss.jieCai}',
        '{tg.wu}{tg.geng}':'{ss.shiShen}',
        '{tg.wu}{tg.xin}':'{ss.shangGuan}',
        '{tg.wu}{tg.ren}':'{ss.pianCai}',
        '{tg.wu}{tg.gui}':'{ss.zhengCai}',
        '{tg.wu}{tg.jia}':'{ss.qiSha}',
        '{tg.wu}{tg.yi}':'{ss.zhengGuan}',
        '{tg.wu}{tg.bing}':'{ss.pianYin}',
        '{tg.wu}{tg.ding}':'{ss.zhengYin}',
        '{tg.ji}{tg.ji}':'{ss.biJian}',
        '{tg.ji}{tg.wu}':'{ss.jieCai}',
        '{tg.ji}{tg.xin}':'{ss.shiShen}',
        '{tg.ji}{tg.geng}':'{ss.shangGuan}',
        '{tg.ji}{tg.gui}':'{ss.pianCai}',
        '{tg.ji}{tg.ren}':'{ss.zhengCai}',
        '{tg.ji}{tg.yi}':'{ss.qiSha}',
        '{tg.ji}{tg.jia}':'{ss.zhengGuan}',
        '{tg.ji}{tg.ding}':'{ss.pianYin}',
        '{tg.ji}{tg.bing}':'{ss.zhengYin}',
        '{tg.geng}{tg.geng}':'{ss.biJian}',
        '{tg.geng}{tg.xin}':'{ss.jieCai}',
        '{tg.geng}{tg.ren}':'{ss.shiShen}',
        '{tg.geng}{tg.gui}':'{ss.shangGuan}',
        '{tg.geng}{tg.jia}':'{ss.pianCai}',
        '{tg.geng}{tg.yi}':'{ss.zhengCai}',
        '{tg.geng}{tg.bing}':'{ss.qiSha}',
        '{tg.geng}{tg.ding}':'{ss.zhengGuan}',
        '{tg.geng}{tg.wu}':'{ss.pianYin}',
        '{tg.geng}{tg.ji}':'{ss.zhengYin}',
        '{tg.xin}{tg.xin}':'{ss.biJian}',
        '{tg.xin}{tg.geng}':'{ss.jieCai}',
        '{tg.xin}{tg.gui}':'{ss.shiShen}',
        '{tg.xin}{tg.ren}':'{ss.shangGuan}',
        '{tg.xin}{tg.yi}':'{ss.pianCai}',
        '{tg.xin}{tg.jia}':'{ss.zhengCai}',
        '{tg.xin}{tg.ding}':'{ss.qiSha}',
        '{tg.xin}{tg.bing}':'{ss.zhengGuan}',
        '{tg.xin}{tg.ji}':'{ss.pianYin}',
        '{tg.xin}{tg.wu}':'{ss.zhengYin}',
        '{tg.ren}{tg.ren}':'{ss.biJian}',
        '{tg.ren}{tg.gui}':'{ss.jieCai}',
        '{tg.ren}{tg.jia}':'{ss.shiShen}',
        '{tg.ren}{tg.yi}':'{ss.shangGuan}',
        '{tg.ren}{tg.bing}':'{ss.pianCai}',
        '{tg.ren}{tg.ding}':'{ss.zhengCai}',
        '{tg.ren}{tg.wu}':'{ss.qiSha}',
        '{tg.ren}{tg.ji}':'{ss.zhengGuan}',
        '{tg.ren}{tg.geng}':'{ss.pianYin}',
        '{tg.ren}{tg.xin}':'{ss.zhengYin}',
        '{tg.gui}{tg.gui}':'{ss.biJian}',
        '{tg.gui}{tg.ren}':'{ss.jieCai}',
        '{tg.gui}{tg.yi}':'{ss.shiShen}',
        '{tg.gui}{tg.jia}':'{ss.shangGuan}',
        '{tg.gui}{tg.ding}':'{ss.pianCai}',
        '{tg.gui}{tg.bing}':'{ss.zhengCai}',
        '{tg.gui}{tg.ji}':'{ss.qiSha}',
        '{tg.gui}{tg.wu}':'{ss.zhengGuan}',
        '{tg.gui}{tg.xin}':'{ss.pianYin}',
        '{tg.gui}{tg.geng}':'{ss.zhengYin}'
      },
      ZHI_HIDE_GAN:{
        '{dz.zi}': ['{tg.gui}'],
        '{dz.chou}': ['{tg.ji}', '{tg.gui}', '{tg.xin}'],
        '{dz.yin}': ['{tg.jia}', '{tg.bing}', '{tg.wu}'],
        '{dz.mao}': ['{tg.yi}'],
        '{dz.chen}': ['{tg.wu}', '{tg.yi}', '{tg.gui}'],
        '{dz.si}': ['{tg.bing}', '{tg.geng}', '{tg.wu}'],
        '{dz.wu}': ['{tg.ding}', '{tg.ji}'],
        '{dz.wei}': ['{tg.ji}', '{tg.ding}', '{tg.yi}'],
        '{dz.shen}': ['{tg.geng}', '{tg.ren}', '{tg.wu}'],
        '{dz.you}': ['{tg.xin}'],
        '{dz.xu}': ['{tg.wu}', '{tg.xin}', '{tg.ding}'],
        '{dz.hai}': ['{tg.ren}', '{tg.jia}']
      },
      YI_JI:[
        '{yj.jiSi}',
        '{yj.qiFu}',
        '{yj.qiuSi}',
        '{yj.kaiGuang}',
        '{yj.suHui}',
        '{yj.qiJiao}',
        '{yj.zhaiJiao}',
        '{yj.muYu}',
        '{yj.chouShen}',
        '{yj.zaoMiao}',
        '{yj.siZhao}',
        '{yj.fenXiang}',
        '{yj.xieTu}',
        '{yj.chuHuo}',
        '{yj.diaoKe}',
        '{yj.jiaQu}',
        '{yj.DingHun}',
        '{yj.naCai}',
        '{yj.wenMing}',
        '{yj.naXu}',
        '{yj.guiNing}',
        '{yj.anChuang}',
        '{yj.heZhang}',
        '{yj.guanJi}',
        '{yj.dingMeng}',
        '{yj.jinRenKou}',
        '{yj.caiYi}',
        '{yj.wanMian}',
        '{yj.kaiRong}',
        '{yj.xiuFen}',
        '{yj.qiZuan}',
        '{yj.poTu}',
        '{yj.anZang}',
        '{yj.liBei}',
        '{yj.chengFu}',
        '{yj.chuFu}',
        '{yj.kaiShengFen}',
        '{yj.heShouMu}',
        '{yj.ruLian}',
        '{yj.yiJiu}',
        '{yj.puDu}',
        '{yj.ruZhai}',
        '{yj.anXiang}',
        '{yj.anMen}',
        '{yj.xiuZao}',
        '{yj.qiJi}',
        '{yj.dongTu}',
        '{yj.shangLiang}',
        '{yj.shuZhu}',
        '{yj.kaiJing}',
        '{yj.zuoBei}',
        '{yj.chaiXie}',
        '{yj.poWu}',
        '{yj.huaiYuan}',
        '{yj.buYuan}',
        '{yj.faMuZuoLiang}',
        '{yj.zuoZhao}',
        '{yj.jieChu}',
        '{yj.kaiZhuYan}',
        '{yj.chuanPing}',
        '{yj.gaiWuHeJi}',
        '{yj.kaiCe}',
        '{yj.zaoCang}',
        '{yj.saiXue}',
        '{yj.pingZhi}',
        '{yj.zaoQiao}',
        '{yj.zuoCe}',
        '{yj.zhuDi}',
        '{yj.kaiChi}',
        '{yj.faMu}',
        '{yj.kaiQu}',
        '{yj.jueJing}',
        '{yj.saoShe}',
        '{yj.fangShui}',
        '{yj.zaoWu}',
        '{yj.heJi}',
        '{yj.zaoChuChou}',
        '{yj.xiuMen}',
        '{yj.dingSang}',
        '{yj.zuoLiang}',
        '{yj.xiuShi}',
        '{yj.jiaMa}',
        '{yj.kaiShi}',
        '{yj.guaBian}',
        '{yj.naChai}',
        '{yj.qiuCai}',
        '{yj.kaiCang}',
        '{yj.maiChe}',
        '{yj.zhiChan}',
        '{yj.guYong}',
        '{yj.chuHuoCai}',
        '{yj.anJiXie}',
        '{yj.zaoCheQi}',
        '{yj.jingLuo}',
        '{yj.yunNiang}',
        '{yj.zuoRan}',
        '{yj.guZhu}',
        '{yj.zaoChuan}',
        '{yj.geMi}',
        '{yj.zaiZhong}',
        '{yj.quYu}',
        '{yj.jieWang}',
        '{yj.muYang}',
        '{yj.anDuiWei}',
        '{yj.xiYi}',
        '{yj.ruXue}',
        '{yj.liFa}',
        '{yj.tanBing}',
        '{yj.jianGui}',
        '{yj.chengChuan}',
        '{yj.duShui}',
        '{yj.zhenJiu}',
        '{yj.chuXing}',
        '{yj.yiXi}',
        '{yj.fenJu}',
        '{yj.TiTou}',
        '{yj.zhengShou}',
        '{yj.naChu}',
        '{yj.buZhuo}',
        '{yj.tianLie}',
        '{yj.jiaoNiuMa}',
        '{yj.huiQinYou}',
        '{yj.fuRen}',
        '{yj.qiuYi}',
        '{yj.zhiBing}',
        '{yj.ciSong}',
        '{yj.qiJiDongTu}',
        '{yj.poWuHuaiYuan}',
        '{yj.gaiWu}',
        '{yj.zaoCangKu}',
        '{yj.liQuanJiaoYi}',
        '{yj.jiaoYi}',
        '{yj.liQuan}',
        '{yj.anJi}',
        '{yj.huiYou}',
        '{yj.qiuYiLiaoBing}',
        '{yj.zhuShi}',
        '{yj.yuShi}',
        '{yj.xingSang}',
        '{yj.duanYi}',
        '{yj.guiXiu}',
        '{s.none}'
      ],
      LU:{
        '{tg.jia}':'{dz.yin}',
        '{tg.yi}':'{dz.mao}',
        '{tg.bing}':'{dz.si}',
        '{tg.ding}':'{dz.wu}',
        '{tg.wu}':'{dz.si}',
        '{tg.ji}':'{dz.wu}',
        '{tg.geng}':'{dz.shen}',
        '{tg.xin}':'{dz.you}',
        '{tg.ren}':'{dz.hai}',
        '{tg.gui}':'{dz.zi}',
        '{dz.yin}':'{tg.jia}',
        '{dz.mao}':'{tg.yi}',
        '{dz.si}':'{tg.bing},{tg.wu}',
        '{dz.wu}':'{tg.ding},{tg.ji}',
        '{dz.shen}':'{tg.geng}',
        '{dz.you}':'{tg.xin}',
        '{dz.hai}':'{tg.ren}',
        '{dz.zi}':'{tg.gui}'
      },
      DAY_YI_JI:'30=192531010D:838454151A4C200C1E23221D212726,030F522E1F00=2430000C18:8319000776262322200C1E1D,06292C2E1F04=32020E1A26:7917155B0001025D,0F522E38201D=162E3A0A22:790F181113332C2E2D302F1554,7001203810=0E1A263202:79026A17657603,522E201F05=0D19250131:7911192C2E302F00030401060F1571292A75,707C20522F=0C18243000:4F2C2E2B383F443D433663,0F01478A20151D=0E1A320226:3840,0001202B892F=14202C3808:3807504089,8829=0E1A263202:383940,6370018A75202B454F6605=32020E1A26:38394089,0001202B22=16223A0A2E:384C,8A2020=2B3707131F:2C2E5B000739337C38802D44484C2425201F1E272621,5229701535=121E2A3606:2C2E2D2B156343364C,0F4729710D708A20036A1904=0D19250131:5040262789,0F7129033B=202C380814:5040000738,0F7D7C584F012063452B35=1A2632020E:50400089,8813=1A2632020E:69687011180F791966762627201E,0352292E8034=182430000C:291503000D332E53261F2075,0F5238584F450B=000C182430:297170192C2E2D2F2B3E363F4C,0F521563200103470B=131F2B3707:297115030102195283840D332C2E,0F1F5863201D8A02=222E3A0A16:261F1E20232289,52290058363F32=16222E3A0A:261F201E232289,8D39=0D19310125:262322271E201D21,52450F4F09=0D19253101:262322271E202189,1F4526=16222E3A0A:262322271F1E20,712906=0F1B273303:17262322274050,80387C6B2C=0915212D39:1707702C2E71291F20,0F52000106111D15=16222E3A0A:170007386A7448363F261F1E,030F79636F2026=030F1B2733:1784832C2E5B26201F,0F010D2913=182430000C:175447440D15838477656A49,2B2E1F8A202228=101C283404:70504C7889,8803=0D19250131:700F181126151E20001A7919,8D2F=0915212D39:705283845B0D2F71,0F202E4106=3606121E2A:70786289,06802E1F23=1824000C30:70076A363F,292017=202C380814:700718111A302F717566,0F2B2E2026=3B0B17232F:70545283842E71291A7933192A5D5A5040,090C384F45208A1D6B38=212D390915:7039170F45513A2C2E7129242526271F201D,00010352153A=15212D3909:703911170E2C2E2D2F4B15712952633D,092B8A2027=010D192531:702D155483840F63262720,53292F017D4F38442B2E1F4717=16222E3A0A:705C4C39171A4F0E7971295B5248,0F2E1F1D37=1A2632020E:2E260F27201F,523815292F1A22=0E1A260232:64262322271F2021,0F2F293822=2F3B0B1723:161A0F1526271F4C,586103473818=2430000C18:161A7889,292E1F0F386131=17232F3B0B:04795B3F651A5D,0F5201062016=14202C3808:04170F79195D1A637566363F76,01522E8A2039=132B37071F:0470170F191A134C8384662426232227201E,8D08=0D19253101:040370181123220F1326271E2021,29153B=0D19310125:040307177938494C,0F26207017=0E2632021A:0403010218111A17332C2E2D2B15713E6575,45382064291D=142C380820:04033918110F0D2C2E7129332D2B72528384547566,8D1C=1830000C24:040318111A17332C15290D200C7A,4745063835=0F2733031B:040318111A16175B795452848315302F6563395D,387029202E=14202C3808:04031975363F6366,0F5401202C5283842E2F1E=0E1A320226:0403080618111A16332E2F152A09537919702C5445490D75072B,8063203820=182430000C:04067033392C7161262322271E1D210C,8D2F=101C283404:3F4889,881C=2733030F1B:3F74397677658988,0F3847201D=293505111D:3F8B657789,0F2029702E7D35=111D293505:3F8B6589,1F200A=020E1A2632:3F656477,0F2B71292005=111D290535:3F6589,8810=0F1B273303:3F88,2B38200F1C=293505111D:0F83843D363F776424,15462F2C520329712A=0F1B273303:0F17795B54838458,52807C3811=121E2A3606:0F172C2E387129363F7566512D4E4461,01034752203A=172F3B0B23:0F171511793F76584C,0347200C1D20=2D39091521:0F175B3975660745514F2B4825201E211D,010352292E2E=0F1B273303:0F170070792C2E261F,040341232228=05111D2935:0F1700707129385C363F3D1F1E232226,80412B202F14=14202C3808:0F17000728705448757A,522E1F15562F05=30000C1824:0F17000102061979454F3A15477677,241F8A2021=2F3B0B1723:0F17000102060370392E52838453331F,452F2C266A79292B203810=0C18243000:0F170001020E032A70692C2E302F802D2B0D7129474C201F2322,5211183809615D34=1A2632020E:0F171170792F5B1566770001032C2B802D,29387C207134=14202C3808:0F0D33000103452E528384297115752620,63386F7014=15212D3909:0F7045332C2E71201F1D21,4701155229530327=101C283404:0F70161715232238838426271F20,7D035219=121E2A3606:0F705B0004037C5D15653F1F26,522B473809=131F2B0737:0F705215261E20,012E1F25=182430000C:0F707B7C00012F75,52201B=2531010D19:0F706A151E201D528384544466,47010C2E292F2C3820=14202C3808:0F707500261E20,382E1F05=3606121E2A:0F161A17452F0D33712C2E2B5443633F,150170208A0327=0E1A263202:0F150370002E0D3979528384532971331F1E20,477D0D=06121E2A36:0F5B8370000102060403161A494447,386A418A201A=17232F3B0B:0F03700D332C2E2971152F52838463,01004547380C26=101C283404:0F03700D33195284835329711563,01260038206B0E=131F2B3707:0F03706A4F0D332C528384532E29711563,4500750F=131F2B3707:0F0370010239332E2C19528384532971156375262720,8D18=17232F3B0B:0F0370390D332C192E2971637547202322,581528=0E1A263202:0F0302791566046F,29710D722A38528384202E4530=0E1A263202:0F030102392E15634447001F1E,293845200D707538=1E2A360612:0F0300017039712952542D2C302F80380D2A363F3349483E616320,1118150C1F2E20=33030F1B27:0F03000102700D29713963451F0C20,528338542F15806128=121E2A3606:0F030001027039452971150D332C2F6327,2052838403=2C38081420:0F030001022A0D3945297115528384637020,476A382E1F4426=010D192531:0F03390D332C1929711563261D2E2322,382000521118750C706B15=131F2B3707:0F033915666A52261E272048,382E2F6329712C0114=0D19253101:0F52838403700D332C29712E1F27201E2322,1545017505=131F2B3707:0F528400012E7129,092026=3707131F2B:0F528471295B795D2B155333565A446375661F201E272621,00016B0C4113=14202C3808:0F280001363F8B4326232220,2E1F47032F7D35=16222E3A0A:0F0211195465756679,2F384570202B6A10=15212D3909:0F0102700D332C2E2F0319528384531529716345261F2322,8D32=101C283404:0F0102037039330D5284832971152E1F0C,0026206B37=16222E3A0A:0F003854,20521D2106=020E1A2632:0F00175058,5D6B80382E16=1B2733030F:0F00701784831952712C2E1526271F,033806201F=2B3707131F:0F00701A17830E544C5C78,7129632E1F38208A452F16=15212D3909:0F00040370396A742E15444948,458A384F2021=16222E3A0A:0F005B261F20,2E2F1D=2531010D19:0F0003450D3329712C2E2F1575,528A63705A20587D7C12=17232F3B0B:0F00030D70332C2E3952838453542971156375,6B2019=1B2733030F:0F000301020D297115332E1F0C,165220262E=121E2A3606:0F00030102700D332E2C192971155383846375261F1E20,8D1F=33030F1B27:0F00030102700D19297115332C2B535448,2E45208A00=2632020E1A:0F00030102705283842E544779,2920454F754C3836=16222E3A0A:0F0052037029710D332C15,7545584F8A201D2121=121E2A3606:0F00074850,8A2036=0D25310119:0F00071A706A717677492923221E202726,80522E1F39=1E2A360612:0F006A385040740717,1F70631E=212D390915:0F006A1938271779,565A4575522F801F1E632B=121E2A3606:0F00010D0302703352838453297115632E,208A454F2B=0E1A263202:0F000170390D332E2971152F63751F1E20,52846A381F=14202C3808:0F000106387129,2E1F24=14202C3808:0F0001062E7129,522010=0814202C38:0F0001062871292E7C528384032C5C2A15767765,11185D8A206B08=131F2B0737:0F0001067C1F20,522900=202C380814:0F0001020D700339332C192A83842971152E1F0C20262322,065256386110=111D293505:0F000102700D332C2E297115383F631F20,0347562B=14202C3808:0F000102700D332C712E15261F201E,80036A61473831=0C18243000:0F000102700D335283845329711563,38048A7D45202A=14202C3808:0F000102702E15471F1E,294F2B452C2F268011=0D19253101:0F0001022E792D3E75663D19,472063703852292B39=222E3A0A16:0F0001022E154826271F1E203874362322,036312=0D19253101:0F000102032971152C2E19,4720637038522B15=111D293505:0F000102030D70332E3919528384532971152B2F201F0C,8D1B=232F3B0B17:0F000102030D7033528384534529711520,63475814=131F2B3707:0F000102030D332C2E195283845329716375261E2322,8D19=15212D3909:0F00010203700D332C2E1929711552838453637526202322,8D09=111D293505:0F00010203700D332E2F192971152B52838453631F20,8D33=1A2632020E:0F00010203700D332E2F1929711552838453261F201E2322,8D03=2E3A0A1622:0F0001020370332C2E2F1575261F,2971476A458352380C=111D293505:0F0001020370332E2F0D19297115637566302B2C3979,8D08=000C182430:0F000102037039297175261F1D21,454F2E1563410F=17232F3B0B:0F0001020370390D3319297115632E2C752620212322,8D07=3606121E2A:0F0001020370390D332C1929712E157563548384534C,20248A38=16222E3A0A:0F0001020370390D1952838453542971631F0C,152036=14202C3808:0F00010203703915632719792322,80262045297158750F=111D293505:0F00010203528384157033,752971206B452F2B262E05=3404101C28:0F00010206030D7129302F79802D7C2B5C4744,11701D2052843833=111D293505:0F00010206181139702E1F686F6A792D2C304E153375664923221D21,52296B0D800D=15212D3909:0F000102070D70332C2E19528384297115637526201E2322,8D05=2C38081420:0F0001021A175D2C19152E302F7183846379,8A20704F7545410A=131F2B3707:0F001A651707,565A58202E1F476320=121E36062A:0F11707B7C5271291E20,2E1F39=111D293505:0F11700001522E71291F20,2B07=131F2B0737:0F11700001397129,2E2002=111D293505:0F11707129,2E1F2002=131F37072B:0F1152702E2F71291F20,000103=131F37072B:0F1152702E2F71291F20,7A3A=111D293505:0F117B7C2C2E71291F20,520300=111D350529:0F110001702E2F71291F20,0621=101C280434:0F11000170717B,522E1F0A=06121E2A36:0F110001708471292E1F20,03388051561C=121E2A3606:0F1100017B7C702E7129,522B22=2D39091521:0F110039702C2E522F1574487B7C2D4E804B,098A204538612B=05111D2935:0F1118795B65170002195D,52382E8A201E=2531010D19:0F111829711500010370390D332E750C201F,4552832F382B8004=2A3606121E:0F1118175C000301027039450D29332C2E2F15631F,8A582020=31010D1925:0F1118032A0D545283841A802D2C2E2B71296366774744201F26232221,010900150C06=2C38081420:0F11180300706A2E1549466319,292F26806B382B20754506=2E3A0A1622:0F1118528384530001035C702971152B332C2E63201F1E23222621,6B75452D4F802E=111D293505:0F1118060300017B7C792E39767566261F20,7129805136=232F3B0B17:0F111800171A454F514E3A3871157765443D23221E262720,80612E1F1C=212D390915:0F11180003706A4F0D332C2E192971155363751F20262322,524746416128=3B0B17232F:0F111800037039450D2971332C632026,1F2E2B38528327=3B0B17232F:0F11180006032A0D70332E011954838471152C202322,58477D630C=0814202C38:0F1118000106287129705B032C2E302F802D4E2B201F,528458384108=380814202C:0F11180001027039302971542F7526201E,63472E151F583A=1E2A360612:0F1118000102030D70332C2E192971158384535426201E2322,471F1B=1F2B370713:0F1118000102030D70332C2E195283845329711563261F0C20,4745752522=3505111D29:0F1118000102030D70332E2C192971153953631F0C262720,5284612528=390915212D:0F111800010203700D332C2E192971152F4B49471F270C2322,52562B2029=390915212D:0F111800010203391929710D1552838453,2075708A456309410F=0A16222E3A:0F111800010206032A0D097170292D302F1575761320,521F47251D=1F2B370713:0F18000102111A1703154F2C2E382D2F807566,7163708A1F207D2A=05111D2935:0F111800017C5C2C2E7129,527015382021=2B3707131F:0F11185C0370332D152322528384636626271E,2F292C2E1F00010601=2430000C18:0F11185C0001092A0D7014692983847B7C2C2E302F802D2B,06454F208A2E=0D19253101:0F11181200171A7919547638,5215201D09=3A0A16222E:0F1A1716007015713F261F2720,5263587D2B470304=111D293505:0F1A0070153871291F20,7A7629=010D192531:0F181179005B712980152D4E2A0D533358,5270208A11=0814202C38:0F181138171A7975665B52845415,47701F8A2013=121E2A3606:0F181117795B5C007054292A0D690403332D2C2E66632B3D,8A454F3822=121E2A3606:0F1811705200012E71291F20,382A=16222E0A3A:0F1811705200012E71291F20,062B27=14202C0838:0F18117052000171291E20,2E1F27=16222E0A3A:0F18117000012E71291F20,527A06=111D290535:0F1811700001062E2F1F20,712912=14202C3808:0F181100062839707952542C2E302F03565A7566441F1E,0D29802B2029=1824300C00:0F181100012C2E7129,522025=121E2A0636:0F18110001261F20,03522E=0915212D39:0F18110001702C2E7129,6F454F098A2025=030F1B2733:0F18110001702C2E71291F0D2B152F2127,5283162014=16222E3A0A:0F18110001707B7C0D7129,52565A152B2034=17232F3B0B:0F1811000104037115454F7677657B7C392023222726210C,52092E1F27=3707131F2B:0F181100010603797B7C802D302F2B6743441F202322,2952477D2528=14202C0838:0F181100017B7C2E71291F20,036F33=0D19253101:0F18110001027939706954528384685D15565A75201E1D26,29032E11=182430000C:0F1811000102062A0D2C2D804B2B672E2F7129,70471F8A2030=17232F3B0B:0F5C707971292C2E0E032A0D6A804B2D8C2B3348634C,52110915462031=15212D3909:0F5C5B0001032A0D7052842C2E71291F20,1118517D462B=0F1B273303:0F5C111800015B712952841F20,756A251A=2733030F1B:1545332C2E2F84836375662620,0F0003700D71292B1C=0E1A320226:1516291211020056,06382007=000C182430:1551000403706A454F3A3D771F262322271E1D21,382B41522016=17232F3B0B:1500443626271F1E,29710F47380D19520337=182430000C:150001021745512E443D65262322,2B63387C18=192531010D:151A83842627202322,580F7003632E1F297C26=0E1A263202:15391A302F83845475662627201E,0F702E4629004708=3606121E2A:5B000102073911522C302F3A678C363F33490D482425200C1E2322,0F15382E1F6116=1E2A360612:5B71297000010611182A0D39792C2E332D4E80151F202621,52454F3804=2C38081420:5B11180001020328700D332C2E195283847115632F751F2720,290F476630=0C18243000:201E27262322,8902=3404101C28:2A0D11180F52848353037039156358332C2E,3820002628=010D192531:4089,030F565A61206B27=1824300C00:4089,8836=1C28340410:0370833F0F6A5215,010D582E1F202C2F2938=112935051D:03700F,79192C2E2D715275262322271F201D2136=112935051D:0370110F45510D3371290941614C522623222720,8D3B=152D390921:03047039171A533852443D363F,8D11=0F1B273303:030402111A16175B4F3A2B153E0079015D54528483696A51,7006200F05=0F1B270333:03041A174533302F56795B3E808339528454,700F292026=121E2A3606:037B7C2E2F261F20,0F14=1E2A360612:030270170F45513A2C71295283842A0D532D24252623222720,155A382E1F2F=1B2733030F:03027011170D332D2C2E2F716152838454,010F201F2C=121E2A3606:03027039450D332C2F2D2971528384636626202322,581535=212D390915:03020E0F18110D332C2E2D2F4971293E615244756653,8A202531=1B2733030F:030102703945802D2C512B7129092322270C7566,112E528325=2D39091521:030102062C2E543E3D636679,380D19462971001F=293505111D:03111A171538193E3F,0F632C2E70454F200C19=17232F3B0B:031A2B7915656A,0F177001204529710D632E2F02=32020E1A26:033945302F838475262720,297071000F2E1F3810=17232F3B0B:0339332C2E1575201E26,0F520D631F29712A72473826=390915212D:0339332C2E302B66201D1F27,0D2971010015520F6B0E=15212D3909:03392D2E332F211D201F1E27,0F7015380029710D195824=16223A0A2E:036F791E20,522E1F31=1D29350511:5283845B79037B7C802D2C2E4E302F2B38493D4463664C1F2021,0F0D712917=15212D3909:5283845303702971150D2F,388A6A6D0F2012=111D293505:528384530370331929272E2B2F631F1D20,0F156B380E=0D19253101:528384530339454F0D297115332E2F637520,0F00705802=2A3606121E:528384530339332E152C2F58631F20,380D000F2900=283404101C:528384530003010215392C20,1112180F29560D2E1F754511=15212D3909:5283845300031929150D332C2E63,0F217045208A717521=3505111D29:5283845300010670802D2C2E4E155B201F1E232221,380F71296A0E=17232F3B0B:5283845354037029711575262720,631F58000F2E38010D=111D293505:528384000103451915332C2E631F2720,29716A0D0F7019=1D29350511:5283840001032E1570637566302F391F,0F4729712030=16222E3A0A:5283845479036A2627201E,0F380D70297115012F1A=1F2B370713:528384542E03700F111869565A7566631F1E2021,297138000C31=121E2A3606:52838454443D65002C2E15495D1F,0F417D712B38630F=0D19253101:5283845444360F11756415,2C2F29016B472E2B20381D=212D390915:528384545363000103332E15,0F1F197029710D757D2032=121E2A3606:528384546315332C2E2F26201F2322,0F0D45002971756B17=192531010D:52838454754C2971150301022E,0F63206A0938268A4117=1B2733030F:52848353000103297115332E2F19,0F8A514F6A6620754526=1824300C00:528403395B2F1E20,0F012D=0B17232F3B:5254700001020612692D4E584647336375662E1F1E,71290D262037=131F2B3707:525400045B17791A565D754C7866,2E1F207C34=0F2733031B:483F89,8838=232F3B0B17:767779392623222789,152B1F1D200E=0A16222E3A:767789,528300292025=14202C3808:7665261F20,0F291A=222E3A0A16:7665262322271F201E21,0F0029807124=1824000C30:7889,292E1F24=101C283404:8D,8832=1D29350511:63767789,522E0006206B31=131F2B3707:7B7C343589,0F7038=2632020E1A:7B7C343589,520F20=0E1A260232:7B34,8812=1C28340410:02703918110F7919155283756626232227201E,012C2E1F0C29=121E2A3606:020F11161A17454F2C2E2D302F2B38434C,2070016328=1824300C00:02060418110D332C2E415B637566262322271F20,520F23=142038082C:07504089,0F010C=15212D3909:07262723221F40,0F7129523B=2430000C18:0717363F1A2C4F3A67433D8B,71290F0103471A=2531010D19:0704031118528384542D2E4E49201F1E1D2127,292B000C3B=283404101C:073F7765644889,012014=111D293505:074048261F202322,0F71454F1500018008=111D293505:07404826271F1E2089,882C=0D19253101:07565A5283845463756677261F20,010F15296120=2F3B0B1723:07487677393F89,0F2952151F1D30=111D293505:074889,06520F3808=17232F3B0B:074889,883B=131F2B3707:074889,8832=15212D3909:07762623221F1E20,000F1552296B2F2A=0D19253101:0776776A742623221F200C211D1E,11180F2F5206802B0B=04101C2834:0776776564,000F29382011=101C283404:0706397B7C794C636A48,520F7129472026=14202C3808:077C343589,880A=380814202C:076A79040363660F5D363F,52292E1F20382F15560123=16223A0A2E:076A696819,0F2918=222E3A0A16:076A171552847983546578,712970010F2D=182430000C:076A48,45752F29384C0F204F612B30=131F2B3707:076A7626271F1E20,0D0F29382F2E0E=0814202C38:07343589,065238=1C28340410:070039201F0C2789,06030F292F23=101C280434:076564,0F292002=0D19253101:073918111A17332C2E71292322271F1E20481D45548384,38002F702A=1824300C00:7C343589,8801=172F3B0B23:6A79363F65,0F292B7118=1B2733030F:6A170F19,5845754C201F4F382430=1B2733030F:6A170F1963766F,5452201F32=0C18243000:6A0339332C20528384531563,29713801000F0C47806B3B=2A3606121E:77766564000789,0F52201E8A01=202C380814:1F2027260076232289,0F29528339=0F1B330327:3435,8809=0F1B273303:34357B7C,8818=121E2A3606:34357B7C7789,0F291D=232F3B0B17:34357B7C89,0F2021=33030F1B27:34357B7C89,030F27=390915212D:34357B7C89,712917=1D29350511:3435073989,8802=2C38081420:34357C89,0111180F292006=30000C1824:34357C89,71291A=14202C3808:34357C89,8A2036=182430000C:3435000789,8835=232F3B0B17:34350089,0F2025=3707131F2B:34353989,0F2037=0D25310119:343589,0F52202D=0F1B273303:343589,0F7152290D=131F2B3707:343589,8830=121E2A3606:343589,881C=16222E3A0A:343589,8819=131F2B3707:343589,880F=15212D3909:343589,8832=14202C3808:343589,8813=0D19253101:343589,8811=17232F3B0B:343589,881E=142C380820:017018110F1A2E15495247838463462322271F,8D03=0F1B270333:0103040818111A155284262322271E20217A79708330,38472E631B=14202C3808:010670170F0E3A294152838454262322271F201E,2E1815442C=0F1B273303:01067071292C2E1F20,1103150F520A=17232F0B3B:010670181126271F202165,293816=182430000C:0106111839513A2C2E2D2F8C804B4723221F63,7152292037=0F2733031B:010203040618110F3315292A271D200C6339171A712C2E30491E21,7A21=0E1A260232:010206040318110F2E292A27200C70072C302F541F392B49,381512=1A2632020E:010206110F452C2E7129095B5226232227201F0C,58804B036B2B381C=142C380820:01023918112E2D493E52756624262322271F20,8D12=121E2A3606:008354,06462F2E1F27=030F1B2733:00797084831754,0F2E472D4E1F06=0D19250131:0079701811072C2E01060F33152627200C7A1A302F4576631F2B,8052382900=172F3B0B23:00790F072C2E0103047018111A262322271E7A302F5448637545,293815561E=101C340428:007952151E20,0F2E1F33=0F1B273303:007984831A160F1719,632E20471D6B01=152D390921:0079110F0304062A528423222627207A19701A2C2E2F5D83,294513=0F1B273303:0079181A165B332F2B262322271E2021030469702D4E49712930845D,454F05=152139092D:0079192E2F030417332D1552847A5D,4E201F=162E3A0A22:003826232277,632E20523A=0D19310125:0038262389,521513=1C28340410:00384089,0F202E157C07=04101C2834:00384089,152967631F=101C283404:00384740,0F2037=1C28340410:00387765504089,0F157C04=131F37072B:00385476,521F13=16222E3A0A:003854767789,2E1F522010=131F2B3707:003854637519,205D1D1F52151E210F=121E2A3606:003889,52201F1D4733=121E2A3606:003889,881F=212D390915:001D23221E2789,52290F2E1F202B=07131F2B37:002C7080305C784C62,2E1F472001=283404101C:004D64547589,0F292E=131F2B3707:005040,522E1F0F2C2004=3404101C28:005089,032C2E1F33=182430000C:005089,8815=192531010D:00261F23221E201D2189,8D12=131F2B3707:00261F2322271E200C89,8D1E=121E2A3606:0026271E20,2F2E1F33=16222E3A0A:002627241F1E20232289,8D33=14202C3808:002627651E20232289,881B=182430000C:00262789,292C2E1F2B2F2A=07131F2B37:00262322271F1E203F8B65,52290F038002=15212D3909:001779332D2322271E2007760304,38290F1C=1F2B370713:00173883546365756619,466115201F701D47522434=0D25310119:00170F79191A6540,712909387C2015=0E1A263202:00170F332C2E2D2F802952443F26232227201F,15637C383A=132B37071F:00170F7665776489,8D2A=390915212D:00177689,0F52804F2507=2E3A0A1622:00177179546A76,0F52443D1F2D=0915212D39:0070,0F292C2E791F13=131F2B3707:007083624C,0F38202E7D4F45471F7107=380814202C:00704F0D332C2E2D15363F261F20274C,0F2906036F4703=3404101C28:00702C2E164C157126271F1E202425363F,29386A032B0F=0F1B273303:00700F1715262720,472E386309=15212D0939:007022230726,2E17712952302F15=15212D3909:00704889,8834=1C28340410:0070784889,0345201F21=2D39091521:007007482089,2E1F58470B=0D19253101:0070071A010618110F5B52846775,6326202E=16222E3A0A:00701A17794C0F302F715475,2E454F8A20243A=0F1B330327:007018111A1617192E15382627201F656477,4F090A=0F1B273303:002E2F18110F5B3315292A26271F20210C7A70710102393E19,035A37=14202C3808:002E4344793F26271F20,03702C2F292B381A31=0E1A263202:00161A5D454F153826201E27,7D0D2904=152139092D:0004037039180F332D152952262322271F0C533A83,4117804735=1F2B370713:0004037B7C0F79494766754667,80293869208A1E=162E3A0A22:00040301067018111A0F332C15292A261E200C7A7919712F5D52838454,5617454F06=3404101C28:000403110F527079156523221E2027,0129802E1F6B1D=1830000C24:0004031A170F11332C2E302F1571292A657677451949,70201D5218=102834041C:0004031811171A5B332C2E155D52,0D29204504=17233B0B2F:00040318110F1519262322271E2021,52831F3825=3B0B17232F:00046A7966444C7765,010C202F38520F70292E31=14202C3808:003F261F202789,8836=131F2B3707:003F657789,7152290F032B3A=2632020E1A:003F651F0C2027232289,0F292B=16222E3A0A:003F89,8836=212D390915:000F76,032E1F522C292B22=2B3707131F:000F7765,2E1F7C4607=0F1B273303:000F01111A1615292A2627200C2C670279538384543E49,634512=0F1B273303:000F1320,6380382936=0F2733031B:000F1323222627,2E3829031535=0D25310119:00676589,0F200F=0C18243000:00401D232289,71290F47202B=101C283404:0040395089,8803=30000C1824:004023222089,0F291118470D=0A16222E3A:004089,0F5211=1A2632020E:004089,0F0147200B=3A0A16222E:00037039454F0D332971152C4C48,090F476341382E0A=111D293505:00037039041A26271F1E202322,0F2F2C335129452E0D3A3B=222E3A0A16:000370396A450D332F4B154C,0F208A7D41381F2E14=0F1B273303:00030401061A16170F332E71292627200C02696A45514F0D2C2D4E497A,2B0B=0F1B273303:000304111A33152D2E302F71292A5284530770022B,0F6345203B=0F1B330327:00030418111617332E2D2F292A52845407020D302B,090F452001=0F1B273303:000304080618110F1A2E2D0D3371292A2C302F7566010239454E802B,632039=2430000C18:00036A7415384878,45751F20240F522E834F2E=182430000C:000301394F2E154763751F27,0F707A802629710D192035=14202C3808:0003391983845475,2E1F0F6A702971722A0D04=0F1B270333:00483F,6338200F2A=3B0B17232F:00481F2023221E27262189,0F292C2E1B=122A36061E:0076645089,8819=202C380814:0076777566262322271F201E,0F111852290D=101C283404:00763989,0F2036=1E2A360612:00788B89,0671292E25=010D192531:00784C793989,0F29702E1F208A21=31010D1925:0006261F1E201D212322,0F2938111801=2A3606121E:00060403702C2E4C154947443D651F,0D2920=101C283404:0006522E261F20,0F712939=2632020E1A:00060724232227261F2025,520F157929382F22=31010D1925:0006547677,0F5229151F201B=0E1A320226:00061A161718110F292A0C26271F21797001022F49,470D=0814202C38:002876396577261F20,5283290F37=212D390915:0028397976771E232227,0F522E47442027=121E2A3606:006389,8822=101C280434:007B7C3989,881E=1830000C24:007B343589,8805=2E3A0A1622:00021719792B155D5466774962,010611180F292030=14202C3808:00020370454F0D3933192C2E2D156375261F202322,0F7123=0E1A260232:0002070818111A16175B153E445D5452848365647576,2038454F15=182430000C:0007385476771548,52061F2024=2D39091521:0007504089,0F29157030=15212D3909:0007504089,060F71702F2918=15212D3909:0007504089,880B=17232F0B3B:000770171989,0F2E20382F=0B17232F3B:00077089,522E1F8A202C=07131F2B37:000704036939487C4466,0F7011293821=1824000C30:000715547776,521F18=0E2632021A:0007030401021811171A0F2E2322271F1E706749528483,202F293800=0F1B330327:00077663,0F297138202C=0B17232F3B:000776776548,0F1118152E1F2017=121E2A3606:00077665776489,52830F208A14=1A2632020E:00077B7C4834353989,2952203B=2632020E1A:00076A386563,0F7D8A2066454F52754C15=1E2A360612:00076A0F3874485040,06707C2509=3606121E2A:00076A74504089,5229702C7D15=14202C3808:00076A74173926271F1E20,0F7029522B09=000C182430:00076A54196348767765,7920297115528A0D382B16=101C283404:000734357B7C3989,0F528329200C=06121E2A36:0007343589,290F7104=2E3A0A1622:0007343589,0F292F702012=182430000C:0007343589,0F71296B708003=15212D3909:0007343589,7129706300=0D19310125:0007010618111A332D302F15262322271E530270164C,560F712924=0E1A263202:000701020618111A1752848354230C7027,262038292C=111D293505:0007711F204840,010F29153814=17232F3B0B:00076527262322,1552835A201D0F382D=0D19253101:0007363F8B3989,09292C208A0F28=030F1B2733:000739483F66,0F208A2B0A=04101C2834:0007397B7C343589,0106522008=020E1A2632:0007396A48343589,0F203A=283404101C:00073934357B7C89,0F5223=3505111D29:000739343589,032010=0A16222E3A:000739343589,520F2F=111D293505:000739343589,8A200A=15212D0939:00077A7089,8817=17232F3B0B:000789,8D3B=172F3B0B23:000789,8815=1B2733030F:007C343589,881B=212D390915:007C343589,8812=15212D3909:006A79190F6F2627,6B46204538290B=380814202C:006A38075040,0F630141202B454F2D=121E2A3606:006A5040077448,702B2C0F2F292E=0B17232F3B:006A583F232227261F20,0F291547031C=232F3B0B17:006A6F391974,0F2E614447702C292F71201F38521F=31010D1925:0034353989,522E1F2B=0D19253101:00343589,060F5200=2A3606121E:00343589,7129565A01=131F2B3707:00343589,883B=111D350529:00343589,8800=152D390921:000150402627,0F292F2B1E=2733030F1B:00010F17505840,565A80385283846315=101C283404:000103020611187B7C2D4E616439201E0C26,522E474429=101C283404:0001030239450D297115332C2E4C,0F542070528438632C=101C283404:000103392E54837548,19700F58157A20381F=1830000C24:00010670175B71292A152322271E,03637C2B380F=0E1A263202:0001067052842E71291F20,030F38477533=131F2B3707:0001067011185B0D332C2E2D712909262322271F200C,0F5263250C=17232F0B3B:000106040318111A170F33292A26276A201D0C7A71077C1F1E74694F,520A=0D19253101:0001060403232226380F767754,568020152D=111D293505:000106025B75712904032D302F382B2A0D801E20,2E1F0F0C=0D19253101:00010607155B5C26271E2021165D83,38470F2920=16222E3A0A:000106073018110F3329271E0C7A0D75,3826201508=0F1B273303:00010618111A16332C2E2F2D27200C07483A450D,1552843825=0E1A263202:000102261E2027,03476F700F2971382E39=15212D3909:0001027007834878,2E388A201D17=131F2B3707:00010203450D3329152C2E2F5375,0F638A6A1D382D=0E1A263202:000102030D70332C2E29712F534426201F1E,0F38152F=121E2A3606:0001020370450D332C2E2D152971,0F52838A201D1B=1D29350511:0001020370528384631575712D2E4E3E581F1E1D,292C2B452620803A=222E3A0A16:0001020370392F2971152B54754C,458A1F0F20462C=14202C3808:0001020370392F80712B546675201E26,1F58472E152F=16222E3A0A:000102037039714515750D33,201D381F092E0F1103=32020E1A26:000102030F7039453319152E2D2F63751F0C1E20,71290D38472C=16222E3A0A:000102035270392E2D5863,0F381D2B2921201511=131F2B3707:0001020352666A,0F7020262938172F3A=2430000C18:00010203332C2E2F1558631F,0F1920707A2971264627=05111D2935:0001020311180F702E1F7952838468332D6749443E46630C1E1D21,292B2035=1C28340410:000102031118396375664819,1D4138702080291F=232F3B0B17:000102033945332C6375201D21,0F1929710D702D=101C283404:00010203390D3329152C2B751E20,2E1F54475352458316=111D293505:0001020339161745514F2C190F1A152E2D2F304979,8D13=17232F3B0B:00010203396A79637566201D211E,29387D71707A30=101C283404:000102033911170D3319152E2F0947442627201F,8D25=3505111D29:000102031811392E2D19528384543E4463751F20,152F1A290F0D=0E1A263202:0001020626232227201E,0F2E03801F0F=101C283404:0001020617385483,030F47202B6B1B=2733030F1B:000102060F17705283797823221E2027,2E712910=121E2A3606:000102062A397129797B7C2E1F2425,162F5D20262B=182430000C:0001020603691817452C2E2D498344,412B6A09633808=3A0A16222E:0001020603700F7B7C2E1F692D48302F565A586366240C21,2B151A292039=17232F3B0B:000102060717706A33392D2E4E674447482322271E210C,71292B4F2023=33030F1B27:0001020607036A5D397C2163664744,0F4E25208A08=04101C2834:000102060775261F20,71290F70150C=101C283404:00010206111803302F565A802D4E2B881F261E0C,0D0F521B=16222E3A0A:00010206090D5B7952838454685D7B7C443D77656366201F1E,030F47454F24=010D192531:000102071283542627201D210C4C78,29580F2E6352031F01=32020E1A26:00010275261E0C2322,6303706F0F292E1F19=0E2632021A:000102081A158483262322270C1E,700F292E1B=101C283404:00011A1615262322271F1E200C214C,472B0F1124=3707131F2B:00013974150726271F1E200C,0F06520D297170382B4507=17233B0B2F:000118111A16175B154C26271E200C232279302F5D528384547543,0F297C7A03=17232F3B0B:000118111A332C2E2D1571292A2627200C7A1979,387C02=172F3B0B23:000118111A332C2E2D1571292A23222627200C7A791970302F5D5283845456,387C454F1F=0E1A263202:0001081811171A160F1571292A26271E20396476452B0D,632E523813=15212D3909:00211D1E232289,8D16=0E2632021A:006526232227201F,8926=05111D2935:00657689,6B0F5225=16223A0A2E:00654C89,8D03=2A3606121E:006589,2970472008=15212D3909:001A170F5B332E2D7129261E203E5D,1503528306=152139092D:001A170F1379232227761926,71293833=1C28340410:001A1715838444363F261F1E200C2322,0F476B52036338=14202C3808:001A2B5448701938754C,152E20242510=0D19253101:0039504089,8D39=283404101C:003926271E20747677642322480C06,2E1F38=0F1B273303:0039262322271E201D210C0748766465776A,150F382939=202C380814:0039332C2E2D2F152B4644261F1E,0F7019382971637A31=192531010D:0039787989,1F2E2010=101C283404:0039787089,2E1F8A034F206B29=05111D2935:00398B7989,0F200C=131F2B3707:0039077426271F1E20,0F29713852832B632D=14202C3808:0039076A7426271F2048,0F79197029717A382C=0E1A263202:00397C343548,8929=3B0B17232F:003934357B7C89,0F2028=16222E0A3A:0039343589,8D34=16222E3A0A:0039343589,880B=111D293505:0039343589,8805=17233B0B2F:0039343589,882E=101C283404:0039343589,8806=17233B0B2F:00390103040618111A17332C2E262322271E157A7071302F45631F2075,807C2B=0915212D39:00396577647969271E2322,52012E1F2620612D=16222E3A0A:00391A6A15384C4943363F7448,0F0379472B6319=192531010D:00394C786F89,0F2E442035=182430000C:003989,882A=121E2A3606:003989,8816=13191F252B313701070D:003989,8801=0D19310125:003989,880D=0F1B273303:0018112C2E01040607332D292A09270C2322696870302F47023945,382052801C=101C340428:00190F153917701A48,472E1F200334=1F2B370713:00195475667689,5229152E2019=222E3A0A16:004C504089,0F5215470A=3A0A16222E:005C702C2F802B154C78,5A562E1F208A45466319=102834041C:0089,090F1538=131F2B3707:71297C790001062A0F802D,5215705D2F=0E1A263202:7100030170391959152E2D2F2B,0F201F4F75668A3824=030F1B2733:5483846376656419786A,298030201A=2430000C18:5452838479195D00012A0D7B7C2C2E3348156366242526201E,0F71292D=07131F2B37:54528384700001020339482D301571565A363F637566,06292B201F8A29=030F1B2733:54528384036F796A153E65,7129631D=2733030F1B:5452848303152F802C2D,2E1F208A7A700F29710C7D22=33030F1B27:118384155B20272E1F21,0F03380E=0E1A263202:1179302F842627201E,0071292E1F0E=06121E2A36:11177B7C52842C2E5B1F20,060071292F0F0E=101C283404:110F70528475660D7129,012E1F20262A=101C283404:110F03706A795215636626271E,0C012F38062C292B07=020E1A2632:110F0001702C2E7129201F,52060C=0E1A263202:110F00017052792E1F1E,71290D2B2020=293505111D:110F1A6A702C2E1952838453712F6375,45201500011D=101C340428:11037B7C2E2F7129,0F52200B=0E1A263202:11000170792C2E7129,0F52201F01=111D350529:110001527B7C2E75,0F2009=04101C2834:1100010206702D804E2B2620,0F52540D00=131F2B3707:110001392E1F20,0F712932=17232F3B0B:117154528384292C2E302D4E092A0D50407970443D,5680410023=2B3707131F:111879690001020370396A2E2D528384543E637566,0F380D58292000=222E3A0A16:111879076A1A171523221E272024,5229700F1D012E2B0C2F0B=06121E2A36:111817000106702C2E71292A0D33802D302F4E2B44,0F52252029=07131F2B37:11180F000704030D7C684580302F153867534775,70204119=2430000C18:11180F00012A0D70795D7B7C39332D2C2E4E4863664C,064F478A2037=1E2A360612:11180F000152548471702C2E2D4E303348492A156144474C63,8A201F38450618=202C380814:11180F000128032A0D7129302C2E2F2D802B09411F1E20,5284543824=2F3B0B1723:11180F0001020370391952845329712B632E7B7C792D2C8020,385D151E=293505111D:11180F0001020339700D29716375662E1F2620,3815568016=16222E3A0A:11180F000102587B7C5283847971302F804B2B497675,09612E1F201E=232F3B0B17:11180F00010E715229702E79692C2D2B15093954444C66,2F565A806132=131F2B3707:11180F71297052838454792A0D33802D153853201F1E212627,012F56476628=3707131F2B:11180F71297000010604032A0D793969302F33802D636675,201F52565A1E18=1D29350511:11180F5C000102030D332C2E195329711563261F202322,52843A=202C380814:11180370392A0D3329712C2F156375795B5D,450C8A00382E1F20010C=3A0A16222E:11185283847975661271393D692D15565A201E262322,292F060D0C02=30000C1824:111852838470795B302F404533802D152B39201E23221D212726,0F2E1F010D2923=2D39091521:111852838453546319297115030D332B2C,060F8A2E38201F38=0D19253101:111800020D041A796933483E5347446563751F1D212026,010F09150C17=2430000C18:1118000717161A2C2E3371292B56433D6375363F,0F010347208A09=020E1A2632:111800012A0D2C705271292E201F,1538617904=30000C1824:11180001032A0D70795B2C2E302F802D4E152B33714161201F26,520958470A=000C182430:11180001020439332C2E302F2B5844477515634C1F2721,0F520D19267A2971702037=232F3B0B17:111800010206037939695483845D2D2E4E446375661F262120,0F52290D7123=31010D1925:111800010206071979697C67474475664C,0F16298A2014=182430000C:11187129705B79000106032A0D397B6F7C802D2C2B61756627261E0C1D21,0F2E15414732=192531010D:111871545283842979397B7C69152B2A0D33485324251F1D1E26,6B00702F800C201E=1F2B370713:5D0007363F232227261E21,037C0F471F202E=0E1A263202:6526232227201F,880E=111D293505:653989,8806=131F2B3707:363F6526232227201E89,8832=1A2632020E:1A454F548384,881D=121E2A3606:1A38712975,0F201A=0E1A263202:1A162623227954,0001710F290C=0F1B273303:1A16170F13152654,3852204F32=0F1B273303:1A5D453A332C2E2F4B25262322271F201E1D21,000F704723=2F3B0B1723:3950177089,522E1F0F201A=1D29350511:39701117302F713819297566,004551152C2E201D1F34=121E2A3606:393589,881A=15212D3909:393589,882C=182430000C:393589,8825=101C283404:393589,881C=2531010D19:394089,71294709636F7C440D=0D19253101:3948007889,8D38=2430000C18:394889,8811=111D293505:394889,882A=0E1A263202:3907,8807=0D19253101:39343589,8831=101C283404:393489,8801=222E3A0A16:390050404C89,0F528329692018=131F2B3707:39006A26201F,0F520D38580629712B09=380814202C:390001022C2E302F1575804B2D261F20,0D0F0319707D5229717A15=17232F3B0B:3989,8D11=0A16222E3A:181179838454637566,0F5229012007=111D293505:18117915384C,52200E=0C18243000:1811795B032C2E302F802D4163754C27261E1D2120,010D0F29521F29=16222E0A3A:1811795B5466,01202F=192531010D:181179000607040D03302F5283844F3A45512B1533664C47,090F702E208A2B=0B17232F3B:18117900012C2E5B1F20,0F710D52291A=122A36061E:181179190E332C2E2D52637566262322271F20,8D02=0F1B273303:181117332C2E1526232227201F1E3E,38030F522922=142038082C:181170792C2F7129,52201F=121E36062A:18117001061579,71292023=121E2A3606:18117000012C2E7129,522024=3505111D29:18110F3900010203700D3329711563752E1F0C201D,38525D1A=101C283404:18110F197983842E230C271F1E7A70525463,2620291503=111D293505:1811002E1F8384,0F2022=1824000C30:181100012C2E2F1F,0F3821=142038082C:181100012C2E2F1F20,0F5229=14202C3808:181100015B3875,2E2034=15212D3909:181100012A0D2C2E2F2B2D304E447129841F,0F09416138200F=0814202C38:181100012A0D52842953411E20,2E1F0F47152F=131F2B3707:18110001032A0D845B7129302F791533536678,0F208A1F1D33=17232F3B0B:18115452840001712970802D2C2E302F2B2A0D78791F,0F204758610E=0F1B273303:18111A16175B3315262322271F1E201D215D838454433E363F754551,00030F290D=0C18243000:18115C0001702A2C2E2F5283847129795B6375802D154C,1F208A2407=15212D3909:88,262052830D=17232F3B0B:88,8D17=102834041C:88,8D0B=15212D0939:88,8D24=121E2A0636:88,8D09=17232F0B3B:88,8D13=111D293505:1979,3F2F2E45207D37=112935051D:1966583F6589,8831=16222E3A0A:4C4089,880C=0C18243000:4C78,297172380D2A2E0F47484112=16222E3A0A:5C0F1811790070528471291F20,2F0380512514=1C28340410:5C0001020652835B0E03804B2D4E2B752024210C,292E565A36=1A2632020E:5C11180001027170520D2984832B15200C,03802E386333=15212D3909:89,6B34=111D293505:89,8D',
      TIME_YI_JI:'0D28=,2C2E2128=,2C2E0110=,2C2E0C1F=,2C2E7A701B1C=,01022308=,01026D003026=,000106037A702D02=,000106037A702802=,000106037A703131=,000106037A70341B=,000106087A701F0E=,000106087A702E15=,000106087A702C2E0E39=,000106087A702C2E0D2B=,881727=,88032D=,88352F=,882B2F=,882125=,882A22=,880C1E=,880220=,88161A=,882018=,883422=,880113=,880B11=,883315=,882915=,881F17=,88150D=,88122E=,88302A=,88262A=,883A28=,880826=,881C2C=,881905=,882303=,880F09=,88050B=,883701=,882D01=,88060C=,882410=,881A12=,882E0E=,88380E=,881010=,883630=,881834=,880E38=,882232=,882C30=,88043A=,881E0A=,880006=,883208=,880A04=,881400=,882808=,883137=,883B35=,882737=,881D39=,88133B=,880933=,88251D=,882F1B=,881B1F=,88111D=,880719=,88391B=,88212D=,7A702C0B15=,7A70551515=,7A70552D00=,7A7D2C2E1334=382C,000106083528=382C,7A70000106080504=382C7A6C55700F197120,00010608223A=380006082C,01026D0D2C=380006082C,01027A70551D30=380006082C0F71295283,01027A703636=380006082C0F71295283,0102416D1226=380006082C7A706C550F297120,0102251C=380006082C7A6C55700F197120,01026D2300=3800010608,2C2E0324=3800010608,7A702C2E082E=3800010608,7A70552C2E3B34=38000106082C,2F8026330C=38000106082C,2F80267A701622=38000106082C7A70556C0F197120,1904=38000106082C7A6C55700F197120,1514=38000106087A70556C0F197120,2C2E3138=38000106087A70556C0F197120,2C2E0B10=38000106087A6C55700F197120,2C2E2B28=387A6C55700F197120,000106082C2E2E16=38082C,000106037A700E3A=38082C,000106037A703708=38082C6C550F197120,000106037A701B20=38082C6C550F197120,000106037A70111C=38082C6C550F197120,000106037A703A2D=2C38,000106082733=2C38,000106081015=2C38020F71295283,000106083817=2C2920,7A700F03=2C2920,616D1839=2C292070556C100F,00010608161B=2C2920020F7100010608,302B=2C2920556C0F1971,7A701E07=2C2920010F,1B1B=2C2920010670100F00,352B=2C292000010206100F70,082B=2C292000010206100F707A,0C21=2C292000010870556C100F7A,0617=2C29206C0F1971,7A70552807=2C29207A70556C0F197100010206,122F=2C29207A706C55100F1971,1017=2C29207A706C55100F1971,2731=2C20,616D0436=2C2070550F,7A7D01022E12=2C200F71295283,01021831=2C20556C0F1971,7A702912=2C20100F52,01026D1D33=2C807138152952,000106080E31=2C80713815295270556C100F,000106083201=2C80713815295270556C100F7A,000106080327=2C80713815295202100F,000106037A702B2B=2C80713815295202100F,000106037A702801=2C80713815295202100F,000106083639=2C80713815295202100F7A7055,00010608341D=2C807138152952556C100F,000106037A701B23=2C807138152952010F6C55,7A70302D=2C8071381529520102100F7A7055,2231=2C8071381529520102100F7A6C55,1F13=2C80713815295200010206100F20,7A70313B=2C8071381529526C550F,000106037A701A15=2C8071381529527A70550F,000106080219=2C8071381529527A70556C0F19,000106082E0D=2C80713815295208556C100F,000106037A70161F=2C80711529525670556C100F,000106083813=2C80711529525670556C100F,000106082D05=2C807115295256020F7A706C55,2237=2C80711529525602100F,000106081F0D=2C80711529525602100F55,000106037A702627=2C8071152952560102100F7A706C,2C33=2C8071152952560102100F7A706C,0939=2C80711529525601100F7A7055,416D021F=2C80711529525600010206100F70,0E37=2C80711529525600010870556C10,2129=2C8071152952566C550F,7A702519=2C8071152952566C550F19,7A702417=2C8071152952566C55100F19,000106037A70043B=2C8071152952566C55100F19,000106037A700C1B=2C8071152952566C55100F19,7A703B31=2C8071152952566C100F19,7A705500010603172D=2C8071152952567A70550F,416D3A2F=2C8071152952567A70556C100F,1901=2C8071152952567A706C55100F19,1119=2C8071152952567A6C55700F19,1C2B=2C80711529525608556C100F,000106037A701403=2C80711529525608556C100F,000106037A70071D=2C80711529525608100F55,000106037A701908=292C20,7A7D01026D2E0F=292C200102100F7A7055,032C=292C20000608,0102071C=292C206C550F1971,000106037A700E33=292C207A70556C000108,0503=2920550F,7A702C2E0721=2920556C100F,7A702C1225=2920000108556C100F,7A702C2E1F11=2900010870556C100F7A,032C201A11=297A70556C100F,032C200E35=297A70556C100F,032C20000A=70556C0F197120,7A7D3A29=70556C100F2C20,000106081C25=70556C100F2C20,000106082805=70556C100F2C20,000106082F20=70556C100F2C20,00010608150C=70556C100F29522002,7A7D000106033314=70556C100F,00010608032C20122A=70556C08,7A7D000106032415=70100F2C715220,000106081A0D=4B0F2C20,000106037A701902=4B0F2C20,000106080E3B=4B0F20,7A702C000106032E17=0F2C09382920,7A7000010603363B=0F2C093829206C55,000106037A70082C=0F29528320,7A2C71707D01026D0718=0F712952832C20,7A7D01021C26=0F712952832C20,7A7D01026D3918=0F712952832C2038000608,01027A70552126=0F712952832C2010,01021330=0F712952832C207A7055,01021118=0F712952832C207A7055,01023524=0F715220,7A70552C2E3419=20556C0F1971,7A702C2E1D31=2000010206100F,7A702C1E05=0270290F2C207A,00010608212C=0270550F,00010608032C200C23=0270550F,00010608032C203706=0270550F20,000106082C2E2520=0270550F20,7A7D000106032E13=0270550F202C807115295256,000106081620=020F29528320,000106087A2C71707D0112=020F2952832055,7A2C71707D000106030F08=020F20,7A7055000106032A23=020F712952832C20,2521=020F712952832C20,000106082F21=020F712952832C20,000106080003=020F712952832C20,7A700432=020F712952832C2038000106086C,7A701E03=020F712952832C2070556C10,000106081623=020F712952832C2001,2236=020F712952832C2001,000B=020F712952832C2001,7A70552C36=020F712952832C20013800,416D341E=020F712952832C20017055,7A7D0E32=020F712952832C200110,7A7D0329=020F712952832C2001107A706C55,262D=020F712952832C20017A7055,1229=020F712952832C2000010608,122D=020F712952832C2000010608,1011=020F712952832C2000010608,0A0B=020F712952832C2000010608,1F0F=020F712952832C2000010870556C,1A0E=020F712952832C206C55,7A703312=020F712952832C2010,000106037A70172A=020F712952832C2010,7A7055000106033B3B=020F712952832C2010,416D000106037A700B12=020F712952832C20106C55,000106037A700615=020F712952832C207A7055,3203=020F712952832C207A7055,201B=020F712952832C207A706C5510,2023=020F712952832C207A6C7055,2A1B=020F7129528320,000106087A702C2629=020F7129528320,7A702C2E3709=020F7129528320,7A702C000106083A24=020F7129528320,7A70552C2E341A=020F712952832038000106087A70,2C2E1C2D=020F712952832001,7A702C2E0611=020F712952832001,7A702C2E021A=020F712952832001,7A7D2C2E3815=020F71295283200100,7A702C2E3024=020F71295283200110,616D2C2E093B=020F71295283206C55,7A702C2E000106030505=020F71295283206C55,7A702C030C1A=020F71295283207A706C55,000106082C2E3705=020F712952837A706C55,032C201F0C=02550F20,000106037A700508=02550F20,000106037A703029=02550F20,000106087A702C2E3027=02550F202C807115295256,000106037A703526=02100F2C29528320,000106037A70150E=02100F2C29528320,00010608380F=02100F2C29528320,000106083527=02100F2C29528320,7A70000106031C27=02100F2C2955528320,000106081227=02100F2C29555283207A706C,00010608060F=02100F2C29555283207A706C,000106081D34=02100F7020,7A7D000106030F02=02100F7055528315,2F8026000106083920=02100F7055528315,2F802600010608212A=02100F7055528315,000106082A20=02100F7055528315,000106083A26=02100F7055528315,000106080439=02100F7055528315,000106080008=02100F7055528315,000106081B21=02100F7055528315,00010608071B=02100F7055528315,000106080D24=02100F7055528315,000106082C2E2C32=02100F7055528315,000106082C2E2B2C=02100F7055528315,00010608032C201402=02100F7055528315,00010608032C20391C=02100F7055528315,7A7D000106031F10=02100F705552831538,2F8026000106082D06=02100F70555283157A,2F802600010608290D=02100F20,7A702C000106032416=02100F20,616D000106037A702C34=02100F20292C,7A70000106031C2A=02100F528315,7A7055000106032234=02100F528315,7A7055000106032A21=02100F55528315,000106037A703313=02100F55528315,000106037A700509=02100F55528315,000106037A702D03=02100F55528315,000106037A700613=02100F55528315,000106037A702235=02100F55528315,000106037A70391D=02100F55528315,000106037A70100F=02100F55528315,000106087A702C111B=02100F55528315,000106087A702C2E2916=02100F55528315,7A2C71707D000106030430=02100F55528315,7A2C71707D000106033B32=02100F55528315,7A2C71707D000106081903=02100F55528315,7A702C2E000106033A27=02100F55528315,7A702C000106030931=02100F55528315,7A702C000106030C1C=02100F55528315,7A70000106032735=02100F555283152C8071,000106037A700B13=02100F555283152C807138,000106037A701517=02100F555283152C807138,000106037A702917=02100F555283156C,000106037A703136=550F522010,7A2C71707D01022A1E=550F715220,7A702C2E1333=550F715220,7A702C2E000106081405=556C,000106087A702C2E0433=556C,7A70000106083B38=556C0F197120,7A702C2E1E01=556C0F19712001,7A702C2E190B=556C000108,7A70230B=556C000108,7A702C2E1A0F=556C0001082C807115295256,7A701830=556C0008,7A2C71707D01023814=556C100F295220,7A2C71707D03082F=556C100F295220,7A702C0C1D=556C100F295220,7A702C2E00010603021D=556C100F295220,7A70000106031121=556C100F2952202C,7A701835=556C100F2952202C80713815,000106037A703B30=556C100F29522002,000106037A70290C=556C100F29522002,7A70000106030930=556C100F2952200238,000106037A702B27=556C100F2952200102,7A702C2E3812=556C08,000106037A701012=556C08,000106037A701621=556C08,7A702C2E000106033209=556C08,7A702C2E000106032021=556C082C807138152952,000106037A700009=556C082C807138152952,000106037A702A1D=807138152952000170100F,032C200A05=807138152952000170100F,032C20273B=8071381529527A706C550F,032C203423=80711529525600010870556C100F,032C201511=80711529525600010870556C100F,032C20183B=80711529525600010870556C100F,032C203311=010F2C80093829206C55,7A702B29=010F2C80093829206C55,7A70616D3A25=010F2C09382920,7A70550825=010F2C093829207A6C5570,201E=010F09382920,7A702C2E352E=010670100F2C71522000,1C28=010670100F7152207A6C55,2C2E2E11=0106100F7152,7A70032C203205=0106100F71526C,7A70032C202A19=0102290F20,7A702C2E2A1F=010270290F2C207A6C55,2413=010270290F2C207A6C55,0437=010270290F2C207A6C55,0935=010270550F,032C201B18=010270550F20,2B24=010270550F20,2F80261906=010270550F20,2C2E2732=010270550F20,2C2E071A=010270550F20,2C2E3700=010270550F20,7A7D1724=010270550F203800,2F80263921=010270550F202C29,416D290F=010270550F202C807138152952,1619=010270550F202C8071381529527A,3207=010270550F202C80711529525600,0829=010270550F2000,060D=010270550F2000,0001=010270550F2000,2736=010270550F207A,1B1E=010270550F207A,2C2E140B=010270550F207A6C,0114=010270550F7A6C,032C202C3B=010270550F7A6C,032C20201F=0102550F20,7A702C1A13=0102550F20,7A702C3637=0102550F20,7A702C280B=0102550F20,7A702C223B=0102550F20,7A702C032D04=0102100F2C29528320,7A701409=0102100F2C29528320,7A70552307=0102100F2C2952832000,0005=0102100F295283,032C207A700A00=0102100F2955528320,7A2C71707D082D=0102100F2955528320,7A702C2E2809=0102100F295552832000,7A702C2E2B2D=0102100F7055528315,021E=0102100F7055528315,0C20=0102100F7055528315,2F80263420=0102100F7055528315,2F80261510=0102100F7055528315,2F80262E10=0102100F7055528315,2F80262806=0102100F7055528315,2F80263134=0102100F7055528315,2F80261D38=0102100F7055528315,2F8026251A=0102100F7055528315,2F80263A2A=0102100F7055528315,2F80267A7D1120=0102100F7055528315,2F80267A7D0824=0102100F7055528315,2C2E1E00=0102100F7055528315,2C2E7A2F1D=0102100F7055528315,032C200A06=0102100F7055528315,7A7D2C2E1C2E=0102100F70555283153800,2F80261832=0102100F70555283153800,2C2E280A=0102100F70555283153800,2C2E320A=0102100F705552831538007A,2738=0102100F705552831538007A6C,2F80260720=0102100F705552831538007A6C,2F8026032B=0102100F70555283152C292000,1907=0102100F70555283152C292000,3703=0102100F70555283152C292000,2739=0102100F70555283152C29207A,251B=0102100F70555283152C29207A,2B25=0102100F70555283152C29207A6C,1331=0102100F70555283152C207A,0D29=0102100F70555283152C80717A,1B1D=0102100F70555283158071,032C200D2D=0102100F705552831500,1725=0102100F705552831500,352D=0102100F705552831500,0C19=0102100F705552831500,150F=0102100F705552831500,3025=0102100F705552831500,0F07=0102100F705552831500,1E09=0102100F705552831500,251F=0102100F705552831500,010C=0102100F705552831500,2F80261A10=0102100F705552831500,2F80261016=0102100F705552831500,2F80260934=0102100F705552831500,2F80262910=0102100F705552831500,2F80267A7D1A14=0102100F705552831500,2C2E2304=0102100F705552831500,7A7D3421=0102100F7055528315002C2920,212F=0102100F7055528315002C807138,111F=0102100F7055528315002C807138,3135=0102100F7055528315008071,032C200828=0102100F7055528315007A6C,2022=0102100F70555283156C,7A7D140A=0102100F70555283156C,7A7D2C2E2127=0102100F70555283157A,1618=0102100F70555283157A,0B0F=0102100F70555283157A,1836=0102100F70555283157A,172E=0102100F70555283157A,2F8026352A=0102100F70555283157A,2F80262B2E=0102100F70555283157A,2F8026082A=0102100F70555283157A,2F80262306=0102100F70555283157A,2F80263702=0102100F70555283157A,2F80262C38=0102100F70555283157A,2F80261E06=0102100F70555283157A,2F80261B1A=0102100F70555283157A,2F8026032A=0102100F70555283157A,2C2E1F14=0102100F70555283157A,2C2E3810=0102100F70555283157A,2C2E262C=0102100F70555283157A29,032C20201A=0102100F70555283157A00,2F80260A02=0102100F70555283157A00,2F80261838=0102100F70555283157A6C,2F80260E34=0102100F70555283157A6C,2F80260438=0102100F70555283157A6C,2C2E2F1A=0102100F70555283157A6C,2C2E2305=0102100F528315,7A70553525=0102100F5283152C8071,7A70550723=0102100F528315807138,7A7055032C200D2A=0102100F55528315,2F80267A2C71707D3316=0102100F55528315,2F80267A2C71707D1224=0102100F55528315,2F80267A2C71707D212E=0102100F55528315,2F80267A700616=0102100F55528315,2F80267A70380C=0102100F55528315,2F80267A700434=0102100F55528315,2F80267A702A18=0102100F55528315,7A2C71707D2628=0102100F55528315,7A2C71707D100C=0102100F55528315,7A2C71707D2F80261729=0102100F55528315,7A701F15=0102100F55528315,7A70240E=0102100F55528315,7A703632=0102100F55528315,7A701339=0102100F55528315,7A700115=0102100F55528315,7A702C2C37=0102100F55528315,7A702C320B=0102100F55528315,7A702C3206=0102100F55528315,7A702C2E2238=0102100F55528315,616D2F80267A2C71707D3816=0102100F555283153800,2F80267A701406=0102100F555283153800,2F80267A700111=0102100F555283152C8071,7A700501=0102100F555283152C8071,7A70370B=0102100F555283152C807138,7A703B37=0102100F555283152C80713800,7A701C2F=0102100F555283152920,7A702C240F=0102100F555283152920,7A702C0A03=0102100F555283152920,7A702C0221=0102100F55528315292000,7A702C2E3317=0102100F55528315292000,7A702C2E3634=0102100F5552831500,2F80267A2C71707D3028=0102100F5552831500,7A2C71707D111A=0102100F5552831500,7A2C71707D071E=0102100F5552831500,7A2C71707D2913=0102100F5552831500,7A702F19=0102100F5552831500,7A702301=0102100F5552831500,7A702C3919=0102100F5552831500,7A702C3B33=0102100F5552831500,7A702C2E0223=0102100F5552831500,7A702C03032F=0102100F55528315006C,7A702C2E262E=0102100F555283156C,2F80267A70032E=0102100F555283156C,7A2C71707D0F0B=0102100F555283156C,7A701D3B=0102100F555283156C,7A702C2E030116=01100F1571292C20,2F80267A703200=01100F1571292C20,7A7055370A=01100F1571292C2000,7A701B22=01100F1571292C2000,7A701E04=01100F1571292C2000,416D1336=01100F1571292C20007A70556C,391A=01100F1571292C20007A6C7055,1C24=01100F1571292C207A7055,2F80260D2E=01100F15712920,7A702C2E2D0A=01100F15712920,7A702C2E2800=01100F15712920027A7055,2C2E251E=01100F157129207A70556C,2C2E1228=01100F157129207A70556C,416D2C2E050A=01100F5220,7A70550000=01100F5220,616D2624=01100F5220,616D2F80267A702804=01100F5220006C,7A70550F06=01100F52207A70556C,2C2E2F1E=01100F52207A70556C,2C2E1014=01100F527A70556C,032C20161E=01100F712920,7A702C2E0A0A=01100F71522C2920,616D161C=0070100F292C20,01020F04=0006100F7020,7A7D01026D183A=0006100F7020,616D0102201C=0006100F20,7A2C71707D01026D1D37=000170100F292C20,2F18=000170100F292C802038,161D=00014B0F,032C201338=00014B0F2C2002,2F80261728=00014B0F20,2C2E0F0A=00014B0F20,7A2C71707D1833=00014B0F20,7A702C1407=00014B0F20,7A702C1401=0001060838,2C2E1123=0001060838,416D032C202019=000106082C38,2C31=000106082C38,391F=000106082C38,2523=000106082C38,7A70416D1C29=000106082C38020F71295283,3811=000106082C38020F71295283,7A700937=000106082C386C550F197120,7A700117=00010252100F29202C7A706C55,1337=00010206700F202C807138152952,3A2E=00010206100F7020,616D0610=00010206100F20,7A2C71707D0328=00010206100F20,7A700F01=00010206100F20,7A702C3310=00010206100F20,7A702C2E3139=0001100F298020,7A702C2625=00010870556C100F2C20,1909=00010870556C100F2C20,391E=00010870556C100F2C20,2124=00010870556C100F2C20,2F80267A7D0F00=00010870556C100F2C2038,2D09=00010870556C100F2C2002,0500=00010870556C100F2C207A,2C39=00010870556C100F2C207A,2518=00010870556C100F2C207A,0B0C=00010870556C100F2C207A,2F80262911=00010870556C100F7A,032C200007=000108556C100F2C2029,7A700A07=000108556C100F2C2029,7A701332=000108556C100F20,2C2E7A70100D=000108556C100F20,7A702C2E2239=000108556C100F20,7A702C2E0A01=000108556C100F20,7A702C2E380D=0001086C100F2C20,7A70551D36=0001086C100F2C20,7A70552F1F=000108100F70552920,010D=000108100F70552920,616D0507=000108100F705529202C80713815,0B0D=000108100F705529202C8071157A,3133=000108100F7055292002,2309=000108100F7055292002,416D0002=000108100F705529207A,2F80263202=000108100F705529207A,2F80263638=000108100F705529207A,2C2E2A1A=000108100F705529207A38,2F80262414=000108100F705529207A6C,2C2E2E14=000108100F552920,7A2C71707D1404=000108100F552920,7A2C71707D0B17=000108100F552920,7A70330D=000108100F552920,7A702C172F=000108100F552920,7A702C2E3707=000108100F5529206C,616D7A702C2E302E=6C55700F197120,2C2E7A7D0C22=6C55700F197120,7A7D01026D1E02=6C550F297120,000106037A703923=6C550F297120,7A702C2E03230A=6C550F1920,7A2C71707D240C=6C550F19200210,7A2C71707D000106031A16=6C550F197120,000106037A701513=6C550F197120,7A703A2B=6C550F197120,7A701837=6C550F197120,7A702F23=6C550F197120,7A702F22=6C550F197120,7A702D07=6C550F197120,7A702C2E3922=6C550F197120,7A700102093A=6C550F197120,7A70000106031B19=6C550F197120,616D7A70071F=6C550F197120,616D7A702C2E212B=6C550F197120,616D7A702C2E000106032734=6C550F197120292C,000106037A700325=6C550F1971200001020610,7A702C122B=6C550F19712008,000106037A702411=6C100F2952,7A7055032C20010E=100F2C29528320,01023704=100F2C29528320,0102363A=100F292C206C55,000106037A702B26=100F2920,7A2C71707D01026D302C=100F7055528315,01021E08=100F7055528315,01022730=100F7055528315,01021512=100F7055528315,010200352C=100F7055528315,7A7D01026D2F1C=100F7055528315,7A7D01026D0222=100F70555283153800,01026D2412=100F70555283157A,01022230=100F70555283157A,0102060E=100F70555283157A6C,01022C3A=100F70555283157A6C,01026D1F12=100F1571292C20,01026D3B36=100F1571292C20,01026D1516=100F1571292C20,000106037A702302=100F1571292C20,000106037A701D32=100F1571292C20,000106082F8026330E=100F1571292C20,000106086D2A1C=100F1571292C20,7A7001026D313A=100F1571292C20,7A7000010603341C=100F1571292C20,416D7A70000106032B2A=100F1571292C2002,000106037A700326=100F1571292C20556C,000106037A70273A=100F1571292C2000,01026D0722=100F1571292C2000,01026D2E0C=100F1571292C206C55,000106037A701408=100F1571292C207A706C55,01022020=100F1571292C207A706C55,000106081726=100F1571292C207A6C7055,0102290E=100F1571292C207A6C7055,000106080932=100F1571292C207A6C7055,000106080D26=100F52,00010608032C20100E=100F5283153800,01027A70550B16=100F5220,2F8026000106081122=100F5220,6D010200133A=100F5220,01026D1F16=100F5220,000106037A703132=100F5220,000106083B3A=100F5220,000106082522=100F5220,00010608190A=100F5220,000106082C2E021C=100F5220,7A70000106030936=100F52202C,01026D3A2C=100F52206C55,01027A701A0C=100F52206C55,000106037A700E30=100F52206C55,000106037A700A08=100F52207A706C55,000106083204=100F52207A6C5570,01026D0B0E=100F55528315,01027A2C71707D0004=100F55528315,7A2C71707D01026D1D3A=100F55528315,7A2C71707D01026D3418=100F5552831500,7A2C71707D0102201D=100F712920,7A702C2E00010608030E36=100F71522C2920,01023635=100F715229,00010608032C20021B=7A70550F2C715220,1900=7A70550F715220,2C2E0A09=7A70556C,00010608172C=7A70556C,00010608032C200B14=7A70556C,00010608032C202914=7A70556C0F197120,2C2E0938=7A70556C0F197120,000106082C2E111E=7A70556C000108,0502=7A70556C000108,2F80260D2F=7A70556C0001082C807138152952,2D0B=7A70556C0001082C807138152952,3633=7A70556C0001082C807115295256,0C18=7A70556C0008,01020218=7A70556C0008,0102302F=7A70556C100F295220,000106082C35=7A70556C100F295220,000106081E0B=7A70556C100F2952202C807115,3130=7A70556C100F29522002,000106080506=7A70556C100F29522001,2C2E330F=7A70556C100F29522001022C8071,010F=7A70556C100F295220010200,0435=7A70556C100F295280713815,032C200614=7A70556C100F295201,032C20122C=7A70556C100F29520102,032C203B39=7A706C550F297120,0F05=7A706C550F297102,032C200D25=7A706C550F19712001,616D2233=7A706C550F19712000010608,2626=7A6C70550F197120,01021A17=7A6C70550F197120,00010608262F=7A6C70550F1971202C29,000106083529=7A6C70550F19712002,616D000106082D08=7A6C70550F197120103800,0102341F=7A6C55700F197120,2C2E172B=082C38,7A7055000106030D27=082C38,7A70000106030827=08556C100F2C20,000106037A702803=08556C100F2C20,000106037A701013=08556C100F2C20,7A7000010603262B=08556C100F2C20,7A7000010603240D=08556C100F2C20,7A70000106033631=08556C100F2C20,7A70000106030431=08556C100F20,7A702C2E000106031D35=08100F552920,000106037A701335=08100F552920,000106037A700612=08100F55292038,000106037A70',
      SHEN_SHA:[
        '{s.none}',
        '{sn.tianEn}',
        '{sn.mingFei}',
        '{sn.muCang}',
        '{sn.buJiang}',
        '{sn.siXiang}',
        '{sn.mingFeiDui}',
        '{sn.wuHe}',
        '{sn.sanHe}',
        '{sn.chuShen}',
        '{sn.yueDe}',
        '{sn.yueKong}',
        '{sn.yueDeHe}',
        '{sn.yueEn}',
        '{sn.shiYin}',
        '{sn.wuFu}',
        '{sn.shengQi}',
        '{sn.jinKui}',
        '{sn.xiangRi}',
        '{sn.yinDe}',
        '{sn.liuHe}',
        '{sn.yiHou}',
        '{sn.qingLong}',
        '{sn.xuShi}',
        '{sn.mingTang}',
        '{sn.wangRi}',
        '{sn.yaoAn}',
        '{sn.guanRi}',
        '{sn.jiQi}',
        '{sn.fuDe}',
        '{sn.liuYi}',
        '{sn.jinTang}',
        '{sn.baoGuang}',
        '{sn.minRi}',
        '{sn.linRi}',
        '{sn.tianMa}',
        '{sn.jingAn}',
        '{sn.puHu}',
        '{sn.yiMa}',
        '{sn.tianHou}',
        '{sn.yangDe}',
        '{sn.tianXi}',
        '{sn.tianYi}',
        '{sn.siMing}',
        '{sn.shengXin}',
        '{sn.yuYu}',
        '{sn.shouRi}',
        '{sn.shiDe}',
        '{sn.jieShen}',
        '{sn.shiYang}',
        '{sn.tianCang}',
        '{sn.tianWu}',
        '{sn.yuTang}',
        '{sn.fuSheng}',
        '{sn.tianDe}',
        '{sn.tianDeHe}',
        '{sn.tianYuan}',
        '{sn.tianShe}',
        '{sn.tianFu}',
        '{sn.yinShen}',
        '{sn.jieChu}',
        '{sn.wuXu}',
        '{sn.wuLi}',
        '{sn.chongRi}',
        '{sn.fuRi}',
        '{sn.xueZhi}',
        '{sn.tianZei}',
        '{sn.tuFu}',
        '{sn.youHuo}',
        '{sn.baiHu}',
        '{sn.xiaoHao}',
        '{sn.zhiSi}',
        '{sn.heKui}',
        '{sn.jieSha}',
        '{sn.yueSha}',
        '{sn.yueJian}',
        '{sn.wangWang}',
        '{sn.daShi}',
        '{sn.daBai}',
        '{sn.xianChi}',
        '{sn.yanDui}',
        '{sn.zhaoYao}',
        '{sn.jiuKan}',
        '{sn.jiuJiao}',
        '{sn.tianGang}',
        '{sn.siShen}',
        '{sn.yueHai}',
        '{sn.siQi}',
        '{sn.yuePo}',
        '{sn.daHao}',
        '{sn.tianLao}',
        '{sn.yuanWu}',
        '{sn.yueYan}',
        '{sn.yueXu}',
        '{sn.guiJi}',
        '{sn.xiaoShi}',
        '{sn.tianXing}',
        '{sn.zhuQue}',
        '{sn.jiuKong}',
        '{sn.tianLi}',
        '{sn.diHuo}',
        '{sn.fourHit}',
        '{sn.daSha}',
        '{sn.gouChen}',
        '{sn.baZhuan}',
        '{sn.zaiSha}',
        '{sn.tianHuo}',
        '{sn.xueJi}',
        '{sn.tuHu}',
        '{sn.yueXing}',
        '{sn.chuShuiLong}',
        '{sn.diNang}',
        '{sn.baFeng}',
        '{sn.siFei}',
        '{sn.siJi}',
        '{sn.siQiong}',
        '{sn.wuMu}',
        '{sn.yinCuo}',
        '{sn.siHao}',
        '{sn.yangCuo}',
        '{sn.guChen}',
        '{sn.xiaoHui}',
        '{sn.daHui}',
        '{sn.baLong}',
        '{sn.qiNiao}',
        '{sn.jiuHu}',
        '{sn.liuShe}',
        '{sn.tianGou}',
        '{sn.xingHen}',
        '{sn.liaoLi}',
        '{sn.suiBo}',
        '{sn.zhuZhen}',
        '{sn.sanSang}',
        '{sn.sanYin}',
        '{sn.yinDaoChongYang}',
        '{sn.yinWei}',
        '{sn.yinYangJiaoPo}',
        '{sn.yinYangJuCuo}',
        '{sn.yinYangJiChong}',
        '{sn.guiKu}',
        '{sn.danYin}',
        '{sn.jueYin}',
        '{sn.chunYang}',
        '{sn.yangCuoYinChong}',
        '{sn.qiFu}',
        '{sn.chengRi}',
        '{sn.guYang}',
        '{sn.jueYang}',
        '{sn.chunYin}',
        '{sn.daTui}',
        '{sn.siLi}',
        '{sn.yangPoYinChong}'
      ],
      DAY_SHEN_SHA: [
        ';000002300F14156869717A3F;01001617495C40413C425D6A;0209000C041831031906054A5E6B4B5F;033500041A1B032C06054C4D4E60;04002D321C1D1E104F50615152;05111F53546C55433C3E;062E200721220D01566E44;070B2333242F45;08360A2526242F080157583D59;091234080162463C3D5A;0A270728292A5B6364653F79;0B0237130E2B4748727A3E66;0C09020C04300F0314150568696D;0D3504031617495C40413C6F425D6A;0E38183119064A5E6B4B5F;0F001A1B032C064C4D4E60;10002D321C1D1E104F50615152;110B00111F53546C55433C3E;12360A002E200721220D015644;13002333456D;142526242F080157583F3D59;15001234080162463C3D5A;16090004270728292A5B636465;17350204130E032B47483E66;1802300F14156869;19031617495C40413C425D6A;1A1831031906054A5E6B4B5F;1B0B1A1B032C06054C4D4E;1C360A2D321C1D1E104F50615152;1D111F53546C55433C3E;1E2E200721220D01563F44;1F23334573;20090C042526242F080157583D;2135041234080162463C3D5A;22270728292A5B636465;2302130E032B47483E66;2402300F0314150568696E;250B031617495C40413C425D6A;26360A18311906054A5E6B4B5F;271A1B2C06054C4D4E60;282D321C1D1E104F506151523F;29111F53546C55433C3E;2A090C042E200721220D015644;2B350423334567;2C2526242F0857583D59;2D001234080162463C3D5A;2E00270728292A5B63646574;2F0B0002130E032B47483E66;30360A0002300F141505686975;31001617495C40413C425D6A676D;3218311906054A5E6B4B3F675F76;331A1B2C06054C4D4E60;34090C042D321C1D1E104F50615152;353504111F53546C55433C6F3E;362E200721220D5644;3723334567;382526242F08015758703D6759;390B123408016246703C3D5A84;3A360A270728292A5B636465;3B02130E2B47483E66;',
        ';00090002272A536C4C4D4E41717A;0100300F3103233C6151523F66;020004180E032406150543405D;03000C041A1D340617054A5E6B4F50;04002D1B555F;050B112526321C2B3C42654B3E60;060A2E2014100547546246;0712070D161F566A;0822192F0148453D44;092C083301575868695B633C3D;0A0937131E495C6459;0B020721282903727A3F3E5A;0C020427032A05536C4C4D4E416D;0D0C04300F03233C6F61515266;0E38180E24061543405D;0F0B001A1D3406174A5E6B4F5078;100A002D1B555F;1100112526321C2B3C42654B3E60;12002E2014100147546246;130012070D161F566A6D;140922192F080148453D44;152C083301575868695B633C3F3D44;160413031E495C6459;17020C0407212829033E5A;1802272A536C4C4D4E41;190B300F3103233C61515266;1A0A180E032406150543405D;1B1A1D340617014A5E6B4F50;1C2D1B555F;1D112526321C2B3C42654B3E60;1E092E2014100147546246;1F12070D161F56736E6A3F;200422192F080148453D44;210C042C083301575868695B633C3D;22131E495C6459;230B0207212829033E5A;240A0227032A05536C4C4D4E41;25300F31233C61515266;26180E2406150543405D;271A1D340617054A5E6B4F50;28092D1B555F;29112526321C2B3C42654B3F3E60;2A042E2014100147546246;2B0C0412070D161F566A67;2C22192F0848453D44;2D0B002C083301575868695B633C3D85;2E0A0013031E495C6459;2F0002072128293E5A;300002272A05536C4C4D4E4175;3100300F31233C6151526E676D66;3209180E2406150543405D;331A1D340617054A5E6B4F503F76;34042D1B555F;350C04112526321C2B3C6F42654B3E60;362E20141047546246;370B12070D161F566A67;380A22192F08014845703D6744;392C083301575868695B63703C3D74;3A131E495C6459;3B02072128293E5A;',
        ';00000207282931032B717A6E5D59;01000314473C5A;020A000427182526300F1D16062A054F506A;03360B00041A1906055562464066;04002D2C154A5E6B6C733F788B;0512111B0E1E17483C3E;060C2E20321C016869655F;0753544960;08350907210D230810015B63564B3D77;091324081F014C4D4E453C423D;0A2203342F57586461515244;0B02032C4341727A3E;0C0A020407282931032B055D6D59;0D360B040314473C6F5A;0E3827182526300F1D16062A4F506A3F;0F001A19065562464066;10000C2D2C154A5E6B6C86;110012111B0E1E17483C3E;123509002E20321C0168696E655F;13005354495C6D60;1407210D230810015B63564B3D7F;1537130324081F014C4D4E453C423D;160A042203342F57586461515244;17360B0204033343413E;1802072829312B5D3F59;190314473C5A;1A0C27182526300F1D16062A054F506A;1B1A1906055562464066;1C35092D2C154A5E6B6C;1D12111B0E1E17483C3E;1E2E20321C016869655F;1F5354495C60;200A0407210D230810015B63564B3D80;21360B04130324081F014C4D4E453C423D;2222342F5758646151523F44;2302033343413E;24020C072829312B055D59;2514473C5A;26120927182526300F1D16062A054F506A;271A1906055562464066;282D2C154A5E6B6C76;2912111B0E1E17483C3E;2A0A042E20321C016869655F;2B360B045354495C6760;2C07210D2308105B63564B3F3D77;2D00130324081F014C4D4E453C423D;2E000C22342F57586461515244;2F00023343413E;3035090002072829312B05755D59;310014473C676D5A;3227182526300F1D16062A054F506A67;331A1906055562464066;340A042D2C154A5E6B6C;35360B0412111B0E1E17483C6F3E;362E20321C6869653F5F;375354495C6760;380C07210D230810015B6356704B3D677774;391324081F014C4D4E45703C423D;3A350922342F57586461515244;3B023343413E;',
        ';000A00220362463C44;010B00072128291D334F50645D;02360002230605534855423F59;03000212300F24060568695A;0400042E27342A495C403C8C;050C04184A5E6B3E66788D76;06091A1B2B15014C4D4E;07352D321C14175B636151526577;0811130E16080147546C433C6A3D5F;0920070D190801563D60;0A0A032C2F104541;0B0B252631031E1F57584B3E;0C362203056246717B3C3F6D44;0D072128291D334F50645D;0E020423065348554259;0F00020C0412300F240668696E5A;1009002E12342A495C403C;113500184A5E6B3E66;12001A1B2B15014C4D4E;13002D321C14175B63615152656D77;140A11130E0316080147546C433C6F6A3D5F;150B20070D03190801563D60;1636032C2F104541733F;17252631031E1F5758727B4B3E;1804220362463C44;190C04072128291D334F50645D;1A09022306055348554259;1B3502120D0F24060568695A;1C2E27342A495C403C;1D184A5E6B3E66;1E0A381A1B2B15014C4D4E;1F0B2D321C14175B63615152657F;20363711130E0316080147546C433C6A3F3D5F;2120070D03190801563D60;2204032C2F104541;230C042526311E1F57584B3E;2409220562463C44;2535072128291D334F50645D;26022306055348554259;270212300F24060568695A;280A2E27342A495C403C6F;290B184A5E6B3E66;2A361A1B2B15014C4D4E3F81;2B2D321C14175B6361515265678074;2C0411130E03160847546C433C6A3D5F;2D000C0420070D190801566E3D60;2E09002C2F104541;2F35002526311E1F57584B3E;300022056246703C44;3100072128291D334F50645D676D;320A02230605534855426759;330B02120D0F2406056869755A;34362E27342A495C403C3F;35184A5E6B3E6676;36041A1B2B154C4D4E81;370C042D321C14175B6361515265677774;380911130E16080147546C433C6A3D675F;393520070D190801563D60;3A2C2F104541;3B2526311E1F5758704B3E87;',
        ';00001D2F10575868694F503C;0100122B1F495C5564;0209000207222829140605655D44;03000216063305474C4D4E51526A4B3F;04000C042E300F193C6159;0504182C43403E5A;06271A1E2A014A5E6B6C5B6342;070B2D1B1366;080A112526321C0815013C3D;0920032308170153546246413D;0A07210D310324565F;0B0E033448453E60;0C091D2F1005575868694F50717B3C6D;0D122B1F495C553F;0E020C04072228291406655D44;0F000204160633474C4D4E51526A4B;10002E300F193C6159;110B00182C43403E5A;120A00271A1E2A014A5E6B6C5B6342;13002D1B13036D66;14112526321C030815013C6F3D;1520032308170153546246413D;160907210D31032456735F;170E344845727B3F3E60;180C041D2F10575868694F503C;1904122B1F495C5564;1A0207222829140605655D44;1B0B0216063305474C4D4E51526A4B;1C0A2E300F193C6159;1D182C43403E5A;1E38271A1E2A014A5E6B6C5B6342;1F2D1B130366;2009112526321C030815013C3D;21202308170153546246413F3D;220C0407210D3103565F;23040E3448453E60;241D2F1005575868694F503C;250B122B1F495C5564;260A0207222829140605655D44;270216063305474C4D4E51526A4B;282E300F193C6F616E59;29182C43403E5A;2A09271A1E2A014A5E6B6C5B63427988;2B372D1B133F6766;2C0C04112526321C0308153C3D;2D0004202308170153546246413D;2E0007210D3124565F;2F0B000E3448453E60;300A001D2F1005575868694F50703C89;3100122B1F495C5564676D;320207222829140605655D6744;330216063305474C4D4E7551526A4B;34092E300F193C6159;35182C43403F3E5A;360904271A1E2A4A5E6B6C5B634278;37042D1B136766;38112526321C0815013C3D67;390B202308170153546246413D;3A0A07210D3124566E5F;3B0E03344845703E60;',
        ';003509001E2F554C4D4E453C51525D5F;010057586C646160;0200020E06100543;0300020721282923061F0565;0400042E2224533C7344;05360B04182526300F34335B633F3E74;060A1A13016246404B59;070C2D2B4A5E6B5A;0827111B0314082A0148413C3D;0920321C310316080148413C3D;0A35090319154754495C42;0B12070D1D2C174F50563E;0C1E2F05554C4D4E45717B3C51525D6D5F;0D57586C646160;0E02040E061043;0F360B0002040721282923061F653F;100A002E2224533C44;11000C182526300F34335B633E;12001A1303016246404B59;13002D032B4A5E6B6D5A;14350927111B0314082A0148413C6F3D;1520321C310316080168696A3D66;1619154754495C426E;1712070D1D2C174F5056727B3E;18041E2F554C4D4E453C51525D5F;19360B0457586C64613F60;1A0A020E06100543;1B020C0721282923061F0565;1C2E2224533C44;1D182526300F34335B633E;1E3509381A1303016246404B59;1F2D032B4A5E6B5A;2027111B14082A0148413C3D;2120321C3116080168696A3D66;22040319154754495C42;23360B0412070D1D2C174F50563F3E;240A1E2F05554C4D4E453C51525D5F;250C57586C646160;26020E06100543;27020721282923061F0565;2835092E2224533C6F44;29182526300F34335B633E;2A1A13016246404B5982;2B2D2B4A5E6B675A76;2C0427111B0314082A48413C3D;2D360B000420321C3116080168696A3F3D66;2E0A0019154754495C42;2F000C12070D1D2C174F50563E;30001E2F05554C4D4E45703C51525D5F;310057586C6461676D608E;323509020E0610054367;33020721282923061F057565;342E2224533C6E44;35182526300F34335B633E7974;3637041A13036246404B5982;37360B042D2B4A5E6B3F675A76;380A27111B14082A0148413C3D67;390C20321C3116080168696A3D66;3A0319154754495C42;3B12070D1D2C174F5056703E;',
        ';0000302007210D341556;01000217455D;020A0025262B2F060557586C5F;030B001406056246603C8F;0436000207282916105B6364656A;0537130E191F47483E;0622300F2C0168693F44;07021E33495C40413C;08090C04184A5E423D59;093504121A1B0308014C4D4E51524B3D5A;0A02272D321C1D232A4F507E61;0B1124535455433E66;0C0A2E2007210D341505566D;0D0B0217455D;0E3625262B2F0657586C;0F00140662463C4260;10000207282916105B6364656A3F79;1100130E191F47483E;1209350C0422300F032C01686944;1335000204031E33495C40413C6D;1418310308014A5E6B3D59;15121A1B0308014C4D4E51524B3D5A;160A02272D321C1D232A4F507E61;170B1124535455433C6F6E3E66;18362E2007210D341556;190217455D;1A25262B060557586C3F5F;1B14060562463C4260;1C09020C0407282916105B6364656A;1D3504130E03191F47483E;1E22300F032C01686944;1F02031E495C40413C;200A183108014A5E6B3D59;210B121A1B08014C4D4E51524B3D5A;223602272D321C1D232A4F507E61;231124535455433C3E66;242E2007210D34150556717C3F;25021745735D;26090C0425262B2F060557586C5F;27350414060562463C4260;280207282916105B6364656A74;29130E03191F47483E;2A0A22300F2C01686944;2B0B021E33495C40413C6F67;2C36381831034A5E6B3D59;2D00121A1B08014C4D4E51524B3D5A;2E0002272D321C1D232A4F507E613F;2F00112453545543727C3C3E66;3009000C042E2007210D34150556;313500020417455D676D;3225262B2F060557586C70675F;331406056246703C426084;340A0207282916105B6364656A;350B130E191F47486E3E;363622300F032C7544;37021E33495C40413C67;38183108014A5E6B3F3D675976;39121A1B08014C4D4E51524B3D5A;3A09020C04272D321C1D232A4F507E61;3B35041124535455433C3E66;',
        ';000A002E27202C2A475462464B;010B0002070D1E5666;02002F06150548456E5D;0300061705575868695B633C;040002130323495C645F;0507212829249060;0609341001534C4D4E415152;070212300F31031F3C61423F;080418220E032B080143403D44;090C041A1D14080833014A5E6B6C4F503D;0A0A022D1B16556A59;0B0B112526321C193C653E5A;0C2E27202C2A05475462464B6D;0D02070D1E5666;0E2F061548455D;0F000617575868695B633C85;10090002371323495C645F;11000721282903243F3E60;12000403341001534C4D4E415152;1300020C0412300F31031F3C61426D;140A18220E032B080143403D44;150B1A1D140833014A5E6B6C4F503D;16022D1B16556A59;17112526321C193C6F653E5A;182E27202C2A475462464B;1902070D1E5666;1A092F06150548455D;1B061705575868695B633C3F79;1C0204130323495C645F;1D0C040721282903243E60;1E0A03341001534C4D4E415152;1F0B0227300F311F3C6142;2018220E2B080143406E3D44;211A1D140833014A5E6B6C4F503D;22022D1B16556A59;23112526321C193C653E5A;24092E27202C2A0547546246717C4B;2502070D1E56733F66;26042F06150548455D;270C04061705575868695B633C;280A02130323495C645F;290B07212829243E60;2A341001534C4D4E415152;2B0212300F311F3C6F614267;2C3818220E032B0843403D44;2D001A1D140833014A5E6B5B4F503D78;2E0900022D1B16556A59;2F00112526321C19727C3C653F3E5A;3000042E27202C2A05475462464B;3100020C04070D1E56676D66;320A2F0615054845705D67;330B061705575868695B63703C74;34021323495C645F;3507212829243E60;36033410534C4D4E41755152;370212300F311F3C614267;380918220E2B080143403D6744;391A1D140833014A5E6B6C4F503F3D76;3A02042D1B16556A59;3B0C04112526321C193C653E5A;',
        ';00002E20391C246869655D59;010002345354495C5A;023509002707210D062A055B6356515277;0300132B06054C4D4E453C66;04000203142F1557586473614B3F;0512161743416A3E;060C072829310319015F;07360B02032C476C3C6E60;080A04182526300F1D1E0810014F503D;09041A081F01556246403D;0A022D224A5E6B4486;0B111B0E2333483C423E;0C35092E20321C24056869655D6D59;0D02345354495C5A;0E2707210D062A5B635651523F77;0F00132B064C4D4E453C66;1000020C03142F15575864614B;11360B001203161743416A3E;120A0004072829310319015F;13000204032C476C3C6D60;14182526300F1D1E0810014F503D;151A081F01556246403D;163509022D224A5E6B44;17111B0E2333483C6F423E;182E20321C246869655D3F59;1902345354495C5A;1A0C2707210D062A055B635651527F;1B360B3713032B06054C4D4E453C66;1C0A020403142F15575864614B;1D041203161743416A3E;1E0728293119015F;1F022C476C3C60;203509182526300F1D1E08104F503D;211A081F01556246403D;22022D224A5E6B3F447891;23111B0E2333483C423E;240C2E20321C24056869717C655D59;25360B021C5354495C6E5A;260A042707210D062A055B6356515280;270413032B06054C4D4E453C66;2802142F15575864614B;2912161743416A3E;2A35090728293119015F;2B022C476C3C6F6760;2C38182526300F1D1E08104F503F3D;2D001A081F01556246403D;2E0002092D224A5E6B4476;2F360B00111B0E233348727C3C423E;300A00042E20321C24056869655D59;31000204345354495C676D5A;322707210D062A055B6356705152677774;33132B06054C4D4E45703C66;34350902142F15575864614B;3512161743416A3E;36072829310319753F5F;37022C476C3C6760;380C182526300F1D1E0810014F503D67;39360B1A081F01556246403D;3A0A02042D224A5E6B44;3B04111B0E2333483C423E;',
        ';00090038041A221B194C4D4E44;0135000C042D321C2C335B6361655D77;02002E11130E1E06054754433C59;03001220070D0605565A;0400272F2A454142;050B252631032357583E66;06360A0324150162463C;07072128291D34174F50644B;080208015348553F3D5F;0902300F2B080168693D60;0A09041410495C403C6F;0B35090418161F4A5E6B6C5152403E;0C1A221B19054C4D4E6D44;0D2D321C2C335B6361655D77;0E2E11130E1E064754433C6E59;0F0B351220070D0306565A;10360A0027032F2A454142;1100252631032357583E66;12000324150162463C3F;1300072128291D34174F50644B6D;1409020408015348553D5F;1535020C04300F2B080168693D60;161410495C403C;1718161F4A5E6B6C51526A3E;181A221B194C4D4E4481;190B0A2E11130E031E06054754433C59;1A360A2E11130E031E06054754433C59;1B1220070D030605565A;1C27032F2A454173423F;1D252631032357583E66;1E090424150162463C;1F350C04072128291D34174F50644B;200208015348553D5F;2102300F2B080168693D60;221410495C403C92;230B18161F4A5E6B6C51526A3E7893;24360A1A221B19054C4D4E44;252D321C2C335B6361655D7F;26372E11130E031E06054754433C3F59;271220070D030605565A;280904272F2A454142;29350C042526312357583E66;2A2415016246703C;2B072128291D34174F50644B67;2C02085348556E3D5F;2D090002300F2B080168693D60;2E360A001410495C403C;2F0018161F4A5E6B6C51526A3E;30001A221B19054C4D4E717D3F4481;31002D321C2C335B6361655D676D8074;3209042E11130E1E06054754433C6F6759;33350C042720070D0605565A;34272F2A454142;35252631235758703E6687;36241562463C;370B072128291D34174F50644B67;38360A023A015348553D675F;3902300F2B08016869753D60;3A1410495C403C3F;3B18161F4A5E6B6C727D51526A3E76;',
        ';0000380C041A23104A5E6B5B63;010004122D1B13241F838A;020A002E11252622321C3406053C5D44;030B00200306330553544641;040007210D312B5659;050E031448453E5A;060E1D162F2A01575868694F503C6A;0719495C556466;0809020728292C081501515242653D;09021E081701474C4D4E3F3D;0A0C04300F3C6F614B5F;0B041843403E60;0C0A1A2310054A5E6B5B636D;0D0B122D1B1303241F838A94;0E2E11252622321C34063C5D44;0F002003063353546C624641;100007210D31032B5659;11000E031448453E5A;120900271D162F2A01575868694F503C6A;130019495C55643F6D66;14020C040728292C081501515242653D;1502041E081701474C4D4E3D;160A300F3C614B5F;170B1843403E60;181A23104A456B5B6378;19122D1B1303241F9583;1A2E11252622321C033406053C5D44;1B200306330553546C6246416E;1C0907210D31032B567359;1D0E1448453F3E5A;1E0C04271D163B2A01575868694F503C6A;1F0419495C556466;200A020728292C081501515242653D;210B021E081701474C4D4E3D;22300F3C614B5F;231843403E60;241A2310054A5E425B63;25122D1B1303241F;26092E11252622321C033406053C5D44;272006330553546C6246413F;280C0407210D312B5659;29040E1448453E5A;2A0A271D162F2A01575868694F50703C6A89;2B0B19495C55646766;2C020728292C0815515242653D;2D00021E081701474C4D4E3D;2E00300F3C614B5F;2F001843403E60;3009001A2310054A5E6B5B63717D7988;310037122D1B13241F3F676D;320C042E11252622321C3406053C6F5D6744;33042006330553546C624641;340A07210D312B5659;350B0E03144845703E5A;36271D162F2A575868694F503C6A;3719495C55646766;38020728292C081501515242653D67;39021E081701474C4D4E756E3D;3A09300F3C614B5F;3B184340727D3F3E60;',
        ';000A003837041A1316624640425D6A5F;01360B00042D194A5E6B4B60;020009111B032C06100548413C;030020321C310310061F056869;0400224754495C7344;05070D1D334F505651523F3E;063509232F01554C4D4E453C59;070C24575864615A;0802270E34082A01433D;09020721282908016E653D66;0A0A042B15536C3C6F;0B360B0412182526300F14175B633E;0C1A13031605624640425D6A6D5F;0D2D03194A5E6B4B60;0E2E111B33061048413C;0F0020321C31031E061F68693F;1035090022034754495C44;11000C070D1D334F505651523E;1200232F01554C4D4E453C59;130024575864616D5A;140A0204270E0F082A01433D;15360B0204072128290801653D66;162B15536C3C;17121825260D0F14175B633E;181A1316624640425D6A5F82;192D03194A5E6B4B3F60;1A35092E111B032C061048413C;1B0C20321C31031E061F056869;1C224754495C44;1D07121D334F505651523E;1E0A04232F01554C4D4E453C59;1F360B0424575864615A;2002270E34082A01433D;2102072128290801653D66;222B15536C3C;2312182526300F14175B633F3E;2435091A13031605624640425D6A5F;250C2D03194A5E6B4B60;262E111B2C06100548413C;2720321C311E061F056869;280A04224746495C44;29360B04070D1D334F505651523E;2A232F01554C4D4E45703C59;2B2457586461675A96;2C02270E34082A433D;2D0002072128290801653F3D66;2E3509002B15536C3C;2F000C12182526300F14175B633E;30001A1316624640717D425D6A5F82;31002D194A5E6B4B676D6076;320A042E111B2C06100548413C6F67;33360B0420321C311E061F0568696E;3422034754495C44;35070D1D334F50567051523E;36232F554C4D4E453C59;3724575864613F675A;38350902270E34082A01433D67;39020C07212829080175653D66;3A2B15536C3C;3B12182526300F14175B63727D3E7974;'
      ],
      getTimeZhiIndex:function(hm){
        if(!hm){
          return 0;
        }
        if(hm.length>5){
          hm = hm.substring(0,5);
        }
        var x = 1;
        for(var i=1;i<22;i+=2){
          if(hm>=((i<10?'0':'')+i+':00')&&hm<=((i+1<10?'0':'')+(i+1)+':59')){
            return x;
          }
          x++;
        }
        return 0;
      },
      convertTime:function(hm){
        return this.ZHI[this.getTimeZhiIndex(hm)+1];
      },
      getJiaZiIndex:function(ganZhi){
        return this.index(ganZhi, this.JIA_ZI, 0);
      },
      hex:function(n){
        var hex = n.toString(16);
        if(hex.length<2){
          hex = '0'+hex;
        }
        return hex.toUpperCase();
      },
      getDayYi:function(monthGanZhi,dayGanZhi){
        var l = [];
        var day = this.hex(this.getJiaZiIndex(dayGanZhi));
        var month = this.hex(this.getJiaZiIndex(monthGanZhi));
        var right = this.DAY_YI_JI;
        var index = right.indexOf(day+'=');
        while(index>-1) {
          right = right.substring(index+3);
          var left = right;
          if (left.indexOf('=')>-1) {
            left = left.substring(0, left.indexOf('=') - 2);
          }
          var matched = false;
          var months = left.substring(0, left.indexOf(':'));
          var i;
          var j;
          for (i = 0, j = months.length; i < j; i += 2) {
            if (months.substring(i, i+2)===month) {
              matched = true;
              break;
            }
          }
          if(matched) {
            var ys = left.substring(left.indexOf(':') + 1);
            ys = ys.substring(0, ys.indexOf(','));
            for (i = 0, j = ys.length; i < j; i += 2) {
              l.push(this.YI_JI[parseInt(ys.substring(i, i+2),16)]);
            }
            break;
          }
          index = right.indexOf(day+'=');
        }
        if(l.length<1){
          l.push(this.SHEN_SHA[0]);
        }
        return l;
      },
      getDayJi:function(monthGanZhi,dayGanZhi){
        var l = [];
        var day = this.hex(this.getJiaZiIndex(dayGanZhi));
        var month = this.hex(this.getJiaZiIndex(monthGanZhi));
        var right = this.DAY_YI_JI;
        var index = right.indexOf(day+'=');
        while(index>-1) {
          right = right.substring(index+3);
          var left = right;
          if (left.indexOf('=')>-1) {
            left = left.substring(0, left.indexOf('=') - 2);
          }
          var matched = false;
          var months = left.substring(0, left.indexOf(':'));
          var i;
          var j;
          for (i = 0, j = months.length; i < j; i += 2) {
            if (months.substring(i, i+2)===month) {
              matched = true;
              break;
            }
          }
          if(matched) {
            var js = left.substring(left.indexOf(',')+1);
            for (i = 0, j = js.length; i < j; i += 2) {
              l.push(this.YI_JI[parseInt(js.substring(i, i+2),16)]);
            }
            break;
          }
          index = right.indexOf(day+'=');
        }
        if(l.length<1){
          l.push(this.SHEN_SHA[0]);
        }
        return l;
      },
      getDayJiShen:function(monthZhiIndex, dayGanZhi){
        var l = [];
        var m = monthZhiIndex - 2;
        if (m < 0) {
          m += 12;
        }
        var index = this.getJiaZiIndex(dayGanZhi).toString(16).toUpperCase();
        if (index.length < 2) {
          index = '0' + index;
        }
        var matcher = new RegExp(';' + index + '(.[^;]*)', 'g').exec(this.DAY_SHEN_SHA[m]);
        if (matcher) {
          var data = matcher[1];
          for (var i = 0, j = data.length; i < j; i += 2) {
            var n = parseInt(data.substring(i, i + 2), 16);
            if (n < 60) {
              l.push(this.SHEN_SHA[n + 1]);
            }
          }
        }
        if(l.length < 1) {
          l.push(this.SHEN_SHA[0]);
        }
        return l;
      },
      getDayXiongSha:function(monthZhiIndex, dayGanZhi){
        var l = [];
        var m = monthZhiIndex - 2;
        if (m < 0) {
          m += 12;
        }
        var index = this.getJiaZiIndex(dayGanZhi).toString(16).toUpperCase();
        if (index.length < 2) {
          index = '0' + index;
        }
        var matcher = new RegExp(';' + index + '(.[^;]*)', 'g').exec(this.DAY_SHEN_SHA[m]);
        if (matcher) {
          var data = matcher[1];
          for (var i = 0, j = data.length; i < j; i += 2) {
            var n = parseInt(data.substring(i, i + 2), 16);
            if (n >= 60) {
              l.push(this.SHEN_SHA[n + 1]);
            }
          }
        }
        if(l.length < 1) {
          l.push(this.SHEN_SHA[0]);
        }
        return l;
      },
      getTimeYi:function(dayGanZhi,timeGanZhi){
        var l = [];
        var day = this.hex(this.getJiaZiIndex(dayGanZhi));
        var time = this.hex(this.getJiaZiIndex(timeGanZhi));
        var index = this.TIME_YI_JI.indexOf(day+time+'=');
        if(index>-1) {
          var left = this.TIME_YI_JI.substring(index + 5);
          if (left.indexOf('=')>-1) {
            left = left.substring(0, left.indexOf('=') - 4);
          }
          var ys = left.substring(0, left.indexOf(','));
          for (var i = 0, j = ys.length; i < j; i += 2) {
            l.push(this.YI_JI[parseInt(ys.substring(i, i+2), 16)]);
          }
        }
        if(l.length<1){
          l.push(this.SHEN_SHA[0]);
        }
        return l;
      },
      getTimeJi:function(dayGanZhi,timeGanZhi){
        var l = [];
        var day = this.hex(this.getJiaZiIndex(dayGanZhi));
        var time = this.hex(this.getJiaZiIndex(timeGanZhi));
        var index = this.TIME_YI_JI.indexOf(day+time+'=');
        if(index>-1) {
          var left = this.TIME_YI_JI.substring(index + 5);
          if (left.indexOf('=')>-1) {
            left = left.substring(0, left.indexOf('=') - 4);
          }
          var js = left.substring(left.indexOf(',')+1);
          for (var i = 0, j = js.length; i < j; i += 2) {
            l.push(this.YI_JI[parseInt(js.substring(i, i+2), 16)]);
          }
        }
        if(l.length<1){
          l.push(this.SHEN_SHA[0]);
        }
        return l;
      },
      getXunIndex:function(ganZhi){
        var diff = this.find(ganZhi, this.GAN).index - this.find(ganZhi, this.ZHI).index;
        if (diff < 0) {
          diff += 12;
        }
        return Math.floor(diff/2);
      },
      getXun:function(ganZhi){
        return this.XUN[this.getXunIndex(ganZhi)];
      },
      getXunKong:function(ganZhi){
        return this.XUN_KONG[this.getXunIndex(ganZhi)];
      },
      index:function(name, names, offset) {
        for (var i = 0, j = names.length; i < j; i++) {
          if (names[i] === name) {
            return i + offset;
          }
        }
        return -1;
      },
      find:function(s, arr){
        for (var i = 0, j = arr.length; i < j; i++) {
          var v = arr[i];
          if (v.length < 1) {
            continue;
          }
          if (s.indexOf(v) > -1) {
            return {
              index: i,
              value: v
            }
          }
        }
        return null;
      }
    };
  })();
  var HolidayUtil = (function(_NAMES){
    var _SIZE = 18;
    var _ZERO='0'.charCodeAt(0);
    var _TAG_REMOVE = '~';
    var _NAMES_IN_USE=_NAMES,_DATA='200112290020020101200112300020020101200201010120020101200201020120020101200201030120020101200202091020020212200202101020020212200202121120020212200202131120020212200202141120020212200202151120020212200202161120020212200202171120020212200202181120020212200204273020020501200204283020020501200205013120020501200205023120020501200205033120020501200205043120020501200205053120020501200205063120020501200205073120020501200209286020021001200209296020021001200210016120021001200210026120021001200210036120021001200210046120021001200210056120021001200210066120021001200210076120021001200301010120030101200302011120030201200302021120030201200302031120030201200302041120030201200302051120030201200302061120030201200302071120030201200302081020030201200302091020030201200304263020030501200304273020030501200305013120030501200305023120030501200305033120030501200305043120030501200305053120030501200305063120030501200305073120030501200309276020031001200309286020031001200310016120031001200310026120031001200310036120031001200310046120031001200310056120031001200310066120031001200310076120031001200401010120040101200401171020040122200401181020040122200401221120040122200401231120040122200401241120040122200401251120040122200401261120040122200401271120040122200401281120040122200405013120040501200405023120040501200405033120040501200405043120040501200405053120040501200405063120040501200405073120040501200405083020040501200405093020040501200410016120041001200410026120041001200410036120041001200410046120041001200410056120041001200410066120041001200410076120041001200410096020041001200410106020041001200501010120050101200501020120050101200501030120050101200502051020050209200502061020050209200502091120050209200502101120050209200502111120050209200502121120050209200502131120050209200502141120050209200502151120050209200504303020050501200505013120050501200505023120050501200505033120050501200505043120050501200505053120050501200505063120050501200505073120050501200505083020050501200510016120051001200510026120051001200510036120051001200510046120051001200510056120051001200510066120051001200510076120051001200510086020051001200510096020051001200512310020060101200601010120060101200601020120060101200601030120060101200601281020060129200601291120060129200601301120060129200601311120060129200602011120060129200602021120060129200602031120060129200602041120060129200602051020060129200604293020060501200604303020060501200605013120060501200605023120060501200605033120060501200605043120060501200605053120060501200605063120060501200605073120060501200609306020061001200610016120061001200610026120061001200610036120061001200610046120061001200610056120061001200610066120061001200610076120061001200610086020061001200612300020070101200612310020070101200701010120070101200701020120070101200701030120070101200702171020070218200702181120070218200702191120070218200702201120070218200702211120070218200702221120070218200702231120070218200702241120070218200702251020070218200704283020070501200704293020070501200705013120070501200705023120070501200705033120070501200705043120070501200705053120070501200705063120070501200705073120070501200709296020071001200709306020071001200710016120071001200710026120071001200710036120071001200710046120071001200710056120071001200710066120071001200710076120071001200712290020080101200712300120080101200712310120080101200801010120080101200802021020080206200802031020080206200802061120080206200802071120080206200802081120080206200802091120080206200802101120080206200802111120080206200802121120080206200804042120080404200804052120080404200804062120080404200805013120080501200805023120080501200805033120080501200805043020080501200806074120080608200806084120080608200806094120080608200809135120080914200809145120080914200809155120080914200809276020081001200809286020081001200809296120081001200809306120081001200810016120081001200810026120081001200810036120081001200810046120081001200810056120081001200901010120090101200901020120090101200901030120090101200901040020090101200901241020090125200901251120090125200901261120090125200901271120090125200901281120090125200901291120090125200901301120090125200901311120090125200902011020090125200904042120090404200904052120090404200904062120090404200905013120090501200905023120090501200905033120090501200905284120090528200905294120090528200905304120090528200905314020090528200909276020091001200910016120091001200910026120091001200910036120091001200910046120091001200910055120091003200910065120091003200910075120091003200910085120091003200910105020091003201001010120100101201001020120100101201001030120100101201002131120100213201002141120100213201002151120100213201002161120100213201002171120100213201002181120100213201002191120100213201002201020100213201002211020100213201004032120100405201004042120100405201004052120100405201005013120100501201005023120100501201005033120100501201006124020100616201006134020100616201006144120100616201006154120100616201006164120100616201009195020100922201009225120100922201009235120100922201009245120100922201009255020100922201009266020101001201010016120101001201010026120101001201010036120101001201010046120101001201010056120101001201010066120101001201010076120101001201010096020101001201101010120110101201101020120110101201101030120110101201101301020110203201102021120110203201102031120110203201102041120110203201102051120110203201102061120110203201102071120110203201102081120110203201102121020110203201104022020110405201104032120110405201104042120110405201104052120110405201104303120110501201105013120110501201105023120110501201106044120110606201106054120110606201106064120110606201109105120110912201109115120110912201109125120110912201110016120111001201110026120111001201110036120111001201110046120111001201110056120111001201110066120111001201110076120111001201110086020111001201110096020111001201112310020120101201201010120120101201201020120120101201201030120120101201201211020120123201201221120120123201201231120120123201201241120120123201201251120120123201201261120120123201201271120120123201201281120120123201201291020120123201203312020120404201204012020120404201204022120120404201204032120120404201204042120120404201204283020120501201204293120120501201204303120120501201205013120120501201205023020120501201206224120120623201206234120120623201206244120120623201209295020120930201209305120120930201210016120121001201210026120121001201210036120121001201210046120121001201210056120121001201210066120121001201210076120121001201210086020121001201301010120130101201301020120130101201301030120130101201301050020130101201301060020130101201302091120130210201302101120130210201302111120130210201302121120130210201302131120130210201302141120130210201302151120130210201302161020130210201302171020130210201304042120130404201304052120130404201304062120130404201304273020130501201304283020130501201304293120130501201304303120130501201305013120130501201306084020130612201306094020130612201306104120130612201306114120130612201306124120130612201309195120130919201309205120130919201309215120130919201309225020130919201309296020131001201310016120131001201310026120131001201310036120131001201310046120131001201310056120131001201310066120131001201310076120131001201401010120140101201401261020140131201401311120140131201402011120140131201402021120140131201402031120140131201402041120140131201402051120140131201402061120140131201402081020140131201404052120140405201404062120140405201404072120140405201405013120140501201405023120140501201405033120140501201405043020140501201405314120140602201406014120140602201406024120140602201409065120140908201409075120140908201409085120140908201409286020141001201410016120141001201410026120141001201410036120141001201410046120141004201410056120141001201410066120141001201410076120141001201410116020141001201501010120150101201501020120150101201501030120150101201501040020150101201502151020150219201502181120150219201502191120150219201502201120150219201502211120150219201502221120150219201502231120150219201502241120150219201502281020150219201504042120150405201504052120150405201504062120150405201505013120150501201505023120150501201505033120150501201506204120150620201506214120150620201506224120150620201509038120150903201509048120150903201509058120150903201509068020150903201509265120150927201509275120150927201510016120151001201510026120151001201510036120151001201510046120151004201510056120151001201510066120151001201510076120151001201510106020151001201601010120160101201601020120160101201601030120160101201602061020160208201602071120160208201602081120160208201602091120160208201602101120160208201602111120160208201602121120160208201602131120160208201602141020160208201604022120160404201604032120160404201604042120160404201604303120160501201605013120160501201605023120160501201606094120160609201606104120160609201606114120160609201606124020160609201609155120160915201609165120160915201609175120160915201609185020160915201610016120161001201610026120161001201610036120161001201610046120161001201610056120161001201610066120161001201610076120161001201610086020161001201610096020161001201612310120170101201701010120170101201701020120170101201701221020170128201701271120170128201701281120170128201701291120170128201701301120170128201701311120170128201702011120170128201702021120170128201702041020170128201704012020170404201704022120170404201704032120170404201704042120170404201704293120170501201704303120170501201705013120170501201705274020170530201705284120170530201705294120170530201705304120170530201709306020171001201710016120171001201710026120171001201710036120171001201710045120171004201710056120171001201710066120171001201710076120171001201710086120171001201712300120180101201712310120180101201801010120180101201802111020180216201802151120180216201802161120180216201802171120180216201802181120180216201802191120180216201802201120180216201802211120180216201802241020180216201804052120180405201804062120180405201804072120180405201804082020180405201804283020180501201804293120180501201804303120180501201805013120180501201806164120180618201806174120180618201806184120180618201809225120180924201809235120180924201809245120180924201809296020181001201809306020181001201810016120181001201810026120181001201810036120181001201810046120181001201810056120181001201810066120181001201810076120181001201812290020190101201812300120190101201812310120190101201901010120190101201902021020190205201902031020190205201902041120190205201902051120190205201902061120190205201902071120190205201902081120190205201902091120190205201902101120190205201904052120190405201904062120190405201904072120190405201904283020190501201905013120190501201905023120190501201905033120190501201905043120190501201905053020190501201906074120190607201906084120190607201906094120190607201909135120190913201909145120190913201909155120190913201909296020191001201910016120191001201910026120191001201910036120191001201910046120191001201910056120191001201910066120191001201910076120191001201910126020191001202001010120200101202001191020200125202001241120200125202001251120200125202001261120200125202001271120200125202001281120200125202001291120200125202001301120200125202001311120200125202002011120200125202002021120200125202004042120200404202004052120200404202004062120200404202004263020200501202005013120200501202005023120200501202005033120200501202005043120200501202005053120200501202005093020200501202006254120200625202006264120200625202006274120200625202006284020200625202009277020201001202010017120201001202010026120201001202010036120201001202010046120201001202010056120201001202010066120201001202010076120201001202010086120201001202010106020201001202101010120210101202101020120210101202101030120210101202102071020210212202102111120210212202102121120210212202102131120210212202102141120210212202102151120210212202102161120210212202102171120210212202102201020210212202104032120210404202104042120210404202104052120210404202104253020210501202105013120210501202105023120210501202105033120210501202105043120210501202105053120210501202105083020210501202106124120210614202106134120210614202106144120210614202109185020210921202109195120210921202109205120210921202109215120210921202109266020211001202110016120211001202110026120211001202110036120211001202110046120211001202110056120211001202110066120211001202110076120211001202110096020211001202201010120220101202201020120220101202201030120220101202201291020220201202201301020220201202201311120220201202202011120220201202202021120220201202202031120220201202202041120220201202202051120220201202202061120220201202204022020220405202204032120220405202204042120220405202204052120220405202204243020220501202204303120220501202205013120220501202205023120220501202205033120220501202205043120220501202205073020220501202206034120220603202206044120220603202206054120220603202209105120220910202209115120220910202209125120220910202210016120221001202210026120221001202210036120221001202210046120221001202210056120221001202210066120221001202210076120221001202210086020221001202210096020221001202212310120230101202301010120230101202301020120230101202301211120230122202301221120230122202301231120230122202301241120230122202301251120230122202301261120230122202301271120230122202301281020230122202301291020230122202304052120230405202304233020230501202304293120230501202304303120230501202305013120230501202305023120230501202305033120230501202305063020230501202306224120230622202306234120230622202306244120230622202306254020230622202309295120230929202309306120231001202310016120231001202310026120231001202310036120231001202310046120231001202310056120231001202310066120231001202310076020231001202310086020231001202312300120240101202312310120240101202401010120240101202402041020240210202402101120240210202402111120240210202402121120240210202402131120240210202402141120240210202402151120240210202402161120240210202402171120240210202402181020240210202404042120240404202404052120240404202404062120240404202404072020240404202404283020240501202405013120240501202405023120240501202405033120240501202405043120240501202405053120240501202405113020240501202406084120240610202406094120240610202406104120240610202409145020240917202409155120240917202409165120240917202409175120240917202409296020241001202410016120241001202410026120241001202410036120241001202410046120241001202410056120241001202410066120241001202410076120241001202410126020241001202501010120250101202501261020250129202501281120250129202501291120250129202501301120250129202501311120250129202502011120250129202502021120250129202502031120250129202502041120250129202502081020250129202504042120250404202504052120250404202504062120250404202504273020250501202505013120250501202505023120250501202505033120250501202505043120250501202505053120250501202505314120250531202506014120250531202506024120250531202509287020251001202510017120251001202510027120251001202510037120251001202510047120251001202510057120251001202510067120251001202510077120251001202510087120251001202510117020251001202601010120260101202601020120260101202601030120260101202601040020260101202602141020260217202602151120260217202602161120260217202602171120260217202602181120260217202602191120260217202602201120260217202602211120260217202602221120260217202602231120260217202602281020260217202604042120260405202604052120260405202604062120260405202605013120260501202605023120260501202605033120260501202605043120260501202605053120260501202605093020260501202606194120260619202606204120260619202606214120260619202609206020261001202609255120260925202609265120260925202609275120260925202610016120261001202610026120261001202610036120261001202610046120261001202610056120261001202610066120261001202610076120261001202610106020261001';
    var _DATA_IN_USE = _DATA;
    var _padding = function(n){
      return (n<10?'0':'')+n;
    };
    var _ymd = function(s){
      return s.indexOf('-')<0?(s.substring(0,4)+'-'+s.substring(4,6)+'-'+s.substring(6)):s;
    };
    var _buildHoliday = function(day,name,work,target){
      return {
        _p:{
          day:_ymd(day),
          name:name,
          work:work,
          target:_ymd(target)
        },
        getDay:function(){
          return this._p.day;
        },
        setDay:function(v){
          this._p.day = _ymd(v);
        },
        getName:function(){
          return this._p.name;
        },
        setName:function(v){
          this._p.name = v;
        },
        isWork:function(){
          return this._p.work;
        },
        setWork:function(v){
          this._p.work = v;
        },
        getTarget:function(){
          return this._p.target;
        },
        setTarget:function(v){
          this._p.target = _ymd(v);
        },
        toString:function(){
          return this._p.day+' '+this._p.name+(this._p.work?'调休':'')+' '+this._p.target;
        }
      };
    };
    var _buildHolidayForward = function(s){
      var day = s.substring(0,8);
      var name = _NAMES_IN_USE[s.charCodeAt(8)-_ZERO];
      var work = s.charCodeAt(9)===_ZERO;
      var target = s.substring(10, 18);
      return _buildHoliday(day,name,work,target);
    };
    var _buildHolidayBackward = function(s){
      var size = s.length;
      var day = s.substring(size-18,size-10);
      var name = _NAMES_IN_USE[s.charCodeAt(size-10)-_ZERO];
      var work = s.charCodeAt(size-9)===_ZERO;
      var target = s.substring(size-8);
      return _buildHoliday(day,name,work,target);
    };
    var _findForward = function(key){
      var start = _DATA_IN_USE.indexOf(key);
      if(start<0) {
        return null;
      }
      var right = _DATA_IN_USE.substring(start);
      var n = right.length%_SIZE;
      if(n>0){
        right = right.substring(n);
      }
      while((0!==right.indexOf(key))&&right.length>=_SIZE){
        right = right.substring(_SIZE);
      }
      return right;
    };
    var _findBackward = function(key){
      var start = _DATA_IN_USE.lastIndexOf(key);
      if(start<0) {
        return null;
      }
      var keySize = key.length;
      var left = _DATA_IN_USE.substring(0,start+keySize);
      var size = left.length;
      var n = size%_SIZE;
      if(n>0){
        left = left.substring(0,size-n);
      }
      size = left.length;
      while((size-keySize!==left.lastIndexOf(key))&&size>=_SIZE){
        left = left.substring(0,size-_SIZE);
        size = left.length;
      }
      return left;
    };
    var _findHolidaysForward = function(key){
      var l = [];
      var s = _findForward(key);
      if(null==s) {
        return l;
      }
      while(0===s.indexOf(key)){
        l.push(_buildHolidayForward(s));
        s = s.substring(_SIZE);
      }
      return l;
    };
    var _findHolidaysBackward = function(key){
      var l = [];
      var s = _findBackward(key);
      if(null==s) {
        return l;
      }
      var size = s.length;
      var keySize = key.length;
      while(size-keySize===s.lastIndexOf(key)){
        l.push(_buildHolidayBackward(s));
        s = s.substring(0,size-_SIZE);
        size = s.length;
      }
      l.reverse();
      return l;
    };
    var _getHoliday = function(args){
      var l = [];
      switch(args.length){
        case 1:
          l = _findHolidaysForward(args[0].replace(/-/g,''));
          break;
        case 3:
          l = _findHolidaysForward(args[0]+_padding(args[1])+_padding(args[2]));
          break;
      }
      return l.length<1?null:l[0];
    };
    var _getHolidays = function(args){
      var l = [];
      switch(args.length){
        case 1:
          l = _findHolidaysForward((args[0]+'').replace(/-/g,''));
          break;
        case 2:
          l = _findHolidaysForward(args[0]+_padding(args[1]));
          break;
      }
      return l;
    };
    var _getHolidaysByTarget = function(args){
      var l = [];
      switch(args.length){
        case 1:
          l = _findHolidaysBackward((args[0]+'').replace(/-/g,''));
          break;
        case 3:
          l = _findHolidaysBackward(args[0]+_padding(args[1])+_padding(args[2]));
          break;
      }
      return l;
    };
    var _fixNames = function(names){
      if(names){
        _NAMES_IN_USE = names;
      }
    };
    var _fixData = function(data){
      if(!data){
        return;
      }
      var append = [];
      while(data.length>=_SIZE){
        var segment = data.substring(0,_SIZE);
        var day = segment.substring(0,8);
        var remove = _TAG_REMOVE === segment.substring(8, 9);
        var holiday = _getHoliday([day]);
        if(!holiday){
          if (!remove) {
            append.push(segment);
          }
        }else{
          var nameIndex = -1;
          for(var i=0,j=_NAMES_IN_USE.length;i<j;i++){
            if(_NAMES_IN_USE[i]===holiday.getName()){
              nameIndex = i;
              break;
            }
          }
          if(nameIndex>-1){
            var old = day + String.fromCharCode(nameIndex + _ZERO) + (holiday.isWork() ? '0' : '1') + holiday.getTarget().replace(/-/g, '');
            _DATA_IN_USE = _DATA_IN_USE.replace(new RegExp(old, 'g'), remove ? '' : segment);
          }
        }
        data = data.substring(_SIZE);
      }
      if(append.length>0){
        _DATA_IN_USE += append.join('');
      }
    };
    var _fix = function(args){
      switch(args.length){
        case 1:
          _fixData(args[0]);
          break;
        case 2:
          _fixNames(args[0]);
          _fixData(args[1]);
          break;
      }
    };
    return {
      NAMES:_NAMES,
      getHoliday:function(){return _getHoliday(arguments);},
      getHolidays:function(){return _getHolidays(arguments);},
      getHolidaysByTarget:function(){return _getHolidaysByTarget(arguments);},
      fix:function(){_fix(arguments);}
    };
  })(['元旦节','春节','清明节','劳动节','端午节','中秋节','国庆节','国庆中秋','抗战胜利日']);
  var NineStar = (function(){
    var _fromIndex=function(index){
      return {
        _p:{index:index},
        getNumber:function(){return NineStarUtil.NUMBER[this._p.index];},
        getColor:function(){return NineStarUtil.COLOR[this._p.index];},
        getWuXing:function(){return NineStarUtil.WU_XING[this._p.index];},
        getPosition:function(){return NineStarUtil.POSITION[this._p.index];},
        getPositionDesc:function(){return LunarUtil.POSITION_DESC[this.getPosition()];},
        getNameInXuanKong:function(){return NineStar.NAME_XUAN_KONG[this._p.index];},
        getNameInBeiDou:function(){return NineStar.NAME_BEI_DOU[this._p.index];},
        getNameInQiMen:function(){return NineStar.NAME_QI_MEN[this._p.index];},
        getNameInTaiYi:function(){return NineStar.NAME_TAI_YI[this._p.index];},
        getLuckInQiMen:function(){return NineStar.LUCK_QI_MEN[this._p.index];},
        getLuckInXuanKong:function(){return NineStarUtil.LUCK_XUAN_KONG[this._p.index];},
        getYinYangInQiMen:function(){return NineStarUtil.YIN_YANG_QI_MEN[this._p.index];},
        getTypeInTaiYi:function(){return NineStar.TYPE_TAI_YI[this._p.index];},
        getBaMenInQiMen:function(){return NineStar.BA_MEN_QI_MEN[this._p.index];},
        getSongInTaiYi:function(){return NineStar.SONG_TAI_YI[this._p.index];},
        getIndex:function(){return this._p.index;},
        toString:function(){return this.getNumber()+this.getColor()+this.getWuXing()+this.getNameInBeiDou();},
        toFullString:function(){
          var s = this.getNumber();
          s += this.getColor();
          s += this.getWuXing();
          s += ' ';
          s += this.getPosition();
          s += '(';
          s += this.getPositionDesc();
          s += ') ';
          s += this.getNameInBeiDou();
          s += ' 玄空[';
          s += this.getNameInXuanKong();
          s += ' ';
          s += this.getLuckInXuanKong();
          s += '] 奇门[';
          s += this.getNameInQiMen();
          s += ' ';
          s += this.getLuckInQiMen();
          if(this.getBaMenInQiMen().length>0) {
            s += ' ';
            s += this.getBaMenInQiMen();
            s += '门';
          }
          s += ' ';
          s += this.getYinYangInQiMen();
          s += '] 太乙[';
          s += this.getNameInTaiYi();
          s += ' ';
          s += this.getTypeInTaiYi();
          s += ']';
          return s;
        }
      };
    };
    return {
      NAME_BEI_DOU:['天枢','天璇','天玑','天权','玉衡','开阳','摇光','洞明','隐元'],
      NAME_XUAN_KONG:['贪狼','巨门','禄存','文曲','廉贞','武曲','破军','左辅','右弼'],
      NAME_QI_MEN:['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'],
      BA_MEN_QI_MEN:['休','死','伤','杜','','开','惊','生','景'],
      NAME_TAI_YI:['太乙','摄提','轩辕','招摇','天符','青龙','咸池','太阴','天乙'],
      TYPE_TAI_YI:['吉神','凶神','安神','安神','凶神','吉神','凶神','吉神','吉神'],
      SONG_TAI_YI:['门中太乙明，星官号贪狼，赌彩财喜旺，婚姻大吉昌，出入无阻挡，参谒见贤良，此行三五里，黑衣别阴阳。','门前见摄提，百事必忧疑，相生犹自可，相克祸必临，死门并相会，老妇哭悲啼，求谋并吉事，尽皆不相宜，只可藏隐遁，若动伤身疾。','出入会轩辕，凡事必缠牵，相生全不美，相克更忧煎，远行多不利，博彩尽输钱，九天玄女法，句句不虚言。','招摇号木星，当之事莫行，相克行人阻，阴人口舌迎，梦寐多惊惧，屋响斧自鸣，阴阳消息理，万法弗违情。','五鬼为天符，当门阴女谋，相克无好事，行路阻中途，走失难寻觅，道逢有尼姑，此星当门值，万事有灾除。','神光跃青龙，财气喜重重，投入有酒食，赌彩最兴隆，更逢相生旺，休言克破凶，见贵安营寨，万事总吉同。','吾将为咸池，当之尽不宜，出入多不利，相克有灾情，赌彩全输尽，求财空手回，仙人真妙语，愚人莫与知，动用虚惊退，反复逆风吹。','坐临太阴星，百祸不相侵，求谋悉成就，知交有觅寻，回风归来路，恐有殃伏起，密语中记取，慎乎莫轻行。','迎来天乙星，相逢百事兴，运用和合庆，茶酒喜相迎，求谋并嫁娶，好合有天成，祸福如神验，吉凶甚分明。'],
      LUCK_QI_MEN:['大凶','大凶','小吉','大吉','大吉','大吉','小凶','小吉','小凶'],
      fromIndex:function(index){return _fromIndex(index);}
    };
  })();
  var EightChar = (function(){
    var _fromLunar=function(lunar){
      return {
        _p:{sect:2,lunar:lunar},
        setSect:function(sect){
          sect *= 1;
          this._p.sect=(1===sect)?1:2;
        },
        getSect:function(){return this._p.sect;},
        getDayGanIndex:function(){return 2===this._p.sect?this._p.lunar.getDayGanIndexExact2():this._p.lunar.getDayGanIndexExact();},
        getDayZhiIndex:function(){return 2===this._p.sect?this._p.lunar.getDayZhiIndexExact2():this._p.lunar.getDayZhiIndexExact();},
        getYear:function(){return this._p.lunar.getYearInGanZhiExact();},
        getYearGan:function(){return this._p.lunar.getYearGanExact();},
        getYearZhi:function(){return this._p.lunar.getYearZhiExact();},
        getYearHideGan:function(){return LunarUtil.ZHI_HIDE_GAN[this.getYearZhi()];},
        getYearWuXing:function(){return LunarUtil.WU_XING_GAN[this.getYearGan()]+LunarUtil.WU_XING_ZHI[this.getYearZhi()];},
        getYearNaYin:function(){return LunarUtil.NAYIN[this.getYear()];},
        getYearShiShenGan:function(){return LunarUtil.SHI_SHEN[this.getDayGan()+this.getYearGan()];},
        getYearShiShenZhi:function(){
          var dayGan = this.getDayGan();
          var hideGan = LunarUtil.ZHI_HIDE_GAN[this.getYearZhi()];
          var l = [];
          for(var i=0,j=hideGan.length;i<j;i++){
            l.push(LunarUtil.SHI_SHEN[dayGan+hideGan[i]]);
          }
          return l;
        },
        _getDiShi:function(zhiIndex){
          var offset = LunarUtil.CHANG_SHENG_OFFSET[this.getDayGan()];
          var index = offset + (this.getDayGanIndex()%2===0?zhiIndex:-zhiIndex);
          if(index>=12){
            index -= 12;
          }
          if(index<0){
            index += 12;
          }
          return LunarUtil.CHANG_SHENG[index];
        },
        getYearDiShi:function(){return this._getDiShi(this._p.lunar.getYearZhiIndexExact());},
        getYearXun:function(){return this._p.lunar.getYearXunExact()},
        getYearXunKong:function(){return this._p.lunar.getYearXunKongExact()},
        getMonth:function(){return this._p.lunar.getMonthInGanZhiExact();},
        getMonthGan:function(){return this._p.lunar.getMonthGanExact();},
        getMonthZhi:function(){return this._p.lunar.getMonthZhiExact();},
        getMonthHideGan:function(){return LunarUtil.ZHI_HIDE_GAN[this.getMonthZhi()];},
        getMonthWuXing:function(){return LunarUtil.WU_XING_GAN[this.getMonthGan()]+LunarUtil.WU_XING_ZHI[this.getMonthZhi()];},
        getMonthNaYin:function(){return LunarUtil.NAYIN[this.getMonth()];},
        getMonthShiShenGan:function(){return LunarUtil.SHI_SHEN[this.getDayGan()+this.getMonthGan()];},
        getMonthShiShenZhi:function(){
          var dayGan = this.getDayGan();
          var hideGan = LunarUtil.ZHI_HIDE_GAN[this.getMonthZhi()];
          var l = [];
          for(var i=0,j=hideGan.length;i<j;i++){
            l.push(LunarUtil.SHI_SHEN[dayGan+hideGan[i]]);
          }
          return l;
        },
        getMonthDiShi:function(){return this._getDiShi(this._p.lunar.getMonthZhiIndexExact());},
        getMonthXun:function(){return this._p.lunar.getMonthXunExact()},
        getMonthXunKong:function(){return this._p.lunar.getMonthXunKongExact()},
        getDay:function(){return 2===this._p.sect?this._p.lunar.getDayInGanZhiExact2():this._p.lunar.getDayInGanZhiExact();},
        getDayGan:function(){return 2===this._p.sect?this._p.lunar.getDayGanExact2():this._p.lunar.getDayGanExact();},
        getDayZhi:function(){return 2===this._p.sect?this._p.lunar.getDayZhiExact2():this._p.lunar.getDayZhiExact();},
        getDayHideGan:function(){return LunarUtil.ZHI_HIDE_GAN[this.getDayZhi()];},
        getDayWuXing:function(){return LunarUtil.WU_XING_GAN[this.getDayGan()]+LunarUtil.WU_XING_ZHI[this.getDayZhi()];},
        getDayNaYin:function(){return LunarUtil.NAYIN[this.getDay()];},
        getDayShiShenGan:function(){return '日主';},
        getDayShiShenZhi:function(){
          var dayGan = this.getDayGan();
          var hideGan = LunarUtil.ZHI_HIDE_GAN[this.getDayZhi()];
          var l = [];
          for(var i=0,j=hideGan.length;i<j;i++){
            l.push(LunarUtil.SHI_SHEN[dayGan+hideGan[i]]);
          }
          return l;
        },
        getDayDiShi:function(){return this._getDiShi(this.getDayZhiIndex());},
        getDayXun:function(){return 2===this._p.sect?this._p.lunar.getDayXunExact2():this._p.lunar.getDayXunExact()},
        getDayXunKong:function(){return 2===this._p.sect?this._p.lunar.getDayXunKongExact2():this._p.lunar.getDayXunKongExact()},
        getTime:function(){return this._p.lunar.getTimeInGanZhi();},
        getTimeGan:function(){return this._p.lunar.getTimeGan();},
        getTimeZhi:function(){return this._p.lunar.getTimeZhi();},
        getTimeHideGan:function(){return LunarUtil.ZHI_HIDE_GAN[this.getTimeZhi()];},
        getTimeWuXing:function(){return LunarUtil.WU_XING_GAN[this.getTimeGan()]+LunarUtil.WU_XING_ZHI[this.getTimeZhi()];},
        getTimeNaYin:function(){return LunarUtil.NAYIN[this.getTime()];},
        getTimeShiShenGan:function(){return LunarUtil.SHI_SHEN[this.getDayGan()+this.getTimeGan()];},
        getTimeShiShenZhi:function(){
          var dayGan = this.getDayGan();
          var hideGan = LunarUtil.ZHI_HIDE_GAN[this.getTimeZhi()];
          var l = [];
          for(var i=0,j=hideGan.length;i<j;i++){
            l.push(LunarUtil.SHI_SHEN[dayGan+hideGan[i]]);
          }
          return l;
        },
        getTimeDiShi:function(){return this._getDiShi(this._p.lunar.getTimeZhiIndex());},
        getTimeXun:function(){return this._p.lunar.getTimeXun();},
        getTimeXunKong:function(){return this._p.lunar.getTimeXunKong();},
        getTaiYuan:function(){
          var ganIndex = this._p.lunar.getMonthGanIndexExact() + 1;
          if(ganIndex>=10){
            ganIndex -= 10;
          }
          var zhiIndex = this._p.lunar.getMonthZhiIndexExact() + 3;
          if(zhiIndex>=12){
            zhiIndex -= 12;
          }
          return LunarUtil.GAN[ganIndex+1]+LunarUtil.ZHI[zhiIndex+1];
        },
        getTaiYuanNaYin:function(){return LunarUtil.NAYIN[this.getTaiYuan()];},
        getTaiXi:function(){
          var lunar = this._p.lunar;
          var ganIndex = (2 === this._p.sect) ? lunar.getDayGanIndexExact2() : lunar.getDayGanIndexExact();
          var zhiIndex = (2 === this._p.sect) ? lunar.getDayZhiIndexExact2() : lunar.getDayZhiIndexExact();
          return LunarUtil.HE_GAN_5[ganIndex]+LunarUtil.HE_ZHI_6[zhiIndex];
        },
        getTaiXiNaYin:function(){return LunarUtil.NAYIN[this.getTaiXi()];},
        getMingGong:function(){
          var monthZhiIndex = LunarUtil.index(this.getMonthZhi(), LunarUtil.MONTH_ZHI, 0);
          var timeZhiIndex = LunarUtil.index(this.getTimeZhi(), LunarUtil.MONTH_ZHI, 0);
          var offset = monthZhiIndex + timeZhiIndex;
          offset = (offset >= 14 ? 26 : 14) - offset;
          var ganIndex = (this._p.lunar.getYearGanIndexExact() + 1) * 2 + offset;
          while (ganIndex > 10) {
            ganIndex -= 10;
          }
          return LunarUtil.GAN[ganIndex] + LunarUtil.MONTH_ZHI[offset];
        },
        getMingGongNaYin:function(){return LunarUtil.NAYIN[this.getMingGong()];},
        getShenGong:function(){
          var monthZhiIndex = LunarUtil.index(this.getMonthZhi(), LunarUtil.MONTH_ZHI, 0);
          var timeZhiIndex = LunarUtil.index(this.getTimeZhi(), LunarUtil.ZHI, 0);
          var offset = monthZhiIndex + timeZhiIndex;
          if (offset > 12) {
            offset -= 12;
          }
          var ganIndex = (this._p.lunar.getYearGanIndexExact() + 1) * 2 + offset;
          while (ganIndex > 10) {
            ganIndex -= 10;
          }
          return LunarUtil.GAN[ganIndex] + LunarUtil.MONTH_ZHI[offset];
        },
        getShenGongNaYin:function(){return LunarUtil.NAYIN[this.getShenGong()];},
        getLunar:function(){return this._p.lunar;},
        getYun:function(gender, sect){
          sect *= 1;
          sect = (2 === sect) ? sect : 1;
          var lunar = this.getLunar();
          var yang = 0 === lunar.getYearGanIndexExact() % 2;
          var man = 1 === gender;
          var forward = (yang && man) || (!yang && !man);
          var start = (function(){
            var prev = lunar.getPrevJie();
            var next = lunar.getNextJie();
            var current = lunar.getSolar();
            var start = forward ? current : prev.getSolar();
            var end = forward ? next.getSolar() : current;

            var year;
            var month;
            var day;
            var hour = 0;

            if (2 === sect) {
              var minutes = end.subtractMinute(start);
              year = Math.floor(minutes / 4320);
              minutes -= year * 4320;
              month = Math.floor(minutes / 360);
              minutes -= month * 360;
              day = Math.floor(minutes / 12);
              minutes -= day * 12;
              hour = minutes * 2;
            } else {
              var endTimeZhiIndex = (end.getHour() === 23) ? 11 : LunarUtil.getTimeZhiIndex(end.toYmdHms().substring(11, 16));
              var startTimeZhiIndex = (start.getHour() === 23) ? 11 : LunarUtil.getTimeZhiIndex(start.toYmdHms().substring(11, 16));
              // 时辰差
              var hourDiff = endTimeZhiIndex - startTimeZhiIndex;
              // 天数差
              var dayDiff = end.subtract(start);
              if (hourDiff < 0) {
                hourDiff += 12;
                dayDiff--;
              }
              var monthDiff = Math.floor(hourDiff * 10 / 30);
              month = dayDiff * 4 + monthDiff;
              day = hourDiff * 10 - monthDiff * 30;
              year = Math.floor(month / 12);
              month = month - year * 12;
            }

            return {
              year: year,
              month: month,
              day: day,
              hour: hour
            };
          })();
          var buildLiuYue = function(liuNian, index){
            return {
              _p: {
                index: index,
                liuNian: liuNian
              },
              getIndex:function(){return this._p.index;},
              getMonthInChinese:function(){return LunarUtil.MONTH[this._p.index + 1];},
              getGanZhi:function(){
                var yearGanIndex = LunarUtil.find(this._p.liuNian.getGanZhi(), LunarUtil.GAN).index - 1;
                var offset = [2, 4, 6, 8, 0][yearGanIndex % 5];
                var gan = LunarUtil.GAN[(this._p.index + offset) % 10 + 1];
                var zhi = LunarUtil.ZHI[(this._p.index + LunarUtil.BASE_MONTH_ZHI_INDEX) % 12 + 1];
                return gan + zhi;
              },
              getXun:function(){return LunarUtil.getXun(this.getGanZhi());},
              getXunKong:function(){return LunarUtil.getXunKong(this.getGanZhi());}
            };
          };
          var buildLiuNian = function(daYun, index){
            return {
              _p: {
                year: daYun.getStartYear() + index,
                age: daYun.getStartAge() + index,
                index: index,
                daYun: daYun,
                lunar: daYun.getLunar()
              },
              getYear: function(){return this._p.year;},
              getAge: function(){return this._p.age;},
              getIndex: function(){return this._p.index;},
              getLunar: function(){return this._p.lunar;},
              getGanZhi: function(){
                var offset = LunarUtil.getJiaZiIndex(this._p.lunar.getJieQiTable()[I18n.getMessage('jq.liChun')].getLunar().getYearInGanZhiExact()) + this._p.index;
                if (this._p.daYun.getIndex() > 0) {
                  offset += this._p.daYun.getStartAge() - 1;
                }
                offset %= LunarUtil.JIA_ZI.length;
                return LunarUtil.JIA_ZI[offset];
              },
              getXun:function(){return LunarUtil.getXun(this.getGanZhi());},
              getXunKong:function(){return LunarUtil.getXunKong(this.getGanZhi());},
              getLiuYue: function(){
                var l = [];
                for (var i = 0; i < 12; i++) {
                  l.push(buildLiuYue(this,i));
                }
                return l;
              }
            };
          };
          var buildXiaoYun = function(daYun, index, forward){
            return {
              _p: {
                year: daYun.getStartYear() + index,
                age: daYun.getStartAge() + index,
                index: index,
                daYun: daYun,
                forward: forward,
                lunar: daYun.getLunar()
              },
              getYear: function(){return this._p.year;},
              getAge: function(){return this._p.age;},
              getIndex: function(){return this._p.index;},
              getGanZhi: function(){
                var offset = LunarUtil.getJiaZiIndex(this._p.lunar.getTimeInGanZhi());
                var add = this._p.index + 1;
                if (this._p.daYun.getIndex() > 0) {
                  add += this._p.daYun.getStartAge() - 1;
                }
                offset += this._p.forward ? add : -add;
                var size = LunarUtil.JIA_ZI.length;
                while (offset < 0) {
                  offset += size;
                }
                offset %= size;
                return LunarUtil.JIA_ZI[offset];
              },
              getXun:function(){return LunarUtil.getXun(this.getGanZhi());},
              getXunKong:function(){return LunarUtil.getXunKong(this.getGanZhi());}
            };
          };
          var buildDaYun = function(yun, index){
            var birthYear = yun.getLunar().getSolar().getYear();
            var year = yun.getStartSolar().getYear();
            var startYear;
            var startAge;
            var endYear;
            var endAge;
            if (index < 1) {
              startYear = birthYear;
              startAge = 1;
              endYear = year - 1;
              endAge = year - birthYear;
            } else {
              var add = (index - 1) * 10;
              startYear = year + add;
              startAge = startYear - birthYear + 1;
              endYear = startYear + 9;
              endAge = startAge + 9;
            }
            return {
              _p: {
                startYear: startYear,
                endYear: endYear,
                startAge: startAge,
                endAge: endAge,
                index: index,
                yun: yun,
                lunar: yun.getLunar()
              },
              getStartYear: function(){return this._p.startYear;},
              getEndYear: function(){return this._p.endYear;},
              getStartAge: function(){return this._p.startAge;},
              getEndAge: function(){return this._p.endAge;},
              getIndex: function(){return this._p.index;},
              getLunar: function(){return this._p.lunar;},
              getGanZhi: function(){
                if (this._p.index < 1) {
                  return '';
                }
                var offset = LunarUtil.getJiaZiIndex(this._p.lunar.getMonthInGanZhiExact());
                offset += this._p.yun.isForward() ? this._p.index : -this._p.index;
                var size = LunarUtil.JIA_ZI.length;
                if (offset >= size) {
                  offset -= size;
                }
                if (offset < 0) {
                  offset += size;
                }
                return LunarUtil.JIA_ZI[offset];
              },
              getXun:function(){return LunarUtil.getXun(this.getGanZhi());},
              getXunKong:function(){return LunarUtil.getXunKong(this.getGanZhi());},
              getLiuNian: function(n){
                if (!n) {
                  n = 10;
                }
                if (this._p.index < 1) {
                  n = this._p.endYear-this._p.startYear+1;
                }
                var l = [];
                for (var i = 0; i < n; i++) {
                  l.push(buildLiuNian(this,i));
                }
                return l;
              },
              getXiaoYun: function(n){
                if (!n) {
                  n = 10;
                }
                if (this._p.index < 1) {
                  n = this._p.endYear-this._p.startYear+1;
                }
                var l = [];
                for (var i = 0; i < n; i++) {
                  l.push(buildXiaoYun(this,i,this._p.yun.isForward()));
                }
                return l;
              }
            };
          };
          return {
            _p: {
              gender: gender,
              startYear: start.year,
              startMonth: start.month,
              startDay: start.day,
              startHour: start.hour,
              forward: forward,
              lunar: lunar
            },
            getGender: function(){return this._p.gender;},
            getStartYear: function(){return this._p.startYear;},
            getStartMonth: function(){return this._p.startMonth;},
            getStartDay: function(){return this._p.startDay;},
            getStartHour: function(){return this._p.startHour;},
            isForward: function(){return this._p.forward;},
            getLunar: function(){return this._p.lunar;},
            getStartSolar: function(){
              var solar = this._p.lunar.getSolar();
              solar = solar.nextYear(this._p.startYear);
              solar = solar.nextMonth(this._p.startMonth);
              solar = solar.next(this._p.startDay);
              return solar.nextHour(this._p.startHour);
            },
            getDaYun: function(n){
              if (!n) {
                n = 10;
              }
              var l = [];
              for (var i = 0; i < n; i++) {
                l.push(buildDaYun(this,i));
              }
              return l;
            }
          };
        },
        toString:function(){return this.getYear()+' '+this.getMonth()+' '+this.getDay()+' '+this.getTime();}
      };
    };
    return {
      fromLunar:function(lunar){return _fromLunar(lunar);}
    };
  })();
  var LunarTime = (function(){
    var _fromYmdHms=function(lunarYear,lunarMonth,lunarDay,hour,minute,second){
      var lunar=Lunar.fromYmdHms(lunarYear,lunarMonth,lunarDay,hour,minute,second);
      var zhiIndex=LunarUtil.getTimeZhiIndex([(hour<10?'0':'')+hour,(minute<10?'0':'')+minute].join(':'));
      var ganIndex = (lunar.getDayGanIndexExact() % 5 * 2 + zhiIndex) % 10;
      return {
        _p:{
          ganIndex:ganIndex,
          zhiIndex:zhiIndex,
          lunar:lunar
        },
        getGanIndex:function(){return this._p.ganIndex;},
        getZhiIndex:function(){return this._p.zhiIndex;},
        getGan:function(){return LunarUtil.GAN[this._p.ganIndex+1];},
        getZhi:function(){return LunarUtil.ZHI[this._p.zhiIndex+1];},
        getGanZhi:function(){return this.getGan()+this.getZhi();},
        getShengXiao:function(){return LunarUtil.SHENGXIAO[this._p.zhiIndex+1];},
        getPositionXi:function(){return LunarUtil.POSITION_XI[this._p.ganIndex + 1];},
        getPositionXiDesc:function(){return LunarUtil.POSITION_DESC[this.getPositionXi()];},
        getPositionYangGui:function(){return LunarUtil.POSITION_YANG_GUI[this._p.ganIndex + 1];},
        getPositionYangGuiDesc:function(){return LunarUtil.POSITION_DESC[this.getPositionYangGui()];},
        getPositionYinGui:function(){return LunarUtil.POSITION_YIN_GUI[this._p.ganIndex + 1];},
        getPositionYinGuiDesc:function(){return LunarUtil.POSITION_DESC[this.getPositionYinGui()];},
        getPositionFu:function(sect){return (1===sect?LunarUtil.POSITION_FU:LunarUtil.POSITION_FU_2)[this._p.ganIndex + 1];},
        getPositionFuDesc:function(sect){return LunarUtil.POSITION_DESC[this.getPositionFu(sect)];},
        getPositionCai:function(){return LunarUtil.POSITION_CAI[this._p.ganIndex + 1];},
        getPositionCaiDesc:function(){return LunarUtil.POSITION_DESC[this.getPositionCai()];},
        getNaYin:function(){return LunarUtil.NAYIN[this.getGanZhi()];},
        getTianShen:function(){
          return LunarUtil.TIAN_SHEN[(this._p.zhiIndex + LunarUtil.ZHI_TIAN_SHEN_OFFSET[this._p.lunar.getDayZhiExact()]) % 12 + 1];
        },
        getTianShenType:function(){return LunarUtil.TIAN_SHEN_TYPE[this.getTianShen()];},
        getTianShenLuck:function(){return LunarUtil.TIAN_SHEN_TYPE_LUCK[this.getTianShenType()];},
        getChong:function(){return LunarUtil.CHONG[this._p.zhiIndex];},
        getSha:function(){return LunarUtil.SHA[this.getZhi()];},
        getChongShengXiao:function(){
          var chong = this.getChong();
          for (var i = 0, j = LunarUtil.ZHI.length; i < j; i++) {
            if (LunarUtil.ZHI[i]===chong) {
              return LunarUtil.SHENGXIAO[i];
            }
          }
          return '';
        },
        getChongDesc:function(){return '(' + this.getChongGan() + this.getChong() + ')' + this.getChongShengXiao();},
        getChongGan:function(){return LunarUtil.CHONG_GAN[this._p.ganIndex];},
        getChongGanTie:function(){return LunarUtil.CHONG_GAN_TIE[this._p.ganIndex];},
        getYi:function(){return LunarUtil.getTimeYi(this._p.lunar.getDayInGanZhiExact(), this.getGanZhi());},
        getJi:function(){return LunarUtil.getTimeJi(this._p.lunar.getDayInGanZhiExact(), this.getGanZhi());},
        getNineStar:function(){
          var solarYmd = this._p.lunar.getSolar().toYmd();
          var jieQi = this._p.lunar.getJieQiTable();
          var asc = false;
          if (solarYmd>=jieQi[I18n.getMessage('jq.dongZhi')].toYmd() && solarYmd<jieQi[I18n.getMessage('jq.xiaZhi')].toYmd()) {
            asc = true;
          }
          var offset = asc ? [0, 3, 6] : [8, 5, 2];
          var start = offset[this._p.lunar.getDayZhiIndex() % 3];
          var index = asc ? (start + this._p.zhiIndex) : (start + 9 - this._p.zhiIndex);
          return NineStar.fromIndex(index % 9);
        },
        getXun:function(){return LunarUtil.getXun(this.getGanZhi());},
        getXunKong:function(){return LunarUtil.getXunKong(this.getGanZhi());},
        getMinHm:function(){
          var hour = this._p.lunar.getHour();
          if(hour <1){
            return '00:00';
          }else if(hour > 22){
            return '23:00';
          }
          if(hour%2===0){
            hour-=1;
          }
          return (hour<10?'0':'')+hour+':00';
        },
        getMaxHm:function(){
          var hour = this._p.lunar.getHour();
          if (hour <1){
            return '00:59';
          } else if (hour > 22) {
            return '23:59';
          }
          if(hour%2!==0){
            hour+=1;
          }
          return (hour<10?'0':'')+hour+':59';
        },
        toString:function(){return this.getGanZhi();}
      };
    };
    return {
      fromYmdHms:function(lunarYear,lunarMonth,lunarDay,hour,minute,second){return _fromYmdHms(lunarYear,lunarMonth,lunarDay,hour,minute,second);}
    };
  })();
  var FotoUtil = (function(){
    var XIU_OFFSET = [11, 13, 15, 17, 19, 21, 24, 0, 2, 4, 7, 9];
    var _f=function(name,result,everyMonth,remark){
      return {
        _p:{
          name:name,
          result:result?result:'',
          everyMonth:!!everyMonth,
          remark:remark?remark:''
        },
        getName:function(){return this._p.name;},
        getResult:function(){return this._p.result;},
        isEveryMonth:function(){return this._p.everyMonth;},
        getRemark:function(){return this._p.remark;},
        toString:function(){return this._p.name;},
        toFullString:function(){
          var l = [this._p.name];
          if(this._p.result) {
            l.push(this._p.result);
          }
          if(this._p.remark) {
            l.push(this._p.remark);
          }
          return l.join(' ');
        }
      };
    };
    var _getXiu=function(m,d){
      return FotoUtil.XIU_27[(XIU_OFFSET[Math.abs(m)-1] + d - 1) % FotoUtil.XIU_27.length];
    };
    var dj='犯者夺纪';
    var js='犯者减寿';
    var ss='犯者损寿';
    var xl='犯者削禄夺纪';
    var jw='犯者三年内夫妇俱亡';
    var _y=_f('杨公忌');
    var _t=_f('四天王巡行', '', true);
    var _d=_f('斗降', dj, true);
    var _s=_f('月朔', dj, true);
    var _w=_f('月望', dj, true);
    var _h=_f('月晦', js, true);
    var _l=_f('雷斋日', js, true);
    var _j=_f('九毒日', '犯者夭亡，奇祸不测');
    var _r=_f('人神在阴', '犯者得病', true, '宜先一日即戒');
    var _m=_f('司命奏事', js, true, '如月小，即戒廿九');
    var _hh=_f('月晦', js, true, '如月小，即戒廿九');
    return {
      XIU_27:[
        '{xx.jiao}',
        '{xx.kang}',
        '{xx.di}',
        '{xx.fang}',
        '{xx.xin}',
        '{xx.tail}',
        '{xx.ji}',
        '{xx.dou}',
        '{xx.nv}',
        '{xx.xu}',
        '{xx.wei}',
        '{xx.shi}',
        '{xx.qiang}',
        '{xx.kui}',
        '{xx.lou}',
        '{xx.vei}',
        '{xx.mao}',
        '{xx.bi}',
        '{xx.zi}',
        '{xx.can}',
        '{xx.jing}',
        '{xx.gui}',
        '{xx.liu}',
        '{xx.xing}',
        '{xx.zhang}',
        '{xx.yi}',
        '{xx.zhen}'
      ],
      DAY_ZHAI_GUAN_YIN:['1-8','2-7','2-9','2-19','3-3','3-6','3-13','4-22','5-3','5-17','6-16','6-18','6-19','6-23','7-13','8-16','9-19','9-23','10-2','11-19','11-24','12-25'],
      FESTIVAL:{
        '1-1': [_f('天腊，玉帝校世人神气禄命', xl), _s],
        '1-3': [_f('万神都会', dj), _d],
        '1-5': [_f('五虚忌')],
        '1-6': [_f('六耗忌'), _l],
        '1-7': [_f('上会日', ss)],
        '1-8': [_f('五殿阎罗天子诞', dj), _t],
        '1-9': [_f('玉皇上帝诞', dj)],
        '1-13': [_y],
        '1-14': [_f('三元降', js), _t],
        '1-15': [_f('三元降', js), _f('上元神会', dj), _w, _t],
        '1-16': [_f('三元降', js)],
        '1-19': [_f('长春真人诞')],
        '1-23': [_f('三尸神奏事'), _t],
        '1-25': [_h, _f('天地仓开日', '犯者损寿，子带疾')],
        '1-27': [_d],
        '1-28': [_r],
        '1-29': [_t],
        '1-30': [_hh, _m, _t],
        '2-1': [_f('一殿秦广王诞', dj), _s],
        '2-2': [_f('万神都会', dj), _f('福德土地正神诞', '犯者得祸')],
        '2-3': [_f('文昌帝君诞', xl), _d],
        '2-6': [_f('东华帝君诞'), _l],
        '2-8': [_f('释迦牟尼佛出家', dj), _f('三殿宋帝王诞', dj), _f('张大帝诞', dj), _t],
        '2-11': [_y],
        '2-14': [_t],
        '2-15': [_f('释迦牟尼佛涅槃', xl), _f('太上老君诞', xl), _f('月望', xl, true), _t],
        '2-17': [_f('东方杜将军诞')],
        '2-18': [_f('四殿五官王诞', xl), _f('至圣先师孔子讳辰', xl)],
        '2-19': [_f('观音大士诞', dj)],
        '2-21': [_f('普贤菩萨诞')],
        '2-23': [_t],
        '2-25': [_h],
        '2-27': [_d],
        '2-28': [_r],
        '2-29': [_t],
        '2-30': [_hh, _m, _t],
        '3-1': [_f('二殿楚江王诞', dj), _s],
        '3-3': [_f('玄天上帝诞', dj), _d],
        '3-6': [_l],
        '3-8': [_f('六殿卞城王诞', dj), _t],
        '3-9': [_f('牛鬼神出', '犯者产恶胎'), _y],
        '3-12': [_f('中央五道诞')],
        '3-14': [_t],
        '3-15': [_f('昊天上帝诞', dj), _f('玄坛诞', dj), _w, _t],
        '3-16': [_f('准提菩萨诞', dj)],
        '3-19': [_f('中岳大帝诞'), _f('后土娘娘诞'), _f('三茅降')],
        '3-20': [_f('天地仓开日', ss), _f('子孙娘娘诞')],
        '3-23': [_t],
        '3-25': [_h],
        '3-27': [_f('七殿泰山王诞'), _d],
        '3-28': [_r, _f('苍颉至圣先师诞', xl), _f('东岳大帝诞')],
        '3-29': [_t],
        '3-30': [_hh, _m, _t],
        '4-1': [_f('八殿都市王诞', dj), _s],
        '4-3': [_d],
        '4-4': [_f('万神善会', '犯者失瘼夭胎'), _f('文殊菩萨诞')],
        '4-6': [_l],
        '4-7': [_f('南斗、北斗、西斗同降', js), _y],
        '4-8': [_f('释迦牟尼佛诞', dj), _f('万神善会', '犯者失瘼夭胎'), _f('善恶童子降', '犯者血死'), _f('九殿平等王诞'), _t],
        '4-14': [_f('纯阳祖师诞', js), _t],
        '4-15': [_w, _f('钟离祖师诞'),  _t],
        '4-16': [_f('天地仓开日', ss)],
        '4-17': [_f('十殿转轮王诞', dj)],
        '4-18': [_f('天地仓开日', ss), _f('紫徽大帝诞', ss)],
        '4-20': [_f('眼光圣母诞')],
        '4-23': [_t],
        '4-25': [_h],
        '4-27': [_d],
        '4-28': [_r],
        '4-29': [_t],
        '4-30': [_hh, _m, _t],
        '5-1': [_f('南极长生大帝诞', dj), _s],
        '5-3': [_d],
        '5-5': [_f('地腊', xl), _f('五帝校定生人官爵', xl), _j, _y],
        '5-6': [_j, _l],
        '5-7': [_j],
        '5-8': [_f('南方五道诞'), _t],
        '5-11': [_f('天地仓开日', ss),_f('天下都城隍诞')],
        '5-12': [_f('炳灵公诞')],
        '5-13': [_f('关圣降', xl)],
        '5-14': [_f('夜子时为天地交泰', jw), _t],
        '5-15': [_w, _j, _t],
        '5-16': [_f('九毒日', jw), _f('天地元气造化万物之辰', jw)],
        '5-17': [_j],
        '5-18': [_f('张天师诞')],
        '5-22': [_f('孝娥神诞', dj)],
        '5-23': [_t],
        '5-25': [_j, _h],
        '5-26': [_j],
        '5-27': [_j, _d],
        '5-28': [_r],
        '5-29': [_t],
        '5-30': [_hh, _m, _t],
        '6-1': [_s],
        '6-3': [_f('韦驮菩萨圣诞'), _d, _y],
        '6-5': [_f('南赡部洲转大轮', ss)],
        '6-6': [_f('天地仓开日', ss), _l],
        '6-8': [_t],
        '6-10': [_f('金粟如来诞')],
        '6-14': [_t],
        '6-15': [_w, _t],
        '6-19': [_f('观世音菩萨成道', dj)],
        '6-23': [_f('南方火神诞', '犯者遭回禄'), _t],
        '6-24': [_f('雷祖诞', xl), _f('关帝诞', xl)],
        '6-25': [_h],
        '6-27': [_d],
        '6-28': [_r],
        '6-29': [_t],
        '6-30': [_hh, _m, _t],
        '7-1': [_s, _y],
        '7-3': [_d],
        '7-5': [_f('中会日', ss, false, '一作初七')],
        '7-6': [_l],
        '7-7': [_f('道德腊', xl), _f('五帝校生人善恶', xl), _f('魁星诞', xl)],
        '7-8': [_t],
        '7-10': [_f('阴毒日', '', false, '大忌')],
        '7-12': [_f('长真谭真人诞')],
        '7-13': [_f('大势至菩萨诞', js)],
        '7-14': [_f('三元降', js), _t],
        '7-15': [_w, _f('三元降', dj),_f('地官校籍', dj), _t],
        '7-16': [_f('三元降', js)],
        '7-18': [_f('西王母诞', dj)],
        '7-19': [_f('太岁诞', dj)],
        '7-22': [_f('增福财神诞', xl)],
        '7-23': [_t],
        '7-25': [_h],
        '7-27': [_d],
        '7-28': [_r],
        '7-29': [_y, _t],
        '7-30': [_f('地藏菩萨诞', dj), _hh, _m, _t],
        '8-1': [_s, _f('许真君诞')],
        '8-3': [_d, _f('北斗诞', xl), _f('司命灶君诞', '犯者遭回禄')],
        '8-5': [_f('雷声大帝诞', dj)],
        '8-6': [_l],
        '8-8': [_t],
        '8-10': [_f('北斗大帝诞')],
        '8-12': [_f('西方五道诞')],
        '8-14': [_t],
        '8-15': [_w, _f('太明朝元', '犯者暴亡', false, '宜焚香守夜'), _t],
        '8-16': [_f('天曹掠刷真君降', '犯者贫夭')],
        '8-18': [_f('天人兴福之辰', '', false, '宜斋戒，存想吉事')],
        '8-23': [_f('汉恒候张显王诞'), _t],
        '8-24': [_f('灶君夫人诞')],
        '8-25': [_h],
        '8-27': [_d, _f('至圣先师孔子诞', xl), _y],
        '8-28': [_r, _f('四天会事')],
        '8-29': [_t],
        '8-30': [_f('诸神考校', '犯者夺算'), _hh, _m, _t],
        '9-1': [_s, _f('南斗诞', xl), _f('北斗九星降世', dj, false, '此九日俱宜斋戒')],
        '9-3': [_d, _f('五瘟神诞')],
        '9-6': [_l],
        '9-8': [_t],
        '9-9': [_f('斗母诞', xl), _f('酆都大帝诞'), _f('玄天上帝飞升')],
        '9-10': [_f('斗母降', dj)],
        '9-11': [_f('宜戒')],
        '9-13': [_f('孟婆尊神诞')],
        '9-14': [_t],
        '9-15': [_w, _t],
        '9-17': [_f('金龙四大王诞', '犯者遭水厄')],
        '9-19': [_f('日宫月宫会合', js), _f('观世音菩萨诞', js)],
        '9-23': [_t],
        '9-25': [_h, _y],
        '9-27': [_d],
        '9-28': [_r],
        '9-29': [_t],
        '9-30': [_f('药师琉璃光佛诞', '犯者危疾'), _hh, _m, _t],
        '10-1': [_s, _f('民岁腊', dj), _f('四天王降', '犯者一年内死')],
        '10-3': [_d, _f('三茅诞')],
        '10-5': [_f('下会日', js), _f('达摩祖师诞', js)],
        '10-6': [_l, _f('天曹考察', dj)],
        '10-8': [_f('佛涅槃日', '', false, '大忌色欲'), _t],
        '10-10': [_f('四天王降', '犯者一年内死')],
        '10-11': [_f('宜戒')],
        '10-14': [_f('三元降', js), _t],
        '10-15': [_w, _f('三元降', dj), _f('下元水府校籍', dj), _t],
        '10-16': [_f('三元降', js), _t],
        '10-23': [_y, _t],
        '10-25': [_h],
        '10-27': [_d, _f('北极紫徽大帝降')],
        '10-28': [_r],
        '10-29': [_t],
        '10-30': [_hh, _m, _t],
        '11-1': [_s],
        '11-3': [_d],
        '11-4': [_f('至圣先师孔子诞', xl)],
        '11-6': [_f('西岳大帝诞')],
        '11-8': [_t],
        '11-11': [_f('天地仓开日', dj), _f('太乙救苦天尊诞', dj)],
        '11-14': [_t],
        '11-15': [_f('月望', '上半夜犯男死 下半夜犯女死'), _f('四天王巡行', '上半夜犯男死 下半夜犯女死')],
        '11-17': [_f('阿弥陀佛诞')],
        '11-19': [_f('太阳日宫诞', '犯者得奇祸')],
        '11-21': [_y],
        '11-23': [_f('张仙诞', '犯者绝嗣'), _t],
        '11-25': [_f('掠刷大夫降', '犯者遭大凶'), _h],
        '11-26': [_f('北方五道诞')],
        '11-27': [_d],
        '11-28': [_r],
        '11-29': [_t],
        '11-30': [_hh, _m, _t],
        '12-1': [_s],
        '12-3': [_d],
        '12-6': [_f('天地仓开日', js), _l],
        '12-7': [_f('掠刷大夫降', '犯者得恶疾')],
        '12-8': [_f('王侯腊', dj), _f('释迦如来成佛之辰'), _t, _f('初旬内戊日，亦名王侯腊', dj)],
        '12-12': [_f('太素三元君朝真')],
        '12-14': [_t],
        '12-15': [_w, _t],
        '12-16': [_f('南岳大帝诞')],
        '12-19': [_y],
        '12-20': [_f('天地交道', '犯者促寿')],
        '12-21': [_f('天猷上帝诞')],
        '12-23': [_f('五岳诞降'), _t],
        '12-24': [_f('司今朝天奏人善恶', '犯者得大祸')],
        '12-25': [_f('三清玉帝同降，考察善恶', '犯者得奇祸'), _h],
        '12-27': [_d],
        '12-28': [_r],
        '12-29': [_f('华严菩萨诞'), _t],
        '12-30': [_f('诸神下降，察访善恶', '犯者男女俱亡')]
      },
      OTHER_FESTIVAL:{
        '1-1': ['弥勒菩萨圣诞'],
        '1-6': ['定光佛圣诞'],
        '2-8': ['释迦牟尼佛出家'],
        '2-15': ['释迦牟尼佛涅槃'],
        '2-19': ['观世音菩萨圣诞'],
        '2-21': ['普贤菩萨圣诞'],
        '3-16': ['准提菩萨圣诞'],
        '4-4': ['文殊菩萨圣诞'],
        '4-8': ['释迦牟尼佛圣诞'],
        '4-15': ['佛吉祥日'],
        '4-28': ['药王菩萨圣诞'],
        '5-13': ['伽蓝菩萨圣诞'],
        '6-3': ['韦驮菩萨圣诞'],
        '6-19': ['观音菩萨成道'],
        '7-13': ['大势至菩萨圣诞'],
        '7-15': ['佛欢喜日'],
        '7-24': ['龙树菩萨圣诞'],
        '7-30': ['地藏菩萨圣诞'],
        '8-15': ['月光菩萨圣诞'],
        '8-22': ['燃灯佛圣诞'],
        '9-9': ['摩利支天菩萨圣诞'],
        '9-19': ['观世音菩萨出家'],
        '9-30': ['药师琉璃光佛圣诞'],
        '10-5': ['达摩祖师圣诞'],
        '10-20': ['文殊菩萨出家'],
        '11-17': ['阿弥陀佛圣诞'],
        '11-19': ['日光菩萨圣诞'],
        '12-8': ['释迦牟尼佛成道'],
        '12-23': ['监斋菩萨圣诞'],
        '12-29': ['华严菩萨圣诞']
      },
      getXiu:function(m,d){return _getXiu(m,d);}
    }
  })();
  var Foto = (function(){
    var _fromYmdHms=function(y,m,d,hour,minute,second){
      return _fromLunar(Lunar.fromYmdHms(y+Foto.DEAD_YEAR-1,m,d,hour,minute,second));
    };
    var _fromLunar=function(lunar){
      return {
        _p: {
          lunar: lunar
        },
        getLunar:function(){return this._p.lunar;},
        getYear:function(){
          var sy = this._p.lunar.getSolar().getYear();
          var y = sy-Foto.DEAD_YEAR;
          if(sy===this._p.lunar.getYear()){
            y++;
          }
          return y;
        },
        getMonth:function(){return this._p.lunar.getMonth();},
        getDay:function(){return this._p.lunar.getDay();},
        getYearInChinese:function(){
          var y = this.getYear()+'';
          var s = '';
          var zero = '0'.charCodeAt(0);
          for(var i=0,j=y.length;i<j;i++){
            s+=LunarUtil.NUMBER[y.charCodeAt(i)-zero];
          }
          return s;
        },
        getMonthInChinese:function(){return this._p.lunar.getMonthInChinese();},
        getDayInChinese:function(){return this._p.lunar.getDayInChinese();},
        getFestivals:function(){
          var l = FotoUtil.FESTIVAL[this.getMonth()+'-'+this.getDay()];
          return l?l:[];
        },
        getOtherFestivals:function(){
          var l=[];
          var fs=FotoUtil.OTHER_FESTIVAL[this.getMonth()+'-'+this.getDay()];
          if(fs){
            l=l.concat(fs);
          }
          return l;
        },
        isMonthZhai:function(){
          var m = this.getMonth();
          return 1===m||5===m||9===m;
        },
        isDayYangGong:function(){
          var l = this.getFestivals();
          for(var i=0,j=l.length;i<j;i++){
            if('杨公忌'===l[i].getName()){
              return true;
            }
          }
          return false;
        },
        isDayZhaiShuoWang:function(){
          var d = this.getDay();
          return 1===d||15===d;
        },
        isDayZhaiSix:function(){
          var d = this.getDay();
          if(8===d||14===d||15===d||23===d||29===d||30===d){
            return true;
          }else if(28===d){
            var m = LunarMonth.fromYm(this._p.lunar.getYear(), this.getMonth());
            if(30!==m.getDayCount()){
              return true;
            }
          }
          return false;
        },
        isDayZhaiTen:function() {
          var d = this.getDay();
          return 1===d||8===d||14===d||15===d||18===d||23===d||24===d||28===d||29===d||30===d;
        },
        isDayZhaiGuanYin:function() {
          var k = this.getMonth()+'-'+this.getDay();
          for(var i=0,j=FotoUtil.DAY_ZHAI_GUAN_YIN.length;i<j;i++){
            if(k===FotoUtil.DAY_ZHAI_GUAN_YIN[i]){
              return true;
            }
          }
          return false;
        },
        getXiu:function(){
          return FotoUtil.getXiu(this.getMonth(), this.getDay());
        },
        getXiuLuck:function(){
          return LunarUtil.XIU_LUCK[this.getXiu()];
        },
        getXiuSong:function(){
          return LunarUtil.XIU_SONG[this.getXiu()];
        },
        getZheng:function(){
          return LunarUtil.ZHENG[this.getXiu()];
        },
        getAnimal:function(){
          return LunarUtil.ANIMAL[this.getXiu()];
        },
        getGong:function(){
          return LunarUtil.GONG[this.getXiu()];
        },
        getShou:function(){
          return LunarUtil.SHOU[this.getGong()];
        },
        toString:function(){
          return this.getYearInChinese()+'年'+this.getMonthInChinese()+'月'+this.getDayInChinese();
        },
        toFullString:function(){
          var s = this.toString();
          var fs = this.getFestivals();
          for(var i=0,j=fs.length;i<j;i++){
            s += ' ('+fs[i]+')';
          }
          return s;
        }
      };
    };
    return {
      DEAD_YEAR:-543,
      fromYmdHms:function(y,m,d,hour,minute,second){return _fromYmdHms(y,m,d,hour,minute,second);},
      fromYmd:function(y,m,d){return _fromYmdHms(y,m,d,0,0,0);},
      fromLunar:function(lunar){return _fromLunar(lunar);}
    };
  })();
  var TaoFestival = (function(){
    var _f=function(name,remark){
      return {
        _p:{
          name:name,
          remark:remark?remark:''
        },
        getName:function(){return this._p.name;},
        getRemark:function(){return this._p.remark;},
        toString:function(){return this._p.name;},
        toFullString:function(){
          var l = [this._p.name];
          if(this._p.remark) {
            l.push('['+this._p.remark+']');
          }
          return l.join('');
        }
      };
    };
    return {
      create:function(name,remark){return _f(name,remark);}
    };
  })();
  var TaoUtil = (function(){
    var _f = TaoFestival.create;
    return {
      SAN_HUI:['1-7','7-7','10-15'],
      SAN_YUAN:['1-15','7-15','10-15'],
      WU_LA:['1-1','5-5','7-7','10-1','12-8'],
      AN_WU:['{dz.wei}', '{dz.xu}', '{dz.chen}', '{dz.yin}', '{dz.wu}', '{dz.zi}', '{dz.you}', '{dz.shen}', '{dz.si}', '{dz.hai}', '{dz.mao}', '{dz.chou}'],
      BA_HUI:{
        '{jz.bingWu}':'天会',
        '{jz.renWu}':'地会',
        '{jz.renZi}':'人会',
        '{jz.gengWu}':'日会',
        '{jz.gengShen}':'月会',
        '{jz.xinYou}':'星辰会',
        '{jz.jiaChen}':'五行会',
        '{jz.jiaXu}':'四时会'
      },
      BA_JIE:{
        '{jq.liChun}':'东北方度仙上圣天尊同梵炁始青天君下降',
        '{jq.chunFen}':'东方玉宝星上天尊同青帝九炁天君下降',
        '{jq.liXia}':'东南方好生度命天尊同梵炁始丹天君下降',
        '{jq.xiaZhi}':'南方玄真万福天尊同赤帝三炁天君下降',
        '{jq.liQiu}':'西南方太灵虚皇天尊同梵炁始素天君下降',
        '{jq.qiuFen}':'西方太妙至极天尊同白帝七炁天君下降',
        '{jq.liDong}':'西北方无量太华天尊同梵炁始玄天君下降',
        '{jq.dongZhi}':'北方玄上玉宸天尊同黑帝五炁天君下降'
      },
      FESTIVAL: {
        '1-1': [_f('天腊之辰', '天腊，此日五帝会于东方九炁青天')],
        '1-3': [_f('郝真人圣诞'), _f('孙真人圣诞')],
        '1-5': [_f('孙祖清静元君诞')],
        '1-7': [_f('举迁赏会', '此日上元赐福，天官同地水二官考校罪福')],
        '1-9': [_f('玉皇上帝圣诞')],
        '1-13': [_f('关圣帝君飞升')],
        '1-15': [_f('上元天官圣诞'), _f('老祖天师圣诞')],
        '1-19': [_f('长春邱真人(邱处机)圣诞')],
        '1-28': [_f('许真君(许逊天师)圣诞')],
        '2-1': [_f('勾陈天皇大帝圣诞'), _f('长春刘真人(刘渊然)圣诞')],
        '2-2': [_f('土地正神诞'), _f('姜太公圣诞')],
        '2-3': [_f('文昌梓潼帝君圣诞')],
        '2-6': [_f('东华帝君圣诞')],
        '2-13': [_f('度人无量葛真君圣诞')],
        '2-15': [_f('太清道德天尊(太上老君)圣诞')],
        '2-19': [_f('慈航真人圣诞')],
        '3-1': [_f('谭祖(谭处端)长真真人圣诞')],
        '3-3': [_f('玄天上帝圣诞')],
        '3-6': [_f('眼光娘娘圣诞')],
        '3-15': [_f('天师张大真人圣诞'), _f('财神赵公元帅圣诞')],
        '3-16': [_f('三茅真君得道之辰'), _f('中岳大帝圣诞')],
        '3-18': [_f('王祖(王处一)玉阳真人圣诞'), _f('后土娘娘圣诞')],
        '3-19': [_f('太阳星君圣诞')],
        '3-20': [_f('子孙娘娘圣诞')],
        '3-23': [_f('天后妈祖圣诞')],
        '3-26': [_f('鬼谷先师诞')],
        '3-28': [_f('东岳大帝圣诞')],
        '4-1': [_f('长生谭真君成道之辰')],
        '4-10': [_f('何仙姑圣诞')],
        '4-14': [_f('吕祖纯阳祖师圣诞')],
        '4-15': [_f('钟离祖师圣诞')],
        '4-18': [_f('北极紫微大帝圣诞'), _f('泰山圣母碧霞元君诞'), _f('华佗神医先师诞')],
        '4-20': [_f('眼光圣母娘娘诞')],
        '4-28': [_f('神农先帝诞')],
        '5-1': [_f('南极长生大帝圣诞')],
        '5-5': [_f('地腊之辰', '地腊，此日五帝会于南方三炁丹天'), _f('南方雷祖圣诞'), _f('地祗温元帅圣诞'), _f('雷霆邓天君圣诞')],
        '5-11': [_f('城隍爷圣诞')],
        '5-13': [_f('关圣帝君降神'), _f('关平太子圣诞')],
        '5-18': [_f('张天师圣诞')],
        '5-20': [_f('马祖丹阳真人圣诞')],
        '5-29': [_f('紫青白祖师圣诞')],
        '6-1': [_f('南斗星君下降')],
        '6-2': [_f('南斗星君下降')],
        '6-3': [_f('南斗星君下降')],
        '6-4': [_f('南斗星君下降')],
        '6-5': [_f('南斗星君下降')],
        '6-6': [_f('南斗星君下降')],
        '6-10': [_f('刘海蟾祖师圣诞')],
        '6-15': [_f('灵官王天君圣诞')],
        '6-19': [_f('慈航(观音)成道日')],
        '6-23': [_f('火神圣诞')],
        '6-24': [_f('南极大帝中方雷祖圣诞'), _f('关圣帝君圣诞')],
        '6-26': [_f('二郎真君圣诞')],
        '7-7': [_f('道德腊之辰', '道德腊，此日五帝会于西方七炁素天'), _f('庆生中会', '此日中元赦罪，地官同天水二官考校罪福')],
        '7-12': [_f('西方雷祖圣诞')],
        '7-15': [_f('中元地官大帝圣诞')],
        '7-18': [_f('王母娘娘圣诞')],
        '7-20': [_f('刘祖(刘处玄)长生真人圣诞')],
        '7-22': [_f('财帛星君文财神增福相公李诡祖圣诞')],
        '7-26': [_f('张三丰祖师圣诞')],
        '8-1': [_f('许真君飞升日')],
        '8-3': [_f('九天司命灶君诞')],
        '8-5': [_f('北方雷祖圣诞')],
        '8-10': [_f('北岳大帝诞辰')],
        '8-15': [_f('太阴星君诞')],
        '9-1': [_f('北斗九皇降世之辰')],
        '9-2': [_f('北斗九皇降世之辰')],
        '9-3': [_f('北斗九皇降世之辰')],
        '9-4': [_f('北斗九皇降世之辰')],
        '9-5': [_f('北斗九皇降世之辰')],
        '9-6': [_f('北斗九皇降世之辰')],
        '9-7': [_f('北斗九皇降世之辰')],
        '9-8': [_f('北斗九皇降世之辰')],
        '9-9': [_f('北斗九皇降世之辰'), _f('斗姥元君圣诞'), _f('重阳帝君圣诞'), _f('玄天上帝飞升'), _f('酆都大帝圣诞')],
        '9-22': [_f('增福财神诞')],
        '9-23': [_f('萨翁真君圣诞')],
        '9-28': [_f('五显灵官马元帅圣诞')],
        '10-1': [_f('民岁腊之辰', '民岁腊，此日五帝会于北方五炁黑天'), _f('东皇大帝圣诞')],
        '10-3': [_f('三茅应化真君圣诞')],
        '10-6': [_f('天曹诸司五岳五帝圣诞')],
        '10-15': [_f('下元水官大帝圣诞'), _f('建生大会', '此日下元解厄，水官同天地二官考校罪福')],
        '10-18': [_f('地母娘娘圣诞')],
        '10-19': [_f('长春邱真君飞升')],
        '10-20': [_f('虚靖天师(即三十代天师弘悟张真人)诞')],
        '11-6': [_f('西岳大帝圣诞')],
        '11-9': [_f('湘子韩祖圣诞')],
        '11-11': [_f('太乙救苦天尊圣诞')],
        '11-26': [_f('北方五道圣诞')],
        '12-8': [_f('王侯腊之辰', '王侯腊，此日五帝会于上方玄都玉京')],
        '12-16': [_f('南岳大帝圣诞'), _f('福德正神诞')],
        '12-20': [_f('鲁班先师圣诞')],
        '12-21': [_f('天猷上帝圣诞')],
        '12-22': [_f('重阳祖师圣诞')],
        '12-23': [_f('祭灶王', '最适宜谢旧年太岁，开启拜新年太岁')],
        '12-25': [_f('玉帝巡天'), _f('天神下降')],
        '12-29': [_f('清静孙真君(孙不二)成道')]
      }
    }
  })();
  var NineStarUtil = (function(){
    return {
      NUMBER:[
        '{n.one}',
        '{n.two}',
        '{n.three}',
        '{n.four}',
        '{n.five}',
        '{n.six}',
        '{n.seven}',
        '{n.eight}',
        '{n.nine}'
      ],
      WU_XING:[
        '{wx.shui}',
        '{wx.tu}',
        '{wx.mu}',
        '{wx.mu}',
        '{wx.tu}',
        '{wx.jin}',
        '{wx.jin}',
        '{wx.tu}',
        '{wx.huo}'
      ],
      POSITION:[
        '{bg.kan}',
        '{bg.kun}',
        '{bg.zhen}',
        '{bg.xun}',
        '{ps.center}',
        '{bg.qian}',
        '{bg.dui}',
        '{bg.gen}',
        '{bg.li}'
      ],
      LUCK_XUAN_KONG:[
        '{s.goodLuck}',
        '{s.badLuck}',
        '{s.badLuck}',
        '{s.goodLuck}',
        '{s.badLuck}',
        '{s.goodLuck}',
        '{s.badLuck}',
        '{s.goodLuck}',
        '{s.goodLuck}'
      ],
      YIN_YANG_QI_MEN:[
        '{s.yang}',
        '{s.yin}',
        '{s.yang}',
        '{s.yang}',
        '{s.yang}',
        '{s.yin}',
        '{s.yin}',
        '{s.yang}',
        '{s.yin}'
      ],
      COLOR:[
        '{s.white}',
        '{s.black}',
        '{s.blue}',
        '{s.green}',
        '{s.yellow}',
        '{s.white}',
        '{s.red}',
        '{s.white}',
        '{s.purple}'
      ]
    }
  })();
  var Tao = (function(){
    var _fromYmdHms=function(y,m,d,hour,minute,second){
      return _fromLunar(Lunar.fromYmdHms(y+Tao.BIRTH_YEAR,m,d,hour,minute,second));
    };
    var _fromLunar=function(lunar){
      return {
        _p: {
          lunar: lunar
        },
        getLunar:function(){return this._p.lunar;},
        getYear:function(){
          return this._p.lunar.getYear()-Tao.BIRTH_YEAR;
        },
        getMonth:function(){return this._p.lunar.getMonth();},
        getDay:function(){return this._p.lunar.getDay();},
        getYearInChinese:function(){
          var y = this.getYear()+'';
          var s = '';
          var zero = '0'.charCodeAt(0);
          for(var i=0,j=y.length;i<j;i++){
            s+=LunarUtil.NUMBER[y.charCodeAt(i)-zero];
          }
          return s;
        },
        getMonthInChinese:function(){return this._p.lunar.getMonthInChinese();},
        getDayInChinese:function(){return this._p.lunar.getDayInChinese();},
        getFestivals:function(){
          var l=[];
          var fs=TaoUtil.FESTIVAL[this.getMonth()+'-'+this.getDay()];
          if(fs){
            l=l.concat(fs);
          }
          var jq = this._p.lunar.getJieQi();
          if(I18n.getMessage('jq.dongZhi')===jq){
            l.push(TaoFestival.create('元始天尊圣诞'));
          }else if(I18n.getMessage('jq.xiaZhi')===jq){
            l.push(TaoFestival.create('灵宝天尊圣诞'));
          }
          var f = TaoUtil.BA_JIE[jq];
          if(f){
            l.push(TaoFestival.create(f));
          }
          f = TaoUtil.BA_HUI[this._p.lunar.getDayInGanZhi()];
          if(f){
            l.push(TaoFestival.create(f));
          }
          return l;
        },
        _isDayIn:function(days){
          var md = this.getMonth() + '-' + this.getDay();
          for(var i=0,j=days.length;i<j;i++){
            if(md===days[i]){
              return true;
            }
          }
          return false;
        },
        isDaySanHui:function(){return this._isDayIn(TaoUtil.SAN_HUI);},
        isDaySanYuan:function(){return this._isDayIn(TaoUtil.SAN_YUAN);},
        isDayBaJie:function(){return !!TaoUtil.BA_JIE[this._p.lunar.getJieQi()];},
        isDayWuLa:function(){return this._isDayIn(TaoUtil.WU_LA);},
        isDayBaHui:function(){return !!TaoUtil.BA_HUI[this._p.lunar.getDayInGanZhi()];},
        isDayMingWu:function(){return I18n.getMessage('tg.wu')===this._p.lunar.getDayGan();},
        isDayAnWu:function(){return this._p.lunar.getDayZhi()===TaoUtil.AN_WU[Math.abs(this.getMonth())-1]},
        isDayWu:function(){return this.isDayMingWu()||this.isDayAnWu()},
        isDayTianShe:function(){
          var ret = false;
          var mz = this._p.lunar.getMonthZhi();
          var dgz = this._p.lunar.getDayInGanZhi();
          if ([I18n.getMessage('dz.yin'), I18n.getMessage('dz.mao'), I18n.getMessage('dz.chen')].join(',').indexOf(mz) > -1) {
            if (I18n.getMessage('jz.wuYin') === dgz) {
              ret = true;
            }
          } else if ([I18n.getMessage('dz.si'), I18n.getMessage('dz.wu'), I18n.getMessage('dz.wei')].join(',').indexOf(mz) > -1) {
            if (I18n.getMessage('jz.jiaWu') === dgz) {
              ret = true;
            }
          } else if ([I18n.getMessage('dz.shen'), I18n.getMessage('dz.you'), I18n.getMessage('dz.xu')].join(',').indexOf(mz) > -1) {
            if (I18n.getMessage('jz.wuShen') === dgz) {
              ret = true;
            }
          } else if ([I18n.getMessage('dz.hai'), I18n.getMessage('dz.zi'), I18n.getMessage('dz.chou')].join(',').indexOf(mz) > -1) {
            if (I18n.getMessage('jz.jiaZi') === dgz) {
              ret = true;
            }
          }
          return ret;
        },
        toString:function(){
          return this.getYearInChinese()+'年'+this.getMonthInChinese()+'月'+this.getDayInChinese();
        },
        toFullString:function(){
          return '道歷'+this.getYearInChinese()+'年，天運'+this._p.lunar.getYearInGanZhi()+'年，'+this._p.lunar.getMonthInGanZhi()+'月，'+this._p.lunar.getDayInGanZhi()+'日。'+this.getMonthInChinese()+'月'+this.getDayInChinese()+'日，'+this._p.lunar.getTimeZhi()+'時。';
        }
      };
    };
    return {
      BIRTH_YEAR:-2697,
      fromYmdHms:function(y,m,d,hour,minute,second){return _fromYmdHms(y,m,d,hour,minute,second);},
      fromYmd:function(y,m,d){return _fromYmdHms(y,m,d,0,0,0);},
      fromLunar:function(lunar){return _fromLunar(lunar);}
    };
  })();
  var I18n = (function(){
    var _defaultLang = 'chs';
    var _lang = _defaultLang;
    var _inited = false;
    var _messages = {
      'chs': {
        'tg.jia': '甲',
        'tg.yi': '乙',
        'tg.bing': '丙',
        'tg.ding': '丁',
        'tg.wu': '戊',
        'tg.ji': '己',
        'tg.geng': '庚',
        'tg.xin': '辛',
        'tg.ren': '壬',
        'tg.gui': '癸',
        'dz.zi': '子',
        'dz.chou': '丑',
        'dz.yin': '寅',
        'dz.mao': '卯',
        'dz.chen': '辰',
        'dz.si': '巳',
        'dz.wu': '午',
        'dz.wei': '未',
        'dz.shen': '申',
        'dz.you': '酉',
        'dz.xu': '戌',
        'dz.hai': '亥',
        'zx.jian': '建',
        'zx.chu': '除',
        'zx.man': '满',
        'zx.ping': '平',
        'zx.ding': '定',
        'zx.zhi': '执',
        'zx.po': '破',
        'zx.wei': '危',
        'zx.cheng': '成',
        'zx.shou': '收',
        'zx.kai': '开',
        'zx.bi': '闭',
        'jz.jiaZi': '甲子',
        'jz.yiChou': '乙丑',
        'jz.bingYin': '丙寅',
        'jz.dingMao': '丁卯',
        'jz.wuChen': '戊辰',
        'jz.jiSi': '己巳',
        'jz.gengWu': '庚午',
        'jz.xinWei': '辛未',
        'jz.renShen': '壬申',
        'jz.guiYou': '癸酉',
        'jz.jiaXu': '甲戌',
        'jz.yiHai': '乙亥',
        'jz.bingZi': '丙子',
        'jz.dingChou': '丁丑',
        'jz.wuYin': '戊寅',
        'jz.jiMao': '己卯',
        'jz.gengChen': '庚辰',
        'jz.xinSi': '辛巳',
        'jz.renWu': '壬午',
        'jz.guiWei': '癸未',
        'jz.jiaShen': '甲申',
        'jz.yiYou': '乙酉',
        'jz.bingXu': '丙戌',
        'jz.dingHai': '丁亥',
        'jz.wuZi': '戊子',
        'jz.jiChou': '己丑',
        'jz.gengYin': '庚寅',
        'jz.xinMao': '辛卯',
        'jz.renChen': '壬辰',
        'jz.guiSi': '癸巳',
        'jz.jiaWu': '甲午',
        'jz.yiWei': '乙未',
        'jz.bingShen': '丙申',
        'jz.dingYou': '丁酉',
        'jz.wuXu': '戊戌',
        'jz.jiHai': '己亥',
        'jz.gengZi': '庚子',
        'jz.xinChou': '辛丑',
        'jz.renYin': '壬寅',
        'jz.guiMao': '癸卯',
        'jz.jiaChen': '甲辰',
        'jz.yiSi': '乙巳',
        'jz.bingWu': '丙午',
        'jz.dingWei': '丁未',
        'jz.wuShen': '戊申',
        'jz.jiYou': '己酉',
        'jz.gengXu': '庚戌',
        'jz.xinHai': '辛亥',
        'jz.renZi': '壬子',
        'jz.guiChou': '癸丑',
        'jz.jiaYin': '甲寅',
        'jz.yiMao': '乙卯',
        'jz.bingChen': '丙辰',
        'jz.dingSi': '丁巳',
        'jz.wuWu': '戊午',
        'jz.jiWei': '己未',
        'jz.gengShen': '庚申',
        'jz.xinYou': '辛酉',
        'jz.renXu': '壬戌',
        'jz.guiHai': '癸亥',
        'sx.rat': '鼠',
        'sx.ox': '牛',
        'sx.tiger': '虎',
        'sx.rabbit': '兔',
        'sx.dragon': '龙',
        'sx.snake': '蛇',
        'sx.horse': '马',
        'sx.goat': '羊',
        'sx.monkey': '猴',
        'sx.rooster': '鸡',
        'sx.dog': '狗',
        'sx.pig': '猪',
        'dw.long': '龙',
        'dw.niu': '牛',
        'dw.gou': '狗',
        'dw.yang': '羊',
        'dw.tu': '兔',
        'dw.shu': '鼠',
        'dw.ji': '鸡',
        'dw.ma': '马',
        'dw.hu': '虎',
        'dw.zhu': '猪',
        'dw.hou': '猴',
        'dw.she': '蛇',
        'dw.huLi': '狐',
        'dw.yan': '燕',
        'dw.bao': '豹',
        'dw.yuan': '猿',
        'dw.yin': '蚓',
        'dw.lu': '鹿',
        'dw.wu': '乌',
        'dw.jiao': '蛟',
        'dw.lang': '狼',
        'dw.fu': '蝠',
        'dw.zhang': '獐',
        'dw.xu': '獝',
        'dw.xie': '獬',
        'dw.han': '犴',
        'dw.he': '貉',
        'dw.zhi': '彘',
        'wx.jin': '金',
        'wx.mu': '木',
        'wx.shui': '水',
        'wx.huo': '火',
        'wx.tu': '土',
        'wx.ri': '日',
        'wx.yue': '月',
        'n.zero': '〇',
        'n.one': '一',
        'n.two': '二',
        'n.three': '三',
        'n.four': '四',
        'n.five': '五',
        'n.six': '六',
        'n.seven': '七',
        'n.eight': '八',
        'n.nine': '九',
        'n.ten': '十',
        'n.eleven': '十一',
        'n.twelve': '十二',
        'd.one': '初一',
        'd.two': '初二',
        'd.three': '初三',
        'd.four': '初四',
        'd.five': '初五',
        'd.six': '初六',
        'd.seven': '初七',
        'd.eight': '初八',
        'd.nine': '初九',
        'd.ten': '初十',
        'd.eleven': '十一',
        'd.twelve': '十二',
        'd.thirteen': '十三',
        'd.fourteen': '十四',
        'd.fifteen': '十五',
        'd.sixteen': '十六',
        'd.seventeen': '十七',
        'd.eighteen': '十八',
        'd.nighteen': '十九',
        'd.twenty': '二十',
        'd.twentyOne': '廿一',
        'd.twentyTwo': '廿二',
        'd.twentyThree': '廿三',
        'd.twentyFour': '廿四',
        'd.twentyFive': '廿五',
        'd.twentySix': '廿六',
        'd.twentySeven': '廿七',
        'd.twentyEight': '廿八',
        'd.twentyNine': '廿九',
        'd.thirty': '三十',
        'm.one': '正',
        'm.two': '二',
        'm.three': '三',
        'm.four': '四',
        'm.five': '五',
        'm.six': '六',
        'm.seven': '七',
        'm.eight': '八',
        'm.nine': '九',
        'm.ten': '十',
        'm.eleven': '冬',
        'm.twelve': '腊',
        'w.sun': '日',
        'w.mon': '一',
        'w.tues': '二',
        'w.wed': '三',
        'w.thur': '四',
        'w.fri': '五',
        'w.sat': '六',
        'xz.aries': '白羊',
        'xz.taurus': '金牛',
        'xz.gemini': '双子',
        'xz.cancer': '巨蟹',
        'xz.leo': '狮子',
        'xz.virgo': '处女',
        'xz.libra': '天秤',
        'xz.scorpio': '天蝎',
        'xz.sagittarius': '射手',
        'xz.capricornus': '摩羯',
        'xz.aquarius': '水瓶',
        'xz.pisces': '双鱼',
        'bg.qian': '乾',
        'bg.kun': '坤',
        'bg.zhen': '震',
        'bg.xun': '巽',
        'bg.kan': '坎',
        'bg.li': '离',
        'bg.gen': '艮',
        'bg.dui': '兑',
        'ps.center': '中',
        'ps.dong': '东',
        'ps.nan': '南',
        'ps.xi': '西',
        'ps.bei': '北',
        'ps.zhong': '中宫',
        'ps.zhengDong': '正东',
        'ps.zhengNan': '正南',
        'ps.zhengXi': '正西',
        'ps.zhengBei': '正北',
        'ps.dongBei': '东北',
        'ps.dongNan': '东南',
        'ps.xiBei': '西北',
        'ps.xiNan': '西南',
        'ps.wai': '外',
        'ps.fangNei': '房内',
        'jq.dongZhi': '冬至',
        'jq.xiaoHan': '小寒',
        'jq.daHan': '大寒',
        'jq.liChun': '立春',
        'jq.yuShui': '雨水',
        'jq.jingZhe': '惊蛰',
        'jq.chunFen': '春分',
        'jq.qingMing': '清明',
        'jq.guYu': '谷雨',
        'jq.liXia': '立夏',
        'jq.xiaoMan': '小满',
        'jq.mangZhong': '芒种',
        'jq.xiaZhi': '夏至',
        'jq.xiaoShu': '小暑',
        'jq.daShu': '大暑',
        'jq.liQiu': '立秋',
        'jq.chuShu': '处暑',
        'jq.baiLu': '白露',
        'jq.qiuFen': '秋分',
        'jq.hanLu': '寒露',
        'jq.shuangJiang': '霜降',
        'jq.liDong': '立冬',
        'jq.xiaoXue': '小雪',
        'jq.daXue': '大雪',
        'sn.qingLong': '青龙',
        'sn.baiHu': '白虎',
        'sn.zhuQue': '朱雀',
        'sn.xuanWu': '玄武',
        'sn.mingTang': '明堂',
        'sn.tianXing': '天刑',
        'sn.tianDe': '天德',
        'sn.jinKui': '金匮',
        'sn.yuTang': '玉堂',
        'sn.siMing': '司命',
        'sn.tianLao': '天牢',
        'sn.gouChen': '勾陈',
        'sn.tianEn': '天恩',
        'sn.muCang': '母仓',
        'sn.shiYang': '时阳',
        'sn.shengQi': '生气',
        'sn.yiHou': '益后',
        'sn.zaiSha': '灾煞',
        'sn.tianHuo': '天火',
        'sn.siJi': '四忌',
        'sn.baLong': '八龙',
        'sn.fuRi': '复日',
        'sn.xuShi': '续世',
        'sn.yueSha': '月煞',
        'sn.yueXu': '月虚',
        'sn.xueZhi': '血支',
        'sn.tianZei': '天贼',
        'sn.wuXu': '五虚',
        'sn.tuFu': '土符',
        'sn.guiJi': '归忌',
        'sn.xueJi': '血忌',
        'sn.yueDe': '月德',
        'sn.yueEn': '月恩',
        'sn.siXiang': '四相',
        'sn.wangRi': '王日',
        'sn.tianCang': '天仓',
        'sn.buJiang': '不将',
        'sn.wuHe': '五合',
        'sn.mingFeiDui': '鸣吠对',
        'sn.yueJian': '月建',
        'sn.xiaoShi': '小时',
        'sn.tuHu': '土府',
        'sn.wangWang': '往亡',
        'sn.yaoAn': '要安',
        'sn.siShen': '死神',
        'sn.tianMa': '天马',
        'sn.jiuHu': '九虎',
        'sn.qiNiao': '七鸟',
        'sn.liuShe': '六蛇',
        'sn.guanRi': '官日',
        'sn.jiQi': '吉期',
        'sn.yuYu': '玉宇',
        'sn.daShi': '大时',
        'sn.daBai': '大败',
        'sn.xianChi': '咸池',
        'sn.shouRi': '守日',
        'sn.tianWu': '天巫',
        'sn.fuDe': '福德',
        'sn.liuYi': '六仪',
        'sn.jinTang': '金堂',
        'sn.yanDui': '厌对',
        'sn.zhaoYao': '招摇',
        'sn.jiuKong': '九空',
        'sn.jiuKan': '九坎',
        'sn.jiuJiao': '九焦',
        'sn.xiangRi': '相日',
        'sn.baoGuang': '宝光',
        'sn.tianGang': '天罡',
        'sn.yueXing': '月刑',
        'sn.yueHai': '月害',
        'sn.youHuo': '游祸',
        'sn.chongRi': '重日',
        'sn.shiDe': '时德',
        'sn.minRi': '民日',
        'sn.sanHe': '三合',
        'sn.linRi': '临日',
        'sn.shiYin': '时阴',
        'sn.mingFei': '鸣吠',
        'sn.siQi': '死气',
        'sn.diNang': '地囊',
        'sn.yueDeHe': '月德合',
        'sn.jingAn': '敬安',
        'sn.puHu': '普护',
        'sn.jieShen': '解神',
        'sn.xiaoHao': '小耗',
        'sn.tianDeHe': '天德合',
        'sn.yueKong': '月空',
        'sn.yiMa': '驿马',
        'sn.tianHou': '天后',
        'sn.chuShen': '除神',
        'sn.yuePo': '月破',
        'sn.daHao': '大耗',
        'sn.wuLi': '五离',
        'sn.yinDe': '阴德',
        'sn.fuSheng': '福生',
        'sn.tianLi': '天吏',
        'sn.zhiSi': '致死',
        'sn.yuanWu': '元武',
        'sn.yangDe': '阳德',
        'sn.tianXi': '天喜',
        'sn.tianYi': '天医',
        'sn.yueYan': '月厌',
        'sn.diHuo': '地火',
        'sn.fourHit': '四击',
        'sn.daSha': '大煞',
        'sn.daHui': '大会',
        'sn.tianYuan': '天愿',
        'sn.liuHe': '六合',
        'sn.wuFu': '五富',
        'sn.shengXin': '圣心',
        'sn.heKui': '河魁',
        'sn.jieSha': '劫煞',
        'sn.siQiong': '四穷',
        'sn.chuShuiLong': '触水龙',
        'sn.baFeng': '八风',
        'sn.tianShe': '天赦',
        'sn.wuMu': '五墓',
        'sn.baZhuan': '八专',
        'sn.yinCuo': '阴错',
        'sn.siHao': '四耗',
        'sn.yangCuo': '阳错',
        'sn.siFei': '四废',
        'sn.sanYin': '三阴',
        'sn.xiaoHui': '小会',
        'sn.yinDaoChongYang': '阴道冲阳',
        'sn.danYin': '单阴',
        'sn.guChen': '孤辰',
        'sn.yinWei': '阴位',
        'sn.xingHen': '行狠',
        'sn.liaoLi': '了戾',
        'sn.jueYin': '绝阴',
        'sn.chunYang': '纯阳',
        'sn.suiBo': '岁薄',
        'sn.yinYangJiaoPo': '阴阳交破',
        'sn.yinYangJuCuo': '阴阳俱错',
        'sn.yinYangJiChong': '阴阳击冲',
        'sn.zhuZhen': '逐阵',
        'sn.yangCuoYinChong': '阳错阴冲',
        'sn.qiFu': '七符',
        'sn.tianGou': '天狗',
        'sn.chengRi': '成日',
        'sn.tianFu': '天符',
        'sn.guYang': '孤阳',
        'sn.jueYang': '绝阳',
        'sn.chunYin': '纯阴',
        'sn.yinShen': '阴神',
        'sn.jieChu': '解除',
        'sn.yangPoYinChong': '阳破阴冲',
        'sn.sanSang': '三丧',
        'sn.guiKu': '鬼哭',
        'sn.daTui': '大退',
        'sn.siLi': '四离',
        'ss.biJian': '比肩',
        'ss.jieCai': '劫财',
        'ss.shiShen': '食神',
        'ss.shangGuan': '伤官',
        'ss.pianCai': '偏财',
        'ss.zhengCai': '正财',
        'ss.qiSha': '七杀',
        'ss.zhengGuan': '正官',
        'ss.pianYin': '偏印',
        'ss.zhengYin': '正印',
        's.none': '无',
        's.huangDao': '黄道',
        's.heiDao': '黑道',
        's.goodLuck': '吉',
        's.badLuck': '凶',
        's.yin': '阴',
        's.yang': '阳',
        's.white': '白',
        's.black': '黑',
        's.blue': '碧',
        's.green': '绿',
        's.yellow': '黄',
        's.red': '赤',
        's.purple': '紫',
        'jr.chuXi': '除夕',
        'jr.chunJie': '春节',
        'jr.yuanXiao': '元宵节',
        'jr.longTou': '龙头节',
        'jr.duanWu': '端午节',
        'jr.qiXi': '七夕节',
        'jr.zhongQiu': '中秋节',
        'jr.chongYang': '重阳节',
        'jr.laBa': '腊八节',
        'jr.yuanDan': '元旦节',
        'jr.qingRen': '情人节',
        'jr.fuNv': '妇女节',
        'jr.zhiShu': '植树节',
        'jr.xiaoFei': '消费者权益日',
        'jr.wuYi': '劳动节',
        'jr.qingNian': '青年节',
        'jr.erTong': '儿童节',
        'jr.yuRen': '愚人节',
        'jr.jianDang': '建党节',
        'jr.jianJun': '建军节',
        'jr.jiaoShi': '教师节',
        'jr.guoQing': '国庆节',
        'jr.wanShengYe': '万圣节前夜',
        'jr.wanSheng': '万圣节',
        'jr.pingAn': '平安夜',
        'jr.shengDan': '圣诞节',
        'ds.changSheng': '长生',
        'ds.muYu': '沐浴',
        'ds.guanDai': '冠带',
        'ds.linGuan': '临官',
        'ds.diWang': '帝旺',
        'ds.shuai': '衰',
        'ds.bing': '病',
        'ds.si': '死',
        'ds.mu': '墓',
        'ds.jue': '绝',
        'ds.tai': '胎',
        'ds.yang': '养',
        'h.first': '初候',
        'h.second': '二候',
        'h.third': '三候',
        'h.qiuYinJie': '蚯蚓结',
        'h.miJiao': '麋角解',
        'h.shuiQuan': '水泉动',
        'h.yanBei': '雁北乡',
        'h.queShi': '鹊始巢',
        'h.zhiShi': '雉始雊',
        'h.jiShi': '鸡始乳',
        'h.zhengNiao': '征鸟厉疾',
        'h.shuiZe': '水泽腹坚',
        'h.dongFeng': '东风解冻',
        'h.zheChongShiZhen': '蛰虫始振',
        'h.yuZhi': '鱼陟负冰',
        'h.taJi': '獭祭鱼',
        'h.houYan': '候雁北',
        'h.caoMuMengDong': '草木萌动',
        'h.taoShi': '桃始华',
        'h.cangGeng': '仓庚鸣',
        'h.yingHua': '鹰化为鸠',
        'h.xuanNiaoZhi': '玄鸟至',
        'h.leiNai': '雷乃发声',
        'h.shiDian': '始电',
        'h.tongShi': '桐始华',
        'h.tianShu': '田鼠化为鴽',
        'h.hongShi': '虹始见',
        'h.pingShi': '萍始生',
        'h.mingJiu': '鸣鸠拂其羽',
        'h.daiSheng': '戴胜降于桑',
        'h.louGuo': '蝼蝈鸣',
        'h.qiuYinChu': '蚯蚓出',
        'h.wangGua': '王瓜生',
        'h.kuCai': '苦菜秀',
        'h.miCao': '靡草死',
        'h.maiQiu': '麦秋至',
        'h.tangLang': '螳螂生',
        'h.juShi': '鵙始鸣',
        'h.fanShe': '反舌无声',
        'h.luJia': '鹿角解',
        'h.tiaoShi': '蜩始鸣',
        'h.banXia': '半夏生',
        'h.wenFeng': '温风至',
        'h.xiShuai': '蟋蟀居壁',
        'h.yingShi': '鹰始挚',
        'h.fuCao': '腐草为萤',
        'h.tuRun': '土润溽暑',
        'h.daYu': '大雨行时',
        'h.liangFeng': '凉风至',
        'h.baiLu': '白露降',
        'h.hanChan': '寒蝉鸣',
        'h.yingNai': '鹰乃祭鸟',
        'h.tianDi': '天地始肃',
        'h.heNai': '禾乃登',
        'h.hongYanLai': '鸿雁来',
        'h.xuanNiaoGui': '玄鸟归',
        'h.qunNiao': '群鸟养羞',
        'h.leiShi': '雷始收声',
        'h.zheChongPiHu': '蛰虫坯户',
        'h.shuiShiHe': '水始涸',
        'h.hongYanLaiBin': '鸿雁来宾',
        'h.queRu': '雀入大水为蛤',
        'h.juYou': '菊有黄花',
        'h.caiNai': '豺乃祭兽',
        'h.caoMuHuangLuo': '草木黄落',
        'h.zheChongXianFu': '蛰虫咸俯',
        'h.shuiShiBing': '水始冰',
        'h.diShi': '地始冻',
        'h.zhiRu': '雉入大水为蜃',
        'h.hongCang': '虹藏不见',
        'h.tianQi': '天气上升地气下降',
        'h.biSe': '闭塞而成冬',
        'h.heDan': '鹖鴠不鸣',
        'h.huShi': '虎始交',
        'h.liTing': '荔挺出',
        'ts.zhan': '占',
        'ts.hu': '户',
        'ts.win': '窗',
        'ts.fang': '房',
        'ts.chuang': '床',
        'ts.lu': '炉',
        'ts.zao': '灶',
        'ts.dui': '碓',
        'ts.mo': '磨',
        'ts.xi': '栖',
        'ts.chu': '厨',
        'ts.ce': '厕',
        'ts.cang': '仓',
        'ts.cangKu': '仓库',
        'ts.daMen': '大门',
        'ts.men': '门',
        'ts.tang': '堂',
        'ly.xianSheng': '先胜',
        'ly.xianFu': '先负',
        'ly.youYin': '友引',
        'ly.foMie': '佛灭',
        'ly.daAn': '大安',
        'ly.chiKou': '赤口',
        'yj.jiSi': '祭祀',
        'yj.qiFu': '祈福',
        'yj.qiuSi': '求嗣',
        'yj.kaiGuang': '开光',
        'yj.suHui': '塑绘',
        'yj.qiJiao': '齐醮',
        'yj.zhaiJiao': '斋醮',
        'yj.muYu': '沐浴',
        'yj.chouShen': '酬神',
        'yj.zaoMiao': '造庙',
        'yj.siZhao': '祀灶',
        'yj.fenXiang': '焚香',
        'yj.xieTu': '谢土',
        'yj.chuHuo': '出火',
        'yj.diaoKe': '雕刻',
        'yj.jiaQu': '嫁娶',
        'yj.DingHun': '订婚',
        'yj.naCai': '纳采',
        'yj.wenMing': '问名',
        'yj.naXu': '纳婿',
        'yj.guiNing': '归宁',
        'yj.anChuang': '安床',
        'yj.heZhang': '合帐',
        'yj.guanJi': '冠笄',
        'yj.dingMeng': '订盟',
        'yj.jinRenKou': '进人口',
        'yj.caiYi': '裁衣',
        'yj.wanMian': '挽面',
        'yj.kaiRong': '开容',
        'yj.xiuFen': '修坟',
        'yj.qiZuan': '启钻',
        'yj.poTu': '破土',
        'yj.anZang': '安葬',
        'yj.liBei': '立碑',
        'yj.chengFu': '成服',
        'yj.chuFu': '除服',
        'yj.kaiShengFen': '开生坟',
        'yj.heShouMu': '合寿木',
        'yj.ruLian': '入殓',
        'yj.yiJiu': '移柩',
        'yj.puDu': '普渡',
        'yj.ruZhai': '入宅',
        'yj.anXiang': '安香',
        'yj.anMen': '安门',
        'yj.xiuZao': '修造',
        'yj.qiJi': '起基',
        'yj.dongTu': '动土',
        'yj.shangLiang': '上梁',
        'yj.shuZhu': '竖柱',
        'yj.kaiJing': '开井开池',
        'yj.zuoBei': '作陂放水',
        'yj.chaiXie': '拆卸',
        'yj.poWu': '破屋',
        'yj.huaiYuan': '坏垣',
        'yj.buYuan': '补垣',
        'yj.faMuZuoLiang': '伐木做梁',
        'yj.zuoZhao': '作灶',
        'yj.jieChu': '解除',
        'yj.kaiZhuYan': '开柱眼',
        'yj.chuanPing': '穿屏扇架',
        'yj.gaiWuHeJi': '盖屋合脊',
        'yj.kaiCe': '开厕',
        'yj.zaoCang': '造仓',
        'yj.saiXue': '塞穴',
        'yj.pingZhi': '平治道涂',
        'yj.zaoQiao': '造桥',
        'yj.zuoCe': '作厕',
        'yj.zhuDi': '筑堤',
        'yj.kaiChi': '开池',
        'yj.faMu': '伐木',
        'yj.kaiQu': '开渠',
        'yj.jueJing': '掘井',
        'yj.saoShe': '扫舍',
        'yj.fangShui': '放水',
        'yj.zaoWu': '造屋',
        'yj.heJi': '合脊',
        'yj.zaoChuChou': '造畜稠',
        'yj.xiuMen': '修门',
        'yj.dingSang': '定磉',
        'yj.zuoLiang': '作梁',
        'yj.xiuShi': '修饰垣墙',
        'yj.jiaMa': '架马',
        'yj.kaiShi': '开市',
        'yj.guaBian': '挂匾',
        'yj.naChai': '纳财',
        'yj.qiuCai': '求财',
        'yj.kaiCang': '开仓',
        'yj.maiChe': '买车',
        'yj.zhiChan': '置产',
        'yj.guYong': '雇佣',
        'yj.chuHuoCai': '出货财',
        'yj.anJiXie': '安机械',
        'yj.zaoCheQi': '造车器',
        'yj.jingLuo': '经络',
        'yj.yunNiang': '酝酿',
        'yj.zuoRan': '作染',
        'yj.guZhu': '鼓铸',
        'yj.zaoChuan': '造船',
        'yj.geMi': '割蜜',
        'yj.zaiZhong': '栽种',
        'yj.quYu': '取渔',
        'yj.jieWang': '结网',
        'yj.muYang': '牧养',
        'yj.anDuiWei': '安碓磑',
        'yj.xiYi': '习艺',
        'yj.ruXue': '入学',
        'yj.liFa': '理发',
        'yj.tanBing': '探病',
        'yj.jianGui': '见贵',
        'yj.chengChuan': '乘船',
        'yj.duShui': '渡水',
        'yj.zhenJiu': '针灸',
        'yj.chuXing': '出行',
        'yj.yiXi': '移徙',
        'yj.fenJu': '分居',
        'yj.TiTou': '剃头',
        'yj.zhengShou': '整手足甲',
        'yj.naChu': '纳畜',
        'yj.buZhuo': '捕捉',
        'yj.tianLie': '畋猎',
        'yj.jiaoNiuMa': '教牛马',
        'yj.huiQinYou': '会亲友',
        'yj.fuRen': '赴任',
        'yj.qiuYi': '求医',
        'yj.zhiBing': '治病',
        'yj.ciSong': '词讼',
        'yj.qiJiDongTu': '起基动土',
        'yj.poWuHuaiYuan': '破屋坏垣',
        'yj.gaiWu': '盖屋',
        'yj.zaoCangKu': '造仓库',
        'yj.liQuanJiaoYi': '立券交易',
        'yj.jiaoYi': '交易',
        'yj.liQuan': '立券',
        'yj.anJi': '安机',
        'yj.huiYou': '会友',
        'yj.qiuYiLiaoBing': '求医疗病',
        'yj.zhuShi': '诸事不宜',
        'yj.yuShi': '馀事勿取',
        'yj.xingSang': '行丧',
        'yj.duanYi': '断蚁',
        'yj.guiXiu': '归岫',
        'xx.bi': '毕',
        'xx.yi': '翼',
        'xx.ji': '箕',
        'xx.kui': '奎',
        'xx.gui': '鬼',
        'xx.di': '氐',
        'xx.xu': '虚',
        'xx.wei': '危',
        'xx.zi': '觜',
        'xx.zhen': '轸',
        'xx.dou': '斗',
        'xx.lou': '娄',
        'xx.liu': '柳',
        'xx.fang': '房',
        'xx.xin': '心',
        'xx.shi': '室',
        'xx.can': '参',
        'xx.jiao': '角',
        'xx.niu': '牛',
        'xx.vei': '胃',
        'xx.xing': '星',
        'xx.zhang': '张',
        'xx.tail': '尾',
        'xx.qiang': '壁',
        'xx.jing': '井',
        'xx.kang': '亢',
        'xx.nv': '女',
        'xx.mao': '昴',
        'sz.chun': '春',
        'sz.xia': '夏',
        'sz.qiu': '秋',
        'sz.dong': '冬',
        'od.first': '孟',
        'od.second': '仲',
        'od.third': '季',
        'yx.shuo': '朔',
        'yx.jiShuo': '既朔',
        'yx.eMeiXin': '蛾眉新',
        'yx.eMei': '蛾眉',
        'yx.xi': '夕',
        'yx.shangXian': '上弦',
        'yx.jiuYe': '九夜',
        'yx.night': '宵',
        'yx.jianYingTu': '渐盈凸',
        'yx.xiaoWang': '小望',
        'yx.wang': '望',
        'yx.jiWang': '既望',
        'yx.liDai': '立待',
        'yx.juDai': '居待',
        'yx.qinDai': '寝待',
        'yx.gengDai': '更待',
        'yx.jianKuiTu': '渐亏凸',
        'yx.xiaXian': '下弦',
        'yx.youMing': '有明',
        'yx.eMeiCan': '蛾眉残',
        'yx.can': '残',
        'yx.xiao': '晓',
        'yx.hui': '晦',
        'ny.sangZhe': '桑柘',
        'ny.baiLa': '白蜡',
        'ny.yangLiu': '杨柳',
        'ny.jinBo': '金箔',
        'ny.haiZhong': '海中',
        'ny.daHai': '大海',
        'ny.shaZhong': '沙中',
        'ny.luZhong': '炉中',
        'ny.shanXia': '山下',
        'ny.daLin': '大林',
        'ny.pingDi': '平地',
        'ny.luPang': '路旁',
        'ny.biShang': '壁上',
        'ny.jianFeng': '剑锋',
        'ny.shanTou': '山头',
        'ny.fuDeng': '覆灯',
        'ny.jianXia': '涧下',
        'ny.tianHe': '天河',
        'ny.chengTou': '城头',
        'ny.daYi': '大驿',
        'ny.chaiChuan': '钗钏',
        'ny.quanZhong': '泉中',
        'ny.daXi': '大溪',
        'ny.wuShang': '屋上',
        'ny.piLi': '霹雳',
        'ny.tianShang': '天上',
        'ny.songBo': '松柏',
        'ny.shiLiu': '石榴',
        'ny.changLiu': '长流'
      },
      'en': {
        'tg.jia': 'Jia',
        'tg.yi': 'Yi',
        'tg.bing': 'Bing',
        'tg.ding': 'Ding',
        'tg.wu': 'Wu',
        'tg.ji': 'Ji',
        'tg.geng': 'Geng',
        'tg.xin': 'Xin',
        'tg.ren': 'Ren',
        'tg.gui': 'Gui',
        'dz.zi': 'Zi',
        'dz.chou': 'Chou',
        'dz.yin': 'Yin',
        'dz.mao': 'Mao',
        'dz.chen': 'Chen',
        'dz.si': 'Si',
        'dz.wu': 'Wu',
        'dz.wei': 'Wei',
        'dz.shen': 'Shen',
        'dz.you': 'You',
        'dz.xu': 'Xu',
        'dz.hai': 'Hai',
        'zx.jian': 'Build',
        'zx.chu': 'Remove',
        'zx.man': 'Full',
        'zx.ping': 'Flat',
        'zx.ding': 'Stable',
        'zx.zhi': 'Hold',
        'zx.po': 'Break',
        'zx.wei': 'Danger',
        'zx.cheng': 'Complete',
        'zx.shou': 'Collect',
        'zx.kai': 'Open',
        'zx.bi': 'Close',
        'jz.jiaZi': 'JiaZi',
        'jz.yiChou': 'YiChou',
        'jz.bingYin': 'BingYin',
        'jz.dingMao': 'DingMao',
        'jz.wuChen': 'WuChen',
        'jz.jiSi': 'JiSi',
        'jz.gengWu': 'GengWu',
        'jz.xinWei': 'XinWei',
        'jz.renShen': 'RenShen',
        'jz.guiYou': 'GuiYou',
        'jz.jiaXu': 'JiaXu',
        'jz.yiHai': 'YiHai',
        'jz.bingZi': 'BingZi',
        'jz.dingChou': 'DingChou',
        'jz.wuYin': 'WuYin',
        'jz.jiMao': 'JiMao',
        'jz.gengChen': 'GengChen',
        'jz.xinSi': 'XinSi',
        'jz.renWu': 'RenWu',
        'jz.guiWei': 'GuiWei',
        'jz.jiaShen': 'JiaShen',
        'jz.yiYou': 'YiYou',
        'jz.bingXu': 'BingXu',
        'jz.dingHai': 'DingHai',
        'jz.wuZi': 'WuZi',
        'jz.jiChou': 'JiChou',
        'jz.gengYin': 'GengYin',
        'jz.xinMao': 'XinMao',
        'jz.renChen': 'RenChen',
        'jz.guiSi': 'GuiSi',
        'jz.jiaWu': 'JiaWu',
        'jz.yiWei': 'YiWei',
        'jz.bingShen': 'BingShen',
        'jz.dingYou': 'DingYou',
        'jz.wuXu': 'WuXu',
        'jz.jiHai': 'JiHai',
        'jz.gengZi': 'GengZi',
        'jz.xinChou': 'XinChou',
        'jz.renYin': 'RenYin',
        'jz.guiMao': 'GuiMao',
        'jz.jiaChen': 'JiaChen',
        'jz.yiSi': 'YiSi',
        'jz.bingWu': 'BingWu',
        'jz.dingWei': 'DingWei',
        'jz.wuShen': 'WuShen',
        'jz.jiYou': 'JiYou',
        'jz.gengXu': 'GengXu',
        'jz.xinHai': 'XinHai',
        'jz.renZi': 'RenZi',
        'jz.guiChou': 'GuiChou',
        'jz.jiaYin': 'JiaYin',
        'jz.yiMao': 'YiMao',
        'jz.bingChen': 'BingChen',
        'jz.dingSi': 'DingSi',
        'jz.wuWu': 'WuWu',
        'jz.jiWei': 'JiWei',
        'jz.gengShen': 'GengShen',
        'jz.xinYou': 'XinYou',
        'jz.renXu': 'RenXu',
        'jz.guiHai': 'GuiHai',
        'sx.rat': 'Rat',
        'sx.ox': 'Ox',
        'sx.tiger': 'Tiger',
        'sx.rabbit': 'Rabbit',
        'sx.dragon': 'Dragon',
        'sx.snake': 'Snake',
        'sx.horse': 'Horse',
        'sx.goat': 'Goat',
        'sx.monkey': 'Monkey',
        'sx.rooster': 'Rooster',
        'sx.dog': 'Dog',
        'sx.pig': 'Pig',
        'dw.long': 'Dragon',
        'dw.niu': 'Ox',
        'dw.gou': 'Dog',
        'dw.yang': 'Goat',
        'dw.tu': 'Rabbit',
        'dw.shu': 'Rat',
        'dw.ji': 'Rooster',
        'dw.ma': 'Horse',
        'dw.hu': 'Tiger',
        'dw.zhu': 'Pig',
        'dw.hou': 'Monkey',
        'dw.she': 'Snake',
        'dw.huLi': 'Fox',
        'dw.yan': 'Swallow',
        'dw.bao': 'Leopard',
        'dw.yuan': 'Ape',
        'dw.yin': 'Earthworm',
        'dw.lu': 'Deer',
        'dw.wu': 'Crow',
        'dw.lang': 'Wolf',
        'dw.fu': 'Bat',
        'wx.jin': 'Metal',
        'wx.mu': 'Wood',
        'wx.shui': 'Water',
        'wx.huo': 'Fire',
        'wx.tu': 'Earth',
        'wx.ri': 'Sun',
        'wx.yue': 'Moon',
        'n.zero': '0',
        'n.one': '1',
        'n.two': '2',
        'n.three': '3',
        'n.four': '4',
        'n.five': '5',
        'n.six': '6',
        'n.seven': '7',
        'n.eight': '8',
        'n.nine': '9',
        'n.ten': '10',
        'n.eleven': '11',
        'n.twelve': '12',
        'w.sun': 'Sunday',
        'w.mon': 'Monday',
        'w.tues': 'Tuesday',
        'w.wed': 'Wednesday',
        'w.thur': 'Thursday',
        'w.fri': 'Friday',
        'w.sat': 'Saturday',
        'xz.aries': 'Aries',
        'xz.taurus': 'Taurus',
        'xz.gemini': 'Gemini',
        'xz.cancer': 'Cancer',
        'xz.leo': 'Leo',
        'xz.virgo': 'Virgo',
        'xz.libra': 'Libra',
        'xz.scorpio': 'Scorpio',
        'xz.sagittarius': 'Sagittarius',
        'xz.capricornus': 'Capricornus',
        'xz.aquarius': 'Aquarius',
        'xz.pisces': 'Pisces',
        'bg.qian': 'Qian',
        'bg.kun': 'Kun',
        'bg.zhen': 'Zhen',
        'bg.xun': 'Xun',
        'bg.kan': 'Kan',
        'bg.li': 'Li',
        'bg.gen': 'Gen',
        'bg.dui': 'Dui',
        'ps.center': 'Center',
        'ps.dong': 'East',
        'ps.nan': 'South',
        'ps.xi': 'West',
        'ps.bei': 'North',
        'ps.zhong': 'Center',
        'ps.zhengDong': 'East',
        'ps.zhengNan': 'South',
        'ps.zhengXi': 'West',
        'ps.zhengBei': 'North',
        'ps.dongBei': 'Northeast',
        'ps.dongNan': 'Southeast',
        'ps.xiBei': 'Northwest',
        'ps.xiNan': 'Southwest',
        'jq.dongZhi': 'Winter Solstice',
        'jq.xiaoHan': 'Lesser Cold',
        'jq.daHan': 'Great Cold',
        'jq.liChun': 'Spring Beginning',
        'jq.yuShui': 'Rain Water',
        'jq.jingZhe': 'Awakening from Hibernation',
        'jq.chunFen': 'Spring Equinox',
        'jq.qingMing': 'Fresh Green',
        'jq.guYu': 'Grain Rain',
        'jq.liXia': 'Beginning of Summer',
        'jq.xiaoMan': 'Lesser Fullness',
        'jq.mangZhong': 'Grain in Ear',
        'jq.xiaZhi': 'Summer Solstice',
        'jq.xiaoShu': 'Lesser Heat',
        'jq.daShu': 'Greater Heat',
        'jq.liQiu': 'Beginning of Autumn',
        'jq.chuShu': 'End of Heat',
        'jq.baiLu': 'White Dew',
        'jq.qiuFen': 'Autumnal Equinox',
        'jq.hanLu': 'Cold Dew',
        'jq.shuangJiang': 'First Frost',
        'jq.liDong': 'Beginning of Winter',
        'jq.xiaoXue': 'Light Snow',
        'jq.daXue': 'Heavy Snow',
        'sn.qingLong': 'Azure Dragon',
        'sn.baiHu': 'White Tiger',
        'sn.zhuQue': 'Rosefinch',
        'sn.xuanWu': 'Black Tortoise',
        'sn.tianEn': 'Serene Grace',
        'sn.siShen': 'Death',
        'sn.tianMa': 'Pegasus',
        'sn.baLong': 'Eight Dragon',
        'sn.jiuHu': 'Nine Tiger',
        'sn.qiNiao': 'Seven Bird',
        'sn.liuShe': 'Six Snake',
        's.none': 'None',
        's.goodLuck': 'Good luck',
        's.badLuck': 'Bad luck',
        's.yin': 'Yin',
        's.yang': 'Yang',
        's.white': 'White',
        's.black': 'Black',
        's.blue': 'Blue',
        's.green': 'Green',
        's.yellow': 'Yellow',
        's.red': 'Red',
        's.purple': 'Purple',
        'jr.chuXi': 'Chinese New Year\'s Eve',
        'jr.chunJie': 'Luna New Year',
        'jr.yuanXiao': 'Lantern Festival',
        'jr.duanWu': 'Dragon Boat Festival',
        'jr.qiXi': 'Begging Festival',
        'jr.zhongQiu': 'Mid-Autumn Festival',
        'jr.laBa': 'Laba Festival',
        'jr.yuanDan': 'New Year\'s Day',
        'jr.qingRen': 'Valentine\'s Day',
        'jr.fuNv': 'Women\'s Day',
        'jr.xiaoFei': 'Consumer Rights Day',
        'jr.zhiShu': 'Arbor Day',
        'jr.wuYi': 'International Worker\'s Day',
        'jr.erTong': 'Children\'s Day',
        'jr.qingNian': 'Youth Day',
        'jr.yuRen': 'April Fools\' Day',
        'jr.jianDang': 'Party\'s Day',
        'jr.jianJun': 'Army Day',
        'jr.jiaoShi': 'Teachers\' Day',
        'jr.guoQing': 'National Day',
        'jr.wanShengYe': 'All Saints\' Eve',
        'jr.wanSheng': 'All Saints\' Day',
        'jr.pingAn': 'Christmas Eve',
        'jr.shengDan': 'Christmas Day',
        'ts.zhan': 'At',
        'ts.hu': 'Household',
        'ts.zao': 'Cooker',
        'ts.dui': 'Pestle',
        'ts.xi': 'Habitat',
        'ts.win': 'Window',
        'ts.fang': 'Room',
        'ts.chuang': 'Bed',
        'ts.lu': 'Stove',
        'ts.mo': 'Mill',
        'ts.chu': 'Kitchen',
        'ts.ce': 'Toilet',
        'ts.cang': 'Depot',
        'ts.cangKu': 'Depot',
        'ts.daMen': 'Gate',
        'ts.men': 'Door',
        'ts.tang': 'Hall',
        'ly.xianSheng': 'Win first',
        'ly.xianFu': 'Lose first',
        'ly.youYin': 'Friend\'s referral',
        'ly.foMie': 'Buddhism\'s demise',
        'ly.daAn': 'Great safety',
        'ly.chiKou': 'Chikagoro',
        'yj.jiSi': 'Sacrifice',
        'yj.qiFu': 'Pray',
        'yj.qiuSi': 'Seek heirs',
        'yj.kaiGuang': 'Consecretion',
        'yj.suHui': 'Paint sculptural',
        'yj.qiJiao': 'Build altar',
        'yj.zhaiJiao': 'Taoist rites',
        'yj.muYu': 'Bathing',
        'yj.chouShen': 'Reward gods',
        'yj.zaoMiao': 'Build temple',
        'yj.siZhao': 'Offer kitchen god',
        'yj.fenXiang': 'Burn incense',
        'yj.xieTu': 'Earth gratitude',
        'yj.chuHuo': 'Expel the flame',
        'yj.diaoKe': 'Carving',
        'yj.jiaQu': 'Marriage',
        'yj.DingHun': 'Engagement',
        'yj.naCai': 'Proposing',
        'yj.wenMing': 'Ask name',
        'yj.naXu': 'Uxorilocal marriage',
        'yj.guiNing': 'Visit parents',
        'yj.anChuang': 'Bed placing',
        'yj.heZhang': 'Make up accounts',
        'yj.guanJi': 'Crowning adulthood',
        'yj.dingMeng': 'Make alliance',
        'yj.jinRenKou': 'Adopt',
        'yj.caiYi': 'Dressmaking',
        'yj.wanMian': 'Cosmeticsurgery',
        'yj.kaiRong': 'Open face',
        'yj.xiuFen': 'Grave repair',
        'yj.qiZuan': 'Open coffin',
        'yj.poTu': 'Break earth',
        'yj.anZang': 'Burial',
        'yj.liBei': 'Tombstone erecting',
        'yj.chengFu': 'Formation of clothes',
        'yj.chuFu': 'Mourning clothes removal',
        'yj.kaiShengFen': 'Open grave',
        'yj.heShouMu': 'Make coffin',
        'yj.ruLian': 'Body placing',
        'yj.yiJiu': 'Move coffin',
        'yj.puDu': 'Save soul',
        'yj.ruZhai': 'Enter house',
        'yj.anXiang': 'Incenst placement',
        'yj.anMen': 'Door placing',
        'yj.xiuZao': 'Repair',
        'yj.qiJi': 'Digging',
        'yj.dongTu': 'Break ground',
        'yj.shangLiang': 'Beam placing',
        'yj.shuZhu': 'Erecting pillars',
        'yj.kaiJing': 'Open pond and well',
        'yj.zuoBei': 'Make pond and fill water',
        'yj.chaiXie': 'Smash house',
        'yj.poWu': 'Break house',
        'yj.huaiYuan': 'Demolish',
        'yj.buYuan': 'Mending',
        'yj.faMuZuoLiang': 'Make beams',
        'yj.zuoZhao': 'Make stove',
        'yj.jieChu': 'Removal',
        'yj.kaiZhuYan': 'Build beam',
        'yj.chuanPing': 'Build door',
        'yj.gaiWuHeJi': 'Cover house',
        'yj.kaiCe': 'Open toilet',
        'yj.zaoCang': 'Build depot',
        'yj.saiXue': 'Block nest',
        'yj.pingZhi': 'Repair roads',
        'yj.zaoQiao': 'Build bridge',
        'yj.zuoCe': 'Build toilet',
        'yj.zhuDi': 'Fill',
        'yj.kaiChi': 'Open pond',
        'yj.faMu': 'Lumbering',
        'yj.kaiQu': 'Canalization',
        'yj.jueJing': 'Dig well',
        'yj.saoShe': 'Sweep house',
        'yj.fangShui': 'Drainage',
        'yj.zaoWu': 'Build house',
        'yj.heJi': 'Close ridge',
        'yj.zaoChuChou': 'Livestock thickening',
        'yj.xiuMen': 'Repair door',
        'yj.dingSang': 'Fix stone',
        'yj.zuoLiang': 'Beam construction',
        'yj.xiuShi': 'Decorate wall',
        'yj.jiaMa': 'Erect horse',
        'yj.kaiShi': 'Opening',
        'yj.guaBian': 'Hang plaque',
        'yj.naChai': 'Accept wealth',
        'yj.qiuCai': 'Seek wealth',
        'yj.kaiCang': 'Open depot',
        'yj.maiChe': 'Buy car',
        'yj.zhiChan': 'Buy property',
        'yj.guYong': 'Hire',
        'yj.chuHuoCai': 'Delivery',
        'yj.anJiXie': 'Build machine',
        'yj.zaoCheQi': 'Build car',
        'yj.jingLuo': 'Build loom',
        'yj.yunNiang': 'Brew',
        'yj.zuoRan': 'Dye',
        'yj.guZhu': 'Cast',
        'yj.zaoChuan': 'Build boat',
        'yj.geMi': 'Harvest honey',
        'yj.zaiZhong': 'Farming',
        'yj.quYu': 'Fishing',
        'yj.jieWang': 'Netting',
        'yj.muYang': 'Graze',
        'yj.anDuiWei': 'Build rub',
        'yj.xiYi': 'Learn',
        'yj.ruXue': 'Enter school',
        'yj.liFa': 'Haircut',
        'yj.tanBing': 'Visiting',
        'yj.jianGui': 'Meet noble',
        'yj.chengChuan': 'Ride boat',
        'yj.duShui': 'Cross water',
        'yj.zhenJiu': 'Acupuncture',
        'yj.chuXing': 'Travel',
        'yj.yiXi': 'Move',
        'yj.fenJu': 'Live apart',
        'yj.TiTou': 'Shave',
        'yj.zhengShou': 'Manicure',
        'yj.naChu': 'Feed livestock',
        'yj.buZhuo': 'Catch',
        'yj.tianLie': 'Hunt',
        'yj.jiaoNiuMa': 'Train horse',
        'yj.huiQinYou': 'Meet friends',
        'yj.fuRen': 'Go post',
        'yj.qiuYi': 'See doctor',
        'yj.zhiBing': 'Treat',
        'yj.ciSong': 'Litigation',
        'yj.qiJiDongTu': 'Lay foundation',
        'yj.poWuHuaiYuan': 'Demolish',
        'yj.gaiWu': 'Build house',
        'yj.zaoCangKu': 'Build depot',
        'yj.liQuanJiaoYi': 'Covenant trade',
        'yj.jiaoYi': 'Trade',
        'yj.liQuan': 'Covenant',
        'yj.anJi': 'Install machine',
        'yj.huiYou': 'Meet friends',
        'yj.qiuYiLiaoBing': 'Seek treatment',
        'yj.zhuShi': 'Everything Sucks',
        'yj.yuShi': 'Do nothing else',
        'yj.xingSang': 'Funeral',
        'yj.duanYi': 'Block ant hole',
        'yj.guiXiu': 'Place beam',
        'xx.bi': 'Finish',
        'xx.yi': 'Wing',
        'xx.ji': 'Sieve',
        'xx.kui': 'Qui',
        'xx.gui': 'Ghost',
        'xx.di': 'Foundation',
        'xx.xu': 'Virtual',
        'xx.wei': 'Danger',
        'xx.zi': 'Mouth',
        'xx.zhen': 'Cross-bar',
        'xx.dou': 'Fight',
        'xx.lou': 'Weak',
        'xx.liu': 'Willow',
        'xx.fang': 'House',
        'xx.xin': 'Heart',
        'xx.shi': 'Room',
        'xx.can': 'Join',
        'xx.jiao': 'Horn',
        'xx.niu': 'Ox',
        'xx.vei': 'Stomach',
        'xx.xing': 'Star',
        'xx.zhang': 'Chang',
        'xx.tail': 'Tail',
        'xx.qiang': 'Wall',
        'xx.jing': 'Well',
        'xx.kang': 'Kang',
        'xx.nv': 'Female',
        'xx.mao': 'Mao',
        'sz.chun': 'Spring',
        'sz.xia': 'Summer',
        'sz.qiu': 'Autumn',
        'sz.dong': 'Winter',
        'yx.shuo': 'New',
        'yx.eMeiXin': 'New waxing',
        'yx.eMei': 'Waxing',
        'yx.xi': 'Evening',
        'yx.shangXian': 'First quarter',
        'yx.jiuYe': 'Nine night',
        'yx.night': 'Night',
        'yx.jianYingTu': 'Gibbous',
        'yx.xiaoWang': 'Little full',
        'yx.wang': 'Full',
        'yx.jianKuiTu': 'Disseminating',
        'yx.xiaXian': 'Third quarter',
        'yx.eMeiCan': 'Waning waxing',
        'yx.can': 'Waning',
        'yx.xiao': 'Daybreak',
        'yx.hui': 'Obscure',
        'ny.sangZhe': 'Cudrania',
        'ny.baiLa': 'Wax',
        'ny.yangLiu': 'Willow',
        'ny.jinBo': 'Foil',
        'ny.haiZhong': 'Sea',
        'ny.daHai': 'Ocean',
        'ny.shaZhong': 'Sand',
        'ny.luZhong': 'Stove',
        'ny.shanXia': 'Piedmont',
        'ny.daLin': 'Forest',
        'ny.pingDi': 'Land',
        'ny.luPang': 'Roadside',
        'ny.biShang': 'Wall',
        'ny.jianFeng': 'Blade',
        'ny.shanTou': 'Hilltop',
        'ny.fuDeng': 'Light',
        'ny.jianXia': 'Valleyn',
        'ny.tianHe': 'River',
        'ny.chengTou': 'City',
        'ny.daYi': 'Post',
        'ny.chaiChuan': 'Ornaments',
        'ny.quanZhong': 'Spring',
        'ny.daXi': 'Stream',
        'ny.wuShang': 'Roof',
        'ny.piLi': 'Thunderbolt',
        'ny.tianShang': 'Sky',
        'ny.songBo': 'Coniferin',
        'ny.shiLiu': 'Pomegranate',
        'ny.changLiu': 'Flows'
      }
    };

    var _objs = {
      'LunarUtil': LunarUtil,
      'SolarUtil': SolarUtil,
      'TaoUtil': TaoUtil,
      'FotoUtil': FotoUtil,
      'NineStarUtil': NineStarUtil
    };
    var _dictString = {
      'LunarUtil': {
        'TIAN_SHEN_TYPE': {},
        'TIAN_SHEN_TYPE_LUCK': {},
        'XIU_LUCK': {},
        'LU': {},
        'XIU': {},
        'SHA': {},
        'POSITION_DESC': {},
        'NAYIN': {},
        'WU_XING_GAN': {},
        'WU_XING_ZHI': {},
        'SHOU': {},
        'GONG': {},
        'FESTIVAL': {},
        'ZHENG': {},
        'ANIMAL': {},
        'SHI_SHEN': {},
        'XIU_SONG': {}
      },
      'SolarUtil': {
        'FESTIVAL': {}
      },
      'TaoUtil': {
        'BA_HUI': {},
        'BA_JIE': {}
      }
    };
    var _dictNumber = {
      'LunarUtil': {
        'ZHI_TIAN_SHEN_OFFSET': {},
        'CHANG_SHENG_OFFSET': {}
      }
    };
    var _dictArray = {
      'LunarUtil': {
        'ZHI_HIDE_GAN': {}
      }
    };
    var _arrays = {
      'LunarUtil': {
        'GAN': [],
        'ZHI': [],
        'JIA_ZI': [],
        'ZHI_XING': [],
        'XUN': [],
        'XUN_KONG': [],
        'CHONG': [],
        'CHONG_GAN': [],
        'CHONG_GAN_TIE': [],
        'HE_GAN_5': [],
        'HE_ZHI_6': [],
        'SHENGXIAO': [],
        'NUMBER': [],
        'POSITION_XI': [],
        'POSITION_YANG_GUI': [],
        'POSITION_YIN_GUI': [],
        'POSITION_FU': [],
        'POSITION_FU_2': [],
        'POSITION_CAI': [],
        'POSITION_TAI_SUI_YEAR': [],
        'POSITION_GAN': [],
        'POSITION_ZHI': [],
        'JIE_QI': [],
        'JIE_QI_IN_USE': [],
        'TIAN_SHEN': [],
        'SHEN_SHA': [],
        'PENGZU_GAN': [],
        'PENGZU_ZHI': [],
        'MONTH_ZHI': [],
        'CHANG_SHENG': [],
        'HOU': [],
        'WU_HOU': [],
        'POSITION_TAI_DAY': [],
        'POSITION_TAI_MONTH': [],
        'YI_JI': [],
        'LIU_YAO': [],
        'MONTH': [],
        'SEASON': [],
        'DAY': [],
        'YUE_XIANG': []
      },
      'SolarUtil': {
        'WEEK': [],
        'XINGZUO': []
      },
      'TaoUtil': {
        'AN_WU': []
      },
      'FotoUtil': {
        'XIU_27': []
      },
      'NineStarUtil': {
        'NUMBER': [],
        'WU_XING': [],
        'POSITION': [],
        'LUCK_XUAN_KONG': [],
        'YIN_YANG_QI_MEN': [],
        'COLOR': []
      }
    };

    var _updateArray = function(c) {
      var v = _arrays[c];
      var o = _objs[c];
      for (var k in v) {
        var arr = v[k];
        for (var i = 0, j = arr.length; i < j; i++) {
          o[k][i] = arr[i].replace(/{(.[^}]*)}/g, function($0, $1) {
            return _getMessage($1);
          });
        }
      }
    };

    var _updateStringDictionary = function(c) {
      var v = _dictString[c];
      var o = _objs[c];
      for (var k in v) {
        var dict = v[k];
        for (var key in dict){
          var i = key.replace(/{(.[^}]*)}/g, function($0, $1) {
            return _getMessage($1);
          });
          o[k][i] = dict[key].replace(/{(.[^}]*)}/g, function($0, $1) {
            return _getMessage($1);
          });
        }
      }
    };

    var _updateNumberDictionary = function(c) {
      var v = _dictNumber[c];
      var o = _objs[c];
      for (var k in v) {
        var dict = v[k];
        for (var key in dict){
          var i = key.replace(/{(.[^}]*)}/g, function($0, $1) {
            return _getMessage($1);
          });
          o[k][i] = dict[key];
        }
      }
    };

    var _updateArrayDictionary = function(c) {
      var v = _dictArray[c];
      var o = _objs[c];
      for (var k in v) {
        var dict = v[k];
        for (var key in dict){
          var x = key.replace(/{(.[^}]*)}/g, function($0, $1) {
            return _getMessage($1);
          });
          var arr = dict[key];
          for (var i = 0, j = arr.length; i < j; i++) {
            arr[i] = arr[i].replace(/{(.[^}]*)}/g, function($0, $1) {
              return _getMessage($1);
            });
          }
          o[k][x] = arr;
        }
      }
    };

    var _update = function() {
      var c;
      for (c in _arrays) {
        _updateArray(c);
      }
      for (c in _dictString) {
        _updateStringDictionary(c);
      }
      for (c in _dictNumber) {
        _updateNumberDictionary(c);
      }
      for (c in _dictArray) {
        _updateArrayDictionary(c);
      }
    };

    var _setLanguage = function(lang) {
      if (_messages[lang]) {
        _lang = lang;
        _update();
      }
    };

    var _getLanguage = function() {
      return _lang;
    };

    var _setMessages = function(lang, messages) {
      if (!messages) {
        return;
      }
      if (!_messages[lang]) {
        _messages[lang] = {};
      }
      for (var key in messages) {
        _messages[lang][key] = messages[key];
      }
      _update();
    };

    var _getMessage = function(key) {
      var s = _messages[_lang][key];
      if (undefined === s) {
        s = _messages[_defaultLang][key];
      }
      if (undefined === s) {
        s = key;
      }
      return s;
    };

    var _initArray = function(c) {
      var v = _arrays[c];
      var o = _objs[c];
      for (var k in v) {
        v[k].length = 0;
        var arr = o[k];
        for (var i = 0, j = arr.length; i < j; i++) {
          v[k].push(arr[i]);
        }
      }
    };

    var _initDictionary = function(c, type) {
      var v;
      switch(type){
        case 'string':
          v = _dictString[c];
          break;
        case 'number':
          v = _dictNumber[c];
          break;
        case 'array':
          v = _dictArray[c];
          break;
        default:
      }
      var o = _objs[c];
      for (var k in v) {
        var dict = o[k];
        for (var key in dict) {
          v[k][key] = dict[key];
        }
      }
    };

    var _init = function() {
      if (_inited) {
        return;
      }
      _inited = true;
      var c;
      for (c in _arrays) {
        _initArray(c);
      }
      for (c in _dictString) {
        _initDictionary(c, 'string');
      }
      for (c in _dictNumber) {
        _initDictionary(c, 'number');
      }
      for (c in _dictArray) {
        _initDictionary(c, 'array');
      }
      _setLanguage(_defaultLang);
    };
    _init();
    return {
      getLanguage:function(){return _getLanguage();},
      setLanguage:function(lang){_setLanguage(lang);},
      getMessage:function(key){return _getMessage(key);},
      setMessages:function(lang,messages){_setMessages(lang,messages);}
    };
  })();
  return {
    ShouXingUtil:ShouXingUtil,
    SolarUtil:SolarUtil,
    LunarUtil:LunarUtil,
    FotoUtil:FotoUtil,
    TaoUtil:TaoUtil,
    NineStarUtil:NineStarUtil,
    Solar:Solar,
    Lunar:Lunar,
    Foto:Foto,
    Tao:Tao,
    NineStar:NineStar,
    EightChar:EightChar,
    SolarWeek:SolarWeek,
    SolarMonth:SolarMonth,
    SolarSeason:SolarSeason,
    SolarHalfYear:SolarHalfYear,
    SolarYear:SolarYear,
    LunarMonth:LunarMonth,
    LunarYear:LunarYear,
    LunarTime:LunarTime,
    HolidayUtil:HolidayUtil,
    I18n: I18n
  };
});

};

var __cache = {};
function __require(fromRel) {
  return function (spec) {
    if (spec === 'node:fs') return __fsShim;
    if (spec === 'node:path') return __pathShim;
    if (spec === 'node:crypto') return __cryptoShim;
    var target = __resolve(fromRel, spec);
    if (__cache[target]) return __cache[target].exports;
    var module = { exports: {} };
    __cache[target] = module;
    var dir = target.indexOf('/') >= 0 ? target.slice(0, target.lastIndexOf('/')) : '.';
    __modules[target](module, module.exports, __require(target), target, dir);
    return module.exports;
  };
}
function __resolve(fromRel, spec) {
  if (spec.startsWith('node:')) return spec;
  var base = spec.endsWith('.js') ? spec : spec + '.js';
  var dir = fromRel.indexOf('/') >= 0 ? fromRel.slice(0, fromRel.lastIndexOf('/')) : '.';
  var seg = (dir ? dir + '/' : '') + base;
  var out = [];
  seg.split('/').forEach(function (s) {
    if (s === '..') out.pop();
    else if (s !== '.') out.push(s);
  });
  var p = out.join('/');
  if (!__modules[p]) throw new Error('bundle 缺少模块: ' + spec + ' (来自 ' + fromRel + ')');
  return p;
}
var __pathShim = {
  join: function () { var seg = Array.prototype.slice.call(arguments); var out = []; seg.forEach(function (s) { String(s).split(/[\\/]+/).forEach(function (p) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }); }); return out.join('/'); },
  dirname: function (p) { var i = p.lastIndexOf('/'); return i > 0 ? p.slice(0, i) : '.'; },
  basename: function (p) { return String(p).split('/').pop(); },
  normalize: function (p) { return __pathShim.join(p); }
};
var __REGION_FILE = /china-regions\.json$/;
var __fsShim = {
  readFileSync: function (p) {
    if (__REGION_FILE.test(String(p))) return "{\"meta\":{\"source\":\"阿里 DataV.GeoAtlas areas_v3 行政区划质心\",\"sourceUrl\":\"https://geo.datav.aliyun.com/areas_v3/bound\",\"fetchedAt\":\"2026-11-06T10:00:15.484Z\",\"provinces\":33,\"cities\":335,\"districts\":2840,\"failures\":35,\"taiwan\":\"台湾县市坐标为公开常识数据补充（DataV 无 710000 数据）\"},\"regions\":[{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"安庆市\",\"lng\":117.043551,\"lat\":30.50883,\"adcode\":340800,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"大观区\",\"lng\":117.034512,\"lat\":30.505632,\"adcode\":340803,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"怀宁县\",\"lng\":116.828664,\"lat\":30.734994,\"adcode\":340822,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"潜山市\",\"lng\":116.573665,\"lat\":30.638222,\"adcode\":340882,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"宿松县\",\"lng\":116.120204,\"lat\":30.158327,\"adcode\":340826,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"太湖县\",\"lng\":116.305225,\"lat\":30.451869,\"adcode\":340825,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"桐城市\",\"lng\":116.959656,\"lat\":31.050576,\"adcode\":340881,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"望江县\",\"lng\":116.690927,\"lat\":30.12491,\"adcode\":340827,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"宜秀区\",\"lng\":117.070003,\"lat\":30.541323,\"adcode\":340811,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"迎江区\",\"lng\":117.044965,\"lat\":30.506375,\"adcode\":340802,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"安庆市\",\"n\":\"岳西县\",\"lng\":116.360482,\"lat\":30.848502,\"adcode\":340828,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"蚌埠市\",\"lng\":117.363228,\"lat\":32.939667,\"adcode\":340300,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"蚌山区\",\"lng\":117.355789,\"lat\":32.938066,\"adcode\":340303,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"固镇县\",\"lng\":117.315962,\"lat\":33.318679,\"adcode\":340323,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"怀远县\",\"lng\":117.200171,\"lat\":32.956934,\"adcode\":340321,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"淮上区\",\"lng\":117.34709,\"lat\":32.963147,\"adcode\":340311,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"龙子湖区\",\"lng\":117.382312,\"lat\":32.950452,\"adcode\":340302,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"五河县\",\"lng\":117.888809,\"lat\":33.146202,\"adcode\":340322,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"蚌埠市\",\"n\":\"禹会区\",\"lng\":117.35259,\"lat\":32.931933,\"adcode\":340304,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"亳州市\",\"n\":\"亳州市\",\"lng\":115.782939,\"lat\":33.869338,\"adcode\":341600,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"亳州市\",\"n\":\"利辛县\",\"lng\":116.207782,\"lat\":33.143503,\"adcode\":341623,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"亳州市\",\"n\":\"蒙城县\",\"lng\":116.560337,\"lat\":33.260814,\"adcode\":341622,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"亳州市\",\"n\":\"谯城区\",\"lng\":115.781214,\"lat\":33.869284,\"adcode\":341602,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"亳州市\",\"n\":\"涡阳县\",\"lng\":116.211551,\"lat\":33.502831,\"adcode\":341621,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"池州市\",\"n\":\"池州市\",\"lng\":117.489157,\"lat\":30.656037,\"adcode\":341700,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"池州市\",\"n\":\"东至县\",\"lng\":117.021476,\"lat\":30.096568,\"adcode\":341721,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"池州市\",\"n\":\"贵池区\",\"lng\":117.488342,\"lat\":30.657378,\"adcode\":341702,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"池州市\",\"n\":\"青阳县\",\"lng\":117.857395,\"lat\":30.63818,\"adcode\":341723,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"池州市\",\"n\":\"石台县\",\"lng\":117.482907,\"lat\":30.210324,\"adcode\":341722,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"滁州市\",\"lng\":118.316264,\"lat\":32.303627,\"adcode\":341100,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"定远县\",\"lng\":117.683713,\"lat\":32.527105,\"adcode\":341125,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"凤阳县\",\"lng\":117.562461,\"lat\":32.867146,\"adcode\":341126,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"来安县\",\"lng\":118.433293,\"lat\":32.450231,\"adcode\":341122,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"琅琊区\",\"lng\":118.316475,\"lat\":32.303797,\"adcode\":341102,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"明光市\",\"lng\":117.998048,\"lat\":32.781206,\"adcode\":341182,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"南谯区\",\"lng\":118.296955,\"lat\":32.329841,\"adcode\":341103,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"全椒县\",\"lng\":118.268576,\"lat\":32.09385,\"adcode\":341124,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"滁州市\",\"n\":\"天长市\",\"lng\":119.011212,\"lat\":32.6815,\"adcode\":341181,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"阜南县\",\"lng\":115.590534,\"lat\":32.638102,\"adcode\":341225,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"阜阳市\",\"lng\":115.819729,\"lat\":32.896969,\"adcode\":341200,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"界首市\",\"lng\":115.362117,\"lat\":33.26153,\"adcode\":341282,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"临泉县\",\"lng\":115.261688,\"lat\":33.062698,\"adcode\":341221,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"太和县\",\"lng\":115.627243,\"lat\":33.16229,\"adcode\":341222,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"颍东区\",\"lng\":115.858747,\"lat\":32.908861,\"adcode\":341203,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"颍泉区\",\"lng\":115.804525,\"lat\":32.924797,\"adcode\":341204,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"颍上县\",\"lng\":116.259122,\"lat\":32.637065,\"adcode\":341226,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"阜阳市\",\"n\":\"颍州区\",\"lng\":115.813914,\"lat\":32.891238,\"adcode\":341202,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"包河区\",\"lng\":117.285751,\"lat\":31.82956,\"adcode\":340111,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"巢湖市\",\"lng\":117.874155,\"lat\":31.600518,\"adcode\":340181,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"肥东县\",\"lng\":117.463222,\"lat\":31.883992,\"adcode\":340122,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"肥西县\",\"lng\":117.166118,\"lat\":31.719646,\"adcode\":340123,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"合肥市\",\"lng\":117.283042,\"lat\":31.86119,\"adcode\":340100,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"庐江县\",\"lng\":117.289844,\"lat\":31.251488,\"adcode\":340124,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"庐阳区\",\"lng\":117.283776,\"lat\":31.869011,\"adcode\":340103,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"蜀山区\",\"lng\":117.262072,\"lat\":31.855868,\"adcode\":340104,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"瑶海区\",\"lng\":117.315358,\"lat\":31.86961,\"adcode\":340102,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"合肥市\",\"n\":\"长丰县\",\"lng\":117.164699,\"lat\":32.478548,\"adcode\":340121,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮北市\",\"n\":\"杜集区\",\"lng\":116.833925,\"lat\":33.991218,\"adcode\":340602,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮北市\",\"n\":\"淮北市\",\"lng\":116.794664,\"lat\":33.971707,\"adcode\":340600,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"淮北市\",\"n\":\"烈山区\",\"lng\":116.809465,\"lat\":33.889529,\"adcode\":340604,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮北市\",\"n\":\"濉溪县\",\"lng\":116.767435,\"lat\":33.916407,\"adcode\":340621,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮北市\",\"n\":\"相山区\",\"lng\":116.790775,\"lat\":33.970916,\"adcode\":340603,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"八公山区\",\"lng\":116.841111,\"lat\":32.628229,\"adcode\":340405,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"大通区\",\"lng\":117.052927,\"lat\":32.632066,\"adcode\":340402,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"凤台县\",\"lng\":116.722769,\"lat\":32.705382,\"adcode\":340421,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"淮南市\",\"lng\":117.018329,\"lat\":32.647574,\"adcode\":340400,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"潘集区\",\"lng\":116.816879,\"lat\":32.782117,\"adcode\":340406,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"寿县\",\"lng\":116.785349,\"lat\":32.577304,\"adcode\":340422,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"田家庵区\",\"lng\":117.018318,\"lat\":32.644342,\"adcode\":340403,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"淮南市\",\"n\":\"谢家集区\",\"lng\":116.865354,\"lat\":32.598289,\"adcode\":340404,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"黄山区\",\"lng\":118.136639,\"lat\":30.294517,\"adcode\":341003,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"黄山市\",\"lng\":118.317325,\"lat\":29.709239,\"adcode\":341000,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"徽州区\",\"lng\":118.339743,\"lat\":29.825201,\"adcode\":341004,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"祁门县\",\"lng\":117.717237,\"lat\":29.853472,\"adcode\":341024,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"歙县\",\"lng\":118.428025,\"lat\":29.867748,\"adcode\":341021,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"屯溪区\",\"lng\":118.317354,\"lat\":29.709186,\"adcode\":341002,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"休宁县\",\"lng\":118.188531,\"lat\":29.788878,\"adcode\":341022,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"黄山市\",\"n\":\"黟县\",\"lng\":117.942911,\"lat\":29.923812,\"adcode\":341023,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"霍邱县\",\"lng\":116.278875,\"lat\":32.341305,\"adcode\":341522,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"霍山县\",\"lng\":116.333078,\"lat\":31.402456,\"adcode\":341525,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"金安区\",\"lng\":116.503288,\"lat\":31.754491,\"adcode\":341502,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"金寨县\",\"lng\":115.878514,\"lat\":31.681624,\"adcode\":341524,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"六安市\",\"lng\":116.507676,\"lat\":31.752889,\"adcode\":341500,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"舒城县\",\"lng\":116.944088,\"lat\":31.462848,\"adcode\":341523,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"叶集区\",\"lng\":115.913594,\"lat\":31.84768,\"adcode\":341504,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"六安市\",\"n\":\"裕安区\",\"lng\":116.494543,\"lat\":31.750692,\"adcode\":341503,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"博望区\",\"lng\":118.843742,\"lat\":31.562321,\"adcode\":340506,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"当涂县\",\"lng\":118.489873,\"lat\":31.556167,\"adcode\":340521,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"含山县\",\"lng\":118.105545,\"lat\":31.727758,\"adcode\":340522,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"和县\",\"lng\":118.362998,\"lat\":31.716634,\"adcode\":340523,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"花山区\",\"lng\":118.511308,\"lat\":31.69902,\"adcode\":340503,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"马鞍山市\",\"lng\":118.507906,\"lat\":31.689362,\"adcode\":340500,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"马鞍山市\",\"n\":\"雨山区\",\"lng\":118.493104,\"lat\":31.685912,\"adcode\":340504,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宿州市\",\"n\":\"砀山县\",\"lng\":116.351113,\"lat\":34.426247,\"adcode\":341321,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宿州市\",\"n\":\"灵璧县\",\"lng\":117.551493,\"lat\":33.540629,\"adcode\":341323,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宿州市\",\"n\":\"泗县\",\"lng\":117.885443,\"lat\":33.47758,\"adcode\":341324,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宿州市\",\"n\":\"宿州市\",\"lng\":116.984084,\"lat\":33.633891,\"adcode\":341300,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"宿州市\",\"n\":\"萧县\",\"lng\":116.945399,\"lat\":34.183266,\"adcode\":341322,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宿州市\",\"n\":\"埇桥区\",\"lng\":116.983309,\"lat\":33.633853,\"adcode\":341302,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"铜陵市\",\"n\":\"枞阳县\",\"lng\":117.222027,\"lat\":30.700615,\"adcode\":340722,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"铜陵市\",\"n\":\"郊区\",\"lng\":117.80707,\"lat\":30.908927,\"adcode\":340711,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"铜陵市\",\"n\":\"铜官区\",\"lng\":117.816167,\"lat\":30.927613,\"adcode\":340705,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"铜陵市\",\"n\":\"铜陵市\",\"lng\":117.816576,\"lat\":30.929935,\"adcode\":340700,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"铜陵市\",\"n\":\"义安区\",\"lng\":117.792288,\"lat\":30.952338,\"adcode\":340706,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"繁昌区\",\"lng\":118.201349,\"lat\":31.080896,\"adcode\":340211,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"镜湖区\",\"lng\":118.376343,\"lat\":31.32559,\"adcode\":340202,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"鸠江区\",\"lng\":118.400174,\"lat\":31.362716,\"adcode\":340207,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"南陵县\",\"lng\":118.337104,\"lat\":30.919638,\"adcode\":340223,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"湾沚区\",\"lng\":118.572301,\"lat\":31.145262,\"adcode\":340210,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"无为市\",\"lng\":117.911432,\"lat\":31.303075,\"adcode\":340281,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"芜湖市\",\"lng\":118.376451,\"lat\":31.326319,\"adcode\":340200,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"芜湖市\",\"n\":\"弋江区\",\"lng\":118.377476,\"lat\":31.313394,\"adcode\":340209,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"广德市\",\"lng\":119.417521,\"lat\":30.893116,\"adcode\":341882,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"绩溪县\",\"lng\":118.594705,\"lat\":30.065267,\"adcode\":341824,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"泾县\",\"lng\":118.412397,\"lat\":30.685975,\"adcode\":341823,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"旌德县\",\"lng\":118.543081,\"lat\":30.288057,\"adcode\":341825,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"郎溪县\",\"lng\":119.185024,\"lat\":31.127834,\"adcode\":341821,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"宁国市\",\"lng\":118.983407,\"lat\":30.626529,\"adcode\":341881,\"level\":\"district\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"宣城市\",\"lng\":118.757995,\"lat\":30.945667,\"adcode\":341800,\"level\":\"city\"},{\"p\":\"安徽\",\"c\":\"宣城市\",\"n\":\"宣州区\",\"lng\":118.758412,\"lat\":30.946003,\"adcode\":341802,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"澳门\",\"lng\":113.54909,\"lat\":22.198951,\"adcode\":820000,\"level\":\"city\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"大堂区\",\"lng\":113.5536475,\"lat\":22.18853944,\"adcode\":820004,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"风顺堂区\",\"lng\":113.5419278,\"lat\":22.18736806,\"adcode\":820005,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"花地玛堂区\",\"lng\":113.5528956,\"lat\":22.20787,\"adcode\":820001,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"花王堂区\",\"lng\":113.5489608,\"lat\":22.1992075,\"adcode\":820002,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"嘉模堂区\",\"lng\":113.5587044,\"lat\":22.15375944,\"adcode\":820006,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"路凼填海区\",\"lng\":113.5695992,\"lat\":22.13663,\"adcode\":820007,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"圣方济各堂区\",\"lng\":113.5599542,\"lat\":22.12348639,\"adcode\":820008,\"level\":\"district\"},{\"p\":\"澳门\",\"c\":\"澳门\",\"n\":\"望德堂区\",\"lng\":113.5501828,\"lat\":22.19372083,\"adcode\":820003,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"北京\",\"lng\":116.405285,\"lat\":39.904989,\"adcode\":110000,\"level\":\"city\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"昌平区\",\"lng\":116.235906,\"lat\":40.218085,\"adcode\":110114,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"朝阳区\",\"lng\":116.486409,\"lat\":39.921489,\"adcode\":110105,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"大兴区\",\"lng\":116.338033,\"lat\":39.728908,\"adcode\":110115,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"东城区\",\"lng\":116.418757,\"lat\":39.917544,\"adcode\":110101,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"房山区\",\"lng\":116.139157,\"lat\":39.735535,\"adcode\":110111,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"丰台区\",\"lng\":116.286968,\"lat\":39.863642,\"adcode\":110106,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"海淀区\",\"lng\":116.310316,\"lat\":39.956074,\"adcode\":110108,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"怀柔区\",\"lng\":116.637122,\"lat\":40.324272,\"adcode\":110116,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"门头沟区\",\"lng\":116.105381,\"lat\":39.937183,\"adcode\":110109,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"密云区\",\"lng\":116.843352,\"lat\":40.377362,\"adcode\":110118,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"平谷区\",\"lng\":117.112335,\"lat\":40.144783,\"adcode\":110117,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"石景山区\",\"lng\":116.195445,\"lat\":39.914601,\"adcode\":110107,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"顺义区\",\"lng\":116.653525,\"lat\":40.128936,\"adcode\":110113,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"通州区\",\"lng\":116.658603,\"lat\":39.902486,\"adcode\":110112,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"西城区\",\"lng\":116.366794,\"lat\":39.915309,\"adcode\":110102,\"level\":\"district\"},{\"p\":\"北京\",\"c\":\"北京\",\"n\":\"延庆区\",\"lng\":115.985006,\"lat\":40.465325,\"adcode\":110119,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"巴南区\",\"lng\":106.519423,\"lat\":29.381919,\"adcode\":500113,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"北碚区\",\"lng\":106.437868,\"lat\":29.82543,\"adcode\":500109,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"璧山区\",\"lng\":106.231126,\"lat\":29.593581,\"adcode\":500120,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"城口县\",\"lng\":108.6649,\"lat\":31.946293,\"adcode\":500229,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"重庆\",\"lng\":106.504962,\"lat\":29.533155,\"adcode\":500000,\"level\":\"city\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"大渡口区\",\"lng\":106.48613,\"lat\":29.481002,\"adcode\":500104,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"大足区\",\"lng\":105.715319,\"lat\":29.700498,\"adcode\":500111,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"垫江县\",\"lng\":107.348692,\"lat\":30.330012,\"adcode\":500231,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"丰都县\",\"lng\":107.73248,\"lat\":29.866424,\"adcode\":500230,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"奉节县\",\"lng\":109.465774,\"lat\":31.019967,\"adcode\":500236,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"涪陵区\",\"lng\":107.394905,\"lat\":29.703652,\"adcode\":500102,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"合川区\",\"lng\":106.265554,\"lat\":29.990993,\"adcode\":500117,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"江北区\",\"lng\":106.532844,\"lat\":29.575352,\"adcode\":500105,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"江津区\",\"lng\":106.253156,\"lat\":29.283387,\"adcode\":500116,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"九龙坡区\",\"lng\":106.480989,\"lat\":29.523492,\"adcode\":500107,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"开州区\",\"lng\":108.413317,\"lat\":31.167735,\"adcode\":500154,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"梁平区\",\"lng\":107.800034,\"lat\":30.672168,\"adcode\":500155,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"南岸区\",\"lng\":106.560813,\"lat\":29.523992,\"adcode\":500108,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"南川区\",\"lng\":107.098153,\"lat\":29.156646,\"adcode\":500119,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"彭水苗族土家族自治县\",\"lng\":108.166551,\"lat\":29.293856,\"adcode\":500243,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"綦江区\",\"lng\":106.651417,\"lat\":29.028091,\"adcode\":500110,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"黔江区\",\"lng\":108.782577,\"lat\":29.527548,\"adcode\":500114,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"荣昌区\",\"lng\":105.594061,\"lat\":29.403627,\"adcode\":500153,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"沙坪坝区\",\"lng\":106.4542,\"lat\":29.541224,\"adcode\":500106,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"石柱土家族自治县\",\"lng\":108.112448,\"lat\":29.99853,\"adcode\":500240,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"铜梁区\",\"lng\":106.054948,\"lat\":29.839944,\"adcode\":500151,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"潼南区\",\"lng\":105.841818,\"lat\":30.189554,\"adcode\":500152,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"万州区\",\"lng\":108.380246,\"lat\":30.807807,\"adcode\":500101,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"巫山县\",\"lng\":109.878928,\"lat\":31.074843,\"adcode\":500237,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"巫溪县\",\"lng\":109.628912,\"lat\":31.3966,\"adcode\":500238,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"武隆区\",\"lng\":107.75655,\"lat\":29.32376,\"adcode\":500156,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"秀山土家族苗族自治县\",\"lng\":108.996043,\"lat\":28.444772,\"adcode\":500241,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"永川区\",\"lng\":105.894714,\"lat\":29.348748,\"adcode\":500118,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"酉阳土家族苗族自治县\",\"lng\":108.767201,\"lat\":28.839828,\"adcode\":500242,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"渝北区\",\"lng\":106.512851,\"lat\":29.601451,\"adcode\":500112,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"渝中区\",\"lng\":106.56288,\"lat\":29.556742,\"adcode\":500103,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"云阳县\",\"lng\":108.697698,\"lat\":30.930529,\"adcode\":500235,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"长寿区\",\"lng\":107.074854,\"lat\":29.833671,\"adcode\":500115,\"level\":\"district\"},{\"p\":\"重庆\",\"c\":\"重庆\",\"n\":\"忠县\",\"lng\":108.037518,\"lat\":30.291537,\"adcode\":500233,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"仓山区\",\"lng\":119.320988,\"lat\":26.038912,\"adcode\":350104,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"福清市\",\"lng\":119.376992,\"lat\":25.720402,\"adcode\":350181,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"福州市\",\"lng\":119.306239,\"lat\":26.075302,\"adcode\":350100,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"鼓楼区\",\"lng\":119.29929,\"lat\":26.082284,\"adcode\":350102,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"晋安区\",\"lng\":119.328597,\"lat\":26.078837,\"adcode\":350111,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"连江县\",\"lng\":119.538365,\"lat\":26.202109,\"adcode\":350122,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"罗源县\",\"lng\":119.552645,\"lat\":26.487234,\"adcode\":350123,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"马尾区\",\"lng\":119.458725,\"lat\":25.991975,\"adcode\":350105,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"闽侯县\",\"lng\":119.145117,\"lat\":26.148567,\"adcode\":350121,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"闽清县\",\"lng\":118.868416,\"lat\":26.223793,\"adcode\":350124,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"平潭县\",\"lng\":119.791197,\"lat\":25.503672,\"adcode\":350128,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"台江区\",\"lng\":119.310156,\"lat\":26.058616,\"adcode\":350103,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"永泰县\",\"lng\":118.939089,\"lat\":25.864825,\"adcode\":350125,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"福州市\",\"n\":\"长乐区\",\"lng\":119.510849,\"lat\":25.960583,\"adcode\":350112,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"连城县\",\"lng\":116.756687,\"lat\":25.708506,\"adcode\":350825,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"龙岩市\",\"lng\":117.02978,\"lat\":25.091603,\"adcode\":350800,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"上杭县\",\"lng\":116.424774,\"lat\":25.050019,\"adcode\":350823,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"武平县\",\"lng\":116.100928,\"lat\":25.08865,\"adcode\":350824,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"新罗区\",\"lng\":117.030721,\"lat\":25.0918,\"adcode\":350802,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"永定区\",\"lng\":116.732691,\"lat\":24.720442,\"adcode\":350803,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"漳平市\",\"lng\":117.42073,\"lat\":25.291597,\"adcode\":350881,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"龙岩市\",\"n\":\"长汀县\",\"lng\":116.361007,\"lat\":25.842278,\"adcode\":350821,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"光泽县\",\"lng\":117.337897,\"lat\":27.542803,\"adcode\":350723,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"建瓯市\",\"lng\":118.321765,\"lat\":27.03502,\"adcode\":350783,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"建阳区\",\"lng\":118.12267,\"lat\":27.332067,\"adcode\":350703,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"南平市\",\"lng\":118.178459,\"lat\":26.635627,\"adcode\":350700,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"浦城县\",\"lng\":118.536822,\"lat\":27.920412,\"adcode\":350722,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"邵武市\",\"lng\":117.491544,\"lat\":27.337952,\"adcode\":350781,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"顺昌县\",\"lng\":117.80771,\"lat\":26.792851,\"adcode\":350721,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"松溪县\",\"lng\":118.783491,\"lat\":27.525785,\"adcode\":350724,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"武夷山市\",\"lng\":118.032796,\"lat\":27.751733,\"adcode\":350782,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"延平区\",\"lng\":118.178918,\"lat\":26.636079,\"adcode\":350702,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"南平市\",\"n\":\"政和县\",\"lng\":118.858661,\"lat\":27.365398,\"adcode\":350725,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"福安市\",\"lng\":119.650798,\"lat\":27.084246,\"adcode\":350981,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"福鼎市\",\"lng\":120.219761,\"lat\":27.318884,\"adcode\":350982,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"古田县\",\"lng\":118.743156,\"lat\":26.577491,\"adcode\":350922,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"蕉城区\",\"lng\":119.527225,\"lat\":26.659253,\"adcode\":350902,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"宁德市\",\"lng\":119.527082,\"lat\":26.65924,\"adcode\":350900,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"屏南县\",\"lng\":118.987544,\"lat\":26.910826,\"adcode\":350923,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"寿宁县\",\"lng\":119.506733,\"lat\":27.457798,\"adcode\":350924,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"霞浦县\",\"lng\":120.005214,\"lat\":26.882068,\"adcode\":350921,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"柘荣县\",\"lng\":119.898226,\"lat\":27.236163,\"adcode\":350926,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"宁德市\",\"n\":\"周宁县\",\"lng\":119.338239,\"lat\":27.103106,\"adcode\":350925,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"莆田市\",\"n\":\"城厢区\",\"lng\":119.001028,\"lat\":25.433737,\"adcode\":350302,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"莆田市\",\"n\":\"涵江区\",\"lng\":119.119102,\"lat\":25.459273,\"adcode\":350303,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"莆田市\",\"n\":\"荔城区\",\"lng\":119.020047,\"lat\":25.430047,\"adcode\":350304,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"莆田市\",\"n\":\"莆田市\",\"lng\":119.007558,\"lat\":25.431011,\"adcode\":350300,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"莆田市\",\"n\":\"仙游县\",\"lng\":118.694331,\"lat\":25.356529,\"adcode\":350322,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"莆田市\",\"n\":\"秀屿区\",\"lng\":119.092607,\"lat\":25.316141,\"adcode\":350305,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"安溪县\",\"lng\":118.186014,\"lat\":25.056824,\"adcode\":350524,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"德化县\",\"lng\":118.242986,\"lat\":25.489004,\"adcode\":350526,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"丰泽区\",\"lng\":118.605147,\"lat\":24.896041,\"adcode\":350503,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"惠安县\",\"lng\":118.798954,\"lat\":25.028718,\"adcode\":350521,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"金门县\",\"lng\":118.323221,\"lat\":24.436417,\"adcode\":350527,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"晋江市\",\"lng\":118.577338,\"lat\":24.807322,\"adcode\":350582,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"鲤城区\",\"lng\":118.588929,\"lat\":24.907645,\"adcode\":350502,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"洛江区\",\"lng\":118.670312,\"lat\":24.941153,\"adcode\":350504,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"南安市\",\"lng\":118.387031,\"lat\":24.959494,\"adcode\":350583,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"泉港区\",\"lng\":118.912285,\"lat\":25.126859,\"adcode\":350505,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"泉州市\",\"lng\":118.589421,\"lat\":24.908853,\"adcode\":350500,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"石狮市\",\"lng\":118.628402,\"lat\":24.731978,\"adcode\":350581,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"泉州市\",\"n\":\"永春县\",\"lng\":118.29503,\"lat\":25.320721,\"adcode\":350525,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"大田县\",\"lng\":117.849355,\"lat\":25.690803,\"adcode\":350425,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"建宁县\",\"lng\":116.845832,\"lat\":26.831398,\"adcode\":350430,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"将乐县\",\"lng\":117.473558,\"lat\":26.728667,\"adcode\":350428,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"明溪县\",\"lng\":117.201845,\"lat\":26.357375,\"adcode\":350421,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"宁化县\",\"lng\":116.659725,\"lat\":26.259932,\"adcode\":350424,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"清流县\",\"lng\":116.815821,\"lat\":26.17761,\"adcode\":350423,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"三明市\",\"lng\":117.635001,\"lat\":26.265444,\"adcode\":350400,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"三元区\",\"lng\":117.607418,\"lat\":26.234191,\"adcode\":350403,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"沙县区\",\"lng\":117.789095,\"lat\":26.397361,\"adcode\":350427,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"泰宁县\",\"lng\":117.177522,\"lat\":26.897995,\"adcode\":350429,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"永安市\",\"lng\":117.364447,\"lat\":25.974075,\"adcode\":350481,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"三明市\",\"n\":\"尤溪县\",\"lng\":118.188577,\"lat\":26.169261,\"adcode\":350426,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"海沧区\",\"lng\":118.036364,\"lat\":24.492512,\"adcode\":350205,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"湖里区\",\"lng\":118.10943,\"lat\":24.512764,\"adcode\":350206,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"集美区\",\"lng\":118.100869,\"lat\":24.572874,\"adcode\":350211,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"厦门市\",\"lng\":118.11022,\"lat\":24.490474,\"adcode\":350200,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"思明区\",\"lng\":118.087828,\"lat\":24.462059,\"adcode\":350203,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"同安区\",\"lng\":118.150455,\"lat\":24.729333,\"adcode\":350212,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"厦门市\",\"n\":\"翔安区\",\"lng\":118.242811,\"lat\":24.637479,\"adcode\":350213,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"东山县\",\"lng\":117.427679,\"lat\":23.702845,\"adcode\":350626,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"华安县\",\"lng\":117.53631,\"lat\":25.001416,\"adcode\":350629,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"龙海区\",\"lng\":117.817292,\"lat\":24.445341,\"adcode\":350681,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"龙文区\",\"lng\":117.671387,\"lat\":24.515656,\"adcode\":350603,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"南靖县\",\"lng\":117.365462,\"lat\":24.516425,\"adcode\":350627,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"平和县\",\"lng\":117.313549,\"lat\":24.366158,\"adcode\":350628,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"芗城区\",\"lng\":117.656461,\"lat\":24.509955,\"adcode\":350602,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"云霄县\",\"lng\":117.340946,\"lat\":23.950486,\"adcode\":350622,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"漳浦县\",\"lng\":117.614023,\"lat\":24.117907,\"adcode\":350623,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"漳州市\",\"lng\":117.661801,\"lat\":24.510897,\"adcode\":350600,\"level\":\"city\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"长泰区\",\"lng\":117.755913,\"lat\":24.621475,\"adcode\":350625,\"level\":\"district\"},{\"p\":\"福建\",\"c\":\"漳州市\",\"n\":\"诏安县\",\"lng\":117.176083,\"lat\":23.710834,\"adcode\":350624,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"白银市\",\"n\":\"白银区\",\"lng\":104.17425,\"lat\":36.545649,\"adcode\":620402,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"白银市\",\"n\":\"白银市\",\"lng\":104.173606,\"lat\":36.54568,\"adcode\":620400,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"白银市\",\"n\":\"会宁县\",\"lng\":105.054337,\"lat\":35.692486,\"adcode\":620422,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"白银市\",\"n\":\"景泰县\",\"lng\":104.066394,\"lat\":37.193519,\"adcode\":620423,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"白银市\",\"n\":\"靖远县\",\"lng\":104.686972,\"lat\":36.561424,\"adcode\":620421,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"白银市\",\"n\":\"平川区\",\"lng\":104.819207,\"lat\":36.72921,\"adcode\":620403,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"安定区\",\"lng\":104.62577,\"lat\":35.579764,\"adcode\":621102,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"定西市\",\"lng\":104.626294,\"lat\":35.579578,\"adcode\":621100,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"临洮县\",\"lng\":103.862186,\"lat\":35.376233,\"adcode\":621124,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"陇西县\",\"lng\":104.637554,\"lat\":35.003409,\"adcode\":621122,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"岷县\",\"lng\":104.039882,\"lat\":34.439105,\"adcode\":621126,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"通渭县\",\"lng\":105.250102,\"lat\":35.208922,\"adcode\":621121,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"渭源县\",\"lng\":104.211742,\"lat\":35.133023,\"adcode\":621123,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"定西市\",\"n\":\"漳县\",\"lng\":104.466756,\"lat\":34.848642,\"adcode\":621125,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"迭部县\",\"lng\":103.221009,\"lat\":34.055348,\"adcode\":623024,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"甘南藏族自治州\",\"lng\":102.911008,\"lat\":34.986354,\"adcode\":623000,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"合作市\",\"lng\":102.91149,\"lat\":34.985973,\"adcode\":623001,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"临潭县\",\"lng\":103.353054,\"lat\":34.69164,\"adcode\":623021,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"碌曲县\",\"lng\":102.488495,\"lat\":34.589591,\"adcode\":623026,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"玛曲县\",\"lng\":102.075767,\"lat\":33.998068,\"adcode\":623025,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"夏河县\",\"lng\":102.520743,\"lat\":35.200853,\"adcode\":623027,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"舟曲县\",\"lng\":104.370271,\"lat\":33.782964,\"adcode\":623023,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"甘南藏族自治州\",\"n\":\"卓尼县\",\"lng\":103.508508,\"lat\":34.588165,\"adcode\":623022,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"金昌市\",\"n\":\"金昌市\",\"lng\":102.187888,\"lat\":38.514238,\"adcode\":620300,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"金昌市\",\"n\":\"金川区\",\"lng\":102.187683,\"lat\":38.513793,\"adcode\":620302,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"金昌市\",\"n\":\"永昌县\",\"lng\":101.971957,\"lat\":38.247354,\"adcode\":620321,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"阿克塞哈萨克族自治县\",\"lng\":94.337642,\"lat\":39.631642,\"adcode\":620924,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"敦煌市\",\"lng\":94.664279,\"lat\":40.141119,\"adcode\":620982,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"瓜州县\",\"lng\":95.780591,\"lat\":40.516525,\"adcode\":620922,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"金塔县\",\"lng\":98.902959,\"lat\":39.983036,\"adcode\":620921,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"酒泉市\",\"lng\":98.510795,\"lat\":39.744023,\"adcode\":620900,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"肃北蒙古族自治县\",\"lng\":94.87728,\"lat\":39.51224,\"adcode\":620923,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"肃州区\",\"lng\":98.511155,\"lat\":39.743858,\"adcode\":620902,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"酒泉市\",\"n\":\"玉门市\",\"lng\":97.037206,\"lat\":40.28682,\"adcode\":620981,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"安宁区\",\"lng\":103.724038,\"lat\":36.10329,\"adcode\":620105,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"城关区\",\"lng\":103.841032,\"lat\":36.049115,\"adcode\":620102,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"皋兰县\",\"lng\":103.94933,\"lat\":36.331254,\"adcode\":620122,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"红古区\",\"lng\":102.861814,\"lat\":36.344177,\"adcode\":620111,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"兰州市\",\"lng\":103.823557,\"lat\":36.058039,\"adcode\":620100,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"七里河区\",\"lng\":103.784326,\"lat\":36.06673,\"adcode\":620103,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"西固区\",\"lng\":103.622331,\"lat\":36.100369,\"adcode\":620104,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"永登县\",\"lng\":103.262203,\"lat\":36.734428,\"adcode\":620121,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"兰州市\",\"n\":\"榆中县\",\"lng\":104.114975,\"lat\":35.84443,\"adcode\":620123,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"东乡族自治县\",\"lng\":103.389568,\"lat\":35.66383,\"adcode\":622926,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"广河县\",\"lng\":103.576188,\"lat\":35.481688,\"adcode\":622924,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"和政县\",\"lng\":103.350357,\"lat\":35.425971,\"adcode\":622925,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"积石山保安族东乡族撒拉族自治县\",\"lng\":102.877473,\"lat\":35.712906,\"adcode\":622927,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"康乐县\",\"lng\":103.709852,\"lat\":35.371906,\"adcode\":622922,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"临夏回族自治州\",\"lng\":103.212006,\"lat\":35.599446,\"adcode\":622900,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"临夏市\",\"lng\":103.211634,\"lat\":35.59941,\"adcode\":622901,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"临夏县\",\"lng\":102.993873,\"lat\":35.49236,\"adcode\":622921,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"临夏回族自治州\",\"n\":\"永靖县\",\"lng\":103.319871,\"lat\":35.938933,\"adcode\":622923,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"成县\",\"lng\":105.734434,\"lat\":33.739863,\"adcode\":621221,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"宕昌县\",\"lng\":104.394475,\"lat\":34.042655,\"adcode\":621223,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"徽县\",\"lng\":106.085632,\"lat\":33.767785,\"adcode\":621227,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"康县\",\"lng\":105.609534,\"lat\":33.328266,\"adcode\":621224,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"礼县\",\"lng\":105.181616,\"lat\":34.189387,\"adcode\":621226,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"两当县\",\"lng\":106.306959,\"lat\":33.910729,\"adcode\":621228,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"陇南市\",\"lng\":104.929379,\"lat\":33.388598,\"adcode\":621200,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"文县\",\"lng\":104.682448,\"lat\":32.942171,\"adcode\":621222,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"武都区\",\"lng\":104.929866,\"lat\":33.388155,\"adcode\":621202,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"陇南市\",\"n\":\"西和县\",\"lng\":105.299737,\"lat\":34.013718,\"adcode\":621225,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"崇信县\",\"lng\":107.031253,\"lat\":35.304533,\"adcode\":620823,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"华亭市\",\"lng\":106.649308,\"lat\":35.215341,\"adcode\":620881,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"泾川县\",\"lng\":107.365218,\"lat\":35.335283,\"adcode\":620821,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"静宁县\",\"lng\":105.733489,\"lat\":35.525243,\"adcode\":620826,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"崆峒区\",\"lng\":106.684223,\"lat\":35.54173,\"adcode\":620802,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"灵台县\",\"lng\":107.620587,\"lat\":35.064009,\"adcode\":620822,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"平凉市\",\"lng\":106.684691,\"lat\":35.54279,\"adcode\":620800,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"平凉市\",\"n\":\"庄浪县\",\"lng\":106.041979,\"lat\":35.203428,\"adcode\":620825,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"合水县\",\"lng\":108.019865,\"lat\":35.819005,\"adcode\":621024,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"华池县\",\"lng\":107.986288,\"lat\":36.457304,\"adcode\":621023,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"环县\",\"lng\":107.308754,\"lat\":36.569322,\"adcode\":621022,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"宁县\",\"lng\":107.921182,\"lat\":35.50201,\"adcode\":621026,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"庆城县\",\"lng\":107.885664,\"lat\":36.013504,\"adcode\":621021,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"庆阳市\",\"lng\":107.638372,\"lat\":35.734218,\"adcode\":621000,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"西峰区\",\"lng\":107.638824,\"lat\":35.733713,\"adcode\":621002,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"镇原县\",\"lng\":107.195706,\"lat\":35.677806,\"adcode\":621027,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"庆阳市\",\"n\":\"正宁县\",\"lng\":108.361068,\"lat\":35.490642,\"adcode\":621025,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"甘谷县\",\"lng\":105.332347,\"lat\":34.747327,\"adcode\":620523,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"麦积区\",\"lng\":105.897631,\"lat\":34.563504,\"adcode\":620503,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"秦安县\",\"lng\":105.6733,\"lat\":34.862354,\"adcode\":620522,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"秦州区\",\"lng\":105.724477,\"lat\":34.578645,\"adcode\":620502,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"清水县\",\"lng\":106.139878,\"lat\":34.75287,\"adcode\":620521,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"天水市\",\"lng\":105.724998,\"lat\":34.578529,\"adcode\":620500,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"武山县\",\"lng\":104.891696,\"lat\":34.721955,\"adcode\":620524,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"天水市\",\"n\":\"张家川回族自治县\",\"lng\":106.212416,\"lat\":34.993237,\"adcode\":620525,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"武威市\",\"n\":\"古浪县\",\"lng\":102.898047,\"lat\":37.470571,\"adcode\":620622,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"武威市\",\"n\":\"凉州区\",\"lng\":102.634492,\"lat\":37.93025,\"adcode\":620602,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"武威市\",\"n\":\"民勤县\",\"lng\":103.090654,\"lat\":38.624621,\"adcode\":620621,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"武威市\",\"n\":\"天祝藏族自治县\",\"lng\":103.142034,\"lat\":36.971678,\"adcode\":620623,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"武威市\",\"n\":\"武威市\",\"lng\":102.634697,\"lat\":37.929996,\"adcode\":620600,\"level\":\"city\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"甘州区\",\"lng\":100.454862,\"lat\":38.931774,\"adcode\":620702,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"高台县\",\"lng\":99.81665,\"lat\":39.376308,\"adcode\":620724,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"临泽县\",\"lng\":100.166333,\"lat\":39.152151,\"adcode\":620723,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"民乐县\",\"lng\":100.816623,\"lat\":38.434454,\"adcode\":620722,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"山丹县\",\"lng\":101.088442,\"lat\":38.784839,\"adcode\":620725,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"肃南裕固族自治县\",\"lng\":99.617086,\"lat\":38.837269,\"adcode\":620721,\"level\":\"district\"},{\"p\":\"甘肃\",\"c\":\"张掖市\",\"n\":\"张掖市\",\"lng\":100.455472,\"lat\":38.932897,\"adcode\":620700,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"潮州市\",\"n\":\"潮安区\",\"lng\":116.67931,\"lat\":23.461012,\"adcode\":445103,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"潮州市\",\"n\":\"潮州市\",\"lng\":116.632301,\"lat\":23.661701,\"adcode\":445100,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"潮州市\",\"n\":\"饶平县\",\"lng\":117.00205,\"lat\":23.668171,\"adcode\":445122,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"潮州市\",\"n\":\"湘桥区\",\"lng\":116.63365,\"lat\":23.664675,\"adcode\":445102,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"佛山市\",\"n\":\"禅城区\",\"lng\":113.112414,\"lat\":23.019643,\"adcode\":440604,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"佛山市\",\"n\":\"佛山市\",\"lng\":113.122717,\"lat\":23.028762,\"adcode\":440600,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"佛山市\",\"n\":\"高明区\",\"lng\":112.882123,\"lat\":22.893855,\"adcode\":440608,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"佛山市\",\"n\":\"南海区\",\"lng\":113.145577,\"lat\":23.031562,\"adcode\":440605,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"佛山市\",\"n\":\"三水区\",\"lng\":112.899414,\"lat\":23.16504,\"adcode\":440607,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"佛山市\",\"n\":\"顺德区\",\"lng\":113.281826,\"lat\":22.75851,\"adcode\":440606,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"白云区\",\"lng\":113.262831,\"lat\":23.162281,\"adcode\":440111,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"从化区\",\"lng\":113.587386,\"lat\":23.545283,\"adcode\":440117,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"番禺区\",\"lng\":113.364619,\"lat\":22.938582,\"adcode\":440113,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"广州市\",\"lng\":113.280637,\"lat\":23.125178,\"adcode\":440100,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"海珠区\",\"lng\":113.262008,\"lat\":23.103131,\"adcode\":440105,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"花都区\",\"lng\":113.211184,\"lat\":23.39205,\"adcode\":440114,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"黄埔区\",\"lng\":113.450761,\"lat\":23.103239,\"adcode\":440112,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"荔湾区\",\"lng\":113.243038,\"lat\":23.124943,\"adcode\":440103,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"南沙区\",\"lng\":113.53738,\"lat\":22.794531,\"adcode\":440115,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"天河区\",\"lng\":113.335367,\"lat\":23.13559,\"adcode\":440106,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"越秀区\",\"lng\":113.280714,\"lat\":23.125624,\"adcode\":440104,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"广州市\",\"n\":\"增城区\",\"lng\":113.829579,\"lat\":23.290497,\"adcode\":440118,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"东源县\",\"lng\":114.742711,\"lat\":23.789093,\"adcode\":441625,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"和平县\",\"lng\":114.941473,\"lat\":24.44318,\"adcode\":441624,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"河源市\",\"lng\":114.697802,\"lat\":23.746266,\"adcode\":441600,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"连平县\",\"lng\":114.495952,\"lat\":24.364227,\"adcode\":441623,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"龙川县\",\"lng\":115.256415,\"lat\":24.101174,\"adcode\":441622,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"源城区\",\"lng\":114.696828,\"lat\":23.746255,\"adcode\":441602,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"河源市\",\"n\":\"紫金县\",\"lng\":115.184383,\"lat\":23.633744,\"adcode\":441621,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"惠州市\",\"n\":\"博罗县\",\"lng\":114.284254,\"lat\":23.167575,\"adcode\":441322,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"惠州市\",\"n\":\"惠城区\",\"lng\":114.413978,\"lat\":23.079883,\"adcode\":441302,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"惠州市\",\"n\":\"惠东县\",\"lng\":114.723092,\"lat\":22.983036,\"adcode\":441323,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"惠州市\",\"n\":\"惠阳区\",\"lng\":114.469444,\"lat\":22.78851,\"adcode\":441303,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"惠州市\",\"n\":\"惠州市\",\"lng\":114.412599,\"lat\":23.079404,\"adcode\":441300,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"惠州市\",\"n\":\"龙门县\",\"lng\":114.259986,\"lat\":23.723894,\"adcode\":441324,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"恩平市\",\"lng\":112.314051,\"lat\":22.182956,\"adcode\":440785,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"鹤山市\",\"lng\":112.961795,\"lat\":22.768104,\"adcode\":440784,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"江海区\",\"lng\":113.120601,\"lat\":22.572211,\"adcode\":440704,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"江门市\",\"lng\":113.094942,\"lat\":22.590431,\"adcode\":440700,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"开平市\",\"lng\":112.692262,\"lat\":22.366286,\"adcode\":440783,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"蓬江区\",\"lng\":113.07859,\"lat\":22.59677,\"adcode\":440703,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"台山市\",\"lng\":112.793414,\"lat\":22.250713,\"adcode\":440781,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"江门市\",\"n\":\"新会区\",\"lng\":113.038584,\"lat\":22.520247,\"adcode\":440705,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"揭阳市\",\"n\":\"惠来县\",\"lng\":116.295832,\"lat\":23.029834,\"adcode\":445224,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"揭阳市\",\"n\":\"揭东区\",\"lng\":116.412947,\"lat\":23.569887,\"adcode\":445203,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"揭阳市\",\"n\":\"揭西县\",\"lng\":115.838708,\"lat\":23.4273,\"adcode\":445222,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"揭阳市\",\"n\":\"揭阳市\",\"lng\":116.355733,\"lat\":23.543778,\"adcode\":445200,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"揭阳市\",\"n\":\"普宁市\",\"lng\":116.165082,\"lat\":23.29788,\"adcode\":445281,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"揭阳市\",\"n\":\"榕城区\",\"lng\":116.357045,\"lat\":23.535524,\"adcode\":445202,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"茂名市\",\"n\":\"电白区\",\"lng\":111.007264,\"lat\":21.507219,\"adcode\":440904,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"茂名市\",\"n\":\"高州市\",\"lng\":110.853251,\"lat\":21.915153,\"adcode\":440981,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"茂名市\",\"n\":\"化州市\",\"lng\":110.63839,\"lat\":21.654953,\"adcode\":440982,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"茂名市\",\"n\":\"茂名市\",\"lng\":110.919229,\"lat\":21.659751,\"adcode\":440900,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"茂名市\",\"n\":\"茂南区\",\"lng\":110.920542,\"lat\":21.660425,\"adcode\":440902,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"茂名市\",\"n\":\"信宜市\",\"lng\":110.941656,\"lat\":22.352681,\"adcode\":440983,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"大埔县\",\"lng\":116.69552,\"lat\":24.351587,\"adcode\":441422,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"丰顺县\",\"lng\":116.184419,\"lat\":23.752771,\"adcode\":441423,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"蕉岭县\",\"lng\":116.170531,\"lat\":24.653313,\"adcode\":441427,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"梅江区\",\"lng\":116.12116,\"lat\":24.302593,\"adcode\":441402,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"梅县区\",\"lng\":116.083482,\"lat\":24.267825,\"adcode\":441403,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"梅州市\",\"lng\":116.117582,\"lat\":24.299112,\"adcode\":441400,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"平远县\",\"lng\":115.891729,\"lat\":24.569651,\"adcode\":441426,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"五华县\",\"lng\":115.775004,\"lat\":23.925424,\"adcode\":441424,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"梅州市\",\"n\":\"兴宁市\",\"lng\":115.731648,\"lat\":24.138077,\"adcode\":441481,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"佛冈县\",\"lng\":113.534094,\"lat\":23.866739,\"adcode\":441821,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"连南瑶族自治县\",\"lng\":112.290808,\"lat\":24.719097,\"adcode\":441826,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"连山壮族瑶族自治县\",\"lng\":112.086555,\"lat\":24.567271,\"adcode\":441825,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"连州市\",\"lng\":112.379271,\"lat\":24.783966,\"adcode\":441882,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"清城区\",\"lng\":113.048698,\"lat\":23.688976,\"adcode\":441802,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"清新区\",\"lng\":113.015203,\"lat\":23.736949,\"adcode\":441803,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"清远市\",\"lng\":113.051227,\"lat\":23.685022,\"adcode\":441800,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"阳山县\",\"lng\":112.634019,\"lat\":24.470286,\"adcode\":441823,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"清远市\",\"n\":\"英德市\",\"lng\":113.405404,\"lat\":24.18612,\"adcode\":441881,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"潮南区\",\"lng\":116.423607,\"lat\":23.249798,\"adcode\":440514,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"潮阳区\",\"lng\":116.602602,\"lat\":23.262336,\"adcode\":440513,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"澄海区\",\"lng\":116.76336,\"lat\":23.46844,\"adcode\":440515,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"濠江区\",\"lng\":116.729528,\"lat\":23.279345,\"adcode\":440512,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"金平区\",\"lng\":116.703583,\"lat\":23.367071,\"adcode\":440511,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"龙湖区\",\"lng\":116.732015,\"lat\":23.373754,\"adcode\":440507,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"南澳县\",\"lng\":117.027105,\"lat\":23.419562,\"adcode\":440523,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕头市\",\"n\":\"汕头市\",\"lng\":116.708463,\"lat\":23.37102,\"adcode\":440500,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"汕尾市\",\"n\":\"城区\",\"lng\":115.363667,\"lat\":22.776227,\"adcode\":441502,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕尾市\",\"n\":\"海丰县\",\"lng\":115.337324,\"lat\":22.971042,\"adcode\":441521,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕尾市\",\"n\":\"陆丰市\",\"lng\":115.644203,\"lat\":22.946104,\"adcode\":441581,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕尾市\",\"n\":\"陆河县\",\"lng\":115.657565,\"lat\":23.302682,\"adcode\":441523,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"汕尾市\",\"n\":\"汕尾市\",\"lng\":115.364238,\"lat\":22.774485,\"adcode\":441500,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"乐昌市\",\"lng\":113.352413,\"lat\":25.128445,\"adcode\":440281,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"南雄市\",\"lng\":114.311231,\"lat\":25.115328,\"adcode\":440282,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"曲江区\",\"lng\":113.605582,\"lat\":24.680195,\"adcode\":440205,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"仁化县\",\"lng\":113.748627,\"lat\":25.088226,\"adcode\":440224,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"乳源瑶族自治县\",\"lng\":113.278417,\"lat\":24.776109,\"adcode\":440232,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"韶关市\",\"lng\":113.591544,\"lat\":24.801322,\"adcode\":440200,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"始兴县\",\"lng\":114.067205,\"lat\":24.948364,\"adcode\":440222,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"翁源县\",\"lng\":114.131289,\"lat\":24.353887,\"adcode\":440229,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"武江区\",\"lng\":113.588289,\"lat\":24.80016,\"adcode\":440203,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"新丰县\",\"lng\":114.207034,\"lat\":24.055412,\"adcode\":440233,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"韶关市\",\"n\":\"浈江区\",\"lng\":113.599224,\"lat\":24.803977,\"adcode\":440204,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"宝安区\",\"lng\":113.828671,\"lat\":22.754741,\"adcode\":440306,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"福田区\",\"lng\":114.05096,\"lat\":22.541009,\"adcode\":440304,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"光明区\",\"lng\":113.935895,\"lat\":22.748816,\"adcode\":440311,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"龙岗区\",\"lng\":114.251372,\"lat\":22.721511,\"adcode\":440307,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"龙华区\",\"lng\":114.044346,\"lat\":22.691963,\"adcode\":440309,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"罗湖区\",\"lng\":114.123885,\"lat\":22.555341,\"adcode\":440303,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"南山区\",\"lng\":113.92943,\"lat\":22.531221,\"adcode\":440305,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"坪山区\",\"lng\":114.338441,\"lat\":22.69423,\"adcode\":440310,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"深圳市\",\"lng\":114.085947,\"lat\":22.547,\"adcode\":440300,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"深圳市\",\"n\":\"盐田区\",\"lng\":114.235366,\"lat\":22.555069,\"adcode\":440308,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"阳江市\",\"n\":\"江城区\",\"lng\":111.968909,\"lat\":21.859182,\"adcode\":441702,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"阳江市\",\"n\":\"阳春市\",\"lng\":111.7905,\"lat\":22.169598,\"adcode\":441781,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"阳江市\",\"n\":\"阳东区\",\"lng\":112.011267,\"lat\":21.864728,\"adcode\":441704,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"阳江市\",\"n\":\"阳江市\",\"lng\":111.975107,\"lat\":21.859222,\"adcode\":441700,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"阳江市\",\"n\":\"阳西县\",\"lng\":111.617556,\"lat\":21.75367,\"adcode\":441721,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"云浮市\",\"n\":\"罗定市\",\"lng\":111.578201,\"lat\":22.765415,\"adcode\":445381,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"云浮市\",\"n\":\"新兴县\",\"lng\":112.23083,\"lat\":22.703204,\"adcode\":445321,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"云浮市\",\"n\":\"郁南县\",\"lng\":111.535921,\"lat\":23.237709,\"adcode\":445322,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"云浮市\",\"n\":\"云安区\",\"lng\":112.005609,\"lat\":23.073152,\"adcode\":445303,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"云浮市\",\"n\":\"云城区\",\"lng\":112.04471,\"lat\":22.930827,\"adcode\":445302,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"云浮市\",\"n\":\"云浮市\",\"lng\":112.044439,\"lat\":22.929801,\"adcode\":445300,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"赤坎区\",\"lng\":110.361634,\"lat\":21.273365,\"adcode\":440802,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"雷州市\",\"lng\":110.088275,\"lat\":20.908523,\"adcode\":440882,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"廉江市\",\"lng\":110.284961,\"lat\":21.611281,\"adcode\":440881,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"麻章区\",\"lng\":110.329167,\"lat\":21.265997,\"adcode\":440811,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"坡头区\",\"lng\":110.455632,\"lat\":21.24441,\"adcode\":440804,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"遂溪县\",\"lng\":110.255321,\"lat\":21.376915,\"adcode\":440823,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"吴川市\",\"lng\":110.780508,\"lat\":21.428453,\"adcode\":440883,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"霞山区\",\"lng\":110.406382,\"lat\":21.194229,\"adcode\":440803,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"徐闻县\",\"lng\":110.175718,\"lat\":20.326083,\"adcode\":440825,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"湛江市\",\"n\":\"湛江市\",\"lng\":110.364977,\"lat\":21.274898,\"adcode\":440800,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"德庆县\",\"lng\":111.78156,\"lat\":23.141711,\"adcode\":441226,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"鼎湖区\",\"lng\":112.565249,\"lat\":23.155822,\"adcode\":441203,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"端州区\",\"lng\":112.472329,\"lat\":23.052662,\"adcode\":441202,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"封开县\",\"lng\":111.502973,\"lat\":23.434731,\"adcode\":441225,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"高要区\",\"lng\":112.460846,\"lat\":23.027694,\"adcode\":441204,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"广宁县\",\"lng\":112.440419,\"lat\":23.631486,\"adcode\":441223,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"怀集县\",\"lng\":112.182466,\"lat\":23.913072,\"adcode\":441224,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"四会市\",\"lng\":112.695028,\"lat\":23.340324,\"adcode\":441284,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"肇庆市\",\"n\":\"肇庆市\",\"lng\":112.472529,\"lat\":23.051546,\"adcode\":441200,\"level\":\"city\"},{\"p\":\"广东\",\"c\":\"珠海市\",\"n\":\"斗门区\",\"lng\":113.297739,\"lat\":22.209117,\"adcode\":440403,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"珠海市\",\"n\":\"金湾区\",\"lng\":113.345071,\"lat\":22.139122,\"adcode\":440404,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"珠海市\",\"n\":\"香洲区\",\"lng\":113.55027,\"lat\":22.271249,\"adcode\":440402,\"level\":\"district\"},{\"p\":\"广东\",\"c\":\"珠海市\",\"n\":\"珠海市\",\"lng\":113.553986,\"lat\":22.224979,\"adcode\":440400,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"百色市\",\"lng\":106.616285,\"lat\":23.897742,\"adcode\":451000,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"德保县\",\"lng\":106.618164,\"lat\":23.321464,\"adcode\":451024,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"靖西市\",\"lng\":106.417549,\"lat\":23.134766,\"adcode\":451081,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"乐业县\",\"lng\":106.559638,\"lat\":24.782204,\"adcode\":451028,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"凌云县\",\"lng\":106.56487,\"lat\":24.345643,\"adcode\":451027,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"隆林各族自治县\",\"lng\":105.342363,\"lat\":24.774318,\"adcode\":451031,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"那坡县\",\"lng\":105.833553,\"lat\":23.400785,\"adcode\":451026,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"平果市\",\"lng\":107.580403,\"lat\":23.320479,\"adcode\":451082,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"田东县\",\"lng\":107.12426,\"lat\":23.600444,\"adcode\":451022,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"田林县\",\"lng\":106.235047,\"lat\":24.290262,\"adcode\":451029,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"田阳区\",\"lng\":106.904315,\"lat\":23.736079,\"adcode\":451003,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"西林县\",\"lng\":105.095025,\"lat\":24.492041,\"adcode\":451030,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"百色市\",\"n\":\"右江区\",\"lng\":106.615727,\"lat\":23.897675,\"adcode\":451002,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"北海市\",\"n\":\"北海市\",\"lng\":109.119254,\"lat\":21.473343,\"adcode\":450500,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"北海市\",\"n\":\"海城区\",\"lng\":109.107529,\"lat\":21.468443,\"adcode\":450502,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"北海市\",\"n\":\"合浦县\",\"lng\":109.200695,\"lat\":21.663554,\"adcode\":450521,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"北海市\",\"n\":\"铁山港区\",\"lng\":109.450573,\"lat\":21.5928,\"adcode\":450512,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"北海市\",\"n\":\"银海区\",\"lng\":109.118707,\"lat\":21.444909,\"adcode\":450503,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"崇左市\",\"lng\":107.353926,\"lat\":22.404108,\"adcode\":451400,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"大新县\",\"lng\":107.200803,\"lat\":22.833369,\"adcode\":451424,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"扶绥县\",\"lng\":107.911533,\"lat\":22.635821,\"adcode\":451421,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"江州区\",\"lng\":107.354443,\"lat\":22.40469,\"adcode\":451402,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"龙州县\",\"lng\":106.857502,\"lat\":22.343716,\"adcode\":451423,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"宁明县\",\"lng\":107.067616,\"lat\":22.131353,\"adcode\":451422,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"凭祥市\",\"lng\":106.759038,\"lat\":22.108882,\"adcode\":451481,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"崇左市\",\"n\":\"天等县\",\"lng\":107.142441,\"lat\":23.082484,\"adcode\":451425,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"防城港市\",\"n\":\"东兴市\",\"lng\":107.97017,\"lat\":21.541172,\"adcode\":450681,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"防城港市\",\"n\":\"防城港市\",\"lng\":108.345478,\"lat\":21.614631,\"adcode\":450600,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"防城港市\",\"n\":\"防城区\",\"lng\":108.358426,\"lat\":21.764758,\"adcode\":450603,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"防城港市\",\"n\":\"港口区\",\"lng\":108.346281,\"lat\":21.614406,\"adcode\":450602,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"防城港市\",\"n\":\"上思县\",\"lng\":107.982139,\"lat\":22.151423,\"adcode\":450621,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贵港市\",\"n\":\"港北区\",\"lng\":109.59481,\"lat\":23.107677,\"adcode\":450802,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贵港市\",\"n\":\"港南区\",\"lng\":109.604665,\"lat\":23.067516,\"adcode\":450803,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贵港市\",\"n\":\"贵港市\",\"lng\":109.602146,\"lat\":23.0936,\"adcode\":450800,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"贵港市\",\"n\":\"桂平市\",\"lng\":110.074668,\"lat\":23.382473,\"adcode\":450881,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贵港市\",\"n\":\"平南县\",\"lng\":110.397485,\"lat\":23.544546,\"adcode\":450821,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贵港市\",\"n\":\"覃塘区\",\"lng\":109.415697,\"lat\":23.132815,\"adcode\":450804,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"叠彩区\",\"lng\":110.300783,\"lat\":25.301334,\"adcode\":450303,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"恭城瑶族自治县\",\"lng\":110.82952,\"lat\":24.833612,\"adcode\":450332,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"灌阳县\",\"lng\":111.160248,\"lat\":25.489098,\"adcode\":450327,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"桂林市\",\"lng\":110.299121,\"lat\":25.274215,\"adcode\":450300,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"荔浦市\",\"lng\":110.400149,\"lat\":24.497786,\"adcode\":450381,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"临桂区\",\"lng\":110.205487,\"lat\":25.246257,\"adcode\":450312,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"灵川县\",\"lng\":110.325712,\"lat\":25.408541,\"adcode\":450323,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"龙胜各族自治县\",\"lng\":110.009423,\"lat\":25.796428,\"adcode\":450328,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"平乐县\",\"lng\":110.642821,\"lat\":24.632216,\"adcode\":450330,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"七星区\",\"lng\":110.317577,\"lat\":25.254339,\"adcode\":450305,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"全州县\",\"lng\":111.072989,\"lat\":25.929897,\"adcode\":450324,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"象山区\",\"lng\":110.284882,\"lat\":25.261986,\"adcode\":450304,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"兴安县\",\"lng\":110.670783,\"lat\":25.609554,\"adcode\":450325,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"秀峰区\",\"lng\":110.292445,\"lat\":25.278544,\"adcode\":450302,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"雁山区\",\"lng\":110.305667,\"lat\":25.077646,\"adcode\":450311,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"阳朔县\",\"lng\":110.494699,\"lat\":24.77534,\"adcode\":450321,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"永福县\",\"lng\":109.989208,\"lat\":24.986692,\"adcode\":450326,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"桂林市\",\"n\":\"资源县\",\"lng\":110.642587,\"lat\":26.0342,\"adcode\":450329,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"巴马瑶族自治县\",\"lng\":107.253126,\"lat\":24.139538,\"adcode\":451227,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"大化瑶族自治县\",\"lng\":107.9945,\"lat\":23.739596,\"adcode\":451229,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"东兰县\",\"lng\":107.373696,\"lat\":24.509367,\"adcode\":451224,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"都安瑶族自治县\",\"lng\":108.102761,\"lat\":23.934964,\"adcode\":451228,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"凤山县\",\"lng\":107.044592,\"lat\":24.544561,\"adcode\":451223,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"河池市\",\"lng\":108.062105,\"lat\":24.695899,\"adcode\":451200,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"环江毛南族自治县\",\"lng\":108.258669,\"lat\":24.827628,\"adcode\":451226,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"金城江区\",\"lng\":108.062131,\"lat\":24.695625,\"adcode\":451202,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"罗城仫佬族自治县\",\"lng\":108.902453,\"lat\":24.779327,\"adcode\":451225,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"南丹县\",\"lng\":107.546605,\"lat\":24.983192,\"adcode\":451221,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"天峨县\",\"lng\":107.174939,\"lat\":24.985964,\"adcode\":451222,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"河池市\",\"n\":\"宜州区\",\"lng\":108.653965,\"lat\":24.492193,\"adcode\":451203,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贺州市\",\"n\":\"八步区\",\"lng\":111.551991,\"lat\":24.412446,\"adcode\":451102,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贺州市\",\"n\":\"富川瑶族自治县\",\"lng\":111.277228,\"lat\":24.81896,\"adcode\":451123,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贺州市\",\"n\":\"贺州市\",\"lng\":111.552056,\"lat\":24.414141,\"adcode\":451100,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"贺州市\",\"n\":\"平桂区\",\"lng\":111.524014,\"lat\":24.417148,\"adcode\":451103,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贺州市\",\"n\":\"昭平县\",\"lng\":110.810865,\"lat\":24.172958,\"adcode\":451121,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"贺州市\",\"n\":\"钟山县\",\"lng\":111.303629,\"lat\":24.528566,\"adcode\":451122,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"合山市\",\"lng\":108.88858,\"lat\":23.81311,\"adcode\":451381,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"金秀瑶族自治县\",\"lng\":110.188556,\"lat\":24.134941,\"adcode\":451324,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"来宾市\",\"lng\":109.229772,\"lat\":23.733766,\"adcode\":451300,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"武宣县\",\"lng\":109.66287,\"lat\":23.604162,\"adcode\":451323,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"象州县\",\"lng\":109.684555,\"lat\":23.959824,\"adcode\":451322,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"忻城县\",\"lng\":108.667361,\"lat\":24.064779,\"adcode\":451321,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"来宾市\",\"n\":\"兴宾区\",\"lng\":109.230541,\"lat\":23.732926,\"adcode\":451302,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"城中区\",\"lng\":109.411749,\"lat\":24.312324,\"adcode\":450202,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"柳北区\",\"lng\":109.406577,\"lat\":24.359145,\"adcode\":450205,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"柳城县\",\"lng\":109.245812,\"lat\":24.655121,\"adcode\":450222,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"柳江区\",\"lng\":109.334503,\"lat\":24.257512,\"adcode\":450206,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"柳南区\",\"lng\":109.395936,\"lat\":24.287013,\"adcode\":450204,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"柳州市\",\"lng\":109.411703,\"lat\":24.314617,\"adcode\":450200,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"鹿寨县\",\"lng\":109.740805,\"lat\":24.483405,\"adcode\":450223,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"融安县\",\"lng\":109.403621,\"lat\":25.214703,\"adcode\":450224,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"融水苗族自治县\",\"lng\":109.252744,\"lat\":25.068812,\"adcode\":450225,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"三江侗族自治县\",\"lng\":109.614846,\"lat\":25.78553,\"adcode\":450226,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"柳州市\",\"n\":\"鱼峰区\",\"lng\":109.415364,\"lat\":24.303848,\"adcode\":450203,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"宾阳县\",\"lng\":108.816735,\"lat\":23.216884,\"adcode\":450126,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"横州市\",\"lng\":109.270987,\"lat\":22.68743,\"adcode\":450127,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"江南区\",\"lng\":108.310478,\"lat\":22.799593,\"adcode\":450105,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"良庆区\",\"lng\":108.322102,\"lat\":22.75909,\"adcode\":450108,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"隆安县\",\"lng\":107.688661,\"lat\":23.174763,\"adcode\":450123,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"马山县\",\"lng\":108.172903,\"lat\":23.711758,\"adcode\":450124,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"南宁市\",\"lng\":108.320004,\"lat\":22.82402,\"adcode\":450100,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"青秀区\",\"lng\":108.346113,\"lat\":22.816614,\"adcode\":450103,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"上林县\",\"lng\":108.603937,\"lat\":23.431769,\"adcode\":450125,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"武鸣区\",\"lng\":108.280717,\"lat\":23.157163,\"adcode\":450110,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"西乡塘区\",\"lng\":108.306903,\"lat\":22.832779,\"adcode\":450107,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"兴宁区\",\"lng\":108.320189,\"lat\":22.819511,\"adcode\":450102,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"南宁市\",\"n\":\"邕宁区\",\"lng\":108.484251,\"lat\":22.756598,\"adcode\":450109,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"钦州市\",\"n\":\"灵山县\",\"lng\":109.293468,\"lat\":22.418041,\"adcode\":450721,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"钦州市\",\"n\":\"浦北县\",\"lng\":109.556341,\"lat\":22.268335,\"adcode\":450722,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"钦州市\",\"n\":\"钦北区\",\"lng\":108.44911,\"lat\":22.132761,\"adcode\":450703,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"钦州市\",\"n\":\"钦南区\",\"lng\":108.626629,\"lat\":21.966808,\"adcode\":450702,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"钦州市\",\"n\":\"钦州市\",\"lng\":108.624175,\"lat\":21.967127,\"adcode\":450700,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"苍梧县\",\"lng\":111.544008,\"lat\":23.845097,\"adcode\":450421,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"岑溪市\",\"lng\":110.998114,\"lat\":22.918406,\"adcode\":450481,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"龙圩区\",\"lng\":111.246035,\"lat\":23.40996,\"adcode\":450406,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"蒙山县\",\"lng\":110.5226,\"lat\":24.199829,\"adcode\":450423,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"藤县\",\"lng\":110.931826,\"lat\":23.373963,\"adcode\":450422,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"万秀区\",\"lng\":111.315817,\"lat\":23.471318,\"adcode\":450403,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"梧州市\",\"lng\":111.297604,\"lat\":23.474803,\"adcode\":450400,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"梧州市\",\"n\":\"长洲区\",\"lng\":111.275678,\"lat\":23.4777,\"adcode\":450405,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"北流市\",\"lng\":110.348052,\"lat\":22.701648,\"adcode\":450981,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"博白县\",\"lng\":109.980004,\"lat\":22.271285,\"adcode\":450923,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"福绵区\",\"lng\":110.054155,\"lat\":22.58163,\"adcode\":450903,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"陆川县\",\"lng\":110.264842,\"lat\":22.321054,\"adcode\":450922,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"容县\",\"lng\":110.552467,\"lat\":22.856435,\"adcode\":450921,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"兴业县\",\"lng\":109.877768,\"lat\":22.74187,\"adcode\":450924,\"level\":\"district\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"玉林市\",\"lng\":110.154393,\"lat\":22.63136,\"adcode\":450900,\"level\":\"city\"},{\"p\":\"广西\",\"c\":\"玉林市\",\"n\":\"玉州区\",\"lng\":110.154912,\"lat\":22.632132,\"adcode\":450902,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"安顺市\",\"lng\":105.932188,\"lat\":26.245544,\"adcode\":520400,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"关岭布依族苗族自治县\",\"lng\":105.618454,\"lat\":25.944248,\"adcode\":520424,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"平坝区\",\"lng\":106.259942,\"lat\":26.40608,\"adcode\":520403,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"普定县\",\"lng\":105.745609,\"lat\":26.305794,\"adcode\":520422,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"西秀区\",\"lng\":105.946169,\"lat\":26.248323,\"adcode\":520402,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"镇宁布依族苗族自治县\",\"lng\":105.768656,\"lat\":26.056096,\"adcode\":520423,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"安顺市\",\"n\":\"紫云苗族布依族自治县\",\"lng\":106.084515,\"lat\":25.751567,\"adcode\":520425,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"毕节市\",\"lng\":105.28501,\"lat\":27.301693,\"adcode\":520500,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"大方县\",\"lng\":105.609254,\"lat\":27.143521,\"adcode\":520521,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"赫章县\",\"lng\":104.726438,\"lat\":27.119243,\"adcode\":520527,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"金沙县\",\"lng\":106.222103,\"lat\":27.459693,\"adcode\":520523,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"纳雍县\",\"lng\":105.375322,\"lat\":26.769875,\"adcode\":520525,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"七星关区\",\"lng\":105.284852,\"lat\":27.302085,\"adcode\":520502,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"黔西市\",\"lng\":106.038299,\"lat\":27.024923,\"adcode\":520522,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"威宁彝族回族苗族自治县\",\"lng\":104.286523,\"lat\":26.859099,\"adcode\":520526,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"毕节市\",\"n\":\"织金县\",\"lng\":105.768997,\"lat\":26.668497,\"adcode\":520524,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"白云区\",\"lng\":106.633037,\"lat\":26.676849,\"adcode\":520113,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"观山湖区\",\"lng\":106.626323,\"lat\":26.646358,\"adcode\":520115,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"贵阳市\",\"lng\":106.713478,\"lat\":26.578343,\"adcode\":520100,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"花溪区\",\"lng\":106.670791,\"lat\":26.410464,\"adcode\":520111,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"开阳县\",\"lng\":106.969438,\"lat\":27.056793,\"adcode\":520121,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"南明区\",\"lng\":106.715963,\"lat\":26.573743,\"adcode\":520102,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"清镇市\",\"lng\":106.470278,\"lat\":26.551289,\"adcode\":520181,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"乌当区\",\"lng\":106.762123,\"lat\":26.630928,\"adcode\":520112,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"息烽县\",\"lng\":106.737693,\"lat\":27.092665,\"adcode\":520122,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"修文县\",\"lng\":106.599218,\"lat\":26.840672,\"adcode\":520123,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"贵阳市\",\"n\":\"云岩区\",\"lng\":106.713397,\"lat\":26.58301,\"adcode\":520103,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"六盘水市\",\"n\":\"六盘水市\",\"lng\":104.846743,\"lat\":26.584643,\"adcode\":520200,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"六盘水市\",\"n\":\"六枝特区\",\"lng\":105.474235,\"lat\":26.210662,\"adcode\":520203,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"六盘水市\",\"n\":\"盘州市\",\"lng\":104.468367,\"lat\":25.706966,\"adcode\":520281,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"六盘水市\",\"n\":\"水城区\",\"lng\":104.95685,\"lat\":26.540478,\"adcode\":520221,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"六盘水市\",\"n\":\"钟山区\",\"lng\":104.846244,\"lat\":26.584805,\"adcode\":520201,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"岑巩县\",\"lng\":108.816459,\"lat\":27.173244,\"adcode\":522626,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"从江县\",\"lng\":108.912648,\"lat\":25.747058,\"adcode\":522633,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"丹寨县\",\"lng\":107.794808,\"lat\":26.199497,\"adcode\":522636,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"黄平县\",\"lng\":107.901337,\"lat\":26.896973,\"adcode\":522622,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"剑河县\",\"lng\":108.440499,\"lat\":26.727349,\"adcode\":522629,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"锦屏县\",\"lng\":109.20252,\"lat\":26.680625,\"adcode\":522628,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"凯里市\",\"lng\":107.977541,\"lat\":26.582964,\"adcode\":522601,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"雷山县\",\"lng\":108.079613,\"lat\":26.381027,\"adcode\":522634,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"黎平县\",\"lng\":109.136504,\"lat\":26.230636,\"adcode\":522631,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"麻江县\",\"lng\":107.593172,\"lat\":26.494803,\"adcode\":522635,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"黔东南苗族侗族自治州\",\"lng\":107.977488,\"lat\":26.583352,\"adcode\":522600,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"榕江县\",\"lng\":108.521026,\"lat\":25.931085,\"adcode\":522632,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"三穗县\",\"lng\":108.681121,\"lat\":26.959884,\"adcode\":522624,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"施秉县\",\"lng\":108.12678,\"lat\":27.034657,\"adcode\":522623,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"台江县\",\"lng\":108.314637,\"lat\":26.669138,\"adcode\":522630,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"天柱县\",\"lng\":109.212798,\"lat\":26.909684,\"adcode\":522627,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔东南苗族侗族自治州\",\"n\":\"镇远县\",\"lng\":108.423656,\"lat\":27.050233,\"adcode\":522625,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"都匀市\",\"lng\":107.517021,\"lat\":26.258205,\"adcode\":522701,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"独山县\",\"lng\":107.542757,\"lat\":25.826283,\"adcode\":522726,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"福泉市\",\"lng\":107.513508,\"lat\":26.702508,\"adcode\":522702,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"贵定县\",\"lng\":107.233588,\"lat\":26.580807,\"adcode\":522723,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"惠水县\",\"lng\":106.657848,\"lat\":26.128637,\"adcode\":522731,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"荔波县\",\"lng\":107.8838,\"lat\":25.412239,\"adcode\":522722,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"龙里县\",\"lng\":106.977733,\"lat\":26.448809,\"adcode\":522730,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"罗甸县\",\"lng\":106.750006,\"lat\":25.429894,\"adcode\":522728,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"平塘县\",\"lng\":107.32405,\"lat\":25.831803,\"adcode\":522727,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"黔南布依族苗族自治州\",\"lng\":107.517156,\"lat\":26.258219,\"adcode\":522700,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"三都水族自治县\",\"lng\":107.87747,\"lat\":25.985183,\"adcode\":522732,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"瓮安县\",\"lng\":107.478417,\"lat\":27.066339,\"adcode\":522725,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔南布依族苗族自治州\",\"n\":\"长顺县\",\"lng\":106.447376,\"lat\":26.022116,\"adcode\":522729,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"安龙县\",\"lng\":105.471498,\"lat\":25.108959,\"adcode\":522328,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"册亨县\",\"lng\":105.81241,\"lat\":24.983338,\"adcode\":522327,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"普安县\",\"lng\":104.955347,\"lat\":25.786404,\"adcode\":522323,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"黔西南布依族苗族自治州\",\"lng\":104.897971,\"lat\":25.08812,\"adcode\":522300,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"晴隆县\",\"lng\":105.218773,\"lat\":25.832881,\"adcode\":522324,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"望谟县\",\"lng\":106.091563,\"lat\":25.166667,\"adcode\":522326,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"兴仁市\",\"lng\":105.192778,\"lat\":25.431378,\"adcode\":522302,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"兴义市\",\"lng\":104.897982,\"lat\":25.088599,\"adcode\":522301,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"黔西南布依族苗族自治州\",\"n\":\"贞丰县\",\"lng\":105.650133,\"lat\":25.385752,\"adcode\":522325,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"碧江区\",\"lng\":109.192117,\"lat\":27.718745,\"adcode\":520602,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"德江县\",\"lng\":108.117317,\"lat\":28.26094,\"adcode\":520626,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"江口县\",\"lng\":108.848427,\"lat\":27.691904,\"adcode\":520621,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"石阡县\",\"lng\":108.229854,\"lat\":27.519386,\"adcode\":520623,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"思南县\",\"lng\":108.255827,\"lat\":27.941331,\"adcode\":520624,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"松桃苗族自治县\",\"lng\":109.202627,\"lat\":28.165419,\"adcode\":520628,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"铜仁市\",\"lng\":109.191555,\"lat\":27.718346,\"adcode\":520600,\"level\":\"city\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"万山区\",\"lng\":109.21199,\"lat\":27.51903,\"adcode\":520603,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"沿河土家族自治县\",\"lng\":108.495746,\"lat\":28.560487,\"adcode\":520627,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"印江土家族苗族自治县\",\"lng\":108.405517,\"lat\":27.997976,\"adcode\":520625,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"铜仁市\",\"n\":\"玉屏侗族自治县\",\"lng\":108.917882,\"lat\":27.238024,\"adcode\":520622,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"播州区\",\"lng\":106.831668,\"lat\":27.535288,\"adcode\":520304,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"赤水市\",\"lng\":105.698116,\"lat\":28.587057,\"adcode\":520381,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"道真仡佬族苗族自治县\",\"lng\":107.605342,\"lat\":28.880088,\"adcode\":520325,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"凤冈县\",\"lng\":107.722021,\"lat\":27.960858,\"adcode\":520327,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"红花岗区\",\"lng\":106.943784,\"lat\":27.694395,\"adcode\":520302,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"汇川区\",\"lng\":106.937265,\"lat\":27.706626,\"adcode\":520303,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"湄潭县\",\"lng\":107.485723,\"lat\":27.765839,\"adcode\":520328,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"仁怀市\",\"lng\":106.412476,\"lat\":27.803377,\"adcode\":520382,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"绥阳县\",\"lng\":107.191024,\"lat\":27.951342,\"adcode\":520323,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"桐梓县\",\"lng\":106.826591,\"lat\":28.131559,\"adcode\":520322,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"务川仡佬族苗族自治县\",\"lng\":107.887857,\"lat\":28.521567,\"adcode\":520326,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"习水县\",\"lng\":106.200954,\"lat\":28.327826,\"adcode\":520330,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"余庆县\",\"lng\":107.892566,\"lat\":27.221552,\"adcode\":520329,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"正安县\",\"lng\":107.441872,\"lat\":28.550337,\"adcode\":520324,\"level\":\"district\"},{\"p\":\"贵州\",\"c\":\"遵义市\",\"n\":\"遵义市\",\"lng\":106.937265,\"lat\":27.706626,\"adcode\":520300,\"level\":\"city\"},{\"p\":\"海南\",\"c\":\"海口市\",\"n\":\"海口市\",\"lng\":110.33119,\"lat\":20.031971,\"adcode\":460100,\"level\":\"city\"},{\"p\":\"海南\",\"c\":\"海口市\",\"n\":\"龙华区\",\"lng\":110.330373,\"lat\":20.031026,\"adcode\":460106,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"海口市\",\"n\":\"美兰区\",\"lng\":110.356566,\"lat\":20.03074,\"adcode\":460108,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"海口市\",\"n\":\"琼山区\",\"lng\":110.354722,\"lat\":20.001051,\"adcode\":460107,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"海口市\",\"n\":\"秀英区\",\"lng\":110.282393,\"lat\":20.008145,\"adcode\":460105,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"三沙市\",\"n\":\"南沙区\",\"lng\":112.891018,\"lat\":9.543575,\"adcode\":460302,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"三沙市\",\"n\":\"三沙市\",\"lng\":112.34882,\"lat\":16.831039,\"adcode\":460300,\"level\":\"city\"},{\"p\":\"海南\",\"c\":\"三沙市\",\"n\":\"西沙区\",\"lng\":112.3386402,\"lat\":16.8310066,\"adcode\":460301,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"三亚市\",\"n\":\"海棠区\",\"lng\":109.760778,\"lat\":18.407516,\"adcode\":460202,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"三亚市\",\"n\":\"吉阳区\",\"lng\":109.512081,\"lat\":18.247436,\"adcode\":460203,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"三亚市\",\"n\":\"三亚市\",\"lng\":109.508268,\"lat\":18.247872,\"adcode\":460200,\"level\":\"city\"},{\"p\":\"海南\",\"c\":\"三亚市\",\"n\":\"天涯区\",\"lng\":109.506357,\"lat\":18.24734,\"adcode\":460204,\"level\":\"district\"},{\"p\":\"海南\",\"c\":\"三亚市\",\"n\":\"崖州区\",\"lng\":109.174306,\"lat\":18.352192,\"adcode\":460205,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"安国市\",\"lng\":115.33141,\"lat\":38.421367,\"adcode\":130683,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"安新县\",\"lng\":115.931979,\"lat\":38.929912,\"adcode\":130632,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"保定市\",\"lng\":115.482331,\"lat\":38.867657,\"adcode\":130600,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"博野县\",\"lng\":115.461798,\"lat\":38.458271,\"adcode\":130637,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"定兴县\",\"lng\":115.796895,\"lat\":39.266195,\"adcode\":130626,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"定州市\",\"lng\":114.991389,\"lat\":38.517602,\"adcode\":130682,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"阜平县\",\"lng\":114.198801,\"lat\":38.847276,\"adcode\":130624,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"高碑店市\",\"lng\":115.882704,\"lat\":39.327689,\"adcode\":130684,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"高阳县\",\"lng\":115.778878,\"lat\":38.690092,\"adcode\":130628,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"竞秀区\",\"lng\":115.470659,\"lat\":38.88662,\"adcode\":130602,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"涞水县\",\"lng\":115.711985,\"lat\":39.393148,\"adcode\":130623,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"涞源县\",\"lng\":114.692567,\"lat\":39.35755,\"adcode\":130630,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"蠡县\",\"lng\":115.583631,\"lat\":38.496429,\"adcode\":130635,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"莲池区\",\"lng\":115.500934,\"lat\":38.865005,\"adcode\":130606,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"满城区\",\"lng\":115.32442,\"lat\":38.95138,\"adcode\":130607,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"清苑区\",\"lng\":115.492221,\"lat\":38.771012,\"adcode\":130608,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"曲阳县\",\"lng\":114.704055,\"lat\":38.619992,\"adcode\":130634,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"容城县\",\"lng\":115.866247,\"lat\":39.05282,\"adcode\":130629,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"顺平县\",\"lng\":115.132749,\"lat\":38.845127,\"adcode\":130636,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"唐县\",\"lng\":114.981241,\"lat\":38.748542,\"adcode\":130627,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"望都县\",\"lng\":115.154009,\"lat\":38.707448,\"adcode\":130631,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"雄县\",\"lng\":116.107474,\"lat\":38.990819,\"adcode\":130638,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"徐水区\",\"lng\":115.64941,\"lat\":39.020395,\"adcode\":130609,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"易县\",\"lng\":115.501146,\"lat\":39.35297,\"adcode\":130633,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"保定市\",\"n\":\"涿州市\",\"lng\":115.973409,\"lat\":39.485765,\"adcode\":130681,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"沧县\",\"lng\":117.007478,\"lat\":38.219856,\"adcode\":130921,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"沧州市\",\"lng\":116.857461,\"lat\":38.310582,\"adcode\":130900,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"东光县\",\"lng\":116.542062,\"lat\":37.88655,\"adcode\":130923,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"海兴县\",\"lng\":117.496606,\"lat\":38.141582,\"adcode\":130924,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"河间市\",\"lng\":116.089452,\"lat\":38.44149,\"adcode\":130984,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"黄骅市\",\"lng\":117.343803,\"lat\":38.369238,\"adcode\":130983,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"孟村回族自治县\",\"lng\":117.105104,\"lat\":38.057953,\"adcode\":130930,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"南皮县\",\"lng\":116.709171,\"lat\":38.042439,\"adcode\":130927,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"泊头市\",\"lng\":116.570163,\"lat\":38.073479,\"adcode\":130981,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"青县\",\"lng\":116.838384,\"lat\":38.569646,\"adcode\":130922,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"任丘市\",\"lng\":116.106764,\"lat\":38.706513,\"adcode\":130982,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"肃宁县\",\"lng\":115.835856,\"lat\":38.427102,\"adcode\":130926,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"吴桥县\",\"lng\":116.391512,\"lat\":37.628182,\"adcode\":130928,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"献县\",\"lng\":116.123844,\"lat\":38.189661,\"adcode\":130929,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"新华区\",\"lng\":116.873049,\"lat\":38.308273,\"adcode\":130902,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"盐山县\",\"lng\":117.229814,\"lat\":38.056141,\"adcode\":130925,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"沧州市\",\"n\":\"运河区\",\"lng\":116.840063,\"lat\":38.307405,\"adcode\":130903,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"承德市\",\"lng\":117.939152,\"lat\":40.976204,\"adcode\":130800,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"承德县\",\"lng\":118.172496,\"lat\":40.768637,\"adcode\":130821,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"丰宁满族自治县\",\"lng\":116.65121,\"lat\":41.209903,\"adcode\":130826,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"宽城满族自治县\",\"lng\":118.488642,\"lat\":40.607981,\"adcode\":130827,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"隆化县\",\"lng\":117.736343,\"lat\":41.316667,\"adcode\":130825,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"滦平县\",\"lng\":117.337124,\"lat\":40.936644,\"adcode\":130824,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"平泉市\",\"lng\":118.690238,\"lat\":41.00561,\"adcode\":130881,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"双滦区\",\"lng\":117.797485,\"lat\":40.959756,\"adcode\":130803,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"双桥区\",\"lng\":117.939152,\"lat\":40.976204,\"adcode\":130802,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"围场满族蒙古族自治县\",\"lng\":117.764086,\"lat\":41.949404,\"adcode\":130828,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"兴隆县\",\"lng\":117.507098,\"lat\":40.418525,\"adcode\":130822,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"承德市\",\"n\":\"鹰手营子矿区\",\"lng\":117.661154,\"lat\":40.546956,\"adcode\":130804,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"成安县\",\"lng\":114.680356,\"lat\":36.443832,\"adcode\":130424,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"磁县\",\"lng\":114.38208,\"lat\":36.367673,\"adcode\":130427,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"丛台区\",\"lng\":114.494703,\"lat\":36.611082,\"adcode\":130403,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"大名县\",\"lng\":115.152586,\"lat\":36.283316,\"adcode\":130425,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"肥乡区\",\"lng\":114.805154,\"lat\":36.555778,\"adcode\":130407,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"峰峰矿区\",\"lng\":114.209936,\"lat\":36.420487,\"adcode\":130406,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"复兴区\",\"lng\":114.458242,\"lat\":36.615484,\"adcode\":130404,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"馆陶县\",\"lng\":115.289057,\"lat\":36.539461,\"adcode\":130433,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"广平县\",\"lng\":114.950859,\"lat\":36.483603,\"adcode\":130432,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"邯郸市\",\"lng\":114.490686,\"lat\":36.612273,\"adcode\":130400,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"邯山区\",\"lng\":114.484989,\"lat\":36.603196,\"adcode\":130402,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"鸡泽县\",\"lng\":114.878517,\"lat\":36.914908,\"adcode\":130431,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"临漳县\",\"lng\":114.610703,\"lat\":36.337604,\"adcode\":130423,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"邱县\",\"lng\":115.168584,\"lat\":36.81325,\"adcode\":130430,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"曲周县\",\"lng\":114.957588,\"lat\":36.773398,\"adcode\":130435,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"涉县\",\"lng\":113.673297,\"lat\":36.563143,\"adcode\":130426,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"魏县\",\"lng\":114.93411,\"lat\":36.354248,\"adcode\":130434,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"武安市\",\"lng\":114.194581,\"lat\":36.696115,\"adcode\":130481,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邯郸市\",\"n\":\"永年区\",\"lng\":114.496162,\"lat\":36.776413,\"adcode\":130408,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"安平县\",\"lng\":115.519627,\"lat\":38.233511,\"adcode\":131125,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"阜城县\",\"lng\":116.164727,\"lat\":37.869945,\"adcode\":131128,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"故城县\",\"lng\":115.966747,\"lat\":37.350981,\"adcode\":131126,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"衡水市\",\"lng\":115.665993,\"lat\":37.735097,\"adcode\":131100,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"冀州区\",\"lng\":115.579173,\"lat\":37.542788,\"adcode\":131103,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"景县\",\"lng\":116.258446,\"lat\":37.686622,\"adcode\":131127,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"饶阳县\",\"lng\":115.726577,\"lat\":38.232671,\"adcode\":131124,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"深州市\",\"lng\":115.554596,\"lat\":38.00347,\"adcode\":131182,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"桃城区\",\"lng\":115.694945,\"lat\":37.732237,\"adcode\":131102,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"武强县\",\"lng\":115.970236,\"lat\":38.03698,\"adcode\":131123,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"武邑县\",\"lng\":115.892415,\"lat\":37.803774,\"adcode\":131122,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"衡水市\",\"n\":\"枣强县\",\"lng\":115.726499,\"lat\":37.511512,\"adcode\":131121,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"安次区\",\"lng\":116.694544,\"lat\":39.502569,\"adcode\":131002,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"霸州市\",\"lng\":116.392021,\"lat\":39.117331,\"adcode\":131081,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"大厂回族自治县\",\"lng\":116.986501,\"lat\":39.889266,\"adcode\":131028,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"大城县\",\"lng\":116.640735,\"lat\":38.699215,\"adcode\":131025,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"固安县\",\"lng\":116.299894,\"lat\":39.436468,\"adcode\":131022,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"广阳区\",\"lng\":116.713708,\"lat\":39.521931,\"adcode\":131003,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"廊坊市\",\"lng\":116.704441,\"lat\":39.523927,\"adcode\":131000,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"三河市\",\"lng\":117.077018,\"lat\":39.982778,\"adcode\":131082,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"文安县\",\"lng\":116.460107,\"lat\":38.866801,\"adcode\":131026,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"香河县\",\"lng\":117.007161,\"lat\":39.757212,\"adcode\":131024,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"廊坊市\",\"n\":\"永清县\",\"lng\":116.498089,\"lat\":39.319717,\"adcode\":131023,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"北戴河区\",\"lng\":119.486286,\"lat\":39.825121,\"adcode\":130304,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"昌黎县\",\"lng\":119.164541,\"lat\":39.709729,\"adcode\":130322,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"抚宁区\",\"lng\":119.240651,\"lat\":39.887053,\"adcode\":130306,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"海港区\",\"lng\":119.596224,\"lat\":39.943458,\"adcode\":130302,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"卢龙县\",\"lng\":118.881809,\"lat\":39.891639,\"adcode\":130324,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"秦皇岛市\",\"lng\":119.586579,\"lat\":39.942531,\"adcode\":130300,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"青龙满族自治县\",\"lng\":118.954555,\"lat\":40.406023,\"adcode\":130321,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"秦皇岛市\",\"n\":\"山海关区\",\"lng\":119.753591,\"lat\":39.998023,\"adcode\":130303,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"高邑县\",\"lng\":114.610699,\"lat\":37.605714,\"adcode\":130127,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"藁城区\",\"lng\":114.849647,\"lat\":38.033767,\"adcode\":130109,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"晋州市\",\"lng\":115.044886,\"lat\":38.027478,\"adcode\":130183,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"井陉矿区\",\"lng\":114.058178,\"lat\":38.069748,\"adcode\":130107,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"井陉县\",\"lng\":114.144488,\"lat\":38.033614,\"adcode\":130121,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"灵寿县\",\"lng\":114.37946,\"lat\":38.306546,\"adcode\":130126,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"鹿泉区\",\"lng\":114.321023,\"lat\":38.093994,\"adcode\":130110,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"栾城区\",\"lng\":114.654281,\"lat\":37.886911,\"adcode\":130111,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"平山县\",\"lng\":114.184144,\"lat\":38.259311,\"adcode\":130131,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"桥西区\",\"lng\":114.462931,\"lat\":38.028383,\"adcode\":130104,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"深泽县\",\"lng\":115.200207,\"lat\":38.18454,\"adcode\":130128,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"石家庄市\",\"lng\":114.502461,\"lat\":38.045474,\"adcode\":130100,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"无极县\",\"lng\":114.977845,\"lat\":38.176376,\"adcode\":130130,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"辛集市\",\"lng\":115.217451,\"lat\":37.92904,\"adcode\":130181,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"新华区\",\"lng\":114.465974,\"lat\":38.067142,\"adcode\":130105,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"新乐市\",\"lng\":114.68578,\"lat\":38.344768,\"adcode\":130184,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"行唐县\",\"lng\":114.552734,\"lat\":38.437422,\"adcode\":130125,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"裕华区\",\"lng\":114.533257,\"lat\":38.027696,\"adcode\":130108,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"元氏县\",\"lng\":114.52618,\"lat\":37.762514,\"adcode\":130132,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"赞皇县\",\"lng\":114.387756,\"lat\":37.660199,\"adcode\":130129,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"长安区\",\"lng\":114.548151,\"lat\":38.047501,\"adcode\":130102,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"赵县\",\"lng\":114.775362,\"lat\":37.754341,\"adcode\":130133,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"石家庄市\",\"n\":\"正定县\",\"lng\":114.569887,\"lat\":38.147835,\"adcode\":130123,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"曹妃甸区\",\"lng\":118.446585,\"lat\":39.278277,\"adcode\":130209,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"丰南区\",\"lng\":118.110793,\"lat\":39.56303,\"adcode\":130207,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"丰润区\",\"lng\":118.155779,\"lat\":39.831363,\"adcode\":130208,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"古冶区\",\"lng\":118.45429,\"lat\":39.715736,\"adcode\":130204,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"开平区\",\"lng\":118.264425,\"lat\":39.676171,\"adcode\":130205,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"乐亭县\",\"lng\":118.905341,\"lat\":39.42813,\"adcode\":130225,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"路北区\",\"lng\":118.174736,\"lat\":39.628538,\"adcode\":130203,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"路南区\",\"lng\":118.210821,\"lat\":39.615162,\"adcode\":130202,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"滦南县\",\"lng\":118.681552,\"lat\":39.506201,\"adcode\":130224,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"滦州市\",\"lng\":118.699546,\"lat\":39.74485,\"adcode\":130284,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"迁安市\",\"lng\":118.701933,\"lat\":40.012108,\"adcode\":130283,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"迁西县\",\"lng\":118.305139,\"lat\":40.146238,\"adcode\":130227,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"唐山市\",\"lng\":118.175393,\"lat\":39.635113,\"adcode\":130200,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"玉田县\",\"lng\":117.753665,\"lat\":39.887323,\"adcode\":130229,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"唐山市\",\"n\":\"遵化市\",\"lng\":117.965875,\"lat\":40.188616,\"adcode\":130281,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"柏乡县\",\"lng\":114.693382,\"lat\":37.483596,\"adcode\":130524,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"广宗县\",\"lng\":115.142797,\"lat\":37.075548,\"adcode\":130531,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"巨鹿县\",\"lng\":115.038782,\"lat\":37.21768,\"adcode\":130529,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"临城县\",\"lng\":114.506873,\"lat\":37.444009,\"adcode\":130522,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"临西县\",\"lng\":115.498684,\"lat\":36.8642,\"adcode\":130535,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"隆尧县\",\"lng\":114.776348,\"lat\":37.350925,\"adcode\":130525,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"南宫市\",\"lng\":115.398102,\"lat\":37.359668,\"adcode\":130581,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"南和区\",\"lng\":114.691377,\"lat\":37.003812,\"adcode\":130506,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"内丘县\",\"lng\":114.511523,\"lat\":37.287663,\"adcode\":130523,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"宁晋县\",\"lng\":114.921027,\"lat\":37.618956,\"adcode\":130528,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"平乡县\",\"lng\":115.029218,\"lat\":37.069404,\"adcode\":130532,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"清河县\",\"lng\":115.668999,\"lat\":37.059991,\"adcode\":130534,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"任泽区\",\"lng\":114.684469,\"lat\":37.129952,\"adcode\":130505,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"沙河市\",\"lng\":114.504902,\"lat\":36.861903,\"adcode\":130582,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"威县\",\"lng\":115.272749,\"lat\":36.983272,\"adcode\":130533,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"襄都区\",\"lng\":114.507131,\"lat\":37.064125,\"adcode\":130502,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"新河县\",\"lng\":115.247537,\"lat\":37.526216,\"adcode\":130530,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"信都区\",\"lng\":114.473687,\"lat\":37.068009,\"adcode\":130503,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"邢台市\",\"n\":\"邢台市\",\"lng\":114.508851,\"lat\":37.0682,\"adcode\":130500,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"赤城县\",\"lng\":115.832708,\"lat\":40.912081,\"adcode\":130732,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"崇礼区\",\"lng\":115.281652,\"lat\":40.971302,\"adcode\":130709,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"沽源县\",\"lng\":115.684836,\"lat\":41.667419,\"adcode\":130724,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"怀安县\",\"lng\":114.422364,\"lat\":40.671274,\"adcode\":130728,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"怀来县\",\"lng\":115.520846,\"lat\":40.405405,\"adcode\":130730,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"康保县\",\"lng\":114.615809,\"lat\":41.850046,\"adcode\":130723,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"桥东区\",\"lng\":114.885658,\"lat\":40.813875,\"adcode\":130702,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"桥西区\",\"lng\":114.882127,\"lat\":40.824385,\"adcode\":130703,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"尚义县\",\"lng\":113.977713,\"lat\":41.080091,\"adcode\":130725,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"万全区\",\"lng\":114.736131,\"lat\":40.765136,\"adcode\":130708,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"蔚县\",\"lng\":114.582695,\"lat\":39.837181,\"adcode\":130726,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"下花园区\",\"lng\":115.281002,\"lat\":40.488645,\"adcode\":130706,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"宣化区\",\"lng\":115.0632,\"lat\":40.609368,\"adcode\":130705,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"阳原县\",\"lng\":114.167343,\"lat\":40.113419,\"adcode\":130727,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"张北县\",\"lng\":114.715951,\"lat\":41.151713,\"adcode\":130722,\"level\":\"district\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"张家口市\",\"lng\":114.884091,\"lat\":40.811901,\"adcode\":130700,\"level\":\"city\"},{\"p\":\"河北\",\"c\":\"张家口市\",\"n\":\"涿鹿县\",\"lng\":115.219246,\"lat\":40.378701,\"adcode\":130731,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"安阳市\",\"lng\":114.352482,\"lat\":36.103442,\"adcode\":410500,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"安阳县\",\"lng\":114.130207,\"lat\":36.130585,\"adcode\":410522,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"北关区\",\"lng\":114.352646,\"lat\":36.10978,\"adcode\":410503,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"滑县\",\"lng\":114.524,\"lat\":35.574628,\"adcode\":410526,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"林州市\",\"lng\":113.823767,\"lat\":36.063403,\"adcode\":410581,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"龙安区\",\"lng\":114.323522,\"lat\":36.095568,\"adcode\":410506,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"内黄县\",\"lng\":114.904582,\"lat\":35.953702,\"adcode\":410527,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"汤阴县\",\"lng\":114.362357,\"lat\":35.922349,\"adcode\":410523,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"文峰区\",\"lng\":114.352562,\"lat\":36.098101,\"adcode\":410502,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"安阳市\",\"n\":\"殷都区\",\"lng\":114.300098,\"lat\":36.108974,\"adcode\":410505,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"鹤壁市\",\"n\":\"鹤壁市\",\"lng\":114.295444,\"lat\":35.748236,\"adcode\":410600,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"鹤壁市\",\"n\":\"鹤山区\",\"lng\":114.166551,\"lat\":35.936128,\"adcode\":410602,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"鹤壁市\",\"n\":\"浚县\",\"lng\":114.550162,\"lat\":35.671282,\"adcode\":410621,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"鹤壁市\",\"n\":\"淇滨区\",\"lng\":114.293917,\"lat\":35.748382,\"adcode\":410611,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"鹤壁市\",\"n\":\"淇县\",\"lng\":114.200379,\"lat\":35.609478,\"adcode\":410622,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"鹤壁市\",\"n\":\"山城区\",\"lng\":114.184202,\"lat\":35.896058,\"adcode\":410603,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"博爱县\",\"lng\":113.069313,\"lat\":35.170351,\"adcode\":410822,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"焦作市\",\"lng\":113.238266,\"lat\":35.23904,\"adcode\":410800,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"解放区\",\"lng\":113.226126,\"lat\":35.241353,\"adcode\":410802,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"马村区\",\"lng\":113.321703,\"lat\":35.265453,\"adcode\":410804,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"孟州市\",\"lng\":112.78708,\"lat\":34.90963,\"adcode\":410883,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"沁阳市\",\"lng\":112.934538,\"lat\":35.08901,\"adcode\":410882,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"山阳区\",\"lng\":113.26766,\"lat\":35.21476,\"adcode\":410811,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"温县\",\"lng\":113.079118,\"lat\":34.941233,\"adcode\":410825,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"武陟县\",\"lng\":113.408334,\"lat\":35.09885,\"adcode\":410823,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"修武县\",\"lng\":113.447465,\"lat\":35.229923,\"adcode\":410821,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"焦作市\",\"n\":\"中站区\",\"lng\":113.175485,\"lat\":35.236145,\"adcode\":410803,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"鼓楼区\",\"lng\":114.3485,\"lat\":34.792383,\"adcode\":410204,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"开封市\",\"lng\":114.341447,\"lat\":34.797049,\"adcode\":410200,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"兰考县\",\"lng\":114.820572,\"lat\":34.829899,\"adcode\":410225,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"龙亭区\",\"lng\":114.353348,\"lat\":34.799833,\"adcode\":410202,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"杞县\",\"lng\":114.770472,\"lat\":34.554585,\"adcode\":410221,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"顺河回族区\",\"lng\":114.364875,\"lat\":34.800459,\"adcode\":410203,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"通许县\",\"lng\":114.467734,\"lat\":34.477302,\"adcode\":410222,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"尉氏县\",\"lng\":114.193927,\"lat\":34.412256,\"adcode\":410223,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"祥符区\",\"lng\":114.437622,\"lat\":34.756476,\"adcode\":410212,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"开封市\",\"n\":\"禹王台区\",\"lng\":114.350246,\"lat\":34.779727,\"adcode\":410205,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"瀍河回族区\",\"lng\":112.491625,\"lat\":34.684738,\"adcode\":410304,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"涧西区\",\"lng\":112.399243,\"lat\":34.654251,\"adcode\":410305,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"老城区\",\"lng\":112.477298,\"lat\":34.682945,\"adcode\":410302,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"栾川县\",\"lng\":111.618386,\"lat\":33.783195,\"adcode\":410324,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"洛龙区\",\"lng\":112.456634,\"lat\":34.618557,\"adcode\":410311,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"洛宁县\",\"lng\":111.655399,\"lat\":34.387179,\"adcode\":410328,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"洛阳市\",\"lng\":112.434468,\"lat\":34.663041,\"adcode\":410300,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"孟津区\",\"lng\":112.443892,\"lat\":34.826485,\"adcode\":410306,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"汝阳县\",\"lng\":112.473789,\"lat\":34.15323,\"adcode\":410326,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"嵩县\",\"lng\":112.087765,\"lat\":34.131563,\"adcode\":410325,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"西工区\",\"lng\":112.443232,\"lat\":34.667847,\"adcode\":410303,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"新安县\",\"lng\":112.141403,\"lat\":34.728679,\"adcode\":410323,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"偃师区\",\"lng\":112.787739,\"lat\":34.723042,\"adcode\":410381,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"伊川县\",\"lng\":112.429384,\"lat\":34.423416,\"adcode\":410329,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"洛阳市\",\"n\":\"宜阳县\",\"lng\":112.179989,\"lat\":34.516478,\"adcode\":410327,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"漯河市\",\"n\":\"临颍县\",\"lng\":113.938891,\"lat\":33.80609,\"adcode\":411122,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"漯河市\",\"n\":\"漯河市\",\"lng\":114.026405,\"lat\":33.575855,\"adcode\":411100,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"漯河市\",\"n\":\"舞阳县\",\"lng\":113.610565,\"lat\":33.436278,\"adcode\":411121,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"漯河市\",\"n\":\"郾城区\",\"lng\":114.016813,\"lat\":33.588897,\"adcode\":411103,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"漯河市\",\"n\":\"源汇区\",\"lng\":114.017948,\"lat\":33.565441,\"adcode\":411102,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"漯河市\",\"n\":\"召陵区\",\"lng\":114.051686,\"lat\":33.567555,\"adcode\":411104,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"邓州市\",\"lng\":112.092716,\"lat\":32.681642,\"adcode\":411381,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"方城县\",\"lng\":113.010933,\"lat\":33.255138,\"adcode\":411322,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"南阳市\",\"lng\":112.540918,\"lat\":32.999082,\"adcode\":411300,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"南召县\",\"lng\":112.435583,\"lat\":33.488617,\"adcode\":411321,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"内乡县\",\"lng\":111.843801,\"lat\":33.046358,\"adcode\":411325,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"社旗县\",\"lng\":112.938279,\"lat\":33.056126,\"adcode\":411327,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"唐河县\",\"lng\":112.838492,\"lat\":32.687892,\"adcode\":411328,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"桐柏县\",\"lng\":113.406059,\"lat\":32.367153,\"adcode\":411330,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"宛城区\",\"lng\":112.544591,\"lat\":32.994857,\"adcode\":411302,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"卧龙区\",\"lng\":112.528789,\"lat\":32.989877,\"adcode\":411303,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"西峡县\",\"lng\":111.485772,\"lat\":33.302981,\"adcode\":411323,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"淅川县\",\"lng\":111.489026,\"lat\":33.136106,\"adcode\":411326,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"新野县\",\"lng\":112.365624,\"lat\":32.524006,\"adcode\":411329,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"南阳市\",\"n\":\"镇平县\",\"lng\":112.232722,\"lat\":33.036651,\"adcode\":411324,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"宝丰县\",\"lng\":113.066812,\"lat\":33.866359,\"adcode\":410421,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"郏县\",\"lng\":113.220451,\"lat\":33.971993,\"adcode\":410425,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"鲁山县\",\"lng\":112.906703,\"lat\":33.740325,\"adcode\":410423,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"平顶山市\",\"lng\":113.307718,\"lat\":33.735241,\"adcode\":410400,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"汝州市\",\"lng\":112.845336,\"lat\":34.167408,\"adcode\":410482,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"石龙区\",\"lng\":112.889885,\"lat\":33.901538,\"adcode\":410404,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"卫东区\",\"lng\":113.310327,\"lat\":33.739285,\"adcode\":410403,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"舞钢市\",\"lng\":113.52625,\"lat\":33.302082,\"adcode\":410481,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"新华区\",\"lng\":113.299061,\"lat\":33.737579,\"adcode\":410402,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"叶县\",\"lng\":113.358298,\"lat\":33.621252,\"adcode\":410422,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"平顶山市\",\"n\":\"湛河区\",\"lng\":113.320873,\"lat\":33.725681,\"adcode\":410411,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"范县\",\"lng\":115.504212,\"lat\":35.851977,\"adcode\":410926,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"华龙区\",\"lng\":115.03184,\"lat\":35.760473,\"adcode\":410902,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"南乐县\",\"lng\":115.204336,\"lat\":36.075204,\"adcode\":410923,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"濮阳市\",\"lng\":115.041299,\"lat\":35.768234,\"adcode\":410900,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"濮阳县\",\"lng\":115.023844,\"lat\":35.710349,\"adcode\":410928,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"清丰县\",\"lng\":115.107287,\"lat\":35.902413,\"adcode\":410922,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"濮阳市\",\"n\":\"台前县\",\"lng\":115.855681,\"lat\":35.996474,\"adcode\":410927,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"湖滨区\",\"lng\":111.19487,\"lat\":34.77812,\"adcode\":411202,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"灵宝市\",\"lng\":110.88577,\"lat\":34.521264,\"adcode\":411282,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"卢氏县\",\"lng\":111.052649,\"lat\":34.053995,\"adcode\":411224,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"渑池县\",\"lng\":111.762992,\"lat\":34.763487,\"adcode\":411221,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"三门峡市\",\"lng\":111.194099,\"lat\":34.777338,\"adcode\":411200,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"陕州区\",\"lng\":111.103851,\"lat\":34.720244,\"adcode\":411203,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"三门峡市\",\"n\":\"义马市\",\"lng\":111.869417,\"lat\":34.746868,\"adcode\":411281,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"梁园区\",\"lng\":115.65459,\"lat\":34.436553,\"adcode\":411402,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"民权县\",\"lng\":115.148146,\"lat\":34.648455,\"adcode\":411421,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"宁陵县\",\"lng\":115.320055,\"lat\":34.449299,\"adcode\":411423,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"商丘市\",\"lng\":115.650497,\"lat\":34.437054,\"adcode\":411400,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"睢县\",\"lng\":115.070109,\"lat\":34.428433,\"adcode\":411422,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"睢阳区\",\"lng\":115.653813,\"lat\":34.390536,\"adcode\":411403,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"夏邑县\",\"lng\":116.13989,\"lat\":34.240894,\"adcode\":411426,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"永城市\",\"lng\":116.449672,\"lat\":33.931318,\"adcode\":411481,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"虞城县\",\"lng\":115.863811,\"lat\":34.399634,\"adcode\":411425,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"商丘市\",\"n\":\"柘城县\",\"lng\":115.307433,\"lat\":34.075277,\"adcode\":411424,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"封丘县\",\"lng\":114.423405,\"lat\":35.04057,\"adcode\":410727,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"凤泉区\",\"lng\":113.906712,\"lat\":35.379855,\"adcode\":410704,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"红旗区\",\"lng\":113.878158,\"lat\":35.302684,\"adcode\":410702,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"辉县市\",\"lng\":113.802518,\"lat\":35.461318,\"adcode\":410782,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"获嘉县\",\"lng\":113.657249,\"lat\":35.261685,\"adcode\":410724,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"牧野区\",\"lng\":113.89716,\"lat\":35.312974,\"adcode\":410711,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"卫滨区\",\"lng\":113.866065,\"lat\":35.304905,\"adcode\":410703,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"卫辉市\",\"lng\":114.065855,\"lat\":35.404295,\"adcode\":410781,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"新乡市\",\"lng\":113.883991,\"lat\":35.302616,\"adcode\":410700,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"新乡县\",\"lng\":113.806186,\"lat\":35.190021,\"adcode\":410721,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"延津县\",\"lng\":114.200982,\"lat\":35.149515,\"adcode\":410726,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"原阳县\",\"lng\":113.965966,\"lat\":35.054001,\"adcode\":410725,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"新乡市\",\"n\":\"长垣市\",\"lng\":114.673807,\"lat\":35.19615,\"adcode\":410783,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"固始县\",\"lng\":115.667328,\"lat\":32.183074,\"adcode\":411525,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"光山县\",\"lng\":114.903577,\"lat\":32.010398,\"adcode\":411522,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"淮滨县\",\"lng\":115.415451,\"lat\":32.452639,\"adcode\":411527,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"潢川县\",\"lng\":115.050123,\"lat\":32.134024,\"adcode\":411526,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"罗山县\",\"lng\":114.533414,\"lat\":32.203206,\"adcode\":411521,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"平桥区\",\"lng\":114.126027,\"lat\":32.098395,\"adcode\":411503,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"商城县\",\"lng\":115.406297,\"lat\":31.799982,\"adcode\":411524,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"浉河区\",\"lng\":114.075031,\"lat\":32.123274,\"adcode\":411502,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"息县\",\"lng\":114.740713,\"lat\":32.344744,\"adcode\":411528,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"新县\",\"lng\":114.87705,\"lat\":31.63515,\"adcode\":411523,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"信阳市\",\"n\":\"信阳市\",\"lng\":114.075031,\"lat\":32.123274,\"adcode\":411500,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"建安区\",\"lng\":113.842898,\"lat\":34.005018,\"adcode\":411003,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"魏都区\",\"lng\":113.828307,\"lat\":34.02711,\"adcode\":411002,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"襄城县\",\"lng\":113.493166,\"lat\":33.855943,\"adcode\":411025,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"许昌市\",\"lng\":113.826063,\"lat\":34.022956,\"adcode\":411000,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"鄢陵县\",\"lng\":114.188507,\"lat\":34.100502,\"adcode\":411024,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"禹州市\",\"lng\":113.471316,\"lat\":34.154403,\"adcode\":411081,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"许昌市\",\"n\":\"长葛市\",\"lng\":113.768912,\"lat\":34.219257,\"adcode\":411082,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"登封市\",\"lng\":113.037768,\"lat\":34.459939,\"adcode\":410185,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"二七区\",\"lng\":113.645422,\"lat\":34.730936,\"adcode\":410103,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"巩义市\",\"lng\":112.98283,\"lat\":34.75218,\"adcode\":410181,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"管城回族区\",\"lng\":113.685313,\"lat\":34.746453,\"adcode\":410104,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"惠济区\",\"lng\":113.61836,\"lat\":34.828591,\"adcode\":410108,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"金水区\",\"lng\":113.686037,\"lat\":34.775838,\"adcode\":410105,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"上街区\",\"lng\":113.298282,\"lat\":34.808689,\"adcode\":410106,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"新密市\",\"lng\":113.380616,\"lat\":34.537846,\"adcode\":410183,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"新郑市\",\"lng\":113.73967,\"lat\":34.394219,\"adcode\":410184,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"荥阳市\",\"lng\":113.391523,\"lat\":34.789077,\"adcode\":410182,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"郑州市\",\"lng\":113.665412,\"lat\":34.757975,\"adcode\":410100,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"中牟县\",\"lng\":114.022521,\"lat\":34.721976,\"adcode\":410122,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"郑州市\",\"n\":\"中原区\",\"lng\":113.611576,\"lat\":34.748286,\"adcode\":410102,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"川汇区\",\"lng\":114.652136,\"lat\":33.614836,\"adcode\":411602,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"郸城县\",\"lng\":115.189,\"lat\":33.643852,\"adcode\":411625,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"扶沟县\",\"lng\":114.392008,\"lat\":34.054061,\"adcode\":411621,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"淮阳区\",\"lng\":114.870166,\"lat\":33.732547,\"adcode\":411603,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"鹿邑县\",\"lng\":115.486386,\"lat\":33.861067,\"adcode\":411628,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"商水县\",\"lng\":114.60927,\"lat\":33.543845,\"adcode\":411623,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"沈丘县\",\"lng\":115.078375,\"lat\":33.395514,\"adcode\":411624,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"太康县\",\"lng\":114.853834,\"lat\":34.065312,\"adcode\":411627,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"西华县\",\"lng\":114.530067,\"lat\":33.784378,\"adcode\":411622,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"项城市\",\"lng\":114.899521,\"lat\":33.443085,\"adcode\":411681,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"周口市\",\"n\":\"周口市\",\"lng\":114.649653,\"lat\":33.620357,\"adcode\":411600,\"level\":\"city\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"泌阳县\",\"lng\":113.32605,\"lat\":32.725129,\"adcode\":411726,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"平舆县\",\"lng\":114.637105,\"lat\":32.955626,\"adcode\":411723,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"确山县\",\"lng\":114.026679,\"lat\":32.801538,\"adcode\":411725,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"汝南县\",\"lng\":114.359495,\"lat\":33.004535,\"adcode\":411727,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"上蔡县\",\"lng\":114.266892,\"lat\":33.264719,\"adcode\":411722,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"遂平县\",\"lng\":114.00371,\"lat\":33.14698,\"adcode\":411728,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"西平县\",\"lng\":114.026864,\"lat\":33.382315,\"adcode\":411721,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"新蔡县\",\"lng\":114.975246,\"lat\":32.749948,\"adcode\":411729,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"驿城区\",\"lng\":114.029149,\"lat\":32.977559,\"adcode\":411702,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"正阳县\",\"lng\":114.38948,\"lat\":32.601826,\"adcode\":411724,\"level\":\"district\"},{\"p\":\"河南\",\"c\":\"驻马店市\",\"n\":\"驻马店市\",\"lng\":114.024736,\"lat\":32.980169,\"adcode\":411700,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"大庆市\",\"lng\":125.11272,\"lat\":46.590734,\"adcode\":230600,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"大同区\",\"lng\":124.818509,\"lat\":46.034304,\"adcode\":230606,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"杜尔伯特蒙古族自治县\",\"lng\":124.446259,\"lat\":46.865973,\"adcode\":230624,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"红岗区\",\"lng\":124.889528,\"lat\":46.403049,\"adcode\":230605,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"林甸县\",\"lng\":124.877742,\"lat\":47.186411,\"adcode\":230623,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"龙凤区\",\"lng\":125.145794,\"lat\":46.573948,\"adcode\":230603,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"让胡路区\",\"lng\":124.868341,\"lat\":46.653254,\"adcode\":230604,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"萨尔图区\",\"lng\":125.114643,\"lat\":46.596356,\"adcode\":230602,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"肇源县\",\"lng\":125.081974,\"lat\":45.518832,\"adcode\":230622,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大庆市\",\"n\":\"肇州县\",\"lng\":125.273254,\"lat\":45.708685,\"adcode\":230621,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大兴安岭地区\",\"n\":\"大兴安岭地区\",\"lng\":124.711526,\"lat\":52.335262,\"adcode\":232700,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"大兴安岭地区\",\"n\":\"呼玛县\",\"lng\":126.662105,\"lat\":51.726998,\"adcode\":232721,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大兴安岭地区\",\"n\":\"加格达奇区\",\"lng\":124.126716,\"lat\":50.424654,\"adcode\":232718,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大兴安岭地区\",\"n\":\"漠河市\",\"lng\":122.536256,\"lat\":52.972074,\"adcode\":232701,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"大兴安岭地区\",\"n\":\"塔河县\",\"lng\":124.710516,\"lat\":52.335229,\"adcode\":232722,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"阿城区\",\"lng\":126.972726,\"lat\":45.538372,\"adcode\":230112,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"巴彦县\",\"lng\":127.403602,\"lat\":46.081889,\"adcode\":230126,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"宾县\",\"lng\":127.48594,\"lat\":45.759369,\"adcode\":230125,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"道里区\",\"lng\":126.612532,\"lat\":45.762035,\"adcode\":230102,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"道外区\",\"lng\":126.648838,\"lat\":45.78454,\"adcode\":230104,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"方正县\",\"lng\":128.836131,\"lat\":45.839536,\"adcode\":230124,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"哈尔滨市\",\"lng\":126.642464,\"lat\":45.756967,\"adcode\":230100,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"呼兰区\",\"lng\":126.603302,\"lat\":45.98423,\"adcode\":230111,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"木兰县\",\"lng\":128.042675,\"lat\":45.949826,\"adcode\":230127,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"南岗区\",\"lng\":126.652098,\"lat\":45.755971,\"adcode\":230103,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"平房区\",\"lng\":126.629257,\"lat\":45.605567,\"adcode\":230108,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"尚志市\",\"lng\":127.968539,\"lat\":45.214953,\"adcode\":230183,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"双城区\",\"lng\":126.308784,\"lat\":45.377942,\"adcode\":230113,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"松北区\",\"lng\":126.563066,\"lat\":45.814656,\"adcode\":230109,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"通河县\",\"lng\":128.747786,\"lat\":45.977618,\"adcode\":230128,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"五常市\",\"lng\":127.15759,\"lat\":44.919418,\"adcode\":230184,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"香坊区\",\"lng\":126.667049,\"lat\":45.713067,\"adcode\":230110,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"延寿县\",\"lng\":128.331886,\"lat\":45.455648,\"adcode\":230129,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"哈尔滨市\",\"n\":\"依兰县\",\"lng\":129.565594,\"lat\":46.315105,\"adcode\":230123,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"东山区\",\"lng\":130.31714,\"lat\":47.337385,\"adcode\":230406,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"工农区\",\"lng\":130.276652,\"lat\":47.331678,\"adcode\":230403,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"鹤岗市\",\"lng\":130.277487,\"lat\":47.332085,\"adcode\":230400,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"萝北县\",\"lng\":130.829087,\"lat\":47.577577,\"adcode\":230421,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"南山区\",\"lng\":130.275533,\"lat\":47.31324,\"adcode\":230404,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"绥滨县\",\"lng\":131.860526,\"lat\":47.289892,\"adcode\":230422,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"向阳区\",\"lng\":130.292478,\"lat\":47.345372,\"adcode\":230402,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"兴安区\",\"lng\":130.236169,\"lat\":47.252911,\"adcode\":230405,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鹤岗市\",\"n\":\"兴山区\",\"lng\":130.30534,\"lat\":47.35997,\"adcode\":230407,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"爱辉区\",\"lng\":127.497639,\"lat\":50.249027,\"adcode\":231102,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"北安市\",\"lng\":126.508737,\"lat\":48.245437,\"adcode\":231181,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"黑河市\",\"lng\":127.499023,\"lat\":50.249585,\"adcode\":231100,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"嫩江市\",\"lng\":125.229904,\"lat\":49.177461,\"adcode\":231183,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"孙吴县\",\"lng\":127.327315,\"lat\":49.423941,\"adcode\":231124,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"五大连池市\",\"lng\":126.197694,\"lat\":48.512688,\"adcode\":231182,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"黑河市\",\"n\":\"逊克县\",\"lng\":128.476152,\"lat\":49.582974,\"adcode\":231123,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"城子河区\",\"lng\":131.010501,\"lat\":45.338248,\"adcode\":230306,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"滴道区\",\"lng\":130.846823,\"lat\":45.348812,\"adcode\":230304,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"恒山区\",\"lng\":130.910636,\"lat\":45.213242,\"adcode\":230303,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"虎林市\",\"lng\":132.973881,\"lat\":45.767985,\"adcode\":230381,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"鸡东县\",\"lng\":131.148907,\"lat\":45.250892,\"adcode\":230321,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"鸡冠区\",\"lng\":130.974374,\"lat\":45.30034,\"adcode\":230302,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"鸡西市\",\"lng\":130.975966,\"lat\":45.300046,\"adcode\":230300,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"梨树区\",\"lng\":130.697781,\"lat\":45.092195,\"adcode\":230305,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"麻山区\",\"lng\":130.481126,\"lat\":45.209607,\"adcode\":230307,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"鸡西市\",\"n\":\"密山市\",\"lng\":131.874137,\"lat\":45.54725,\"adcode\":230382,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"东风区\",\"lng\":130.403297,\"lat\":46.822476,\"adcode\":230805,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"抚远市\",\"lng\":134.294501,\"lat\":48.364707,\"adcode\":230883,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"富锦市\",\"lng\":132.037951,\"lat\":47.250747,\"adcode\":230882,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"桦川县\",\"lng\":130.723713,\"lat\":47.023039,\"adcode\":230826,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"桦南县\",\"lng\":130.570112,\"lat\":46.240118,\"adcode\":230822,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"佳木斯市\",\"lng\":130.361634,\"lat\":46.809606,\"adcode\":230800,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"郊区\",\"lng\":130.351588,\"lat\":46.80712,\"adcode\":230811,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"前进区\",\"lng\":130.377684,\"lat\":46.812345,\"adcode\":230804,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"汤原县\",\"lng\":129.904463,\"lat\":46.730048,\"adcode\":230828,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"同江市\",\"lng\":132.510119,\"lat\":47.651131,\"adcode\":230881,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"佳木斯市\",\"n\":\"向阳区\",\"lng\":130.361786,\"lat\":46.809645,\"adcode\":230803,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"爱民区\",\"lng\":129.601232,\"lat\":44.595443,\"adcode\":231004,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"东安区\",\"lng\":129.623292,\"lat\":44.582399,\"adcode\":231002,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"东宁市\",\"lng\":131.125296,\"lat\":44.063578,\"adcode\":231086,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"海林市\",\"lng\":129.387902,\"lat\":44.574149,\"adcode\":231083,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"林口县\",\"lng\":130.268402,\"lat\":45.286645,\"adcode\":231025,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"牡丹江市\",\"lng\":129.618602,\"lat\":44.582962,\"adcode\":231000,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"穆棱市\",\"lng\":130.527085,\"lat\":44.91967,\"adcode\":231085,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"宁安市\",\"lng\":129.470019,\"lat\":44.346836,\"adcode\":231084,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"绥芬河市\",\"lng\":131.164856,\"lat\":44.396864,\"adcode\":231081,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"西安区\",\"lng\":129.61311,\"lat\":44.581032,\"adcode\":231005,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"牡丹江市\",\"n\":\"阳明区\",\"lng\":129.634645,\"lat\":44.596328,\"adcode\":231003,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"七台河市\",\"n\":\"勃利县\",\"lng\":130.575025,\"lat\":45.751573,\"adcode\":230921,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"七台河市\",\"n\":\"茄子河区\",\"lng\":131.071561,\"lat\":45.776587,\"adcode\":230904,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"七台河市\",\"n\":\"七台河市\",\"lng\":131.015584,\"lat\":45.771266,\"adcode\":230900,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"七台河市\",\"n\":\"桃山区\",\"lng\":131.015848,\"lat\":45.771217,\"adcode\":230903,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"七台河市\",\"n\":\"新兴区\",\"lng\":130.889482,\"lat\":45.794258,\"adcode\":230902,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"昂昂溪区\",\"lng\":123.813181,\"lat\":47.156867,\"adcode\":230205,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"拜泉县\",\"lng\":126.091911,\"lat\":47.607363,\"adcode\":230231,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"富拉尔基区\",\"lng\":123.638873,\"lat\":47.20697,\"adcode\":230206,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"富裕县\",\"lng\":124.469106,\"lat\":47.797172,\"adcode\":230227,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"甘南县\",\"lng\":123.506034,\"lat\":47.917838,\"adcode\":230225,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"建华区\",\"lng\":123.955888,\"lat\":47.354494,\"adcode\":230203,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"克东县\",\"lng\":126.249094,\"lat\":48.03732,\"adcode\":230230,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"克山县\",\"lng\":125.874355,\"lat\":48.034342,\"adcode\":230229,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"龙江县\",\"lng\":123.187225,\"lat\":47.336388,\"adcode\":230221,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"龙沙区\",\"lng\":123.957338,\"lat\":47.341736,\"adcode\":230202,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"梅里斯达斡尔族区\",\"lng\":123.754599,\"lat\":47.311113,\"adcode\":230208,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"讷河市\",\"lng\":124.882172,\"lat\":48.481133,\"adcode\":230281,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"碾子山区\",\"lng\":122.887972,\"lat\":47.51401,\"adcode\":230207,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"齐齐哈尔市\",\"lng\":123.95792,\"lat\":47.342081,\"adcode\":230200,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"泰来县\",\"lng\":123.41953,\"lat\":46.39233,\"adcode\":230224,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"铁锋区\",\"lng\":123.973555,\"lat\":47.339499,\"adcode\":230204,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"齐齐哈尔市\",\"n\":\"依安县\",\"lng\":125.307561,\"lat\":47.890098,\"adcode\":230223,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"宝清县\",\"lng\":132.206415,\"lat\":46.328781,\"adcode\":230523,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"宝山区\",\"lng\":131.404294,\"lat\":46.573366,\"adcode\":230506,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"集贤县\",\"lng\":131.13933,\"lat\":46.72898,\"adcode\":230521,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"尖山区\",\"lng\":131.15896,\"lat\":46.642961,\"adcode\":230502,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"岭东区\",\"lng\":131.163675,\"lat\":46.591076,\"adcode\":230503,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"饶河县\",\"lng\":134.021162,\"lat\":46.801288,\"adcode\":230524,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"双鸭山市\",\"lng\":131.157304,\"lat\":46.643442,\"adcode\":230500,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"四方台区\",\"lng\":131.333181,\"lat\":46.594347,\"adcode\":230505,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"双鸭山市\",\"n\":\"友谊县\",\"lng\":131.810622,\"lat\":46.775159,\"adcode\":230522,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"安达市\",\"lng\":125.329926,\"lat\":46.410614,\"adcode\":231281,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"北林区\",\"lng\":126.990665,\"lat\":46.634912,\"adcode\":231202,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"海伦市\",\"lng\":126.969383,\"lat\":47.460428,\"adcode\":231283,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"兰西县\",\"lng\":126.289315,\"lat\":46.259037,\"adcode\":231222,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"明水县\",\"lng\":125.907544,\"lat\":47.183527,\"adcode\":231225,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"青冈县\",\"lng\":126.112268,\"lat\":46.686596,\"adcode\":231223,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"庆安县\",\"lng\":127.510024,\"lat\":46.879203,\"adcode\":231224,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"绥化市\",\"lng\":126.99293,\"lat\":46.637393,\"adcode\":231200,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"绥棱县\",\"lng\":127.111121,\"lat\":47.247195,\"adcode\":231226,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"望奎县\",\"lng\":126.484191,\"lat\":46.83352,\"adcode\":231221,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"绥化市\",\"n\":\"肇东市\",\"lng\":125.991402,\"lat\":46.069471,\"adcode\":231282,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"大箐山县\",\"lng\":129.020793,\"lat\":47.028397,\"adcode\":230725,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"丰林县\",\"lng\":129.5336,\"lat\":48.290455,\"adcode\":230724,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"嘉荫县\",\"lng\":130.397684,\"lat\":48.891378,\"adcode\":230722,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"金林区\",\"lng\":129.429117,\"lat\":47.413074,\"adcode\":230751,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"南岔县\",\"lng\":129.28246,\"lat\":47.137314,\"adcode\":230726,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"汤旺县\",\"lng\":129.571108,\"lat\":48.454651,\"adcode\":230723,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"铁力市\",\"lng\":128.030561,\"lat\":46.985772,\"adcode\":230781,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"乌翠区\",\"lng\":128.669859,\"lat\":47.726728,\"adcode\":230718,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"伊春市\",\"lng\":128.899396,\"lat\":47.724775,\"adcode\":230700,\"level\":\"city\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"伊美区\",\"lng\":128.907303,\"lat\":47.728171,\"adcode\":230717,\"level\":\"district\"},{\"p\":\"黑龙江\",\"c\":\"伊春市\",\"n\":\"友好区\",\"lng\":128.84075,\"lat\":47.853778,\"adcode\":230719,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"鄂州市\",\"n\":\"鄂城区\",\"lng\":114.890012,\"lat\":30.39669,\"adcode\":420704,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"鄂州市\",\"n\":\"鄂州市\",\"lng\":114.890593,\"lat\":30.396536,\"adcode\":420700,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"鄂州市\",\"n\":\"华容区\",\"lng\":114.74148,\"lat\":30.534468,\"adcode\":420703,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"鄂州市\",\"n\":\"梁子湖区\",\"lng\":114.681967,\"lat\":30.098191,\"adcode\":420702,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"巴东县\",\"lng\":110.336665,\"lat\":31.041403,\"adcode\":422823,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"恩施市\",\"lng\":109.486761,\"lat\":30.282406,\"adcode\":422801,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"恩施土家族苗族自治州\",\"lng\":109.48699,\"lat\":30.283114,\"adcode\":422800,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"鹤峰县\",\"lng\":110.033699,\"lat\":29.887298,\"adcode\":422828,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"建始县\",\"lng\":109.723822,\"lat\":30.601632,\"adcode\":422822,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"来凤县\",\"lng\":109.408328,\"lat\":29.506945,\"adcode\":422827,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"利川市\",\"lng\":108.943491,\"lat\":30.294247,\"adcode\":422802,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"咸丰县\",\"lng\":109.15041,\"lat\":29.678967,\"adcode\":422826,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"恩施土家族苗族自治州\",\"n\":\"宣恩县\",\"lng\":109.482819,\"lat\":29.98867,\"adcode\":422825,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"红安县\",\"lng\":114.615095,\"lat\":31.284777,\"adcode\":421122,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"黄冈市\",\"lng\":114.879365,\"lat\":30.447711,\"adcode\":421100,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"黄梅县\",\"lng\":115.942548,\"lat\":30.075113,\"adcode\":421127,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"黄州区\",\"lng\":114.878934,\"lat\":30.447435,\"adcode\":421102,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"罗田县\",\"lng\":115.398984,\"lat\":30.781679,\"adcode\":421123,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"麻城市\",\"lng\":115.02541,\"lat\":31.177906,\"adcode\":421181,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"蕲春县\",\"lng\":115.433964,\"lat\":30.234927,\"adcode\":421126,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"团风县\",\"lng\":114.872029,\"lat\":30.63569,\"adcode\":421121,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"武穴市\",\"lng\":115.56242,\"lat\":29.849342,\"adcode\":421182,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"浠水县\",\"lng\":115.26344,\"lat\":30.454837,\"adcode\":421125,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄冈市\",\"n\":\"英山县\",\"lng\":115.67753,\"lat\":30.735794,\"adcode\":421124,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"大冶市\",\"lng\":114.974842,\"lat\":30.098804,\"adcode\":420281,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"黄石港区\",\"lng\":115.090164,\"lat\":30.212086,\"adcode\":420202,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"黄石市\",\"lng\":115.077048,\"lat\":30.220074,\"adcode\":420200,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"铁山区\",\"lng\":114.901366,\"lat\":30.20601,\"adcode\":420205,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"西塞山区\",\"lng\":115.093354,\"lat\":30.205365,\"adcode\":420203,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"下陆区\",\"lng\":114.975755,\"lat\":30.177845,\"adcode\":420204,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"黄石市\",\"n\":\"阳新县\",\"lng\":115.212883,\"lat\":29.841572,\"adcode\":420222,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆门市\",\"n\":\"东宝区\",\"lng\":112.204804,\"lat\":31.033461,\"adcode\":420802,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆门市\",\"n\":\"掇刀区\",\"lng\":112.198413,\"lat\":30.980798,\"adcode\":420804,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆门市\",\"n\":\"京山市\",\"lng\":113.114595,\"lat\":31.022457,\"adcode\":420882,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆门市\",\"n\":\"荆门市\",\"lng\":112.204251,\"lat\":31.03542,\"adcode\":420800,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"荆门市\",\"n\":\"沙洋县\",\"lng\":112.595218,\"lat\":30.70359,\"adcode\":420822,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆门市\",\"n\":\"钟祥市\",\"lng\":112.587267,\"lat\":31.165573,\"adcode\":420881,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"公安县\",\"lng\":112.230179,\"lat\":30.059065,\"adcode\":421022,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"洪湖市\",\"lng\":113.470304,\"lat\":29.81297,\"adcode\":421083,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"监利市\",\"lng\":112.904344,\"lat\":29.820079,\"adcode\":421023,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"江陵县\",\"lng\":112.41735,\"lat\":30.033919,\"adcode\":421024,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"荆州区\",\"lng\":112.195354,\"lat\":30.350674,\"adcode\":421003,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"荆州市\",\"lng\":112.23813,\"lat\":30.326857,\"adcode\":421000,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"沙市区\",\"lng\":112.257433,\"lat\":30.315895,\"adcode\":421002,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"石首市\",\"lng\":112.40887,\"lat\":29.716437,\"adcode\":421081,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"荆州市\",\"n\":\"松滋市\",\"lng\":111.77818,\"lat\":30.176037,\"adcode\":421087,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"丹江口市\",\"lng\":111.513793,\"lat\":32.538839,\"adcode\":420381,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"房县\",\"lng\":110.741966,\"lat\":32.055002,\"adcode\":420325,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"茅箭区\",\"lng\":110.78621,\"lat\":32.644463,\"adcode\":420302,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"十堰市\",\"lng\":110.787916,\"lat\":32.646907,\"adcode\":420300,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"郧西县\",\"lng\":110.426472,\"lat\":32.991457,\"adcode\":420322,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"郧阳区\",\"lng\":110.812099,\"lat\":32.838267,\"adcode\":420304,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"张湾区\",\"lng\":110.772365,\"lat\":32.652516,\"adcode\":420303,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"竹山县\",\"lng\":110.2296,\"lat\":32.22586,\"adcode\":420323,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"十堰市\",\"n\":\"竹溪县\",\"lng\":109.717196,\"lat\":32.315342,\"adcode\":420324,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"随州市\",\"n\":\"曾都区\",\"lng\":113.374519,\"lat\":31.717521,\"adcode\":421303,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"随州市\",\"n\":\"广水市\",\"lng\":113.826601,\"lat\":31.617731,\"adcode\":421381,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"随州市\",\"n\":\"随县\",\"lng\":113.301384,\"lat\":31.854246,\"adcode\":421321,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"随州市\",\"n\":\"随州市\",\"lng\":113.37377,\"lat\":31.717497,\"adcode\":421300,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"蔡甸区\",\"lng\":114.029341,\"lat\":30.582186,\"adcode\":420114,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"东西湖区\",\"lng\":114.142483,\"lat\":30.622467,\"adcode\":420112,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"汉南区\",\"lng\":114.08124,\"lat\":30.309637,\"adcode\":420113,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"汉阳区\",\"lng\":114.265807,\"lat\":30.549326,\"adcode\":420105,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"洪山区\",\"lng\":114.400718,\"lat\":30.504259,\"adcode\":420111,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"黄陂区\",\"lng\":114.374025,\"lat\":30.874155,\"adcode\":420116,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"江岸区\",\"lng\":114.30304,\"lat\":30.594911,\"adcode\":420102,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"江汉区\",\"lng\":114.283109,\"lat\":30.578771,\"adcode\":420103,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"江夏区\",\"lng\":114.313961,\"lat\":30.349045,\"adcode\":420115,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"硚口区\",\"lng\":114.264568,\"lat\":30.57061,\"adcode\":420104,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"青山区\",\"lng\":114.39707,\"lat\":30.634215,\"adcode\":420107,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"武昌区\",\"lng\":114.307344,\"lat\":30.546536,\"adcode\":420106,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"武汉市\",\"lng\":114.298572,\"lat\":30.584355,\"adcode\":420100,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"武汉市\",\"n\":\"新洲区\",\"lng\":114.802108,\"lat\":30.842149,\"adcode\":420117,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"赤壁市\",\"lng\":113.88366,\"lat\":29.716879,\"adcode\":421281,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"崇阳县\",\"lng\":114.049958,\"lat\":29.54101,\"adcode\":421223,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"嘉鱼县\",\"lng\":113.921547,\"lat\":29.973363,\"adcode\":421221,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"通城县\",\"lng\":113.814131,\"lat\":29.246076,\"adcode\":421222,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"通山县\",\"lng\":114.493163,\"lat\":29.604455,\"adcode\":421224,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"咸安区\",\"lng\":114.333894,\"lat\":29.824716,\"adcode\":421202,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"咸宁市\",\"n\":\"咸宁市\",\"lng\":114.328963,\"lat\":29.832798,\"adcode\":421200,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"保康县\",\"lng\":111.262235,\"lat\":31.873507,\"adcode\":420626,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"樊城区\",\"lng\":112.13957,\"lat\":32.058589,\"adcode\":420606,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"谷城县\",\"lng\":111.640147,\"lat\":32.262676,\"adcode\":420625,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"老河口市\",\"lng\":111.675732,\"lat\":32.385438,\"adcode\":420682,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"南漳县\",\"lng\":111.844424,\"lat\":31.77692,\"adcode\":420624,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"襄城区\",\"lng\":112.150327,\"lat\":32.015088,\"adcode\":420602,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"襄阳市\",\"lng\":112.144146,\"lat\":32.042426,\"adcode\":420600,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"襄州区\",\"lng\":112.197378,\"lat\":32.085517,\"adcode\":420607,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"宜城市\",\"lng\":112.261441,\"lat\":31.709203,\"adcode\":420684,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"襄阳市\",\"n\":\"枣阳市\",\"lng\":112.765268,\"lat\":32.123083,\"adcode\":420683,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"安陆市\",\"lng\":113.690401,\"lat\":31.26174,\"adcode\":420982,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"大悟县\",\"lng\":114.126249,\"lat\":31.565483,\"adcode\":420922,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"汉川市\",\"lng\":113.835301,\"lat\":30.652165,\"adcode\":420984,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"孝昌县\",\"lng\":113.988964,\"lat\":31.251618,\"adcode\":420921,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"孝感市\",\"lng\":113.926655,\"lat\":30.926423,\"adcode\":420900,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"孝南区\",\"lng\":113.925849,\"lat\":30.925966,\"adcode\":420902,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"应城市\",\"lng\":113.573842,\"lat\":30.939038,\"adcode\":420981,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"孝感市\",\"n\":\"云梦县\",\"lng\":113.750616,\"lat\":31.021691,\"adcode\":420923,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"当阳市\",\"lng\":111.793419,\"lat\":30.824492,\"adcode\":420582,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"点军区\",\"lng\":111.268163,\"lat\":30.692322,\"adcode\":420504,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"五峰土家族自治县\",\"lng\":110.674938,\"lat\":30.199252,\"adcode\":420529,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"伍家岗区\",\"lng\":111.307215,\"lat\":30.679053,\"adcode\":420503,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"西陵区\",\"lng\":111.295468,\"lat\":30.702476,\"adcode\":420502,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"猇亭区\",\"lng\":111.427642,\"lat\":30.530744,\"adcode\":420505,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"兴山县\",\"lng\":110.754499,\"lat\":31.34795,\"adcode\":420526,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"夷陵区\",\"lng\":111.326747,\"lat\":30.770199,\"adcode\":420506,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"宜昌市\",\"lng\":111.290843,\"lat\":30.702636,\"adcode\":420500,\"level\":\"city\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"宜都市\",\"lng\":111.454367,\"lat\":30.387234,\"adcode\":420581,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"远安县\",\"lng\":111.64331,\"lat\":31.059626,\"adcode\":420525,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"长阳土家族自治县\",\"lng\":111.198475,\"lat\":30.466534,\"adcode\":420528,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"枝江市\",\"lng\":111.751799,\"lat\":30.425364,\"adcode\":420583,\"level\":\"district\"},{\"p\":\"湖北\",\"c\":\"宜昌市\",\"n\":\"秭归县\",\"lng\":110.976785,\"lat\":30.823908,\"adcode\":420527,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"安乡县\",\"lng\":112.172289,\"lat\":29.414483,\"adcode\":430721,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"常德市\",\"lng\":111.691347,\"lat\":29.040225,\"adcode\":430700,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"鼎城区\",\"lng\":111.685327,\"lat\":29.014426,\"adcode\":430703,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"汉寿县\",\"lng\":111.968506,\"lat\":28.907319,\"adcode\":430722,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"津市市\",\"lng\":111.879609,\"lat\":29.630867,\"adcode\":430781,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"澧县\",\"lng\":111.761682,\"lat\":29.64264,\"adcode\":430723,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"临澧县\",\"lng\":111.645602,\"lat\":29.443217,\"adcode\":430724,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"石门县\",\"lng\":111.379087,\"lat\":29.584703,\"adcode\":430726,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"桃源县\",\"lng\":111.484503,\"lat\":28.902734,\"adcode\":430725,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"常德市\",\"n\":\"武陵区\",\"lng\":111.690718,\"lat\":29.040477,\"adcode\":430702,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"安仁县\",\"lng\":113.27217,\"lat\":26.708625,\"adcode\":431028,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"北湖区\",\"lng\":113.032208,\"lat\":25.792628,\"adcode\":431002,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"郴州市\",\"lng\":113.032067,\"lat\":25.793589,\"adcode\":431000,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"桂东县\",\"lng\":113.945879,\"lat\":26.073917,\"adcode\":431027,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"桂阳县\",\"lng\":112.734466,\"lat\":25.737447,\"adcode\":431021,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"嘉禾县\",\"lng\":112.370618,\"lat\":25.587309,\"adcode\":431024,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"临武县\",\"lng\":112.564589,\"lat\":25.279119,\"adcode\":431025,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"汝城县\",\"lng\":113.685686,\"lat\":25.553759,\"adcode\":431026,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"苏仙区\",\"lng\":113.038698,\"lat\":25.793157,\"adcode\":431003,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"宜章县\",\"lng\":112.947884,\"lat\":25.394345,\"adcode\":431022,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"永兴县\",\"lng\":113.114819,\"lat\":26.129392,\"adcode\":431023,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"郴州市\",\"n\":\"资兴市\",\"lng\":113.23682,\"lat\":25.974152,\"adcode\":431081,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"常宁市\",\"lng\":112.396821,\"lat\":26.406773,\"adcode\":430482,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"衡东县\",\"lng\":112.950412,\"lat\":27.083531,\"adcode\":430424,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"衡南县\",\"lng\":112.677459,\"lat\":26.739973,\"adcode\":430422,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"衡山县\",\"lng\":112.86971,\"lat\":27.234808,\"adcode\":430423,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"衡阳市\",\"lng\":112.607693,\"lat\":26.900358,\"adcode\":430400,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"衡阳县\",\"lng\":112.379643,\"lat\":26.962388,\"adcode\":430421,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"耒阳市\",\"lng\":112.847215,\"lat\":26.414162,\"adcode\":430481,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"南岳区\",\"lng\":112.734147,\"lat\":27.240536,\"adcode\":430412,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"祁东县\",\"lng\":112.111192,\"lat\":26.787109,\"adcode\":430426,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"石鼓区\",\"lng\":112.607635,\"lat\":26.903908,\"adcode\":430407,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"雁峰区\",\"lng\":112.612241,\"lat\":26.893694,\"adcode\":430406,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"蒸湘区\",\"lng\":112.570608,\"lat\":26.89087,\"adcode\":430408,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"衡阳市\",\"n\":\"珠晖区\",\"lng\":112.626324,\"lat\":26.891063,\"adcode\":430405,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"辰溪县\",\"lng\":110.196953,\"lat\":28.005474,\"adcode\":431223,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"鹤城区\",\"lng\":109.982242,\"lat\":27.548474,\"adcode\":431202,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"洪江市\",\"lng\":109.831765,\"lat\":27.201876,\"adcode\":431281,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"怀化市\",\"lng\":109.97824,\"lat\":27.550082,\"adcode\":431200,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"会同县\",\"lng\":109.720785,\"lat\":26.870789,\"adcode\":431225,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"靖州苗族侗族自治县\",\"lng\":109.691159,\"lat\":26.573511,\"adcode\":431229,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"麻阳苗族自治县\",\"lng\":109.802807,\"lat\":27.865991,\"adcode\":431226,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"通道侗族自治县\",\"lng\":109.783359,\"lat\":26.158349,\"adcode\":431230,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"新晃侗族自治县\",\"lng\":109.174443,\"lat\":27.359897,\"adcode\":431227,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"溆浦县\",\"lng\":110.593373,\"lat\":27.903802,\"adcode\":431224,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"沅陵县\",\"lng\":110.399161,\"lat\":28.455554,\"adcode\":431222,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"芷江侗族自治县\",\"lng\":109.687777,\"lat\":27.437996,\"adcode\":431228,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"怀化市\",\"n\":\"中方县\",\"lng\":109.948061,\"lat\":27.43736,\"adcode\":431221,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"娄底市\",\"n\":\"冷水江市\",\"lng\":111.434674,\"lat\":27.685759,\"adcode\":431381,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"娄底市\",\"n\":\"涟源市\",\"lng\":111.670847,\"lat\":27.692301,\"adcode\":431382,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"娄底市\",\"n\":\"娄底市\",\"lng\":112.008497,\"lat\":27.728136,\"adcode\":431300,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"娄底市\",\"n\":\"娄星区\",\"lng\":112.008486,\"lat\":27.726643,\"adcode\":431302,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"娄底市\",\"n\":\"双峰县\",\"lng\":112.198245,\"lat\":27.459126,\"adcode\":431321,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"娄底市\",\"n\":\"新化县\",\"lng\":111.306747,\"lat\":27.737456,\"adcode\":431322,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"北塔区\",\"lng\":111.452315,\"lat\":27.245688,\"adcode\":430511,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"城步苗族自治县\",\"lng\":110.313226,\"lat\":26.363575,\"adcode\":430529,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"大祥区\",\"lng\":111.462968,\"lat\":27.233593,\"adcode\":430503,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"洞口县\",\"lng\":110.579212,\"lat\":27.062286,\"adcode\":430525,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"隆回县\",\"lng\":111.038785,\"lat\":27.116002,\"adcode\":430524,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"邵东市\",\"lng\":111.743168,\"lat\":27.257273,\"adcode\":430582,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"邵阳市\",\"lng\":111.46923,\"lat\":27.237842,\"adcode\":430500,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"邵阳县\",\"lng\":111.2757,\"lat\":26.989713,\"adcode\":430523,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"双清区\",\"lng\":111.479756,\"lat\":27.240001,\"adcode\":430502,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"绥宁县\",\"lng\":110.155075,\"lat\":26.580622,\"adcode\":430527,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"武冈市\",\"lng\":110.636804,\"lat\":26.732086,\"adcode\":430581,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"新宁县\",\"lng\":110.859115,\"lat\":26.438912,\"adcode\":430528,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"邵阳市\",\"n\":\"新邵县\",\"lng\":111.459762,\"lat\":27.311429,\"adcode\":430522,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘潭市\",\"n\":\"韶山市\",\"lng\":112.52848,\"lat\":27.922682,\"adcode\":430382,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘潭市\",\"n\":\"湘潭市\",\"lng\":112.944052,\"lat\":27.82973,\"adcode\":430300,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"湘潭市\",\"n\":\"湘潭县\",\"lng\":112.952829,\"lat\":27.778601,\"adcode\":430321,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘潭市\",\"n\":\"湘乡市\",\"lng\":112.525217,\"lat\":27.734918,\"adcode\":430381,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘潭市\",\"n\":\"雨湖区\",\"lng\":112.907427,\"lat\":27.86077,\"adcode\":430302,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘潭市\",\"n\":\"岳塘区\",\"lng\":112.927707,\"lat\":27.828854,\"adcode\":430304,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"保靖县\",\"lng\":109.651445,\"lat\":28.709605,\"adcode\":433125,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"凤凰县\",\"lng\":109.599191,\"lat\":27.948308,\"adcode\":433123,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"古丈县\",\"lng\":109.949592,\"lat\":28.616973,\"adcode\":433126,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"花垣县\",\"lng\":109.479063,\"lat\":28.581352,\"adcode\":433124,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"吉首市\",\"lng\":109.738273,\"lat\":28.314827,\"adcode\":433101,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"龙山县\",\"lng\":109.441189,\"lat\":29.453438,\"adcode\":433130,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"泸溪县\",\"lng\":110.214428,\"lat\":28.214516,\"adcode\":433122,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"湘西土家族苗族自治州\",\"lng\":109.739735,\"lat\":28.314296,\"adcode\":433100,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"湘西土家族苗族自治州\",\"n\":\"永顺县\",\"lng\":109.853292,\"lat\":28.998068,\"adcode\":433127,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"安化县\",\"lng\":111.221824,\"lat\":28.377421,\"adcode\":430923,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"赫山区\",\"lng\":112.360946,\"lat\":28.568327,\"adcode\":430903,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"南县\",\"lng\":112.410399,\"lat\":29.372181,\"adcode\":430921,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"桃江县\",\"lng\":112.139732,\"lat\":28.520993,\"adcode\":430922,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"益阳市\",\"lng\":112.355042,\"lat\":28.570066,\"adcode\":430900,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"沅江市\",\"lng\":112.361088,\"lat\":28.839713,\"adcode\":430981,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"益阳市\",\"n\":\"资阳区\",\"lng\":112.33084,\"lat\":28.592771,\"adcode\":430902,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"道县\",\"lng\":111.591614,\"lat\":25.518444,\"adcode\":431124,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"东安县\",\"lng\":111.313035,\"lat\":26.397278,\"adcode\":431122,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"江华瑶族自治县\",\"lng\":111.577276,\"lat\":25.182596,\"adcode\":431129,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"江永县\",\"lng\":111.346803,\"lat\":25.268154,\"adcode\":431125,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"蓝山县\",\"lng\":112.194195,\"lat\":25.375255,\"adcode\":431127,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"冷水滩区\",\"lng\":111.607156,\"lat\":26.434364,\"adcode\":431103,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"零陵区\",\"lng\":111.626348,\"lat\":26.223347,\"adcode\":431102,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"宁远县\",\"lng\":111.944529,\"lat\":25.584112,\"adcode\":431126,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"祁阳市\",\"lng\":111.85734,\"lat\":26.585929,\"adcode\":431121,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"双牌县\",\"lng\":111.662146,\"lat\":25.959397,\"adcode\":431123,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"新田县\",\"lng\":112.220341,\"lat\":25.906927,\"adcode\":431128,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"永州市\",\"n\":\"永州市\",\"lng\":111.608019,\"lat\":26.434516,\"adcode\":431100,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"华容县\",\"lng\":112.559369,\"lat\":29.524107,\"adcode\":430623,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"君山区\",\"lng\":113.004082,\"lat\":29.438062,\"adcode\":430611,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"临湘市\",\"lng\":113.450809,\"lat\":29.471594,\"adcode\":430682,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"汨罗市\",\"lng\":113.079419,\"lat\":28.803149,\"adcode\":430681,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"平江县\",\"lng\":113.593751,\"lat\":28.701523,\"adcode\":430626,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"湘阴县\",\"lng\":112.889748,\"lat\":28.677498,\"adcode\":430624,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"岳阳楼区\",\"lng\":113.120751,\"lat\":29.366784,\"adcode\":430602,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"岳阳市\",\"lng\":113.132855,\"lat\":29.37029,\"adcode\":430600,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"岳阳县\",\"lng\":113.116073,\"lat\":29.144843,\"adcode\":430621,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"岳阳市\",\"n\":\"云溪区\",\"lng\":113.27387,\"lat\":29.473395,\"adcode\":430603,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"张家界市\",\"n\":\"慈利县\",\"lng\":111.132702,\"lat\":29.423876,\"adcode\":430821,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"张家界市\",\"n\":\"桑植县\",\"lng\":110.164039,\"lat\":29.399939,\"adcode\":430822,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"张家界市\",\"n\":\"武陵源区\",\"lng\":110.54758,\"lat\":29.347827,\"adcode\":430811,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"张家界市\",\"n\":\"永定区\",\"lng\":110.484559,\"lat\":29.125961,\"adcode\":430802,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"张家界市\",\"n\":\"张家界市\",\"lng\":110.479921,\"lat\":29.127401,\"adcode\":430800,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"芙蓉区\",\"lng\":112.988094,\"lat\":28.193106,\"adcode\":430102,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"开福区\",\"lng\":112.985525,\"lat\":28.201336,\"adcode\":430105,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"浏阳市\",\"lng\":113.633301,\"lat\":28.141112,\"adcode\":430181,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"宁乡市\",\"lng\":112.553182,\"lat\":28.253928,\"adcode\":430182,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"天心区\",\"lng\":112.97307,\"lat\":28.192375,\"adcode\":430103,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"望城区\",\"lng\":112.819549,\"lat\":28.347458,\"adcode\":430112,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"雨花区\",\"lng\":113.016337,\"lat\":28.109937,\"adcode\":430111,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"岳麓区\",\"lng\":112.911591,\"lat\":28.213044,\"adcode\":430104,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"长沙市\",\"lng\":112.982279,\"lat\":28.19409,\"adcode\":430100,\"level\":\"city\"},{\"p\":\"湖南\",\"c\":\"长沙市\",\"n\":\"长沙县\",\"lng\":113.080098,\"lat\":28.237888,\"adcode\":430121,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"茶陵县\",\"lng\":113.546509,\"lat\":26.789534,\"adcode\":430224,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"荷塘区\",\"lng\":113.162548,\"lat\":27.833036,\"adcode\":430202,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"醴陵市\",\"lng\":113.507157,\"lat\":27.657873,\"adcode\":430281,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"芦淞区\",\"lng\":113.155169,\"lat\":27.827246,\"adcode\":430203,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"渌口区\",\"lng\":113.146175,\"lat\":27.705844,\"adcode\":430212,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"石峰区\",\"lng\":113.11295,\"lat\":27.871945,\"adcode\":430204,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"天元区\",\"lng\":113.136252,\"lat\":27.826909,\"adcode\":430211,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"炎陵县\",\"lng\":113.776884,\"lat\":26.489459,\"adcode\":430225,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"攸县\",\"lng\":113.345774,\"lat\":27.000071,\"adcode\":430223,\"level\":\"district\"},{\"p\":\"湖南\",\"c\":\"株洲市\",\"n\":\"株洲市\",\"lng\":113.151737,\"lat\":27.835806,\"adcode\":430200,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"白城市\",\"n\":\"白城市\",\"lng\":122.841114,\"lat\":45.619026,\"adcode\":220800,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"白城市\",\"n\":\"大安市\",\"lng\":124.291512,\"lat\":45.507648,\"adcode\":220882,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白城市\",\"n\":\"洮北区\",\"lng\":122.842499,\"lat\":45.619253,\"adcode\":220802,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白城市\",\"n\":\"洮南市\",\"lng\":122.783779,\"lat\":45.339113,\"adcode\":220881,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白城市\",\"n\":\"通榆县\",\"lng\":123.088543,\"lat\":44.80915,\"adcode\":220822,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白城市\",\"n\":\"镇赉县\",\"lng\":123.202246,\"lat\":45.846089,\"adcode\":220821,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"白山市\",\"lng\":126.427839,\"lat\":41.942505,\"adcode\":220600,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"抚松县\",\"lng\":127.273796,\"lat\":42.332643,\"adcode\":220621,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"浑江区\",\"lng\":126.428035,\"lat\":41.943065,\"adcode\":220602,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"江源区\",\"lng\":126.584229,\"lat\":42.048109,\"adcode\":220605,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"靖宇县\",\"lng\":126.808386,\"lat\":42.389689,\"adcode\":220622,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"临江市\",\"lng\":126.919296,\"lat\":41.810689,\"adcode\":220681,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"白山市\",\"n\":\"长白朝鲜族自治县\",\"lng\":128.203384,\"lat\":41.419361,\"adcode\":220623,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"昌邑区\",\"lng\":126.570766,\"lat\":43.851118,\"adcode\":220202,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"船营区\",\"lng\":126.55239,\"lat\":43.843804,\"adcode\":220204,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"丰满区\",\"lng\":126.560759,\"lat\":43.816594,\"adcode\":220211,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"桦甸市\",\"lng\":126.745445,\"lat\":42.972093,\"adcode\":220282,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"吉林市\",\"lng\":126.55302,\"lat\":43.843577,\"adcode\":220200,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"蛟河市\",\"lng\":127.342739,\"lat\":43.720579,\"adcode\":220281,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"龙潭区\",\"lng\":126.561429,\"lat\":43.909755,\"adcode\":220203,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"磐石市\",\"lng\":126.059929,\"lat\":42.942476,\"adcode\":220284,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"舒兰市\",\"lng\":126.947813,\"lat\":44.410906,\"adcode\":220283,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"吉林市\",\"n\":\"永吉县\",\"lng\":126.501622,\"lat\":43.667416,\"adcode\":220221,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"辽源市\",\"n\":\"东丰县\",\"lng\":125.529623,\"lat\":42.675228,\"adcode\":220421,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"辽源市\",\"n\":\"东辽县\",\"lng\":124.991995,\"lat\":42.927724,\"adcode\":220422,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"辽源市\",\"n\":\"辽源市\",\"lng\":125.145349,\"lat\":42.902692,\"adcode\":220400,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"辽源市\",\"n\":\"龙山区\",\"lng\":125.145164,\"lat\":42.902702,\"adcode\":220402,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"辽源市\",\"n\":\"西安区\",\"lng\":125.151424,\"lat\":42.920415,\"adcode\":220403,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"四平市\",\"n\":\"梨树县\",\"lng\":124.335802,\"lat\":43.30831,\"adcode\":220322,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"四平市\",\"n\":\"双辽市\",\"lng\":123.505283,\"lat\":43.518275,\"adcode\":220382,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"四平市\",\"n\":\"四平市\",\"lng\":124.370785,\"lat\":43.170344,\"adcode\":220300,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"四平市\",\"n\":\"铁东区\",\"lng\":124.388464,\"lat\":43.16726,\"adcode\":220303,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"四平市\",\"n\":\"铁西区\",\"lng\":124.360894,\"lat\":43.176263,\"adcode\":220302,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"四平市\",\"n\":\"伊通满族自治县\",\"lng\":125.303124,\"lat\":43.345464,\"adcode\":220323,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"松原市\",\"n\":\"扶余市\",\"lng\":126.042758,\"lat\":44.986199,\"adcode\":220781,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"松原市\",\"n\":\"宁江区\",\"lng\":124.827851,\"lat\":45.176498,\"adcode\":220702,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"松原市\",\"n\":\"前郭尔罗斯蒙古族自治县\",\"lng\":124.826808,\"lat\":45.116288,\"adcode\":220721,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"松原市\",\"n\":\"乾安县\",\"lng\":124.024361,\"lat\":45.006846,\"adcode\":220723,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"松原市\",\"n\":\"松原市\",\"lng\":124.823608,\"lat\":45.118243,\"adcode\":220700,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"松原市\",\"n\":\"长岭县\",\"lng\":123.985184,\"lat\":44.276579,\"adcode\":220722,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"东昌区\",\"lng\":125.936716,\"lat\":41.721233,\"adcode\":220502,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"二道江区\",\"lng\":126.045987,\"lat\":41.777564,\"adcode\":220503,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"辉南县\",\"lng\":126.042821,\"lat\":42.683459,\"adcode\":220523,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"集安市\",\"lng\":126.186204,\"lat\":41.126276,\"adcode\":220582,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"柳河县\",\"lng\":125.740536,\"lat\":42.281484,\"adcode\":220524,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"梅河口市\",\"lng\":125.687336,\"lat\":42.530002,\"adcode\":220581,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"通化市\",\"lng\":125.936501,\"lat\":41.721177,\"adcode\":220500,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"通化市\",\"n\":\"通化县\",\"lng\":125.753121,\"lat\":41.677918,\"adcode\":220521,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"安图县\",\"lng\":128.901865,\"lat\":43.110994,\"adcode\":222426,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"敦化市\",\"lng\":128.22986,\"lat\":43.366921,\"adcode\":222403,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"和龙市\",\"lng\":129.008748,\"lat\":42.547004,\"adcode\":222406,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"珲春市\",\"lng\":130.365787,\"lat\":42.871057,\"adcode\":222404,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"龙井市\",\"lng\":129.425747,\"lat\":42.771029,\"adcode\":222405,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"图们市\",\"lng\":129.846701,\"lat\":42.966621,\"adcode\":222402,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"汪清县\",\"lng\":129.766161,\"lat\":43.315426,\"adcode\":222424,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"延边朝鲜族自治州\",\"lng\":129.513228,\"lat\":42.904823,\"adcode\":222400,\"level\":\"city\"},{\"p\":\"吉林\",\"c\":\"延边朝鲜族自治州\",\"n\":\"延吉市\",\"lng\":129.51579,\"lat\":42.906964,\"adcode\":222401,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"朝阳区\",\"lng\":125.318042,\"lat\":43.86491,\"adcode\":220104,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"德惠市\",\"lng\":125.703327,\"lat\":44.533909,\"adcode\":220183,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"二道区\",\"lng\":125.384727,\"lat\":43.870824,\"adcode\":220105,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"公主岭市\",\"lng\":124.817588,\"lat\":43.509474,\"adcode\":220184,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"九台区\",\"lng\":125.844682,\"lat\":44.157155,\"adcode\":220113,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"宽城区\",\"lng\":125.342828,\"lat\":43.903823,\"adcode\":220103,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"绿园区\",\"lng\":125.272467,\"lat\":43.892177,\"adcode\":220106,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"南关区\",\"lng\":125.337237,\"lat\":43.890235,\"adcode\":220102,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"农安县\",\"lng\":125.175287,\"lat\":44.431258,\"adcode\":220122,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"双阳区\",\"lng\":125.659018,\"lat\":43.525168,\"adcode\":220112,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"榆树市\",\"lng\":126.550107,\"lat\":44.827642,\"adcode\":220182,\"level\":\"district\"},{\"p\":\"吉林\",\"c\":\"长春市\",\"n\":\"长春市\",\"lng\":125.3245,\"lat\":43.886841,\"adcode\":220100,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"常州市\",\"lng\":119.946973,\"lat\":31.772752,\"adcode\":320400,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"金坛区\",\"lng\":119.573395,\"lat\":31.744399,\"adcode\":320413,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"溧阳市\",\"lng\":119.487816,\"lat\":31.427081,\"adcode\":320481,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"天宁区\",\"lng\":119.963783,\"lat\":31.779632,\"adcode\":320402,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"武进区\",\"lng\":119.958773,\"lat\":31.718566,\"adcode\":320412,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"新北区\",\"lng\":119.974654,\"lat\":31.824664,\"adcode\":320411,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"常州市\",\"n\":\"钟楼区\",\"lng\":119.948388,\"lat\":31.78096,\"adcode\":320404,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"洪泽区\",\"lng\":118.867875,\"lat\":33.294975,\"adcode\":320813,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"淮安区\",\"lng\":119.14634,\"lat\":33.507499,\"adcode\":320803,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"淮安市\",\"lng\":119.021265,\"lat\":33.597506,\"adcode\":320800,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"淮阴区\",\"lng\":119.020817,\"lat\":33.622452,\"adcode\":320804,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"金湖县\",\"lng\":119.016936,\"lat\":33.018162,\"adcode\":320831,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"涟水县\",\"lng\":119.266078,\"lat\":33.771308,\"adcode\":320826,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"清江浦区\",\"lng\":119.019454,\"lat\":33.603234,\"adcode\":320812,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"淮安市\",\"n\":\"盱眙县\",\"lng\":118.493823,\"lat\":33.00439,\"adcode\":320830,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"东海县\",\"lng\":118.766489,\"lat\":34.522859,\"adcode\":320722,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"赣榆区\",\"lng\":119.128774,\"lat\":34.839154,\"adcode\":320707,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"灌南县\",\"lng\":119.352331,\"lat\":34.092553,\"adcode\":320724,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"灌云县\",\"lng\":119.255741,\"lat\":34.298436,\"adcode\":320723,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"海州区\",\"lng\":119.179793,\"lat\":34.601584,\"adcode\":320706,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"连云港市\",\"lng\":119.178821,\"lat\":34.600018,\"adcode\":320700,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"连云港市\",\"n\":\"连云区\",\"lng\":119.366487,\"lat\":34.739529,\"adcode\":320703,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"高淳区\",\"lng\":118.87589,\"lat\":31.327132,\"adcode\":320118,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"鼓楼区\",\"lng\":118.769739,\"lat\":32.066966,\"adcode\":320106,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"建邺区\",\"lng\":118.732688,\"lat\":32.004538,\"adcode\":320105,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"江宁区\",\"lng\":118.850621,\"lat\":31.953418,\"adcode\":320115,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"溧水区\",\"lng\":119.028732,\"lat\":31.653061,\"adcode\":320117,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"六合区\",\"lng\":118.85065,\"lat\":32.340655,\"adcode\":320116,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"南京市\",\"lng\":118.767413,\"lat\":32.041544,\"adcode\":320100,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"浦口区\",\"lng\":118.625307,\"lat\":32.05839,\"adcode\":320111,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"栖霞区\",\"lng\":118.808702,\"lat\":32.102147,\"adcode\":320113,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"秦淮区\",\"lng\":118.786088,\"lat\":32.033818,\"adcode\":320104,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"玄武区\",\"lng\":118.792199,\"lat\":32.050678,\"adcode\":320102,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南京市\",\"n\":\"雨花台区\",\"lng\":118.77207,\"lat\":31.995946,\"adcode\":320114,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"崇川区\",\"lng\":120.86635,\"lat\":32.015278,\"adcode\":320602,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"海安市\",\"lng\":120.465995,\"lat\":32.540288,\"adcode\":320685,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"海门区\",\"lng\":121.176609,\"lat\":31.893528,\"adcode\":320684,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"南通市\",\"lng\":120.864608,\"lat\":32.016212,\"adcode\":320600,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"启东市\",\"lng\":121.659724,\"lat\":31.810158,\"adcode\":320681,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"如东县\",\"lng\":121.186088,\"lat\":32.311832,\"adcode\":320623,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"如皋市\",\"lng\":120.566324,\"lat\":32.391591,\"adcode\":320682,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"南通市\",\"n\":\"通州区\",\"lng\":121.073171,\"lat\":32.084287,\"adcode\":320612,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"常熟市\",\"lng\":120.74852,\"lat\":31.658156,\"adcode\":320581,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"姑苏区\",\"lng\":120.622249,\"lat\":31.311414,\"adcode\":320508,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"虎丘区\",\"lng\":120.566833,\"lat\":31.294845,\"adcode\":320505,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"昆山市\",\"lng\":120.958137,\"lat\":31.381925,\"adcode\":320583,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"苏州市\",\"lng\":120.619585,\"lat\":31.299379,\"adcode\":320500,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"太仓市\",\"lng\":121.112275,\"lat\":31.452568,\"adcode\":320585,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"吴江区\",\"lng\":120.641601,\"lat\":31.160404,\"adcode\":320509,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"吴中区\",\"lng\":120.624621,\"lat\":31.270839,\"adcode\":320506,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"相城区\",\"lng\":120.618956,\"lat\":31.396684,\"adcode\":320507,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"苏州市\",\"n\":\"张家港市\",\"lng\":120.543441,\"lat\":31.865553,\"adcode\":320582,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"宿迁市\",\"n\":\"沭阳县\",\"lng\":118.775889,\"lat\":34.129097,\"adcode\":321322,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"宿迁市\",\"n\":\"泗洪县\",\"lng\":118.211824,\"lat\":33.456538,\"adcode\":321324,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"宿迁市\",\"n\":\"泗阳县\",\"lng\":118.681284,\"lat\":33.711433,\"adcode\":321323,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"宿迁市\",\"n\":\"宿城区\",\"lng\":118.278984,\"lat\":33.937726,\"adcode\":321302,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"宿迁市\",\"n\":\"宿迁市\",\"lng\":118.275162,\"lat\":33.963008,\"adcode\":321300,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"宿迁市\",\"n\":\"宿豫区\",\"lng\":118.330012,\"lat\":33.941071,\"adcode\":321311,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"高港区\",\"lng\":119.88166,\"lat\":32.315701,\"adcode\":321203,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"海陵区\",\"lng\":119.920187,\"lat\":32.488406,\"adcode\":321202,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"姜堰区\",\"lng\":120.148208,\"lat\":32.508483,\"adcode\":321204,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"靖江市\",\"lng\":120.26825,\"lat\":32.018168,\"adcode\":321282,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"泰兴市\",\"lng\":120.020228,\"lat\":32.168784,\"adcode\":321283,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"泰州市\",\"lng\":119.915176,\"lat\":32.484882,\"adcode\":321200,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"泰州市\",\"n\":\"兴化市\",\"lng\":119.840162,\"lat\":32.938065,\"adcode\":321281,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"滨湖区\",\"lng\":120.266053,\"lat\":31.550228,\"adcode\":320211,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"惠山区\",\"lng\":120.303543,\"lat\":31.681019,\"adcode\":320206,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"江阴市\",\"lng\":120.275891,\"lat\":31.910984,\"adcode\":320281,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"梁溪区\",\"lng\":120.296595,\"lat\":31.575706,\"adcode\":320213,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"无锡市\",\"lng\":120.301663,\"lat\":31.574729,\"adcode\":320200,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"锡山区\",\"lng\":120.357298,\"lat\":31.585559,\"adcode\":320205,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"新吴区\",\"lng\":120.352782,\"lat\":31.550966,\"adcode\":320214,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"无锡市\",\"n\":\"宜兴市\",\"lng\":119.820538,\"lat\":31.364384,\"adcode\":320282,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"丰县\",\"lng\":116.592888,\"lat\":34.696946,\"adcode\":320321,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"鼓楼区\",\"lng\":117.192941,\"lat\":34.269397,\"adcode\":320302,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"贾汪区\",\"lng\":117.450212,\"lat\":34.441642,\"adcode\":320305,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"沛县\",\"lng\":116.937182,\"lat\":34.729044,\"adcode\":320322,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"邳州市\",\"lng\":117.963923,\"lat\":34.314708,\"adcode\":320382,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"泉山区\",\"lng\":117.182225,\"lat\":34.262249,\"adcode\":320311,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"睢宁县\",\"lng\":117.95066,\"lat\":33.899222,\"adcode\":320324,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"铜山区\",\"lng\":117.183894,\"lat\":34.19288,\"adcode\":320312,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"新沂市\",\"lng\":118.345828,\"lat\":34.368779,\"adcode\":320381,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"徐州市\",\"lng\":117.184811,\"lat\":34.261792,\"adcode\":320300,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"徐州市\",\"n\":\"云龙区\",\"lng\":117.194589,\"lat\":34.254805,\"adcode\":320303,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"滨海县\",\"lng\":119.828434,\"lat\":33.989888,\"adcode\":320922,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"大丰区\",\"lng\":120.470324,\"lat\":33.199531,\"adcode\":320904,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"东台市\",\"lng\":120.314101,\"lat\":32.853174,\"adcode\":320981,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"阜宁县\",\"lng\":119.805338,\"lat\":33.78573,\"adcode\":320923,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"建湖县\",\"lng\":119.793105,\"lat\":33.472621,\"adcode\":320925,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"射阳县\",\"lng\":120.257444,\"lat\":33.773779,\"adcode\":320924,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"亭湖区\",\"lng\":120.136078,\"lat\":33.383912,\"adcode\":320902,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"响水县\",\"lng\":119.579573,\"lat\":34.19996,\"adcode\":320921,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"盐城市\",\"lng\":120.139998,\"lat\":33.377631,\"adcode\":320900,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"盐城市\",\"n\":\"盐都区\",\"lng\":120.139753,\"lat\":33.341288,\"adcode\":320903,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"宝应县\",\"lng\":119.321284,\"lat\":33.23694,\"adcode\":321023,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"高邮市\",\"lng\":119.443842,\"lat\":32.785164,\"adcode\":321084,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"广陵区\",\"lng\":119.442267,\"lat\":32.392154,\"adcode\":321002,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"邗江区\",\"lng\":119.397777,\"lat\":32.377899,\"adcode\":321003,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"江都区\",\"lng\":119.567481,\"lat\":32.426564,\"adcode\":321012,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"扬州市\",\"lng\":119.421003,\"lat\":32.393159,\"adcode\":321000,\"level\":\"city\"},{\"p\":\"江苏\",\"c\":\"扬州市\",\"n\":\"仪征市\",\"lng\":119.182443,\"lat\":32.271965,\"adcode\":321081,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"丹徒区\",\"lng\":119.433883,\"lat\":32.128972,\"adcode\":321112,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"丹阳市\",\"lng\":119.581911,\"lat\":31.991459,\"adcode\":321181,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"京口区\",\"lng\":119.454571,\"lat\":32.206191,\"adcode\":321102,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"句容市\",\"lng\":119.167135,\"lat\":31.947355,\"adcode\":321183,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"润州区\",\"lng\":119.414877,\"lat\":32.213501,\"adcode\":321111,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"扬中市\",\"lng\":119.828054,\"lat\":32.237266,\"adcode\":321182,\"level\":\"district\"},{\"p\":\"江苏\",\"c\":\"镇江市\",\"n\":\"镇江市\",\"lng\":119.452753,\"lat\":32.204402,\"adcode\":321100,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"崇仁县\",\"lng\":116.059109,\"lat\":27.760907,\"adcode\":361024,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"东乡区\",\"lng\":116.605341,\"lat\":28.2325,\"adcode\":361003,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"抚州市\",\"lng\":116.358351,\"lat\":27.98385,\"adcode\":361000,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"广昌县\",\"lng\":116.327291,\"lat\":26.838426,\"adcode\":361030,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"金溪县\",\"lng\":116.778751,\"lat\":27.907387,\"adcode\":361027,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"乐安县\",\"lng\":115.838432,\"lat\":27.420101,\"adcode\":361025,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"黎川县\",\"lng\":116.91457,\"lat\":27.292561,\"adcode\":361022,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"临川区\",\"lng\":116.361404,\"lat\":27.981919,\"adcode\":361002,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"南城县\",\"lng\":116.63945,\"lat\":27.55531,\"adcode\":361021,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"南丰县\",\"lng\":116.532994,\"lat\":27.210132,\"adcode\":361023,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"宜黄县\",\"lng\":116.223023,\"lat\":27.546512,\"adcode\":361026,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"抚州市\",\"n\":\"资溪县\",\"lng\":117.066095,\"lat\":27.70653,\"adcode\":361028,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"安远县\",\"lng\":115.392328,\"lat\":25.134591,\"adcode\":360726,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"崇义县\",\"lng\":114.307348,\"lat\":25.687911,\"adcode\":360725,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"大余县\",\"lng\":114.362243,\"lat\":25.395937,\"adcode\":360723,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"定南县\",\"lng\":115.03267,\"lat\":24.774277,\"adcode\":360728,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"赣县区\",\"lng\":115.018461,\"lat\":25.865432,\"adcode\":360704,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"赣州市\",\"lng\":114.940278,\"lat\":25.85097,\"adcode\":360700,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"会昌县\",\"lng\":115.791158,\"lat\":25.599125,\"adcode\":360733,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"龙南市\",\"lng\":114.792657,\"lat\":24.90476,\"adcode\":360783,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"南康区\",\"lng\":114.756933,\"lat\":25.661721,\"adcode\":360703,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"宁都县\",\"lng\":116.018782,\"lat\":26.472054,\"adcode\":360730,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"全南县\",\"lng\":114.531589,\"lat\":24.742651,\"adcode\":360729,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"瑞金市\",\"lng\":116.034854,\"lat\":25.875278,\"adcode\":360781,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"上犹县\",\"lng\":114.540537,\"lat\":25.794284,\"adcode\":360724,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"石城县\",\"lng\":116.342249,\"lat\":26.326582,\"adcode\":360735,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"信丰县\",\"lng\":114.930893,\"lat\":25.38023,\"adcode\":360722,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"兴国县\",\"lng\":115.351896,\"lat\":26.330489,\"adcode\":360732,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"寻乌县\",\"lng\":115.651399,\"lat\":24.954136,\"adcode\":360734,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"于都县\",\"lng\":115.411198,\"lat\":25.955033,\"adcode\":360731,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"赣州市\",\"n\":\"章贡区\",\"lng\":114.93872,\"lat\":25.851367,\"adcode\":360702,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"安福县\",\"lng\":114.61384,\"lat\":27.382746,\"adcode\":360829,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"吉安市\",\"lng\":114.986373,\"lat\":27.111699,\"adcode\":360800,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"吉安县\",\"lng\":114.905117,\"lat\":27.040042,\"adcode\":360821,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"吉水县\",\"lng\":115.134569,\"lat\":27.213445,\"adcode\":360822,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"吉州区\",\"lng\":114.987331,\"lat\":27.112367,\"adcode\":360802,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"井冈山市\",\"lng\":114.284421,\"lat\":26.745919,\"adcode\":360881,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"青原区\",\"lng\":115.016306,\"lat\":27.105879,\"adcode\":360803,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"遂川县\",\"lng\":114.51689,\"lat\":26.323705,\"adcode\":360827,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"泰和县\",\"lng\":114.901393,\"lat\":26.790164,\"adcode\":360826,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"万安县\",\"lng\":114.784694,\"lat\":26.462085,\"adcode\":360828,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"峡江县\",\"lng\":115.319331,\"lat\":27.580862,\"adcode\":360823,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"新干县\",\"lng\":115.399294,\"lat\":27.755758,\"adcode\":360824,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"永丰县\",\"lng\":115.435559,\"lat\":27.321087,\"adcode\":360825,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"吉安市\",\"n\":\"永新县\",\"lng\":114.242534,\"lat\":26.944721,\"adcode\":360830,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"景德镇市\",\"n\":\"昌江区\",\"lng\":117.195023,\"lat\":29.288465,\"adcode\":360202,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"景德镇市\",\"n\":\"浮梁县\",\"lng\":117.217611,\"lat\":29.352251,\"adcode\":360222,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"景德镇市\",\"n\":\"景德镇市\",\"lng\":117.214664,\"lat\":29.29256,\"adcode\":360200,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"景德镇市\",\"n\":\"乐平市\",\"lng\":117.129376,\"lat\":28.967361,\"adcode\":360281,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"景德镇市\",\"n\":\"珠山区\",\"lng\":117.214814,\"lat\":29.292812,\"adcode\":360203,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"柴桑区\",\"lng\":115.892977,\"lat\":29.610264,\"adcode\":360404,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"德安县\",\"lng\":115.762611,\"lat\":29.327474,\"adcode\":360426,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"都昌县\",\"lng\":116.205114,\"lat\":29.275105,\"adcode\":360428,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"共青城市\",\"lng\":115.805712,\"lat\":29.247884,\"adcode\":360482,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"湖口县\",\"lng\":116.244313,\"lat\":29.7263,\"adcode\":360429,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"九江市\",\"lng\":115.992811,\"lat\":29.712034,\"adcode\":360400,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"濂溪区\",\"lng\":115.99012,\"lat\":29.676175,\"adcode\":360402,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"庐山市\",\"lng\":116.043743,\"lat\":29.456169,\"adcode\":360483,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"彭泽县\",\"lng\":116.55584,\"lat\":29.898865,\"adcode\":360430,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"瑞昌市\",\"lng\":115.669081,\"lat\":29.676599,\"adcode\":360481,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"武宁县\",\"lng\":115.105646,\"lat\":29.260182,\"adcode\":360423,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"修水县\",\"lng\":114.573428,\"lat\":29.032729,\"adcode\":360424,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"浔阳区\",\"lng\":115.995947,\"lat\":29.72465,\"adcode\":360403,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"九江市\",\"n\":\"永修县\",\"lng\":115.809055,\"lat\":29.018212,\"adcode\":360425,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"安义县\",\"lng\":115.553109,\"lat\":28.841334,\"adcode\":360123,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"东湖区\",\"lng\":115.889675,\"lat\":28.682988,\"adcode\":360102,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"红谷滩区\",\"lng\":115.8580521,\"lat\":28.69819928,\"adcode\":360113,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"进贤县\",\"lng\":116.267671,\"lat\":28.365681,\"adcode\":360124,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"南昌市\",\"lng\":115.892151,\"lat\":28.676493,\"adcode\":360100,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"南昌县\",\"lng\":115.942465,\"lat\":28.543781,\"adcode\":360121,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"青山湖区\",\"lng\":115.949044,\"lat\":28.689292,\"adcode\":360111,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"青云谱区\",\"lng\":115.907292,\"lat\":28.635724,\"adcode\":360104,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"西湖区\",\"lng\":115.91065,\"lat\":28.662901,\"adcode\":360103,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"南昌市\",\"n\":\"新建区\",\"lng\":115.820806,\"lat\":28.690788,\"adcode\":360112,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"萍乡市\",\"n\":\"安源区\",\"lng\":113.855044,\"lat\":27.625826,\"adcode\":360302,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"萍乡市\",\"n\":\"莲花县\",\"lng\":113.955582,\"lat\":27.127807,\"adcode\":360321,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"萍乡市\",\"n\":\"芦溪县\",\"lng\":114.041206,\"lat\":27.633633,\"adcode\":360323,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"萍乡市\",\"n\":\"萍乡市\",\"lng\":113.852186,\"lat\":27.622946,\"adcode\":360300,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"萍乡市\",\"n\":\"上栗县\",\"lng\":113.800525,\"lat\":27.877041,\"adcode\":360322,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"萍乡市\",\"n\":\"湘东区\",\"lng\":113.7456,\"lat\":27.639319,\"adcode\":360313,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"德兴市\",\"lng\":117.578732,\"lat\":28.945034,\"adcode\":361181,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"广丰区\",\"lng\":118.189852,\"lat\":28.440285,\"adcode\":361103,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"广信区\",\"lng\":117.90612,\"lat\":28.453897,\"adcode\":361104,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"横峰县\",\"lng\":117.608247,\"lat\":28.415103,\"adcode\":361125,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"鄱阳县\",\"lng\":116.673748,\"lat\":28.993374,\"adcode\":361128,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"铅山县\",\"lng\":117.711906,\"lat\":28.310892,\"adcode\":361124,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"上饶市\",\"lng\":117.971185,\"lat\":28.44442,\"adcode\":361100,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"万年县\",\"lng\":117.07015,\"lat\":28.692589,\"adcode\":361129,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"婺源县\",\"lng\":117.86219,\"lat\":29.254015,\"adcode\":361130,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"信州区\",\"lng\":117.970522,\"lat\":28.445378,\"adcode\":361102,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"弋阳县\",\"lng\":117.435002,\"lat\":28.402391,\"adcode\":361126,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"余干县\",\"lng\":116.691072,\"lat\":28.69173,\"adcode\":361127,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"上饶市\",\"n\":\"玉山县\",\"lng\":118.244408,\"lat\":28.673479,\"adcode\":361123,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"新余市\",\"n\":\"分宜县\",\"lng\":114.675262,\"lat\":27.811301,\"adcode\":360521,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"新余市\",\"n\":\"新余市\",\"lng\":114.930835,\"lat\":27.810834,\"adcode\":360500,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"新余市\",\"n\":\"渝水区\",\"lng\":114.923923,\"lat\":27.819171,\"adcode\":360502,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"丰城市\",\"lng\":115.786005,\"lat\":28.191584,\"adcode\":360981,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"奉新县\",\"lng\":115.389899,\"lat\":28.700672,\"adcode\":360921,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"高安市\",\"lng\":115.381527,\"lat\":28.420951,\"adcode\":360983,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"靖安县\",\"lng\":115.361744,\"lat\":28.86054,\"adcode\":360925,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"上高县\",\"lng\":114.932653,\"lat\":28.234789,\"adcode\":360923,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"铜鼓县\",\"lng\":114.37014,\"lat\":28.520956,\"adcode\":360926,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"万载县\",\"lng\":114.449012,\"lat\":28.104528,\"adcode\":360922,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"宜春市\",\"lng\":114.391136,\"lat\":27.8043,\"adcode\":360900,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"宜丰县\",\"lng\":114.787381,\"lat\":28.388289,\"adcode\":360924,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"袁州区\",\"lng\":114.387379,\"lat\":27.800117,\"adcode\":360902,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"宜春市\",\"n\":\"樟树市\",\"lng\":115.543388,\"lat\":28.055898,\"adcode\":360982,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"鹰潭市\",\"n\":\"贵溪市\",\"lng\":117.212103,\"lat\":28.283693,\"adcode\":360681,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"鹰潭市\",\"n\":\"鹰潭市\",\"lng\":117.033838,\"lat\":28.238638,\"adcode\":360600,\"level\":\"city\"},{\"p\":\"江西\",\"c\":\"鹰潭市\",\"n\":\"余江区\",\"lng\":116.822763,\"lat\":28.206177,\"adcode\":360603,\"level\":\"district\"},{\"p\":\"江西\",\"c\":\"鹰潭市\",\"n\":\"月湖区\",\"lng\":117.034112,\"lat\":28.239076,\"adcode\":360602,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"鞍山市\",\"lng\":122.995632,\"lat\":41.110626,\"adcode\":210300,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"海城市\",\"lng\":122.752199,\"lat\":40.852533,\"adcode\":210381,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"立山区\",\"lng\":123.024806,\"lat\":41.150622,\"adcode\":210304,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"千山区\",\"lng\":122.949298,\"lat\":41.068909,\"adcode\":210311,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"台安县\",\"lng\":122.429736,\"lat\":41.38686,\"adcode\":210321,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"铁东区\",\"lng\":122.994475,\"lat\":41.110344,\"adcode\":210302,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"铁西区\",\"lng\":122.971834,\"lat\":41.11069,\"adcode\":210303,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"鞍山市\",\"n\":\"岫岩满族自治县\",\"lng\":123.28833,\"lat\":40.281509,\"adcode\":210323,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"本溪满族自治县\",\"lng\":124.126156,\"lat\":41.300344,\"adcode\":210521,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"本溪市\",\"lng\":123.770519,\"lat\":41.297909,\"adcode\":210500,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"桓仁满族自治县\",\"lng\":125.359195,\"lat\":41.268997,\"adcode\":210522,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"明山区\",\"lng\":123.763288,\"lat\":41.302429,\"adcode\":210504,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"南芬区\",\"lng\":123.748381,\"lat\":41.104093,\"adcode\":210505,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"平山区\",\"lng\":123.761231,\"lat\":41.291581,\"adcode\":210502,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"本溪市\",\"n\":\"溪湖区\",\"lng\":123.765226,\"lat\":41.330056,\"adcode\":210503,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"北票市\",\"lng\":120.766951,\"lat\":41.803286,\"adcode\":211381,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"朝阳市\",\"lng\":120.451176,\"lat\":41.576758,\"adcode\":211300,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"朝阳县\",\"lng\":120.404217,\"lat\":41.526342,\"adcode\":211321,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"建平县\",\"lng\":119.642363,\"lat\":41.402576,\"adcode\":211322,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"喀喇沁左翼蒙古族自治县\",\"lng\":119.744883,\"lat\":41.125428,\"adcode\":211324,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"凌源市\",\"lng\":119.404789,\"lat\":41.243086,\"adcode\":211382,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"龙城区\",\"lng\":120.413376,\"lat\":41.576749,\"adcode\":211303,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"朝阳市\",\"n\":\"双塔区\",\"lng\":120.44877,\"lat\":41.579389,\"adcode\":211302,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"大连市\",\"lng\":121.618622,\"lat\":38.91459,\"adcode\":210200,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"甘井子区\",\"lng\":121.582614,\"lat\":38.975148,\"adcode\":210211,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"金州区\",\"lng\":121.789413,\"lat\":39.052745,\"adcode\":210213,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"旅顺口区\",\"lng\":121.26713,\"lat\":38.812043,\"adcode\":210212,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"普兰店区\",\"lng\":121.9705,\"lat\":39.401555,\"adcode\":210214,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"沙河口区\",\"lng\":121.593702,\"lat\":38.912859,\"adcode\":210204,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"瓦房店市\",\"lng\":122.002656,\"lat\":39.63065,\"adcode\":210281,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"西岗区\",\"lng\":121.616112,\"lat\":38.914266,\"adcode\":210203,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"长海县\",\"lng\":122.587824,\"lat\":39.272399,\"adcode\":210224,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"中山区\",\"lng\":121.64376,\"lat\":38.921553,\"adcode\":210202,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"大连市\",\"n\":\"庄河市\",\"lng\":122.970612,\"lat\":39.69829,\"adcode\":210283,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"丹东市\",\"lng\":124.383044,\"lat\":40.124296,\"adcode\":210600,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"东港市\",\"lng\":124.149437,\"lat\":39.883467,\"adcode\":210681,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"凤城市\",\"lng\":124.071067,\"lat\":40.457567,\"adcode\":210682,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"宽甸满族自治县\",\"lng\":124.784867,\"lat\":40.730412,\"adcode\":210624,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"元宝区\",\"lng\":124.397814,\"lat\":40.136483,\"adcode\":210602,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"振安区\",\"lng\":124.427709,\"lat\":40.158557,\"adcode\":210604,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"丹东市\",\"n\":\"振兴区\",\"lng\":124.361153,\"lat\":40.102801,\"adcode\":210603,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"东洲区\",\"lng\":124.047219,\"lat\":41.866829,\"adcode\":210403,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"抚顺市\",\"lng\":123.921109,\"lat\":41.875956,\"adcode\":210400,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"抚顺县\",\"lng\":124.097979,\"lat\":41.922644,\"adcode\":210421,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"清原满族自治县\",\"lng\":124.927192,\"lat\":42.10135,\"adcode\":210423,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"顺城区\",\"lng\":123.917165,\"lat\":41.881132,\"adcode\":210411,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"望花区\",\"lng\":123.801509,\"lat\":41.851803,\"adcode\":210404,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"新宾满族自治县\",\"lng\":125.037547,\"lat\":41.732456,\"adcode\":210422,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"抚顺市\",\"n\":\"新抚区\",\"lng\":123.902858,\"lat\":41.86082,\"adcode\":210402,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"阜新蒙古族自治县\",\"lng\":121.743125,\"lat\":42.058607,\"adcode\":210921,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"阜新市\",\"lng\":121.648962,\"lat\":42.011796,\"adcode\":210900,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"海州区\",\"lng\":121.657639,\"lat\":42.011162,\"adcode\":210902,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"清河门区\",\"lng\":121.42018,\"lat\":41.780477,\"adcode\":210905,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"太平区\",\"lng\":121.677575,\"lat\":42.011145,\"adcode\":210904,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"细河区\",\"lng\":121.654791,\"lat\":42.019218,\"adcode\":210911,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"新邱区\",\"lng\":121.790541,\"lat\":42.086603,\"adcode\":210903,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"阜新市\",\"n\":\"彰武县\",\"lng\":122.537444,\"lat\":42.384823,\"adcode\":210922,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"葫芦岛市\",\"lng\":120.856394,\"lat\":40.755572,\"adcode\":211400,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"建昌县\",\"lng\":119.807776,\"lat\":40.812871,\"adcode\":211422,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"连山区\",\"lng\":120.85937,\"lat\":40.755143,\"adcode\":211402,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"龙港区\",\"lng\":120.838569,\"lat\":40.709991,\"adcode\":211403,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"南票区\",\"lng\":120.752314,\"lat\":41.098813,\"adcode\":211404,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"绥中县\",\"lng\":120.342112,\"lat\":40.328407,\"adcode\":211421,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"葫芦岛市\",\"n\":\"兴城市\",\"lng\":120.729365,\"lat\":40.619413,\"adcode\":211481,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"北镇市\",\"lng\":121.795962,\"lat\":41.598764,\"adcode\":210782,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"古塔区\",\"lng\":121.130085,\"lat\":41.115719,\"adcode\":210702,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"黑山县\",\"lng\":122.117915,\"lat\":41.691804,\"adcode\":210726,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"锦州市\",\"lng\":121.135742,\"lat\":41.119269,\"adcode\":210700,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"凌海市\",\"lng\":121.364236,\"lat\":41.171738,\"adcode\":210781,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"凌河区\",\"lng\":121.151304,\"lat\":41.114662,\"adcode\":210703,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"太和区\",\"lng\":121.107297,\"lat\":41.105378,\"adcode\":210711,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"锦州市\",\"n\":\"义县\",\"lng\":121.242831,\"lat\":41.537224,\"adcode\":210727,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"白塔区\",\"lng\":123.172611,\"lat\":41.26745,\"adcode\":211002,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"灯塔市\",\"lng\":123.325864,\"lat\":41.427836,\"adcode\":211081,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"弓长岭区\",\"lng\":123.431633,\"lat\":41.157831,\"adcode\":211005,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"宏伟区\",\"lng\":123.200461,\"lat\":41.205747,\"adcode\":211004,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"辽阳市\",\"lng\":123.18152,\"lat\":41.269402,\"adcode\":211000,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"辽阳县\",\"lng\":123.079674,\"lat\":41.216479,\"adcode\":211021,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"太子河区\",\"lng\":123.185336,\"lat\":41.251682,\"adcode\":211011,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"辽阳市\",\"n\":\"文圣区\",\"lng\":123.188227,\"lat\":41.266765,\"adcode\":211003,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"盘锦市\",\"n\":\"大洼区\",\"lng\":122.071708,\"lat\":40.994428,\"adcode\":211104,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"盘锦市\",\"n\":\"盘锦市\",\"lng\":122.06957,\"lat\":41.124484,\"adcode\":211100,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"盘锦市\",\"n\":\"盘山县\",\"lng\":121.98528,\"lat\":41.240701,\"adcode\":211122,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"盘锦市\",\"n\":\"双台子区\",\"lng\":122.055733,\"lat\":41.190365,\"adcode\":211102,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"盘锦市\",\"n\":\"兴隆台区\",\"lng\":122.071624,\"lat\":41.122423,\"adcode\":211103,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"大东区\",\"lng\":123.469956,\"lat\":41.808503,\"adcode\":210104,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"法库县\",\"lng\":123.416722,\"lat\":42.507045,\"adcode\":210124,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"和平区\",\"lng\":123.406664,\"lat\":41.788074,\"adcode\":210102,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"皇姑区\",\"lng\":123.405677,\"lat\":41.822336,\"adcode\":210105,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"浑南区\",\"lng\":123.458981,\"lat\":41.741946,\"adcode\":210112,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"康平县\",\"lng\":123.352703,\"lat\":42.741533,\"adcode\":210123,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"辽中区\",\"lng\":122.731269,\"lat\":41.512725,\"adcode\":210115,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"沈阳市\",\"lng\":123.429096,\"lat\":41.796767,\"adcode\":210100,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"沈北新区\",\"lng\":123.521471,\"lat\":42.052312,\"adcode\":210113,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"沈河区\",\"lng\":123.445696,\"lat\":41.795591,\"adcode\":210103,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"苏家屯区\",\"lng\":123.341604,\"lat\":41.665904,\"adcode\":210111,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"铁西区\",\"lng\":123.350664,\"lat\":41.787808,\"adcode\":210106,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"新民市\",\"lng\":122.828868,\"lat\":41.996508,\"adcode\":210181,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"沈阳市\",\"n\":\"于洪区\",\"lng\":123.310829,\"lat\":41.795833,\"adcode\":210114,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"昌图县\",\"lng\":124.11017,\"lat\":42.784441,\"adcode\":211224,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"调兵山市\",\"lng\":123.545366,\"lat\":42.450734,\"adcode\":211281,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"开原市\",\"lng\":124.045551,\"lat\":42.542141,\"adcode\":211282,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"清河区\",\"lng\":124.14896,\"lat\":42.542978,\"adcode\":211204,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"铁岭市\",\"lng\":123.844279,\"lat\":42.290585,\"adcode\":211200,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"铁岭县\",\"lng\":123.725669,\"lat\":42.223316,\"adcode\":211221,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"西丰县\",\"lng\":124.72332,\"lat\":42.738091,\"adcode\":211223,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"铁岭市\",\"n\":\"银州区\",\"lng\":123.844877,\"lat\":42.292278,\"adcode\":211202,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"鲅鱼圈区\",\"lng\":122.127242,\"lat\":40.263646,\"adcode\":210804,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"大石桥市\",\"lng\":122.505894,\"lat\":40.633973,\"adcode\":210882,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"盖州市\",\"lng\":122.355534,\"lat\":40.405234,\"adcode\":210881,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"老边区\",\"lng\":122.382584,\"lat\":40.682723,\"adcode\":210811,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"西市区\",\"lng\":122.210067,\"lat\":40.663086,\"adcode\":210803,\"level\":\"district\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"营口市\",\"lng\":122.235151,\"lat\":40.667432,\"adcode\":210800,\"level\":\"city\"},{\"p\":\"辽宁\",\"c\":\"营口市\",\"n\":\"站前区\",\"lng\":122.253235,\"lat\":40.669949,\"adcode\":210802,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"阿拉善盟\",\"n\":\"阿拉善盟\",\"lng\":105.706422,\"lat\":38.844814,\"adcode\":152900,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"阿拉善盟\",\"n\":\"阿拉善右旗\",\"lng\":101.671984,\"lat\":39.21159,\"adcode\":152922,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"阿拉善盟\",\"n\":\"阿拉善左旗\",\"lng\":105.70192,\"lat\":38.847241,\"adcode\":152921,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"阿拉善盟\",\"n\":\"额济纳旗\",\"lng\":101.06944,\"lat\":41.958813,\"adcode\":152923,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"巴彦淖尔市\",\"lng\":107.416959,\"lat\":40.757402,\"adcode\":150800,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"磴口县\",\"lng\":107.006056,\"lat\":40.330479,\"adcode\":150822,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"杭锦后旗\",\"lng\":107.147682,\"lat\":40.888797,\"adcode\":150826,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"临河区\",\"lng\":107.417018,\"lat\":40.757092,\"adcode\":150802,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"乌拉特后旗\",\"lng\":107.074941,\"lat\":41.084307,\"adcode\":150825,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"乌拉特前旗\",\"lng\":108.656816,\"lat\":40.725209,\"adcode\":150823,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"乌拉特中旗\",\"lng\":108.515255,\"lat\":41.57254,\"adcode\":150824,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"巴彦淖尔市\",\"n\":\"五原县\",\"lng\":108.270658,\"lat\":41.097639,\"adcode\":150821,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"白云鄂博矿区\",\"lng\":109.97016,\"lat\":41.769246,\"adcode\":150206,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"包头市\",\"lng\":109.840405,\"lat\":40.658168,\"adcode\":150200,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"达尔罕茂明安联合旗\",\"lng\":110.438452,\"lat\":41.702836,\"adcode\":150223,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"东河区\",\"lng\":110.026895,\"lat\":40.587056,\"adcode\":150202,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"固阳县\",\"lng\":110.063421,\"lat\":41.030004,\"adcode\":150222,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"九原区\",\"lng\":109.968122,\"lat\":40.600581,\"adcode\":150207,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"昆都仑区\",\"lng\":109.822932,\"lat\":40.661345,\"adcode\":150203,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"青山区\",\"lng\":109.880049,\"lat\":40.668558,\"adcode\":150204,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"石拐区\",\"lng\":110.272565,\"lat\":40.672094,\"adcode\":150205,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"包头市\",\"n\":\"土默特右旗\",\"lng\":110.526766,\"lat\":40.566434,\"adcode\":150221,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"阿鲁科尔沁旗\",\"lng\":120.094969,\"lat\":43.87877,\"adcode\":150421,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"敖汉旗\",\"lng\":119.906486,\"lat\":42.287012,\"adcode\":150430,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"巴林右旗\",\"lng\":118.678347,\"lat\":43.528963,\"adcode\":150423,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"巴林左旗\",\"lng\":119.391737,\"lat\":43.980715,\"adcode\":150422,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"赤峰市\",\"lng\":118.956806,\"lat\":42.275317,\"adcode\":150400,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"红山区\",\"lng\":118.961087,\"lat\":42.269732,\"adcode\":150402,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"喀喇沁旗\",\"lng\":118.708572,\"lat\":41.92778,\"adcode\":150428,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"克什克腾旗\",\"lng\":117.542465,\"lat\":43.256233,\"adcode\":150425,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"林西县\",\"lng\":118.05775,\"lat\":43.605326,\"adcode\":150424,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"宁城县\",\"lng\":119.339242,\"lat\":41.598692,\"adcode\":150429,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"松山区\",\"lng\":118.938958,\"lat\":42.281046,\"adcode\":150404,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"翁牛特旗\",\"lng\":119.022619,\"lat\":42.937128,\"adcode\":150426,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"赤峰市\",\"n\":\"元宝山区\",\"lng\":119.289877,\"lat\":42.041168,\"adcode\":150403,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"达拉特旗\",\"lng\":110.040281,\"lat\":40.404076,\"adcode\":150621,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"东胜区\",\"lng\":109.98945,\"lat\":39.81788,\"adcode\":150602,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"鄂尔多斯市\",\"lng\":109.99029,\"lat\":39.817179,\"adcode\":150600,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"鄂托克旗\",\"lng\":107.982604,\"lat\":39.095752,\"adcode\":150624,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"鄂托克前旗\",\"lng\":107.48172,\"lat\":38.183257,\"adcode\":150623,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"杭锦旗\",\"lng\":108.736324,\"lat\":39.831789,\"adcode\":150625,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"康巴什区\",\"lng\":109.790076,\"lat\":39.607472,\"adcode\":150603,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"乌审旗\",\"lng\":108.842454,\"lat\":38.596611,\"adcode\":150626,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"伊金霍洛旗\",\"lng\":109.787402,\"lat\":39.604312,\"adcode\":150627,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"鄂尔多斯市\",\"n\":\"准格尔旗\",\"lng\":111.238332,\"lat\":39.865221,\"adcode\":150622,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"和林格尔县\",\"lng\":111.824143,\"lat\":40.380288,\"adcode\":150123,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"呼和浩特市\",\"lng\":111.670801,\"lat\":40.818311,\"adcode\":150100,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"回民区\",\"lng\":111.662162,\"lat\":40.815149,\"adcode\":150103,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"清水河县\",\"lng\":111.67222,\"lat\":39.912479,\"adcode\":150124,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"赛罕区\",\"lng\":111.698463,\"lat\":40.807834,\"adcode\":150105,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"土默特左旗\",\"lng\":111.133615,\"lat\":40.720416,\"adcode\":150121,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"托克托县\",\"lng\":111.197317,\"lat\":40.276729,\"adcode\":150122,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"武川县\",\"lng\":111.456563,\"lat\":41.094483,\"adcode\":150125,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"新城区\",\"lng\":111.685964,\"lat\":40.826225,\"adcode\":150102,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼和浩特市\",\"n\":\"玉泉区\",\"lng\":111.66543,\"lat\":40.799421,\"adcode\":150104,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"阿荣旗\",\"lng\":123.464615,\"lat\":48.130503,\"adcode\":150721,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"陈巴尔虎旗\",\"lng\":119.437609,\"lat\":49.328422,\"adcode\":150725,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"额尔古纳市\",\"lng\":120.178636,\"lat\":50.2439,\"adcode\":150784,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"鄂伦春自治旗\",\"lng\":123.725684,\"lat\":50.590177,\"adcode\":150723,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"鄂温克族自治旗\",\"lng\":119.754041,\"lat\":49.143293,\"adcode\":150724,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"根河市\",\"lng\":121.532724,\"lat\":50.780454,\"adcode\":150785,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"海拉尔区\",\"lng\":119.764923,\"lat\":49.213889,\"adcode\":150702,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"呼伦贝尔市\",\"lng\":119.758168,\"lat\":49.215333,\"adcode\":150700,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"满洲里市\",\"lng\":117.455561,\"lat\":49.590788,\"adcode\":150781,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"莫力达瓦达斡尔族自治旗\",\"lng\":124.507401,\"lat\":48.478385,\"adcode\":150722,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"新巴尔虎右旗\",\"lng\":116.825991,\"lat\":48.669134,\"adcode\":150727,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"新巴尔虎左旗\",\"lng\":118.267454,\"lat\":48.216571,\"adcode\":150726,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"牙克石市\",\"lng\":120.729005,\"lat\":49.287024,\"adcode\":150782,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"扎赉诺尔区\",\"lng\":117.716373,\"lat\":49.456567,\"adcode\":150703,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"呼伦贝尔市\",\"n\":\"扎兰屯市\",\"lng\":122.744401,\"lat\":48.007412,\"adcode\":150783,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"霍林郭勒市\",\"lng\":119.657862,\"lat\":45.532361,\"adcode\":150581,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"开鲁县\",\"lng\":121.308797,\"lat\":43.602432,\"adcode\":150523,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"科尔沁区\",\"lng\":122.264042,\"lat\":43.617422,\"adcode\":150502,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"科尔沁左翼后旗\",\"lng\":122.355155,\"lat\":42.954564,\"adcode\":150522,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"科尔沁左翼中旗\",\"lng\":123.313873,\"lat\":44.127166,\"adcode\":150521,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"库伦旗\",\"lng\":121.774886,\"lat\":42.734692,\"adcode\":150524,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"奈曼旗\",\"lng\":120.662543,\"lat\":42.84685,\"adcode\":150525,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"通辽市\",\"lng\":122.263119,\"lat\":43.617429,\"adcode\":150500,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"通辽市\",\"n\":\"扎鲁特旗\",\"lng\":120.905275,\"lat\":44.555294,\"adcode\":150526,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌海市\",\"n\":\"海勃湾区\",\"lng\":106.817762,\"lat\":39.673527,\"adcode\":150302,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌海市\",\"n\":\"海南区\",\"lng\":106.884789,\"lat\":39.44153,\"adcode\":150303,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌海市\",\"n\":\"乌达区\",\"lng\":106.722711,\"lat\":39.502288,\"adcode\":150304,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌海市\",\"n\":\"乌海市\",\"lng\":106.825563,\"lat\":39.673734,\"adcode\":150300,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"察哈尔右翼后旗\",\"lng\":113.1906,\"lat\":41.447213,\"adcode\":150928,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"察哈尔右翼前旗\",\"lng\":113.211958,\"lat\":40.786859,\"adcode\":150926,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"察哈尔右翼中旗\",\"lng\":112.633563,\"lat\":41.274212,\"adcode\":150927,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"丰镇市\",\"lng\":113.163462,\"lat\":40.437534,\"adcode\":150981,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"化德县\",\"lng\":114.01008,\"lat\":41.899335,\"adcode\":150922,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"集宁区\",\"lng\":113.116453,\"lat\":41.034134,\"adcode\":150902,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"凉城县\",\"lng\":112.500911,\"lat\":40.531627,\"adcode\":150925,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"商都县\",\"lng\":113.560643,\"lat\":41.560163,\"adcode\":150923,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"四子王旗\",\"lng\":111.70123,\"lat\":41.528114,\"adcode\":150929,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"乌兰察布市\",\"lng\":113.114543,\"lat\":41.034126,\"adcode\":150900,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"兴和县\",\"lng\":113.834009,\"lat\":40.872437,\"adcode\":150924,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"乌兰察布市\",\"n\":\"卓资县\",\"lng\":112.577702,\"lat\":40.89576,\"adcode\":150921,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"阿巴嘎旗\",\"lng\":114.970618,\"lat\":44.022728,\"adcode\":152522,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"东乌珠穆沁旗\",\"lng\":116.980022,\"lat\":45.510307,\"adcode\":152525,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"多伦县\",\"lng\":116.477288,\"lat\":42.197962,\"adcode\":152531,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"二连浩特市\",\"lng\":111.97981,\"lat\":43.652895,\"adcode\":152501,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"苏尼特右旗\",\"lng\":112.65539,\"lat\":42.746662,\"adcode\":152524,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"苏尼特左旗\",\"lng\":113.653412,\"lat\":43.854108,\"adcode\":152523,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"太仆寺旗\",\"lng\":115.28728,\"lat\":41.895199,\"adcode\":152527,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"西乌珠穆沁旗\",\"lng\":117.615249,\"lat\":44.586147,\"adcode\":152526,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"锡林郭勒盟\",\"lng\":116.090996,\"lat\":43.944018,\"adcode\":152500,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"锡林浩特市\",\"lng\":116.091903,\"lat\":43.944301,\"adcode\":152502,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"镶黄旗\",\"lng\":113.843869,\"lat\":42.239229,\"adcode\":152528,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"正蓝旗\",\"lng\":116.003311,\"lat\":42.245895,\"adcode\":152530,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"锡林郭勒盟\",\"n\":\"正镶白旗\",\"lng\":115.031423,\"lat\":42.286807,\"adcode\":152529,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"阿尔山市\",\"lng\":119.943656,\"lat\":47.177,\"adcode\":152202,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"科尔沁右翼前旗\",\"lng\":121.957544,\"lat\":46.076497,\"adcode\":152221,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"科尔沁右翼中旗\",\"lng\":121.472818,\"lat\":45.059645,\"adcode\":152222,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"突泉县\",\"lng\":121.564856,\"lat\":45.380986,\"adcode\":152224,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"乌兰浩特市\",\"lng\":122.068975,\"lat\":46.077238,\"adcode\":152201,\"level\":\"district\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"兴安盟\",\"lng\":122.070317,\"lat\":46.076268,\"adcode\":152200,\"level\":\"city\"},{\"p\":\"内蒙古\",\"c\":\"兴安盟\",\"n\":\"扎赉特旗\",\"lng\":122.909332,\"lat\":46.725136,\"adcode\":152223,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"固原市\",\"n\":\"固原市\",\"lng\":106.285241,\"lat\":36.004561,\"adcode\":640400,\"level\":\"city\"},{\"p\":\"宁夏\",\"c\":\"固原市\",\"n\":\"泾源县\",\"lng\":106.338674,\"lat\":35.49344,\"adcode\":640424,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"固原市\",\"n\":\"隆德县\",\"lng\":106.12344,\"lat\":35.618234,\"adcode\":640423,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"固原市\",\"n\":\"彭阳县\",\"lng\":106.641512,\"lat\":35.849975,\"adcode\":640425,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"固原市\",\"n\":\"西吉县\",\"lng\":105.731801,\"lat\":35.965384,\"adcode\":640422,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"固原市\",\"n\":\"原州区\",\"lng\":106.28477,\"lat\":36.005337,\"adcode\":640402,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"石嘴山市\",\"n\":\"大武口区\",\"lng\":106.376651,\"lat\":39.014158,\"adcode\":640202,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"石嘴山市\",\"n\":\"惠农区\",\"lng\":106.775513,\"lat\":39.230094,\"adcode\":640205,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"石嘴山市\",\"n\":\"平罗县\",\"lng\":106.54489,\"lat\":38.90674,\"adcode\":640221,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"石嘴山市\",\"n\":\"石嘴山市\",\"lng\":106.376173,\"lat\":39.01333,\"adcode\":640200,\"level\":\"city\"},{\"p\":\"宁夏\",\"c\":\"吴忠市\",\"n\":\"红寺堡区\",\"lng\":106.067315,\"lat\":37.421616,\"adcode\":640303,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"吴忠市\",\"n\":\"利通区\",\"lng\":106.199419,\"lat\":37.985967,\"adcode\":640302,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"吴忠市\",\"n\":\"青铜峡市\",\"lng\":106.075395,\"lat\":38.021509,\"adcode\":640381,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"吴忠市\",\"n\":\"同心县\",\"lng\":105.914764,\"lat\":36.9829,\"adcode\":640324,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"吴忠市\",\"n\":\"吴忠市\",\"lng\":106.199409,\"lat\":37.986165,\"adcode\":640300,\"level\":\"city\"},{\"p\":\"宁夏\",\"c\":\"吴忠市\",\"n\":\"盐池县\",\"lng\":107.40541,\"lat\":37.784222,\"adcode\":640323,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"贺兰县\",\"lng\":106.345904,\"lat\":38.554563,\"adcode\":640122,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"金凤区\",\"lng\":106.228486,\"lat\":38.477353,\"adcode\":640106,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"灵武市\",\"lng\":106.334701,\"lat\":38.094058,\"adcode\":640181,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"西夏区\",\"lng\":106.132116,\"lat\":38.492424,\"adcode\":640105,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"兴庆区\",\"lng\":106.278393,\"lat\":38.46747,\"adcode\":640104,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"银川市\",\"lng\":106.278179,\"lat\":38.46637,\"adcode\":640100,\"level\":\"city\"},{\"p\":\"宁夏\",\"c\":\"银川市\",\"n\":\"永宁县\",\"lng\":106.253781,\"lat\":38.28043,\"adcode\":640121,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"中卫市\",\"n\":\"海原县\",\"lng\":105.647323,\"lat\":36.562007,\"adcode\":640522,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"中卫市\",\"n\":\"沙坡头区\",\"lng\":105.190536,\"lat\":37.514564,\"adcode\":640502,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"中卫市\",\"n\":\"中宁县\",\"lng\":105.675784,\"lat\":37.489736,\"adcode\":640521,\"level\":\"district\"},{\"p\":\"宁夏\",\"c\":\"中卫市\",\"n\":\"中卫市\",\"lng\":105.189568,\"lat\":37.514951,\"adcode\":640500,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"班玛县\",\"lng\":100.737955,\"lat\":32.931589,\"adcode\":632622,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"达日县\",\"lng\":99.651715,\"lat\":33.753259,\"adcode\":632624,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"甘德县\",\"lng\":99.902589,\"lat\":33.966987,\"adcode\":632623,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"果洛藏族自治州\",\"lng\":100.242143,\"lat\":34.4736,\"adcode\":632600,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"久治县\",\"lng\":101.484884,\"lat\":33.430217,\"adcode\":632625,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"玛多县\",\"lng\":98.211343,\"lat\":34.91528,\"adcode\":632626,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"果洛藏族自治州\",\"n\":\"玛沁县\",\"lng\":100.243531,\"lat\":34.473386,\"adcode\":632621,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海北藏族自治州\",\"n\":\"刚察县\",\"lng\":100.138417,\"lat\":37.326263,\"adcode\":632224,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海北藏族自治州\",\"n\":\"海北藏族自治州\",\"lng\":100.901059,\"lat\":36.959435,\"adcode\":632200,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"海北藏族自治州\",\"n\":\"海晏县\",\"lng\":100.90049,\"lat\":36.959542,\"adcode\":632223,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海北藏族自治州\",\"n\":\"门源回族自治县\",\"lng\":101.618461,\"lat\":37.376627,\"adcode\":632221,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海北藏族自治州\",\"n\":\"祁连县\",\"lng\":100.249778,\"lat\":38.175409,\"adcode\":632222,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"海东市\",\"lng\":102.10327,\"lat\":36.502916,\"adcode\":630200,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"互助土族自治县\",\"lng\":101.956734,\"lat\":36.83994,\"adcode\":630223,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"化隆回族自治县\",\"lng\":102.262329,\"lat\":36.098322,\"adcode\":630224,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"乐都区\",\"lng\":102.402431,\"lat\":36.480291,\"adcode\":630202,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"民和回族土族自治县\",\"lng\":102.804209,\"lat\":36.329451,\"adcode\":630222,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"平安区\",\"lng\":102.104295,\"lat\":36.502714,\"adcode\":630203,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海东市\",\"n\":\"循化撒拉族自治县\",\"lng\":102.486534,\"lat\":35.847247,\"adcode\":630225,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海南藏族自治州\",\"n\":\"共和县\",\"lng\":100.619597,\"lat\":36.280286,\"adcode\":632521,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海南藏族自治州\",\"n\":\"贵德县\",\"lng\":101.431856,\"lat\":36.040456,\"adcode\":632523,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海南藏族自治州\",\"n\":\"贵南县\",\"lng\":100.74792,\"lat\":35.587085,\"adcode\":632525,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海南藏族自治州\",\"n\":\"海南藏族自治州\",\"lng\":100.619542,\"lat\":36.280353,\"adcode\":632500,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"海南藏族自治州\",\"n\":\"同德县\",\"lng\":100.579465,\"lat\":35.254492,\"adcode\":632522,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海南藏族自治州\",\"n\":\"兴海县\",\"lng\":99.986963,\"lat\":35.58909,\"adcode\":632524,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"德令哈市\",\"lng\":97.370143,\"lat\":37.374555,\"adcode\":632802,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"都兰县\",\"lng\":98.089161,\"lat\":36.298553,\"adcode\":632822,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"格尔木市\",\"lng\":94.905777,\"lat\":36.401541,\"adcode\":632801,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"海西蒙古族藏族自治州\",\"lng\":97.370785,\"lat\":37.374663,\"adcode\":632800,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"海西蒙古族藏族自治州直辖\",\"lng\":95.357233,\"lat\":37.853631,\"adcode\":632825,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"茫崖市\",\"lng\":90.855955,\"lat\":38.247117,\"adcode\":632803,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"天峻县\",\"lng\":99.02078,\"lat\":37.29906,\"adcode\":632823,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"海西蒙古族藏族自治州\",\"n\":\"乌兰县\",\"lng\":98.479852,\"lat\":36.930389,\"adcode\":632821,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"黄南藏族自治州\",\"n\":\"河南蒙古族自治县\",\"lng\":101.611877,\"lat\":34.734522,\"adcode\":632324,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"黄南藏族自治州\",\"n\":\"黄南藏族自治州\",\"lng\":102.019988,\"lat\":35.517744,\"adcode\":632300,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"黄南藏族自治州\",\"n\":\"尖扎县\",\"lng\":102.031953,\"lat\":35.938205,\"adcode\":632322,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"黄南藏族自治州\",\"n\":\"同仁市\",\"lng\":102.017604,\"lat\":35.516337,\"adcode\":632301,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"黄南藏族自治州\",\"n\":\"泽库县\",\"lng\":101.469343,\"lat\":35.036842,\"adcode\":632323,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"城北区\",\"lng\":101.761297,\"lat\":36.648448,\"adcode\":630105,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"城东区\",\"lng\":101.796095,\"lat\":36.616043,\"adcode\":630102,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"城西区\",\"lng\":101.763649,\"lat\":36.628323,\"adcode\":630104,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"城中区\",\"lng\":101.784554,\"lat\":36.621181,\"adcode\":630103,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"大通回族土族自治县\",\"lng\":101.684183,\"lat\":36.931343,\"adcode\":630121,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"湟源县\",\"lng\":101.263435,\"lat\":36.684818,\"adcode\":630123,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"湟中区\",\"lng\":101.569475,\"lat\":36.500419,\"adcode\":630106,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"西宁市\",\"n\":\"西宁市\",\"lng\":101.778916,\"lat\":36.623178,\"adcode\":630100,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"称多县\",\"lng\":97.110893,\"lat\":33.367884,\"adcode\":632723,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"囊谦县\",\"lng\":96.479797,\"lat\":32.203206,\"adcode\":632725,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"曲麻莱县\",\"lng\":95.800674,\"lat\":34.12654,\"adcode\":632726,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"玉树藏族自治州\",\"lng\":97.008522,\"lat\":33.004049,\"adcode\":632700,\"level\":\"city\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"玉树市\",\"lng\":97.008762,\"lat\":33.00393,\"adcode\":632701,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"杂多县\",\"lng\":95.293423,\"lat\":32.891886,\"adcode\":632722,\"level\":\"district\"},{\"p\":\"青海\",\"c\":\"玉树藏族自治州\",\"n\":\"治多县\",\"lng\":95.616843,\"lat\":33.852322,\"adcode\":632724,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"滨城区\",\"lng\":118.020149,\"lat\":37.384842,\"adcode\":371602,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"滨州市\",\"lng\":118.016974,\"lat\":37.383542,\"adcode\":371600,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"博兴县\",\"lng\":118.123096,\"lat\":37.147002,\"adcode\":371625,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"惠民县\",\"lng\":117.508941,\"lat\":37.483876,\"adcode\":371621,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"无棣县\",\"lng\":117.616325,\"lat\":37.740848,\"adcode\":371623,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"阳信县\",\"lng\":117.581326,\"lat\":37.640492,\"adcode\":371622,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"沾化区\",\"lng\":118.129902,\"lat\":37.698456,\"adcode\":371603,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"滨州市\",\"n\":\"邹平市\",\"lng\":117.736807,\"lat\":36.87803,\"adcode\":371681,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"德城区\",\"lng\":116.307076,\"lat\":37.453923,\"adcode\":371402,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"德州市\",\"lng\":116.307428,\"lat\":37.453968,\"adcode\":371400,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"乐陵市\",\"lng\":117.216657,\"lat\":37.729115,\"adcode\":371481,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"临邑县\",\"lng\":116.867028,\"lat\":37.192044,\"adcode\":371424,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"陵城区\",\"lng\":116.574929,\"lat\":37.332848,\"adcode\":371403,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"宁津县\",\"lng\":116.79372,\"lat\":37.649619,\"adcode\":371422,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"平原县\",\"lng\":116.433904,\"lat\":37.164465,\"adcode\":371426,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"齐河县\",\"lng\":116.758394,\"lat\":36.795497,\"adcode\":371425,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"庆云县\",\"lng\":117.390507,\"lat\":37.777724,\"adcode\":371423,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"武城县\",\"lng\":116.078627,\"lat\":37.209527,\"adcode\":371428,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"夏津县\",\"lng\":116.003816,\"lat\":36.950501,\"adcode\":371427,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"德州市\",\"n\":\"禹城市\",\"lng\":116.642554,\"lat\":36.934485,\"adcode\":371482,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"东营市\",\"n\":\"东营区\",\"lng\":118.507543,\"lat\":37.461567,\"adcode\":370502,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"东营市\",\"n\":\"东营市\",\"lng\":118.66471,\"lat\":37.434564,\"adcode\":370500,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"东营市\",\"n\":\"广饶县\",\"lng\":118.407522,\"lat\":37.05161,\"adcode\":370523,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"东营市\",\"n\":\"河口区\",\"lng\":118.529613,\"lat\":37.886015,\"adcode\":370503,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"东营市\",\"n\":\"垦利区\",\"lng\":118.551314,\"lat\":37.588679,\"adcode\":370505,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"东营市\",\"n\":\"利津县\",\"lng\":118.248854,\"lat\":37.493365,\"adcode\":370522,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"曹县\",\"lng\":115.549482,\"lat\":34.823253,\"adcode\":371721,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"成武县\",\"lng\":115.897349,\"lat\":34.947366,\"adcode\":371723,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"单县\",\"lng\":116.08262,\"lat\":34.790851,\"adcode\":371722,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"定陶区\",\"lng\":115.569601,\"lat\":35.072701,\"adcode\":371703,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"东明县\",\"lng\":115.098412,\"lat\":35.289637,\"adcode\":371728,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"菏泽市\",\"lng\":115.469381,\"lat\":35.246531,\"adcode\":371700,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"巨野县\",\"lng\":116.089341,\"lat\":35.390999,\"adcode\":371724,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"鄄城县\",\"lng\":115.51434,\"lat\":35.560257,\"adcode\":371726,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"牡丹区\",\"lng\":115.470946,\"lat\":35.24311,\"adcode\":371702,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"菏泽市\",\"n\":\"郓城县\",\"lng\":115.93885,\"lat\":35.594773,\"adcode\":371725,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"钢城区\",\"lng\":117.82033,\"lat\":36.058038,\"adcode\":370117,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"槐荫区\",\"lng\":116.947921,\"lat\":36.668205,\"adcode\":370104,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"济南市\",\"lng\":117.000923,\"lat\":36.675807,\"adcode\":370100,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"济阳区\",\"lng\":117.176035,\"lat\":36.976771,\"adcode\":370115,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"莱芜区\",\"lng\":117.675808,\"lat\":36.214395,\"adcode\":370116,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"历城区\",\"lng\":117.063744,\"lat\":36.681744,\"adcode\":370112,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"历下区\",\"lng\":117.03862,\"lat\":36.664169,\"adcode\":370102,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"平阴县\",\"lng\":116.455054,\"lat\":36.286923,\"adcode\":370124,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"商河县\",\"lng\":117.156369,\"lat\":37.310544,\"adcode\":370126,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"市中区\",\"lng\":116.99898,\"lat\":36.657354,\"adcode\":370103,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"天桥区\",\"lng\":116.996086,\"lat\":36.693374,\"adcode\":370105,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"章丘区\",\"lng\":117.54069,\"lat\":36.71209,\"adcode\":370114,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济南市\",\"n\":\"长清区\",\"lng\":116.74588,\"lat\":36.561049,\"adcode\":370113,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"济宁市\",\"lng\":116.587245,\"lat\":35.415393,\"adcode\":370800,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"嘉祥县\",\"lng\":116.342885,\"lat\":35.398098,\"adcode\":370829,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"金乡县\",\"lng\":116.310364,\"lat\":35.06977,\"adcode\":370828,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"梁山县\",\"lng\":116.08963,\"lat\":35.801843,\"adcode\":370832,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"曲阜市\",\"lng\":116.991885,\"lat\":35.592788,\"adcode\":370881,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"任城区\",\"lng\":116.595261,\"lat\":35.414828,\"adcode\":370811,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"泗水县\",\"lng\":117.273605,\"lat\":35.653216,\"adcode\":370831,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"微山县\",\"lng\":117.12861,\"lat\":34.809525,\"adcode\":370826,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"汶上县\",\"lng\":116.487146,\"lat\":35.721746,\"adcode\":370830,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"兖州区\",\"lng\":116.828996,\"lat\":35.556445,\"adcode\":370812,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"鱼台县\",\"lng\":116.650023,\"lat\":34.997706,\"adcode\":370827,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"济宁市\",\"n\":\"邹城市\",\"lng\":116.96673,\"lat\":35.405259,\"adcode\":370883,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"茌平区\",\"lng\":116.25335,\"lat\":36.591934,\"adcode\":371503,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"东阿县\",\"lng\":116.248855,\"lat\":36.336004,\"adcode\":371524,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"东昌府区\",\"lng\":115.980023,\"lat\":36.45606,\"adcode\":371502,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"高唐县\",\"lng\":116.229662,\"lat\":36.859755,\"adcode\":371526,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"冠县\",\"lng\":115.444808,\"lat\":36.483753,\"adcode\":371525,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"聊城市\",\"lng\":115.980367,\"lat\":36.456013,\"adcode\":371500,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"临清市\",\"lng\":115.713462,\"lat\":36.842598,\"adcode\":371581,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"莘县\",\"lng\":115.667291,\"lat\":36.237597,\"adcode\":371522,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"聊城市\",\"n\":\"阳谷县\",\"lng\":115.784287,\"lat\":36.113708,\"adcode\":371521,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"费县\",\"lng\":117.968869,\"lat\":35.269174,\"adcode\":371325,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"河东区\",\"lng\":118.398296,\"lat\":35.085004,\"adcode\":371312,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"莒南县\",\"lng\":118.838322,\"lat\":35.175911,\"adcode\":371327,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"兰陵县\",\"lng\":118.049968,\"lat\":34.855573,\"adcode\":371324,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"兰山区\",\"lng\":118.327667,\"lat\":35.061631,\"adcode\":371302,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"临沭县\",\"lng\":118.648379,\"lat\":34.917062,\"adcode\":371329,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"临沂市\",\"lng\":118.326443,\"lat\":35.065282,\"adcode\":371300,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"罗庄区\",\"lng\":118.284795,\"lat\":34.997204,\"adcode\":371311,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"蒙阴县\",\"lng\":117.943271,\"lat\":35.712435,\"adcode\":371328,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"平邑县\",\"lng\":117.631884,\"lat\":35.511519,\"adcode\":371326,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"郯城县\",\"lng\":118.342963,\"lat\":34.614741,\"adcode\":371322,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"沂南县\",\"lng\":118.455395,\"lat\":35.547002,\"adcode\":371321,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"临沂市\",\"n\":\"沂水县\",\"lng\":118.634543,\"lat\":35.787029,\"adcode\":371323,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"城阳区\",\"lng\":120.389135,\"lat\":36.306833,\"adcode\":370214,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"黄岛区\",\"lng\":119.995518,\"lat\":35.875138,\"adcode\":370211,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"即墨区\",\"lng\":120.447352,\"lat\":36.390847,\"adcode\":370215,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"胶州市\",\"lng\":120.006202,\"lat\":36.285878,\"adcode\":370281,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"莱西市\",\"lng\":120.526226,\"lat\":36.86509,\"adcode\":370285,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"崂山区\",\"lng\":120.467393,\"lat\":36.102569,\"adcode\":370212,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"李沧区\",\"lng\":120.421236,\"lat\":36.160023,\"adcode\":370213,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"平度市\",\"lng\":119.959012,\"lat\":36.788828,\"adcode\":370283,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"青岛市\",\"lng\":120.355173,\"lat\":36.082982,\"adcode\":370200,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"市北区\",\"lng\":120.355026,\"lat\":36.083819,\"adcode\":370203,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"青岛市\",\"n\":\"市南区\",\"lng\":120.395966,\"lat\":36.070892,\"adcode\":370202,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"日照市\",\"n\":\"东港区\",\"lng\":119.457703,\"lat\":35.426152,\"adcode\":371102,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"日照市\",\"n\":\"莒县\",\"lng\":118.832859,\"lat\":35.588115,\"adcode\":371122,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"日照市\",\"n\":\"岚山区\",\"lng\":119.315844,\"lat\":35.119794,\"adcode\":371103,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"日照市\",\"n\":\"日照市\",\"lng\":119.461208,\"lat\":35.428588,\"adcode\":371100,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"日照市\",\"n\":\"五莲县\",\"lng\":119.206745,\"lat\":35.751936,\"adcode\":371121,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"岱岳区\",\"lng\":117.04353,\"lat\":36.1841,\"adcode\":370911,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"东平县\",\"lng\":116.461052,\"lat\":35.930467,\"adcode\":370923,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"肥城市\",\"lng\":116.763703,\"lat\":36.1856,\"adcode\":370983,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"宁阳县\",\"lng\":116.799297,\"lat\":35.76754,\"adcode\":370921,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"泰安市\",\"lng\":117.129063,\"lat\":36.194968,\"adcode\":370900,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"泰山区\",\"lng\":117.129984,\"lat\":36.189313,\"adcode\":370902,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"泰安市\",\"n\":\"新泰市\",\"lng\":117.766092,\"lat\":35.910387,\"adcode\":370982,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"威海市\",\"n\":\"环翠区\",\"lng\":122.116189,\"lat\":37.510754,\"adcode\":371002,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"威海市\",\"n\":\"荣成市\",\"lng\":122.422896,\"lat\":37.160134,\"adcode\":371082,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"威海市\",\"n\":\"乳山市\",\"lng\":121.536346,\"lat\":36.919622,\"adcode\":371083,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"威海市\",\"n\":\"威海市\",\"lng\":122.116394,\"lat\":37.509691,\"adcode\":371000,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"威海市\",\"n\":\"文登区\",\"lng\":122.057139,\"lat\":37.196211,\"adcode\":371003,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"安丘市\",\"lng\":119.206886,\"lat\":36.427417,\"adcode\":370784,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"昌乐县\",\"lng\":118.839995,\"lat\":36.703253,\"adcode\":370725,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"昌邑市\",\"lng\":119.394502,\"lat\":36.854937,\"adcode\":370786,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"坊子区\",\"lng\":119.166326,\"lat\":36.654616,\"adcode\":370704,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"高密市\",\"lng\":119.757033,\"lat\":36.37754,\"adcode\":370785,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"寒亭区\",\"lng\":119.207866,\"lat\":36.772103,\"adcode\":370703,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"奎文区\",\"lng\":119.137357,\"lat\":36.709494,\"adcode\":370705,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"临朐县\",\"lng\":118.539876,\"lat\":36.516371,\"adcode\":370724,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"青州市\",\"lng\":118.484693,\"lat\":36.697855,\"adcode\":370781,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"寿光市\",\"lng\":118.736451,\"lat\":36.874411,\"adcode\":370783,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"潍城区\",\"lng\":119.103784,\"lat\":36.710062,\"adcode\":370702,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"潍坊市\",\"lng\":119.107078,\"lat\":36.70925,\"adcode\":370700,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"潍坊市\",\"n\":\"诸城市\",\"lng\":119.403182,\"lat\":35.997093,\"adcode\":370782,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"福山区\",\"lng\":121.264741,\"lat\":37.496875,\"adcode\":370611,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"海阳市\",\"lng\":121.168392,\"lat\":36.780657,\"adcode\":370687,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"莱山区\",\"lng\":121.448866,\"lat\":37.473549,\"adcode\":370613,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"莱阳市\",\"lng\":120.711151,\"lat\":36.977037,\"adcode\":370682,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"莱州市\",\"lng\":119.942135,\"lat\":37.182725,\"adcode\":370683,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"龙口市\",\"lng\":120.528328,\"lat\":37.648446,\"adcode\":370681,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"牟平区\",\"lng\":121.60151,\"lat\":37.388356,\"adcode\":370612,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"蓬莱区\",\"lng\":120.759074,\"lat\":37.811045,\"adcode\":370614,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"栖霞市\",\"lng\":120.834097,\"lat\":37.305854,\"adcode\":370686,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"烟台市\",\"lng\":121.391382,\"lat\":37.539297,\"adcode\":370600,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"招远市\",\"lng\":120.403142,\"lat\":37.364919,\"adcode\":370685,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"烟台市\",\"n\":\"芝罘区\",\"lng\":121.385877,\"lat\":37.540925,\"adcode\":370602,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"山亭区\",\"lng\":117.458968,\"lat\":35.096077,\"adcode\":370406,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"市中区\",\"lng\":117.557281,\"lat\":34.856651,\"adcode\":370402,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"台儿庄区\",\"lng\":117.734747,\"lat\":34.564815,\"adcode\":370405,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"滕州市\",\"lng\":117.162098,\"lat\":35.088498,\"adcode\":370481,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"薛城区\",\"lng\":117.265293,\"lat\":34.79789,\"adcode\":370403,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"峄城区\",\"lng\":117.586316,\"lat\":34.767713,\"adcode\":370404,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"枣庄市\",\"n\":\"枣庄市\",\"lng\":117.557964,\"lat\":34.856424,\"adcode\":370400,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"博山区\",\"lng\":117.85823,\"lat\":36.497567,\"adcode\":370304,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"高青县\",\"lng\":117.829839,\"lat\":37.169581,\"adcode\":370322,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"桓台县\",\"lng\":118.101556,\"lat\":36.959773,\"adcode\":370321,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"临淄区\",\"lng\":118.306018,\"lat\":36.816657,\"adcode\":370305,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"沂源县\",\"lng\":118.166161,\"lat\":36.186282,\"adcode\":370323,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"张店区\",\"lng\":118.053521,\"lat\":36.807049,\"adcode\":370303,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"周村区\",\"lng\":117.851036,\"lat\":36.803699,\"adcode\":370306,\"level\":\"district\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"淄博市\",\"lng\":118.047648,\"lat\":36.814939,\"adcode\":370300,\"level\":\"city\"},{\"p\":\"山东\",\"c\":\"淄博市\",\"n\":\"淄川区\",\"lng\":117.967696,\"lat\":36.647272,\"adcode\":370302,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"大同市\",\"lng\":113.295259,\"lat\":40.09031,\"adcode\":140200,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"广灵县\",\"lng\":114.279252,\"lat\":39.763051,\"adcode\":140223,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"浑源县\",\"lng\":113.698091,\"lat\":39.699099,\"adcode\":140225,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"灵丘县\",\"lng\":114.23576,\"lat\":39.438867,\"adcode\":140224,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"平城区\",\"lng\":113.298027,\"lat\":40.075667,\"adcode\":140213,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"天镇县\",\"lng\":114.09112,\"lat\":40.421336,\"adcode\":140222,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"新荣区\",\"lng\":113.141044,\"lat\":40.258269,\"adcode\":140212,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"阳高县\",\"lng\":113.749871,\"lat\":40.364927,\"adcode\":140221,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"云冈区\",\"lng\":113.149693,\"lat\":40.005405,\"adcode\":140214,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"云州区\",\"lng\":113.61244,\"lat\":40.040295,\"adcode\":140215,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"大同市\",\"n\":\"左云县\",\"lng\":112.70641,\"lat\":40.012873,\"adcode\":140226,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"城区\",\"lng\":112.853106,\"lat\":35.496641,\"adcode\":140502,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"高平市\",\"lng\":112.930691,\"lat\":35.791355,\"adcode\":140581,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"晋城市\",\"lng\":112.851274,\"lat\":35.497553,\"adcode\":140500,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"陵川县\",\"lng\":113.278877,\"lat\":35.775614,\"adcode\":140524,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"沁水县\",\"lng\":112.187213,\"lat\":35.689472,\"adcode\":140521,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"阳城县\",\"lng\":112.422014,\"lat\":35.482177,\"adcode\":140522,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋城市\",\"n\":\"泽州县\",\"lng\":112.899137,\"lat\":35.617221,\"adcode\":140525,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"和顺县\",\"lng\":113.572919,\"lat\":37.327027,\"adcode\":140723,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"介休市\",\"lng\":111.913857,\"lat\":37.027616,\"adcode\":140781,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"晋中市\",\"lng\":112.736465,\"lat\":37.696495,\"adcode\":140700,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"灵石县\",\"lng\":111.772759,\"lat\":36.847469,\"adcode\":140729,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"平遥县\",\"lng\":112.174059,\"lat\":37.195474,\"adcode\":140728,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"祁县\",\"lng\":112.330532,\"lat\":37.358739,\"adcode\":140727,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"寿阳县\",\"lng\":113.177708,\"lat\":37.891136,\"adcode\":140725,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"太谷区\",\"lng\":112.554103,\"lat\":37.424595,\"adcode\":140703,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"昔阳县\",\"lng\":113.706166,\"lat\":37.60437,\"adcode\":140724,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"榆次区\",\"lng\":112.740056,\"lat\":37.6976,\"adcode\":140702,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"榆社县\",\"lng\":112.973521,\"lat\":37.069019,\"adcode\":140721,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"晋中市\",\"n\":\"左权县\",\"lng\":113.377834,\"lat\":37.079672,\"adcode\":140722,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"安泽县\",\"lng\":112.251372,\"lat\":36.146032,\"adcode\":141026,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"大宁县\",\"lng\":110.751283,\"lat\":36.46383,\"adcode\":141030,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"汾西县\",\"lng\":111.563021,\"lat\":36.653368,\"adcode\":141034,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"浮山县\",\"lng\":111.850039,\"lat\":35.971359,\"adcode\":141027,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"古县\",\"lng\":111.920207,\"lat\":36.26855,\"adcode\":141025,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"洪洞县\",\"lng\":111.673692,\"lat\":36.255742,\"adcode\":141024,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"侯马市\",\"lng\":111.371272,\"lat\":35.620302,\"adcode\":141081,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"霍州市\",\"lng\":111.723103,\"lat\":36.57202,\"adcode\":141082,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"吉县\",\"lng\":110.682853,\"lat\":36.099355,\"adcode\":141028,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"临汾市\",\"lng\":111.517973,\"lat\":36.08415,\"adcode\":141000,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"蒲县\",\"lng\":111.09733,\"lat\":36.411682,\"adcode\":141033,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"曲沃县\",\"lng\":111.475529,\"lat\":35.641387,\"adcode\":141021,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"隰县\",\"lng\":110.935809,\"lat\":36.692675,\"adcode\":141031,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"乡宁县\",\"lng\":110.857365,\"lat\":35.975402,\"adcode\":141029,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"襄汾县\",\"lng\":111.442932,\"lat\":35.876139,\"adcode\":141023,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"尧都区\",\"lng\":111.522945,\"lat\":36.080366,\"adcode\":141002,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"翼城县\",\"lng\":111.713508,\"lat\":35.738621,\"adcode\":141022,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"临汾市\",\"n\":\"永和县\",\"lng\":110.631276,\"lat\":36.760614,\"adcode\":141032,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"方山县\",\"lng\":111.238885,\"lat\":37.892632,\"adcode\":141128,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"汾阳市\",\"lng\":111.785273,\"lat\":37.267742,\"adcode\":141182,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"交城县\",\"lng\":112.159154,\"lat\":37.555155,\"adcode\":141122,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"交口县\",\"lng\":111.183188,\"lat\":36.983068,\"adcode\":141130,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"岚县\",\"lng\":111.671555,\"lat\":38.278654,\"adcode\":141127,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"离石区\",\"lng\":111.134462,\"lat\":37.524037,\"adcode\":141102,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"临县\",\"lng\":110.995963,\"lat\":37.960806,\"adcode\":141124,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"柳林县\",\"lng\":110.89613,\"lat\":37.431664,\"adcode\":141125,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"吕梁市\",\"lng\":111.134335,\"lat\":37.524366,\"adcode\":141100,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"石楼县\",\"lng\":110.837119,\"lat\":36.999426,\"adcode\":141126,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"文水县\",\"lng\":112.032595,\"lat\":37.436314,\"adcode\":141121,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"孝义市\",\"lng\":111.781568,\"lat\":37.144474,\"adcode\":141181,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"兴县\",\"lng\":111.124816,\"lat\":38.464136,\"adcode\":141123,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"吕梁市\",\"n\":\"中阳县\",\"lng\":111.193319,\"lat\":37.342054,\"adcode\":141129,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"怀仁市\",\"lng\":113.100511,\"lat\":39.820789,\"adcode\":140681,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"平鲁区\",\"lng\":112.295227,\"lat\":39.515603,\"adcode\":140603,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"山阴县\",\"lng\":112.816396,\"lat\":39.52677,\"adcode\":140621,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"朔城区\",\"lng\":112.428676,\"lat\":39.324525,\"adcode\":140602,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"朔州市\",\"lng\":112.433387,\"lat\":39.331261,\"adcode\":140600,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"应县\",\"lng\":113.187505,\"lat\":39.559187,\"adcode\":140622,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"朔州市\",\"n\":\"右玉县\",\"lng\":112.465588,\"lat\":39.988812,\"adcode\":140623,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"古交市\",\"lng\":112.174353,\"lat\":37.908534,\"adcode\":140181,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"尖草坪区\",\"lng\":112.487122,\"lat\":37.939893,\"adcode\":140108,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"晋源区\",\"lng\":112.477849,\"lat\":37.715619,\"adcode\":140110,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"娄烦县\",\"lng\":111.793798,\"lat\":38.066035,\"adcode\":140123,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"清徐县\",\"lng\":112.357961,\"lat\":37.60729,\"adcode\":140121,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"太原市\",\"lng\":112.549248,\"lat\":37.857014,\"adcode\":140100,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"万柏林区\",\"lng\":112.522258,\"lat\":37.862653,\"adcode\":140109,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"小店区\",\"lng\":112.564273,\"lat\":37.817974,\"adcode\":140105,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"杏花岭区\",\"lng\":112.560743,\"lat\":37.879291,\"adcode\":140107,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"阳曲县\",\"lng\":112.673818,\"lat\":38.058797,\"adcode\":140122,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"太原市\",\"n\":\"迎泽区\",\"lng\":112.558851,\"lat\":37.855804,\"adcode\":140106,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"保德县\",\"lng\":111.085688,\"lat\":39.022576,\"adcode\":140931,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"代县\",\"lng\":112.962519,\"lat\":39.065138,\"adcode\":140923,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"定襄县\",\"lng\":112.963231,\"lat\":38.484948,\"adcode\":140921,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"繁峙县\",\"lng\":113.267707,\"lat\":39.188104,\"adcode\":140924,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"河曲县\",\"lng\":111.146609,\"lat\":39.381895,\"adcode\":140930,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"静乐县\",\"lng\":111.940231,\"lat\":38.355947,\"adcode\":140926,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"岢岚县\",\"lng\":111.56981,\"lat\":38.705625,\"adcode\":140929,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"宁武县\",\"lng\":112.307936,\"lat\":39.001718,\"adcode\":140925,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"偏关县\",\"lng\":111.500477,\"lat\":39.442153,\"adcode\":140932,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"神池县\",\"lng\":112.200438,\"lat\":39.088467,\"adcode\":140927,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"五台县\",\"lng\":113.259012,\"lat\":38.725711,\"adcode\":140922,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"五寨县\",\"lng\":111.841015,\"lat\":38.912761,\"adcode\":140928,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"忻府区\",\"lng\":112.734112,\"lat\":38.417743,\"adcode\":140902,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"忻州市\",\"lng\":112.733538,\"lat\":38.41769,\"adcode\":140900,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"忻州市\",\"n\":\"原平市\",\"lng\":112.713132,\"lat\":38.729186,\"adcode\":140981,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"阳泉市\",\"n\":\"城区\",\"lng\":113.586513,\"lat\":37.860938,\"adcode\":140302,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"阳泉市\",\"n\":\"郊区\",\"lng\":113.58664,\"lat\":37.94096,\"adcode\":140311,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"阳泉市\",\"n\":\"矿区\",\"lng\":113.559066,\"lat\":37.870085,\"adcode\":140303,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"阳泉市\",\"n\":\"平定县\",\"lng\":113.631049,\"lat\":37.800289,\"adcode\":140321,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"阳泉市\",\"n\":\"阳泉市\",\"lng\":113.583285,\"lat\":37.861188,\"adcode\":140300,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"阳泉市\",\"n\":\"盂县\",\"lng\":113.41223,\"lat\":38.086131,\"adcode\":140322,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"河津市\",\"lng\":110.710268,\"lat\":35.59715,\"adcode\":140882,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"稷山县\",\"lng\":110.978996,\"lat\":35.600412,\"adcode\":140824,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"绛县\",\"lng\":111.576182,\"lat\":35.49045,\"adcode\":140826,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"临猗县\",\"lng\":110.77493,\"lat\":35.141883,\"adcode\":140821,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"平陆县\",\"lng\":111.212377,\"lat\":34.837256,\"adcode\":140829,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"芮城县\",\"lng\":110.69114,\"lat\":34.694769,\"adcode\":140830,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"万荣县\",\"lng\":110.843561,\"lat\":35.417042,\"adcode\":140822,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"闻喜县\",\"lng\":111.220306,\"lat\":35.353839,\"adcode\":140823,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"夏县\",\"lng\":111.223174,\"lat\":35.140441,\"adcode\":140828,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"新绛县\",\"lng\":111.225205,\"lat\":35.613697,\"adcode\":140825,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"盐湖区\",\"lng\":111.000627,\"lat\":35.025643,\"adcode\":140802,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"永济市\",\"lng\":110.447984,\"lat\":34.865125,\"adcode\":140881,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"垣曲县\",\"lng\":111.67099,\"lat\":35.298293,\"adcode\":140827,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"运城市\",\"n\":\"运城市\",\"lng\":111.003957,\"lat\":35.022778,\"adcode\":140800,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"壶关县\",\"lng\":113.206138,\"lat\":36.110938,\"adcode\":140427,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"黎城县\",\"lng\":113.387366,\"lat\":36.502971,\"adcode\":140426,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"潞城区\",\"lng\":113.223245,\"lat\":36.332232,\"adcode\":140406,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"潞州区\",\"lng\":113.114107,\"lat\":36.187895,\"adcode\":140403,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"平顺县\",\"lng\":113.438791,\"lat\":36.200202,\"adcode\":140425,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"沁县\",\"lng\":112.70138,\"lat\":36.757123,\"adcode\":140430,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"沁源县\",\"lng\":112.340878,\"lat\":36.500777,\"adcode\":140431,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"上党区\",\"lng\":113.056679,\"lat\":36.052438,\"adcode\":140404,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"屯留区\",\"lng\":112.892741,\"lat\":36.314072,\"adcode\":140405,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"武乡县\",\"lng\":112.8653,\"lat\":36.834315,\"adcode\":140429,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"襄垣县\",\"lng\":113.050094,\"lat\":36.532854,\"adcode\":140423,\"level\":\"district\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"长治市\",\"lng\":113.113556,\"lat\":36.191112,\"adcode\":140400,\"level\":\"city\"},{\"p\":\"山西\",\"c\":\"长治市\",\"n\":\"长子县\",\"lng\":112.884656,\"lat\":36.119484,\"adcode\":140428,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"安康市\",\"lng\":109.029273,\"lat\":32.6903,\"adcode\":610900,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"白河县\",\"lng\":110.114186,\"lat\":32.809484,\"adcode\":610929,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"汉滨区\",\"lng\":109.029098,\"lat\":32.690817,\"adcode\":610902,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"汉阴县\",\"lng\":108.510946,\"lat\":32.891121,\"adcode\":610921,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"岚皋县\",\"lng\":108.900663,\"lat\":32.31069,\"adcode\":610925,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"宁陕县\",\"lng\":108.313714,\"lat\":33.312184,\"adcode\":610923,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"平利县\",\"lng\":109.361865,\"lat\":32.387933,\"adcode\":610926,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"石泉县\",\"lng\":108.250512,\"lat\":33.038512,\"adcode\":610922,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"旬阳市\",\"lng\":109.368149,\"lat\":32.833567,\"adcode\":610928,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"镇坪县\",\"lng\":109.526437,\"lat\":31.883395,\"adcode\":610927,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"安康市\",\"n\":\"紫阳县\",\"lng\":108.537788,\"lat\":32.520176,\"adcode\":610924,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"宝鸡市\",\"lng\":107.14487,\"lat\":34.369315,\"adcode\":610300,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"陈仓区\",\"lng\":107.383645,\"lat\":34.352747,\"adcode\":610304,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"凤县\",\"lng\":106.525212,\"lat\":33.912464,\"adcode\":610330,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"凤翔区\",\"lng\":107.400577,\"lat\":34.521668,\"adcode\":610322,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"扶风县\",\"lng\":107.891419,\"lat\":34.375497,\"adcode\":610324,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"金台区\",\"lng\":107.149943,\"lat\":34.375192,\"adcode\":610303,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"麟游县\",\"lng\":107.796608,\"lat\":34.677714,\"adcode\":610329,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"陇县\",\"lng\":106.857066,\"lat\":34.893262,\"adcode\":610327,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"眉县\",\"lng\":107.752371,\"lat\":34.272137,\"adcode\":610326,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"岐山县\",\"lng\":107.624464,\"lat\":34.44296,\"adcode\":610323,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"千阳县\",\"lng\":107.132987,\"lat\":34.642584,\"adcode\":610328,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"太白县\",\"lng\":107.316533,\"lat\":34.059215,\"adcode\":610331,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"宝鸡市\",\"n\":\"渭滨区\",\"lng\":107.144467,\"lat\":34.371008,\"adcode\":610302,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"城固县\",\"lng\":107.329887,\"lat\":33.153098,\"adcode\":610722,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"佛坪县\",\"lng\":107.988582,\"lat\":33.520745,\"adcode\":610730,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"汉台区\",\"lng\":107.028233,\"lat\":33.077674,\"adcode\":610702,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"汉中市\",\"lng\":107.028621,\"lat\":33.077668,\"adcode\":610700,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"留坝县\",\"lng\":106.924377,\"lat\":33.61334,\"adcode\":610729,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"略阳县\",\"lng\":106.153899,\"lat\":33.329638,\"adcode\":610727,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"勉县\",\"lng\":106.680175,\"lat\":33.155618,\"adcode\":610725,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"南郑区\",\"lng\":106.942393,\"lat\":33.003341,\"adcode\":610703,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"宁强县\",\"lng\":106.25739,\"lat\":32.830806,\"adcode\":610726,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"西乡县\",\"lng\":107.765858,\"lat\":32.987961,\"adcode\":610724,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"洋县\",\"lng\":107.549962,\"lat\":33.223283,\"adcode\":610723,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"汉中市\",\"n\":\"镇巴县\",\"lng\":107.89531,\"lat\":32.535854,\"adcode\":610728,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"丹凤县\",\"lng\":110.33191,\"lat\":33.694711,\"adcode\":611022,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"洛南县\",\"lng\":110.145716,\"lat\":34.088502,\"adcode\":611021,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"山阳县\",\"lng\":109.880435,\"lat\":33.530411,\"adcode\":611024,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"商洛市\",\"lng\":109.939776,\"lat\":33.868319,\"adcode\":611000,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"商南县\",\"lng\":110.885437,\"lat\":33.526367,\"adcode\":611023,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"商州区\",\"lng\":109.937685,\"lat\":33.869208,\"adcode\":611002,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"柞水县\",\"lng\":109.111249,\"lat\":33.682773,\"adcode\":611026,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"商洛市\",\"n\":\"镇安县\",\"lng\":109.151075,\"lat\":33.423981,\"adcode\":611025,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"铜川市\",\"n\":\"铜川市\",\"lng\":108.979608,\"lat\":34.916582,\"adcode\":610200,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"铜川市\",\"n\":\"王益区\",\"lng\":109.075862,\"lat\":35.069098,\"adcode\":610202,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"铜川市\",\"n\":\"耀州区\",\"lng\":108.962538,\"lat\":34.910206,\"adcode\":610204,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"铜川市\",\"n\":\"宜君县\",\"lng\":109.118278,\"lat\":35.398766,\"adcode\":610222,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"铜川市\",\"n\":\"印台区\",\"lng\":109.100814,\"lat\":35.111927,\"adcode\":610203,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"白水县\",\"lng\":109.594309,\"lat\":35.177291,\"adcode\":610527,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"澄城县\",\"lng\":109.937609,\"lat\":35.184,\"adcode\":610525,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"大荔县\",\"lng\":109.943123,\"lat\":34.795011,\"adcode\":610523,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"富平县\",\"lng\":109.187174,\"lat\":34.746679,\"adcode\":610528,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"韩城市\",\"lng\":110.452391,\"lat\":35.475238,\"adcode\":610581,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"合阳县\",\"lng\":110.147979,\"lat\":35.237098,\"adcode\":610524,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"华阴市\",\"lng\":110.08952,\"lat\":34.565359,\"adcode\":610582,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"华州区\",\"lng\":109.76141,\"lat\":34.511958,\"adcode\":610503,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"临渭区\",\"lng\":109.503299,\"lat\":34.501271,\"adcode\":610502,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"蒲城县\",\"lng\":109.589653,\"lat\":34.956034,\"adcode\":610526,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"潼关县\",\"lng\":110.24726,\"lat\":34.544515,\"adcode\":610522,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"渭南市\",\"n\":\"渭南市\",\"lng\":109.502882,\"lat\":34.499381,\"adcode\":610500,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"灞桥区\",\"lng\":109.067261,\"lat\":34.267453,\"adcode\":610111,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"碑林区\",\"lng\":108.946994,\"lat\":34.251061,\"adcode\":610103,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"高陵区\",\"lng\":109.088896,\"lat\":34.535065,\"adcode\":610117,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"鄠邑区\",\"lng\":108.607385,\"lat\":34.108668,\"adcode\":610118,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"蓝田县\",\"lng\":109.317634,\"lat\":34.156189,\"adcode\":610122,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"莲湖区\",\"lng\":108.933194,\"lat\":34.2656,\"adcode\":610104,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"临潼区\",\"lng\":109.213986,\"lat\":34.372065,\"adcode\":610115,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"未央区\",\"lng\":108.946022,\"lat\":34.30823,\"adcode\":610112,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"西安市\",\"lng\":108.948024,\"lat\":34.263161,\"adcode\":610100,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"新城区\",\"lng\":108.959903,\"lat\":34.26927,\"adcode\":610102,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"阎良区\",\"lng\":109.22802,\"lat\":34.662141,\"adcode\":610114,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"雁塔区\",\"lng\":108.926593,\"lat\":34.213389,\"adcode\":610113,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"长安区\",\"lng\":108.941579,\"lat\":34.157097,\"adcode\":610116,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"西安市\",\"n\":\"周至县\",\"lng\":108.216465,\"lat\":34.161532,\"adcode\":610124,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"彬州市\",\"lng\":108.083674,\"lat\":35.034233,\"adcode\":610482,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"淳化县\",\"lng\":108.581173,\"lat\":34.79797,\"adcode\":610430,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"泾阳县\",\"lng\":108.83784,\"lat\":34.528493,\"adcode\":610423,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"礼泉县\",\"lng\":108.428317,\"lat\":34.482583,\"adcode\":610425,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"乾县\",\"lng\":108.247406,\"lat\":34.527261,\"adcode\":610424,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"秦都区\",\"lng\":108.698636,\"lat\":34.329801,\"adcode\":610402,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"三原县\",\"lng\":108.943481,\"lat\":34.613996,\"adcode\":610422,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"渭城区\",\"lng\":108.730957,\"lat\":34.336847,\"adcode\":610404,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"武功县\",\"lng\":108.212857,\"lat\":34.259732,\"adcode\":610431,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"咸阳市\",\"lng\":108.705117,\"lat\":34.333439,\"adcode\":610400,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"兴平市\",\"lng\":108.488493,\"lat\":34.297134,\"adcode\":610481,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"旬邑县\",\"lng\":108.337231,\"lat\":35.112234,\"adcode\":610429,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"杨陵区\",\"lng\":108.086348,\"lat\":34.27135,\"adcode\":610403,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"永寿县\",\"lng\":108.143129,\"lat\":34.692619,\"adcode\":610426,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"咸阳市\",\"n\":\"长武县\",\"lng\":107.795835,\"lat\":35.206122,\"adcode\":610428,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"安塞区\",\"lng\":109.325341,\"lat\":36.86441,\"adcode\":610603,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"宝塔区\",\"lng\":109.49069,\"lat\":36.596291,\"adcode\":610602,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"富县\",\"lng\":109.384136,\"lat\":35.996495,\"adcode\":610628,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"甘泉县\",\"lng\":109.34961,\"lat\":36.277729,\"adcode\":610627,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"黄陵县\",\"lng\":109.262469,\"lat\":35.580165,\"adcode\":610632,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"黄龙县\",\"lng\":109.83502,\"lat\":35.583276,\"adcode\":610631,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"洛川县\",\"lng\":109.435712,\"lat\":35.762133,\"adcode\":610629,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"吴起县\",\"lng\":108.176976,\"lat\":36.924852,\"adcode\":610626,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"延安市\",\"lng\":109.49081,\"lat\":36.596537,\"adcode\":610600,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"延川县\",\"lng\":110.190314,\"lat\":36.882066,\"adcode\":610622,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"延长县\",\"lng\":110.012961,\"lat\":36.578306,\"adcode\":610621,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"宜川县\",\"lng\":110.175537,\"lat\":36.050391,\"adcode\":610630,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"志丹县\",\"lng\":108.768898,\"lat\":36.823031,\"adcode\":610625,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"延安市\",\"n\":\"子长市\",\"lng\":109.675968,\"lat\":37.14207,\"adcode\":610681,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"定边县\",\"lng\":107.601284,\"lat\":37.59523,\"adcode\":610825,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"府谷县\",\"lng\":111.069645,\"lat\":39.029243,\"adcode\":610822,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"横山区\",\"lng\":109.292596,\"lat\":37.964048,\"adcode\":610803,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"佳县\",\"lng\":110.493367,\"lat\":38.021597,\"adcode\":610828,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"靖边县\",\"lng\":108.80567,\"lat\":37.596084,\"adcode\":610824,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"米脂县\",\"lng\":110.178683,\"lat\":37.759081,\"adcode\":610827,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"清涧县\",\"lng\":110.12146,\"lat\":37.087702,\"adcode\":610830,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"神木市\",\"lng\":110.497005,\"lat\":38.835641,\"adcode\":610881,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"绥德县\",\"lng\":110.265377,\"lat\":37.507701,\"adcode\":610826,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"吴堡县\",\"lng\":110.739315,\"lat\":37.451925,\"adcode\":610829,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"榆林市\",\"lng\":109.741193,\"lat\":38.290162,\"adcode\":610800,\"level\":\"city\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"榆阳区\",\"lng\":109.74791,\"lat\":38.299267,\"adcode\":610802,\"level\":\"district\"},{\"p\":\"陕西\",\"c\":\"榆林市\",\"n\":\"子洲县\",\"lng\":110.03457,\"lat\":37.611573,\"adcode\":610831,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"宝山区\",\"lng\":121.489934,\"lat\":31.398896,\"adcode\":310113,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"崇明区\",\"lng\":121.397516,\"lat\":31.626946,\"adcode\":310151,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"奉贤区\",\"lng\":121.458472,\"lat\":30.912345,\"adcode\":310120,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"虹口区\",\"lng\":121.491832,\"lat\":31.26097,\"adcode\":310109,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"黄浦区\",\"lng\":121.490317,\"lat\":31.222771,\"adcode\":310101,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"嘉定区\",\"lng\":121.250333,\"lat\":31.383524,\"adcode\":310114,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"金山区\",\"lng\":121.330736,\"lat\":30.724697,\"adcode\":310116,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"静安区\",\"lng\":121.448224,\"lat\":31.229003,\"adcode\":310106,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"闵行区\",\"lng\":121.375972,\"lat\":31.111658,\"adcode\":310112,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"浦东新区\",\"lng\":121.567706,\"lat\":31.245944,\"adcode\":310115,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"普陀区\",\"lng\":121.392499,\"lat\":31.241701,\"adcode\":310107,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"青浦区\",\"lng\":121.113021,\"lat\":31.151209,\"adcode\":310118,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"上海\",\"lng\":121.472644,\"lat\":31.231706,\"adcode\":310000,\"level\":\"city\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"松江区\",\"lng\":121.223543,\"lat\":31.03047,\"adcode\":310117,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"徐汇区\",\"lng\":121.43752,\"lat\":31.179973,\"adcode\":310104,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"杨浦区\",\"lng\":121.522797,\"lat\":31.270755,\"adcode\":310110,\"level\":\"district\"},{\"p\":\"上海\",\"c\":\"上海\",\"n\":\"长宁区\",\"lng\":121.4222,\"lat\":31.218123,\"adcode\":310105,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"阿坝藏族羌族自治州\",\"lng\":102.221374,\"lat\":31.899792,\"adcode\":513200,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"阿坝县\",\"lng\":101.700985,\"lat\":32.904223,\"adcode\":513231,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"黑水县\",\"lng\":102.990805,\"lat\":32.061721,\"adcode\":513228,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"红原县\",\"lng\":102.544906,\"lat\":32.793902,\"adcode\":513233,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"金川县\",\"lng\":102.064647,\"lat\":31.476356,\"adcode\":513226,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"九寨沟县\",\"lng\":104.236344,\"lat\":33.262097,\"adcode\":513225,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"理县\",\"lng\":103.165486,\"lat\":31.436764,\"adcode\":513222,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"马尔康市\",\"lng\":102.221187,\"lat\":31.899761,\"adcode\":513201,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"茂县\",\"lng\":103.850684,\"lat\":31.680407,\"adcode\":513223,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"壤塘县\",\"lng\":100.979136,\"lat\":32.264887,\"adcode\":513230,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"若尔盖县\",\"lng\":102.963726,\"lat\":33.575934,\"adcode\":513232,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"松潘县\",\"lng\":103.599177,\"lat\":32.63838,\"adcode\":513224,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"汶川县\",\"lng\":103.580675,\"lat\":31.47463,\"adcode\":513221,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"阿坝藏族羌族自治州\",\"n\":\"小金县\",\"lng\":102.363193,\"lat\":30.999016,\"adcode\":513227,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"巴中市\",\"n\":\"巴中市\",\"lng\":106.753669,\"lat\":31.858809,\"adcode\":511900,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"巴中市\",\"n\":\"巴州区\",\"lng\":106.753671,\"lat\":31.858366,\"adcode\":511902,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"巴中市\",\"n\":\"恩阳区\",\"lng\":106.486515,\"lat\":31.816336,\"adcode\":511903,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"巴中市\",\"n\":\"南江县\",\"lng\":106.843418,\"lat\":32.353164,\"adcode\":511922,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"巴中市\",\"n\":\"平昌县\",\"lng\":107.101937,\"lat\":31.562814,\"adcode\":511923,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"巴中市\",\"n\":\"通江县\",\"lng\":107.247621,\"lat\":31.91212,\"adcode\":511921,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"成都市\",\"lng\":104.065735,\"lat\":30.659462,\"adcode\":510100,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"成华区\",\"lng\":104.103077,\"lat\":30.660275,\"adcode\":510108,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"崇州市\",\"lng\":103.671049,\"lat\":30.631478,\"adcode\":510184,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"大邑县\",\"lng\":103.522397,\"lat\":30.586602,\"adcode\":510129,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"都江堰市\",\"lng\":103.627898,\"lat\":30.99114,\"adcode\":510181,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"简阳市\",\"lng\":104.550339,\"lat\":30.390666,\"adcode\":510185,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"金牛区\",\"lng\":104.043487,\"lat\":30.692058,\"adcode\":510106,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"金堂县\",\"lng\":104.415604,\"lat\":30.858417,\"adcode\":510121,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"锦江区\",\"lng\":104.080989,\"lat\":30.657689,\"adcode\":510104,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"龙泉驿区\",\"lng\":104.269181,\"lat\":30.56065,\"adcode\":510112,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"彭州市\",\"lng\":103.941173,\"lat\":30.985161,\"adcode\":510182,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"郫都区\",\"lng\":103.887842,\"lat\":30.808752,\"adcode\":510117,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"蒲江县\",\"lng\":103.511541,\"lat\":30.194359,\"adcode\":510131,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"青白江区\",\"lng\":104.25494,\"lat\":30.883438,\"adcode\":510113,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"青羊区\",\"lng\":104.055731,\"lat\":30.667648,\"adcode\":510105,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"邛崃市\",\"lng\":103.46143,\"lat\":30.413271,\"adcode\":510183,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"双流区\",\"lng\":103.922706,\"lat\":30.573243,\"adcode\":510116,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"温江区\",\"lng\":103.836776,\"lat\":30.697996,\"adcode\":510115,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"武侯区\",\"lng\":104.05167,\"lat\":30.630862,\"adcode\":510107,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"新都区\",\"lng\":104.16022,\"lat\":30.824223,\"adcode\":510114,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"成都市\",\"n\":\"新津区\",\"lng\":103.812449,\"lat\":30.414284,\"adcode\":510118,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"达川区\",\"lng\":107.507926,\"lat\":31.199062,\"adcode\":511703,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"达州市\",\"lng\":107.502262,\"lat\":31.209484,\"adcode\":511700,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"大竹县\",\"lng\":107.20742,\"lat\":30.736289,\"adcode\":511724,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"开江县\",\"lng\":107.864135,\"lat\":31.085537,\"adcode\":511723,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"渠县\",\"lng\":106.970746,\"lat\":30.836348,\"adcode\":511725,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"通川区\",\"lng\":107.501062,\"lat\":31.213522,\"adcode\":511702,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"万源市\",\"lng\":108.037548,\"lat\":32.06777,\"adcode\":511781,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"达州市\",\"n\":\"宣汉县\",\"lng\":107.722254,\"lat\":31.355025,\"adcode\":511722,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"德阳市\",\"lng\":104.398651,\"lat\":31.127991,\"adcode\":510600,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"广汉市\",\"lng\":104.281903,\"lat\":30.97715,\"adcode\":510681,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"旌阳区\",\"lng\":104.389648,\"lat\":31.130428,\"adcode\":510603,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"罗江区\",\"lng\":104.507126,\"lat\":31.303281,\"adcode\":510604,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"绵竹市\",\"lng\":104.200162,\"lat\":31.343084,\"adcode\":510683,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"什邡市\",\"lng\":104.173653,\"lat\":31.126881,\"adcode\":510682,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"德阳市\",\"n\":\"中江县\",\"lng\":104.677831,\"lat\":31.03681,\"adcode\":510623,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"巴塘县\",\"lng\":99.109037,\"lat\":30.005723,\"adcode\":513335,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"白玉县\",\"lng\":98.824343,\"lat\":31.208805,\"adcode\":513331,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"丹巴县\",\"lng\":101.886125,\"lat\":30.877083,\"adcode\":513323,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"道孚县\",\"lng\":101.123327,\"lat\":30.978767,\"adcode\":513326,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"稻城县\",\"lng\":100.296689,\"lat\":29.037544,\"adcode\":513337,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"得荣县\",\"lng\":99.288036,\"lat\":28.71134,\"adcode\":513338,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"德格县\",\"lng\":98.57999,\"lat\":31.806729,\"adcode\":513330,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"甘孜藏族自治州\",\"lng\":101.963815,\"lat\":30.050663,\"adcode\":513300,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"甘孜县\",\"lng\":99.991753,\"lat\":31.61975,\"adcode\":513328,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"九龙县\",\"lng\":101.506942,\"lat\":29.001975,\"adcode\":513324,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"康定市\",\"lng\":101.964057,\"lat\":30.050738,\"adcode\":513301,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"理塘县\",\"lng\":100.269862,\"lat\":29.991807,\"adcode\":513334,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"泸定县\",\"lng\":102.233225,\"lat\":29.912482,\"adcode\":513322,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"炉霍县\",\"lng\":100.679495,\"lat\":31.392674,\"adcode\":513327,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"色达县\",\"lng\":100.331657,\"lat\":32.268777,\"adcode\":513333,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"石渠县\",\"lng\":98.100887,\"lat\":32.975302,\"adcode\":513332,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"乡城县\",\"lng\":99.799943,\"lat\":28.930855,\"adcode\":513336,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"新龙县\",\"lng\":100.312094,\"lat\":30.93896,\"adcode\":513329,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"甘孜藏族自治州\",\"n\":\"雅江县\",\"lng\":101.015735,\"lat\":30.03225,\"adcode\":513325,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"广安区\",\"lng\":106.632907,\"lat\":30.456462,\"adcode\":511602,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"广安市\",\"lng\":106.633369,\"lat\":30.456398,\"adcode\":511600,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"华蓥市\",\"lng\":106.777882,\"lat\":30.380574,\"adcode\":511681,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"邻水县\",\"lng\":106.934968,\"lat\":30.334323,\"adcode\":511623,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"前锋区\",\"lng\":106.893277,\"lat\":30.4963,\"adcode\":511603,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"武胜县\",\"lng\":106.292473,\"lat\":30.344291,\"adcode\":511622,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广安市\",\"n\":\"岳池县\",\"lng\":106.444451,\"lat\":30.533538,\"adcode\":511621,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"苍溪县\",\"lng\":105.939706,\"lat\":31.732251,\"adcode\":510824,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"朝天区\",\"lng\":105.88917,\"lat\":32.642632,\"adcode\":510812,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"广元市\",\"lng\":105.829757,\"lat\":32.433668,\"adcode\":510800,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"剑阁县\",\"lng\":105.527035,\"lat\":32.286517,\"adcode\":510823,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"利州区\",\"lng\":105.826194,\"lat\":32.432276,\"adcode\":510802,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"青川县\",\"lng\":105.238847,\"lat\":32.585655,\"adcode\":510822,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"旺苍县\",\"lng\":106.290426,\"lat\":32.22833,\"adcode\":510821,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"广元市\",\"n\":\"昭化区\",\"lng\":105.964121,\"lat\":32.322788,\"adcode\":510811,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"峨边彝族自治县\",\"lng\":103.262148,\"lat\":29.230271,\"adcode\":511132,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"峨眉山市\",\"lng\":103.492488,\"lat\":29.597478,\"adcode\":511181,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"夹江县\",\"lng\":103.578862,\"lat\":29.741019,\"adcode\":511126,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"犍为县\",\"lng\":103.944266,\"lat\":29.209782,\"adcode\":511123,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"金口河区\",\"lng\":103.077831,\"lat\":29.24602,\"adcode\":511113,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"井研县\",\"lng\":104.06885,\"lat\":29.651645,\"adcode\":511124,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"乐山市\",\"lng\":103.761263,\"lat\":29.582024,\"adcode\":511100,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"马边彝族自治县\",\"lng\":103.546851,\"lat\":28.838933,\"adcode\":511133,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"沐川县\",\"lng\":103.90211,\"lat\":28.956338,\"adcode\":511129,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"沙湾区\",\"lng\":103.549961,\"lat\":29.416536,\"adcode\":511111,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"市中区\",\"lng\":103.75539,\"lat\":29.588327,\"adcode\":511102,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"乐山市\",\"n\":\"五通桥区\",\"lng\":103.816837,\"lat\":29.406186,\"adcode\":511112,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"布拖县\",\"lng\":102.808801,\"lat\":27.709062,\"adcode\":513429,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"德昌县\",\"lng\":102.178845,\"lat\":27.403827,\"adcode\":513424,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"甘洛县\",\"lng\":102.775924,\"lat\":28.977094,\"adcode\":513435,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"会东县\",\"lng\":102.578985,\"lat\":26.630713,\"adcode\":513426,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"会理市\",\"lng\":102.249548,\"lat\":26.658702,\"adcode\":513425,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"金阳县\",\"lng\":103.248704,\"lat\":27.695916,\"adcode\":513430,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"雷波县\",\"lng\":103.571584,\"lat\":28.262946,\"adcode\":513437,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"凉山彝族自治州\",\"lng\":102.258746,\"lat\":27.886762,\"adcode\":513400,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"美姑县\",\"lng\":103.132007,\"lat\":28.327946,\"adcode\":513436,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"冕宁县\",\"lng\":102.170046,\"lat\":28.550844,\"adcode\":513433,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"木里藏族自治县\",\"lng\":101.280184,\"lat\":27.926859,\"adcode\":513422,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"宁南县\",\"lng\":102.757374,\"lat\":27.065205,\"adcode\":513427,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"普格县\",\"lng\":102.541082,\"lat\":27.376828,\"adcode\":513428,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"西昌市\",\"lng\":102.258758,\"lat\":27.885786,\"adcode\":513401,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"喜德县\",\"lng\":102.412342,\"lat\":28.305486,\"adcode\":513432,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"盐源县\",\"lng\":101.508909,\"lat\":27.423415,\"adcode\":513423,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"越西县\",\"lng\":102.508875,\"lat\":28.639632,\"adcode\":513434,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"凉山彝族自治州\",\"n\":\"昭觉县\",\"lng\":102.843991,\"lat\":28.010554,\"adcode\":513431,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"古蔺县\",\"lng\":105.813359,\"lat\":28.03948,\"adcode\":510525,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"合江县\",\"lng\":105.834098,\"lat\":28.810325,\"adcode\":510522,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"江阳区\",\"lng\":105.445131,\"lat\":28.882889,\"adcode\":510502,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"龙马潭区\",\"lng\":105.435228,\"lat\":28.897572,\"adcode\":510504,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"泸县\",\"lng\":105.376335,\"lat\":29.151288,\"adcode\":510521,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"泸州市\",\"lng\":105.443348,\"lat\":28.889138,\"adcode\":510500,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"纳溪区\",\"lng\":105.37721,\"lat\":28.77631,\"adcode\":510503,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"泸州市\",\"n\":\"叙永县\",\"lng\":105.437775,\"lat\":28.167919,\"adcode\":510524,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"丹棱县\",\"lng\":103.518333,\"lat\":30.012751,\"adcode\":511424,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"东坡区\",\"lng\":103.831553,\"lat\":30.048128,\"adcode\":511402,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"洪雅县\",\"lng\":103.375006,\"lat\":29.904867,\"adcode\":511423,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"眉山市\",\"lng\":103.831788,\"lat\":30.048318,\"adcode\":511400,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"彭山区\",\"lng\":103.8701,\"lat\":30.192298,\"adcode\":511403,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"青神县\",\"lng\":103.846131,\"lat\":29.831469,\"adcode\":511425,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"眉山市\",\"n\":\"仁寿县\",\"lng\":104.147646,\"lat\":29.996721,\"adcode\":511421,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"安州区\",\"lng\":104.560341,\"lat\":31.53894,\"adcode\":510705,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"北川羌族自治县\",\"lng\":104.468069,\"lat\":31.615863,\"adcode\":510726,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"涪城区\",\"lng\":104.740971,\"lat\":31.463557,\"adcode\":510703,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"江油市\",\"lng\":104.744431,\"lat\":31.776386,\"adcode\":510781,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"绵阳市\",\"lng\":104.741722,\"lat\":31.46402,\"adcode\":510700,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"平武县\",\"lng\":104.530555,\"lat\":32.407588,\"adcode\":510727,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"三台县\",\"lng\":105.090316,\"lat\":31.090909,\"adcode\":510722,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"盐亭县\",\"lng\":105.391991,\"lat\":31.22318,\"adcode\":510723,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"游仙区\",\"lng\":104.770006,\"lat\":31.484772,\"adcode\":510704,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"绵阳市\",\"n\":\"梓潼县\",\"lng\":105.16353,\"lat\":31.635225,\"adcode\":510725,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"高坪区\",\"lng\":106.108996,\"lat\":30.781809,\"adcode\":511303,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"嘉陵区\",\"lng\":106.067027,\"lat\":30.762976,\"adcode\":511304,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"阆中市\",\"lng\":105.975266,\"lat\":31.580466,\"adcode\":511381,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"南部县\",\"lng\":106.061138,\"lat\":31.349407,\"adcode\":511321,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"南充市\",\"lng\":106.082974,\"lat\":30.795281,\"adcode\":511300,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"蓬安县\",\"lng\":106.413488,\"lat\":31.027978,\"adcode\":511323,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"顺庆区\",\"lng\":106.084091,\"lat\":30.795572,\"adcode\":511302,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"西充县\",\"lng\":105.893021,\"lat\":30.994616,\"adcode\":511325,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"仪陇县\",\"lng\":106.297083,\"lat\":31.271261,\"adcode\":511324,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"南充市\",\"n\":\"营山县\",\"lng\":106.564893,\"lat\":31.075907,\"adcode\":511322,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"内江市\",\"n\":\"东兴区\",\"lng\":105.067203,\"lat\":29.600107,\"adcode\":511011,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"内江市\",\"n\":\"隆昌市\",\"lng\":105.288074,\"lat\":29.338162,\"adcode\":511083,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"内江市\",\"n\":\"内江市\",\"lng\":105.066138,\"lat\":29.58708,\"adcode\":511000,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"内江市\",\"n\":\"市中区\",\"lng\":105.065467,\"lat\":29.585265,\"adcode\":511002,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"内江市\",\"n\":\"威远县\",\"lng\":104.668327,\"lat\":29.52686,\"adcode\":511024,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"内江市\",\"n\":\"资中县\",\"lng\":104.852463,\"lat\":29.775295,\"adcode\":511025,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"攀枝花市\",\"n\":\"东区\",\"lng\":101.715134,\"lat\":26.580887,\"adcode\":510402,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"攀枝花市\",\"n\":\"米易县\",\"lng\":102.109877,\"lat\":26.887474,\"adcode\":510421,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"攀枝花市\",\"n\":\"攀枝花市\",\"lng\":101.716007,\"lat\":26.580446,\"adcode\":510400,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"攀枝花市\",\"n\":\"仁和区\",\"lng\":101.737916,\"lat\":26.497185,\"adcode\":510411,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"攀枝花市\",\"n\":\"西区\",\"lng\":101.637969,\"lat\":26.596776,\"adcode\":510403,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"攀枝花市\",\"n\":\"盐边县\",\"lng\":101.851848,\"lat\":26.677619,\"adcode\":510422,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"遂宁市\",\"n\":\"安居区\",\"lng\":105.459383,\"lat\":30.346121,\"adcode\":510904,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"遂宁市\",\"n\":\"船山区\",\"lng\":105.582215,\"lat\":30.502647,\"adcode\":510903,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"遂宁市\",\"n\":\"大英县\",\"lng\":105.252187,\"lat\":30.581571,\"adcode\":510923,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"遂宁市\",\"n\":\"蓬溪县\",\"lng\":105.713699,\"lat\":30.774883,\"adcode\":510921,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"遂宁市\",\"n\":\"射洪市\",\"lng\":105.381849,\"lat\":30.868752,\"adcode\":510981,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"遂宁市\",\"n\":\"遂宁市\",\"lng\":105.571331,\"lat\":30.513311,\"adcode\":510900,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"宝兴县\",\"lng\":102.813377,\"lat\":30.369026,\"adcode\":511827,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"汉源县\",\"lng\":102.677145,\"lat\":29.349915,\"adcode\":511823,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"芦山县\",\"lng\":102.924016,\"lat\":30.152907,\"adcode\":511826,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"名山区\",\"lng\":103.112214,\"lat\":30.084718,\"adcode\":511803,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"石棉县\",\"lng\":102.35962,\"lat\":29.234063,\"adcode\":511824,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"天全县\",\"lng\":102.763462,\"lat\":30.059955,\"adcode\":511825,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"荥经县\",\"lng\":102.844674,\"lat\":29.795529,\"adcode\":511822,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"雅安市\",\"lng\":103.001033,\"lat\":29.987722,\"adcode\":511800,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"雅安市\",\"n\":\"雨城区\",\"lng\":103.003398,\"lat\":29.981831,\"adcode\":511802,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"翠屏区\",\"lng\":104.630231,\"lat\":28.760179,\"adcode\":511502,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"高县\",\"lng\":104.519187,\"lat\":28.435676,\"adcode\":511525,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"珙县\",\"lng\":104.712268,\"lat\":28.449041,\"adcode\":511526,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"江安县\",\"lng\":105.068697,\"lat\":28.728102,\"adcode\":511523,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"南溪区\",\"lng\":104.981133,\"lat\":28.839806,\"adcode\":511503,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"屏山县\",\"lng\":104.162617,\"lat\":28.64237,\"adcode\":511529,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"兴文县\",\"lng\":105.236549,\"lat\":28.302988,\"adcode\":511528,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"叙州区\",\"lng\":104.541489,\"lat\":28.695678,\"adcode\":511504,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"宜宾市\",\"lng\":104.630825,\"lat\":28.760189,\"adcode\":511500,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"筠连县\",\"lng\":104.507848,\"lat\":28.162017,\"adcode\":511527,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"宜宾市\",\"n\":\"长宁县\",\"lng\":104.921116,\"lat\":28.577271,\"adcode\":511524,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"资阳市\",\"n\":\"安岳县\",\"lng\":105.336764,\"lat\":30.099206,\"adcode\":512021,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"资阳市\",\"n\":\"乐至县\",\"lng\":105.031142,\"lat\":30.275619,\"adcode\":512022,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"资阳市\",\"n\":\"雁江区\",\"lng\":104.642338,\"lat\":30.121686,\"adcode\":512002,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"资阳市\",\"n\":\"资阳市\",\"lng\":104.641917,\"lat\":30.122211,\"adcode\":512000,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"大安区\",\"lng\":104.783229,\"lat\":29.367136,\"adcode\":510304,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"富顺县\",\"lng\":104.984256,\"lat\":29.181282,\"adcode\":510322,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"贡井区\",\"lng\":104.714372,\"lat\":29.345675,\"adcode\":510303,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"荣县\",\"lng\":104.423932,\"lat\":29.454851,\"adcode\":510321,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"沿滩区\",\"lng\":104.876417,\"lat\":29.272521,\"adcode\":510311,\"level\":\"district\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"自贡市\",\"lng\":104.773447,\"lat\":29.352765,\"adcode\":510300,\"level\":\"city\"},{\"p\":\"四川\",\"c\":\"自贡市\",\"n\":\"自流井区\",\"lng\":104.778188,\"lat\":29.343231,\"adcode\":510302,\"level\":\"district\"},{\"p\":\"台湾\",\"c\":\"高雄市\",\"n\":\"高雄市\",\"lng\":120.312,\"lat\":22.62,\"adcode\":900006,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"花莲县\",\"n\":\"花莲县\",\"lng\":121.6014,\"lat\":23.9769,\"adcode\":900018,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"基隆市\",\"n\":\"基隆市\",\"lng\":121.7081,\"lat\":25.1276,\"adcode\":900007,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"嘉义市\",\"n\":\"嘉义市\",\"lng\":120.4526,\"lat\":23.4809,\"adcode\":900009,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"嘉义县\",\"n\":\"嘉义县\",\"lng\":120.5719,\"lat\":23.4519,\"adcode\":900015,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"苗栗县\",\"n\":\"苗栗县\",\"lng\":120.9417,\"lat\":24.4895,\"adcode\":900011,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"南投县\",\"n\":\"南投县\",\"lng\":120.987,\"lat\":23.838,\"adcode\":900013,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"澎湖县\",\"n\":\"澎湖县\",\"lng\":119.6152,\"lat\":23.5984,\"adcode\":900020,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"屏东县\",\"n\":\"屏东县\",\"lng\":120.4879,\"lat\":22.6686,\"adcode\":900016,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"台北市\",\"n\":\"台北市\",\"lng\":121.5654,\"lat\":25.033,\"adcode\":900001,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"台东县\",\"n\":\"台东县\",\"lng\":120.9876,\"lat\":22.7583,\"adcode\":900019,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"台南市\",\"n\":\"台南市\",\"lng\":120.2133,\"lat\":22.995,\"adcode\":900005,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"台中市\",\"n\":\"台中市\",\"lng\":120.9417,\"lat\":24.233,\"adcode\":900004,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"桃园市\",\"n\":\"桃园市\",\"lng\":121.2108,\"lat\":24.9936,\"adcode\":900003,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"新北市\",\"n\":\"新北市\",\"lng\":121.4652,\"lat\":25.012,\"adcode\":900002,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"新竹市\",\"n\":\"新竹市\",\"lng\":120.9618,\"lat\":24.8039,\"adcode\":900008,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"新竹县\",\"n\":\"新竹县\",\"lng\":121.1252,\"lat\":24.7033,\"adcode\":900010,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"宜兰县\",\"n\":\"宜兰县\",\"lng\":121.8317,\"lat\":24.7021,\"adcode\":900017,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"云林县\",\"n\":\"云林县\",\"lng\":120.3897,\"lat\":23.7559,\"adcode\":900014,\"level\":\"city\"},{\"p\":\"台湾\",\"c\":\"彰化县\",\"n\":\"彰化县\",\"lng\":120.4818,\"lat\":24.0774,\"adcode\":900012,\"level\":\"city\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"宝坻区\",\"lng\":117.308094,\"lat\":39.716965,\"adcode\":120115,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"北辰区\",\"lng\":117.13482,\"lat\":39.225555,\"adcode\":120113,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"滨海新区\",\"lng\":117.654173,\"lat\":39.032846,\"adcode\":120116,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"东丽区\",\"lng\":117.313967,\"lat\":39.087764,\"adcode\":120110,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"和平区\",\"lng\":117.195907,\"lat\":39.118327,\"adcode\":120101,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"河北区\",\"lng\":117.201569,\"lat\":39.156632,\"adcode\":120105,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"河东区\",\"lng\":117.226568,\"lat\":39.122125,\"adcode\":120102,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"河西区\",\"lng\":117.217536,\"lat\":39.101897,\"adcode\":120103,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"红桥区\",\"lng\":117.163301,\"lat\":39.175066,\"adcode\":120106,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"蓟州区\",\"lng\":117.407449,\"lat\":40.045342,\"adcode\":120119,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"津南区\",\"lng\":117.382549,\"lat\":38.989577,\"adcode\":120112,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"静海区\",\"lng\":116.925304,\"lat\":38.935671,\"adcode\":120118,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"南开区\",\"lng\":117.164143,\"lat\":39.120474,\"adcode\":120104,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"宁河区\",\"lng\":117.82828,\"lat\":39.328886,\"adcode\":120117,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"天津\",\"lng\":117.190182,\"lat\":39.125596,\"adcode\":120000,\"level\":\"city\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"武清区\",\"lng\":117.057959,\"lat\":39.376925,\"adcode\":120114,\"level\":\"district\"},{\"p\":\"天津\",\"c\":\"天津\",\"n\":\"西青区\",\"lng\":117.012247,\"lat\":39.139446,\"adcode\":120111,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"阿里地区\",\"lng\":80.105498,\"lat\":32.503187,\"adcode\":542500,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"措勤县\",\"lng\":85.159254,\"lat\":31.016774,\"adcode\":542527,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"噶尔县\",\"lng\":80.105005,\"lat\":32.503373,\"adcode\":542523,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"改则县\",\"lng\":84.062384,\"lat\":32.302076,\"adcode\":542526,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"革吉县\",\"lng\":81.142896,\"lat\":32.389192,\"adcode\":542525,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"普兰县\",\"lng\":81.177588,\"lat\":30.291896,\"adcode\":542521,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"日土县\",\"lng\":79.731937,\"lat\":33.382454,\"adcode\":542524,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"阿里地区\",\"n\":\"札达县\",\"lng\":79.803191,\"lat\":31.478587,\"adcode\":542522,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"八宿县\",\"lng\":96.917893,\"lat\":30.053408,\"adcode\":540326,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"边坝县\",\"lng\":94.707504,\"lat\":30.933849,\"adcode\":540330,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"察雅县\",\"lng\":97.565701,\"lat\":30.653038,\"adcode\":540325,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"昌都市\",\"lng\":97.178452,\"lat\":31.136875,\"adcode\":540300,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"丁青县\",\"lng\":95.597748,\"lat\":31.410681,\"adcode\":540324,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"贡觉县\",\"lng\":98.271191,\"lat\":30.859206,\"adcode\":540322,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"江达县\",\"lng\":98.218351,\"lat\":31.499534,\"adcode\":540321,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"卡若区\",\"lng\":97.178255,\"lat\":31.137035,\"adcode\":540302,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"类乌齐县\",\"lng\":96.601259,\"lat\":31.213048,\"adcode\":540323,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"洛隆县\",\"lng\":95.823418,\"lat\":30.741947,\"adcode\":540329,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"芒康县\",\"lng\":98.596444,\"lat\":29.686615,\"adcode\":540328,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"昌都市\",\"n\":\"左贡县\",\"lng\":97.840532,\"lat\":29.671335,\"adcode\":540327,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"城关区\",\"lng\":91.132911,\"lat\":29.659472,\"adcode\":540102,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"达孜区\",\"lng\":91.350976,\"lat\":29.670314,\"adcode\":540104,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"当雄县\",\"lng\":91.103551,\"lat\":30.474819,\"adcode\":540122,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"堆龙德庆区\",\"lng\":91.002823,\"lat\":29.647347,\"adcode\":540103,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"拉萨市\",\"lng\":91.132212,\"lat\":29.660361,\"adcode\":540100,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"林周县\",\"lng\":91.261842,\"lat\":29.895754,\"adcode\":540121,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"墨竹工卡县\",\"lng\":91.731158,\"lat\":29.834657,\"adcode\":540127,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"尼木县\",\"lng\":90.165545,\"lat\":29.431346,\"adcode\":540123,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"拉萨市\",\"n\":\"曲水县\",\"lng\":90.738051,\"lat\":29.349895,\"adcode\":540124,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"巴宜区\",\"lng\":94.360987,\"lat\":29.653732,\"adcode\":540402,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"波密县\",\"lng\":95.768151,\"lat\":29.858771,\"adcode\":540424,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"察隅县\",\"lng\":97.465002,\"lat\":28.660244,\"adcode\":540425,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"工布江达县\",\"lng\":93.246515,\"lat\":29.88447,\"adcode\":540421,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"朗县\",\"lng\":93.073429,\"lat\":29.0446,\"adcode\":540426,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"林芝市\",\"lng\":94.362348,\"lat\":29.654693,\"adcode\":540400,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"米林县\",\"lng\":94.213679,\"lat\":29.213811,\"adcode\":540422,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"林芝市\",\"n\":\"墨脱县\",\"lng\":95.332245,\"lat\":29.32573,\"adcode\":540423,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"安多县\",\"lng\":91.681879,\"lat\":32.260299,\"adcode\":540624,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"巴青县\",\"lng\":94.054049,\"lat\":31.918691,\"adcode\":540628,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"班戈县\",\"lng\":90.011822,\"lat\":31.394578,\"adcode\":540627,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"比如县\",\"lng\":93.68044,\"lat\":31.479917,\"adcode\":540622,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"嘉黎县\",\"lng\":93.232907,\"lat\":30.640846,\"adcode\":540621,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"那曲市\",\"lng\":92.060214,\"lat\":31.476004,\"adcode\":540600,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"尼玛县\",\"lng\":87.236646,\"lat\":31.784979,\"adcode\":540629,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"聂荣县\",\"lng\":92.303659,\"lat\":32.107855,\"adcode\":540623,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"色尼区\",\"lng\":92.061862,\"lat\":31.475756,\"adcode\":540602,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"申扎县\",\"lng\":88.709777,\"lat\":30.929056,\"adcode\":540625,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"双湖县\",\"lng\":88.838578,\"lat\":33.18698,\"adcode\":540630,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"那曲市\",\"n\":\"索县\",\"lng\":93.784964,\"lat\":31.886173,\"adcode\":540626,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"昂仁县\",\"lng\":87.23578,\"lat\":29.294758,\"adcode\":540226,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"白朗县\",\"lng\":89.263618,\"lat\":29.106627,\"adcode\":540228,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"定结县\",\"lng\":87.767723,\"lat\":28.36409,\"adcode\":540231,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"定日县\",\"lng\":87.123887,\"lat\":28.656667,\"adcode\":540223,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"岗巴县\",\"lng\":88.518903,\"lat\":28.274371,\"adcode\":540237,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"吉隆县\",\"lng\":85.298349,\"lat\":28.852416,\"adcode\":540234,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"江孜县\",\"lng\":89.605044,\"lat\":28.908845,\"adcode\":540222,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"康马县\",\"lng\":89.683406,\"lat\":28.554719,\"adcode\":540230,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"拉孜县\",\"lng\":87.63743,\"lat\":29.085136,\"adcode\":540225,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"南木林县\",\"lng\":89.099434,\"lat\":29.680459,\"adcode\":540221,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"聂拉木县\",\"lng\":85.981953,\"lat\":28.15595,\"adcode\":540235,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"仁布县\",\"lng\":89.843207,\"lat\":29.230299,\"adcode\":540229,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"日喀则市\",\"lng\":88.885148,\"lat\":29.267519,\"adcode\":540200,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"萨嘎县\",\"lng\":85.234622,\"lat\":29.328194,\"adcode\":540236,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"萨迦县\",\"lng\":88.023007,\"lat\":28.901077,\"adcode\":540224,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"桑珠孜区\",\"lng\":88.88667,\"lat\":29.267003,\"adcode\":540202,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"谢通门县\",\"lng\":88.260517,\"lat\":29.431597,\"adcode\":540227,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"亚东县\",\"lng\":88.906806,\"lat\":27.482772,\"adcode\":540233,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"日喀则市\",\"n\":\"仲巴县\",\"lng\":84.032826,\"lat\":29.768336,\"adcode\":540232,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"措美县\",\"lng\":91.432347,\"lat\":28.437353,\"adcode\":540526,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"错那县\",\"lng\":91.960132,\"lat\":27.991707,\"adcode\":540530,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"贡嘎县\",\"lng\":90.985271,\"lat\":29.289078,\"adcode\":540522,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"加查县\",\"lng\":92.591043,\"lat\":29.140921,\"adcode\":540528,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"浪卡子县\",\"lng\":90.398747,\"lat\":28.96836,\"adcode\":540531,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"隆子县\",\"lng\":92.463309,\"lat\":28.408548,\"adcode\":540529,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"洛扎县\",\"lng\":90.858243,\"lat\":28.385765,\"adcode\":540527,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"乃东区\",\"lng\":91.76525,\"lat\":29.236106,\"adcode\":540502,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"琼结县\",\"lng\":91.683753,\"lat\":29.025242,\"adcode\":540524,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"曲松县\",\"lng\":92.201066,\"lat\":29.063656,\"adcode\":540525,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"桑日县\",\"lng\":92.015732,\"lat\":29.259774,\"adcode\":540523,\"level\":\"district\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"山南市\",\"lng\":91.766529,\"lat\":29.236023,\"adcode\":540500,\"level\":\"city\"},{\"p\":\"西藏\",\"c\":\"山南市\",\"n\":\"扎囊县\",\"lng\":91.338,\"lat\":29.246476,\"adcode\":540521,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"北区\",\"lng\":114.1473639,\"lat\":22.49610389,\"adcode\":810013,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"大埔区\",\"lng\":114.1717431,\"lat\":22.44565306,\"adcode\":810014,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"东区\",\"lng\":114.2260031,\"lat\":22.27969306,\"adcode\":810003,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"观塘区\",\"lng\":114.2140542,\"lat\":22.32083778,\"adcode\":810009,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"黄大仙区\",\"lng\":114.2038856,\"lat\":22.33632056,\"adcode\":810008,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"九龙城区\",\"lng\":114.1928467,\"lat\":22.31251,\"adcode\":810007,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"葵青区\",\"lng\":114.1393194,\"lat\":22.36387667,\"adcode\":810017,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"离岛区\",\"lng\":113.94612,\"lat\":22.28640778,\"adcode\":810018,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"南区\",\"lng\":114.1600117,\"lat\":22.24589667,\"adcode\":810004,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"荃湾区\",\"lng\":114.1210792,\"lat\":22.36830667,\"adcode\":810010,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"沙田区\",\"lng\":114.1953653,\"lat\":22.37953167,\"adcode\":810016,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"深水埗区\",\"lng\":114.1632417,\"lat\":22.33385417,\"adcode\":810006,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"屯门区\",\"lng\":113.9765742,\"lat\":22.39384417,\"adcode\":810011,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"湾仔区\",\"lng\":114.1829153,\"lat\":22.27638889,\"adcode\":810002,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"西贡区\",\"lng\":114.264645,\"lat\":22.31421306,\"adcode\":810015,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"香港\",\"lng\":114.173355,\"lat\":22.320048,\"adcode\":810000,\"level\":\"city\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"油尖旺区\",\"lng\":114.1733317,\"lat\":22.31170389,\"adcode\":810005,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"元朗区\",\"lng\":114.0324381,\"lat\":22.44142833,\"adcode\":810012,\"level\":\"district\"},{\"p\":\"香港\",\"c\":\"香港\",\"n\":\"中西区\",\"lng\":114.1543731,\"lat\":22.28198083,\"adcode\":810001,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"阿克苏地区\",\"lng\":80.265068,\"lat\":41.170712,\"adcode\":652900,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"阿克苏市\",\"lng\":80.2629,\"lat\":41.171272,\"adcode\":652901,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"阿瓦提县\",\"lng\":80.378426,\"lat\":40.638422,\"adcode\":652928,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"拜城县\",\"lng\":81.869881,\"lat\":41.796101,\"adcode\":652926,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"柯坪县\",\"lng\":79.04785,\"lat\":40.50624,\"adcode\":652929,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"库车市\",\"lng\":82.96304,\"lat\":41.717141,\"adcode\":652902,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"沙雅县\",\"lng\":82.78077,\"lat\":41.226268,\"adcode\":652924,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"温宿县\",\"lng\":80.243273,\"lat\":41.272995,\"adcode\":652922,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"乌什县\",\"lng\":79.230805,\"lat\":41.21587,\"adcode\":652927,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿克苏地区\",\"n\":\"新和县\",\"lng\":82.610828,\"lat\":41.551176,\"adcode\":652925,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"阿勒泰地区\",\"lng\":88.13963,\"lat\":47.848393,\"adcode\":654300,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"阿勒泰市\",\"lng\":88.138743,\"lat\":47.848911,\"adcode\":654301,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"布尔津县\",\"lng\":86.86186,\"lat\":47.70453,\"adcode\":654321,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"福海县\",\"lng\":87.494569,\"lat\":47.113128,\"adcode\":654323,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"富蕴县\",\"lng\":89.524993,\"lat\":46.993106,\"adcode\":654322,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"哈巴河县\",\"lng\":86.418964,\"lat\":48.059284,\"adcode\":654324,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"吉木乃县\",\"lng\":85.876064,\"lat\":47.434633,\"adcode\":654326,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"阿勒泰地区\",\"n\":\"青河县\",\"lng\":90.381561,\"lat\":46.672446,\"adcode\":654325,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"巴音郭楞蒙古自治州\",\"lng\":86.150969,\"lat\":41.768552,\"adcode\":652800,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"博湖县\",\"lng\":86.631576,\"lat\":41.980166,\"adcode\":652829,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"和静县\",\"lng\":86.391067,\"lat\":42.31716,\"adcode\":652827,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"和硕县\",\"lng\":86.864947,\"lat\":42.268863,\"adcode\":652828,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"库尔勒市\",\"lng\":86.145948,\"lat\":41.763122,\"adcode\":652801,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"轮台县\",\"lng\":84.248542,\"lat\":41.781266,\"adcode\":652822,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"且末县\",\"lng\":85.532629,\"lat\":38.138562,\"adcode\":652825,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"若羌县\",\"lng\":88.168807,\"lat\":39.023807,\"adcode\":652824,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"尉犁县\",\"lng\":86.263412,\"lat\":41.337428,\"adcode\":652823,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"巴音郭楞蒙古自治州\",\"n\":\"焉耆回族自治县\",\"lng\":86.5698,\"lat\":42.064349,\"adcode\":652826,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"博尔塔拉蒙古自治州\",\"n\":\"阿拉山口市\",\"lng\":82.569389,\"lat\":45.16777,\"adcode\":652702,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"博尔塔拉蒙古自治州\",\"n\":\"博尔塔拉蒙古自治州\",\"lng\":82.074778,\"lat\":44.903258,\"adcode\":652700,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"博尔塔拉蒙古自治州\",\"n\":\"博乐市\",\"lng\":82.072237,\"lat\":44.903087,\"adcode\":652701,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"博尔塔拉蒙古自治州\",\"n\":\"精河县\",\"lng\":82.892938,\"lat\":44.605645,\"adcode\":652722,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"博尔塔拉蒙古自治州\",\"n\":\"温泉县\",\"lng\":81.03099,\"lat\":44.973751,\"adcode\":652723,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"昌吉回族自治州\",\"lng\":87.304012,\"lat\":44.014577,\"adcode\":652300,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"昌吉市\",\"lng\":87.304112,\"lat\":44.013183,\"adcode\":652301,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"阜康市\",\"lng\":87.98384,\"lat\":44.152153,\"adcode\":652302,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"呼图壁县\",\"lng\":86.888613,\"lat\":44.189342,\"adcode\":652323,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"吉木萨尔县\",\"lng\":89.181288,\"lat\":43.997162,\"adcode\":652327,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"玛纳斯县\",\"lng\":86.217687,\"lat\":44.305625,\"adcode\":652324,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"木垒哈萨克自治县\",\"lng\":90.282833,\"lat\":43.832442,\"adcode\":652328,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"昌吉回族自治州\",\"n\":\"奇台县\",\"lng\":89.591437,\"lat\":44.021996,\"adcode\":652325,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"哈密市\",\"n\":\"巴里坤哈萨克自治县\",\"lng\":93.021795,\"lat\":43.599032,\"adcode\":650521,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"哈密市\",\"n\":\"哈密市\",\"lng\":93.51316,\"lat\":42.833248,\"adcode\":650500,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"哈密市\",\"n\":\"伊吾县\",\"lng\":94.692773,\"lat\":43.252012,\"adcode\":650522,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"哈密市\",\"n\":\"伊州区\",\"lng\":93.509174,\"lat\":42.833888,\"adcode\":650502,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"策勒县\",\"lng\":80.803572,\"lat\":37.001672,\"adcode\":653225,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"和田地区\",\"lng\":79.92533,\"lat\":37.110687,\"adcode\":653200,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"和田市\",\"lng\":79.927542,\"lat\":37.108944,\"adcode\":653201,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"和田县\",\"lng\":79.81907,\"lat\":37.120031,\"adcode\":653221,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"洛浦县\",\"lng\":80.184038,\"lat\":37.074377,\"adcode\":653224,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"民丰县\",\"lng\":82.692354,\"lat\":37.064909,\"adcode\":653227,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"墨玉县\",\"lng\":79.736629,\"lat\":37.271511,\"adcode\":653222,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"皮山县\",\"lng\":78.282301,\"lat\":37.616332,\"adcode\":653223,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"和田地区\",\"n\":\"于田县\",\"lng\":81.667845,\"lat\":36.854628,\"adcode\":653226,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"巴楚县\",\"lng\":78.55041,\"lat\":39.783479,\"adcode\":653130,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"伽师县\",\"lng\":76.741982,\"lat\":39.494325,\"adcode\":653129,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"喀什地区\",\"lng\":75.989138,\"lat\":39.467664,\"adcode\":653100,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"喀什市\",\"lng\":75.98838,\"lat\":39.467861,\"adcode\":653101,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"麦盖提县\",\"lng\":77.651538,\"lat\":38.903384,\"adcode\":653127,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"莎车县\",\"lng\":77.248884,\"lat\":38.414499,\"adcode\":653125,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"疏附县\",\"lng\":75.863075,\"lat\":39.378306,\"adcode\":653121,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"疏勒县\",\"lng\":76.053653,\"lat\":39.399461,\"adcode\":653122,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"塔什库尔干塔吉克自治县\",\"lng\":75.228068,\"lat\":37.775437,\"adcode\":653131,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"叶城县\",\"lng\":77.420353,\"lat\":37.884679,\"adcode\":653126,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"英吉沙县\",\"lng\":76.174292,\"lat\":38.929839,\"adcode\":653123,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"岳普湖县\",\"lng\":76.7724,\"lat\":39.235248,\"adcode\":653128,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"喀什地区\",\"n\":\"泽普县\",\"lng\":77.273593,\"lat\":38.191217,\"adcode\":653124,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克拉玛依市\",\"n\":\"白碱滩区\",\"lng\":85.129882,\"lat\":45.689021,\"adcode\":650204,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克拉玛依市\",\"n\":\"独山子区\",\"lng\":84.882267,\"lat\":44.327207,\"adcode\":650202,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克拉玛依市\",\"n\":\"克拉玛依区\",\"lng\":84.868918,\"lat\":45.600477,\"adcode\":650203,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克拉玛依市\",\"n\":\"克拉玛依市\",\"lng\":84.873946,\"lat\":45.595886,\"adcode\":650200,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"克拉玛依市\",\"n\":\"乌尔禾区\",\"lng\":85.697767,\"lat\":46.08776,\"adcode\":650205,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克孜勒苏柯尔克孜自治州\",\"n\":\"阿合奇县\",\"lng\":78.450164,\"lat\":40.937567,\"adcode\":653023,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克孜勒苏柯尔克孜自治州\",\"n\":\"阿克陶县\",\"lng\":75.945159,\"lat\":39.147079,\"adcode\":653022,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克孜勒苏柯尔克孜自治州\",\"n\":\"阿图什市\",\"lng\":76.173939,\"lat\":39.712898,\"adcode\":653001,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"克孜勒苏柯尔克孜自治州\",\"n\":\"克孜勒苏柯尔克孜自治州\",\"lng\":76.172825,\"lat\":39.713431,\"adcode\":653000,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"克孜勒苏柯尔克孜自治州\",\"n\":\"乌恰县\",\"lng\":75.25969,\"lat\":39.716633,\"adcode\":653024,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"额敏县\",\"lng\":83.622118,\"lat\":46.522555,\"adcode\":654221,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"和布克赛尔蒙古自治县\",\"lng\":85.733551,\"lat\":46.793001,\"adcode\":654226,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"沙湾市\",\"lng\":85.622508,\"lat\":44.329544,\"adcode\":654223,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"塔城地区\",\"lng\":82.985732,\"lat\":46.746301,\"adcode\":654200,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"塔城市\",\"lng\":82.983988,\"lat\":46.746281,\"adcode\":654201,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"托里县\",\"lng\":83.60469,\"lat\":45.935863,\"adcode\":654224,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"乌苏市\",\"lng\":84.677624,\"lat\":44.430115,\"adcode\":654202,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"塔城地区\",\"n\":\"裕民县\",\"lng\":82.982157,\"lat\":46.202781,\"adcode\":654225,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"吐鲁番市\",\"n\":\"高昌区\",\"lng\":89.182324,\"lat\":42.947627,\"adcode\":650402,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"吐鲁番市\",\"n\":\"鄯善县\",\"lng\":90.212692,\"lat\":42.865503,\"adcode\":650421,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"吐鲁番市\",\"n\":\"吐鲁番市\",\"lng\":89.184078,\"lat\":42.947613,\"adcode\":650400,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"吐鲁番市\",\"n\":\"托克逊县\",\"lng\":88.655771,\"lat\":42.793536,\"adcode\":650422,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"达坂城区\",\"lng\":88.30994,\"lat\":43.36181,\"adcode\":650107,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"米东区\",\"lng\":87.691801,\"lat\":43.960982,\"adcode\":650109,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"沙依巴克区\",\"lng\":87.596639,\"lat\":43.788872,\"adcode\":650103,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"水磨沟区\",\"lng\":87.613093,\"lat\":43.816747,\"adcode\":650105,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"天山区\",\"lng\":87.620116,\"lat\":43.796428,\"adcode\":650102,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"头屯河区\",\"lng\":87.425823,\"lat\":43.876053,\"adcode\":650106,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"乌鲁木齐市\",\"lng\":87.617733,\"lat\":43.792818,\"adcode\":650100,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"乌鲁木齐县\",\"lng\":87.505603,\"lat\":43.982546,\"adcode\":650121,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"乌鲁木齐市\",\"n\":\"新市区\",\"lng\":87.560653,\"lat\":43.870882,\"adcode\":650104,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"察布查尔锡伯自治县\",\"lng\":81.150874,\"lat\":43.838883,\"adcode\":654022,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"巩留县\",\"lng\":82.227044,\"lat\":43.481618,\"adcode\":654024,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"霍城县\",\"lng\":80.872508,\"lat\":44.049912,\"adcode\":654023,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"霍尔果斯市\",\"lng\":80.420759,\"lat\":44.201669,\"adcode\":654004,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"奎屯市\",\"lng\":84.901602,\"lat\":44.423445,\"adcode\":654003,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"尼勒克县\",\"lng\":82.504119,\"lat\":43.789737,\"adcode\":654028,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"特克斯县\",\"lng\":81.840058,\"lat\":43.214861,\"adcode\":654027,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"新源县\",\"lng\":83.258493,\"lat\":43.434249,\"adcode\":654025,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"伊犁哈萨克自治州\",\"lng\":81.317946,\"lat\":43.92186,\"adcode\":654000,\"level\":\"city\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"伊宁市\",\"lng\":81.316343,\"lat\":43.922209,\"adcode\":654002,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"伊宁县\",\"lng\":81.524671,\"lat\":43.977876,\"adcode\":654021,\"level\":\"district\"},{\"p\":\"新疆\",\"c\":\"伊犁哈萨克自治州\",\"n\":\"昭苏县\",\"lng\":81.126029,\"lat\":43.157765,\"adcode\":654026,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"保山市\",\"n\":\"保山市\",\"lng\":99.167133,\"lat\":25.111802,\"adcode\":530500,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"保山市\",\"n\":\"昌宁县\",\"lng\":99.612344,\"lat\":24.823662,\"adcode\":530524,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"保山市\",\"n\":\"龙陵县\",\"lng\":98.693567,\"lat\":24.591912,\"adcode\":530523,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"保山市\",\"n\":\"隆阳区\",\"lng\":99.165825,\"lat\":25.112144,\"adcode\":530502,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"保山市\",\"n\":\"施甸县\",\"lng\":99.183758,\"lat\":24.730847,\"adcode\":530521,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"保山市\",\"n\":\"腾冲市\",\"lng\":98.497292,\"lat\":25.01757,\"adcode\":530581,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"楚雄市\",\"lng\":101.546145,\"lat\":25.040912,\"adcode\":532301,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"楚雄彝族自治州\",\"lng\":101.546046,\"lat\":25.041988,\"adcode\":532300,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"大姚县\",\"lng\":101.323602,\"lat\":25.722348,\"adcode\":532326,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"禄丰市\",\"lng\":102.075694,\"lat\":25.14327,\"adcode\":532331,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"牟定县\",\"lng\":101.543044,\"lat\":25.312111,\"adcode\":532323,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"南华县\",\"lng\":101.274991,\"lat\":25.192408,\"adcode\":532324,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"双柏县\",\"lng\":101.63824,\"lat\":24.685094,\"adcode\":532322,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"武定县\",\"lng\":102.406785,\"lat\":25.5301,\"adcode\":532329,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"姚安县\",\"lng\":101.238399,\"lat\":25.505403,\"adcode\":532325,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"永仁县\",\"lng\":101.671175,\"lat\":26.056316,\"adcode\":532327,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"楚雄彝族自治州\",\"n\":\"元谋县\",\"lng\":101.870837,\"lat\":25.703313,\"adcode\":532328,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"宾川县\",\"lng\":100.578957,\"lat\":25.825904,\"adcode\":532924,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"大理白族自治州\",\"lng\":100.225668,\"lat\":25.589449,\"adcode\":532900,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"大理市\",\"lng\":100.241369,\"lat\":25.593067,\"adcode\":532901,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"洱源县\",\"lng\":99.951708,\"lat\":26.111184,\"adcode\":532930,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"鹤庆县\",\"lng\":100.173375,\"lat\":26.55839,\"adcode\":532932,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"剑川县\",\"lng\":99.905887,\"lat\":26.530066,\"adcode\":532931,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"弥渡县\",\"lng\":100.490669,\"lat\":25.342594,\"adcode\":532925,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"南涧彝族自治县\",\"lng\":100.518683,\"lat\":25.041279,\"adcode\":532926,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"巍山彝族回族自治县\",\"lng\":100.30793,\"lat\":25.230909,\"adcode\":532927,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"祥云县\",\"lng\":100.554025,\"lat\":25.477072,\"adcode\":532923,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"漾濞彝族自治县\",\"lng\":99.95797,\"lat\":25.669543,\"adcode\":532922,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"永平县\",\"lng\":99.533536,\"lat\":25.461281,\"adcode\":532928,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"大理白族自治州\",\"n\":\"云龙县\",\"lng\":99.369402,\"lat\":25.884955,\"adcode\":532929,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"德宏傣族景颇族自治州\",\"n\":\"德宏傣族景颇族自治州\",\"lng\":98.578363,\"lat\":24.436694,\"adcode\":533100,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"德宏傣族景颇族自治州\",\"n\":\"梁河县\",\"lng\":98.298196,\"lat\":24.80742,\"adcode\":533122,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"德宏傣族景颇族自治州\",\"n\":\"陇川县\",\"lng\":97.794441,\"lat\":24.184065,\"adcode\":533124,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"德宏傣族景颇族自治州\",\"n\":\"芒市\",\"lng\":98.577608,\"lat\":24.436699,\"adcode\":533103,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"德宏傣族景颇族自治州\",\"n\":\"瑞丽市\",\"lng\":97.855883,\"lat\":24.010734,\"adcode\":533102,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"德宏傣族景颇族自治州\",\"n\":\"盈江县\",\"lng\":97.93393,\"lat\":24.709541,\"adcode\":533123,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"迪庆藏族自治州\",\"n\":\"德钦县\",\"lng\":98.91506,\"lat\":28.483272,\"adcode\":533422,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"迪庆藏族自治州\",\"n\":\"迪庆藏族自治州\",\"lng\":99.706463,\"lat\":27.826853,\"adcode\":533400,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"迪庆藏族自治州\",\"n\":\"维西傈僳族自治县\",\"lng\":99.286355,\"lat\":27.180948,\"adcode\":533423,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"迪庆藏族自治州\",\"n\":\"香格里拉市\",\"lng\":99.708667,\"lat\":27.825804,\"adcode\":533401,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"个旧市\",\"lng\":103.154752,\"lat\":23.360383,\"adcode\":532501,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"河口瑶族自治县\",\"lng\":103.961593,\"lat\":22.507563,\"adcode\":532532,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"红河哈尼族彝族自治州\",\"lng\":103.384182,\"lat\":23.366775,\"adcode\":532500,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"红河县\",\"lng\":102.42121,\"lat\":23.369191,\"adcode\":532529,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"建水县\",\"lng\":102.820493,\"lat\":23.618387,\"adcode\":532524,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"金平苗族瑶族傣族自治县\",\"lng\":103.228359,\"lat\":22.779982,\"adcode\":532530,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"开远市\",\"lng\":103.258679,\"lat\":23.713832,\"adcode\":532502,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"泸西县\",\"lng\":103.759622,\"lat\":24.532368,\"adcode\":532527,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"绿春县\",\"lng\":102.39286,\"lat\":22.99352,\"adcode\":532531,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"蒙自市\",\"lng\":103.385005,\"lat\":23.366843,\"adcode\":532503,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"弥勒市\",\"lng\":103.436988,\"lat\":24.40837,\"adcode\":532504,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"屏边苗族自治县\",\"lng\":103.687229,\"lat\":22.987013,\"adcode\":532523,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"石屏县\",\"lng\":102.484469,\"lat\":23.712569,\"adcode\":532525,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"红河哈尼族彝族自治州\",\"n\":\"元阳县\",\"lng\":102.837056,\"lat\":23.219773,\"adcode\":532528,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"安宁市\",\"lng\":102.485544,\"lat\":24.921785,\"adcode\":530181,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"呈贡区\",\"lng\":102.801382,\"lat\":24.889275,\"adcode\":530114,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"东川区\",\"lng\":103.182,\"lat\":26.08349,\"adcode\":530113,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"富民县\",\"lng\":102.497888,\"lat\":25.219667,\"adcode\":530124,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"官渡区\",\"lng\":102.723437,\"lat\":25.021211,\"adcode\":530111,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"晋宁区\",\"lng\":102.594987,\"lat\":24.666944,\"adcode\":530115,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"昆明市\",\"lng\":102.712251,\"lat\":25.040609,\"adcode\":530100,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"禄劝彝族苗族自治县\",\"lng\":102.46905,\"lat\":25.556533,\"adcode\":530128,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"盘龙区\",\"lng\":102.729044,\"lat\":25.070239,\"adcode\":530103,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"石林彝族自治县\",\"lng\":103.271962,\"lat\":24.754545,\"adcode\":530126,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"嵩明县\",\"lng\":103.038777,\"lat\":25.335087,\"adcode\":530127,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"五华区\",\"lng\":102.704412,\"lat\":25.042165,\"adcode\":530102,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"西山区\",\"lng\":102.705904,\"lat\":25.02436,\"adcode\":530112,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"寻甸回族彝族自治县\",\"lng\":103.257588,\"lat\":25.559474,\"adcode\":530129,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昆明市\",\"n\":\"宜良县\",\"lng\":103.145989,\"lat\":24.918215,\"adcode\":530125,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"丽江市\",\"n\":\"古城区\",\"lng\":100.234412,\"lat\":26.872229,\"adcode\":530702,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"丽江市\",\"n\":\"华坪县\",\"lng\":101.267796,\"lat\":26.628834,\"adcode\":530723,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"丽江市\",\"n\":\"丽江市\",\"lng\":100.233026,\"lat\":26.872108,\"adcode\":530700,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"丽江市\",\"n\":\"宁蒗彝族自治县\",\"lng\":100.852427,\"lat\":27.281109,\"adcode\":530724,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"丽江市\",\"n\":\"永胜县\",\"lng\":100.750901,\"lat\":26.685623,\"adcode\":530722,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"丽江市\",\"n\":\"玉龙纳西族自治县\",\"lng\":100.238312,\"lat\":26.830593,\"adcode\":530721,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"沧源佤族自治县\",\"lng\":99.2474,\"lat\":23.146887,\"adcode\":530927,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"凤庆县\",\"lng\":99.91871,\"lat\":24.592738,\"adcode\":530921,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"耿马傣族佤族自治县\",\"lng\":99.402495,\"lat\":23.534579,\"adcode\":530926,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"临沧市\",\"lng\":100.08697,\"lat\":23.886567,\"adcode\":530900,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"临翔区\",\"lng\":100.086486,\"lat\":23.886562,\"adcode\":530902,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"双江拉祜族佤族布朗族傣族自治县\",\"lng\":99.824419,\"lat\":23.477476,\"adcode\":530925,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"永德县\",\"lng\":99.253679,\"lat\":24.028159,\"adcode\":530923,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"云县\",\"lng\":100.125637,\"lat\":24.439026,\"adcode\":530922,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"临沧市\",\"n\":\"镇康县\",\"lng\":98.82743,\"lat\":23.761415,\"adcode\":530924,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"怒江傈僳族自治州\",\"n\":\"福贡县\",\"lng\":98.867413,\"lat\":26.902738,\"adcode\":533323,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"怒江傈僳族自治州\",\"n\":\"贡山独龙族怒族自治县\",\"lng\":98.666141,\"lat\":27.738054,\"adcode\":533324,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"怒江傈僳族自治州\",\"n\":\"兰坪白族普米族自治县\",\"lng\":99.421378,\"lat\":26.453839,\"adcode\":533325,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"怒江傈僳族自治州\",\"n\":\"泸水市\",\"lng\":98.854063,\"lat\":25.851142,\"adcode\":533301,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"怒江傈僳族自治州\",\"n\":\"怒江傈僳族自治州\",\"lng\":98.854304,\"lat\":25.850949,\"adcode\":533300,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"江城哈尼族彝族自治县\",\"lng\":101.859144,\"lat\":22.58336,\"adcode\":530826,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"景东彝族自治县\",\"lng\":100.840011,\"lat\":24.448523,\"adcode\":530823,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"景谷傣族彝族自治县\",\"lng\":100.701425,\"lat\":23.500278,\"adcode\":530824,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"澜沧拉祜族自治县\",\"lng\":99.931201,\"lat\":22.553083,\"adcode\":530828,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"孟连傣族拉祜族佤族自治县\",\"lng\":99.585406,\"lat\":22.325924,\"adcode\":530827,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"墨江哈尼族自治县\",\"lng\":101.687606,\"lat\":23.428165,\"adcode\":530822,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"宁洱哈尼族彝族自治县\",\"lng\":101.04524,\"lat\":23.062507,\"adcode\":530821,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"普洱市\",\"lng\":100.972344,\"lat\":22.777321,\"adcode\":530800,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"思茅区\",\"lng\":100.973227,\"lat\":22.776595,\"adcode\":530802,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"西盟佤族自治县\",\"lng\":99.594372,\"lat\":22.644423,\"adcode\":530829,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"普洱市\",\"n\":\"镇沅彝族哈尼族拉祜族自治县\",\"lng\":101.108512,\"lat\":24.005712,\"adcode\":530825,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"富源县\",\"lng\":104.25692,\"lat\":25.67064,\"adcode\":530325,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"会泽县\",\"lng\":103.300041,\"lat\":26.412861,\"adcode\":530326,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"陆良县\",\"lng\":103.655233,\"lat\":25.022878,\"adcode\":530322,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"罗平县\",\"lng\":104.309263,\"lat\":24.885708,\"adcode\":530324,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"马龙区\",\"lng\":103.578755,\"lat\":25.429451,\"adcode\":530304,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"麒麟区\",\"lng\":103.798054,\"lat\":25.501269,\"adcode\":530302,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"曲靖市\",\"lng\":103.797851,\"lat\":25.501557,\"adcode\":530300,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"师宗县\",\"lng\":103.993808,\"lat\":24.825681,\"adcode\":530323,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"宣威市\",\"lng\":104.09554,\"lat\":26.227777,\"adcode\":530381,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"曲靖市\",\"n\":\"沾益区\",\"lng\":103.819262,\"lat\":25.600878,\"adcode\":530303,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"富宁县\",\"lng\":105.62856,\"lat\":23.626494,\"adcode\":532628,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"广南县\",\"lng\":105.056684,\"lat\":24.050272,\"adcode\":532627,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"麻栗坡县\",\"lng\":104.701899,\"lat\":23.124202,\"adcode\":532624,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"马关县\",\"lng\":104.398619,\"lat\":23.011723,\"adcode\":532625,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"丘北县\",\"lng\":104.194366,\"lat\":24.040982,\"adcode\":532626,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"文山市\",\"lng\":104.244277,\"lat\":23.369216,\"adcode\":532601,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"文山壮族苗族自治州\",\"lng\":104.24401,\"lat\":23.36951,\"adcode\":532600,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"西畴县\",\"lng\":104.675711,\"lat\":23.437439,\"adcode\":532623,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"文山壮族苗族自治州\",\"n\":\"砚山县\",\"lng\":104.343989,\"lat\":23.612301,\"adcode\":532622,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"西双版纳傣族自治州\",\"n\":\"景洪市\",\"lng\":100.797947,\"lat\":22.002087,\"adcode\":532801,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"西双版纳傣族自治州\",\"n\":\"勐海县\",\"lng\":100.448288,\"lat\":21.955866,\"adcode\":532822,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"西双版纳傣族自治州\",\"n\":\"勐腊县\",\"lng\":101.567051,\"lat\":21.479449,\"adcode\":532823,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"西双版纳傣族自治州\",\"n\":\"西双版纳傣族自治州\",\"lng\":100.797941,\"lat\":22.001724,\"adcode\":532800,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"澄江市\",\"lng\":102.916652,\"lat\":24.669679,\"adcode\":530481,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"峨山彝族自治县\",\"lng\":102.404358,\"lat\":24.173256,\"adcode\":530426,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"红塔区\",\"lng\":102.543468,\"lat\":24.350753,\"adcode\":530402,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"华宁县\",\"lng\":102.928982,\"lat\":24.189807,\"adcode\":530424,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"江川区\",\"lng\":102.749839,\"lat\":24.291006,\"adcode\":530403,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"通海县\",\"lng\":102.760039,\"lat\":24.112205,\"adcode\":530423,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"新平彝族傣族自治县\",\"lng\":101.990903,\"lat\":24.0664,\"adcode\":530427,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"易门县\",\"lng\":102.16211,\"lat\":24.669598,\"adcode\":530425,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"玉溪市\",\"lng\":102.543907,\"lat\":24.350461,\"adcode\":530400,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"玉溪市\",\"n\":\"元江哈尼族彝族傣族自治县\",\"lng\":101.999658,\"lat\":23.597618,\"adcode\":530428,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"大关县\",\"lng\":103.891608,\"lat\":27.747114,\"adcode\":530624,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"鲁甸县\",\"lng\":103.549333,\"lat\":27.191637,\"adcode\":530621,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"巧家县\",\"lng\":102.929284,\"lat\":26.9117,\"adcode\":530622,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"水富市\",\"lng\":104.415376,\"lat\":28.629688,\"adcode\":530681,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"绥江县\",\"lng\":103.961095,\"lat\":28.599953,\"adcode\":530626,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"威信县\",\"lng\":105.04869,\"lat\":27.843381,\"adcode\":530629,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"盐津县\",\"lng\":104.23506,\"lat\":28.106923,\"adcode\":530623,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"彝良县\",\"lng\":104.048492,\"lat\":27.627425,\"adcode\":530628,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"永善县\",\"lng\":103.63732,\"lat\":28.231526,\"adcode\":530625,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"昭通市\",\"lng\":103.717216,\"lat\":27.336999,\"adcode\":530600,\"level\":\"city\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"昭阳区\",\"lng\":103.717267,\"lat\":27.336636,\"adcode\":530602,\"level\":\"district\"},{\"p\":\"云南\",\"c\":\"昭通市\",\"n\":\"镇雄县\",\"lng\":104.873055,\"lat\":27.436267,\"adcode\":530627,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"滨江区\",\"lng\":120.21062,\"lat\":30.206615,\"adcode\":330108,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"淳安县\",\"lng\":119.044276,\"lat\":29.604177,\"adcode\":330127,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"富阳区\",\"lng\":119.949869,\"lat\":30.049871,\"adcode\":330111,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"拱墅区\",\"lng\":120.150053,\"lat\":30.314697,\"adcode\":330105,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"杭州市\",\"lng\":120.153576,\"lat\":30.287459,\"adcode\":330100,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"建德市\",\"lng\":119.279089,\"lat\":29.472284,\"adcode\":330182,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"临安区\",\"lng\":119.715101,\"lat\":30.231153,\"adcode\":330112,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"临平区\",\"lng\":120.299376,\"lat\":30.419025,\"adcode\":330113,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"钱塘区\",\"lng\":120.493972,\"lat\":30.322904,\"adcode\":330114,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"上城区\",\"lng\":120.171465,\"lat\":30.250236,\"adcode\":330102,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"桐庐县\",\"lng\":119.685045,\"lat\":29.797437,\"adcode\":330122,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"西湖区\",\"lng\":120.147376,\"lat\":30.272934,\"adcode\":330106,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"萧山区\",\"lng\":120.27069,\"lat\":30.162932,\"adcode\":330109,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"杭州市\",\"n\":\"余杭区\",\"lng\":119.978959,\"lat\":30.27365,\"adcode\":330110,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"湖州市\",\"n\":\"安吉县\",\"lng\":119.687891,\"lat\":30.631974,\"adcode\":330523,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"湖州市\",\"n\":\"德清县\",\"lng\":119.967662,\"lat\":30.534927,\"adcode\":330521,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"湖州市\",\"n\":\"湖州市\",\"lng\":120.102398,\"lat\":30.867198,\"adcode\":330500,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"湖州市\",\"n\":\"南浔区\",\"lng\":120.417195,\"lat\":30.872742,\"adcode\":330503,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"湖州市\",\"n\":\"吴兴区\",\"lng\":120.101416,\"lat\":30.867252,\"adcode\":330502,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"湖州市\",\"n\":\"长兴县\",\"lng\":119.910122,\"lat\":31.00475,\"adcode\":330522,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"海宁市\",\"lng\":120.688821,\"lat\":30.525544,\"adcode\":330481,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"海盐县\",\"lng\":120.942017,\"lat\":30.522223,\"adcode\":330424,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"嘉善县\",\"lng\":120.921871,\"lat\":30.841352,\"adcode\":330421,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"嘉兴市\",\"lng\":120.750865,\"lat\":30.762653,\"adcode\":330400,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"南湖区\",\"lng\":120.749953,\"lat\":30.764652,\"adcode\":330402,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"平湖市\",\"lng\":121.014666,\"lat\":30.698921,\"adcode\":330482,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"桐乡市\",\"lng\":120.551085,\"lat\":30.629065,\"adcode\":330483,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"嘉兴市\",\"n\":\"秀洲区\",\"lng\":120.720431,\"lat\":30.763323,\"adcode\":330411,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"东阳市\",\"lng\":120.23334,\"lat\":29.262546,\"adcode\":330783,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"金东区\",\"lng\":119.681264,\"lat\":29.095835,\"adcode\":330703,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"金华市\",\"lng\":119.649506,\"lat\":29.089524,\"adcode\":330700,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"兰溪市\",\"lng\":119.460521,\"lat\":29.210065,\"adcode\":330781,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"磐安县\",\"lng\":120.44513,\"lat\":29.052627,\"adcode\":330727,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"浦江县\",\"lng\":119.893363,\"lat\":29.451254,\"adcode\":330726,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"武义县\",\"lng\":119.819159,\"lat\":28.896563,\"adcode\":330723,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"婺城区\",\"lng\":119.652579,\"lat\":29.082607,\"adcode\":330702,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"义乌市\",\"lng\":120.074911,\"lat\":29.306863,\"adcode\":330782,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"金华市\",\"n\":\"永康市\",\"lng\":120.036328,\"lat\":28.895293,\"adcode\":330784,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"缙云县\",\"lng\":120.078965,\"lat\":28.654208,\"adcode\":331122,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"景宁畲族自治县\",\"lng\":119.634669,\"lat\":27.977247,\"adcode\":331127,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"丽水市\",\"lng\":119.921786,\"lat\":28.451993,\"adcode\":331100,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"莲都区\",\"lng\":119.922293,\"lat\":28.451103,\"adcode\":331102,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"龙泉市\",\"lng\":119.132319,\"lat\":28.069177,\"adcode\":331181,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"青田县\",\"lng\":120.291939,\"lat\":28.135247,\"adcode\":331121,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"庆元县\",\"lng\":119.067233,\"lat\":27.618231,\"adcode\":331126,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"松阳县\",\"lng\":119.485292,\"lat\":28.449937,\"adcode\":331124,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"遂昌县\",\"lng\":119.27589,\"lat\":28.5924,\"adcode\":331123,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"丽水市\",\"n\":\"云和县\",\"lng\":119.569458,\"lat\":28.111077,\"adcode\":331125,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"北仑区\",\"lng\":121.831303,\"lat\":29.90944,\"adcode\":330206,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"慈溪市\",\"lng\":121.248052,\"lat\":30.177142,\"adcode\":330282,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"奉化区\",\"lng\":121.41089,\"lat\":29.662348,\"adcode\":330213,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"海曙区\",\"lng\":121.539698,\"lat\":29.874452,\"adcode\":330203,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"江北区\",\"lng\":121.559282,\"lat\":29.888361,\"adcode\":330205,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"宁波市\",\"lng\":121.549792,\"lat\":29.868388,\"adcode\":330200,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"宁海县\",\"lng\":121.432606,\"lat\":29.299836,\"adcode\":330226,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"象山县\",\"lng\":121.877091,\"lat\":29.470206,\"adcode\":330225,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"鄞州区\",\"lng\":121.558436,\"lat\":29.831662,\"adcode\":330212,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"余姚市\",\"lng\":121.156294,\"lat\":30.045404,\"adcode\":330281,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"宁波市\",\"n\":\"镇海区\",\"lng\":121.713162,\"lat\":29.952107,\"adcode\":330211,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"常山县\",\"lng\":118.521654,\"lat\":28.900039,\"adcode\":330822,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"江山市\",\"lng\":118.627879,\"lat\":28.734674,\"adcode\":330881,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"开化县\",\"lng\":118.414435,\"lat\":29.136503,\"adcode\":330824,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"柯城区\",\"lng\":118.873041,\"lat\":28.944539,\"adcode\":330802,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"龙游县\",\"lng\":119.172525,\"lat\":29.031364,\"adcode\":330825,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"衢江区\",\"lng\":118.957683,\"lat\":28.973195,\"adcode\":330803,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"衢州市\",\"n\":\"衢州市\",\"lng\":118.87263,\"lat\":28.941708,\"adcode\":330800,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"柯桥区\",\"lng\":120.476075,\"lat\":30.078038,\"adcode\":330603,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"上虞区\",\"lng\":120.874185,\"lat\":30.016769,\"adcode\":330604,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"绍兴市\",\"lng\":120.582112,\"lat\":29.997117,\"adcode\":330600,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"嵊州市\",\"lng\":120.82888,\"lat\":29.586606,\"adcode\":330683,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"新昌县\",\"lng\":120.905665,\"lat\":29.501205,\"adcode\":330624,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"越城区\",\"lng\":120.585315,\"lat\":29.996993,\"adcode\":330602,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"绍兴市\",\"n\":\"诸暨市\",\"lng\":120.244326,\"lat\":29.713662,\"adcode\":330681,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"黄岩区\",\"lng\":121.262138,\"lat\":28.64488,\"adcode\":331003,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"椒江区\",\"lng\":121.431049,\"lat\":28.67615,\"adcode\":331002,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"临海市\",\"lng\":121.131229,\"lat\":28.845441,\"adcode\":331082,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"路桥区\",\"lng\":121.37292,\"lat\":28.581799,\"adcode\":331004,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"三门县\",\"lng\":121.376429,\"lat\":29.118955,\"adcode\":331022,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"台州市\",\"lng\":121.428599,\"lat\":28.661378,\"adcode\":331000,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"天台县\",\"lng\":121.031227,\"lat\":29.141126,\"adcode\":331023,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"温岭市\",\"lng\":121.373611,\"lat\":28.368781,\"adcode\":331081,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"仙居县\",\"lng\":120.735074,\"lat\":28.849213,\"adcode\":331024,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"台州市\",\"n\":\"玉环市\",\"lng\":121.232337,\"lat\":28.12842,\"adcode\":331083,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"苍南县\",\"lng\":120.406256,\"lat\":27.507743,\"adcode\":330327,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"洞头区\",\"lng\":121.156181,\"lat\":27.836057,\"adcode\":330305,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"乐清市\",\"lng\":120.967147,\"lat\":28.116083,\"adcode\":330382,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"龙港市\",\"lng\":120.553039,\"lat\":27.578156,\"adcode\":330383,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"龙湾区\",\"lng\":120.763469,\"lat\":27.970254,\"adcode\":330303,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"鹿城区\",\"lng\":120.674231,\"lat\":28.003352,\"adcode\":330302,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"瓯海区\",\"lng\":120.637145,\"lat\":28.006444,\"adcode\":330304,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"平阳县\",\"lng\":120.564387,\"lat\":27.6693,\"adcode\":330326,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"瑞安市\",\"lng\":120.646171,\"lat\":27.779321,\"adcode\":330381,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"泰顺县\",\"lng\":119.71624,\"lat\":27.557309,\"adcode\":330329,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"温州市\",\"lng\":120.672111,\"lat\":28.000575,\"adcode\":330300,\"level\":\"city\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"文成县\",\"lng\":120.09245,\"lat\":27.789133,\"adcode\":330328,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"温州市\",\"n\":\"永嘉县\",\"lng\":120.690968,\"lat\":28.153886,\"adcode\":330324,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"舟山市\",\"n\":\"岱山县\",\"lng\":122.201132,\"lat\":30.242865,\"adcode\":330921,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"舟山市\",\"n\":\"定海区\",\"lng\":122.108496,\"lat\":30.016423,\"adcode\":330902,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"舟山市\",\"n\":\"普陀区\",\"lng\":122.301953,\"lat\":29.945614,\"adcode\":330903,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"舟山市\",\"n\":\"嵊泗县\",\"lng\":122.457809,\"lat\":30.727166,\"adcode\":330922,\"level\":\"district\"},{\"p\":\"浙江\",\"c\":\"舟山市\",\"n\":\"舟山市\",\"lng\":122.106863,\"lat\":30.016028,\"adcode\":330900,\"level\":\"city\"}]}";
    throw new Error('浏览器版 fs 仅支持 china-regions.json');
  },
  existsSync: function (p) { return __REGION_FILE.test(String(p)); }
};
var __cryptoShim = new Proxy({}, { get: function () { return function () { throw new Error('浏览器版不含 crypto 功能'); }; } });

var __loadEntry = function (id) { __require('')(id); return __cache[id].exports; };
var yunqiMod = __loadEntry('lib/yunqi.js');
var baziMod = __loadEntry('lib/bazi-yunqi.js');

window.WUYUNQI = {
  version: '1.1.0',
  getYearYunqi: yunqiMod.getYearYunqi,
  getMonthYunqi: yunqiMod.getMonthYunqi,
  ganzhiOfYear: yunqiMod.ganzhiOfYear,
  buildConstitution: baziMod.buildConstitution,
  yearWarn: baziMod.yearWarn
};
})();
