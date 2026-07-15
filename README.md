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

| Layer | Technology |
| :--- | :--- | :--- |
| **Backend Runtime** | **Node.js** |
| **Web Framework** | **Express.js** |
| **Database & ORM** | **MongoDB + Mongoose** |
| **Web Scraper** | **Puppeteer** |
| **Frontend** | **Vanilla HTML5, CSS3 & ES6+ JS** |


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
MONGODB_URI=your_mongodb_connection_string
```

### 4. Start the Development Server
```bash
npm run dev
# or
node server.js
```

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


<div align="center">
  <p>Made with 💚 by Aadi.</p>
</div>
