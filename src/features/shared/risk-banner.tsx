type RiskBannerProps = {
  title: string;
  description: string;
};

export function RiskBanner({ title, description }: RiskBannerProps) {
  return (
    <aside className="risk-banner" aria-label={title}>
      <p className="risk-banner__title">{title}</p>
      <p className="risk-banner__description">{description}</p>
    </aside>
  );
}
