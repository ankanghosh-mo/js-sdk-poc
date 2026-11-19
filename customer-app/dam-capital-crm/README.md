# DAM Capital – Customer Management Portal (POC)

A lightweight, standalone React + TypeScript enterprise financial CRM application built with Vite and Tailwind CSS.

## Features
- **Executive Dashboard:** KPI cards (Total Customers, Active, Pending KYC, Verified, High-Risk, Total AUM), Recharts visualizations, and Recent Customers table.
- **Customer Directory:** Searchable, sortable, filterable, and paginated table with CSV export and full CRUD persisted in `localStorage`.
- **Synthetic Data Generator:** Switch between 100, 500, and 1,000 realistic synthetic Indian customer records from the sidebar footer.
- **Detailed Customer Profile:** 7 organized tabs covering Personal, Contact, KYC, Financial, Employment, and Account details.
- **Customer Onboarding:** Single-page sectioned registration form with PAN, Aadhaar, IFSC, email, and phone validation.
- **KYC Management, Financial Accounts, & Transactions:** Full compliance review queue, linked bank/PMS accounts, and transaction ledger.

## Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Production Build:**
   ```bash
   npm run build
   ```

## Docker / Docker Compose Execution

To build and run the production bundle via Nginx in Docker:

```bash
docker-compose up --build -d
```

Access the application at `http://localhost:3000`. To stop the container:

```bash
docker-compose down
```
