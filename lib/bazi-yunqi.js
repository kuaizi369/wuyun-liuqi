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