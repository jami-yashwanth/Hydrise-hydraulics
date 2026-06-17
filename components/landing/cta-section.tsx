"use client";

import { useEffect, useRef, useState } from "react";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`border border-foreground transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="px-8 lg:px-16 py-14 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              {/* Left */}
              <div>
                <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
                  <span className="w-8 h-px bg-foreground/30" />
                  Contact Us
                </span>
                <h2 className="text-4xl lg:text-5xl font-display tracking-tight mb-6 leading-tight">
                  Ready to get
                  <br />
                  your component plated?
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Call or message us with your part details — diameter,
                  length, condition, and quantity. We'll come back with a
                  price and turnaround time.
                </p>
              </div>

              {/* Right: contact details */}
              <div className="space-y-px">
                <a
                  href="tel:+917702203575"
                  className="group flex items-center justify-between px-8 py-7 border border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-300"
                >
                  <div>
                    <p className="text-xs font-mono text-muted-foreground group-hover:text-background/60 uppercase tracking-wider mb-1">Phone / WhatsApp</p>
                    <p className="text-2xl lg:text-3xl font-display tracking-tight">+91 77022 03575</p>
                  </div>
                  <span className="font-mono text-muted-foreground group-hover:text-background/60 text-sm">→</span>
                </a>

                <a
                  href="mailto:hydrise2k19@gmail.com"
                  className="group flex items-center justify-between px-8 py-7 border border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-300"
                >
                  <div>
                    <p className="text-xs font-mono text-muted-foreground group-hover:text-background/60 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-xl lg:text-2xl font-display tracking-tight">hydrise2k19@gmail.com</p>
                  </div>
                  <span className="font-mono text-muted-foreground group-hover:text-background/60 text-sm">→</span>
                </a>

                <div className="px-8 py-6 border border-foreground/10 space-y-3">
                  <div>
                    <p className="text-sm font-medium">J. Venkata Rao</p>
                    <p className="text-xs font-mono text-muted-foreground">Proprietor, Hydrise Hydraulics</p>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                    Plot No. 94/B, E-Block, Autonagar,<br />
                    Gajuwaka, Visakhapatnam – 530 026
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-foreground/10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-foreground/10" />
        </div>
      </div>
    </section>
  );
}
