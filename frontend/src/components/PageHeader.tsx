type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header>
      <div className="badge">Dashboard Publik</div>
      <div className="hero-title">{title}</div>
      <p className="lead">{subtitle}</p>
    </header>
  );
}
