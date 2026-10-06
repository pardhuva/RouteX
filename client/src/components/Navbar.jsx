import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";

const LINKS = [
  { href: "/#dispatch", label: "Real-time Dispatch" },
  { href: "/#fleet", label: "Fleet & Fares" },
  { href: "/#economics", label: "Driver Economics" },
  { href: "/#architecture", label: "Architecture" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Sign in
          </Link>
          <Link to="/register">
            <Button size="sm" variant="dark">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md px-5 pb-5 pt-3 md:hidden shadow-lg">
          <div className="flex flex-col gap-2.5">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 py-1.5"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-slate-200 my-1" />
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 py-1.5"
            >
              Sign in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button fullWidth size="sm" variant="dark">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

