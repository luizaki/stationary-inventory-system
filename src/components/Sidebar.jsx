import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

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
      className={`relative h-screen flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Logo Section */}
<div className="flex-shrink-0 border-b border-gray-200">
  {isCollapsed ? (
    <div className="flex justify-center p-2">
      <button
        onClick={() => setIsCollapsed(false)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
      >
        <FiMenu className="h-5 w-5" />
      </button>
    </div>
  ) : (
        <div className="flex items-center justify-between p-2">
            <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">SIS</span>
                </div>
                <span className="ml-3 font-semibold text-gray-800 truncate">FARD SIS</span>
            </div>
            <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
            >
                <FiX className="h-5 w-5" />
            </button>
            </div>
        )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <div className="px-2 space-y-1">
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
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                      isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}>
                      {React.cloneElement(item.icon, {
                        className: 'w-5 h-5 flex-shrink-0'
                      })}
                    </span>
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                );
              })
            )}
          </div>
        </nav>

        {/* Sign Out Button */}
        <div className="p-2 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className={`flex items-center py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 ${
              isCollapsed ? 'justify-center w-full' : 'px-3 w-full'
            }`}
          >
            <svg
              className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="truncate">Sign out</span>}
          </button>
        </div>

        {/* User Profile / Settings */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-sm font-medium">{user?.initial || 'U'}</span>
              </div>
              {!isCollapsed && (
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{role || 'Role'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Sidebar);