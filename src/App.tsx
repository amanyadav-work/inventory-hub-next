import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Operations from "./pages/Operations";
import Receipts from "./pages/operations/Receipts";
import Deliveries from "./pages/operations/Deliveries";
import Transfers from "./pages/operations/Transfers";
import Adjustments from "./pages/operations/Adjustments";
import MoveHistory from "./pages/MoveHistory";
import Warehouses from "./pages/Warehouses";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/operations/receipts" element={<Receipts />} />
            <Route path="/operations/deliveries" element={<Deliveries />} />
            <Route path="/operations/transfers" element={<Transfers />} />
            <Route path="/operations/adjustments" element={<Adjustments />} />
            <Route path="/move-history" element={<MoveHistory />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
