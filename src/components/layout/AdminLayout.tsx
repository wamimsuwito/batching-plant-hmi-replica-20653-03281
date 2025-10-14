import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border/50 flex items-center px-4 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-semibold text-foreground">Batch Plant HMI - Admin Panel</h2>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
