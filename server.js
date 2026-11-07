'use strict';

// 五运六气本地查询服务
// 用法：node server.js [端口]（默认 3789）→ http://localhost:3789

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { getYearYunqi, getMonthYunqi } = require('./lib/yunqi');
const { buildConstitution, yearWarn } = require('./lib/bazi-yunqi');

const PORT = Number(process.argv[2]) || 3789;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function safe(fn, res) {
  try { return fn(); } catch (e) { send(res, 400, { error: e.message }); return null; }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  if (p === '/api/year') {
    return void safe(() => send(res, 200, getYearYunqi(Number(url.searchParams.get('y')) || new Date().getFullYear())), res);
  }
  if (p === '/api/month') {
    return void safe(() => {
      const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
      const [y, m, d] = date.split('-').map(Number);
      return send(res, 200, getMonthYunqi(y, m, d));
    }, res);
  }
  if (p === '/api/bazi') {
    return void safe(() => {
      const birth = url.searchParams.get('birth');
      const location = url.searchParams.get('location');
      if (!birth) throw new Error('缺少 birth 参数');
      return send(res, 200, buildConstitution(birth, location ? { location } : {}));
    }, res);
  }
  if (p === '/api/warn') {
    return void safe(() => {
      const birth = url.searchParams.get('birth');
      const location = url.searchParams.get('location');
      if (!birth) throw new Error('缺少 birth 参数');
      const c = buildConstitution(birth, location ? { location } : {});
      return send(res, 200, yearWarn(c, Number(url.searchParams.get('y')) || new Date().getFullYear()));
    }, res);
  }
  if (p === '/' || p === '/index.html') {
    return void send(res, 200, fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), MIME['.html']);
  }
  const rel = p.slice(1);
  const asset = path.join(__dirname, rel);
  if (!asset.startsWith(__dirname)) { send(res, 403, { error: 'forbidden' }); return; }
  if (fs.existsSync(asset) && fs.statSync(asset).isFile()) {
    return void send(res, 200, fs.readFileSync(asset), MIME[path.extname(asset)] || 'application/octet-stream');
  }
  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`五运六气本地查询已启动：http://localhost:${PORT}`);
  console.log('数据源：《素问》七篇大论 / 《运气要诀》 / 《三因极一病证方论》');
});