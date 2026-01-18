import { useState, useEffect } from 'react';
import { StaffPortal } from './components/StaffPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { PortalSelector } from './components/PortalSelector';
import { AdminLogin } from './components/AdminLogin';
import { StaffLogin } from './components/StaffLogin';

type AppView = 'selector' | 'admin-login' | 'staff-login' | 'admin' | 'staff';

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface StaffUser {
  id: string;
  email: string;
  name: string;
  specialty: string;
  avatar_color: string;
}

const ADMIN_SESSION_KEY = 'techservice_admin_session';
const STAFF_SESSION_KEY = 'techservice_staff_session';

function App() {
  const [view, setView] = useState<AppView>('selector');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    const savedAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY);
    const savedStaff = sessionStorage.getItem(STAFF_SESSION_KEY);

    if (savedAdmin) {
      try {
        const user = JSON.parse(savedAdmin);
        setAdminUser(user);
        setView('admin');
      } catch {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    } else if (savedStaff) {
      try {
        const user = JSON.parse(savedStaff);
        setStaffUser(user);
        setView('staff');
      } catch {
        sessionStorage.removeItem(STAFF_SESSION_KEY);
      }
    }
  }, []);

  const handleAdminLogin = (user: AdminUser) => {
    setAdminUser(user);
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    setView('admin');
  };

  const handleStaffLogin = (user: StaffUser) => {
    setStaffUser(user);
    sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(user));
    setView('staff');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setStaffUser(null);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(STAFF_SESSION_KEY);
    setView('selector');
  };

  if (view === 'selector') {
    return (
      <PortalSelector
        onSelectPortal={(portal) => setView(portal === 'admin' ? 'admin-login' : 'staff-login')}
      />
    );
  }

  if (view === 'admin-login') {
    return <AdminLogin onBack={() => setView('selector')} onLogin={handleAdminLogin} />;
  }

  if (view === 'staff-login') {
    return <StaffLogin onBack={() => setView('selector')} onLogin={handleStaffLogin} />;
  }

  if (view === 'admin' && adminUser) {
    return <AdminDashboard user={adminUser} onLogout={handleLogout} />;
  }

  if (view === 'staff' && staffUser) {
    return <StaffPortal user={staffUser} onLogout={handleLogout} />;
  }

  return (
    <PortalSelector
      onSelectPortal={(portal) => setView(portal === 'admin' ? 'admin-login' : 'staff-login')}
    />
  );
}

export default App;
