import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { SidebarProvider } from "@/components/ui/sidebar";
import Layout from "./components/layout";

// Mock pages for quick setup
import Dashboard from "./pages/dashboard";
import Trucks from "./pages/trucks";
import Drivers from "./pages/drivers";
import Trips from "./pages/trips";
import Tracking from "./pages/tracking";
import Alerts from "./pages/alerts";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoginScreen() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md p-8 border rounded-lg bg-card shadow-lg text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Fleet Tracker Lite</h1>
        <p className="text-muted-foreground mb-8">Logistics Command Center</p>
        <button 
          onClick={() => login()} 
          className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold hover:opacity-90 transition-opacity"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/trucks" component={() => <ProtectedRoute component={Trucks} />} />
        <Route path="/drivers" component={() => <ProtectedRoute component={Drivers} />} />
        <Route path="/trips" component={() => <ProtectedRoute component={Trips} />} />
        <Route path="/tracking" component={() => <ProtectedRoute component={Tracking} />} />
        <Route path="/alerts" component={() => <ProtectedRoute component={Alerts} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Enforce dark mode by default for the desired aesthetic
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
