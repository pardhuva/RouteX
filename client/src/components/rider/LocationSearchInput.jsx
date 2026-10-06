import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { searchLocations } from "../../services/geocodingService";

export default function LocationSearchInput({
  label,
  icon: Icon = MapPin,
  iconColor = "text-emerald-600",
  value,
  onChange,
  onSelect,
  placeholder,
  isActive,
  onFocus,
}) {
  const [query, setQuery] = useState(value?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value?.address || "");
  }, [value?.address]);

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeoutId = setTimeout(async () => {
      const results = await searchLocations(query);
      setSuggestions(results);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    onChange({ address: val, coordinates: null });
  };

  const handleSelectSuggestion = (s) => {
    setQuery(s.name);
    setIsOpen(false);
    setSuggestions([]);
    onSelect({
      address: s.address || s.name,
      coordinates: { latitude: s.latitude, longitude: s.longitude },
    });
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    onChange({ address: "", coordinates: null });
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative rounded-xl border p-3 text-left transition-all ${
        isActive
          ? "border-slate-900 bg-slate-50/80 shadow-xs ring-1 ring-slate-900/10"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className={`flex items-center justify-between text-xs font-semibold ${iconColor}`}>
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold text-slate-500">
          <Icon className={`h-3 w-3 ${iconColor}`} /> {label}
        </span>
        {isActive && <span className="text-[10px] text-brand-600 font-bold">Map Target Active</span>}
      </div>

      <div className="relative mt-1.5 flex items-center">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            onFocus?.();
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-14 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 shadow-2xs"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>
          {value?.coordinates
            ? `[${value.coordinates.latitude.toFixed(4)}, ${value.coordinates.longitude.toFixed(4)}]`
            : "Search address or tap map"}
        </span>
        {value?.coordinates && (
          <span className="text-emerald-700 font-bold font-sans">✓ Coordinates Set</span>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-panel text-xs">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Suggested Locations
          </div>
          {suggestions.map((s) => (
            <button
              key={s.id || `${s.latitude}-${s.longitude}`}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-800">{s.name}</div>
                <div className="truncate text-[10px] text-slate-500">{s.address}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
