/**
 * Root dojo layout: passes children through. Storefront and member hub
 * are wrapped by their own server layouts: (storefront)/layout.tsx and me/layout.tsx.
 */
export default function DojoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
