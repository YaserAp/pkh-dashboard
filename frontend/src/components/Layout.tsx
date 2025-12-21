import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const handleNavigate = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  return (
    <main className={`layout ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((open) => !open)} onNavigate={handleNavigate} />
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <section className="content">
        <div className="mobile-topbar">
          <button
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Buka sidebar"
            title="Buka sidebar"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="mobile-title">PKH Dashboard</span>
        </div>
        {children}
      </section>
    </main>
  );
}
