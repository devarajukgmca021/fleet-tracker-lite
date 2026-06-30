import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useAuth } from "@workspace/replit-auth-web";
import { LayoutDashboard, Truck, Users, Map, MapPin, Bell, LogOut } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, user } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full bg-background text-foreground">
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
            <Truck className="h-6 w-6" />
            <span>FLEET COMMAND</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { href: "/tracking", label: "Live Tracking", icon: MapPin },
                  { href: "/alerts", label: "Alerts", icon: Bell },
                ].map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location === item.href}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[
                  { href: "/trucks", label: "Trucks", icon: Truck },
                  { href: "/drivers", label: "Drivers", icon: Users },
                  { href: "/trips", label: "Trips", icon: Map },
                ].map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location === item.href}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium truncate">{user?.firstName || "Operator"}</div>
            <button onClick={() => logout()} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 overflow-auto bg-background/50">
        <div className="p-6 md:p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
