const fs=require('node:fs');
const path=require('node:path');
const project=path.join(__dirname,'..'),source=path.join(project,'src'),dist=path.join(project,'dist');
const read=name=>fs.readFileSync(path.join(source,name),'utf8');
const html=read('index.html')
  .replace('<link rel="stylesheet" href="styles.css">',()=>'<style>'+read('styles.css')+'</style>')
  .replace(/<script src="([a-z]+\.js)"><\/script>/g,(_,name)=>{
    const code=read(name);
    try{new Function(code);}catch(error){throw new Error(name+': '+error.message);}
    return '<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>';
  });
if(/<script\s+src=|<link\s+rel="stylesheet"/i.test(html))throw new Error('Build still contains external source references.');
if(Buffer.byteLength(html)>256*1024)throw new Error('Standalone HTML exceeds 256 KiB.');
fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'index.html'),html,'utf8');
if(process.argv.includes('--portal')){
  const appName=path.basename(project);
  const root=path.dirname(project);
  for(const output of [path.join(root,'page-apps',appName+'.html'),path.join(root,'javne-aplikacije',appName,'index.html')]){
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,html,'utf8');
  }
}
console.log('istrazivaci-naseg-svijeta/dist/index.html: '+Buffer.byteLength(html)+' bytes');
