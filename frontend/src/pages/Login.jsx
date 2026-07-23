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
    <div className="min-h-screen relative flex items-center justify-center bg-[#080c14] px-4 py-8 overflow-hidden font-sans text-slate-100">
      {/* Emerald Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main Outer Phone Frame Container */}
      <div className="w-full max-w-[400px] bg-[#0c1220]/95 backdrop-blur-2xl border border-emerald-500/20 rounded-[38px] p-6 shadow-2xl relative z-10 space-y-6">
        
        {/* App Logo Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-emerald-400">
            SplitGo
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Short rides, more vibes</p>
        </div>

        {/* Inner Card Container */}
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-center text-white tracking-tight">
            Welcome Back
          </h2>

          {/* Toggle Tab Switch: Email vs Phone */}
          <div className="bg-[#080c14] p-1 rounded-2xl flex items-center border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setLoginMode('email'); setIdentifier(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                loginMode === 'email'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
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
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
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
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )}
                </span>
                <input
                  type={loginMode === 'email' ? 'email' : 'tel'}
                  placeholder={loginMode === 'email' ? 'name@example.com' : 'e.g. 8989776132'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Input Field: Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your registered email/mobile!'); }} className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.858A9.954 9.954 0 0112 3c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.588-4.588a3 3 0 11-4.243-4.243" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center space-x-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Main Emerald Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all text-xs flex items-center justify-center space-x-2 mt-2 uppercase tracking-wider"
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
          <Link to="/register" className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            <span>Create Account</span>
            <span>➜</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
