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
    style["--org-primary"] = primaryColor;
  }
  if (accentColor) {
    style["--org-accent"] = accentColor;
  }

  return <div style={style}>{children}</div>;
}
