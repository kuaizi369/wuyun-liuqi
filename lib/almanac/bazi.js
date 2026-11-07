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

const REGION_FILE = path.join(__dirname, '..', '..', 'data', 'china-regions.json');
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