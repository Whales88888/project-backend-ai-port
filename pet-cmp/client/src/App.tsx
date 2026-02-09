import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import DashboardPage from "@/pages/DashboardPage";
import CustomersPage from "@/pages/CustomersPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import MedicalRecordsPage from "@/pages/MedicalRecordsPage";
import InventoryPage from "@/pages/InventoryPage";
import InvoicesPage from "@/pages/InvoicesPage";
import CamerasPage from "@/pages/CamerasPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/appointments" component={AppointmentsPage} />
      <Route path="/medical-records" component={MedicalRecordsPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/cameras" component={CamerasPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-4 p-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
