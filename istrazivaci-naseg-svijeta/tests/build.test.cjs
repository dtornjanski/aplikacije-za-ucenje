const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project=path.join(__dirname,'..'),root=path.join(project,'..');

test('build creates one self-contained app and integrates four explicit portal routes', () => {
  let run=spawnSync(process.execPath,['scripts/build.cjs'],{cwd:project,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);
  run=spawnSync(process.execPath,['build-page-apps.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout);

  const dist=fs.readFileSync(path.join(project,'dist/index.html'),'utf8');
  assert.match(dist,/<!doctype html>/i);assert.match(dist,/Istraživači našeg svijeta/);
  assert.equal((dist.match(/<script>/g)||[]).length,3);
  assert.doesNotMatch(dist,/<script\s+src=|<link\s+rel="stylesheet"|https?:\/\//i);
  assert.ok(Buffer.byteLength(dist)<256*1024);
  assert.equal(fs.readFileSync(path.join(root,'javne-aplikacije/istrazivaci-naseg-svijeta/index.html'),'utf8'),dist);

  const portal=fs.readFileSync(path.join(root,'javne-aplikacije/index.html'),'utf8');
  assert.equal((portal.match(/class="card"/g)||[]).length,4);
  for(const route of ['matematicka-pustolovina/index.html','mislim-i-otkrivam/index.html','informaticka-pustolovina/index.html','istrazivaci-naseg-svijeta/index.html']) assert.match(portal,new RegExp(`href="${route}"`));
});
