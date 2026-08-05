import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [loginMode, setLoginMode] = useState('phone'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = loginMode === 'phone' ? { phone: identifier, password } : { email: identifier, password };
      const { data } = await api.post('/auth/login', payload);
      login(data);
      navigate('/book');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#070913] bg-cyber-mesh px-4 py-8 overflow-hidden font-sans text-slate-100">
      {/* Cyber Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[380px] h-[380px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main Outer SplitGo Phone Container */}
      <div className="w-full max-w-[400px] bg-[#0c1222]/90 backdrop-blur-2xl border border-cyan-500/20 rounded-[38px] p-6 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header & Lightning Badge */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-violet-600/20 border border-cyan-400/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
            SplitGo
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Short rides, more vibes</p>
        </div>

        {/* Inner Card Container */}
        <div className="bg-[#0e1628]/80 border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-center text-white tracking-tight">
            Sign In to Account
          </h2>

          {/* Toggle Switch: Email vs Phone */}
          <div className="bg-[#070b16] p-1 rounded-2xl flex items-center border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setLoginMode('email'); setIdentifier(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                loginMode === 'email'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>✉️</span>
              <span>Email</span>
            </button>

            <button
              type="button"
              onClick={() => { setLoginMode('phone'); setIdentifier(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                loginMode === 'phone'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📞</span>
              <span>Phone</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Field: Email or Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {loginMode === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  {loginMode === 'email' ? (
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )}
                </span>
                <input
                  type={loginMode === 'email' ? 'email' : 'tel'}
                  placeholder={loginMode === 'email' ? 'name@example.com' : 'e.g. 8989776132'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#070b16] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Input Field: Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your registered email/mobile!'); }} className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#070b16] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  <span className="text-xs">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center space-x-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-500 hover:from-cyan-400 hover:to-violet-600 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all text-xs flex items-center justify-center space-x-2 mt-2 uppercase tracking-wider"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span>➜</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <div className="text-center text-xs text-slate-400 pb-2 space-y-1">
          <p>Don't have an account?</p>
          <Link to="/register" className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            <span>Create Account</span>
            <span>➜</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
