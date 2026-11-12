const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project=path.join(__dirname,'..');
const root=path.join(project,'..');

test('build creates one self-contained application and integrates three portal cards', () => {
  const build=spawnSync(process.execPath,['scripts/build.cjs'],{cwd:project,encoding:'utf8'});
  assert.equal(build.status,0,build.stderr||build.stdout);
  const portalBuild=spawnSync(process.execPath,['build-page-apps.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(portalBuild.status,0,portalBuild.stderr||portalBuild.stdout);

  const dist=fs.readFileSync(path.join(project,'dist/index.html'),'utf8');
  assert.ok(Buffer.byteLength(dist)<256*1024);
  assert.match(dist,/<style>[\s\S]+<\/style>/);
  assert.equal((dist.match(/<script>/g)||[]).length,3);
  assert.doesNotMatch(dist,/(?:src|href)=["']https?:|\bfetch\s*\(|@import\s+url/i);
  assert.doesNotMatch(dist,/<script\s+src=|<link\s+rel=["']stylesheet/i);

  const publicApp=fs.readFileSync(path.join(root,'javne-aplikacije/informaticka-pustolovina/index.html'),'utf8');
  assert.equal(publicApp,dist);
  const portal=fs.readFileSync(path.join(root,'javne-aplikacije/index.html'),'utf8');
  assert.equal((portal.match(/class="card"/g)||[]).length,3);
  for(const route of ['matematicka-pustolovina/index.html','mislim-i-otkrivam/index.html','informaticka-pustolovina/index.html']) assert.match(portal,new RegExp(`href="${route}"`));
});
