import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import BookRide from './pages/BookRide';
import RideStatus from './pages/RideStatus';
import Verify from './pages/Verify';
import Home from './pages/Home';

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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
