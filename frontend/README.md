# KaamSetu — Frontend Application

Next.js 16 + React 19 + TypeScript + Tailwind CSS production frontend for the KaamSetu Hyperlocal Skilled-Worker Service Platform.

## Architecture Overview

- **Framework**: Next.js 16.x App Router
- **UI Runtime**: React 19.x
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS + Custom Design Tokens (OKLCH/HSL)
- **Icons**: Lucide Icons
- **Server State**: TanStack Query (React Query)
- **Validation**: Zod (environment & data schemas)
- **Agents & Skills**: Localized `.agents/skills` repository mirroring for direct agent assistance

## Directory Structure

```text
frontend/
├── .agents/
│   └── skills/                 # Design & architectural skills available locally
├── public/                     # Static assets, icons, manifest
├── src/
│   ├── app/                    # Next.js App Router (Layouts, Pages, Error Boundaries)
│   │   ├── (public)/           # Public exploration routes
│   │   ├── (auth)/             # Phone OTP authentication routes
│   │   ├── customer/           # Customer portal shell
│   │   ├── worker/             # Worker portal shell
│   │   └── admin/              # Admin console shell
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives (Button, Card, Badge, Spinner)
│   │   ├── layout/             # Structural wrappers (Container, Header, Footer, Shell)
│   │   └── feedback/           # Error, Loading, Offline, Unauthorized states
│   ├── config/                 # Zod validated env and platform metadata
│   ├── features/               # Modular business feature packages
│   ├── hooks/                  # Custom React hooks (online status, mounting)
│   ├── lib/                    # Helpers, cn utility, constants
│   ├── providers/              # Root, Query, Theme, and Network providers
│   ├── styles/                 # globals.css with semantic color tokens
│   └── types/                  # Global TypeScript definitions
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Quality Checks
```bash
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint check
npm run build        # Production Next.js build
```
