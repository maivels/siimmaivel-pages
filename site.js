// Apply preferences before the page is painted. Content stays readable without JS.
(() => {
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const read = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Preferences still work for this page. */ }
  };
  let preferredTheme = read('siim.theme');
  if (!['light', 'dark'].includes(preferredTheme)) preferredTheme = null;
  root.dataset.theme = preferredTheme || (systemTheme.matches ? 'dark' : 'light');
  root.lang = read('siim.language') === 'en' ? 'en' : 'et';

  document.addEventListener('DOMContentLoaded', () => {
    const languageButton = document.getElementById('language-toggle');
    const themeButton = document.getElementById('theme-toggle');

    function updateLabels() {
      const english = root.lang === 'en';
      const dark = root.dataset.theme === 'dark';
      languageButton.textContent = english ? 'ET' : 'EN';
      languageButton.lang = english ? 'et' : 'en';
      languageButton.setAttribute('aria-label', english ? 'Lülita eesti keelele' : 'Switch to English');
      themeButton.textContent = english ? (dark ? 'light' : 'dark') : (dark ? 'hele' : 'tume');
      themeButton.setAttribute('aria-label', english
        ? (dark ? 'Switch to light mode' : 'Switch to dark mode')
        : (dark ? 'Lülita heledale režiimile' : 'Lülita tumedale režiimile'));
      document.querySelectorAll('[data-et][data-en]').forEach((element) => {
        const value = element.dataset[root.lang];
        if (element.tagName === 'META') element.content = value;
        else element.textContent = value;
      });
    }

    languageButton.addEventListener('click', () => {
      root.lang = root.lang === 'et' ? 'en' : 'et';
      save('siim.language', root.lang);
      updateLabels();
    });
    themeButton.addEventListener('click', () => {
      preferredTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = preferredTheme;
      save('siim.theme', preferredTheme);
      updateLabels();
    });
    systemTheme.addEventListener('change', (event) => {
      if (preferredTheme) return;
      root.dataset.theme = event.matches ? 'dark' : 'light';
      updateLabels();
    });
    updateLabels();
    document.querySelector('.site-controls').hidden = false;
  });
})();
