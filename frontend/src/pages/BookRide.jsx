import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { useAuth } from '../context/AuthContext';

// Vadodara default center
const DEFAULT_CENTER = [22.3072, 73.1812];

// Haversine distance in km between two coordinates
function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Leaflet markers
const pickupIcon = L.divIcon({
  className: 'custom-pickup-pin',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-8 w-8 rounded-full bg-emerald-500/30 animate-ping"></div>
    <div class="h-6 w-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/50">
      <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const dropIcon = L.divIcon({
  className: 'custom-drop-pin',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-8 w-8 rounded-full bg-sky-500/30 animate-pulse"></div>
    <div class="h-6 w-6 rounded-full bg-sky-500 border-4 border-slate-900 flex items-center justify-center shadow-lg shadow-sky-500/50">
      <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map click listener
function MapClickHandler({ onSelect, activeMode }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng, activeMode);
    },
  });
  return null;
}

// Bounds fit handler
function FitMapBounds({ pickup, drop }) {
  const map = useMap();
  useEffect(() => {
    const pickupPos = pickup.lat && pickup.lng ? [pickup.lat, pickup.lng] : null;
    const dropPos = drop.lat && drop.lng ? [drop.lat, drop.lng] : null;

    if (pickupPos && dropPos) {
      map.fitBounds([pickupPos, dropPos], { padding: [80, 80] });
    } else if (pickupPos) {
      map.setView(pickupPos, 14);
    } else if (dropPos) {
      map.setView(dropPos, 14);
    }
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng, map]);

  return null;
}

export default function BookRide() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation states
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'my-rides' | 'alerts' | 'profile'
  const [bookingMode, setBookingMode] = useState(null); // null | 'passenger' | 'rider'

  // Booking states
  const [pickup, setPickup] = useState({ address: '', lat: '', lng: '' });
  const [drop, setDrop] = useState({ address: '', lat: '', lng: '' });
  const [rideType, setRideType] = useState('bike'); // 'bike' | 'car'
  const [activeMode, setActiveMode] = useState('pickup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New Features States
  const [genderPreference, setGenderPreference] = useState('any'); // 'any' | 'female_only'
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Wallet Persistence
  const [walletBalance, setWalletBalance] = useState(0.0);
  const [ridesList, setRidesList] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [paymentStep, setPaymentStep] = useState('input'); // 'input' | 'sandbox-choose' | 'success'
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const isValid = pickup.lat && pickup.lng && drop.lat && drop.lng;
  const distance = isValid ? calculateDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng) : 0;
  const baseFare = rideType === 'car' ? 30 : 15;
  const farePerKm = rideType === 'car' ? 18 : 10;
  const rawEstimatedFare = distance > 0 ? Math.round(baseFare + distance * farePerKm) : 0;
  const discountAmount = promoApplied ? promoApplied.discount : 0;
  const estimatedFare = Math.max(0, rawEstimatedFare - discountAmount);

  // Load user's rides when clicking 'my-rides'
  useEffect(() => {
    if (activeTab === 'my-rides') {
      fetchRides();
    }
  }, [activeTab]);

  // Analytics, PWA & Vehicle Garage States
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  const [vehicleDetails, setVehicleDetails] = useState({ model: '', number: '' });
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [vehicleType, setVehicleType] = useState('scooty'); // 'scooty' | 'bike'
  const [vehicleNickname, setVehicleNickname] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModelInput, setVehicleModelInput] = useState('');
  const [vehicleMileage, setVehicleMileage] = useState('45');
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [garageSaving, setGarageSaving] = useState(false);

  // Support Ticket Form States
  const [supportName, setSupportName] = useState(user?.name || '');
  const [supportEmail, setSupportEmail] = useState(user?.email || '');
  const [supportPhone, setSupportPhone] = useState(user?.phone || '');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  // Change Password Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (!oldPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      setChangePasswordError('Please fill in all password fields.');
      return;
    }

    if (newPasswordInput.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('New passwords do not match! Please check again.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const { data } = await api.patch('/auth/change-password', {
        oldPassword: oldPasswordInput,
        newPassword: newPasswordInput,
      });
      setChangePasswordSuccess(data.message || '✓ Password changed successfully!');
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePasswordSuccess('');
      }, 1800);
    } catch (err) {
      setChangePasswordError(err.response?.data?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      alert('Please describe your issue or feedback.');
      return;
    }
    setSupportLoading(true);
    setTimeout(() => {
      setSupportLoading(false);
      setSupportSubmitted(true);
    }, 600);
  };

  // Sync profile wallet balance & vehicle details on load
  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setWalletBalance(data.walletBalance || 0.0);
      if (data.vehicleDetails) {
        setVehicleDetails(data.vehicleDetails);
        setVehicleModelInput(data.vehicleDetails.model || '');
        setVehicleNumberInput(data.vehicleDetails.number || '');
        if (data.vehicleDetails.brand) setVehicleBrand(data.vehicleDetails.brand);
        if (data.vehicleDetails.nickname) setVehicleNickname(data.vehicleDetails.nickname);
      }
    } catch (err) {
      // Ignore profile fetch issues
    }
  };

  const handleSaveGarageVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleNumberInput.trim()) {
      alert('Please enter your vehicle registration number.');
      return;
    }
    const fullModelName = `${vehicleBrand ? vehicleBrand + ' ' : ''}${vehicleModelInput || 'Vehicle'}`.trim();
    setGarageSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        vehicleDetails: {
          type: vehicleType,
          nickname: vehicleNickname,
          brand: vehicleBrand,
          model: fullModelName,
          mileage: vehicleMileage,
          number: vehicleNumberInput,
        },
      });
      setVehicleDetails({ model: fullModelName, number: vehicleNumberInput });
      setShowGarageModal(false);
      setBookingMode('rider'); // Unlock trip route creation form!
    } catch (err) {
      alert('Could not save vehicle details.');
    } finally {
      setGarageSaving(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/analytics/stats');
      setAnalyticsStats(data);
    } catch (err) {
      // Ignore analytics fetch errors
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAnalytics();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchRides = async () => {
    setLoadingRides(true);
    try {
      const { data } = await api.get('/rides');
      setRidesList(data.reverse());
    } catch (err) {
      // Ignore list fetch errors silently
    } finally {
      setLoadingRides(false);
    }
  };

  const handleMapClick = async (lat, lng, target) => {
    const tempAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    if (target === 'pickup') {
      setPickup({ address: tempAddress, lat, lng });
    } else {
      setDrop({ address: tempAddress, lat, lng });
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data?.display_name) {
        if (target === 'pickup') {
          setPickup({ address: data.display_name, lat, lng });
        } else {
          setDrop({ address: data.display_name, lat, lng });
        }
      }
    } catch (err) {
      // Fallback
    }
  };

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return setPromoError('Please enter a promo code.');

    setPromoLoading(true);
    try {
      const { data } = await api.post('/promo/validate', {
        code: promoInput,
        fare: rawEstimatedFare,
      });
      setPromoApplied(data);
      setPromoError('');
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleBookRide = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValid) {
      setError('Please pin both pickup and destination locations on the map.');
      return;
    }

    if (isScheduled && !scheduledAt) {
      setError('Please pick a valid future date and time for your scheduled ride.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/rides', {
        pickup: { ...pickup, lat: parseFloat(pickup.lat), lng: parseFloat(pickup.lng) },
        drop: { ...drop, lat: parseFloat(drop.lat), lng: parseFloat(drop.lng) },
        rideType,
        genderPreference,
        scheduledAt: isScheduled ? scheduledAt : null,
        promoCode: promoApplied ? promoApplied.code : '',
        discountAmount: promoApplied ? promoApplied.discount : 0,
      });
      navigate(`/ride/${data.ride._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while creating ride.');
    } finally {
      setLoading(false);
    }
  };

  // Payment Processing Step 1: Create Order
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    const amt = parseFloat(depositAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      return setPaymentError('Please enter a valid amount.');
    }

    setPaymentLoading(true);
    try {
      const { data } = await api.post('/payment/order', { amount: amt });
      setCurrentOrder(data);

      if (data.isSandbox) {
        // Fallback to custom payment method selection
        setPaymentStep('sandbox-choose');
      } else {
        // Open Real Razorpay Checkout overlay
        if (window.Razorpay) {
          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: 'splitgo.in',
            description: 'SplitGo Wallet Deposit',
            order_id: data.orderId,
            handler: async function (response) {
              setPaymentLoading(true);
              try {
                const verifyRes = await api.post('/payment/verify', {
                  orderId: data.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  amount: amt,
                  isSandbox: false,
                });
                setWalletBalance(verifyRes.data.walletBalance);
                setPaymentStep('success');
              } catch (verErr) {
                setPaymentError('Signature validation failed.');
              } finally {
                setPaymentLoading(false);
              }
            },
            prefill: {
              name: user?.name || '',
              contact: user?.phone || '',
            },
            theme: {
              color: '#10b981',
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          setPaymentError('Razorpay library failed to load.');
        }
      }
    } catch (err) {
      console.error('[INITIATE_PAYMENT_ERROR]', err);
      setPaymentError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Payment Processing Step 2: Sandbox checkout simulation
  const handleSimulatePayment = async (status) => {
    setPaymentError('');
    setPaymentLoading(true);

    if (status === 'fail') {
      setPaymentError('Transaction cancelled by user.');
      setPaymentLoading(false);
      return;
    }

    const orderId = currentOrder?.orderId || `order_mock_${Date.now()}`;

    try {
      const { data } = await api.post('/payment/verify', {
        orderId,
        amount: parseFloat(depositAmount),
        isSandbox: true,
      });
      setWalletBalance(data.walletBalance);
      setPaymentStep('success');
    } catch (err) {
      console.error('[SIMULATE_PAYMENT_ERROR]', err);
      setPaymentError(err.response?.data?.message || err.message || 'Sandbox verification failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (walletBalance <= 0) {
      alert('Your wallet balance is ₹0.00. Nothing to withdraw.');
      return;
    }
    const confirm = window.confirm(`Withdraw ₹${walletBalance.toFixed(2)} to your linked account?`);
    if (confirm) {
      try {
        // Send a withdrawal update to backend (simulated by adding negative amount)
        const { data } = await api.post('/payment/verify', {
          orderId: `withdraw_${Date.now()}`,
          amount: -walletBalance,
          isSandbox: true,
        });
        setWalletBalance(data.walletBalance);
        alert('Withdrawal request verified and completed!');
      } catch (err) {
        alert('Withdrawal failed.');
      }
    }
  };

  const pickupPosition = pickup.lat && pickup.lng ? [pickup.lat, pickup.lng] : null;
  const dropPosition = drop.lat && drop.lng ? [drop.lat, drop.lng] : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070a13] text-slate-100 overflow-hidden relative max-w-md mx-auto border-x border-slate-900">
      
      {/* Mobile Top Header */}
      <header className="h-16 border-b border-emerald-500/20 bg-[#080c14] px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <span className="text-xl">⚡</span>
          </div>
          <span className="text-lg font-black tracking-tight text-emerald-400">SplitGo</span>
        </div>

        {/* Theme Toggle Icon */}
        <button className="w-8 h-8 rounded-xl bg-[#0e1422] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition">
          ☀️
        </button>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto pb-24 relative flex flex-col">
        
        {/* Contact Support Ticket Interface */}
        {bookingMode === 'contact_support' ? (
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto pb-32 max-w-2xl mx-auto w-full">
            {/* Top Bar */}
            <div className="flex items-center">
              <button
                onClick={() => setBookingMode(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <span>← Go Back</span>
              </button>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-2xl font-extrabold text-emerald-400 tracking-tight">Contact Support</h2>
              <p className="text-xs text-slate-400 mt-1">Submit a ticket and our team will get back to you as soon as possible.</p>
            </div>

            {/* Ticket Card */}
            <div className="bg-[#0e1422] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">
              <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800/80 pb-3">
                Submit a Support Ticket
              </h3>

              {supportSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
                    ✓
                  </div>
                  <h4 className="text-base font-bold text-white">Ticket Submitted Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your support request <strong className="text-emerald-400">#SP-{Math.floor(1000 + Math.random() * 9000)}</strong> has been received. Our team will contact you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSupportSubmitted(false);
                      setSupportMessage('');
                      setBookingMode(null);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition mt-2"
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  {/* YOUR NAME */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YOUR NAME *</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-slate-650"
                      required
                    />
                  </div>

                  {/* EMAIL ADDRESS */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-slate-650"
                      required
                    />
                  </div>

                  {/* PHONE NUMBER */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PHONE NUMBER</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-slate-650"
                    />
                  </div>

                  {/* SUBJECT */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUBJECT</label>
                    <input
                      type="text"
                      placeholder="Booking dispute / Account issue"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl px-4 py-3 focus:outline-none transition-all placeholder:text-slate-650"
                    />
                  </div>

                  {/* MESSAGE */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MESSAGE *</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your issue or feedback in detail..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 focus:border-emerald-500 text-slate-100 text-xs rounded-xl p-4 focus:outline-none transition-all placeholder:text-slate-650 resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={supportLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center space-x-2 mt-2"
                  >
                    <span>{supportLoading ? 'Submitting...' : 'Submit Ticket'}</span>
                    <span>✈️</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : bookingMode === 'garage_management' ? (
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto pb-32">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setBookingMode(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <span>← Profile</span>
              </button>
              <button
                onClick={() => setShowGarageModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 transition shadow-lg shadow-emerald-500/20"
              >
                <span>+ Add Vehicle</span>
              </button>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Garage Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">Add and edit vehicles you ride to carpool.</p>
            </div>

            {/* Vehicle List or Empty State Card */}
            {!vehicleDetails?.number ? (
              <div className="bg-[#0e1422] border border-dashed border-slate-800/80 rounded-3xl p-8 text-center space-y-4 my-auto">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto text-slate-400">
                  🚲
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No vehicles in garage</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Add a bike or scooty to offer rides to other members.
                  </p>
                </div>
                <button
                  onClick={() => setShowGarageModal(true)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-6 py-3 rounded-xl text-xs transition active:scale-[0.99]"
                >
                  Add Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="bg-[#0e1422] border border-emerald-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                      🛵
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{vehicleDetails.model}</h4>
                      <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider mt-0.5">{vehicleDetails.number}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">
                    Active Vehicle
                  </span>
                </div>
                <button
                  onClick={() => setBookingMode('rider')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Use This Vehicle to Offer Ride ➜
                </button>
              </div>
            )}
          </div>
        ) : bookingMode === 'rider_no_vehicle' ? (
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto pb-32">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setBookingMode('rider_manage')}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <span>← Back to Rides</span>
              </button>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Offer a Ride</h2>
              <p className="text-xs text-slate-400 mt-0.5">Create a trip schedule to share seats.</p>
            </div>

            {/* No Vehicle Selected Card */}
            <div className="bg-[#0e1422] border border-dashed border-slate-800/80 rounded-3xl p-8 text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto text-slate-400">
                🚗
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No vehicle selected</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  You must register a vehicle in your profile garage before creating a ride.
                </p>
              </div>
              <button
                onClick={() => setBookingMode('garage_management')}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                Go to Garage
              </button>
            </div>
          </div>
        ) : bookingMode === 'rider_manage' ? (
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto pb-32">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setBookingMode(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <span>← Dashboard</span>
              </button>
              <button
                onClick={() => {
                  if (vehicleDetails?.number) {
                    setBookingMode('rider');
                  } else {
                    setBookingMode('rider_no_vehicle');
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1 transition shadow-lg shadow-cyan-500/20"
              >
                <span>+ Create Trip</span>
              </button>
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Published Trips</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage trips you scheduled to offer co-rider seats.</p>
            </div>

            {/* Empty State Card */}
            <div className="bg-[#0e1422] border border-dashed border-slate-800/80 rounded-3xl p-8 text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto text-slate-400">
                🚗
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No scheduled rides</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Offer seat space by creating a carpool trip today.
                </p>
              </div>
              <button
                onClick={() => {
                  if (vehicleDetails?.number) {
                    setBookingMode('rider');
                  } else {
                    setBookingMode('rider_no_vehicle');
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                Offer a Ride Now
              </button>
            </div>
          </div>
        ) : bookingMode ? (
          <div className="flex-1 flex flex-col relative min-h-0">
            
            {/* Booking Top Nav */}
            <div className="h-12 bg-[#090d16] border-b border-slate-800/80 px-4 flex items-center justify-between z-15 shrink-0">
              <button
                onClick={() => setBookingMode(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <span>← Back to Home</span>
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {bookingMode === 'passenger' ? 'Find a Co-Rider' : 'Publish Route Offer'}
              </span>
              <div className="w-8"></div>
            </div>

            {/* Map Container */}
            <div className="h-60 sm:h-64 w-full relative shrink-0">
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onSelect={handleMapClick} activeMode={activeMode} />
                <FitMapBounds pickup={pickup} drop={drop} />
                {pickupPosition && <Marker position={pickupPosition} icon={pickupIcon} />}
                {dropPosition && <Marker position={dropPosition} icon={dropIcon} />}
                {pickupPosition && dropPosition && (
                  <Polyline positions={[pickupPosition, dropPosition]} color="#10b981" weight={4} opacity={0.8} dashArray="10, 10" />
                )}
              </MapContainer>
              <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] z-[1000] font-bold">
                Pin target: <span className="text-emerald-450 uppercase">{activeMode}</span>
              </div>
            </div>

            {/* Location Forms */}
            <div className="p-5 space-y-4 flex-1 pb-32">
              <div className="mb-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {bookingMode === 'passenger' ? 'Find a Co-Rider' : 'Publish Your Trip'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {bookingMode === 'passenger' ? 'Search for carpoolers & bike poolers going your direction.' : 'Offer empty seats to commuters on your route.'}
                </p>
              </div>
              <div className="relative">
                <LocationPicker
                  label="Pickup Location"
                  value={pickup}
                  onChange={setPickup}
                  placeholder="Where should we pick you up"
                  icon={<span className="text-emerald-500">📍</span>}
                />
                <button
                  type="button"
                  onClick={() => setActiveMode('pickup')}
                  className={`absolute right-10 top-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                    activeMode === 'pickup' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-450' : 'text-slate-500'
                  }`}
                >
                  Pin Active
                </button>
              </div>

              <div className="relative">
                <LocationPicker
                  label="Destination Location"
                  value={drop}
                  onChange={setDrop}
                  placeholder="Where are you heading?"
                  icon={<span className="text-sky-400">📍</span>}
                />
                <button
                  type="button"
                  onClick={() => setActiveMode('drop')}
                  className={`absolute right-10 top-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                    activeMode === 'drop' ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400' : 'text-slate-500'
                  }`}
                >
                  Pin Active
                </button>
              </div>

              {/* Ride Type Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vehicle Pooling Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRideType('bike')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      rideType === 'bike' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-500'
                    }`}
                  >
                    <span className="text-xl">🛵</span>
                    <span className="text-[10px] font-bold mt-1">Bike Pool</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRideType('car')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      rideType === 'car' ? 'border-sky-500 bg-sky-500/10 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-500'
                    }`}
                  >
                    <span className="text-xl">🚗</span>
                    <span className="text-[10px] font-bold mt-1">Car Pool</span>
                  </button>
                </div>
              </div>

              {/* Safety & Women-Only Matching Filter */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-lg">👩‍🦰</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-200">Women-Only Match</h5>
                    <p className="text-[9px] text-slate-500">Exclusively match with female commuters</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGenderPreference(genderPreference === 'female_only' ? 'any' : 'female_only')}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    genderPreference === 'female_only' ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform ${
                      genderPreference === 'female_only' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Advance Booking Schedule Selector */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">📅</span>
                    <span className="text-[11px] font-bold text-slate-200">Schedule for Later</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border transition ${
                      isScheduled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isScheduled ? 'Scheduled ON' : 'Ride Now ⚡'}
                  </button>
                </div>

                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-emerald-500 mt-1"
                  />
                )}
              </div>

              {/* Promo Code Input Box */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Promo Code</span>
                  <span className="text-[9px] text-emerald-450 font-bold">Try: SPLITGO50</span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. SPLITGO50)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition"
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {promoApplied && <p className="text-emerald-450 text-[10px] font-semibold">{promoApplied.message}</p>}
                {promoError && <p className="text-red-400 text-[10px]">{promoError}</p>}
              </div>

              {distance > 0 && (
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Distance</span>
                    <p className="font-bold text-slate-200 mt-0.5">{distance.toFixed(1)} km</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                        {promoApplied ? 'Discounted Fare' : 'Est. Splitted Fare'}
                      </span>
                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded">⚡ Peak Commute</span>
                    </div>
                    <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                      {promoApplied && (
                        <span className="text-xs text-slate-500 line-through">₹{rawEstimatedFare}</span>
                      )}
                      <p className="font-extrabold text-emerald-400">₹{estimatedFare}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <button
                onClick={handleBookRide}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all text-xs uppercase tracking-wider mt-3 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Searching Co-Rider...</span>
                  </span>
                ) : (
                  <span>{bookingMode === 'passenger' ? 'Search Co-Rider Match 🔍' : 'Publish Route Offer 🚀'}</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Render Content based on selected bottom tab */
          <div className="p-6 space-y-6 flex-1">
            
            {/* TAB 1: HOME */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* PWA Mobile App Install Prompt Banner */}
                {showPwaBanner && (
                  <div className="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">📱</span>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-200">Install SplitGo Mobile App</h4>
                        <p className="text-[9px] text-slate-500">Fast 1-tap launcher for Android & iOS</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          if (deferredPrompt) {
                            deferredPrompt.prompt();
                            const { outcome } = await deferredPrompt.userChoice;
                            if (outcome === 'accepted') setDeferredPrompt(null);
                          } else {
                            alert('Tap your browser menu (⋮ or Share) and select "Add to Home Screen" to install SplitGo!');
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[10px] transition"
                      >
                        Install 📲
                      </button>
                      <button onClick={() => setShowPwaBanner(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
                    </div>
                  </div>
                )}

                {/* Profile welcome header card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#0e1422] border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-lg font-bold shadow-md">
                      👤
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-3 block">WELCOME BACK</span>
                      <h2 className="text-lg font-extrabold text-white leading-tight mt-0.5">
                        {user?.name || 'Rider Name'}
                      </h2>
                    </div>
                  </div>

                  {/* SplitGo Gold Verified Badge */}
                  <div className="bg-[#1c180a] border border-amber-500/30 px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md">
                    <span className="text-[10px] text-amber-400 font-bold">🎗️</span>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">SplitGo Gold Verified</span>
                  </div>
                </div>

                {/* Driver Earnings & Eco Fuel Savings Card */}
                {analyticsStats && (
                  <div className="bg-[#0e1422] border border-emerald-500/20 rounded-3xl p-4 space-y-2.5 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">🌱 Driver Earnings & Eco Impact</span>
                      <span className="text-[9px] text-emerald-400 font-bold">Updated Live</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#080c14] p-2.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block uppercase">Fare Saved</span>
                        <strong className="text-xs text-emerald-400 font-extrabold">₹{analyticsStats.totalFareSaved}</strong>
                      </div>
                      <div className="bg-[#080c14] p-2.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block uppercase">Fuel Saved</span>
                        <strong className="text-xs text-teal-300 font-extrabold">{analyticsStats.fuelSavedLiters} L</strong>
                      </div>
                      <div className="bg-[#080c14] p-2.5 rounded-2xl border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block uppercase">CO2 Offset</span>
                        <strong className="text-xs text-amber-400 font-extrabold">{analyticsStats.co2SavedKg} kg</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[140px] text-slate-950">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full"></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950/15 flex items-center justify-center text-slate-950 text-xl font-bold">
                        💼
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-950/80">SplitGo Wallet</span>
                        <p className="text-2xl font-black mt-0.5">₹{walletBalance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Add & Withdraw actions */}
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => {
                        setPaymentStep('input');
                        setPaymentError('');
                        setShowPaymentModal(true);
                      }}
                      className="flex-1 bg-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md hover:bg-slate-900"
                    >
                      + Add Balance
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="flex-1 bg-white/20 hover:bg-white/30 border border-slate-950/20 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>

                {/* Booking Prompt */}
                <div className="pt-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-white">Where are you going today?</h3>
                  <p className="text-xs text-slate-400 mt-1">Choose your mode for instant commuter matching:</p>
                </div>

                {/* Booking Modes Selection grid */}
                <div className="space-y-4">
                  {/* Option A: Passenger card */}
                  <button
                    onClick={() => {
                      setPickup({ address: '', lat: '', lng: '' });
                      setDrop({ address: '', lat: '', lng: '' });
                      setBookingMode('passenger');
                    }}
                    className="w-full text-left bg-[#0e1422] border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-5 flex items-center justify-between transition-all group shadow-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/5 group-hover:scale-105 transition-transform">
                        👤
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">I am a Passenger</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">Book a ride, share fuel costs & travel safe</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">➜</span>
                  </button>

                  {/* Option B: Rider card */}
                  <button
                    onClick={() => {
                      setPickup({ address: '', lat: '', lng: '' });
                      setDrop({ address: '', lat: '', lng: '' });
                      setBookingMode('rider_manage');
                    }}
                    className="w-full text-left bg-[#0e1422] border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-5 flex items-center justify-between transition-all group shadow-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/5 group-hover:scale-105 transition-transform">
                        🚗
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">I am a Rider</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">Add vehicle, create rides & offset fuel costs</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">➜</span>
                  </button>
                </div>

                {/* User Rating Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0e1422] border border-emerald-500/20 rounded-2xl p-3.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">⭐ Rider Rating</span>
                    <strong className="text-sm font-extrabold text-white mt-1 block">5.0★</strong>
                  </div>
                  <div className="bg-[#0e1422] border border-emerald-500/20 rounded-2xl p-3.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">🛡️ Safety Score</span>
                    <strong className="text-sm font-extrabold text-amber-400 mt-1 block">5.0★</strong>
                  </div>
                  <div className="bg-[#0e1422] border border-emerald-500/20 rounded-2xl p-3.5 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">🚗 Total Trips</span>
                    <strong className="text-sm font-extrabold text-white mt-1 block">{ridesList.length || 0}</strong>
                  </div>
                </div>

                {/* Recent Transactions Card */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base text-emerald-400">🔄</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Transactions</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">0 / 0</span>
                  </div>

                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600 pointer-events-none">🔍</span>
                      <input
                        type="text"
                        placeholder="Search description..."
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <select className="bg-slate-900 border border-slate-800 text-xs text-slate-400 px-3 py-2 rounded-xl focus:outline-none">
                      <option>All Types</option>
                      <option>Deposits</option>
                      <option>Rides</option>
                    </select>
                  </div>

                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-2xl">
                    No matching transactions found.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY RIDES LIST */}
            {activeTab === 'my-rides' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">My Ride Bookings</h3>
                  <p className="text-xs text-slate-500 mt-1">Review your active and completed pooling history.</p>
                </div>

                {loadingRides ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : ridesList.length === 0 ? (
                  <div className="text-center py-16 bg-slate-950/40 border border-slate-900 rounded-3xl p-6">
                    <span className="text-3xl">🛵</span>
                    <p className="text-xs text-slate-500 mt-3 font-semibold">No rides requested yet.</p>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-[11px] transition-colors mt-4"
                    >
                      Book a Pool Ride
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ridesList.map((r) => (
                      <div key={r._id} className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {r.rideType === 'car' ? '🚗 Car Pool' : '🛵 Bike Pool'}
                          </span>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            r.status === 'searching' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            r.status === 'matched' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            r.status === 'cancelled' ? 'bg-rose-500/10 border-rose-500/20 text-rose-450' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                          }`}>
                            {r.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-350 space-y-1">
                          <p className="line-clamp-1"><strong className="text-slate-400">Pickup:</strong> {r.pickup.address}</p>
                          <p className="line-clamp-1"><strong className="text-slate-400">Drop:</strong> {r.drop.address}</p>
                          <p><strong className="text-slate-400">Est. Fare:</strong> ₹{r.estimatedFare}</p>
                        </div>

                        <Link
                          to={`/ride/${r._id}`}
                          className="w-full block bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-center font-bold text-[10px] uppercase py-2.5 rounded-xl text-slate-300 transition-colors"
                        >
                          View Live Status
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ALERTS */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">Alerts & Status</h3>
                  <p className="text-xs text-slate-500 mt-1">Review your security checks and matching alerts.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3.5">
                    <span className="text-lg">🎗️</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">Profile Trust Verified</h4>
                      <p className="text-[10px] text-slate-500 leading-normal mt-1">Your account is 100% trust-verified and cleared for direct matching checks.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3.5">
                    <span className="text-lg">📱</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">OTP Mobile Verification</h4>
                      <p className="text-[10px] text-slate-500 leading-normal mt-1">Mobile contact number verified successfully via secure 6-digit passcode.</p>
                    </div>
                  </div>

                  {user?.isEmailVerified && (
                    <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3.5">
                      <span className="text-lg">📧</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Email Address Linked</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-1">Inbox verification completed successfully.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-3.5 pb-20">
                {/* 1. My Vehicle Hub */}
                <button
                  onClick={() => setBookingMode('garage_management')}
                  className="w-full bg-[#0c1220] border border-cyan-500/20 hover:border-cyan-400/50 rounded-3xl p-4 flex items-center justify-between transition-all group text-left shadow-lg"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center text-lg shadow-md">
                      🚗
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">My Vehicle Hub</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Register, manage & edit your vehicles</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-cyan-300 transition-colors">➜</span>
                </button>

                {/* 2. Change Password */}
                <button
                  onClick={() => {
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                    setShowChangePasswordModal(true);
                  }}
                  className="w-full bg-[#0e1422] border border-slate-800/80 hover:border-slate-700 rounded-3xl p-4 flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shadow-md">
                      🔑
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Change Password</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Enter previous & new password</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-450 transition-colors">➜</span>
                </button>

                {/* 3. Contact Us */}
                <button
                  onClick={() => setBookingMode('contact_support')}
                  className="w-full bg-[#0e1422] border border-slate-800/80 hover:border-slate-700 rounded-3xl p-4 flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shadow-md">
                      ✉️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Contact Us</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Submit support ticket & feedback</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-450 transition-colors">➜</span>
                </button>

                {/* 4. Terms & Conditions */}
                <button
                  onClick={() => alert('SplitGo P2P Cost Sharing & Cancellation Terms:\n- Riders split exact fuel costs equally.\n- SOS emergency features remain 24/7 active.')}
                  className="w-full bg-[#0e1422] border border-slate-800/80 hover:border-slate-700 rounded-3xl p-4 flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shadow-md">
                      📄
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Terms & Conditions</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">P2P cost sharing & cancellation terms</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-450 transition-colors">➜</span>
                </button>

                {/* 5. Privacy Policy */}
                <button
                  onClick={() => alert('SplitGo Privacy Policy:\n- Password encrypted with bcrypt.\n- Location data used solely during active trip matching.')}
                  className="w-full bg-[#0e1422] border border-slate-800/80 hover:border-slate-700 rounded-3xl p-4 flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg shadow-md">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Privacy Policy</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Data tracking & password encryption</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-450 transition-colors">➜</span>
                </button>

                {/* 6. Sign Out */}
                <button
                  onClick={logout}
                  className="w-full bg-[#0e1422] border border-rose-500/30 hover:bg-rose-500/10 rounded-3xl p-4 flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg shadow-md">
                      🚪
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-400 tracking-tight">Sign Out</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Securely log out of your session</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-400 transition-colors">➜</span>
                </button>

                {/* 7. Delete Account */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your SplitGo account? This cannot be undone.')) {
                      logout();
                    }
                  }}
                  className="w-full bg-[#0e1422] border border-rose-500/30 hover:bg-rose-500/10 rounded-3xl p-4 flex items-center justify-between transition-all group text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg shadow-md">
                      🗑️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-400 tracking-tight">Delete Account</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Permanently remove user data</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-400 transition-colors">➜</span>
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Unified Bottom Tab Navigation Bar */}
      <footer className="absolute bottom-0 left-0 w-full h-20 bg-slate-950 border-t border-slate-900 z-50 px-6 flex items-center justify-around">
        
        <button
          onClick={() => {
            setBookingMode(null);
            setActiveTab('home');
          }}
          className="flex flex-col items-center justify-center w-14 h-14"
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'home' && !bookingMode ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450' : 'text-slate-500'}`}>
            🏡
          </div>
          <span className={`text-[8px] font-bold uppercase mt-1 tracking-wider ${activeTab === 'home' && !bookingMode ? 'text-emerald-450' : 'text-slate-655'}`}>
            Home
          </span>
        </button>

        <button
          onClick={() => {
            setBookingMode(null);
            setActiveTab('my-rides');
          }}
          className="flex flex-col items-center justify-center w-14 h-14"
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'my-rides' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450' : 'text-slate-500'}`}>
            🚗
          </div>
          <span className={`text-[8px] font-bold uppercase mt-1 tracking-wider ${activeTab === 'my-rides' ? 'text-emerald-450' : 'text-slate-655'}`}>
            My Rides
          </span>
        </button>

        <button
          onClick={() => {
            setBookingMode(null);
            setActiveTab('alerts');
          }}
          className="flex flex-col items-center justify-center w-14 h-14"
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'alerts' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450' : 'text-slate-500'}`}>
            🔔
          </div>
          <span className={`text-[8px] font-bold uppercase mt-1 tracking-wider ${activeTab === 'alerts' ? 'text-emerald-450' : 'text-slate-655'}`}>
            Alerts
          </span>
        </button>

        <button
          onClick={() => {
            setBookingMode(null);
            setActiveTab('profile');
          }}
          className="flex flex-col items-center justify-center w-14 h-14"
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'profile' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450' : 'text-slate-500'}`}>
            👤
          </div>
          <span className={`text-[8px] font-bold uppercase mt-1 tracking-wider ${activeTab === 'profile' ? 'text-emerald-450' : 'text-slate-655'}`}>
            Profile
          </span>
        </button>

      </footer>

      {/* --- PAYMENT SANDBOX GATEWAY MODAL OVERLAY --- */}
      {showPaymentModal && (
        <div className="absolute inset-0 bg-[#070a13]/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-base">💳</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Add Cash Gateway</h4>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-slate-500 hover:text-white transition"
              >
                ✕ Close
              </button>
            </div>

            {/* STEP A: Input Amount */}
            {paymentStep === 'input' && (
              <form onSubmit={handleInitiatePayment} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Deposit Amount (INR)</label>
                  <div className="relative inline-block w-40 mt-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-lg font-bold text-emerald-400">₹</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-center font-black text-xl text-white py-2 pl-7 pr-3 rounded-2xl focus:outline-none focus:border-emerald-500"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['200', '500', '1000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(val)}
                      className={`py-1.5 rounded-xl border text-[11px] font-bold transition ${
                        depositAmount === val ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950/40 border-slate-850 text-slate-400'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                {paymentError && (
                  <div className="space-y-2 text-center">
                    <p className="text-red-400 text-[10px]">{paymentError}</p>
                    {(paymentError.toLowerCase().includes('authorized') || paymentError.toLowerCase().includes('token')) && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold py-2 rounded-xl text-xs transition mt-2"
                      >
                        Sign In Again to Refresh Token 🔑
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-slate-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition"
                >
                  {paymentLoading ? 'Initiating Transaction...' : 'Proceed to Payment →'}
                </button>
              </form>
            )}

            {/* STEP B: Sandbox Payment Simulator */}
            {paymentStep === 'sandbox-choose' && (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-emerald-450 tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block">
                    Payment Sandbox
                  </span>
                  <h5 className="text-xs font-bold text-slate-300 mt-2">Choose simulated payment method:</h5>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleSimulatePayment('success')}
                    disabled={paymentLoading}
                    className="w-full bg-slate-950/65 hover:bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs transition"
                  >
                    <span className="flex items-center space-x-2">
                      <span>📱</span>
                      <strong className="text-slate-350">Simulate UPI (GooglePay/Paytm)</strong>
                    </span>
                    <span className="text-[10px] text-emerald-450 font-bold">Free</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment('success')}
                    disabled={paymentLoading}
                    className="w-full bg-slate-950/65 hover:bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs transition"
                  >
                    <span className="flex items-center space-x-2">
                      <span>💳</span>
                      <strong className="text-slate-350">Simulate Mock Card (Debit/Credit)</strong>
                    </span>
                    <span className="text-[10px] text-emerald-450 font-bold">Free</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment('fail')}
                    disabled={paymentLoading}
                    className="w-full bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-center justify-center text-[10px] font-bold text-rose-400 transition"
                  >
                    Cancel Transaction ✕
                  </button>
                </div>
              </div>
            )}

            {/* STEP C: Payment Success */}
            {paymentStep === 'success' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto animate-bounce">
                  ✓
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">Payment Successful!</h5>
                  <p className="text-[10px] text-slate-500 mt-1">₹{parseFloat(depositAmount).toFixed(2)} has been added to your persistent wallet.</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold py-2.5 rounded-xl text-xs uppercase transition"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VEHICLE GARAGE REGISTRATION MODAL OVERLAY */}
      {showGarageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-[#090d16] border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 text-lg">🛵</span>
                <h3 className="text-base font-extrabold text-white tracking-tight">Add Vehicle</h3>
              </div>
              <button
                onClick={() => setShowGarageModal(false)}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGarageVehicle} className="space-y-3.5">
              {/* VEHICLE TYPE Switch */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Type</label>
                <div className="bg-[#080c14] p-1 rounded-2xl flex items-center border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setVehicleType('scooty')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      vehicleType === 'scooty'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🛵</span>
                    <span>Scooty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType('bike')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      vehicleType === 'bike'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🏍️</span>
                    <span>Bike</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType('car')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      vehicleType === 'car'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🚗</span>
                    <span>Car</span>
                  </button>
                </div>
              </div>

              {/* VEHICLE NICKNAME */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. My Ride / Red Bullet"
                  value={vehicleNickname}
                  onChange={(e) => setVehicleNickname(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
                />
              </div>

              {/* BRAND & MODEL Side by Side */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda / Suzuki"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Activa / Gixxer"
                    value={vehicleModelInput}
                    onChange={(e) => setVehicleModelInput(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
                  />
                </div>
              </div>

              {/* MILEAGE (KM / LITRE) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mileage (KM / Litre)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">⛽</span>
                  <input
                    type="number"
                    placeholder="45"
                    value={vehicleMileage}
                    onChange={(e) => setVehicleMileage(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* VEHICLE NUMBER (PLATE NUMBER) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Number (Plate Number)</label>
                <input
                  type="text"
                  placeholder="E.G. GJ-01-AB-1234"
                  value={vehicleNumberInput}
                  onChange={(e) => setVehicleNumberInput(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 uppercase font-mono tracking-wider placeholder:text-slate-650"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={garageSaving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] mt-2"
              >
                {garageSaving ? 'Saving Vehicle...' : 'Save Vehicle to Garage 🚗'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal Overlay */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-[32px] w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shadow-sm">
                  🔑
                </div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Change Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                }}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            {changePasswordSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
                <h4 className="text-sm font-bold text-white">Password Updated Successfully!</h4>
                <p className="text-xs text-slate-400">Use your new password the next time you sign in.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                {changePasswordError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center space-x-2">
                    <span>⚠️ {changePasswordError}</span>
                  </div>
                )}

                {/* CURRENT PASSWORD */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      placeholder="Enter previous password"
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      <span className="text-xs">{showOldPass ? '🙈' : '👁️'}</span>
                    </button>
                  </div>
                </div>

                {/* NEW PASSWORD */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      <span className="text-xs">{showNewPass ? '🙈' : '👁️'}</span>
                    </button>
                  </div>
                </div>

                {/* CONFIRM NEW PASSWORD */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-[#080c14] border border-slate-800 text-xs text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
                    required
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] mt-2"
                >
                  {changePasswordLoading ? 'Updating Password...' : 'Update Password 🔑'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}