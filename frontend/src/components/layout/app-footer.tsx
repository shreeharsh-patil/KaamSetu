"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, ArrowUpRight, Heart } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";

const socialLinks = [
  { href: "https://twitter.com", label: "Twitter", icon: "𝕏" },
  { href: "https://linkedin.com", label: "LinkedIn", icon: "in" },
  { href: "https://github.com", label: "GitHub", icon: "git" },
  { href: "https://instagram.com", label: "Instagram", icon: "ig" },
];

const customerLinks = [
  { href: "/customer/jobs/new", label: "Book a Technician" },
  { href: "/customer/jobs/new?trade=electrical", label: "Master Electricians" },
  { href: "/customer/jobs/new?trade=plumbing", label: "Certified Plumbers" },
  { href: "/customer/jobs/new?trade=carpentry", label: "Woodcraft & Carpenters" },
  { href: "/customer/jobs/new?trade=appliances", label: "AC & Appliance Repair" },
  { href: "/voice-ai", label: "Voice AI Booking (बोलकर बुक करें)" },
];

const workerLinks = [
  { href: "/worker", label: "Worker Partner Portal" },
  { href: "/worker/onboarding", label: "Join as a Verified Pro" },
  { href: "/#guarantees", label: "Zero Commission Guarantee" },
  { href: "/worker/earnings", label: "Instant Daily UPI Payouts" },
  { href: "/#reviews", label: "Technician Stories & Reviews" },
];

export function AppFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-xs text-sm">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 font-semibold text-lg tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <BrandMark size={32} className="h-8 w-8 rounded-md object-cover" />
              </span>
              <span className="font-sans font-bold text-xl">KaamSetu</span>
            </Link>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-xs">
              India&apos;s open, transparent infrastructure connecting homeowners with background-checked blue-collar technicians. Fair wages, zero commission traps, and guaranteed workmanship.
            </p>

            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  aria-label={item.label}
                >
                  {item.icon}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <a href="mailto:support@kaamsetu.in" className="hover:underline text-foreground">
                  support@kaamsetu.in
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: For Customers */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground mb-4">
              For Customers
            </h4>
            <ul className="space-y-2.5">
              {customerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: For Service Workers */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground mb-4">
              For Technicians
            </h4>
            <ul className="space-y-2.5">
              {workerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Trust & Newsletter */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground mb-4">
              Service Updates
            </h4>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Get monthly rate card benchmarks, maintenance safety tips, and local trade announcements.
            </p>
            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                Thank you for subscribing to KaamSetu updates!
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubscribed(true);
                }}
                className="flex flex-col gap-2.5"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-4 py-2.5 text-xs bg-secondary rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-semibold text-white rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-xs"
                >
                  Subscribe to Updates
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Community Governed & Verified Trades</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} KaamSetu Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Rate Standard Guidelines
            </Link>
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
