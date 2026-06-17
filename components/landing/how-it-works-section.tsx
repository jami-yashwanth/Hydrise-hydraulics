"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Intake & Inspection",
    description:
      "Every component is measured and assessed on arrival. We check existing chrome thickness, map surface defects, and confirm the repair path — reconditioning or new manufacture.",
    specs: [
      { label: "Dimensional check", value: "Against OEM drawing or sample" },
      { label: "Surface mapping", value: "Wear, scoring, pitting, corrosion" },
      { label: "Chrome thickness", value: "Measured if previously plated" },
      { label: "Report", value: "Written assessment before we proceed" },
    ],
  },
  {
    number: "02",
    title: "Chrome Stripping & Prep",
    description:
      "Old chrome is removed via reverse electrolysis. The base metal is degreased, cleaned, and pre-ground to eliminate all surface defects before any new coating is applied.",
    specs: [
      { label: "Stripping method", value: "Reverse electrolysis — substrate safe" },
      { label: "Cleaning", value: "Alkaline degrease + ultrasonic" },
      { label: "Pre-grinding", value: "Removes pits, scores, and corrosion" },
      { label: "Masking", value: "Precision masking for selective areas" },
    ],
  },
  {
    number: "03",
    title: "Hard Chrome Electroplating",
    description:
      "Components are plated in a temperature-controlled chrome bath at controlled current density. Plating thickness is built to accommodate final grinding and deliver the specified finish dimension.",
    specs: [
      { label: "Hardness", value: "65–70 HRC post-deposition" },
      { label: "Plating buildup", value: "0.10–0.50mm typical" },
      { label: "Bath control", value: "Temperature & current monitored" },
      { label: "Type", value: "Hard industrial chrome — not decorative" },
    ],
  },
  {
    number: "04",
    title: "Precision Grinding",
    description:
      "After plating, each rod is CNC cylindrically ground to final diameter. We hold ±5 micron on standard jobs and can work to tighter tolerances on request.",
    specs: [
      { label: "Method", value: "CNC cylindrical grinding" },
      { label: "Diameter tolerance", value: "±5μm standard" },
      { label: "Surface finish", value: "Ra ≤ 0.4μm" },
      { label: "Straightness", value: "Verified post-grind" },
    ],
  },
  {
    number: "05",
    title: "Final Inspection & Dispatch",
    description:
      "Hardness, dimensional, and surface finish checks before any component leaves our floor. Every job ships with a quality certificate documenting the measurements.",
    specs: [
      { label: "Hardness test", value: "Rockwell HRC" },
      { label: "Dimensional report", value: "Final measurements recorded" },
      { label: "Surface finish check", value: "Profilometer verified" },
      { label: "Documentation", value: "Quality certificate with every job" },
    ],
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-foreground text-background overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`,
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16 lg:mb-24">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-background/40 mb-6">
              <span className="w-8 h-px bg-background/30" />
              Process
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              How we work.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:flex lg:items-end">
            <p className={`text-background/55 leading-relaxed text-lg transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              A disciplined, five-stage process — from the moment a component
              arrives to the moment it leaves, every step is documented and
              inspected.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Steps list */}
          <div>
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-7 border-b border-background/10 transition-all duration-400 group ${
                  activeStep === index ? "opacity-100" : "opacity-35 hover:opacity-60"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-mono text-sm text-background/30 mt-1 shrink-0">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="text-xl lg:text-2xl font-display mb-2">
                      {step.title}
                    </h3>
                    <p className="text-background/50 text-sm leading-relaxed">
                      {step.description}
                    </p>
                    {activeStep === index && (
                      <div className="mt-5 h-px bg-background/15 overflow-hidden">
                        <div className="h-full bg-background/60 w-0"
                          style={{ animation: "progress 5s linear forwards" }} />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Spec panel */}
          <div className="lg:sticky lg:top-28 self-start">
            <div className="border border-background/15">
              {/* Label row */}
              <div className="px-6 py-4 border-b border-background/10 flex items-center justify-between">
                <span className="text-xs font-mono text-background/35 uppercase tracking-widest">
                  Step {steps[activeStep].number}
                </span>
                <span className="text-xs font-mono text-background/35">
                  {steps[activeStep].title}
                </span>
              </div>

              {/* Spec table */}
              <div className="divide-y divide-background/8">
                {steps[activeStep].specs.map((spec, i) => (
                  <div
                    key={`${activeStep}-${i}`}
                    className="px-6 py-5 grid grid-cols-2 gap-4 spec-row-reveal"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span className="text-xs font-mono text-background/35 uppercase tracking-wider self-center">
                      {spec.label}
                    </span>
                    <span className="text-sm text-background/75 leading-snug">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-background/10 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs font-mono text-background/35">ISO-compliant process</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .spec-row-reveal {
          opacity: 0;
          transform: translateY(6px);
          animation: specReveal 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes specReveal {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
