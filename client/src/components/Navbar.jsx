import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5">
            Log in
          </Link>
          <Link to="/register">
            <Button size="sm" variant="dark" className="font-bold shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-5 pb-5 pt-3 md:hidden shadow-lg">
          <div className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 py-1"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-slate-200" />
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Log in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button fullWidth size="sm" variant="dark">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
