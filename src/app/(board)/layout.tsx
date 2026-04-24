import TopNav from "@/src/components/layout/TopNav";

// Layout for the (board) route group — authenticated pages only.
// TopNav is scoped here so it never appears on login/register/auth pages.
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
