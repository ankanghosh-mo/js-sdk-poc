import { Routes, Route } from 'react-router-dom';
import Header from './Header.jsx';
import ScenariosPage from './pages/ScenariosPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import CustomerDetailPage from './pages/CustomerDetailPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import WidgetsPage from './pages/WidgetsPage.jsx';
import LegacyPage from './pages/LegacyPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<ScenariosPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/widgets" element={<WidgetsPage />} />
          <Route path="/legacy" element={<LegacyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}
