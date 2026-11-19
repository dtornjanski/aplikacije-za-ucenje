const fs=require('node:fs');
const path=require('node:path');
const {withPortalNavigation}=require('../../shared/portal-navigation.cjs');

const project=path.join(__dirname,'..');
const src=path.join(project,'src');
const dist=path.join(project,'dist');
const read=name=>fs.readFileSync(path.join(src,name),'utf8');
const safeScript=value=>value.replace(/<\/script/gi,'<\\/script');

const engine=read('engine.js'),content=read('content.js'),app=read('app.js'),css=read('styles.css');
for(const [name,source] of [['engine.js',engine],['content.js',content],['app.js',app]]){
  try{new Function(source);}catch(error){throw new Error(`${name}: ${error.message}`);}
}

let html=read('index.html')
  .replace(/\s*<link rel="stylesheet" href="styles\.css">/,'\n  <style>'+css+'</style>')
  .replace(/\s*<script src="engine\.js"><\/script>/,'\n  <script>'+safeScript(engine)+'</script>')
  .replace(/\s*<script src="content\.js"><\/script>/,'\n  <script>'+safeScript(content)+'</script>')
  .replace(/\s*<script src="app\.js"><\/script>/,'\n  <script>'+safeScript(app)+'</script>');

const appName=path.basename(project);
html=withPortalNavigation(html,appName);
if(/<script\s+src=|<link\s+rel="stylesheet"/i.test(html)) throw new Error('Build still contains external source references.');
if(Buffer.byteLength(html)>256*1024) throw new Error('Standalone HTML exceeds 256 KiB.');
fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'index.html'),html,'utf8');
if(process.argv.includes('--portal')){
  const root=path.dirname(project);
  for(const output of [path.join(root,'page-apps',appName+'.html'),path.join(root,'javne-aplikacije',appName,'index.html')]){
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,html,'utf8');
  }
}
console.log(`informaticka-pustolovina/dist/index.html: ${Buffer.byteLength(html)} bytes`);
