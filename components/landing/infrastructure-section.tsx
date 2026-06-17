"use client";

import { useEffect, useState, useRef } from "react";

const industries = [
  {
    name: "Construction & Earthmoving",
    description: "Excavator arms, bulldozer blades, crane jibs, and loader cylinders take relentless punishment. We keep them running between replacements.",
  },
  {
    name: "Manufacturing & Press",
    description: "Hydraulic presses, injection moulding machines, and die-casting equipment demand consistent cylinder performance across millions of cycles.",
  },
  {
    name: "Agricultural Equipment",
    description: "Tractor lift arms, combine headers, and baler cylinders — we handle rods exposed to grit, moisture, and continuous field use.",
  },
  {
    name: "Mining & Heavy Industry",
    description: "Roof support props, longwall hydraulics, and drill-rig cylinders. Large-diameter, high-pressure components reconditioned to spec.",
  },
  {
    name: "Marine & Offshore",
    description: "Corrosion-resistant plating for steering cylinders, hatch rams, and deck machinery operating in salt-water environments.",
  },
  {
    name: "Automotive & Transport",
    description: "Tipper truck rams, tail lifts, and vehicle hoist cylinders. Fast turnaround to minimise fleet downtime.",
  },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndustry((prev) => (prev + 1) % industries.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="industries" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left */}
          <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Industries
            </span>
            <h2 className="text-4xl lg:text-5xl font-display tracking-tight mb-8">
              Who we
              <br />
              work with.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              Any operation that runs hydraulics runs the risk of rod wear.
              We work across industries — if it has a piston rod, we can
              recondition it.
            </p>

            {/* Active industry detail */}
            <div className="border-l-2 border-foreground/20 pl-6 min-h-[80px] transition-all duration-400">
              <p className="text-base font-medium mb-2">{industries[activeIndustry].name}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {industries[activeIndustry].description}
              </p>
            </div>
          </div>

          {/* Right: list */}
          <div className={`transition-all duration-700 delay-150 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <div className="border border-foreground/10">
              <div className="px-5 py-4 border-b border-foreground/10 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Industries Served</span>
                <span className="flex items-center gap-2 text-xs font-mono text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  All accepted
                </span>
              </div>
              {industries.map((industry, index) => (
                <button
                  key={industry.name}
                  type="button"
                  onClick={() => setActiveIndustry(index)}
                  className={`w-full text-left px-5 py-5 border-b border-foreground/5 last:border-b-0 flex items-center justify-between transition-all duration-300 hover:bg-foreground/[0.02] ${
                    activeIndustry === index ? "bg-foreground/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      activeIndustry === index ? "bg-foreground" : "bg-foreground/20"
                    }`} />
                    <span className="text-sm font-medium">{industry.name}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
