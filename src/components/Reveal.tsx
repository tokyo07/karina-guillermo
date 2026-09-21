"use client";

import { useInView } from "@/hooks/useScrollEffects";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
  delay?: number;
};

/** Envoltorio genérico: sus hijos aparecen (fade + slide) al entrar en pantalla. */
export default function Reveal({ children, className = "", as = "div", delay = 0 }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={`reveal${inView ? " inView" : ""}${className ? " " + className : ""}`}
      style={{ "--reveal-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
