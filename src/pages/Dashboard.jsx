import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setRole(session?.user?.user_metadata?.role || null);
    };
    bootstrap();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setRole(session?.user?.user_metadata?.role || null);
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#e1ffa7] flex">
      <div className="flex-shrink-0">
        <Sidebar role={role} />
      </div>
      
      <main className="flex-1 overflow-auto p-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#222]">FARD Stationery</h1>
              {role && <p className="text-sm text-[#222] opacity-70">Role: {role}</p>}
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Sales Container */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#222]">Sales</h2>
            <div className="space-y-2">
              <div className="w-full flex justify-between bg-gray-500 p-2 rounded">
                <span>Most Sales</span>
                <span>Paper</span>
              </div>
              <div className="w-full flex justify-between bg-gray-500 p-2 rounded">
                <span>Least Sales</span>
                <span>Markers</span>
              </div>
            </div>
          </div>

          {/* Inventory Status Container */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#222]">Inventory Status</h2>
            <div className="space-y-2">
              <div className="w-full flex justify-between bg-gray-500 p-2 rounded">
                <span>Moved Items</span>
                <span>15</span>
              </div>
              <div className="w-full flex justify-between bg-gray-500 p-2 rounded">
                <span>Recently Purchased</span>
                <span>8</span>
              </div>
            </div>
          </div>

          {/* Top Categories Container */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#222]">Top Categories</h2>
            <div className="space-y-2">
              {['Notebook', 'Pens', 'Coloring Items'].map((item, index) => (
                <div 
                  key={index}
                  className="w-full text-left bg-gray-500 p-2 rounded flex items-center"
                >
                  <span className="w-2 h-2 bg-gray-200 rounded-full mr-2"></span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers Container */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-[#222]">Top Customers</h2>
            <div className="space-y-2">
              {['Notebook', 'Pens', 'Coloring Items'].map((item, index) => (
                <div 
                  key={index}
                  className="w-full text-left bg-gray-500 p-2 rounded flex items-center"
                >
                  <span className="w-2 h-2 bg-gray-100 rounded-full mr-2"></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;