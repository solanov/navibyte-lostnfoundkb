// Layout for /auth/* routes (callback, verified).
// Intentionally omits the TopNav so these pages render as standalone screens.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
