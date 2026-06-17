"use client";

import { useEffect, useRef, useState } from "react";

const services = [
  {
    number: "01",
    title: "Hard Chrome Plating",
    description:
      "Our core specialisation. Electrodeposited hard chrome coating reaching 65–70 HRC surface hardness — exceptional wear resistance, corrosion protection, and low-friction performance for hydraulic rods, shafts, and plungers under continuous load.",
    tags: ["Piston Rods", "Valve Spools", "Plungers", "Shafts"],
  },
  {
    number: "02",
    title: "Hydraulic Cylinder Manufacturing & Reconditioning",
    description:
      "New hydraulic cylinders built to drawing, and worn cylinders fully reconditioned. Bore honing, seal replacement, rod re-plating, and pressure testing — all in-house. We restore cylinders to original operating pressure without the cost or lead time of new procurement.",
    tags: ["New Manufacture", "Full Rebuild", "Bore Honing", "Pressure Testing"],
  },
  {
    number: "03",
    title: "Hydraulic Power Packs",
    description:
      "Design, fabrication, and repair of hydraulic power pack units — reservoir, pump, valve block, and controls assembled and tested as a complete system. Custom configurations for industrial machinery and mobile equipment.",
    tags: ["Custom Design", "Pump & Valve", "Control Systems", "Full Assembly"],
  },
  {
    number: "04",
    title: "Thermal Spraying & Engineering Works",
    description:
      "Thermal spray coating for components requiring surface build-up, corrosion protection, or wear resistance where chrome plating is not suited. General engineering works including fabrication, machining, and repair across a wide range of industrial components.",
    tags: ["Thermal Spray", "Surface Build-up", "Fabrication", "General Engineering"],
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
