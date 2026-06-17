"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    quote: "Every rod comes back to exact drawing dimensions. Our seals last far longer now because the surface finish is consistent — no more premature leaks.",
    author: "Rajan Mehta",
    role: "Workshop Manager",
    company: "Mehta Construction Equipment",
    metric: "3× longer seal life",
  },
  {
    quote: "We were facing a 14-week lead time for a replacement cylinder. Hydrise had the rod rechromed and back on site in under two weeks. No contest.",
    author: "Suresh Pillai",
    role: "Maintenance Head",
    company: "Apex Forging Ltd.",
    metric: "Back on site in 12 days",
  },
  {
    quote: "The cost saving is significant — we're reconditioning rods at less than a third of the replacement price. Quality is indistinguishable from new.",
    author: "Anita Krishnan",
    role: "Procurement Manager",
    company: "Southern Agro Industries",
    metric: "67% cost reduction",
  },
  {
    quote: "Marine environment is brutal on chrome. They understood the specification, applied the right coating, and it has held up through two full seasons offshore.",
    author: "Thomas Varghese",
    role: "Technical Director",
    company: "Kerala Marine Works",
    metric: "Zero failures offshore",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  const active = testimonials[activeIndex];

  return (
    <section className="relative py-28 lg:py-36 border-t border-foreground/10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Label */}
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Client results
          </span>
          <div className="flex-1 h-px bg-foreground/10" />
          <span className="font-mono text-xs text-muted-foreground">
            {String(activeIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Quote */}
          <div className="lg:col-span-8">
            <blockquote className={`transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>
              <p className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight">
                &ldquo;{active.quote}&rdquo;
              </p>
            </blockquote>

            <div className={`mt-10 flex items-center gap-5 transition-all duration-300 delay-100 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
              <div className="w-12 h-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0">
                <span className="font-display text-lg">{active.author.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-base">{active.author}</p>
                <p className="text-sm text-muted-foreground">{active.role}, {active.company}</p>
              </div>
            </div>
          </div>

          {/* Metric + dots */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className={`p-7 border border-foreground/10 transition-all duration-300 ${isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
              <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-3">
                Result
              </span>
              <p className="font-display text-3xl">{active.metric}</p>
            </div>

            <div className="flex gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => { setActiveIndex(idx); setIsAnimating(false); }, 300);
                  }}
                  className={`h-1.5 transition-all duration-300 ${
                    idx === activeIndex ? "w-8 bg-foreground" : "w-2 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Client marquee */}
        <div className="mt-20 pt-10 border-t border-foreground/10">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-8 text-center">
            Trusted by industrial operations across the region
          </p>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className="flex gap-16 items-center marquee">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex gap-16 items-center shrink-0">
              {[
                "Mehta Construction", "Apex Forging", "Southern Agro", "Kerala Marine Works",
                "Precision Pumps Ltd.", "Coastal Engineering", "Bharat Heavy Tools", "Indo Mining Corp.",
              ].map((company) => (
                <span
                  key={`${setIdx}-${company}`}
                  className="font-display text-lg md:text-xl text-foreground/25 whitespace-nowrap hover:text-foreground/50 transition-colors duration-300"
                >
                  {company}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
