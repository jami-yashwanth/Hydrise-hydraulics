"use client";

import { useEffect, useRef, useState } from "react";

const services = [
  {
    number: "01",
    title: "Hard Chrome Plating",
    description:
      "Electrodeposited hard chrome coating reaching 65–70 HRC surface hardness. Exceptional wear resistance, corrosion protection, and low-friction performance — essential for hydraulic rods, shafts, and plungers operating under continuous load and high-pressure cycling.",
    tags: ["Piston Rods", "Valve Spools", "Plungers", "Shafts"],
  },
  {
    number: "02",
    title: "Piston Rod Reconditioning",
    description:
      "Worn, scored, or pitted rods stripped back to bare metal, pre-machined to remove all surface defects, re-plated with hard chrome, and precision ground to original OEM diameter. Most rods can be reconditioned multiple times — delivering near-new performance at up to 70% less than replacement cost.",
    tags: ["Chrome Stripping", "Re-plating", "OEM Tolerances", "Faster Than New"],
  },
  {
    number: "03",
    title: "Hydraulic Cylinder Repair",
    description:
      "Full cylinder teardown, bore honing, new seal fitment, rod re-chroming, and reassembly. We restore leaking or damaged cylinders to original operating pressure — without the lead time or cost of a new unit.",
    tags: ["Bore Honing", "Seal Replacement", "Rod Re-chrome", "Pressure Testing"],
  },
];

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group border-b border-foreground/10 py-10 lg:py-14 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-12">
        {/* Number */}
        <div className="lg:col-span-1">
          <span className="font-mono text-sm text-muted-foreground">{service.number}</span>
        </div>

        {/* Title */}
        <div className="lg:col-span-3">
          <h3 className="text-2xl lg:text-3xl font-display tracking-tight group-hover:translate-x-1 transition-transform duration-300">
            {service.title}
          </h3>
        </div>

        {/* Description + tags */}
        <div className="lg:col-span-8 space-y-6">
          <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-3 py-1 border border-foreground/15 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
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

  return (
    <section id="services" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16 lg:mb-20">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Services
            </span>
            <h2
              className={`text-4xl lg:text-5xl font-display tracking-tight transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              What we do.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:flex lg:items-end">
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              Every service is built around one goal: returning your hydraulic
              components to full specification — reliably, and without the wait
              or cost of new procurement.
            </p>
          </div>
        </div>

        {/* Service rows */}
        <div>
          {services.map((service, index) => (
            <ServiceCard key={service.number} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
