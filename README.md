# FeeEase Kashmir — React + TypeScript Rebuild

A school fee-management web application tailored for local schools in Kashmir, built using **React 19**, **TypeScript**, and **Vite**. 

---

## 🏔️ The Real-World Problem It Solves

In Kashmir, parents often have to take a day off work from busy schedules, travel to schools manually, and stand in long queues to pay monthly school fees because there is no simple digital portal. 

**FeeEase Kashmir** is designed as Kashmir's first fee-management web application. It enables parents to view fee breakdowns, monitor pending dues, and pay monthly fees in flexible installments directly from home—saving valuable time and avoiding manual administrative hassle.

---

## 🏗️ Architectural Core: "App is the Father" Pattern

This application follows a strict **declarative architecture** centered around the **Single Source of Truth** and **Lifting State Up** principles:

```
                            [ App.tsx ] 
                 (Master State & Data Controller)
  ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
  │               │                   │                   │               │
  ▼               ▼                   ▼                   ▼               ▼
[Header] [ParentStudentSelector] [FeeDetail]       [PayFeesForm]   [PaymentHistory]
 (Toggle)   (Pick Parent/Kid)  (View Summary)      (Type & Pay)     (View History)
```

1. **`App.tsx` (Central Controller):** Acts as the "father" component. It owns all core application states (`role`, `selectedParent`, `selectedStudent`, `payments`) and master data (`parents`, `students`, `feeObligations`).
2. **Read-Only Props Down:** Data flows strictly downward to child components via typed TypeScript `interface` props.
3. **Action Callbacks Up:** Child components communicate user actions back to `App.tsx` via callback functions prefixed with `on...` (e.g., `onSelectParent`, `onSubmitPayment`).

---

## 🧩 Component Architecture Breakdown (Parent View)

### 1. `Header.tsx`
- **Role:** Displays top application branding (`Fee Ease Kashmir`) and a temporary dev role toggle (`[Parent] | [Admin]`).
- **Types:** `type Role = 'parent' | 'admin'`, `interface HeaderProps`.

### 2. `ParentStudentSelector.tsx`
- **Role:** Dual controlled `<select>` dropdowns to select a parent and filter their linked children.
- **Key Feature:** Controlled inputs using `value` and `onChange`. Selecting a parent triggers `handleParentChange` in `App.tsx`, updating parent selection and automatically resetting student selection to that parent's first child.
- **Types:** `interface Parent`, `interface Student` (uses `gradeName` instead of JSX-reserved `className`), `interface ParentStudentSelectorProps`.

### 3. `FeeDetail.tsx`
- **Role:** Financial dashboard displaying `Total Fees`, `Total Paid`, `Net Balance`, and a month-by-month card breakdown.
- **Key Feature:** **Derived State** — computes totals dynamically using `.reduce()` and `.filter().reduce()` without redundant `useState` calls.
- **Types:** `type FeeStatus`, `type FeeType`, `interface FeeObligation`, `interface FeeDetailProps`.

### 4. `PayFeesForm.tsx`
- **Role:** Form element containing a number input and submit button to process fee payments.
- **Key Feature:** Manages local input state (`inputAmount`), uses `e.preventDefault()` on submission, and sends typed amounts to `App.tsx` via `onSubmitPayment(amount)`.
- **Types:** `interface Payment`, `interface PayFeesFormProps`.

### 5. `PaymentHistory.tsx` *(In Progress)*
- **Role:** Historical table/list rendering chronological logs of all completed payments for the selected student.

---

## 🛠️ Tech Stack & Key Concepts

- **Framework:** React 19 + Vite
- **Type System:** TypeScript (Strict Union Types, Props Interfaces)
- **Key Patterns:**
  - **Lifting State Up:** Centralized state in `App.tsx`.
  - **Derived State:** Computing values (`netBalance`, `filteredStudents`, `filteredFeeObligations`) on the fly during render.
  - **Controlled Components:** Tying form inputs to state with `value` + `onChange`.
  - **List Rendering with Keys:** Rendering dynamic lists via `.map()` with unique `key` props.

---

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:Ahtisham-1/fee-ease-react.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```

4. **Run TypeScript type check:**
   ```bash
   npx tsc --noEmit
   ```
