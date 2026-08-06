import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Verify() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Verification states (locally updated, then synced to AuthContext on completion)
  const [phoneVerified, setPhoneVerified] = useState(user?.isPhoneVerified || false);
  const [emailVerified, setEmailVerified] = useState(user?.isEmailVerified || false);

  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [loadingMobile, setLoadingMobile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const [errorMobile, setErrorMobile] = useState('');
  const [errorEmail, setErrorEmail] = useState('');

  const [successMobile, setSuccessMobile] = useState('');
  const [successEmail, setSuccessEmail] = useState('');

  const needsEmail = user?.email && user.email.trim() !== '';
  const isFullyVerified = phoneVerified && (!needsEmail || emailVerified);

  // Sync state if user changes out-of-band
  useEffect(() => {
    if (user) {
      setPhoneVerified(user.isPhoneVerified || false);
      setEmailVerified(user.isEmailVerified || false);
    }
  }, [user]);

  // Send Mobile OTP
  const handleSendMobileOtp = async () => {
    setErrorMobile('');
    setSuccessMobile('');
    setLoadingMobile(true);
    try {
      await api.post('/auth/send-otp', {
        identifier: user.phone,
        type: 'mobile',
      });
      setMobileOtpSent(true);
      setSuccessMobile('OTP sent to your phone! Please check logs/device.');
    } catch (err) {
      setErrorMobile(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoadingMobile(false);
    }
  };

  // Verify Mobile OTP
  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    setErrorMobile('');
    setSuccessMobile('');
    setLoadingMobile(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        identifier: user.phone,
        otp: mobileOtp,
        type: 'mobile',
      });
      setPhoneVerified(true);
      setMobileOtp('');
      setSuccessMobile('✓ Phone verified successfully!');

      // Update local storage / AuthContext
      const updatedUser = { ...user, isPhoneVerified: true };
      login(updatedUser);
    } catch (err) {
      setErrorMobile(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoadingMobile(false);
    }
  };

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    setErrorEmail('');
    setSuccessEmail('');
    setLoadingEmail(true);
    try {
      await api.post('/auth/send-otp', {
        identifier: user.email,
        type: 'email',
      });
      setEmailOtpSent(true);
      setSuccessEmail('OTP sent to your email inbox!');
    } catch (err) {
      setErrorEmail(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoadingEmail(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setErrorEmail('');
    setSuccessEmail('');
    setLoadingEmail(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        identifier: user.email,
        otp: emailOtp,
        type: 'email',
      });
      setEmailVerified(true);
      setEmailOtp('');
      setSuccessEmail('✓ Email verified successfully!');

      // Update local storage / AuthContext
      const updatedUser = { ...user, isEmailVerified: true };
      login(updatedUser);
    } catch (err) {
      setErrorEmail(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoadingEmail(false);
    }
  };

  // Final redirection
  const handleProceed = () => {
    if (isFullyVerified) {
      navigate('/book');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#070a13] px-4 overflow-hidden py-12">
      {/* Glow Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 mb-4 shadow-lg shadow-emerald-500/5">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
            Verify Profile
          </h1>
          <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
            For security and compatibility in matching, please verify your mobile number and email.
          </p>
        </div>

        <div className="space-y-6">
          {/* Mobile verification section */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mobile Number</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">{user?.phone}</p>
              </div>
              {phoneVerified ? (
                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 px-3 py-1 rounded-full font-bold">
                  ✓ Verified
                </span>
              ) : (
                <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold">
                  Pending
                </span>
              )}
            </div>

            {!phoneVerified && (
              <div className="space-y-3 pt-2">
                <form onSubmit={handleVerifyMobileOtp} className="space-y-3">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-center tracking-[6px] text-lg font-bold text-white py-2.5 rounded-xl focus:outline-none focus:border-cyan-400 transition-colors"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={loadingMobile}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold py-2 rounded-xl text-xs transition disabled:opacity-50"
                    >
                      {loadingMobile ? 'Sending...' : '📲 Send / Resend OTP'}
                    </button>
                    <button
                      type="submit"
                      disabled={loadingMobile}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2 rounded-xl text-xs transition"
                    >
                      {loadingMobile ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </form>

                {errorMobile && <p className="text-red-400 text-xs px-1">{errorMobile}</p>}
                {successMobile && <p className="text-emerald-400 text-xs px-1">{successMobile}</p>}
              </div>
            )}
          </div>

          {/* Email verification section */}
          {needsEmail && (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5 line-clamp-1">{user?.email}</p>
                </div>
                {emailVerified ? (
                  <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 px-3 py-1 rounded-full font-bold">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-bold">
                    Pending
                  </span>
                )}
              </div>

              {!emailVerified && (
                <div className="space-y-3 pt-2">
                  {!emailOtpSent ? (
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={loadingEmail}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-xs transition disabled:opacity-50"
                    >
                      {loadingEmail ? 'Sending...' : 'Send OTP Verification Code'}
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyEmailOtp} className="space-y-3">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-center tracking-[6px] text-lg font-bold text-white py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-400 font-semibold py-2 rounded-xl text-xs transition"
                        >
                          Resend
                        </button>
                        <button
                          type="submit"
                          disabled={loadingEmail}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs transition"
                        >
                          {loadingEmail ? 'Verifying...' : 'Verify Code'}
                        </button>
                      </div>
                    </form>
                  )}

                  {errorEmail && <p className="text-red-400 text-xs px-1">{errorEmail}</p>}
                  {successEmail && <p className="text-emerald-400 text-xs px-1">{successEmail}</p>}
                </div>
              )}
            </div>
          )}

          {/* Master proceed button */}
          <div className="pt-4 space-y-4">
            <button
              onClick={handleProceed}
              disabled={!isFullyVerified}
              className={`w-full font-bold py-4 rounded-2xl text-sm transition-all ${
                isFullyVerified
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white shadow-lg shadow-emerald-500/25 active:scale-[0.99] border-0'
                  : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {isFullyVerified ? 'Proceed to Booking ⚡' : 'Verification Required'}
            </button>

            <button
              onClick={logout}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-semibold py-3 rounded-2xl text-xs transition"
            >
              Sign Out / Change Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
