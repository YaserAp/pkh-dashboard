import Link from "next/link";
import { useRouter } from "next/router";

const mainLinks = [
  { href: "/", label: "Ringkasan" },
  { href: "/peta", label: "Peta" },
  { href: "/prediksi", label: "Prediksi" },
];

const advancedLinks = [
  { href: "/analisis", label: "Analisis" },
  { href: "/perbandingan", label: "Perbandingan" },
  { href: "/efektivitas", label: "Efektivitas" },
];

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onToggle, onNavigate }: SidebarProps) {
  const router = useRouter();
  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">PKH Dashboard</div>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
          title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={router.pathname === link.href ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-section-title">Lanjutan</div>
      <nav className="sidebar-nav advanced">
        {advancedLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={router.pathname === link.href ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
