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
import { Plus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Receipts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    receipt_number: "",
    supplier_name: "",
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
      fetchReceipts();
      fetchWarehouses();
      fetchProducts();
    }
  }, [user]);

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from("receipts")
      .select(`
        *,
        warehouse:warehouses(name),
        receipt_lines(
          quantity,
          product:products(name)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching receipts");
      console.error(error);
    } else {
      setReceipts(data || []);
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

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert([{ ...formData, created_by: user?.id }])
      .select()
      .single();

    if (receiptError) {
      toast.error("Error creating receipt: " + receiptError.message);
      return;
    }

    const lineInserts = lines
      .filter((line) => line.product_id && parseFloat(line.quantity) > 0)
      .map((line) => ({
        receipt_id: receipt.id,
        product_id: line.product_id,
        quantity: parseFloat(line.quantity),
      }));

    if (lineInserts.length > 0) {
      const { error: linesError } = await supabase.from("receipt_lines").insert(lineInserts);
      if (linesError) {
        toast.error("Error adding receipt lines");
        return;
      }
    }

    toast.success("Receipt created successfully!");
    setIsDialogOpen(false);
    setFormData({ receipt_number: "", supplier_name: "", warehouse_id: "" });
    setLines([{ product_id: "", quantity: "0" }]);
    fetchReceipts();
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
            <h1 className="text-3xl font-bold text-foreground">Receipts</h1>
            <p className="text-muted-foreground mt-1">Manage incoming stock</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Receipt</DialogTitle>
                <DialogDescription>Record incoming stock from supplier</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt_number">Receipt Number</Label>
                    <Input
                      id="receipt_number"
                      value={formData.receipt_number}
                      onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_name">Supplier Name</Label>
                    <Input
                      id="supplier_name"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
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
                <Button type="submit" className="w-full">Create Receipt</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">All Receipts</span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No receipts found
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                      <TableCell>{receipt.supplier_name}</TableCell>
                      <TableCell>{receipt.warehouse?.name || "-"}</TableCell>
                      <TableCell>{new Date(receipt.receipt_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={receipt.status === "done" ? "default" : "secondary"}>
                          {receipt.status}
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

export default Receipts;
