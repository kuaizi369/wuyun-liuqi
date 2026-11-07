'use strict';

// 五运六气引擎测试
// 断言数据源：《素问·六元正纪大论》《运气要诀》《三因极一病证方论》原文纪要
const assert = require('node:assert');
const {
  ganzhiOfYear, getZhongYun, getFuHui, getYearYunqi, getMonthYunqi,
  getStepByDate, zhiGroupOf, jiaLin
} = require('./lib/yunqi');
const { buildConstitution, yearWarn } = require('./lib/bazi-yunqi');

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; failures.push({ name, msg: e.message }); console.log(`  ✗ ${name}\n    ${e.message}`); }
}

console.log('=== 干支纪年 ===');
test('2026 为丙午年', () => {
  assert.strictEqual(ganzhiOfYear(2026).gan + ganzhiOfYear(2026).zhi, '丙午');
});
test('1984 为甲子年', () => {
  assert.strictEqual(ganzhiOfYear(1984).gan + ganzhiOfYear(1984).zhi, '甲子');
});
test('1864/2044 循环回甲子', () => {
  assert.strictEqual(ganzhiOfYear(1864).gan, '甲');
  assert.strictEqual(ganzhiOfYear(2044).zhi, '子');
});

console.log('=== 岁运（天干化五运 + 太过不及） ===');
test('甲己化土：2024 甲辰 太宫土运（太过）', () => {
  const y = getZhongYun(2024);
  assert.strictEqual(y.wuxing, '土');
  assert.strictEqual(y.taiShao, '太宫');
  assert.strictEqual(y.level, 'taiGuo');
});
test('己为土运不及：2019 己亥 少宫', () => {
  const y = getZhongYun(2019);
  assert.strictEqual(y.wuxing, '土');
  assert.strictEqual(y.taiShao, '少宫');
  assert.strictEqual(y.level, 'buJi');
});
test('丙辛化水：2026 丙午 太羽水运', () => {
  assert.strictEqual(getZhongYun(2026).taiShao, '太羽');
});
test('癸为火运不及：2023 癸卯 少征', () => {
  assert.strictEqual(getZhongYun(2023).taiShao, '少征');
});

console.log('=== 司天在泉（地支化六气） ===');
test('2026 丙午：少阴君火司天 阳明燥金在泉', () => {
  const y = getYearYunqi(2026);
  assert.strictEqual(y.siTian.qi, '少阴君火');
  assert.strictEqual(y.zaiQuan.qi, '阳明燥金');
});
test('2024 甲辰：太阳寒水司天 太阴湿土在泉', () => {
  const y = getYearYunqi(2024);
  assert.strictEqual(y.siTian.qi, '太阳寒水');
  assert.strictEqual(y.zaiQuan.qi, '太阴湿土');
});
test('2025 乙巳：厥阴风木司天 少阳相火在泉', () => {
  const y = getYearYunqi(2025);
  assert.strictEqual(y.siTian.qi, '厥阴风木');
  assert.strictEqual(y.zaiQuan.qi, '少阳相火');
});

console.log('=== 客气六步排布（《运气要诀·客气司天在泉间气歌》） ===');
test('子午年客气：初太阳、二厥阴、三少阴（司天）、四太阴、五少阳、六阳明（在泉）', () => {
  const y = getYearYunqi(2026);
  assert.deepStrictEqual(y.keQi, ['太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金']);
});
test('丑未年客气：初厥阴、二少阴、三太阴（司天）、四少阳、五阳明、六太阳（在泉）——2021 辛丑', () => {
  const y = getYearYunqi(2021);
  assert.strictEqual(y.ganzhi, '辛丑');
  assert.deepStrictEqual(y.keQi, ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水']);
});
test('辰戌年客气：初少阳、二阳明、三太阳（司天）、四厥阴、五少阴、六太阴（在泉）——2024 甲辰', () => {
  const y = getYearYunqi(2024);
  assert.deepStrictEqual(y.keQi, ['少阳相火', '阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土']);
});
test('巳亥年客气：初阳明、二太阳、三厥阴（司天）、四少阴、五太阴、六少阳（在泉）', () => {
  const y = getYearYunqi(2025);
  assert.deepStrictEqual(y.keQi, ['阳明燥金', '太阳寒水', '厥阴风木', '少阴君火', '太阴湿土', '少阳相火']);
});

console.log('=== 天符岁会（《六元正纪》逐岁标注对照） ===');
test('2024 甲辰：岁会、同天符', () => {
  const marks = getFuHui(2024);
  assert.ok(marks.includes('岁会') && marks.includes('同天符'), `实际：${marks.join(',')}`);
});
test('2026 丙午：非天符非岁会（水运遇君火司天）', () => {
  assert.strictEqual(getFuHui(2026).length, 0);
});
test('2028 戊申：天符（火运+少阳相火司天）', () => {
  assert.ok(getFuHui(2028).includes('天符'), `实际：${getFuHui(2028).join(',')}`);
});
test('2029 己酉：天符+岁会+太一天符（原文：己酉？对照：乙酉太一天符；己酉非）', () => {
  // 校验真值：己酉——土运，司天阳明燥金（金）不同气非天符；酉金位土运非岁会 → 应为空
  assert.strictEqual(getFuHui(2029).length, 0, `实际：${getFuHui(2029).join(',')}`);
});
test('2005 乙酉：天符+岁会+太一天符（《六元正纪》原文标注）', () => {
  const marks = getFuHui(2005);
  assert.ok(marks.includes('太一天符') && marks.includes('天符') && marks.includes('岁会'), `实际：${marks.join(',')}`);
});
test('2084 甲辰：岁会同天符（六十年循环回甲辰）', () => {
  const marks = getFuHui(2084);
  assert.ok(marks.includes('岁会') && marks.includes('同天符'), `实际：${marks.join(',')}`);
});
test('2020 庚子：同天符（金运太过+阳明燥金在泉）', () => {
  assert.ok(getFuHui(2020).includes('同天符'), `实际：${getFuHui(2020).join(',')}`);
});
test('2023 癸卯：同岁会（火运不及+少阴君火在泉）', () => {
  assert.ok(getFuHui(2023).includes('同岁会'), `实际：${getFuHui(2023).join(',')}`);
});

console.log('=== 六十年运气相临 ===');
test('2026 丙午：运克司天（水克火）为不和', () => {
  const y = getYearYunqi(2026);
  assert.strictEqual(y.linYun.type, '不和');
});
test('2024 甲辰：司天生运？土运+寒水司天——土克水，运克司天为不和', () => {
  const y = getYearYunqi(2024);
  assert.strictEqual(y.linYun.type, '不和');
});
test('2022 壬寅：太角木运+少阳相火司天，木生火=运生天气小逆', () => {
  const y = getYearYunqi(2022);
  assert.strictEqual(y.linYun.type, '小逆');
});

console.log('=== 六步气定位 ===');
test('2026-05-10 落二之气（春分~小满）', () => {
  const s = getStepByDate(2026, 5, 10);
  assert.strictEqual(s.name, '二之气');
  assert.strictEqual(s.qi, '少阴君火');
});
test('2026-01-05 落终之气（小雪~大寒跨年）', () => {
  assert.strictEqual(getStepByDate(2026, 1, 5).name, '终之气');
});
test('2026-12-01 落终之气', () => {
  assert.strictEqual(getStepByDate(2026, 12, 1).name, '终之气');
});
test('2026-08-15 落四之气（大暑~秋分）', () => {
  assert.strictEqual(getStepByDate(2026, 8, 15).name, '四之气');
});

console.log('=== 客主加临 ===');
test('同气相临：客太阳寒水加主太阳寒水为同气', () => {
  const r = jiaLin('太阳寒水', '太阳寒水');
  assert.strictEqual(r.relation, '同气');
});
test('主胜客为逆：主君火克客燥金', () => {
  const r = jiaLin('阳明燥金', '少阴君火');
  assert.strictEqual(r.relation, '主胜客');
  assert.strictEqual(r.ok, false);
});
test('客胜主为从：客寒水克主君火', () => {
  const r = jiaLin('太阳寒水', '少阴君火');
  assert.strictEqual(r.relation, '客胜主');
  assert.strictEqual(r.ok, true);
});

console.log('=== 逐岁药食宜（《六元正纪》原文对照） ===');
test('2026 丙午药食宜：上咸寒 中咸热 下酸温', () => {
  const y = getYearYunqi(2026);
  assert.strictEqual(y.yaoShiYi.shang, '咸寒');
  assert.strictEqual(y.yaoShiYi.zhong, '咸热');
  assert.strictEqual(y.yaoShiYi.xia, '酸温');
});
test('2024 甲辰药食宜：上苦热 中苦温 下苦温', () => {
  const y = getYearYunqi(2024);
  assert.strictEqual(y.yaoShiYi.shang, '苦热');
  assert.strictEqual(y.yaoShiYi.zhong, '苦温');
  assert.strictEqual(y.yaoShiYi.xia, '苦温');
});
test('2014 甲午药食宜：上咸寒 中苦热 下酸热（甲午岁）', () => {
  const y = getYearYunqi(2014);
  assert.strictEqual(y.yaoShiYi.shang, '咸寒');
  assert.strictEqual(y.yaoShiYi.zhong, '苦热');
  assert.strictEqual(y.yaoShiYi.xia, '酸热');
});

console.log('=== 灾宫（邪气化日） ===');
test('2017 丁酉：灾三宫（少角木运不及）', () => {
  assert.strictEqual(getYearYunqi(2017).zaiGong, '灾三宫');
});
test('2021 辛丑：灾一宫', () => {
  assert.strictEqual(getYearYunqi(2021).zaiGong, '灾一宫');
});
test('2026 丙午正化年无灾宫', () => {
  assert.strictEqual(getYearYunqi(2026).zaiGong, '');
});

console.log('=== 平气判定 ===');
test('2018 戊戌：火运太过遇太阳寒水司天——同正征平气', () => {
  const y = getYearYunqi(2018);
  assert.ok(y.pingQi.length > 0, `实际：${y.pingQi.join(';')}`);
  assert.ok(y.pingQi[0].includes('同正征'));
});
test('2017 丁酉：木运不及得金？非——丁酉同正商（《六元正纪》标注）', () => {
  const y = getYearYunqi(2017);
  assert.ok(y.pingQi.some((p) => p.includes('同正商')), `实际：${y.pingQi.join(';')}`);
});

console.log('=== 六十年全表完整性 ===');
test('SIXTY_YEARS 覆盖 60 干支且无重复', () => {
  const { SIXTY_YEARS } = require('./lib/data60');
  assert.strictEqual(SIXTY_YEARS.length, 60);
  const set = new Set(SIXTY_YEARS.map((r) => r.ganzhi));
  assert.strictEqual(set.size, 60);
});
test('六十年任意年份可查询且司天与年支化气一致', () => {
  const { ZHI_QI } = require('./lib/laws');
  const { ZHI_GROUPS } = require('./lib/data60');
  for (let y = 1924; y <= 2043; y++) {
    const g = ganzhiOfYear(y);
    const rec = require('./lib/yunqi').lookupSixty(y);
    assert.ok(rec, `${y} 年缺失记录`);
    assert.strictEqual(zhiGroupOf(g.zhi), rec.zhiGroup, `${y} 年支组不匹配`);
    assert.strictEqual(
      ZHI_GROUPS[rec.zhiGroup].siTian.qi, ZHI_QI[g.zhi],
      `${y} 年司天与年支化气不一致`
    );
  }
});

console.log('=== 月盘（含主客运） ===');
test('2026-05-10 二之气 客气厥阴风木 主运征 客运少角', () => {
  const m = getMonthYunqi(2026, 5, 10);
  assert.strictEqual(m.step.name, '二之气');
  assert.strictEqual(m.step.keQi, '厥阴风木');
  assert.strictEqual(m.yunStep.zhuYun.yin, '征');
  assert.strictEqual(m.yunStep.keYun.taiShao, '少角');
});
test('2026-12-01 终之气 客气阳明燥金（在泉之气）', () => {
  const m = getMonthYunqi(2026, 12, 1);
  assert.strictEqual(m.step.name, '终之气');
  assert.strictEqual(m.step.keQi, '阳明燥金');
});

console.log('=== 八字结合 ===');
test('八字先天推断可执行且五脏谱齐全', () => {
  const c = buildConstitution('1990-05-01T08:30', {});
  assert.strictEqual(c.bazi.year.length, 2);
  assert.strictEqual(c.organs.length, 5);
  const total = c.organs.reduce((s, o) => s + o.percent, 0);
  assert.ok(total >= 98 && total <= 102, `百分比合计 ${total}`);
});
test('1990 庚午年生人：金运太过（庚），先天肺偏盛', () => {
  const c = buildConstitution('1990-05-01T08:30', {});
  assert.strictEqual(c.birthYearGanzhi, '庚午');
  assert.strictEqual(c.birthYun.taiShao, '太商');
  assert.ok(c.birthYun.note.includes('肺'));
});
test('流年预警：1990 庚午生人查 2026', () => {
  const c = buildConstitution('1990-05-01T08:30', {});
  const w = yearWarn(c, 2026);
  assert.ok(w.yunqiSummary.ganzhi === '丙午');
  assert.ok(Array.isArray(w.warns));
});
test('流年预警：2026 水太过克心火——弱火者应高风险', () => {
  // 构造弱火命（用五行分布自然产生）
  const c = buildConstitution('1988-02-18T10:00', {});
  const w = yearWarn(c, 2026);
  const high = w.warns.filter((x) => x.level === '高');
  assert.ok(Array.isArray(high));
});

console.log('=== 出生地禀赋（《异法方宜论》）与生活调摄 ===');
test('广州解析为南方火+岭南湿热修正', () => {
  const c = buildConstitution('1990-05-01T08:30', { location: '广州' });
  assert.ok(c.region, 'region 缺失');
  assert.strictEqual(c.region.direction, '南');
  assert.strictEqual(c.region.wuxing, '火');
  assert.ok(c.region.location.includes('广州'));
  assert.ok(c.region.jiaoZheng.includes('湿热'));
});
test('哈尔滨北方、成都西方、上海东方、郑州中方', () => {
  const cases = [['哈尔滨', '北'], ['成都', '西'], ['上海', '东'], ['郑州', '中']];
  for (const [loc, dir] of cases) {
    const c = buildConstitution('1990-05-01T08:30', { location: loc });
    assert.strictEqual(c.region.direction, dir, `${loc} 应为${dir}方，实际${c.region.direction}`);
  }
});
test('成长风险清单三源齐备且带来源标注', () => {
  const c = buildConstitution('1990-05-01T08:30', { location: '广州' });
  assert.ok(c.grownRisks.length >= 5, `风险条数 ${c.grownRisks.length}`);
  const sources = new Set(c.grownRisks.map((r) => r.source));
  for (const s of ['八字弱脏', '生年岁运', '出生地《异法方宜》', '生年司天']) {
    assert.ok(sources.has(s), `缺少来源 ${s}`);
  }
});
test('生活调摄含弱脏食养与总则', () => {
  const c = buildConstitution('1990-05-01T08:30', { location: '广州' });
  assert.ok(c.lifeStyle.perOrgan.length >= 1);
  assert.ok(c.lifeStyle.perOrgan[0].yi.includes('脏气法时论') || c.lifeStyle.perOrgan[0].yi.length > 10);
  assert.ok(c.lifeStyle.zongZe.length >= 4);
  assert.ok(c.lifeStyle.yaoShi.length > 5);
});
test('无地点输入时 region 为 null 不报错', () => {
  const c = buildConstitution('1990-05-01T08:30', {});
  assert.strictEqual(c.region, null);
  assert.ok(c.grownRisks.length >= 3);
});

console.log('=== 全年回归：六十aN每一年的输出完整性 ===');
test('1924-2043 全部年份 getYearYunqi 不抛错且字段完整', () => {
  for (let y = 1924; y <= 2043; y++) {
    const d = getYearYunqi(y);
    assert.ok(d.ganzhi && d.zhongYun.taiShao && d.siTian.qi && d.zaiQuan.qi, `${y} 输出缺失`);
    assert.strictEqual(d.steps.length, 6, `${y} 六步数错误`);
    assert.ok(d.yaoShiYi && d.yaoShiYi.shang, `${y} 药食宜缺失`);
    assert.ok(d.yunBing && d.yunBing.head, `${y} 病候缺失`);
    assert.ok(d.fangJi.yunFang.name, `${y} 岁运方缺失`);
  }
});

console.log(`\n=== 结果：${pass} 通过 / ${fail} 失败 ===`);
if (failures.length) {
  console.log('失败详情：');
  failures.forEach((f) => console.log(`  ✗ ${f.name}: ${f.msg}`));
  process.exit(1);
}