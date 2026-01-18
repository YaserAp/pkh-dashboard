type PageHeaderProps = {
  title: string;
  subtitle: string;
  tag?: string;
};

export default function PageHeader({ title, subtitle, tag = "Dashboard" }: PageHeaderProps) {
  return (
    <header>
      <div className="badge">{tag}</div>
      <div className="hero-title">{title}</div>
      <p className="lead">{subtitle}</p>
    </header>
  );
}
