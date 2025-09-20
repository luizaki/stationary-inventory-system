import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Welcome to <span className="text-emerald-600">FARD Stationery</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Streamline your inventory management with our powerful and intuitive platform.
            Track, manage, and optimize your stationery supplies with ease.
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Column - App Preview */}
            <div className="p-8 md:p-12 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="relative w-full max-w-xs">
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -top-8 right-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                <div className="relative bg-white p-1 rounded-xl shadow-lg">
                  <div className="bg-gray-800 h-6 rounded-t-lg flex items-center px-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-800">Dashboard</h3>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">v2.0</span>
                    </div>
                    <div className="space-y-3">
                      {['Sales', 'Inventory', 'Categories', 'Customers'].map((item) => (
                        <div key={item} className="flex items-center p-2 rounded-lg bg-gray-50">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                            <span className="text-emerald-600 text-sm font-medium">{item.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Login */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-lg mb-4">
                  <span className="text-white font-bold text-2xl">FSIS</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Started</h2>
                <p className="text-gray-600">Sign in to access your account</p>
              </div>

              <button
                onClick={handleLoginClick}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Sign In
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
                  >
                    Sign up
                  </button>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: '📊', label: 'Track' },
                    { icon: '📦', label: 'Manage' },
                    { icon: '⚡', label: 'Optimize' }
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} FARD Stationery. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Landing;