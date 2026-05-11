import TopNav from "@/src/components/layout/TopNav";
import BottomNavBar from "@/src/components/layout/BottomNavBar";

// Layout for the (board) route group — authenticated pages only.
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#fbf9f8] min-h-screen flex flex-col font-body text-[#41484c] selection:bg-[#8df4ec] selection:text-[#002433]">
      
      {/* TopNav now acts exclusively as our Mobile Header (hidden on md+ screens) */}
      <TopNav />
      
      {/* The page content (which includes the Desktop SideNav and Main Feed) */}
      <div className="flex-1 w-full relative">
        {children}
      </div>

      <BottomNavBar />
      
    </div>
  );
}