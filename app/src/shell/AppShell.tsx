import { ContainerSlot } from "./ContainerSlot";
import { Header } from "@/containers/Header";
import { Sidebar } from "@/containers/Sidebar";
import { Footer } from "@/containers/Footer";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] grid-rows-[auto_1fr_auto] [grid-template-areas:'header_header''sidebar_main''footer_footer']">
      <div className="[grid-area:header]">
        <ContainerSlot name="header">
          <Header />
        </ContainerSlot>
      </div>

      <div className="[grid-area:sidebar] border-r border-border overflow-y-auto">
        <ContainerSlot name="sidebar">
          <Sidebar />
        </ContainerSlot>
      </div>

      <div className="[grid-area:main] overflow-y-auto">
        <ContainerSlot name="main">
          {children}
        </ContainerSlot>
      </div>

      <div className="[grid-area:footer]">
        <ContainerSlot name="footer">
          <Footer />
        </ContainerSlot>
      </div>
    </div>
  );
}
