# SiteForge Chrome Extension

SiteForge is a **client-side Chrome extension** that takes a live website and exports a
ready-to-run project **without using any AI**. It focuses on deterministic, "exact copy"
reconstruction of the visual layout.

Current export targets:

- **Next.js 14 + Tailwind** static app
- **WordPress theme** (PHP + theme.json)
- Experimental **multi-page** Next.js export

---

## Install the extension (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension` folder that contains `manifest.json`.

No API keys or external services are required.

---

## Popup UI & Actions

Click the **SiteForge** icon to open the popup. You will see these buttons:

1. **Scrape Preview**  
   Scrapes the current tab and shows a JSON/HTML preview of what will be exported.

2. **Scrape & Export (Next.js)**  
   - Scrapes the page HTML, CSS, and assets.  
   - Builds a **Next.js 14 + Tailwind** project.  
   - Downloads `siteforge-next-app.zip`.

3. **Export as WordPress Theme**  
   - Builds a classic WordPress theme from the same snapshot.  
   - Includes `theme.json`, `functions.php`, `style.css`, `front-page.php`, templates, and `legacy.css`.  
   - Downloads `siteforge-wp-theme.zip`.

4. **Scrape All Pages** (experimental)  
   - Crawls internal links and exports one Next.js route per discovered page.  
   - Adds a `PAGES.md` route guide and a route-aware sitemap.  
   - Downloads `siteforge-multipage.zip`.

5. **Deploy to Vercel**  
   - Opens `https://vercel.com/new` in a new tab.  
   - You can manually import the exported project ZIP or your Git repo.  
   - No Vercel API token is stored or used by the extension.

---

## What the Next.js export contains

The exported ZIP (`siteforge-next-app.zip`) is a complete Next.js 14 app with:

- `app/layout.jsx` – wraps the original page HTML and links the scraped CSS.
- `app/page.jsx` – minimal entry component (all real markup comes from `layout`).
- `app/globals.css` – Tailwind base/utilities.
- `public/legacy.css` – **all scraped CSS** (inline + external stylesheets).
- Downloaded assets (images/backgrounds) under `public/` with rewritten URLs.
- SEO helpers: `public/sitemap.xml`, `public/robots.txt`.
- `COMPONENTS.md` – detected layout patterns (header/footer/cards/etc.).
- Standard Next.js config files and a helpful project `README.md`.

When multi-page crawling is used, the ZIP also includes route files under `app/.../page.jsx` and a `PAGES.md` route map.

### Running the exported Next.js app

After unzipping:

```bash
cd siteforge-next-app
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## What the WordPress theme export contains

The WordPress ZIP (`siteforge-wp-theme.zip`) contains a full theme:

- `theme.json` – block-theme configuration.
- `style.css` – theme header + base styles, importing `legacy.css`.
- `functions.php` – registers menus, enqueues styles, adds theme supports.
- `front-page.php` – static front page rendering the scraped HTML.
- `index.php`, `single.php`, `page.php` – standard templates.
- `header.php`, `footer.php` – site chrome.
- `legacy.css` – scraped CSS from the original site.
- `README.md` – install and customization instructions.

### Installing the exported theme

1. In WordPress admin, go to **Appearance → Themes → Add New → Upload Theme**.
2. Upload the `siteforge-wp-theme.zip` file.
3. Click **Install**, then **Activate**.
4. Visit your site root (`/`) to see the cloned page as the front page.

---

## Development & tests (extension itself)

From the `extension` directory you can run the legacy test script:

```bash
chmod +x tests/run_tests.sh
./tests/run_tests.sh
```

This will:

- Parse `manifest.json` as JSON.
- Validate `tests/test_schema.json` with `src/schemaValidator.js`.
- Create a small ZIP using `src/zip.js`.

These tests only cover the extension internals, not the exported projects.
