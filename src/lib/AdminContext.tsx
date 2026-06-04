import { createContext, useContext, useEffect, useState } from 'react';

const ADMIN_TOKEN = 'tokio2026';
const LS_KEY = 'trip_user_role';

interface AdminContextValue {
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextValue>({ isAdmin: false });

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin] = useState<boolean>(() => {
    // Check URL param first
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === ADMIN_TOKEN) {
      localStorage.setItem(LS_KEY, 'admin');
      return true;
    }
    // Fall back to localStorage
    return localStorage.getItem(LS_KEY) === 'admin';
  });

  // Strip the ?edit= param from the URL without reloading (keep it clean for sharing)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('edit')) {
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
