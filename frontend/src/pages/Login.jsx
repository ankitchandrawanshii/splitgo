import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [loginMode, setLoginMode] = useState('phone'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      setError(err.response?.data?.message || 'Invalid credentials. Please check your phone/email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoPhone, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { phone: demoPhone, password: demoPassword });
      login(data);
      navigate('/book');
    } catch (err) {
      setError('Demo login failed. Please try normal login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#060913] px-4 py-8 font-sans text-slate-100 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Main Split Layout Card Container */}
      <div className="w-full max-w-5xl bg-[#0b101d]/90 backdrop-blur-2xl border border-slate-800/80 rounded-[32px] shadow-2xl shadow-cyan-950/30 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT COLUMN: Hero Branding & Bike/Car Artwork */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-gradient-to-br from-[#0e1628] via-[#091122] to-[#070b16] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#091122] rounded-[14px] flex items-center justify-center text-cyan-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  SplitGo
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80 block">Ride Sharing App</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Welcome Back! <br />
                Glad to <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">see you again</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Log in to your account and continue your bike & car ride sharing journey.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                  🛵
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Bike Pooling</h4>
                  <p className="text-[11px] text-slate-400">Quick, affordable two-wheeler rides for single commuters.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  🚗
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Car Pooling</h4>
                  <p className="text-[11px] text-slate-400">Comfortable shared rides to split fuel costs with co-passengers.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Safe & Verified Commute</h4>
                  <p className="text-[11px] text-slate-400">Women-only rider options & real-time GPS location tracking.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Vehicle Graphic Artwork (Bikes & Cars) */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/60">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 group shadow-2xl">
              <img
                src="/splitgo_hero_vehicles.jpg"
                alt="SplitGo Bike and Car Ride Sharing"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-cyan-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Bike & Car Pools
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Ready to ride</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-[#080d1a] relative">
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Login to your account
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Enter your credentials to continue to your SplitGo dashboard.
              </p>
            </div>

            {/* Toggle Mode: Phone vs Email */}
            <div className="bg-[#050811] p-1.5 rounded-2xl flex items-center border border-slate-800">
              <button
                type="button"
                onClick={() => { setLoginMode('phone'); setIdentifier(''); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  loginMode === 'phone'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📞</span>
                <span>Phone Number</span>
              </button>

              <button
                type="button"
                onClick={() => { setLoginMode('email'); setIdentifier(''); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  loginMode === 'email'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>✉️</span>
                <span>Email Address</span>
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-2xl text-xs flex items-center space-x-2 animate-shake">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {loginMode === 'phone' ? 'Phone Number' : 'Email Address'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    {loginMode === 'phone' ? (
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </span>
                  <input
                    type={loginMode === 'phone' ? 'tel' : 'email'}
                    placeholder={loginMode === 'phone' ? 'e.g. 9876543210' : 'enter your email'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
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
                    className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-2xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-[#050811] border-slate-800 accent-cyan-400"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert('Password reset code sent to your registered phone/email!'); }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                >
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all text-xs flex items-center justify-center space-x-2 uppercase tracking-wider"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <span>➜</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Option */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">or quick demo login</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('9876543210', '123456')}
                  className="py-2.5 px-3 rounded-xl border border-slate-800 bg-[#050811] hover:bg-slate-900 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <span>🛵 Demo Rider</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('8989776132', '123456')}
                  className="py-2.5 px-3 rounded-xl border border-slate-800 bg-[#050811] hover:bg-slate-900 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <span>🚗 Demo Driver</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              Sign up
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
