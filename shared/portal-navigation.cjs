const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, 'portal-navigation.css'), 'utf8');
const portalLink = '<a class="portal-link" href="../index.html">Sve aplikacije</a>';

// The default link works on the published site and in the downloaded portal folder.
// Clean URLs and the development copies have a different directory depth.
function selectPortalPath(app) {
  const pathname = window.location.pathname;
  const web = ['http:', 'https:'].includes(window.location.protocol);
  const bundledFile = window.location.protocol === 'file:' && pathname.endsWith('/' + app + '/index.html');
  let href;
  if (pathname.endsWith('/' + app)) href = 'index.html';
  else if (pathname.endsWith('/' + app + '/dist/index.html')) href = '../../javne-aplikacije/index.html';
  else if (pathname.endsWith('/page-apps/' + app + '.html')) href = '../javne-aplikacije/index.html';
  else if (!web && !bundledFile) href = 'https://aplikacije-za-ucenje.onrender.com/';
  else if (/\/[^/]+\.html$/i.test(pathname) && !pathname.endsWith('/index.html')) href = 'index.html';
  if (href) {
    for (const link of document.querySelectorAll('a.portal-link')) link.setAttribute('href', href);
  }
}

function withPortalNavigation(html, app) {
  // A fresh checkout also uses the shipped math/logic HTML as a source. Replace
  // our generated assets when rebuilding it, so each copy has one current header.
  const header = /<header class="(app-header|site-header)(?: portal-header)?">([\s\S]*?)<\/header>/;
  if (!header.test(html)) throw new Error('Missing app header in ' + app);
  return html
    .replace(/\s*<link rel="stylesheet" href="\.\.\/\.\.\/shared\/portal-navigation\.css">/, '')
    .replace(/\n?<style id="portal-navigation">[\s\S]*?<\/style>/, '')
    .replace('</style>', () => '</style>\n<style id="portal-navigation">\n' + css + '</style>')
    .replace(header, (_, headerClass, contents) => {
      const withoutLink = contents.replace(/\s*<a class="portal-link"[^>]*>[^<]*<\/a>/, '').trimEnd();
      return `<header class="${headerClass} portal-header">${withoutLink}\n    ${portalLink}\n  </header>`;
    })
    .replace(/(<dialog id="new-round-dialog"[\s\S]*?)(<\/dialog>)/, (_, contents, close) => {
      if (contents.includes('class="portal-link"')) return contents + close;
      return contents.trimEnd() + '\n    <div class="portal-dialog-nav">' + portalLink + '</div>\n  ' + close;
    })
    .replace(/<script id="portal-navigation-path">[\s\S]*?<\/script>\n?/, '')
    .replace('<script>', () => `<script id="portal-navigation-path">(${selectPortalPath})(${JSON.stringify(app)});</script>\n<script>`);
}

module.exports = { withPortalNavigation };
