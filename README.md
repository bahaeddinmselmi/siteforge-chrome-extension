# SiteForge: Website to Next.js & WordPress Exporter

> A powerful **Chrome Extension** that clones any live website into a production-ready **Next.js 14** application or **WordPress Theme** instantly.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)](https://developer.chrome.com/docs/extensions/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![WordPress](https://img.shields.io/badge/WordPress-Theme-21759b)](https://wordpress.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Overview

**SiteForge** transforms your browser into a no-code migration tool. It captures the visual state, styling, and assets of any web page and deterministically reconstructs it as a modern code base.

Unlike AI generators that hallucinate layouts, SiteForge performs an **exact pixel-to-code extraction**, ensuring fidelity.

### 🚀 Key Capabilities
*   **Clone to Next.js**: Exports a full `npm run dev` ready project using Tailwind CSS and the App Router.
*   **Clone to WordPress**: Generates a classic PHP theme with `theme.json` support.
*   **No API Keys**: Runs entirely client-side. No OpenAI key or cloud service required.
*   **Asset Handling**: Automatically downloads and links images, fonts, and CSS.

## 🛠 Installation (Unpacked)

1.  Clone this repository:
    ```bash
    git clone https://github.com/bahaeddinmselmi/siteforge-chrome-extension.git
    ```
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer Mode** (top right corner).
4.  Click **Load Unpacked** and select the `extension` folder from this repo.

## 🕹 Usage

1.  Navigate to any website you want to clone (e.g., a landing page).
2.  Click the **SiteForge** icon in your toolbar.
3.  Choose your export format:
    *   **Export Next.js**: Downloads a `.zip` containing a React/Next.js app.
    *   **Export WordPress**: Downloads a `.zip` containing a PHP theme.
    *   **Scrape Preview**: View the raw JSON data of readability and structure.

## 📦 Export formats

### Next.js 14 Export
The generated project uses the **App Router** structure:
*   `app/page.jsx`: The cloned page content.
*   `public/legacy.css`: The extracted vanilla CSS (guaranteeing exact look).
*   `tailwind.config.js`: Pre-configured for standard styling.
*   **Run it**: Unzip -> `npm install` -> `npm run dev`.

### WordPress Theme Export
The generated theme is compatible with standard WP installations:
*   `front-page.php`: The cloned static layout.
*   `header.php` / `footer.php`: Split layout sections.
*   `style.css`: Metadata and base styles.
*   **Install it**: Upload ZIP to WordPress -> Appearance -> Themes -> Activate.

## 🤝 Roadmap
*   [ ] Multi-page scraping (Experimental feature included)
*   [ ] React Component isolation
*   [ ] Figma export

## 📄 License
MIT
