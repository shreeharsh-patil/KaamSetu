import React from "react";

interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function BrandIcon({ size = 36, className, ...props }: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 52"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      {/* Brand Squircle Icon (Matches Navbar Button & Escrow Badge) */}
      <rect x="2" y="4" width="44" height="44" rx="12" fill="#2563EB" />

      {/* Stylized 'H' with Trade & Voice Wave Motif */}
      {/* Left Pillar / Wrench Head */}
      <path
        d="M 16 16 L 16 36 M 13 18 L 19 18"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Dynamic Acoustic Bridge */}
      <path
        d="M 16 26 L 21 26 M 24 20 L 24 32 M 27 23 L 27 29 M 27 26 L 32 26"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Right Pillar */}
      <path
        d="M 32 16 L 32 36"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface BrandLogoProps extends React.SVGProps<SVGSVGElement> {
  height?: number;
}

export function BrandLogo({ height = 40, className, ...props }: BrandLogoProps) {
  // Original aspect ratio is 240 / 52 ≈ 4.615
  const width = Math.round((height / 52) * 240);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 52"
      width={width}
      height={height}
      fill="none"
      className={className}
      {...props}
    >
      {/* Brand Squircle Icon (Matches Navbar Button & Escrow Badge) */}
      <rect x="2" y="4" width="44" height="44" rx="12" fill="#2563EB" />

      {/* Stylized 'H' with Trade & Voice Wave Motif */}
      {/* Left Pillar / Wrench Head */}
      <path
        d="M 16 16 L 16 36 M 13 18 L 19 18"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Dynamic Acoustic Bridge */}
      <path
        d="M 16 26 L 21 26 M 24 20 L 24 32 M 27 23 L 27 29 M 27 26 L 32 26"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Right Pillar */}
      <path
        d="M 32 16 L 32 36"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Wordmark: Hunar */}
      <text
        x="56"
        y="27"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="currentColor"
        letterSpacing="-0.4"
      >
        Hunar
      </text>

      {/* Subtitle: Hyperlocal Bazaar */}
      <text
        x="57"
        y="40"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="8.5"
        fontWeight="600"
        fill="#64748B"
        letterSpacing="1.1"
      >
        HYPERLOCAL BAZAAR
      </text>
    </svg>
  );
}
