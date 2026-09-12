import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, Zap, Droplets, Paintbrush, Hammer } from "lucide-react";

export default function ServicesDirectoryPage() {
  const categories = [
    { title: "Electrician", icon: Zap, desc: "Wiring, switchboard, fuse repairs & installations." },
    { title: "Plumber", icon: Droplets, desc: "Pipe leaks, tap fixing, bathroom fittings & motors." },
    { title: "Carpenter", icon: Hammer, desc: "Furniture repairs, door alignments & woodwork." },
    { title: "Appliance Repair", icon: Wrench, desc: "AC servicing, refrigerators, washing machines." },
    { title: "Painter", icon: Paintbrush, desc: "Wall touch-ups, interior & exterior painting." },
  ];

  return (
    <AppShell
      title="Local Trade Services"
      subtitle="Public directory of trade skills supported by the platform."
      badge="Public Shell"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{c.desc}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
