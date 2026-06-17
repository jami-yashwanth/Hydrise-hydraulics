"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Surface Preparation",
    description:
      "Cleaning, degreasing, and pre-machining the component to ensure a clean, defect-free substrate before any coating is applied.",
  },
  {
    number: "02",
    title: "Precision Masking",
    description:
      "For selective area plating — only the required surfaces are exposed to the chrome bath. All other areas are masked to protect the base metal.",
  },
  {
    number: "03",
    title: "Electroplating",
    description:
      "Uniform chrome deposition under controlled parameters. Components are plated in a temperature-controlled bath at regulated current density for consistent hardness and adhesion.",
  },
  {
    number: "04",
    title: "Post-Processing",
    description:
      "Grinding, polishing, or sizing as per requirement. The chrome surface is finished to the specified dimension and surface quality before leaving the shop floor.",
  },
  {
    number: "05",
    title: "Inspection & Testing",
    description:
      "Hardness, thickness, and surface finish verification before any component leaves our floor. Every job ships with a quality certificate documenting the measurements.",
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
