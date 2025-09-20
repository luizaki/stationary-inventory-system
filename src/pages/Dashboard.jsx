import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const [role, setRole] = useState(null);

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

  // Sample data for demonstration
  const topCategories = [
    { name: 'Notebook', count: 245, color: 'bg-blue-500' },
    { name: 'Pens', count: 189, color: 'bg-green-500' },
    { name: 'Coloring Items', count: 132, color: 'bg-yellow-500' },
  ];

  const topCustomers = [
    { name: 'John Doe', purchases: 24 },
    { name: 'Jane Smith', purchases: 18 },
    { name: 'Acme Corp', purchases: 12 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex">
      <div className="flex-shrink-0">
        <Sidebar role={role} />
      </div>

      <main className="flex-1 overflow-auto p-6 transition-all duration-300">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">FARD Stationery</h1>
              {role && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back! • <span className="font-medium text-emerald-700">{role}</span>
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Sales Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Sales Overview</h3>
              <div className="p-2 rounded-lg bg-emerald-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50">
                <span className="text-gray-600">Top Seller</span>
                <span className="font-medium text-emerald-700">Paper</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50">
                <span className="text-gray-600">Lowest Sales</span>
                <span className="font-medium text-rose-600">Markers</span>
              </div>
            </div>
          </div>

          {/* Inventory Status Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Inventory Status</h3>
              <div className="p-2 rounded-lg bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                <span className="text-gray-600">Items Moved</span>
                <span className="font-medium text-blue-600">15</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50">
                <span className="text-gray-600">New Purchases</span>
                <span className="font-medium text-amber-600">8</span>
              </div>
            </div>
          </div>

          {/* Top Categories Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Categories</h3>
            <div className="space-y-3">
              {topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${category.color} mr-3`}></div>
                    <span className="text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-gray-500 font-medium">{category.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium mr-3">
                      {customer.name.charAt(0)}
                    </div>
                    <span className="text-gray-700">{customer.name}</span>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {customer.purchases} purchases
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Content Area */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">Recent activity will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;