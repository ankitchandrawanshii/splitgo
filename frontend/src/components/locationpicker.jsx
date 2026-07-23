import { useState, useEffect, useRef } from 'react';

export default function LocationPicker({ label, value, onChange, placeholder, icon }) {
  const [query, setQuery] = useState(value.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  // Keep query local state synced with outer changes (e.g. reverse geocoding from map click)
  useEffect(() => {
    setQuery(value.address || '');
  }, [value.address]);

  const handleQueryChange = (text) => {
    setQuery(text);
    onChange({ ...value, address: text });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&limit=5&countrycodes=in`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const selectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setQuery(place.display_name);
    setSuggestions([]);
    onChange({ address: place.display_name, lat, lng });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setQuery(addr);
            onChange({ address: addr, lat: latitude, lng: longitude });
          } catch (err) {
            onChange({ address: `Current GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, lat: latitude, lng: longitude });
          } finally {
            setSearching(false);
          }
        },
        () => setSearching(false)
      );
    }
  };

  return (
    <div className="relative space-y-1">
      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-1">{label}</label>
      <div className="relative flex items-center">
        {/* Leading Icon */}
        {icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type="text"
          placeholder={placeholder || `Search ${label.toLowerCase()} location...`}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="w-full bg-[#080c14] border border-slate-800 hover:border-slate-700 focus:border-emerald-500 text-slate-100 rounded-2xl pl-10 pr-20 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600 text-xs"
        />
        {/* Action buttons: GPS & Map */}
        <div className="absolute right-2.5 flex items-center space-x-1">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            title="Use current GPS location"
            className="w-7 h-7 rounded-xl bg-slate-900 hover:bg-emerald-500/20 text-emerald-400 border border-slate-800 flex items-center justify-center text-xs transition"
          >
            📍
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl mt-1.5 max-h-52 overflow-y-auto shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              onClick={() => selectSuggestion(place)}
              className="px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors border-b border-slate-800/40 last:border-0"
            >
              <div className="flex items-start space-x-2.5">
                <svg className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-2">{place.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}