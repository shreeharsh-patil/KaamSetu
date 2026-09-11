export const siteConfig = {
  name: "KaamSetu",
  title: "KaamSetu | Hyperlocal Skilled-Worker Marketplace",
  description:
    "India's voice-first hyperlocal platform connecting skilled professionals—electricians, plumbers, carpenters, technicians—with verified customers.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  locale: "en-IN",
  supportedLocales: ["en", "hi", "mr", "gu", "ta", "te", "bn"],
  links: {
    github: "https://github.com",
    docs: "/docs",
  },
  roles: [
    {
      id: "customer",
      name: "Customer",
      badge: "Hire Pro",
      description: "Book verified local tradespeople, track active tasks, and pay securely.",
      path: "/customer",
    },
    {
      id: "worker",
      name: "Skilled Worker",
      badge: "Earn Daily",
      description: "Receive nearby jobs, voice-guided instructions, and direct payouts.",
      path: "/worker",
    },
    {
      id: "admin",
      name: "Platform Admin",
      badge: "Governance",
      description: "Manage disputes, verify tradesperson credentials, and monitor metrics.",
      path: "/admin",
    },
  ],
};

export type SiteConfig = typeof siteConfig;
