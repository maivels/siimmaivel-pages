# Siim Maivel

A static personal website in Estonian and English. This repository contains both the editable source and the live GitHub Pages site. Edit the HTML files directly in `siimmaivel-pages`; no build or separate deployment repository is needed.

## Files

- `index.html`: introduction and content links, grouped by section.
- `podcast/`: episode pages and their images.
- `podcast.html`: recorded conversations overview and listening-platform links.
- `articles/`: article pages and any accompanying images; create this directory when adding the first article.
- `profile.jpg`: profile image used in social previews.
- `styles.css`: shared layout, typography, and light/dark colours.
- `site.js`: language and theme controls, with preferences saved in the browser.
- `serve.cjs`: optional local preview server.
- `tests/site.test.cjs`: checks for pages, navigation, players, and preference controls.
- `CNAME`: the custom domain, `siimmaivel.ee`.
- `.nojekyll`: tells GitHub Pages to serve the static files directly.
- `sitemap.xml` and `robots.txt`: search-engine discovery; add new published pages to the sitemap.

## Add an article

1. Create `articles/` if needed. Copy an existing content page from `podcast/` to a descriptive filename such as `articles/learning.html`. Keep its document structure, header controls, skip link, and shared `../styles.css` and `../site.js` references.

2. Update the page's `<head>`:
   - Set `<title>`, `og:title`, the description, and `og:description` to the article's title and summary. Update the Estonian content and both `data-et` and `data-en` attributes.
   - Set the canonical link and `og:url` to the article's full URL, such as `https://siimmaivel.ee/articles/learning.html`.
   - Set `og:image` to `https://siimmaivel.ee/profile.jpg`, or add an article image in `articles/images/` and use its full published URL.

3. Replace the entire `<main id="sisu">...</main>` with your article. Include its title, publication date, and both language versions. An article does not need an audio player, listening link, or recording-language notice. For example:

   ```html
   <main id="sisu">
     <p class="back-link">
       <a href="../index.html#kirjutised">
         <span lang="et" data-language="et">← Kõik kirjutised</span>
         <span lang="en" data-language="en">← All articles</span>
       </a>
     </p>
     <article>
       <h1 class="page-title">
         <span lang="et" data-language="et">Õppimisest</span>
         <span lang="en" data-language="en">On learning</span>
       </h1>
       <p class="page-meta">Siim Maivel · <time datetime="2026-09-13">2026-09-13</time></p>
       <div class="prose" lang="et" data-language="et">
         <p>Artikli eestikeelne tekst.</p>
       </div>
       <div class="prose" lang="en" data-language="en">
         <p>The article's English text.</p>
       </div>
     </article>
   </main>
   ```

4. Add a link to `index.html`. For the first article, add this section inside `<main>`; for later articles, add a new `<li>` at the top of its list:

   ```html
   <section aria-labelledby="kirjutised">
     <h2 id="kirjutised">
       <span lang="et" data-language="et">Kirjutised</span>
       <span lang="en" data-language="en">Articles</span>
     </h2>
     <ul class="link-list">
       <li>
         <a href="articles/learning.html">
           <span lang="et" data-language="et">Õppimisest</span>
           <span lang="en" data-language="en">On learning</span>
         </a>
       </li>
     </ul>
   </section>
   ```

5. Preview the homepage and new article. Check both languages, both themes, the publication date, and the links. Run the checks below. Restart the preview server after adding new files so it discovers them.

Use lowercase filenames with hyphens, and keep a page's filename stable once published. Links from an article to shared files or the homepage start with `../`; links to images in `articles/images/` start with `images/`.

## Edit content and translations

Estonian is the default language. Each content block has matching `lang` and `data-language` attributes. Short metadata translations use `data-et` and `data-en`. Keep both versions up to date when editing.

Use `page-title` for an article title, `page-meta` for its author and date, and `prose` for its body. Use ordinary HTML paragraphs, headings, lists, quotes, and links inside the body.

To add a recorded conversation, copy a page in `podcast/`, update its content and metadata, and add its link to both `index.html` and `podcast.html`.

Find the matching episode in the [public podcast RSS feed](https://anchor.fm/s/ddc69b9c/podcast/rss). Copy the URL from its `<enclosure url="...">` into the audio player's `<source src="...">`. Use the enclosure's media type in the `type` attribute, and update the displayed duration from `<itunes:duration>`. Check the episode title so that the page uses the correct recording.

Update the Spotify, Apple Podcasts, Castbox, and Pocket Casts links beneath the player to point to the matching episode on each platform. Keep the RSS link pointing to the show feed.

Keep the `<audio>` element's `controls`, `preload="metadata"`, `podcast-player` class, and `aria-labelledby="player-label"`. The matching `player-label` contains both language versions. This player streams the full public recording on the page with play/pause, seeking, and volume controls; no Spotify account is required. The preload="metadata" hint asks the browser to load only audio metadata before playback. Verify playback and seeking after changing the audio URL.

## Preview and check

Open `index.html` directly, or run:

```sh
node serve.cjs
```

Visit <http://127.0.0.1:4173>. To use another port, run `node serve.cjs 4174`. The server includes pages and images inside `podcast/` and `articles/`.

Run automated checks with:

```sh
node --test tests/site.test.cjs
```

The checks discover article pages automatically. Verify layout and audio playback in a browser as well.

## Edit and publish

Work in this repository: edit, preview, test, commit, and push. GitHub Pages publishes the root of the master branch at https://siimmaivel.ee/.

1. Edit the HTML content and both language versions. Add new pages to the homepage and sitemap.xml.
2. Run node serve.cjs and preview both languages and themes locally.
3. Run node --test tests/site.test.cjs.
4. Review and publish:

```sh
git diff
git status
git add -A
git diff --cached --check
git diff --cached --stat
git commit -m "Update website"
git push origin master
```

Check the deployment in the repository's Actions tab, then verify the live site. Pushing to master updates the public website.

The CSS and JavaScript references include a ?v=... cache version. When changing either shared asset, update its version in every HTML page before publishing. Keep these versioned references when copying a page to add content.

Preserve CNAME and .nojekyll. GitHub Pages settings should remain Deploy from a branch, master, /(root), with the custom domain siimmaivel.ee. The preview server and tests run locally only; GitHub Pages serves files statically. Files committed to this publishing root may be publicly downloadable, so keep credentials and local-only files out of the repository.
