import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import { supabase } from './lib/supabaseClient';
import PurchaseStock from './pages/PurchaseStock';
import PurchaseReport from './pages/PurchaseReport';
import AccountingCharge from './pages/AccountingCharge';
import AccountingReport from './pages/AccountingReport';

// Simple in-file auth gate for protecting routes and role-based access
const AuthGate = ({ children, allowedRoles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null; // could render a spinner here

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  // Optional role check; expects role in user.user_metadata.role
  const role = session.user?.user_metadata?.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />; // redirect if role not permitted
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated routes */}
        <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />

        {/* Purchaser */}
        <Route path="/purchase-stock" element={
          <AuthGate allowedRoles={['Purchaser', 'Admin']}>
            <PurchaseStock />
          </AuthGate>
        } />
        <Route path="/purchase-report" element={
          <AuthGate allowedRoles={['Purchaser', 'Admin']}>
            <PurchaseReport />
          </AuthGate>
        } />

        {/* Accounting */}
        <Route path="/charge-requests" element={
          <AuthGate allowedRoles={['Accounting', 'Admin']}>
            <AccountingCharge />
          </AuthGate>
        } />
        <Route path="/paid-orders" element={
          <AuthGate allowedRoles={['Accounting', 'Admin']}>
            <AccountingCharge />
          </AuthGate>
        } />
        <Route path="/invoice/purchase/:id" element={
          <AuthGate allowedRoles={['Accounting', 'Admin']}>
            <AccountingReport />
          </AuthGate>
        } />
      </Routes>
    </Router>
  );
}

export default App;
