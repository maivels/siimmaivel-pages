const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const episodes = fs.readdirSync(path.join(root, 'podcast')).filter(file => file.endsWith('.html'));
function articlePages(directory = 'articles') {
  if (!fs.existsSync(path.join(root, directory))) return [];
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = directory + '/' + entry.name;
    if (entry.isDirectory()) return articlePages(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}
const pages = ['index.html', 'podcast.html', ...episodes.map(file => 'podcast/' + file), ...articlePages()];
const decode = value => value.replaceAll('&quot;', '"').replaceAll('&amp;', '&');
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));

test('all pages have valid local navigation and matching language blocks', () => {
  assert(episodes.length > 0);
  for (const file of pages) {
    const html = read(file);
    assert.match(html, /<html lang="et">/, file);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size, file);
    for (const id of ['sisu', 'language-toggle', 'theme-toggle']) assert(ids.includes(id), file + ': ' + id);
    for (const [, label] of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
      for (const id of label.split(' ')) assert(ids.includes(id), file + ': ' + id);
    }
    const languageCounts = lang => (html.match(new RegExp(`data-language="${lang}"`, 'g')) || []).length;
    assert(languageCounts('et') > 0, file);
    assert.equal(languageCounts('et'), languageCounts('en'), file);
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^https?:/.test(href)) continue;
      const [urlPath, hash] = href.split('#');
      const pathname = urlPath.split('?')[0];
      const target = pathname ? path.resolve(path.dirname(path.join(root, file)), decodeURIComponent(pathname)) : path.join(root, file);
      assert(fs.existsSync(target), file + ': ' + href);
      if (hash) assert(fs.readFileSync(target, 'utf8').includes(`id="${hash}"`), file + ': ' + href);
    }
    for (const [, url] of html.matchAll(/property="og:image" content="https:\/\/siimmaivel.ee\/([^"]+)"/g)) {
      assert(fs.existsSync(path.join(root, url)), file + ': ' + url);
    }
    // Check that opening and closing HTML tags match.
    const stack = [];
    const voids = new Set(['meta', 'link', 'img', 'br', 'hr', 'input', 'source']);
    for (const [tag, closing, name] of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b[^>]*>/g)) {
      if (closing) assert.equal(stack.pop(), name, file + ': ' + tag);
      else if (!voids.has(name)) stack.push(name);
    }
    assert.equal(stack.length, 0, file);
  }
});

test('homepage links directly to every episode in descending order and contains no contact or CV sections', () => {
  const html = read('index.html');
  const links = [...html.matchAll(/href="podcast\/([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual([...links].sort(), [...episodes].sort());
  const numbers = links.map(file => parseInt(file, 10));
  assert.deepEqual(numbers, [...numbers].sort((a, b) => b - a));
  assert.doesNotMatch(html, /linkedin\.com|twitter\.com|mailto:|id="kontakt"|Töökogemus|Haridus/);
});

test('each episode plays a full audio file directly, with native controls and translated references', () => {
  const sources = new Set();
  for (const file of episodes) {
    const html = read('podcast/' + file);
    assert.equal((html.match(/<audio\b/g) || []).length, 1, file);
    assert.doesNotMatch(html, /<iframe|open\.spotify\.com\/embed\//, file);
    const audio = html.match(/<audio\b[^>]*>/)[0];
    assert.match(audio, /\bcontrols\b/, file);
    assert.doesNotMatch(audio, /\bautoplay\b|\bmuted\b/, file);
    const player = attributes(audio);
    assert.equal(player.preload, 'metadata', file);
    assert.equal(player['aria-labelledby'], 'player-label', file);
    const body = html.match(/<audio\b[^>]*>([\s\S]*?)<\/audio>/)[1];
    const source = attributes(body.match(/<source\b[^>]*>/)[0]);
    assert.match(source.src, /^https:\/\/.+\.mp3(?:\?.*)?$/, file);
    assert.equal(source.type, 'audio/mpeg', file);
    const platforms = html.match(/<p class="listen-link">([^\n]+)<\/p>/)[1];
    assert.match(platforms, /https:\/\/open\.spotify\.com\/episode\//, file);
    assert.match(platforms, /https:\/\/podcasts\.apple\.com\/[^\"]+\?i=\d+/, file);
    assert.match(platforms, /https:\/\/castbox\.fm\/episode\//, file);
    assert.match(platforms, /https:\/\/pocketcasts\.com\/podcast\//, file);
    assert.match(platforms, />RSS<\/a>/, file);
    assert.doesNotMatch(platforms, /Open audio file|Ava helifail/, file);
    assert.match(html, /Listen to the full episode/, file);
    sources.add(source.src);
    assert.match(html, /<time datetime="\d{4}-\d\d-\d\d">/, file);
    assert.match(html, /Recorded in Estonian/, file);
    const bodies = ['et', 'en'].map(lang => html.match(new RegExp(`<div class="prose" lang="${lang}" data-language="${lang}">([\\s\\S]*?)<\\/div>`))[1]);
    const links = body => [...body.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(links(bodies[0]), links(bodies[1]), file);
    assert.equal((bodies[0].match(/<p>/g) || []).length, (bodies[1].match(/<p>/g) || []).length, file);
  }
  assert.equal(sources.size, episodes.length, 'Every episode must use its own recording');
  const playerStyle = read('styles.css').match(/\.podcast-player\s*\{([^}]+)\}/)[1];
  assert.match(playerStyle, /width:\s*100%;/);
});

// A small DOM adapter exercises the actual script against each page's elements.
function openPage(file, { storage = new Map(), systemDark = false, blockedStorage = false } = {}) {
  const listeners = {};
  let systemListener;
  const elements = [...read(file).matchAll(/<([a-z][a-z0-9-]*)\b[^>]*>/g)].map(([tag, name]) => {
    const attrs = attributes(tag);
    return {
      tagName: name.toUpperCase(), attrs, hidden: /\bhidden\b/.test(tag), textContent: '',
      dataset: Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5), value])),
      setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener(event, listener) { this[event] = listener; }
    };
  });
  const document = {
    documentElement: { lang: 'et', dataset: {} },
    getElementById: id => elements.find(element => element.attrs.id === id),
    querySelector: selector => elements.find(element => element.attrs.class === selector.slice(1)),
    querySelectorAll: () => elements.filter(element => element.dataset.et && element.dataset.en),
    addEventListener: (event, listener) => { listeners[event] = listener; }
  };
  const localStorage = {
    getItem(key) { if (blockedStorage) throw new Error('Storage unavailable'); return storage.get(key) ?? null; },
    setItem(key, value) { if (blockedStorage) throw new Error('Storage unavailable'); storage.set(key, value); }
  };
  vm.runInNewContext(read('site.js'), {
    document, localStorage,
    window: { matchMedia: () => ({ matches: systemDark, addEventListener: (_, listener) => { systemListener = listener; } }) }
  });
  // Preferences must be applied before DOMContentLoaded to avoid the wrong initial theme.
  const initialTheme = document.documentElement.dataset.theme;
  listeners.DOMContentLoaded();
  return { document, elements, initialTheme, systemChange: matches => systemListener({ matches }), language: document.getElementById('language-toggle'), theme: document.getElementById('theme-toggle') };
}

test('language and explicit theme choices persist across homepage and episode navigation', () => {
  const storage = new Map();
  const home = openPage('index.html', { storage });
  assert.equal(home.document.documentElement.lang, 'et');
  assert.equal(home.initialTheme, 'light');
  assert.equal(home.document.querySelector('.site-controls').hidden, false);
  home.language.click();
  home.theme.click();
  for (const file of pages) {
    const page = openPage(file, { storage });
    assert.equal(page.document.documentElement.lang, 'en', file);
    assert.equal(page.initialTheme, 'dark', file);
    assert.equal(page.language.textContent, 'ET', file);
    assert.equal(page.theme.attrs['aria-label'], 'Switch to light mode', file);
    for (const element of page.elements.filter(element => element.dataset.en)) {
      const translated = element.tagName === 'META' ? element.content : element.textContent;
      assert.equal(translated, element.dataset.en, file);
    }
    page.systemChange(false);
    assert.equal(page.document.documentElement.dataset.theme, 'dark', file);
  }
  home.language.click();
  home.theme.click();
  const returned = openPage('index.html', { storage, systemDark: true });
  assert.equal(returned.document.documentElement.lang, 'et');
  assert.equal(returned.initialTheme, 'light');
});

test('device theme changes apply until overridden, and blocked or invalid storage does not break controls', () => {
  const page = openPage('index.html', { systemDark: true });
  assert.equal(page.initialTheme, 'dark');
  page.systemChange(false);
  assert.equal(page.document.documentElement.dataset.theme, 'light');
  const blocked = openPage('index.html', { blockedStorage: true });
  blocked.language.click();
  blocked.theme.click();
  assert.equal(blocked.document.documentElement.lang, 'en');
  assert.equal(blocked.document.documentElement.dataset.theme, 'dark');
  const invalid = openPage('index.html', { storage: new Map([['siim.language', 'xx'], ['siim.theme', 'invalid']]), systemDark: true });
  assert.equal(invalid.document.documentElement.lang, 'et');
  assert.equal(invalid.initialTheme, 'dark');
});
