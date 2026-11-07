'use strict';

// 五运六气 CLI
// 用法：
//   node cli.js year [年份]                     年盘（默认当年）
//   node cli.js month [YYYY-MM-DD]              月盘（六步定位，默认今日）
//   node cli.js bazi  <生辰> [地点]              八字先天禀赋
//   node cli.js warn  <年份> --birth <生辰>      流年与先天交互预警

const { getYearYunqi, getMonthYunqi } = require('./lib/yunqi');
const { buildConstitution, yearWarn } = require('./lib/bazi-yunqi');

function line(ch, n) { return ch.repeat(n || 64); }

function fmtYear(year) {
  const y = getYearYunqi(year);
  const out = [];
  out.push(line('═'));
  out.push(`  ${y.year} 年  ${y.ganzhi}  〔${y.zheng} · ${y.yunZhu}〕`);
  out.push(line('═'));
  out.push(`中运（岁运）：${y.zhongYun.taiShao} —— ${y.zhongYun.wuxing}运${y.zhongYun.level === 'taiGuo' ? '太过' : '不及'}【${y.zhongYun.sanQiName}之纪】`);
  out.push(`  三气之纪：${y.zhongYun.sanQiDesc}`);
  out.push(`司天（上半年）：${y.siTian.qi}（应${y.siTian.organs}）`);
  out.push(`  治则：${y.siTian.zhiZhi}`);
  out.push(`在泉（下半年）：${y.zaiQuan.qi}（应${y.zaiQuan.organs}）`);
  out.push(`  治则：${y.zaiQuan.zhiZhi}`);
  if (y.fuHui.length || (y.note && y.note.length)) out.push(`符会标记：${(y.note && y.note.length ? y.note : y.fuHui).join('、') || '无'}`);
  if (y.linYun) out.push(`运气相临：${y.linYun.type} —— ${y.linYun.desc}`);
  out.push(`运气生克：${y.relation.label}`);
  if (y.pingQi.length) out.push(`平气判定：${y.pingQi.join('；')}`);
  if (y.shengFu) out.push(`胜复：${y.shengFu}`);
  if (y.zaiGong) out.push(`灾宫：${y.zaiGong}`);
  out.push('');
  out.push(`— 其运：${y.qiYun}　其化：${y.qiHua || '（胜复年随胜复化）'}　其变：${y.qiBian || '—'}`);
  if (y.qiBingYun) out.push(`— 其病：${y.qiBingYun}`);
  if (y.huaShu) out.push(`— 三化数：${y.huaShu.zhong}${y.huaShu.qita ? '，' + y.huaShu.qita : ''}（《六元正纪》正化之数）`);
  out.push('');
  out.push(`〔天象〕${y.starOmen}`);
  out.push(`〔五行德变〕${y.wuxingBian}`);
  out.push('');
  out.push(`〔岁运主病〕${y.yunBing.head}`);
  out.push(`  病候：${y.yunBing.bing}`);
  out.push(`  天应：${y.yunBing.tian}`);
  out.push(`  脉绝危候：${y.yunBing.maiJue}`);
  out.push(`  复病：${y.yunBing.fuBing}`);
  out.push('');
  out.push(`〔司天民病〕${y.minBing}`);
  out.push(`〔在泉病候〕${y.zaiQuan.bing}`);
  out.push('');
  out.push(`〔郁发〕${y.yuFa.faShi}；先兆：${y.yuFa.zhengZhao}`);
  out.push(`  郁发病候：${y.yuFa.bing}`);
  out.push(`  郁发治则：${y.yuFa.zhi}`);
  out.push('');
  out.push(`〔病机纲〕${y.bingJi}`);
  out.push('');
  out.push('〔六步气逐步病候〕');
  for (const s of y.steps) {
    out.push(`  ${s.name} ${s.period}（${s.months}）`);
    out.push(`    客气${s.keQi} 加临 主气${s.qi} —— ${s.jiaLin.label}`);
    out.push(`    病候：${s.bing}`);
  }
  out.push('');
  out.push(`〔岁宜治则〕${y.suiYi}`);
  out.push(`〔药食宜〕上（司天）：${y.yaoShiYi.shang}；中（岁运）：${y.yaoShiYi.zhong}；下（在泉）：${y.yaoShiYi.xia}（《六元正纪》药食宜也）`);
  out.push(`〔食岁谷〕${y.shiGu}`);
  out.push('');
  out.push(`〔岁运方·三因方〕${y.fangJi.yunFang.name}`);
  out.push(`  ${y.fangJi.yunFang.zhu}`);
  out.push(`〔司天在泉方·三因方〕${y.fangJi.qiFang.name}`);
  out.push(`  ${y.fangJi.qiFang.zhu}`);
  out.push('');
  out.push(`〔南北政〕${y.nanBeiZheng.zheng}年 —— ${y.nanBeiZheng.note}`);
  out.push('');
  out.push('【安全提示】本输出为《内经》运气学推演参考，具体用药请在执业中医师指导下进行。');
  return out.join('\n');
}

function fmtMonth(y, m, d) {
  const r = getMonthYunqi(y, m, d);
  const out = [];
  out.push(line('─'));
  out.push(`  ${r.year}-${String(r.month).padStart(2, '0')}${r.day ? '-' + String(r.day).padStart(2, '0') : ''}　岁在${r.ganzhi}　月建${r.monthGanzhi}`);
  out.push(line('─'));
  out.push(`所在六步：${r.step.name}（${r.step.period}，${r.step.months}）`);
  out.push(`  主气：${r.step.zhuQi}`);
  out.push(`  客气：${r.step.keQi}`);
  out.push(`  客主加临：${r.step.jiaLin.label}`);
  out.push(`  本步病候：${r.step.bing}`);
  out.push('');
  out.push(`主运：${r.yunStep.zhuYun.name}·${r.yunStep.zhuYun.yin}音（${r.yunStep.zhuYun.wuxing}），起于${r.yunStep.zhuYun.start}——${r.yunStep.zhuYun.note}`);
  out.push(`客运：${r.yunStep.keYun.taiShao}（${r.yunStep.keYun.wuxing}）——${r.yunStep.keYun.note}`);
  out.push('');
  out.push(`〔本步用药方向〕`);
  out.push(`  药食宜：上${r.yongYao.yaoShiYi.shang} / 中${r.yongYao.yaoShiYi.zhong} / 下${r.yongYao.yaoShiYi.xia}`);
  out.push(`  岁运方：${r.yongYao.fangJi.yunFang.name}`);
  out.push(`  司天在泉方：${r.yongYao.fangJi.qiFang.name}（含六步加减法，随步调整）`);
  return out.join('\n');
}

function fmtBazi(birth, loc) {
  const c = buildConstitution(birth, loc ? { location: loc } : {});
  const out = [];
  out.push(line('═'));
  out.push(`  先天禀赋推断（生辰 ${c.birth}）`);
  out.push(line('═'));
  out.push(`四柱八字：${c.bazi.year} ${c.bazi.month} ${c.bazi.day} ${c.bazi.time}`);
  out.push(`生年干支：${c.birthYearGanzhi}　日主：${c.dayMaster.gan}（${c.dayMaster.wuxing}）`);
  out.push('');
  out.push(`〔生年岁运〕${c.birthYun.taiShao}——${c.birthYun.wuxing}运${c.birthYun.level === 'taiGuo' ? '太过' : '不及'}`);
  out.push(`  ${c.birthYun.note}`);
  out.push(`〔生年司天〕${c.birthSiTian.qi}`);
  out.push(`  ${c.birthSiTian.note}`);
  out.push('');
  out.push('〔八字五行谱〕（干支藏干加权）');
  for (const o of c.organs) {
    out.push(`  ${o.wuxing} → ${o.zang}（${o.fu}）${o.percent}%　${o.level}　病象：${o.bing}`);
  }
  out.push('');
  out.push('〔先天不足脏腑〕');
  for (const w of c.xianTianBuZu) {
    out.push(`  ${w.organ}（${w.wuxing}，占${w.percent}%）`);
    out.push(`    易患：${w.risk}`);
    out.push(`    调护：${w.tiaoHu}`);
  }
  out.push(`〔先天偏旺〕${c.xianTianWang.organ}（${c.xianTianWang.wuxing}，占${c.xianTianWang.percent}%）——${c.xianTianWang.note}`);
  out.push('');
  if (c.region) {
    out.push(`〔出生地禀赋〕${c.region.location} —— ${c.region.direction}方（${c.region.wuxing}）`);
    out.push(`  《异法方宜》：${c.region.origin}`);
    out.push(`  地域病候：${c.region.regionBing}`);
    if (c.region.jiaoZheng) out.push(`  气候修正：${c.region.jiaoZheng}`);
    out.push('');
  }
  out.push('〔成年后需注意的疾病〕（弱脏×生年岁运×出生地 三源推演）');
  for (const r of c.grownRisks) {
    out.push(`  ◆ [${r.source}] ${r.organ}：${r.text}`);
  }
  out.push('');
  out.push('〔平时生活饮食起居注意〕');
  for (const p of c.lifeStyle.perOrgan) {
    out.push(`  养${p.organ}（${p.wuxing}）：`);
    out.push(`    食养宜：${p.yi}`);
    out.push(`    食养忌：${p.ji}`);
    out.push(`    起居：${p.qiJu}`);
    out.push(`    情志：${p.qingZhi}`);
    out.push(`    ${p.yunDong}`);
  }
  out.push('  【总则】');
  for (const z of c.lifeStyle.zongZe) out.push(`    · ${z}`);
  out.push(`  【药食方向】${c.lifeStyle.yaoShi}`);
  return out.join('\n');
}

function fmtWarn(year, birth, loc) {
  const c = buildConstitution(birth, loc ? { location: loc } : {});
  const w = yearWarn(c, year);
  const out = [];
  out.push(line('═'));
  out.push(`  ${w.year} 年 与 先天禀赋交互预警`);
  out.push(line('═'));
  out.push(`流年运气：${w.yunqiSummary.ganzhi}　${w.yunqiSummary.zhongYun}　司天${w.yunqiSummary.siTian}　在泉${w.yunqiSummary.zaiQuan}　${w.yunqiSummary.linYun}`);
  out.push('');
  if (!w.warns.length) {
    out.push('本年无高发交互预警：先天弱脏不受岁运克伐，亦无凶岁标记。仍宜按岁宜调摄。');
  } else {
    for (const x of w.warns) {
      out.push(`〔${x.level === '高' ? '🔴' : '🟡'} ${x.level}风险〕${x.organ}`);
      out.push(`  理由：${x.reason}`);
      out.push(`  易患：${x.bing}`);
      out.push(`  方向：${x.fang}`);
      out.push('');
    }
  }
  out.push('〔本年用药总纲〕');
  out.push(`  岁宜：${w.yongYao.suiYi}`);
  out.push(`  药食宜：上${w.yongYao.yaoShiYi.shang} / 中${w.yongYao.yaoShiYi.zhong} / 下${w.yongYao.yaoShiYi.xia}`);
  out.push(`  岁运方：${w.yongYao.yunFang.name} —— ${w.yongYao.yunFang.zhu.split('。')[0]}`);
  out.push(`  司天在泉方：${w.yongYao.qiFang.name}（六步加减）`);
  out.push('');
  out.push('【安全提示】本输出为《内经》运气学推演参考，具体用药请在执业中医师指导下进行。');
  return out.join('\n');
}

function main() {
  const [, , cmd, ...args] = process.argv;
  const now = new Date();
  const argStr = args.join(' ');
  const birthMatch = /--birth[= ](\S+)/.exec(argStr);
  const locMatch = /--loc[= ]([^\s].*?)(?:\s--|$)/.exec(argStr);

  try {
    if (cmd === 'year') {
      const year = Number(args[0]) || now.getFullYear();
      console.log(fmtYear(year));
    } else if (cmd === 'month') {
      const target = args[0] || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const [y, m, d] = target.split('-').map(Number);
      if (!y || !m) throw new Error('格式：month YYYY-MM-DD');
      console.log(fmtMonth(y, m, d || now.getDate()));
    } else if (cmd === 'bazi') {
      if (!args[0]) throw new Error('格式：bazi <生辰 YYYY-MM-DD[THH:mm]> [地点]');
      const loc = args[1] || (locMatch ? locMatch[1] : null);
      console.log(fmtBazi(args[0], loc));
    } else if (cmd === 'warn') {
      if (!birthMatch) throw new Error('格式：warn <年份> --birth <生辰> [--loc 地点]');
      const year = Number(args[0]) || now.getFullYear();
      console.log(fmtWarn(year, birthMatch[1], locMatch ? locMatch[1] : null));
    } else {
      console.log(`五运六气本地查询工具（数据源：《素问》七篇大论/《运气要诀》/《三因方》）

用法：
  node cli.js year  [年份]                    年盘：岁运/司天在泉/六步客气/疾病/天象/用药
  node cli.js month [YYYY-MM-DD]              月盘：六步定位/主客气/主客运/用药变化
  node cli.js bazi  <生辰> [地点]              八字先天禀赋推断
  node cli.js warn  <年份> --birth <生辰>      流年与先天交互预警

示例：
  node cli.js year 2026
  node cli.js month 2026-05-10
  node cli.js bazi 1990-05-01T08:30 北京
  node cli.js warn 2026 --birth 1990-05-01T08:30 --loc 北京`);
    }
  } catch (e) {
    console.error('错误：' + e.message);
    process.exit(1);
  }
}

main();