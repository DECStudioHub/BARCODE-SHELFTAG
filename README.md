# Inventory Shelf Tag System

A fast, responsive web application for generating professional physical inventory count sheets and barcode shelf tags directly from Excel (`.xlsx`, `.xls`) or `.csv` files.

---

## ✨ Features

- **Excel & CSV Import**: Drop in any inventory spreadsheet; automatically maps standard columns (SKU, Description, UPC/Barcode, Location, Quantity, UOM).
- **Interactive Data Validation & Cleaning**: Real-time identification of missing required fields, duplicates, or format warnings with bulk inline editing and selection toggles.
- **Customizable Shelf Tag Layouts**:
  - Paper formats: Letter, Legal, A4
  - Grid dimensions: 2×4 (8 tags), 2×5 (10 tags), 3×6, or single custom tags
  - Font sizing, barcode symbology (Code 128, EAN/UPC), locator badge toggles, and count box styling
- **Direct 1-Click Printing**:
  - Native browser print with automatic iframe-sandbox bypass
  - Millimeter-accurate vector PDF rendering (`jsPDF`)
  - Auto-print triggering for quick hardware dispatch
- **Privacy & Security**: All processing occurs 100% client-side in the browser—no inventory data is sent to external servers.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [Git](https://git-scm.com/) installed on your machine

### 1. Clone or Download

```bash
git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
cd <YOUR-REPO-NAME>
```

*(Or extract the downloaded ZIP file into a folder and navigate to it in your terminal).*

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

### 4. Build for Production

To create an optimized production build:

```bash
npm run build
```

The compiled static assets will be created in the `dist/` directory.

---

## 📦 How to Publish to GitHub

### Method A: Direct Export from AI Studio (Easiest)

1. In the top-right or settings menu of AI Studio, look for **Export to GitHub** or **Download as ZIP**.
2. If using **Export to GitHub**, authorize your GitHub account and select or create a new repository.
3. If using **Download as ZIP**, extract the folder on your computer and follow **Method B** below.

### Method B: Publishing via Git Command Line

1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g. `inventory-shelf-tag-system`).
   - Do **not** initialize with a README, .gitignore, or license (these already exist in the project).
2. Open your terminal in this project's folder and run:

```bash
# 1. Initialize git repository (if not already initialized)
git init

# 2. Add all project files
git add .

# 3. Commit your changes
git commit -m "Initial commit: Inventory Shelf Tag System"

# 4. Set the default branch to main
git branch -M main

# 5. Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/inventory-shelf-tag-system.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 🌐 Free Deployment Options

Once published on GitHub, you can host this app for free in under a minute:

### Option 1: Vercel / Netlify
1. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com).
2. Sign in with GitHub and select your repository.
3. Keep default settings (Build Command: `npm run build`, Output Directory: `dist`).
4. Click **Deploy**.

### Option 2: GitHub Pages
1. In your GitHub repository, go to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Use the standard static Vite deployment workflow to deploy automatically on every push.

---

## 🛠️ Built With

- **React 19** + **TypeScript**
- **Vite** (High-speed build tool)
- **Tailwind CSS v4**
- **SheetJS (`xlsx`)** for client-side Excel parsing
- **JsBarcode** + **jsPDF** for barcode creation & vector PDF printing
- **Lucide Icons**
