import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useCrm } from '../context/CrmContext';
import { formatCompactINR, getFullName } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';

const KYC_COLORS = ['#059669', '#d97706', '#0284c7', '#e11d48'];
const RISK_COLORS = ['#102a43', '#486581', '#e11d48'];

export const Dashboard: React.FC = () => {
  const { customers } = useCrm();

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.accountStatus === 'Active').length;
    const pendingKyc = customers.filter((c) => c.kycStatus === 'Pending').length;
    const verified = customers.filter((c) => c.kycStatus === 'Verified').length;
    const highRisk = customers.filter((c) => c.riskCategory === 'High').length;
    const totalAum = customers.reduce((sum, c) => sum + c.investmentAmount, 0);

    return { total, active, pendingKyc, verified, highRisk, totalAum };
  }, [customers]);

  const acquisitionData = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const base = Math.max(10, Math.floor(customers.length / 10));
    return months.map((month, idx) => ({
      month,
      customers: Math.round(base * (0.7 + idx * 0.22)),
      hni: Math.round(base * 0.25 * (0.6 + idx * 0.2)),
    }));
  }, [customers.length]);

  const kycDistribution = useMemo(() => {
    const counts = { Verified: 0, Pending: 0, 'Under Review': 0, Rejected: 0 };
    customers.forEach((c) => {
      counts[c.kycStatus] = (counts[c.kycStatus] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [customers]);

  const riskDistribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    customers.forEach((c) => {
      counts[c.riskCategory] = (counts[c.riskCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  }, [customers]);

  const recentCustomers = useMemo(() => customers.slice(0, 8), [customers]);

  const summaryCards = [
    {
      label: 'Total Customers',
      value: stats.total.toLocaleString('en-IN'),
      icon: Users,
      accent: 'text-navy-900 bg-navy-50',
    },
    {
      label: 'Active Customers',
      value: stats.active.toLocaleString('en-IN'),
      icon: UserCheck,
      accent: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Pending KYC',
      value: stats.pendingKyc.toLocaleString('en-IN'),
      icon: Clock,
      accent: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Verified Customers',
      value: stats.verified.toLocaleString('en-IN'),
      icon: ShieldCheck,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      label: 'High-Risk Customers',
      value: stats.highRisk.toLocaleString('en-IN'),
      icon: AlertTriangle,
      accent: 'text-rose-700 bg-rose-50',
    },
    {
      label: 'Total AUM',
      value: formatCompactINR(stats.totalAum),
      icon: Briefcase,
      accent: 'text-navy-900 bg-slate-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Executive Portfolio Overview</h1>
          <p className="text-sm text-slate-500">
            Client onboarding metrics, KYC compliance distribution, and assets under management
          </p>
        </div>
        <Link
          to="/onboarding"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-navy-900 rounded-md hover:bg-navy-800"
        >
          + Onboard Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`p-2 rounded-md ${card.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900 mb-1">
            Customer Acquisition Trends
          </h2>
          <p className="text-xs text-slate-500 mb-4">Monthly client onboarding trajectory (2026)</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acquisitionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="customers"
                  name="Total Onboarded"
                  stroke="#102a43"
                  fill="#bcccdc"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="hni"
                  name="HNI Clients"
                  stroke="#0284c7"
                  fill="#bae6fd"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900 mb-1">
            KYC Verification Distribution
          </h2>
          <p className="text-xs text-slate-500 mb-4">Current CKYC & KRA compliance status</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kycDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {kycDistribution.map((_, idx) => (
                    <Cell key={idx} fill={KYC_COLORS[idx % KYC_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900 mb-1">
            Customer Risk Distribution
          </h2>
          <p className="text-xs text-slate-500 mb-4">AML & PEP risk categorization breakdown</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((_, idx) => (
                    <Cell key={idx} fill={RISK_COLORS[idx % RISK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Recent Customers</h2>
            <p className="text-xs text-slate-500">Latest client profiles registered in the portal</p>
          </div>
          <Link
            to="/customers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800 hover:text-navy-600"
          >
            View All Customers <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">PAN Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">AUM / Investment</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">KYC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {recentCustomers.map((c) => (
                <tr key={c.customerId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-medium text-navy-800">
                    <Link to={`/customers/${c.customerId}`} className="hover:underline">
                      {c.customerId}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{getFullName(c)}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">{c.panNumber}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{c.customerType}</td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-800">
                    {formatCompactINR(c.investmentAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.accountStatus} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.kycStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
