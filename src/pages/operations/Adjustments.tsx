import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Adjustments = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    adjustment_number: "",
    warehouse_id: "",
    product_id: "",
    system_quantity: "0",
    counted_quantity: "0",
    reason: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAdjustments();
      fetchWarehouses();
      fetchProducts();
    }
  }, [user]);

  const fetchAdjustments = async () => {
    const { data, error } = await supabase
      .from("stock_adjustments")
      .select(`
        *,
        warehouse:warehouses(name),
        product:products(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching adjustments");
      console.error(error);
    } else {
      setAdjustments(data || []);
    }
  };

  const fetchWarehouses = async () => {
    const { data } = await supabase.from("warehouses").select("*").eq("is_active", true);
    setWarehouses(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("is_active", true);
    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const systemQty = parseFloat(formData.system_quantity);
    const countedQty = parseFloat(formData.counted_quantity);
    const difference = countedQty - systemQty;

    const { error } = await supabase.from("stock_adjustments").insert([
      {
        ...formData,
        system_quantity: systemQty,
        counted_quantity: countedQty,
        difference,
        created_by: user?.id,
      },
    ]);

    if (error) {
      toast.error("Error creating adjustment: " + error.message);
      return;
    }

    toast.success("Stock adjustment created successfully!");
    setIsDialogOpen(false);
    setFormData({
      adjustment_number: "",
      warehouse_id: "",
      product_id: "",
      system_quantity: "0",
      counted_quantity: "0",
      reason: "",
    });
    fetchAdjustments();
  };

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stock Adjustments</h1>
            <p className="text-muted-foreground mt-1">Correct stock discrepancies</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Stock Adjustment</DialogTitle>
                <DialogDescription>Adjust stock levels to match physical count</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustment_number">Adjustment Number</Label>
                  <Input
                    id="adjustment_number"
                    value={formData.adjustment_number}
                    onChange={(e) => setFormData({ ...formData, adjustment_number: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select value={formData.warehouse_id} onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_quantity">System Quantity</Label>
                    <Input
                      id="system_quantity"
                      type="number"
                      value={formData.system_quantity}
                      onChange={(e) => setFormData({ ...formData, system_quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="counted_quantity">Counted Quantity</Label>
                    <Input
                      id="counted_quantity"
                      type="number"
                      value={formData.counted_quantity}
                      onChange={(e) => setFormData({ ...formData, counted_quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Explain the reason for adjustment"
                  />
                </div>
                <Button type="submit" className="w-full">Create Adjustment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">All Adjustments</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>System Qty</TableHead>
                  <TableHead>Counted Qty</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No adjustments found
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="font-medium">{adj.adjustment_number}</TableCell>
                      <TableCell>{adj.product?.name || "-"}</TableCell>
                      <TableCell>{adj.warehouse?.name || "-"}</TableCell>
                      <TableCell>{adj.system_quantity}</TableCell>
                      <TableCell>{adj.counted_quantity}</TableCell>
                      <TableCell className={adj.difference > 0 ? "text-success" : adj.difference < 0 ? "text-destructive" : ""}>
                        {adj.difference > 0 ? "+" : ""}{adj.difference}
                      </TableCell>
                      <TableCell>
                        <Badge variant={adj.status === "done" ? "default" : "secondary"}>
                          {adj.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Adjustments;
