import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, CheckCircle2, Radio } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form);
      showToast(`Welcome back, ${user.name.split(" ")[0]}!`, "success");
      navigate(`/${user.role}`);
    } catch (err) {
      showToast(getErrorMessage(err, "Invalid email or password."), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Left Pane: Bright Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-none lg:w-[480px] xl:w-[540px] bg-white border-r border-slate-200">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <Logo />
          </Link>

          <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to manage your rides, live GPS dispatches, and RouteX account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
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
              Sign In to RouteX
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{" "}
            <Link to="/register" className="font-bold text-slate-900 hover:text-blue-700 transition-colors underline decoration-slate-300 underline-offset-4">
              Create an account →
            </Link>
          </p>
        </div>
      </div>

      {/* Right Pane: Visual Showcase */}
      <div className="relative hidden flex-1 lg:block overflow-hidden bg-slate-900">
        <img
          src="/images/routex_car.jpg"
          alt="RouteX Mobility"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/20" />

        {/* Floating Quote Card */}
        <div className="absolute bottom-12 left-12 right-12 max-w-lg rounded-2xl border border-slate-200/90 bg-white/95 p-6 backdrop-blur-xl shadow-2xl text-slate-900">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Radio className="h-3 w-3 animate-pulse text-emerald-600" /> Live Across Major Tech Hubs
          </div>
          <blockquote className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
            &ldquo;Your ride. Your time. Your way.&rdquo;
          </blockquote>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            RouteX delivers instant driver pairing, upfront transparent fare calculation, live turn-by-turn vehicle tracking, and 24/7 dedicated safety support.
          </p>

          <div className="mt-5 flex items-center gap-6 border-t border-slate-200 pt-4 text-xs font-medium text-slate-500">
            <div>
              <span className="block text-sm font-black text-slate-900">&lt; 3 mins</span>
              <span>Avg Pickup</span>
            </div>
            <div>
              <span className="block text-sm font-black text-emerald-700">80% Net</span>
              <span>Driver Payout</span>
            </div>
            <div>
              <span className="block text-sm font-black text-slate-900">4.95 ★</span>
              <span>Rider Rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
