import { Calendar, Camera, LayoutDashboard, Package, Receipt, Stethoscope, Users, Pill, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    title: "Tổng quan",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Khách hàng",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Lịch khám",
    url: "/appointments",
    icon: Calendar,
    badge: 5,
  },
  {
    title: "Hồ sơ khám",
    url: "/medical-records",
    icon: FileText,
  },
  {
    title: "Kho thuốc",
    url: "/inventory",
    icon: Package,
    badge: 8,
  },
  {
    title: "Hóa đơn",
    url: "/invoices",
    icon: Receipt,
  },
  {
    title: "Camera",
    url: "/cameras",
    icon: Camera,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold">ペット</h2>
            <p className="text-xs text-muted-foreground">Quản lý phòng khám</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground">BS</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-username">Dr.5ae báo</p>
            <p className="text-xs text-muted-foreground">Bác sĩ thú y</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
