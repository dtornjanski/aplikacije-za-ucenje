const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project=path.join(__dirname,'..');
const root=path.join(project,'..');

test('build creates one self-contained app and integrates with all four portal routes', () => {
  const build=spawnSync(process.execPath,['scripts/build.cjs','--portal'],{cwd:project,encoding:'utf8'});
  assert.equal(build.status,0,build.stderr||build.stdout);

  const dist=fs.readFileSync(path.join(project,'dist/index.html'),'utf8');
  assert.ok(Buffer.byteLength(dist)<256*1024);
  assert.match(dist,/<style>[\s\S]+<\/style>/);
  assert.equal((dist.match(/<script\b[^>]*>/g)||[]).length,4);
  assert.doesNotMatch(dist,/(?:src|href)=["']https?:|\bfetch\s*\(|@import\s+url/i);
  assert.doesNotMatch(dist,/<script\s+src=|<link\s+rel=["']stylesheet/i);

  const publicApp=fs.readFileSync(path.join(root,'javne-aplikacije/informaticka-pustolovina/index.html'),'utf8');
  assert.equal(publicApp,dist);
  assert.equal(fs.readFileSync(path.join(root,'page-apps/informaticka-pustolovina.html'),'utf8'),dist);
  const portal=fs.readFileSync(path.join(root,'javne-aplikacije/index.html'),'utf8');
  for(const route of ['matematicka-pustolovina/index.html','mislim-i-otkrivam/index.html','informaticka-pustolovina/index.html','istrazivaci-naseg-svijeta/index.html']) assert.ok(portal.includes(`href="${route}"`));
});
