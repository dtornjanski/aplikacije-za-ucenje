import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'page-apps');
fs.mkdirSync(outDir, { recursive: true });

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function write(name, value) {
  fs.writeFileSync(path.join(outDir, name), value, 'utf8');
}

function standalone(title, fragment) {
  return `<!doctype html>\n<html lang="hr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="color-scheme" content="light">\n<meta name="theme-color" content="#4b3299">\n<title>${title}</title>\n</head>\n<body>\n${fragment}\n</body>\n</html>`;
}

// Matematička pustolovina: reuse the tested engine and interface, while
// replacing local image/font dependencies with compact, sandbox-safe emoji.
let mathCss = read('math-site/dist/styles.css')
  .replace(/@font-face\{[^}]+\}/g, '')
  .replace(/font-family:Nunito/g, 'font-family:ui-rounded,"Trebuchet MS",Arial,sans-serif');

mathCss += `
#math-page-root .mascot-emoji{display:inline-grid;place-items:center;font-size:clamp(64px,10vw,132px);line-height:1;filter:drop-shadow(0 10px 16px #3a275733)}
#math-page-root .brand .mascot-emoji{font-size:38px;filter:none}
#math-page-root .level-emoji{font-size:64px;line-height:1;margin:2px 0 14px}
#math-page-root .topic-icon{font-size:36px;line-height:1}
#math-page-root .story-art-emoji{float:right;font-size:54px;margin:-4px 0 10px 18px}
@media(max-width:620px){#math-page-root .level-emoji{font-size:45px;grid-row:1/3;margin:0}#math-page-root .mascot-emoji{font-size:92px}}
`;

let mathApp = read('math-site/dist/app.js')
  .replace("const icons = ['number-circle-three', 'scales', 'plus-minus', 'question', 'book-open', 'list-numbers'];", "const icons = ['🔢','⚖️','➕','❓','📖','🏁'];")
  .replace("const owl = (className = '', extra = '') => `<img class=\"${className}\" src=\"assets/owl.png\" alt=\"\" width=\"160\" height=\"160\" ${extra}>`;", "const owl = (className = '', extra = '') => `<span class=\"mascot-emoji ${className}\" aria-hidden=\"true\" ${extra}>🦉</span>`;")
  .replace('<img src="assets/${l.image}.png" alt="" width="120" height="120">', '<span class="level-emoji" aria-hidden="true">${l.id === \'easy\' ? \'🌱\' : l.id === \'medium\' ? \'🧩\' : \'🚀\'}</span>')
  .replace('<img src="assets/${icons[i]}.svg" alt="" width="62" height="62">', '${icons[i]}')
  .replace("'<img class=\"story-art\" src=\"assets/book-open.svg\" alt=\"\" width=\"100\" height=\"100\">'", "'<span class=\"story-art-emoji\" aria-hidden=\"true\">📖</span>'");

const mathBody = `
<div id="math-page-root" lang="hr">
  <a class="skip-link" href="#main">Preskoči na zadatak</a>
  <div id="app" class="app-shell">
    <header class="app-header">
      <a class="brand" href="#" data-action="home" aria-label="Matematička pustolovina – početna"><span class="mascot-emoji" aria-hidden="true">🦉</span><span>Matematička pustolovina</span></a>
      <span class="grade">2. razred</span>
    </header>
    <main id="main" tabindex="-1"></main>
    <footer class="app-footer">Vježbaj svojim tempom.</footer>
  </div>
</div>`;

const mathFragment = `<style>${mathCss}</style>\n${mathBody}\n<script>${read('math-site/dist/engine.js')}</script>\n<script>${mathApp}</script>`;
new Function(read('math-site/dist/engine.js'));
new Function(mathApp);
write('matematicka-pustolovina.html', mathFragment);

// Mislim i otkrivam: remove the large embedded owl bitmap, keep the full
// question bank and grading logic, and avoid host-history navigation.
const thinkFull = read('mislim-i-otkrivam/index.html');
const thinkStyle = thinkFull.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
let thinkBody = thinkFull.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
thinkBody = thinkBody
  .replace(/data:image\/png;base64,[^\"]+/g, 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=')
  .replace(/<script>[\s\S]*?<\/script>/g, '');

const thinkScripts = [...thinkFull.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let thinkApp = thinkScripts[2] || '';
thinkApp = thinkApp
  .replace("function navigate(next){view=next;const hash={home:'#pocetna',areas:'#podrucja',play:'#vjezba'}[view];if(location.hash!==hash)history.pushState({view},'',hash);render();}", "function navigate(next){view=next;render();}")
  .replace("  window.addEventListener('popstate',()=>{view=location.hash==='#podrucja'?'areas':location.hash==='#vjezba'&&round?'play':'home';if(view==='play')level=round.level;render();});\n", '');

for (const source of [thinkScripts[0] || '', thinkScripts[1] || '', thinkApp]) new Function(source);

const thinkExtraCss = `
#think-page-root .brand img,#think-page-root .hero-art img,#think-page-root .feedback-hero img,#think-page-root .results-hero img{display:none}
#think-page-root .brand::before{content:'🦉';font-size:38px;line-height:1}
#think-page-root .hero-art::after{content:'🦉';position:relative;font-size:150px;line-height:1;filter:drop-shadow(0 10px 18px #3a275733)}
#think-page-root .feedback-hero::after{content:'🦉';position:absolute;right:20px;bottom:10px;font-size:64px;opacity:.22}
#think-page-root .results-hero::after{content:'🦉';font-size:120px;line-height:1}
@media(max-width:620px){#think-page-root .hero-art::after{font-size:90px}#think-page-root .brand::before{font-size:31px}#think-page-root .results-hero::after{font-size:90px}}
`;

const thinkFragment = `<div id="think-page-root" lang="hr"><style>${thinkStyle}${thinkExtraCss}</style>${thinkBody}<script>${thinkScripts[0] || ''}</script><script>${thinkScripts[1] || ''}</script><script>${thinkApp}</script></div>`;
write('mislim-i-otkrivam.html', thinkFragment);

const infoFull = read('informaticka-pustolovina/dist/index.html');
write('informaticka-pustolovina.html', infoFull);

const worldFull = read('istrazivaci-naseg-svijeta/dist/index.html');
write('istrazivaci-naseg-svijeta.html', worldFull);

for (const name of ['matematicka-pustolovina.html', 'mislim-i-otkrivam.html', 'informaticka-pustolovina.html', 'istrazivaci-naseg-svijeta.html']) {
  const file = path.join(outDir, name);
  const bytes = fs.statSync(file).size;
  if (bytes > 256 * 1024) throw new Error(`${name} exceeds the Page visualization limit: ${bytes} bytes`);
  console.log(`${name}: ${bytes} bytes`);
}

const publicDir = path.join(root, 'javne-aplikacije');
fs.mkdirSync(path.join(publicDir, 'matematicka-pustolovina'), { recursive: true });
fs.mkdirSync(path.join(publicDir, 'mislim-i-otkrivam'), { recursive: true });
fs.mkdirSync(path.join(publicDir, 'informaticka-pustolovina'), { recursive: true });
fs.mkdirSync(path.join(publicDir, 'istrazivaci-naseg-svijeta'), { recursive: true });
fs.writeFileSync(path.join(publicDir, 'matematicka-pustolovina', 'index.html'), standalone('Matematička pustolovina', mathFragment));
fs.writeFileSync(path.join(publicDir, 'mislim-i-otkrivam', 'index.html'), standalone('Mislim i otkrivam', thinkFragment));
fs.writeFileSync(path.join(publicDir, 'informaticka-pustolovina', 'index.html'), infoFull);
fs.writeFileSync(path.join(publicDir, 'istrazivaci-naseg-svijeta', 'index.html'), worldFull);
fs.writeFileSync(path.join(publicDir, 'index.html'), `<!doctype html>
<html lang="hr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Aplikacije za učenje</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f7f5fc;color:#17213b;font-family:ui-rounded,"Trebuchet MS",Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.wrap{width:min(1000px,100%)}h1{font-size:clamp(34px,6vw,62px);line-height:1.05;margin:0 0 14px}p{font-size:20px;line-height:1.55;color:#3c4962;margin:0 0 28px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.card{display:flex;flex-direction:column;align-items:flex-start;background:#fff;border:2px solid #d9d0ed;border-radius:24px;padding:26px;text-decoration:none;color:inherit;box-shadow:0 10px 30px #281f4d12;min-height:230px;transition:.18s ease}.card:hover,.card:focus-visible{border-color:#4b3299;transform:translateY(-2px);outline:3px solid #8a4300;outline-offset:3px}.emoji{font-size:54px}.card strong{font-size:26px;margin:14px 0 8px}.card span:last-child{font-size:17px;color:#3c4962}@media(max-width:700px){.grid{grid-template-columns:1fr}.card{min-height:0}}</style></head>
<body><main class="wrap"><h1>Aplikacije za učenje</h1><p>Odaberi aplikaciju i kreni vježbati.</p><div class="grid"><a class="card" href="matematicka-pustolovina/index.html"><span class="emoji">🧮</span><strong>Matematička pustolovina</strong><span>Tri razine matematičkih zadataka za drugi razred.</span></a><a class="card" href="mislim-i-otkrivam/index.html"><span class="emoji">🦉</span><strong>Mislim i otkrivam</strong><span>Vježbe zaključivanja, provjeravanja i objašnjavanja.</span></a><a class="card" href="informaticka-pustolovina/index.html"><span class="emoji">🤖</span><strong>Informatička pustolovina</strong><span>Osam svjetova informatike, tri razine i interaktivni zadaci.</span></a><a class="card" href="istrazivaci-naseg-svijeta/index.html"><span class="emoji">✨</span><strong>Istraživači našeg svijeta</strong><span>Jedanaest svjetova Prirode i društva kroz cijelu školsku godinu.</span></a></div></main></body></html>`);
