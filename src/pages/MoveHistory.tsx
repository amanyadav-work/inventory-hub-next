import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MoveHistory = () => {
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

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Move History</h1>
          <p className="text-muted-foreground mt-1">View all stock movements and transactions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              All stock movements including receipts, deliveries, transfers, and adjustments will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MoveHistory;
