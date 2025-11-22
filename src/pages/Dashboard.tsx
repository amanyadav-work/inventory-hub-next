import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Package, AlertTriangle, FileDown, Truck, ArrowRightLeft } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total products
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Low stock items (products below reorder level)
        const { data: stockLevels } = await supabase
          .from("stock_levels")
          .select("quantity, product:products(reorder_level)");

        const lowStock = stockLevels?.filter(
          (sl: any) => sl.quantity <= (sl.product?.reorder_level || 0)
        ).length || 0;

        // Pending receipts
        const { count: receiptsCount } = await supabase
          .from("receipts")
          .select("*", { count: "exact", head: true })
          .in("status", ["draft", "waiting"]);

        // Pending deliveries
        const { count: deliveriesCount } = await supabase
          .from("delivery_orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["draft", "waiting"]);

        // Pending transfers
        const { count: transfersCount } = await supabase
          .from("internal_transfers")
          .select("*", { count: "exact", head: true })
          .in("status", ["draft", "waiting"]);

        setStats({
          totalProducts: productsCount || 0,
          lowStockItems: lowStock,
          pendingReceipts: receiptsCount || 0,
          pendingDeliveries: deliveriesCount || 0,
          pendingTransfers: transfersCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your stock operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Active in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
              <FileDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReceipts}</div>
              <p className="text-xs text-muted-foreground mt-1">Incoming goods</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
              <p className="text-xs text-muted-foreground mt-1">Outgoing goods</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Internal Transfers</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTransfers}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled moves</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/products")}
              className="p-4 border rounded-lg hover:bg-secondary transition-colors text-left"
            >
              <Package className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-semibold">Manage Products</h3>
              <p className="text-sm text-muted-foreground">Create and update products</p>
            </button>
            <button
              onClick={() => navigate("/operations")}
              className="p-4 border rounded-lg hover:bg-secondary transition-colors text-left"
            >
              <FileDown className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-semibold">Operations</h3>
              <p className="text-sm text-muted-foreground">Receipts, deliveries & more</p>
            </button>
            <button
              onClick={() => navigate("/warehouses")}
              className="p-4 border rounded-lg hover:bg-secondary transition-colors text-left"
            >
              <Package className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-semibold">Warehouses</h3>
              <p className="text-sm text-muted-foreground">Manage locations</p>
            </button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
