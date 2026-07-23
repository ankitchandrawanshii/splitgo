import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  // Toggle FAQ accordion item
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Custom FAQs list modeled on brumm.in questions but customized for SplitGo
  const faqs = [
    {
      q: 'What is splitgo.in and how does it work?',
      a: 'splitgo.in is a peer-to-peer (P2P) ride pooling platform designed to connect vehicle owners and passengers traveling along the same routes. By sharing rides, commuters can split travel expenses, bypass traffic, and build a trusted commuting community.',
    },
    {
      q: 'Is ride-sharing on splitgo.in safe?',
      a: 'Yes! Safety is our primary concern. SplitGo enforces double OTP verification (both mobile number and email address are verified via secure 6-digit codes) before any user is registered. This creates a fully accountable, trusted community of co-riders.',
    },
    {
      q: 'How are the ride fares calculated?',
      a: 'Fares are calculated dynamically based on distance and pooling vehicle type. Bike Pools carry a base of ₹15 + ₹10/km, while Car Pools carry a base of ₹30 + ₹18/km. When matched, the system splits costs so co-riders save up to 50% on fuel.',
    },
    {
      q: 'How do payments and withdrawals work?',
      a: 'SplitGo calculates cost sharing and splits the fare automatically. Commuters split the petrol cost directly between themselves peer-to-peer, helping offset daily travel expenses safely and budget-friendly.',
    },
  ];

  // Smooth scroll handler for anchor links
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Sticky Header Navigation (Brumm Layout Match) */}
      <header className="sticky top-0 w-full h-20 border-b border-slate-900 bg-[#070a13] z-50 px-6 md:px-12 flex items-center justify-between">
        {/* Brand Logo Left */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-450 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-emerald-400"
            >
              <circle cx="18.5" cy="17.5" r="3.5"></circle>
              <circle cx="5.5" cy="17.5" r="3.5"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            splitgo.in
          </span>
        </div>

        {/* Center Links (Brumm Link Setup) */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
          <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button>
          <button onClick={() => scrollToSection('about-us')} className="hover:text-white transition-colors">About Us</button>
          <button onClick={() => scrollToSection('faqs')} className="hover:text-white transition-colors">FAQs</button>
          <button className="hover:text-white transition-colors cursor-not-allowed opacity-50">Blogs</button>
          <button className="hover:text-white transition-colors cursor-not-allowed opacity-50">Support</button>
        </nav>

        {/* Action Button Right (Brumm CTA style) */}
        <div>
          <Link
            to={user ? '/book' : '/login'}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-emerald-500/10"
          >
            <span>Launch App</span>
            <span className="text-sm font-bold">→</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
        {/* Glow Blobs */}
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-3xl relative z-10 space-y-6 flex flex-col items-center">
          {/* Pulsing Animated Circle */}
          <div className="relative flex items-center justify-center w-20 h-20 mb-2">
            <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping"></div>
            <div className="w-16 h-16 rounded-full bg-emerald-555 flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10 border border-emerald-400/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-white animate-bounce"
              >
                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                <circle cx="15" cy="5" r="1"></circle>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
              </svg>
            </div>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-white">
            splitgo.in
          </h2>

          <p className="text-slate-400 text-sm sm:text-base tracking-widest uppercase font-semibold">
            Short rides, more vibes
          </p>

          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed pt-2">
            Premium mobile-first ride sharing and bike pooling application for smart commuting. Connect directly with co-riders, split fuel, and travel safe.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm pt-6">
            {user ? (
              <Link
                to="/book"
                className="w-full bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-slate-950 font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/15 active:scale-[0.99] transition-all text-sm"
              >
                Go to Booking Dashboard ⚡
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-slate-950 font-bold px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/15 active:scale-[0.99] transition-all text-sm"
                >
                  Start Commuting
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:flex-1 bg-slate-950/40 hover:bg-slate-850 border border-slate-800 text-slate-350 font-semibold px-6 py-4 rounded-2xl text-xs transition"
                >
                  Create Ride Account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6 md:px-12 bg-slate-950/20 border-y border-slate-900/60 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Features</span>
            <h3 className="text-3xl font-extrabold tracking-tight text-white">Why commuting with SplitGo works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 hover:border-emerald-500/30 transition-all hover:translate-y-[-4px] group">
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">🛵</span>
              <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Dual Pooling Modes</h4>
              <p className="text-xs text-slate-450 leading-relaxed">
                Choose **Bike Pool** for solo traffic-cutting speeds, or **Car Pool** for group comfort. Fares scale dynamically to match the mode.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 hover:border-emerald-500/30 transition-all hover:translate-y-[-4px] group">
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">🔒</span>
              <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Verified Accounts</h4>
              <p className="text-xs text-slate-450 leading-relaxed">
                Every user is verified via SMS mobile OTP and email authentication before creating an account, ensuring a trusted environment.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 hover:border-emerald-500/30 transition-all hover:translate-y-[-4px] group">
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">⚡</span>
              <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Fair Cost-Splits</h4>
              <p className="text-xs text-slate-450 leading-relaxed">
                Save up to 50% on fuel costs. The system splits the estimated fare of matching overlap coordinates automatically.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 hover:border-emerald-500/30 transition-all hover:translate-y-[-4px] group">
              <span className="text-3xl block mb-4 group-hover:scale-110 transition-transform">💬</span>
              <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Live Chat & Maps</h4>
              <p className="text-xs text-slate-450 leading-relaxed">
                Coordinate pickup spots with real-time room chats and sync coordinate maps using Leaflet and Socket.io.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 relative">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Roadmap</span>
            <h3 className="text-3xl font-extrabold tracking-tight text-white">How to get started</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-lg group-hover:scale-105 transition-transform">
                01
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Verify & Register</h4>
              <p className="text-[11px] text-slate-500 leading-normal max-w-[180px]">
                Create a password, verify mobile and email OTP, and log in.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-lg group-hover:scale-105 transition-transform">
                02
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pin Locations</h4>
              <p className="text-[11px] text-slate-500 leading-normal max-w-[180px]">
                Select your pickup and drop-off coordinates on the map.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-lg group-hover:scale-105 transition-transform">
                03
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Choose Ride Mode</h4>
              <p className="text-[11px] text-slate-500 leading-normal max-w-[180px]">
                Select Bike or Car mode and watch the fare dynamically recalculate.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm shadow-lg group-hover:scale-105 transition-transform">
                04
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Match & Chat</h4>
              <p className="text-[11px] text-slate-500 leading-normal max-w-[180px]">
                Algorithm pairs you with co-riders. Chat and track them live!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-us" className="py-24 px-6 md:px-12 bg-slate-950/20 border-t border-slate-900/60 relative">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">About splitgo.in</span>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">Short rides, more vibes</h3>
          <p className="text-xs sm:text-sm text-slate-450 leading-relaxed max-w-2xl mx-auto">
            splitgo.in was founded to make daily commuting affordable and social. By matching co-riders heading the same direction, we reduce solo vehicle commutes, alleviate traffic congestion, and lower carbon emissions. We connect drivers and passengers directly so you can offset fuel costs and connect with fellow smart commuters.
          </p>
        </div>
      </section>

      {/* FAQ Accordion Section (Brumm high-fidelity layout match) */}
      <section id="faqs" className="py-24 px-6 md:px-12 bg-[#070a13] border-t border-slate-900/80 relative">
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* Header centered matching image */}
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Green circular Question Mark Icon */}
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 font-bold text-lg mb-1 shadow-lg shadow-emerald-500/10">
              ?
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-slate-400">
              Everything you need to know about peer-to-peer commuting with splitgo.in.
            </p>
          </div>

          {/* Accordion Cards Grid */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#0b1322] border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors">
                      {faq.q}
                    </span>
                    {/* Thin chevron matching image */}
                    <span className={`text-[10px] text-slate-400 font-bold transition-transform duration-300 transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`}>
                      {isOpen ? '∨' : '∨'}
                    </span>
                  </button>

                  {/* FAQ Content Box */}
                  <div
                    className={`transition-all duration-300 ease-in-out px-6 overflow-hidden ${
                      isOpen ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Site Footer (Brumm high-fidelity layout match) */}
      <footer className="border-t border-slate-900/80 bg-[#070a13] py-16 px-6 md:px-12 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          
          {/* Logo & description (Brumm text match) */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center space-x-2.5">
              {/* Green Bike Logo */}
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-450">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-emerald-400"
                >
                  <circle cx="18.5" cy="17.5" r="3.5"></circle>
                  <circle cx="5.5" cy="17.5" r="3.5"></circle>
                  <circle cx="15" cy="5" r="1"></circle>
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
                </svg>
              </div>
              <span className="text-lg font-bold text-white">splitgo.in</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Premium mobile-first ride sharing and carpooling application. Travel budget-friendly, commute smart.
            </p>
          </div>

          {/* Footnotes columns */}
          <div className="flex gap-16 text-xs">
            <div className="space-y-3.5">
              <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Product</h4>
              <ul className="space-y-2 text-slate-500 font-semibold">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-emerald-450 transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-450 transition-colors">How It Works</button></li>
                <li><Link to="/login" className="hover:text-emerald-450 transition-colors">Launch App</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Company</h4>
              <ul className="space-y-2 text-slate-500 font-semibold">
                <li><button onClick={() => scrollToSection('about-us')} className="hover:text-emerald-450 transition-colors">About Us</button></li>
                <li className="hover:text-emerald-450 cursor-not-allowed opacity-50 transition-colors">Blogs</li>
                <li className="hover:text-emerald-450 cursor-not-allowed opacity-50 transition-colors">Support</li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">Legal</h4>
              <ul className="space-y-2 text-slate-500 font-semibold">
                <li className="hover:text-emerald-450 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-emerald-450 cursor-pointer transition-colors">Terms of Service</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900/60 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-wider gap-4">
          <span>&copy; {new Date().getFullYear()} splitgo.in. All rights reserved.</span>
          <span>Short rides, more vibes</span>
        </div>
      </footer>

    </div>
  );
}
