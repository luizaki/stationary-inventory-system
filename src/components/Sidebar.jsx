import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

// Move static data outside the component
const ROLE_ICONS = {
  'Warehouse': <FiPackage className="w-5 h-5" />,
  'Purchaser': <FiShoppingCart className="w-5 h-5" />,
  'Customer': <FiUsers className="w-5 h-5" />,
  'CSR': <FiClipboard className="w-5 h-5" />,
  'TL': <FiCheckSquare className="w-5 h-5" />,
  'Accounting': <FiDollarSign className="w-5 h-5" />,
  'default': <FiHome className="w-5 h-5" />
};

const ROLE_PAGES = {
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

// Skeleton loader component
const SkeletonNavItem = ({ isCollapsed }) => (
  <div className="flex items-center px-4 py-3">
    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
    {!isCollapsed && (
      <div className="ml-3 h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
    )}
  </div>
);

const Sidebar = ({ role }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Memoize the items to prevent recalculation on every render
  const items = useMemo(() => (role ? ROLE_PAGES[role] || [] : []), [role]);

  useEffect(() => {
    let isMounted = true;
    
    const getUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (isMounted && authUser) {
          setUser({
            name: authUser.user_metadata?.full_name || 
                  authUser.user_metadata?.name || 
                  'User',
            initial: (authUser.user_metadata?.full_name?.[0] || 
                     authUser.user_metadata?.name?.[0] || 
                     'U').toUpperCase()
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    getUserData();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          setUser({
            name: session.user.user_metadata?.full_name || 
                  session.user.user_metadata?.name || 
                  'User',
            initial: (session.user.user_metadata?.full_name?.[0] || 
                     session.user.user_metadata?.name?.[0] || 
                     'U').toUpperCase()
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div 
      className={`flex flex-col h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">SIS</span>
            </div>
            <span className="ml-3 font-semibold text-gray-800 whitespace-nowrap">FARD SIS</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {isLoading ? (
            // Show skeleton loaders while loading
            Array(3).fill(0).map((_, index) => (
              <SkeletonNavItem key={`skeleton-${index}`} isCollapsed={isCollapsed} />
            ))
          ) : (
            // Render actual navigation items
            items.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={`transition-colors duration-200 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}>
                    {React.cloneElement(item.icon, {
                      className: 'w-5 h-5 flex-shrink-0'
                    })}
                  </span>
                  {!isCollapsed && (
                    <span className="ml-3 whitespace-nowrap">{item.label}</span>
                  )}
                </NavLink>
              );
            })
          )}
        </div>
      </nav>

      {/* User Profile / Settings */}
      <div className="p-4 border-t border-gray-200">
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            {!isCollapsed && (
              <div className="ml-3 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">{user?.initial || 'U'}</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{role || 'Role'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Sidebar);