import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, ArrowRight, Car, UserRound, Check, Wallet, Sparkles } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

const ROLES = [
  { value: "rider", label: "Rider", description: "Book trips & track live GPS", icon: UserRound },
  { value: "driver", label: "Driver Partner", description: "Drive & earn 80% split", icon: Car },
];

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "rider" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (!/^[0-9]{10}$/.test(form.phone)) next.phone = "Phone number must be a valid 10-digit number";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register(form);
      showToast(`Welcome to RouteX, ${user.name.split(" ")[0]}!`, "success");
      navigate(`/${user.role}`);
    } catch (err) {
      showToast(getErrorMessage(err, "Registration failed. Please try again."), "error");
    } finally {
      setLoading(false);
    }
  }

  const isDriver = form.role === "driver";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Left Column: Bright Register Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:flex-none lg:w-[500px] xl:w-[560px] bg-white border-r border-slate-200 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <Logo />
          </Link>

          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Join the RouteX urban mobility network in seconds.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {/* Role Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">I am registering as</label>
              <div className="grid grid-cols-2 gap-2.5">
                {ROLES.map((role) => {
                  const isSelected = form.role === role.value;
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => update("role", role.value)}
                      className={`relative rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                      <Icon className={`h-4 w-4 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                      <div className={`mt-1.5 text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>{role.label}</div>
                      <div className={`text-[10px] leading-tight mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{role.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Venkateswara Rao"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number (10 digits)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              variant="dark"
              fullWidth
              loading={loading}
              className="mt-2 py-3 shadow-md font-bold"
            >
              Complete Registration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-slate-900 hover:text-emerald-700 transition-colors underline decoration-slate-300 underline-offset-4">
              Sign in →
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Dynamic Visual depending on role */}
      <div className="relative hidden flex-1 lg:block overflow-hidden bg-slate-900">
        <img
          src={isDriver ? "/images/routex_driver.jpg" : "/images/routex_car.jpg"}
          alt={isDriver ? "RouteX Partner Driver" : "RouteX Mobility"}
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/20" />

        {/* Dynamic Card for Driver vs Rider */}
        <div className="absolute bottom-12 left-12 right-12 max-w-lg rounded-2xl border border-slate-200/90 bg-white/95 p-6 backdrop-blur-xl shadow-2xl text-slate-900">
          {isDriver ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
                <Wallet className="h-3.5 w-3.5 text-blue-600" /> Keep 80% of Every Fare
              </div>
              <h3 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
                Earn with dignity and transparent payouts.
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Direct bank deposit every Monday, smart geospatial dispatch with zero uncompensated mileage, and real-time earnings analytics.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-800 font-semibold">
                <Check className="h-4 w-4 text-blue-600 stroke-[3]" /> Weekly ISO calendar settlement
                <span className="text-slate-300">•</span>
                <Check className="h-4 w-4 text-blue-600 stroke-[3]" /> Flexible hours
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Transparent Upfront Pricing
              </div>
              <h3 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
                &ldquo;Your ride. Your time. Your way.&rdquo;
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Connect with verified top-rated drivers, enjoy transparent pricing with zero surge surprises, and get 24/7 dedicated safety support.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-800 font-semibold">
                <Check className="h-4 w-4 text-blue-600 stroke-[3]" /> Zero hidden surge fees
                <span className="text-slate-300">•</span>
                <Check className="h-4 w-4 text-blue-600 stroke-[3]" /> 100% verified drivers
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
