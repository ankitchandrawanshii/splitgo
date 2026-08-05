import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Wizard Step Tracker
  const [step, setStep] = useState(1); // 1 = Basic Info, 2 = Mobile OTP

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [gender, setGender] = useState('female'); // 'female' | 'male'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // OTP Verification States
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  // Shared UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 Validations -> proceed to Mobile OTP
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your full name.');
    if (!phone.trim()) return setError('Please enter your phone number.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (!agreedTerms) return setError('Please agree to the Terms & Conditions.');
    setStep(2);
  };

  // Step 2: Send Mobile OTP
  const handleSendMobileOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        identifier: phone,
        type: 'mobile',
      });
      setMobileOtpSent(true);
      setSuccess('Verification OTP sent to your phone number!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP to mobile.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Mobile OTP
  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!mobileOtp.trim()) return setError('Please enter the verification code.');

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        identifier: phone,
        otp: mobileOtp,
        type: 'mobile',
      });
      setMobileVerified(true);
      setSuccess('✓ Mobile number verified successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Finalize Registration
  const handleCompleteRegistration = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name,
        gender,
        phone,
        email,
        password,
        role: 'rider',
        isPhoneVerified: true,
        isEmailVerified: false,
      };

      const { data } = await api.post('/auth/register', payload);
      login(data);
      navigate('/book');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
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
                Join SplitGo! <br />
                Start sharing <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">bikes & cars</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Create your account to split fares, lower carbon footprint, and ride safely.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                  🛵
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Bike Pool</h4>
                  <p className="text-[11px] text-slate-400">Instant two-wheeler pooling for fast daily travel.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  🚗
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Car Pool</h4>
                  <p className="text-[11px] text-slate-400">Comfortable AC cars with verified co-riders.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Verified Profiles & SOS</h4>
                  <p className="text-[11px] text-slate-400">Phone OTP verified users & 1-tap Emergency assistance.</p>
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
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  Join Thousands of Riders
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">100% Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Register Form Card */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between bg-[#080d1a] relative">
          
          <div className="space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Enter your details to join the SplitGo ride community.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-2xl text-xs space-y-1">
                <p>⚠️ {error}</p>
                {error.toLowerCase().includes('already registered') && (
                  <Link to="/login" className="text-cyan-400 font-bold block underline">
                    Click here to Login →
                  </Link>
                )}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-2xl text-xs">
                <span>{success}</span>
              </div>
            )}

            {/* STEP 1: Basic Info Form */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Gender Choice */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Gender (For Women-Only Match)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        gender === 'female' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md' : 'bg-[#050811] border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>👩 Female</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        gender === 'male' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md' : 'bg-[#050811] border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>👨 Male</span>
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#050811] border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded accent-cyan-400 border-slate-800 bg-[#050811]"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight">
                    I agree to SplitGo <span className="text-cyan-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-cyan-400 hover:underline cursor-pointer">Privacy Policy</span>.
                  </label>
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all text-xs flex items-center justify-center space-x-1.5 mt-2 uppercase tracking-wider"
                >
                  <span>Continue to Mobile OTP</span>
                  <span>➜</span>
                </button>
              </form>
            )}

            {/* STEP 2: Mobile OTP Verification */}
            {step === 2 && (
              <div className="space-y-4 pt-1">
                <p className="text-xs text-slate-300">
                  Confirm phone number <strong className="text-cyan-400">{phone}</strong> via OTP verification:
                </p>

                {!mobileVerified ? (
                  <div className="space-y-3">
                    {!mobileOtpSent ? (
                      <button
                        onClick={handleSendMobileOtp}
                        disabled={loading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-2xl text-xs transition uppercase tracking-wider shadow-lg shadow-cyan-500/20"
                      >
                        {loading ? 'Sending OTP...' : 'Send Mobile Verification OTP 📲'}
                      </button>
                    ) : (
                      <form onSubmit={handleVerifyMobileOtp} className="space-y-3">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="••••••"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-full bg-[#050811] border border-slate-800 text-center tracking-[6px] text-base font-bold text-white py-3 rounded-2xl focus:outline-none focus:border-cyan-400"
                          required
                        />
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleSendMobileOtp}
                            className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-semibold py-2.5 rounded-xl text-xs"
                          >
                            Resend
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-cyan-500 text-slate-950 font-black py-2.5 rounded-xl text-xs"
                          >
                            {loading ? 'Verifying...' : 'Verify Code'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteRegistration}
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition shadow-lg shadow-cyan-500/25 uppercase tracking-wider"
                  >
                    {loading ? 'Registering...' : 'Complete Sign Up & Launch 🚀'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-slate-500 hover:text-white pt-1"
                >
                  ← Edit Information
                </button>
              </div>
            )}
          </div>

          {/* Footer Link */}
          <div className="pt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              Log in
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
