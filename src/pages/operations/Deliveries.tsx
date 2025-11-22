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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, TruckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Deliveries = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    delivery_number: "",
    customer_name: "",
    warehouse_id: "",
  });
  const [lines, setLines] = useState<Array<{ product_id: string; quantity: string }>>([
    { product_id: "", quantity: "0" },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
      fetchWarehouses();
      fetchProducts();
    }
  }, [user]);

  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from("delivery_orders")
      .select(`
        *,
        warehouse:warehouses(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching deliveries");
      console.error(error);
    } else {
      setDeliveries(data || []);
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

    const { data: delivery, error: deliveryError } = await supabase
      .from("delivery_orders")
      .insert([{ ...formData, created_by: user?.id }])
      .select()
      .single();

    if (deliveryError) {
      toast.error("Error creating delivery: " + deliveryError.message);
      return;
    }

    const lineInserts = lines
      .filter((line) => line.product_id && parseFloat(line.quantity) > 0)
      .map((line) => ({
        delivery_order_id: delivery.id,
        product_id: line.product_id,
        quantity: parseFloat(line.quantity),
      }));

    if (lineInserts.length > 0) {
      const { error: linesError } = await supabase.from("delivery_order_lines").insert(lineInserts);
      if (linesError) {
        toast.error("Error adding delivery lines");
        return;
      }
    }

    toast.success("Delivery order created successfully!");
    setIsDialogOpen(false);
    setFormData({ delivery_number: "", customer_name: "", warehouse_id: "" });
    setLines([{ product_id: "", quantity: "0" }]);
    fetchDeliveries();
  };

  const addLine = () => {
    setLines([...lines, { product_id: "", quantity: "0" }]);
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
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
            <h1 className="text-3xl font-bold text-foreground">Delivery Orders</h1>
            <p className="text-muted-foreground mt-1">Manage outgoing stock</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Delivery Order</DialogTitle>
                <DialogDescription>Record outgoing stock to customer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_number">Delivery Number</Label>
                    <Input
                      id="delivery_number"
                      value={formData.delivery_number}
                      onChange={(e) => setFormData({ ...formData, delivery_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
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
                  <Label>Products</Label>
                  {lines.map((line, index) => (
                    <div key={index} className="flex gap-2">
                      <Select value={line.product_id} onValueChange={(value) => updateLine(index, "product_id", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, "quantity", e.target.value)}
                        className="w-24"
                      />
                      {lines.length > 1 && (
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeLine(index)}>×</Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>Add Product</Button>
                </div>
                <Button type="submit" className="w-full">Create Delivery</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">All Deliveries</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No deliveries found
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                      <TableCell>{delivery.customer_name}</TableCell>
                      <TableCell>{delivery.warehouse?.name || "-"}</TableCell>
                      <TableCell>{new Date(delivery.delivery_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={delivery.status === "done" ? "default" : "secondary"}>
                          {delivery.status}
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

export default Deliveries;
