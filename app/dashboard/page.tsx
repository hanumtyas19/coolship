// Import sidebar dan header komponen
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
// Import provider buat sidebar biar responsif
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
// Import isi utama halaman (Home = dashboard tadi)
import Home from "./dashboard";

export default function Page() {
  return (
    // Bungkus semuanya dalam SidebarProvider
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)", // atur lebar sidebar
          "--header-height": "calc(var(--spacing) * 12)", // atur tinggi header
        } as React.CSSProperties
      }
    >
      {/* Sidebar bagian kiri */}
      <AppSidebar variant="inset" />
      {/* Konten utama setelah sidebar */}
      <SidebarInset>
        {/* Header atas */}
        <SiteHeader />
        {/* Body/konten dashboard */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Home /> {/* Ini isinya dashboard dari Home.tsx */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
