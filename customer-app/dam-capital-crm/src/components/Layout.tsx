import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Landmark,
  ArrowLeftRight,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Building2,
  Database,
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { customers, datasetSize, regenerateDataset, globalSearch, setGlobalSearch } = useCrm();
  const navigate = useNavigate();

  const firstCustomerId = customers[0]?.customerId || 'DAM-10001';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: `/customers/${firstCustomerId}`, label: 'Customer Details', icon: UserCheck },
    { to: '/onboarding', label: 'Customer Onboarding', icon: UserPlus },
    { to: '/kyc', label: 'KYC Management', icon: ShieldCheck },
    { to: '/accounts', label: 'Financial Accounts', icon: Landmark },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  ];

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/customers');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-navy-950 text-slate-200 transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-md bg-navy-700 border border-navy-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-sm font-bold tracking-wide text-white">DAM CAPITAL</div>
                <div className="text-[11px] text-slate-400">Wealth & Institutional CRM</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-800 text-white border-l-2 border-sky-400'
                      : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 text-slate-300" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-navy-800 bg-navy-900/60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Synthetic Records</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[100, 500, 1000].map((size) => (
                <button
                  key={size}
                  onClick={() => regenerateDataset(size)}
                  className={`py-1 text-xs font-medium rounded border transition-colors ${
                    datasetSize === size
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-navy-950 text-slate-300 border-navy-700 hover:bg-navy-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:flex p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline-block text-sm font-semibold text-navy-900">
              DAM Capital – Customer Management Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleGlobalSearchSubmit} className="relative hidden md:block w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer, PAN, ID..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:bg-white focus:border-navy-700"
              />
            </form>

            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((o) => !o);
                  setProfileMenuOpen(false);
                }}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-30">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs font-semibold text-navy-900">
                    Compliance & KYC Alerts
                  </div>
                  <div className="px-4 py-2.5 text-xs text-slate-600 border-b border-slate-100">
                    <span className="font-medium text-slate-900">CKYC Batch Sync:</span>{' '}
                    {customers.filter((c) => c.kycStatus === 'Pending').length} profiles awaiting verification.
                  </div>
                  <div className="px-4 py-2.5 text-xs text-slate-600">
                    <span className="font-medium text-slate-900">Risk Review:</span>{' '}
                    {customers.filter((c) => c.riskCategory === 'High').length} High-Risk accounts flagged for periodic EDD.
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setProfileMenuOpen((o) => !o);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-md hover:bg-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-navy-900 text-white text-xs font-semibold flex items-center justify-center">
                  RM
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900">Rohan Malhotra</div>
                  <div className="text-[11px] text-slate-500">VP – Client Relations</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-sm">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-medium text-slate-900 text-xs">rohan.m@damcapital.in</p>
                    <p className="text-[11px] text-slate-500">SEBI Reg: INZ000207137</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/kyc');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    KYC Compliance Queue
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      regenerateDataset(100);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-slate-50"
                  >
                    Reset Demo Data (100)
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
