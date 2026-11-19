import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CrmProvider } from './context/CrmContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { CustomerOnboarding } from './pages/CustomerOnboarding';
import { KycManagement } from './pages/KycManagement';
import { FinancialAccounts } from './pages/FinancialAccounts';
import { Transactions } from './pages/Transactions';

export const App: React.FC = () => {
  return (
    <CrmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:customerId" element={<CustomerDetails />} />
            <Route path="onboarding" element={<CustomerOnboarding />} />
            <Route path="kyc" element={<KycManagement />} />
            <Route path="accounts" element={<FinancialAccounts />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CrmProvider>
  );
};

export default App;
