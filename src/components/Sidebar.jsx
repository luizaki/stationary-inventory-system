import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiHome,
  FiPackage,
  FiTruck,
  FiShoppingCart,
  FiClipboard,
  FiUsers,
  FiCheckSquare,
  FiDollarSign,
  FiFileText,
  FiSettings
} from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

const Sidebar = ({ role }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          initial: (user.user_metadata?.full_name?.[0] || user.user_metadata?.name?.[0] || 'U').toUpperCase()
        });
      }
    };

    getUserData();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
          initial: (session.user.user_metadata?.full_name?.[0] || session.user.user_metadata?.name?.[0] || 'U').toUpperCase()
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const roleIcons = {
    'Warehouse': <FiPackage className="w-5 h-5" />,
    'Purchaser': <FiShoppingCart className="w-5 h-5" />,
    'Customer': <FiUsers className="w-5 h-5" />,
    'CSR': <FiClipboard className="w-5 h-5" />,
    'TL': <FiCheckSquare className="w-5 h-5" />,
    'Accounting': <FiDollarSign className="w-5 h-5" />,
    'default': <FiHome className="w-5 h-5" />
  };

  const rolePages = {
    'Warehouse': [
      { label: 'Stocks', to: '/stocks', icon: <FiPackage className="w-5 h-5" /> },
      { label: 'Dispatch Orders', to: '/dispatch-orders', icon: <FiTruck className="w-5 h-5" /> },
    ],
    'Purchaser': [
      { label: 'Purchase Stock', to: '/purchase-stock', icon: <FiShoppingCart className="w-5 h-5" /> },
      { label: 'Reports', to: '/reports', icon: <FiFileText className="w-5 h-5" /> },
    ],
    'Customer': [
      { label: 'Request Stock', to: '/request-stock', icon: <FiPackage className="w-5 h-5" /> },
      { label: 'Reports', to: '/reports', icon: <FiFileText className="w-5 h-5" /> },
    ],
    'CSR': [
      { label: 'Track Requests', to: '/track-requests', icon: <FiClipboard className="w-5 h-5" /> },
    ],
    'TL': [
      { label: 'Pending Approvals', to: '/pending-approvals', icon: <FiCheckSquare className="w-5 h-5" /> },
      { label: 'Approved Requests', to: '/approved-requests', icon: <FiCheckSquare className="w-5 h-5" /> },
    ],
    'Accounting': [
      { label: 'Charge Requests', to: '/charge-requests', icon: <FiDollarSign className="w-5 h-5" /> },
      { label: 'Paid Orders', to: '/paid-orders', icon: <FiDollarSign className="w-5 h-5" /> },
    ],
  };

  const items = role ? rolePages[role] || [] : [];

  return (
    <div className={`flex flex-col h-full bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">SIS</span>
            </div>
            <span className="ml-3 font-semibold text-gray-800">FARD SIS</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {items.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <span className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Profile / Settings */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">{user?.initial || 'U'}</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{role || 'Role'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;