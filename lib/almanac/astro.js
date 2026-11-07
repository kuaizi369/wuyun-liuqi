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