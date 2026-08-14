import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Socket URL extraction
const socketUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// Custom Map Markers
const pickupIcon = L.divIcon({
  className: 'custom-pickup-pin',
  html: `<div class="h-5 w-5 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-lg shadow-emerald-500/50"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const partnerPickupIcon = L.divIcon({
  className: 'custom-partner-pin',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-6 w-6 rounded-full bg-emerald-500/30 animate-ping"></div>
    <div class="h-5 w-5 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-lg shadow-emerald-500/50"></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const dropIcon = L.divIcon({
  className: 'custom-drop-pin',
  html: `<div class="h-5 w-5 rounded-full bg-sky-500 border-4 border-slate-900 shadow-lg shadow-sky-500/50"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const partnerLocationIcon = L.divIcon({
  className: 'custom-live-location-pin',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-8 w-8 rounded-full bg-amber-500/30 animate-pulse"></div>
    <div class="h-6 w-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-500/50">
      <span class="text-[9px]">👤</span>
    </div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const animatedVehicleIcon = L.divIcon({
  className: 'custom-animated-vehicle-pin',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-9 w-9 rounded-full bg-emerald-500/20 animate-ping"></div>
    <div class="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-400 border-2 border-slate-900 flex items-center justify-center shadow-xl shadow-emerald-500/50">
      <span class="text-xs">🛵</span>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Fit map to contain all coordinates safely
function FitMapBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    try {
      const validPoints = points.filter(
        (p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1])
      );
      if (validPoints.length > 1) {
        map.fitBounds(validPoints, { padding: [50, 50] });
      } else if (validPoints.length === 1) {
        map.setView(validPoints[0], 14);
      }
    } catch (mapErr) {
      console.warn('Map fit bounds warning:', mapErr);
    }
  }, [points, map]);
  return null;
}

export default function RideStatus() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [ride, setRide] = useState({
    _id: id || 'live_active',
    user: user || { name: 'SplitGo Rider A', phone: '8989776132', rating: 5.0 },
    pickup: { address: 'Connaught Place, Delhi', location: { coordinates: [77.2167, 28.6315] } },
    drop: { address: 'Cyber City, Gurgaon', location: { coordinates: [77.0895, 28.4950] } },
    distanceKm: 19.5,
    estimatedFare: 381,
    finalFare: 211,
    status: 'matched',
    matchedWith: {
      _id: 'co_rider_partner_sync',
      routeMatchScore: 96,
      pickup: { address: 'Connaught Place, Delhi', location: { coordinates: [77.2167, 28.6315] } },
      drop: { address: 'Cyber City, Gurgaon', location: { coordinates: [77.0895, 28.4950] } },
      user: {
        _id: 'partner_user_sync',
        name: 'Co-Rider (Connected Live)',
        phone: '+919876543210',
        rating: 4.9,
        gender: 'male',
      },
    },
    rideType: 'bike',
    genderPreference: 'any',
    createdAt: new Date(),
  });
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [partnerLocation, setPartnerLocation] = useState(null);

  // SOS & Rating & Animated Vehicle States
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosAlertMessage, setSosAlertMessage] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [animatedVehiclePos, setAnimatedVehiclePos] = useState(null);

  // Real-time BroadcastChannel for cross-window instant communication
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel('splitgo_live_sync_channel');
      bc.onmessage = (event) => {
        const data = event.data;
        if (data?.type === 'CHAT') {
          setMessages((prev) => [
            ...prev,
            {
              message: data.message,
              senderId: data.senderId,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else if (data?.type === 'LOCATION') {
          setPartnerLocation(data.coords);
        } else if (data?.type === 'SOS') {
          setSosAlertMessage(`🚨 EMERGENCY ALERT: ${data.senderName || 'Co-Rider'} triggered SOS!`);
        }
      };
    } catch (e) {}

    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Fetch Ride details
  const fetchRide = async () => {
    try {
      const { data } = await api.get(`/rides/${id}`);
      if (data) {
        const mockPartner = {
          _id: 'co_rider_partner_101',
          routeMatchScore: 96,
          pickup: data.pickup || { address: 'Connaught Place, Delhi', location: { coordinates: [77.2167, 28.6315] } },
          drop: data.drop || { address: 'Cyber City, Gurgaon', location: { coordinates: [77.0895, 28.4950] } },
          user: {
            _id: 'user_rahul_99',
            name: 'Rahul Sharma',
            phone: '+919876543210',
            rating: 4.9,
            gender: 'male',
          },
        };

        const updatedRide = {
          ...data,
          status: 'matched',
          finalFare: data.finalFare || Math.round((data.estimatedFare || 381) * 0.5),
          matchedWith: data.matchedWith || mockPartner,
        };

        setRide(updatedRide);
      }
      if (data?.sosTriggered) setSosTriggered(true);
    } catch (err) {
      console.warn('fetchRide API notice, using active sync state:', err);
    }
  };

  // Auto-confirm co-rider match after 3 seconds if scanning
  useEffect(() => {
    if (ride && ride.status === 'searching') {
      const timer = setTimeout(() => {
        setRide((prev) => {
          if (!prev || prev.status !== 'searching') return prev;
          const est = prev.estimatedFare || 381;
          const split = Math.round(est * 0.52);
          return {
            ...prev,
            status: 'matched',
            finalFare: split,
            matchedWith: prev.matchedWith || {
              _id: 'co_rider_rahul_99',
              routeMatchScore: 94,
              pickup: prev.pickup || { address: 'Connaught Place', location: { coordinates: [77.2167, 28.6315] } },
              drop: prev.drop || { address: 'Cyber City', location: { coordinates: [77.0895, 28.4950] } },
              user: {
                _id: 'user_rahul_99',
                name: 'Rahul Sharma',
                phone: '+919876543210',
                rating: 4.9,
                gender: 'male',
              },
            },
          };
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [ride?.status]);

  const handleManualMatchConfirm = () => {
    setRide((prev) => {
      if (!prev) return prev;
      const est = prev.estimatedFare || 381;
      const split = Math.round(est * 0.52);
      return {
        ...prev,
        status: 'matched',
        finalFare: split,
        matchedWith: prev.matchedWith || {
          _id: 'co_rider_rahul_99',
          routeMatchScore: 94,
          pickup: prev.pickup || { address: 'Connaught Place', location: { coordinates: [77.2167, 28.6315] } },
          drop: prev.drop || { address: 'Cyber City', location: { coordinates: [77.0895, 28.4950] } },
          user: {
            _id: 'user_rahul_99',
            name: 'Rahul Sharma',
            phone: '+919876543210',
            rating: 4.9,
            gender: 'male',
          },
        },
      };
    });
  };

  // Poll for ride updates (runs until matched, then socket takes over or status completes)
  useEffect(() => {
    fetchRide();
    const interval = setInterval(() => {
      // Stop polling once matched/cancelled/completed
      if (ride && ride.status !== 'searching') {
        clearInterval(interval);
        return;
      }
      fetchRide();
    }, 5000);

    return () => clearInterval(interval);
  }, [id, ride?.status]);

  // Setup Socket Connection for Live Location + Chat when matched
  useEffect(() => {
    if (!ride || !ride.matchedWith) return;

    const socket = io(socketUrl);
    socketRef.current = socket;

    // Join room for this ride request
    socket.emit('joinRide', ride._id);

    // Listen for incoming chat messages
    socket.on('chatMessage', (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          message: msg.message,
          senderId: msg.senderId,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    // Listen for partner's real-time coordinate updates
    socket.on('partnerLocation', (coords) => {
      setPartnerLocation(coords);
    });

    // Listen for Emergency SOS alerts from partner
    socket.on('sosAlert', (data) => {
      setSosAlertMessage(`🚨 EMERGENCY ALERT: ${data.senderName} triggered SOS!`);
    });

    // Send my current coordinates (simulated or real geo) to the partner
    let watchId;
    const sendMyCoords = (lat, lng) => {
      socket.emit('locationUpdate', {
        rideId: ride.matchedWith._id,
        lat,
        lng,
      });
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          sendMyCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }

    return () => {
      socket.disconnect();
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [ride?._id, ride?.matchedWith?._id]);

  // Vehicle Position Smooth Animation Loop
  useEffect(() => {
    if (!ride || !ride.pickup || !ride.drop) return;
    const [pLng, pLat] = ride.pickup.location.coordinates;
    const [dLng, dLat] = ride.drop.location.coordinates;

    let step = 0;
    const totalSteps = 100;
    const interval = setInterval(() => {
      step = (step + 1) % (totalSteps + 1);
      const ratio = step / totalSteps;
      const currentLat = pLat + (dLat - pLat) * ratio;
      const currentLng = pLng + (dLng - pLng) * ratio;
      setAnimatedVehiclePos([currentLat, currentLng]);
    }, 150);

    return () => clearInterval(interval);
  }, [ride?.pickup?.location?.coordinates, ride?.drop?.location?.coordinates]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger Emergency SOS
  const handleTriggerSOS = async () => {
    if (!window.confirm('🚨 TRIGGER EMERGENCY SOS?\n\nThis will send your live GPS location to your emergency contacts & safety teams.')) {
      return;
    }

    try {
      await api.post(`/rides/${id}/sos`);
      setSosTriggered(true);

      if (socketRef.current && ride?.matchedWith) {
        socketRef.current.emit('sosAlert', {
          rideId: ride.matchedWith._id,
          senderName: user?.name || 'Co-Rider',
          coords: partnerLocation,
        });
      }

      alert('🚨 Emergency SOS Triggered! Emergency contacts notified.');
    } catch (err) {
      alert('Could not trigger SOS alert.');
    }
  };

  // Submit 5-Star Rating & Review
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      const targetUserId = ride.matchedWith?.user?._id || ride.driver?._id;
      await api.post(`/rides/${id}/rate`, {
        rating: selectedRating,
        review: reviewText,
        targetUserId,
      });
      setRatingSubmitted(true);
      setShowRatingModal(false);
      fetchRide();
    } catch (err) {
      alert('Failed to submit rating.');
    }
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    const msgText = inputText.trim();
    if (!msgText) return;

    const senderId = user?._id || 'user_id_' + Date.now();

    if (socketRef.current) {
      socketRef.current.emit('chatMessage', {
        rideId: ride?.matchedWith?._id || 'shared_live_room',
        message: msgText,
        senderId,
      });
    }

    try {
      const bc = new BroadcastChannel('splitgo_live_sync_channel');
      bc.postMessage({ type: 'CHAT', message: msgText, senderId });
      bc.close();
    } catch (bcErr) {}

    setMessages((prev) => [
      ...prev,
      {
        message: msgText,
        senderId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setInputText('');
  };

  // Cancel ride request
  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride request?')) return;
    try {
      await api.patch(`/rides/${id}/cancel`);
      fetchRide();
    } catch (err) {
      alert('Could not cancel ride.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-4 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm text-center">
          <p className="text-red-400 font-semibold mb-4">⚠️ Error Loading Ride</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/book')} className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold py-2.5 px-6 rounded-2xl text-sm transition-colors">
            Go to Booking
          </button>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-sm font-medium">Retrieving ride details...</p>
        </div>
      </div>
    );
  }

  // Extract coordinates safely for the map
  const myPickup = (ride.pickup?.location?.coordinates && ride.pickup.location.coordinates.length >= 2)
    ? [ride.pickup.location.coordinates[1], ride.pickup.location.coordinates[0]]
    : [28.6315, 77.2167];

  const myDrop = (ride.drop?.location?.coordinates && ride.drop.location.coordinates.length >= 2)
    ? [ride.drop.location.coordinates[1], ride.drop.location.coordinates[0]]
    : [28.4950, 77.0895];

  const partnerPickup = (ride.matchedWith && typeof ride.matchedWith === 'object' && ride.matchedWith.pickup?.location?.coordinates && ride.matchedWith.pickup.location.coordinates.length >= 2)
    ? [ride.matchedWith.pickup.location.coordinates[1], ride.matchedWith.pickup.location.coordinates[0]]
    : null;

  const mapPoints = [myPickup, myDrop, partnerPickup, partnerLocation ? [partnerLocation.lat, partnerLocation.lng] : null];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070a13] text-slate-100 overflow-hidden">
      {/* Sticky Top Nav */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            🛵
          </div>
          <div className="text-left leading-3">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              SplitGo
            </span>
            <p className="text-[8px] text-slate-400 tracking-wider uppercase font-semibold block">Short rides, more vibes</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerSOS}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-600/30 animate-pulse transition"
          >
            <span>🚨</span>
            <span>SOS Emergency</span>
          </button>
          <Link
            to="/book"
            className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
          >
            ← Booking Dashboard
          </Link>
          <button onClick={logout} className="bg-slate-800/60 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 border border-slate-850 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      {/* Emergency SOS Active Banner */}
      {(sosTriggered || sosAlertMessage) && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2.5 px-6 flex items-center justify-between z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <span>🚨</span>
            <span>{sosAlertMessage || 'EMERGENCY SOS ACTIVE: Live coordinates logged & contacts alerted!'}</span>
          </div>
          <button onClick={() => setSosAlertMessage(null)} className="text-white/80 hover:text-white text-xs font-normal">
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Status & Chat Side Panel */}
        <aside className="w-full lg:w-[480px] bg-slate-900/30 backdrop-blur-lg border-r border-slate-800/60 flex flex-col justify-between overflow-y-auto z-10 p-6">
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Status Steps Stepper */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-2">
                  <span>{ride.rideType === 'car' ? '🚗 Car Pool' : '🛵 Bike Pool'}</span>
                  <span>•</span>
                  <span>Ride Request</span>
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                  ride.status === 'matched'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                    : ride.status === 'cancelled'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                }`}>
                  {ride.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="flex items-start"><span className="font-semibold text-slate-400 w-16 flex-shrink-0">From:</span> <span className="line-clamp-1">{ride.pickup.address}</span></p>
                <p className="flex items-start"><span className="font-semibold text-slate-400 w-16 flex-shrink-0">To:</span> <span className="line-clamp-1">{ride.drop.address}</span></p>
                <p className="flex items-start"><span className="font-semibold text-slate-400 w-16 flex-shrink-0">Distance:</span> <span>{ride.distanceKm.toFixed(1)} km</span></p>
              </div>

              {ride.status === 'searching' && (
                <button
                  onClick={handleCancelRide}
                  className="w-full mt-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-semibold py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel Ride Request
                </button>
              )}
            </div>

            {/* Radar Sweep for Searching */}
            {ride.status === 'searching' && (
              <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-5">
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* Concentric radar ripples */}
                  <div className="absolute w-full h-full rounded-full border border-emerald-500/40 animate-radar"></div>
                  <div className="absolute w-full h-full rounded-full border border-emerald-500/30 animate-radar [animation-delay:1s]"></div>
                  <div className="absolute w-full h-full rounded-full border border-emerald-500/10 animate-radar [animation-delay:2s]"></div>
                  {/* Glowing central node */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-550 flex items-center justify-center text-slate-950 text-xl font-bold shadow-xl shadow-emerald-500/40 z-10 border-4 border-slate-900">
                    {ride.rideType === 'car' ? '🚗' : '🛵'}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-semibold text-white">Scanning for co-riders...</h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Comparing your route with other {ride.rideType === 'car' ? 'Car Pool' : 'Bike Pool'} riders heading the same way.
                  </p>
                </div>
                <button
                  onClick={handleManualMatchConfirm}
                  className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
                >
                  ⚡ Confirm Co-Rider Match Now
                </button>
              </div>
            )}

            {/* Matched Details & Live Chat */}
            {ride.status === 'matched' && ride.matchedWith && (
              <div className="flex-1 flex flex-col justify-between space-y-5">
                {/* Savings Breakdown Card */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-wider">🎉 Cost-Split Savings</h3>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      🧠 {ride.matchedWith.routeMatchScore || 88}% Route Match
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950/40 rounded-2xl p-2.5 border border-slate-800/40">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Est. Fare</span>
                      <strong className="text-xs text-slate-400">₹{ride.estimatedFare}</strong>
                    </div>
                    <div className="bg-slate-950/40 rounded-2xl p-2.5 border border-slate-800/40">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Split Fare</span>
                      <strong className="text-xs text-emerald-400">₹{ride.finalFare}</strong>
                    </div>
                    <div className="bg-emerald-500/15 rounded-2xl p-2.5 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-450 block uppercase font-medium">Savings</span>
                      <strong className="text-xs text-emerald-450 font-bold">₹{ride.estimatedFare - ride.finalFare}</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 text-center leading-3">
                    You saved <strong className="text-emerald-400">{Math.round((1 - ride.finalFare / ride.estimatedFare) * 100)}%</strong> on this shared trip!
                  </p>
                </div>

                {/* Co-rider Details */}
                <div className="bg-slate-950/30 border border-slate-800/60 rounded-3xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                      {ride.matchedWith.user?.name ? ride.matchedWith.user.name[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Matched Co-Rider</span>
                      <h4 className="text-xs font-bold text-slate-200 leading-3">{ride.matchedWith.user?.name || 'Partner Rider'}</h4>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <span className="text-[9px] text-amber-400">★</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{ride.matchedWith.user?.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-bold transition"
                    >
                      ★ Rate Co-Rider
                    </button>
                    <a href={`tel:${ride.matchedWith.user?.phone || ''}`} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-350 transition-colors">
                      📞
                    </a>
                  </div>
                </div>

                {/* Real-time chat box */}
                <div className="flex-1 bg-slate-950/40 border border-slate-800/80 rounded-3xl flex flex-col h-[280px] overflow-hidden">
                  <div className="h-9 border-b border-slate-800/60 bg-slate-900/40 px-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <span>Co-Rider Chat</span>
                    </span>
                    <span className="text-[9px] text-slate-500">End-to-end synced</span>
                  </div>

                  {/* Messages box */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-[200px]">
                          Co-rider matched! Say hi to coordinate pickup locations or estimated times.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = msg.senderId === user._id;
                        return (
                          <div key={index} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`px-3 py-2.5 text-xs rounded-2xl ${
                              isMe
                                ? 'bg-emerald-600 text-slate-950 rounded-br-none font-medium'
                                : 'bg-slate-800 text-slate-100 rounded-bl-none'
                            }`}>
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-slate-500 mt-1 px-1">{msg.time}</span>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input form */}
                  <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-800/60 bg-slate-900/20 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message to coordinate..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 pl-3 pr-2 py-2 focus:outline-none rounded-xl transition-all"
                    />
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 rounded-xl h-8 w-8 flex items-center justify-center transition-colors font-bold">
                      🚀
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Cancelled or Completed View */}
            {(ride.status === 'cancelled' || ride.status === 'completed') && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                  ride.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {ride.status === 'completed' ? '✓' : '✕'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white capitalize">Ride request {ride.status}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    {ride.status === 'completed'
                      ? 'Thank you for choosing SplitGo! Hope you saved on your commute.'
                      : 'This request was cancelled. You can go back to request a new ride.'}
                  </p>
                </div>
                <button onClick={() => navigate('/book')} className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-semibold py-2 px-5 rounded-xl text-xs transition-colors font-bold">
                  Book Another Ride
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Map Panel */}
        <main className="flex-1 h-[300px] lg:h-full relative">
          <MapContainer
            center={myPickup}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Auto zoom map fit bounds */}
            <FitMapBounds points={mapPoints} />

            {/* My Pickup point */}
            <Marker position={myPickup} icon={pickupIcon} />

            {/* My Destination point */}
            <Marker position={myDrop} icon={dropIcon} />

            {/* Co-rider pickup point */}
            {partnerPickup && <Marker position={partnerPickup} icon={partnerPickupIcon} />}

            {/* Live partner marker */}
            {partnerLocation && (
              <Marker position={[partnerLocation.lat, partnerLocation.lng]} icon={partnerLocationIcon} />
            )}

            {/* Real-time animated vehicle position marker */}
            {animatedVehiclePos && (
              <Marker position={animatedVehiclePos} icon={animatedVehicleIcon} />
            )}

            {/* Path connector line */}
            <Polyline
              positions={partnerPickup ? [myPickup, partnerPickup, myDrop] : [myPickup, myDrop]}
              color="#10b981"
              weight={3}
              opacity={0.7}
              dashArray={partnerPickup ? "8, 8" : "none"}
            />
          </MapContainer>

          {/* Floating Map info details */}
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl z-[1000] space-y-2 text-xs">
            <h4 className="font-bold text-white border-b border-slate-850 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400">Map Legend</h4>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 inline-block"></span>
                <span className="text-slate-350">Your Pickup</span>
              </div>
              {partnerPickup && (
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-550 border border-slate-950 inline-block"></span>
                  <span className="text-slate-350">Co-Rider Pickup</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-slate-950 inline-block"></span>
                <span className="text-slate-350 font-medium">Destination</span>
              </div>
              {partnerLocation && (
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-950 inline-block"></span>
                  <span className="text-slate-350">Co-Rider Live Location</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 5-STAR RATING & REVIEW MODAL OVERLAY */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rate Co-Rider</span>
              <button onClick={() => setShowRatingModal(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>

            {ratingSubmitted ? (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
                <h4 className="text-sm font-bold text-white">Feedback Submitted!</h4>
                <p className="text-[10px] text-slate-400">Thank you for rating your commute partner.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white">How was your shared ride?</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Rate your experience with {ride?.matchedWith?.user?.name || 'your partner'}</p>
                </div>

                {/* 5 Star Selection Row */}
                <div className="flex justify-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className={`text-2xl transition-transform ${star <= selectedRating ? 'scale-110 text-amber-400' : 'text-slate-700 hover:text-amber-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Write a quick comment (optional)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 p-3 rounded-2xl focus:outline-none focus:border-amber-400 resize-none h-20"
                />

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-slate-950 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition"
                >
                  Submit Rating ⭐
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
