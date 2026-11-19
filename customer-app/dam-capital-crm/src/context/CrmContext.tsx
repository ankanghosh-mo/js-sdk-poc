import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, FinancialAccount, Transaction, KycStatus, RiskCategory } from '../types/crm';
import { generateSyntheticData } from '../utils/mockGenerator';
import { getFullName } from '../utils/formatters';

interface CrmContextType {
  customers: Customer[];
  accounts: FinancialAccount[];
  transactions: Transaction[];
  datasetSize: number;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  updateKycStatus: (customerId: string, kycStatus: KycStatus, riskCategory?: RiskCategory) => void;
  regenerateDataset: (size: number) => void;
}

const STORAGE_KEYS = {
  CUSTOMERS: 'dam_capital_crm_customers_v1',
  ACCOUNTS: 'dam_capital_crm_accounts_v1',
  TRANSACTIONS: 'dam_capital_crm_transactions_v1',
  SIZE: 'dam_capital_crm_dataset_size_v1',
};

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasetSize, setDatasetSize] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SIZE);
    return saved ? Number(saved) : 100;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return generateSyntheticData(100).customers;
  });

  const [accounts, setAccounts] = useState<FinancialAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return generateSyntheticData(100).accounts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return generateSyntheticData(100).transactions;
  });

  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.warn('localStorage quota exceeded for customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('localStorage quota exceeded for accounts', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('localStorage quota exceeded for transactions', e);
    }
  }, [transactions]);

  const addCustomer = useCallback((newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);

    const newAccount: FinancialAccount = {
      accountId: `ACC-${Math.floor(60000 + Math.random() * 39999)}`,
      customerId: newCustomer.customerId,
      customerName: getFullName(newCustomer),
      bankName: newCustomer.bankName,
      accountNumber: newCustomer.bankAccountNumber,
      ifsc: newCustomer.ifscCode,
      accountType: newCustomer.customerType === 'HNI' ? 'Portfolio PMS' : 'Savings',
      accountBalance: newCustomer.investmentAmount || 100000,
      accountStatus: newCustomer.accountStatus,
    };
    setAccounts((prev) => [newAccount, ...prev]);
  }, []);

  const updateCustomer = useCallback((updated: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.customerId === updated.customerId ? updated : c))
    );
    const updatedName = getFullName(updated);
    setAccounts((prev) =>
      prev.map((a) =>
        a.customerId === updated.customerId
          ? {
              ...a,
              customerName: updatedName,
              bankName: updated.bankName,
              accountNumber: updated.bankAccountNumber,
              ifsc: updated.ifscCode,
              accountStatus: updated.accountStatus,
            }
          : a
      )
    );
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.customerId !== customerId));
    setAccounts((prev) => prev.filter((a) => a.customerId !== customerId));
    setTransactions((prev) => prev.filter((t) => t.customerId !== customerId));
  }, []);

  const updateKycStatus = useCallback(
    (customerId: string, kycStatus: KycStatus, riskCategory?: RiskCategory) => {
      const today = new Date().toISOString().split('T')[0];
      setCustomers((prev) =>
        prev.map((c) =>
          c.customerId === customerId
            ? {
                ...c,
                kycStatus,
                riskCategory: riskCategory ?? c.riskCategory,
                verificationDate: kycStatus === 'Verified' ? today : c.verificationDate,
              }
            : c
        )
      );
    },
    []
  );

  const regenerateDataset = useCallback((size: number) => {
    const generated = generateSyntheticData(size);
    setDatasetSize(size);
    setCustomers(generated.customers);
    setAccounts(generated.accounts);
    setTransactions(generated.transactions);
    localStorage.setItem(STORAGE_KEYS.SIZE, String(size));
  }, []);

  return (
    <CrmContext.Provider
      value={{
        customers,
        accounts,
        transactions,
        datasetSize,
        globalSearch,
        setGlobalSearch,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        updateKycStatus,
        regenerateDataset,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export function useCrm(): CrmContextType {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
