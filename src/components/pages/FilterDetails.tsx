"use client";

import { useEffect, useRef } from "react";

interface FilterDetailsProps {
  children: React.ReactNode;
  name?: string;
  className?: string;
}

export default function FilterDetails({ children, name, className }: FilterDetailsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const details = detailsRef.current;

      // If it's not open, we don't care
      if (!details || !details.hasAttribute("open")) return;

      // Condition 1: Clicked completely outside the dropdown
      if (!details.contains(target)) {
        details.removeAttribute("open");
      } 
      // Condition 2: Clicked on a link INSIDE the dropdown (closes menu after picking a filter!)
      else if ((target as HTMLElement).closest("a")) {
        details.removeAttribute("open");
      }
    };

    // Listen for clicks anywhere on the page
    document.addEventListener("click", handleDocumentClick);
    
    // Cleanup listener when component unmounts
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  return (
    <details ref={detailsRef} name={name} className={className}>
      {children}
    </details>
  );
}