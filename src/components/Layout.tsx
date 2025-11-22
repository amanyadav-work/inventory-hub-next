import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Settings, 
  LogOut,
  Warehouse,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "Products", path: "/products" },
    { icon: FileText, label: "Operations", path: "/operations" },
    { icon: ArrowRightLeft, label: "Move History", path: "/move-history" },
    { icon: Warehouse, label: "Warehouses", path: "/warehouses" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">StockMaster</h1>
              <p className="text-xs text-muted-foreground">Inventory System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
