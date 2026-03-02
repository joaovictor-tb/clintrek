interface BrandingProviderProps {
  primaryColor?: string | null;
  accentColor?: string | null;
  children: React.ReactNode;
}

export function BrandingProvider({
  primaryColor,
  accentColor,
  children,
}: BrandingProviderProps) {
  const hasCustomBranding = primaryColor || accentColor;

  if (!hasCustomBranding) {
    return <>{children}</>;
  }

  const style: Record<string, string> = {};

  if (primaryColor) {
    style["--primary"] = primaryColor;
    style["--ring"] = primaryColor;
    style["--sidebar-primary"] = primaryColor;
    style["--sidebar-ring"] = primaryColor;
    style["--chart-1"] = primaryColor;
  }

  if (accentColor) {
    style["--accent"] = accentColor;
    style["--sidebar-accent"] = accentColor;
  }

  return <div style={style}>{children}</div>;
}
