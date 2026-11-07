'use strict';

// 浏览器打包器：将 lib/ 下 CommonJS 模块依赖图打包为单文件 bundle.js（供 GitHub Pages 纯静态使用）
// 用法：node build.js  →  生成 public/bundle.js
// 设计：零依赖 CommonJS 包装器；node:fs/path/crypto 以 shim 提供；
//       china-regions.json 内联进 fs shim（同步可用，无时序问题）。

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const ENTRIES = ['lib/yunqi.js', 'lib/bazi-yunqi.js'];

// ---- 依赖图扫描 ----
const modules = new Map(); // relPath → source

function resolveRequire(fromRel, spec) {
  if (spec.startsWith('node:')) return spec;
  const base = spec.endsWith('.js') ? spec : spec + '.js';
  const dir = path.dirname(fromRel);
  let p = path.join(dir, base);
  p = path.normalize(p).replace(/\\/g, '/');
  if (modules.has(p) || fs.existsSync(path.join(ROOT, p))) return p;
  throw new Error(`无法解析 require('${spec}') 于 ${fromRel}`);
}

function scan(rel) {
  if (modules.has(rel)) return;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  modules.set(rel, src);
  const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (spec.startsWith('node:')) continue;
    scan(resolveRequire(rel, spec));
  }
}

ENTRIES.forEach(scan);

// ---- 模块包装 ----
function wrap(rel, src) {
  return `__modules['${rel}'] = function (module, exports, require, __filename, __dirname) {\n${src}\n};`;
}

const parts = [];
for (const [rel, src] of modules) {
  parts.push(wrap(rel, src));
}

// node:crypto shim（util.js 依赖；本工具核心路径不使用，提供安全空实现防崩）
// node:fs shim：china-regions.json 从内联数据返回
// node:path shim：join/dirname/basename
const regionsJson = fs.readFileSync(path.join(ROOT, 'data', 'china-regions.json'), 'utf8');

const bundle = `/*! 五运六气浏览器版 —— 由 build.js 从 lib/ CommonJS 源码打包生成，勿手改 */
(function () {
'use strict';
var __modules = {};
${parts.join('\n')}

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
  join: function () { var seg = Array.prototype.slice.call(arguments); var out = []; seg.forEach(function (s) { String(s).split(/[\\\\/]+/).forEach(function (p) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }); }); return out.join('/'); },
  dirname: function (p) { var i = p.lastIndexOf('/'); return i > 0 ? p.slice(0, i) : '.'; },
  basename: function (p) { return String(p).split('/').pop(); },
  normalize: function (p) { return __pathShim.join(p); }
};
var __REGION_FILE = /china-regions\\.json$/;
var __fsShim = {
  readFileSync: function (p) {
    if (__REGION_FILE.test(String(p))) return ${JSON.stringify(regionsJson)};
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
`;

fs.writeFileSync(path.join(ROOT, 'bundle.js'), bundle);
console.log(`bundle.js 生成完成：模块 ${modules.size} 个，${(bundle.length / 1024).toFixed(0)} KB`);