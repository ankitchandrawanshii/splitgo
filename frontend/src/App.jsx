import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import BookRide from './pages/BookRide';
import RideStatus from './pages/RideStatus';
import Verify from './pages/Verify';
import Home from './pages/Home';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('React Global ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 text-slate-100 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold mx-auto">
              🛵
            </div>
            <h2 className="text-lg font-bold text-white">SplitGo Application Active</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              We recovered your active ride session. Click below to continue tracking.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/ride/live_active';
              }}
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black py-3 rounded-2xl text-xs transition hover:scale-105 shadow-lg shadow-emerald-500/20"
            >
              🚀 Launch Active Co-Rider Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const needsEmail = user.email && user.email.trim() !== '';
  const isVerified = user.isPhoneVerified && (!needsEmail || user.isEmailVerified);

  if (!isVerified) {
    return <Navigate to="/verify" replace />;
  }

  return children;
}

function VerifyRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const needsEmail = user.email && user.email.trim() !== '';
  const isVerified = user.isPhoneVerified && (!needsEmail || user.isEmailVerified);

  if (isVerified) {
    return <Navigate to="/book" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/verify"
        element={
          <VerifyRoute>
            <Verify />
          </VerifyRoute>
        }
      />
      <Route
        path="/book"
        element={
          <PrivateRoute>
            <BookRide />
          </PrivateRoute>
        }
      />
      <Route path="/ride/:id" element={<RideStatus />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
