"use client";

import { AnimatedWave } from "./animated-wave";

const footerLinks = {
  Services: [
    { name: "Hard Chrome Plating", href: "#services" },
    { name: "Piston Rod Reconditioning", href: "#services" },
    { name: "Cylinder Repair & Rebuild", href: "#services" },
    { name: "New Rod Manufacture", href: "#services" },
  ],
  Company: [
    { name: "Our Process", href: "#process" },
    { name: "Industries Served", href: "#industries" },
    { name: "About Us", href: "#about" },
    { name: "Request a Quote", href: "#contact" },
  ],
};

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      <div className="absolute inset-0 h-64 opacity-10 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 lg:gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <a href="#" className="inline-flex items-baseline gap-2 mb-5">
                <span className="text-2xl font-display">Hydrise</span>
                <span className="text-xs text-muted-foreground font-mono">Hydraulics</span>
              </a>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
                Hard chrome plating, hydraulic cylinder manufacturing &amp;
                reconditioning, power packs, and thermal spraying.
                Gajuwaka, Visakhapatnam.
              </p>
              <div className="space-y-1.5">
                <p className="text-sm font-mono text-muted-foreground">+91 77022 03575</p>
                <p className="text-sm font-mono text-muted-foreground">hydrise2k19@gmail.com</p>
                <p className="text-sm font-mono text-muted-foreground/60">
                  Plot No. 94/B, E-Block, Autonagar,<br />
                  Gajuwaka, Visakhapatnam – 530 026
                </p>
              </div>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-6 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © 2025 Hydrise Hydraulics. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Accepting new orders
          </div>
        </div>
      </div>
    </footer>
  );
}
