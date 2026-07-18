# FeeEase Kashmir — React Rebuild

A school fee-management system rebuilt from scratch using React, TypeScript, and Tailwind CSS. This project handles student records, parent assignments, fee structures, and transaction records for local schools in Kashmir.

---

## 🌟 The Core Objective

The original prototype of FeeEase was built using vanilla HTML, CSS, and TypeScript. While functional, it relied on **imperative DOM manipulation** (manual select updates, manual calculations, list cleaning, and element creation). 

This repository is a complete **declarative rebuild** using React to manage complex state transitions and component rendering dynamically.

---

## 🛠️ The Tech Stack

- **Framework**: React 19 (via Vite)
- **Language**: TypeScript (strict-mode type safety)
- **Styling**: Tailwind CSS (utility-first styling layout)
- **State Management**: React state hooks (`useState`)
- **Build System**: Vite

---

## 🏗️ Architectural Paradigm Shift

| Feature | Vanilla TypeScript (Imperative) | React Rebuild (Declarative) |
|---|---|---|
| **Data Sync** | Manual document queries and updates to `textContent` every time values shifted. | State variables automatically trigger UI updates when updated. |
| **List Generation** | Hand-writing `document.createElement("li")` and prepending it manually in a loop. | Transforming arrays into UI markup via array `.map()` with distinct tracking keys. |
| **Form Management** | Pulling `.value` references out of inputs on submission. | Controlled inputs tied to the local component state. |
| **Data Flow** | Functions reading and mutating global variables directly (high risk of side effects). | Data passed down via read-only **Props**; updates sent back using callback functions (Lifting State Up). |

---

## 📂 Project Structure

```
src/
├── components/          # Reusable UI Blocks (Header, Dashboards)
├── types.ts             # Global TypeScript structural typings
├── data.ts              # Static data arrays used as initial state
├── App.tsx              # Main entry point & state holder
├── main.tsx             # React DOM injection point
└── index.css            # Tailwind directives
```

---

## 🚀 Running Locally

1. Clone the repository:
   ```bash
   git clone git@github.com:Ahtisham-1/fee-ease-react.git
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the local dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
