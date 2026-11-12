const fs=require('node:fs');
const path=require('node:path');

const project=path.join(__dirname,'..'),source=path.join(project,'src'),dist=path.join(project,'dist');
const read=name=>fs.readFileSync(path.join(source,name),'utf8');
const safeScript=value=>value.replace(/<\/script/gi,'<\\/script');
const engine=read('engine.js'),content=read('content.js'),app=read('app.js'),css=read('styles.css');

for(const [name,code] of [['engine.js',engine],['content.js',content],['app.js',app]]){
  try{new Function(code);}catch(error){throw new Error(`${name}: ${error.message}`);}
}

const html=read('index.html')
  .replace(/\s*<link rel="stylesheet" href="styles\.css">/,'\n  <style>'+css+'</style>')
  .replace(/\s*<script src="engine\.js"><\/script>/,'\n  <script>'+safeScript(engine)+'</script>')
  .replace(/\s*<script src="content\.js"><\/script>/,'\n  <script>'+safeScript(content)+'</script>')
  .replace(/\s*<script src="app\.js"><\/script>/,'\n  <script>'+safeScript(app)+'</script>');

if(/<script\s+src=|<link\s+rel="stylesheet"/i.test(html)) throw new Error('Build still contains external source references.');
if(Buffer.byteLength(html)>256*1024) throw new Error('Standalone HTML exceeds 256 KiB.');
fs.mkdirSync(dist,{recursive:true});fs.writeFileSync(path.join(dist,'index.html'),html,'utf8');
console.log(`istrazivaci-naseg-svijeta/dist/index.html: ${Buffer.byteLength(html)} bytes`);
