import { NavLink } from 'react-router-dom';
import { 
  FlaskConical, 
  Settings, 
  Users, 
  PackageSearch, 
  Database, 
  Printer,
  LogOut,
  LayoutDashboard,
  ListOrdered
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Job Mix Formula', url: '/admin/job-mix-formula', icon: FlaskConical },
  { title: 'Urutan Mixing', url: '/admin/mixing-sequence', icon: ListOrdered },
  { title: 'Pengaturan Relay & Pintu Mixer', url: '/admin/relay-settings', icon: Settings },
  { title: 'Setting', url: '/admin/settings', icon: Settings },
  { title: 'Manajemen User', url: '/admin/user-management', icon: Users },
  { title: 'Joging Material', url: '/admin/material-jogging', icon: PackageSearch },
  { title: 'Database Produksi', url: '/admin/production-database', icon: Database },
  { title: 'Print Tiket', url: '/admin/print-ticket', icon: Printer },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { logout } = useAuth();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary">Menu Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? 'bg-accent text-accent-foreground' : ''
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={logout}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
