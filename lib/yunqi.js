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