# 🌱 CarbonIQ — Build a Greener Web, One Site at a Time

<div align="center">
  <h3>Analyze the carbon footprint of any website using the Sustainable Web Design Model v4.</h3>
  <p>Measure real-time page weight, resource breakdown, server green hosting status, and discover actionable tips to reduce CO₂ emissions.</p>
</div>

---

## 🌍 The Mission

The internet accounts for roughly **3.7% of global greenhouse gas emissions**—more than the entire commercial aviation industry. Every time a user visits a webpage, data travels through data centers, telecom networks, and user devices, all consuming electricity.

**CarbonIQ** is an open-source digital sustainability analyzer engineered to make web emissions transparent and actionable. By analyzing real-world network payloads and hosting energy sources, CarbonIQ helps developers and website owners build a cleaner, faster, and more efficient internet.

---

## ✨ Key Features

- **🚀 Deep Network Scraper (`Puppeteer` + CDP):** Launches a headless Chromium instance that intercepts exact network payloads across 7 categories (*images, scripts, stylesheets, fonts, documents, media, other*) using the Chrome DevTools Protocol.
- **🧮 SWDM v4 Calculation Engine:** Implements the official **Sustainable Web Design Model v4** to precisely estimate energy intensity across data centers (`0.055 kWh/GB`), transmission networks (`0.059 kWh/GB`), and end-user devices (`0.080 kWh/GB`).
- **🌿 Green Web Foundation Verification:** Real-time API integration with the [Green Web Foundation](https://www.thegreenwebfoundation.org/) to verify if the server's data center runs on renewable green energy (*reduces operational data center emissions by up to 95%*).
- **📍 Server Geolocation & DNS Resolution:** Promisified DNS resolution with IPv4 OS fallback and `ip-api.com` lookup to identify hosting country, region, city, and ISP.
- **⚡ Render-Blocking Script & CSS Detection:** Automatically scans `<head>` tags to flag un-deferred scripts and stylesheets that slow down rendering.
- **💡 Smart Suggestion Engine:** Evaluates your specific resource weights (`image %`, `script count`, `font sizes`, `green hosting`) and generates prioritized, tailored reduction recommendations.
- **🏆 Global Leaderboard & Trend Tracking:** MongoDB persistence that ranks the **Top 10 Cleanest vs. Dirtiest** websites ever analyzed, complete with historical domain tracking.
- **⚡ Ultra-Lightweight Vanilla JS Frontend:** Built with **0% frontend frameworks** (No React/Vue/Vite overhead). Pure hand-crafted HTML5, CSS3, and ES6+ JavaScript—leading by example with a minimal carbon footprint.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Runtime** | **Node.js** | High-performance asynchronous JavaScript server runtime |
| **Web Framework** | **Express.js** | REST API routing, JSON middleware, static asset delivery |
| **Database & ORM** | **MongoDB + Mongoose** | NoSQL database for scan history, aggregations, and leaderboard ranking |
| **Web Scraper** | **Puppeteer** (`puppeteer-core` + `@sparticuz/chromium`) | Headless browser engine for deep network and DOM inspection |
| **Frontend** | **Vanilla HTML5, CSS3 & ES6+ JS** | Multi-page architecture with custom glassmorphism & `<canvas>` animations |
| **Serverless Deployment** | **Vercel Serverless Functions (`vercel.json`)** | Optimized Lambda packaging (`includeFiles`, edge CDN static delivery) |

---

## 🏗️ Architecture: Why Vanilla JS Instead of React?

CarbonIQ practices what it preaches. While most modern web applications rely on heavy frontend frameworks like React or Next.js—which require large `node_modules`, virtual DOM overhead, and bulky JavaScript bundles—CarbonIQ uses **pure Vanilla Web Technologies**:

| React / Framework Concept | CarbonIQ Vanilla JS Implementation |
| :--- | :--- |
| **Components** | Semantic HTML structures + reusable modular CSS utility classes (`.card`, `.btn`) |
| **State Management (`useState`)** | Plain JS variables, `dataset.*` attributes, and `localStorage` (dark/light theme) |
| **Effects (`useEffect`)** | Native DOM event listeners (`DOMContentLoaded`) and `IntersectionObserver` (scroll reveal) |
| **API Fetching** | Native `fetch()` API interacting directly with `/api/analyze` and `/api/leaderboard` |
| **3D / Animations** | Native `<canvas>` API (`requestAnimationFrame` rotating Earth globe) and CSS keyframes |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance running on `27017` or MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/coder561858/carboniq.git
cd Carbonfootprint_analyzer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/carboniq
```
*(Note: If `MONGODB_URI` is omitted, the app gracefully runs in memory-only mode and skips saving to the database).*

### 4. Start the Development Server
```bash
npm run dev
# or
node server.js
```

Visit **`http://localhost:3000`** in your browser to launch CarbonIQ! 🌱

---

## ☁️ Vercel Serverless Deployment

CarbonIQ is engineered out-of-the-box for **Vercel Serverless Functions**. Standard Puppeteer (~170MB) exceeds Vercel's 50MB Lambda limit and read-only `/var/task` restrictions. 

To solve this, `server.js` dynamically detects the environment (`process.env.VERCEL`):
- **Locally:** Uses standard `puppeteer` (`headless: 'new'`).
- **On Vercel:** Lazy-loads `puppeteer-core` with `@sparticuz/chromium` (a lightweight 45MB compressed serverless binary).

Our `vercel.json` ensures zero cold-start crashes (`FUNCTION_INVOCATION_FAILED`) and exact asset delivery:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["public/**"],
        "maxLambdaSize": "50mb",
        "memory": 1024,
        "maxDuration": 60
      }
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/server.js"
    }
  ]
}
```

---

## 📡 API Reference

### `POST /api/analyze`
Analyzes any website URL and returns full SWDM v4 carbon metrics, resource breakdowns, and tips.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response Example (Simplified):**
```json
{
  "success": true,
  "url": "https://example.com",
  "hostname": "example.com",
  "totalSizeMB": 1.45,
  "totalRequests": 34,
  "emissions": {
    "perPageView": {
      "total": 0.281,
      "dataCenters": 0.079,
      "networks": 0.085,
      "userDevices": 0.117
    },
    "grade": {
      "letter": "B",
      "color": "#60a5fa",
      "label": "Good"
    },
    "isGreenHosted": true
  },
  "server": {
    "ip": "93.184.216.34",
    "geo": { "country": "United States", "city": "Los Angeles", "isp": "Edgecast Inc." },
    "greenHosting": { "green": true, "hostedBy": "Edgecast Inc." }
  },
  "resources": {
    "images": { "count": 12, "size": 945100, "items": [...] },
    "scripts": { "count": 8, "size": 312000, "items": [...] }
  },
  "suggestions": [...]
}
```

---

### `GET /api/leaderboard`
Returns the **Top 10 Cleanest** and **Top 10 Dirtiest** websites aggregated by average `gCO₂` per page view.

### `GET /api/history?domain=example.com`
Returns chronological scan history (up to 100 entries) for a given domain to generate historical emission trends.

### `GET /api/recent`
Returns the 20 most recently analyzed websites across the globe.

---

## 🧮 Understanding the SWDM v4 Grading Scale

| Grade | CO₂ per Page View | Rating | Action Required |
| :---: | :---: | :--- | :--- |
| **A+** | `< 0.1g` | **Exceptional** | Benchmark of sustainable digital design. |
| **A** | `< 0.2g` | **Excellent** | Highly optimized payload and green hosting. |
| **B** | `< 0.5g` | **Good** | Better than the global web average (~0.5g). |
| **C** | `< 1.0g` | **Average** | Typical website; room for image and script compression. |
| **D** | `< 2.0g` | **Poor** | Heavy asset transfer; high priority for optimization. |
| **F** | `≥ 2.0g` | **Very Poor** | Excessive carbon footprint; immediate audit recommended. |

---

## 📄 License

This project is open-source and available under the **MIT License**.

<div align="center">
  <p>Made with 💚 to build a cleaner, faster, and more sustainable web.</p>
</div>
