"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-[#102a4c] text-white rounded-3xl relative overflow-hidden h-full min-h-[640px]">
      {/* Subtle background ambient gradient */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top: Logo & Tagline */}
      <div className="relative z-10 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-lg shadow-slate-950/25 group-hover:scale-105 transition-transform">
            <Image src="/brand-logo.png" alt="KaamSetu logo" fill sizes="44px" className="object-contain p-1" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white leading-none">
              Kaam<span className="text-blue-400">Setu</span>
            </span>
            <span className="text-[10px] text-blue-200 tracking-wider uppercase font-medium mt-1">
              Bharat Service Network
            </span>
          </div>
        </Link>

        <div className="space-y-3 pt-4 max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-white">
            Get work done.<br />
            <span className="text-blue-200">Or find work near you.</span>
          </h1>
          <p className="text-sm xl:text-base text-blue-100 leading-relaxed font-normal">
            Trusted local services and skilled technicians without the hassle. Fast matching, background verified, and transparent pricing.
          </p>
        </div>
      </div>

      {/* Center: Real KaamSetu Service Cards */}
      <div className="relative z-10 my-8 space-y-3 max-w-md">
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#183b68] border border-white/15 shadow-lg">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
            <Image
              src="/services/electrician.webp"
              alt="Verified Electrician"
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white truncate">Electrical & Wiring</p>
              <span className="text-xs font-semibold text-blue-300">From ₹299</span>
            </div>
            <p className="text-xs text-blue-100 truncate">MCB repairs, switchboards & inverters</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#183b68] border border-white/15 shadow-lg">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
            <Image
              src="/services/plumber.webp"
              alt="Verified Plumber"
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white truncate">Plumbing & Sanitary</p>
              <span className="text-xs font-semibold text-blue-300">From ₹349</span>
            </div>
            <p className="text-xs text-blue-100 truncate">Pipe repairs, drain jetting & fittings</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#183b68] border border-white/15 shadow-lg">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
            <Image
              src="/services/carpenter.webp"
              alt="Verified Carpenter"
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white truncate">Carpentry & Furniture</p>
              <span className="text-xs font-semibold text-blue-300">From ₹399</span>
            </div>
            <p className="text-xs text-blue-100 truncate">Lock repairs, hinges & furniture assemble</p>
          </div>
        </div>
      </div>

      {/* Bottom: Restrained Trust Guarantee */}
      <div className="relative z-10 pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-[11px] xl:text-xs">Verified Pros</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-medium text-[11px] xl:text-xs">Fast Dispatch</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="font-medium text-[11px] xl:text-xs">Direct Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
