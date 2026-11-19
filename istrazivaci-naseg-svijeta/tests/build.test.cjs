const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project=path.join(__dirname,'..'),root=path.join(project,'..');

test('build creates one self-contained app and integrates four explicit portal routes', () => {
  const run=spawnSync(process.execPath,['scripts/build.cjs','--portal'],{cwd:project,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);

  const dist=fs.readFileSync(path.join(project,'dist/index.html'),'utf8');
  assert.match(dist,/<!doctype html>/i);assert.match(dist,/Istraživači našeg svijeta/);
  assert.equal((dist.match(/<script\b[^>]*>/g)||[]).length,8);
  // A detached copy can navigate to the public hub and share a public lesson URL.
  const publicHub='https://aplikacije-za-ucenje.onrender.com/';
  const publicApp='https://aplikacije-za-ucenje.onrender.com/istrazivaci-naseg-svijeta/index.html';
  assert.doesNotMatch(dist.replace(publicApp,'').replace(publicHub,''),/<script\s+src=|<link\s+rel="stylesheet"|https?:\/\//i);
  assert.ok(Buffer.byteLength(dist)<256*1024);
  assert.equal(fs.readFileSync(path.join(root,'javne-aplikacije/istrazivaci-naseg-svijeta/index.html'),'utf8'),dist);

  assert.equal(fs.readFileSync(path.join(root,'page-apps/istrazivaci-naseg-svijeta.html'),'utf8'),dist);
  const portal=fs.readFileSync(path.join(root,'javne-aplikacije/index.html'),'utf8');
  for(const route of ['matematicka-pustolovina/index.html','mislim-i-otkrivam/index.html','informaticka-pustolovina/index.html','istrazivaci-naseg-svijeta/index.html']){
    assert.match(portal,new RegExp(`href="${route}"`));
    assert.ok(fs.statSync(path.join(root,'javne-aplikacije',route)).isFile(),route);
  }
});
