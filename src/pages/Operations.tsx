import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Truck, ArrowRightLeft, Edit } from "lucide-react";

const Operations = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const operations = [
    {
      title: "Receipts",
      description: "Manage incoming stock from suppliers",
      icon: FileDown,
      path: "/operations/receipts",
      color: "text-success",
    },
    {
      title: "Delivery Orders",
      description: "Process outgoing stock to customers",
      icon: Truck,
      path: "/operations/deliveries",
      color: "text-info",
    },
    {
      title: "Internal Transfers",
      description: "Move stock between warehouse locations",
      icon: ArrowRightLeft,
      path: "/operations/transfers",
      color: "text-warning",
    },
    {
      title: "Stock Adjustments",
      description: "Adjust inventory for physical counts",
      icon: Edit,
      path: "/operations/adjustments",
      color: "text-destructive",
    },
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Operations</h1>
          <p className="text-muted-foreground mt-1">Manage all stock movements and operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operations.map((op) => {
            const Icon = op.icon;
            return (
              <Card
                key={op.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(op.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-secondary ${op.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{op.title}</CardTitle>
                      <CardDescription>{op.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click to view and manage {op.title.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Operations;
