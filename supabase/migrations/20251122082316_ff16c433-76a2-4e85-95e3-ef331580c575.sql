-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view warehouses"
  ON public.warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage warehouses"
  ON public.warehouses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON public.product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON public.product_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.product_categories(id),
  unit_of_measure TEXT NOT NULL,
  reorder_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create stock levels table (current stock per warehouse)
CREATE TABLE public.stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock levels"
  ON public.stock_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage stock levels"
  ON public.stock_levels FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create movement types enum
CREATE TYPE movement_type AS ENUM ('receipt', 'delivery', 'transfer', 'adjustment');

-- Create movement status enum
CREATE TYPE movement_status AS ENUM ('draft', 'waiting', 'ready', 'done', 'canceled');

-- Create receipts table (incoming stock)
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT UNIQUE NOT NULL,
  supplier_name TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  status movement_status DEFAULT 'draft',
  receipt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view receipts"
  ON public.receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage receipts"
  ON public.receipts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create receipt lines table
CREATE TABLE public.receipt_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.receipt_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view receipt lines"
  ON public.receipt_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage receipt lines"
  ON public.receipt_lines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create delivery orders table (outgoing stock)
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  status movement_status DEFAULT 'draft',
  delivery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deliveries"
  ON public.delivery_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage deliveries"
  ON public.delivery_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create delivery order lines table
CREATE TABLE public.delivery_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_order_id UUID REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.delivery_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view delivery lines"
  ON public.delivery_order_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage delivery lines"
  ON public.delivery_order_lines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create internal transfers table
CREATE TABLE public.internal_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number TEXT UNIQUE NOT NULL,
  from_warehouse_id UUID REFERENCES public.warehouses(id),
  to_warehouse_id UUID REFERENCES public.warehouses(id),
  status movement_status DEFAULT 'draft',
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.internal_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transfers"
  ON public.internal_transfers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage transfers"
  ON public.internal_transfers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create transfer lines table
CREATE TABLE public.transfer_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID REFERENCES public.internal_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transfer_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transfer lines"
  ON public.transfer_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage transfer lines"
  ON public.transfer_lines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create stock adjustments table
CREATE TABLE public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adjustment_number TEXT UNIQUE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id),
  product_id UUID REFERENCES public.products(id),
  counted_quantity DECIMAL(10, 2) NOT NULL,
  system_quantity DECIMAL(10, 2) NOT NULL,
  difference DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status movement_status DEFAULT 'draft',
  adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view adjustments"
  ON public.stock_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage adjustments"
  ON public.stock_adjustments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create stock movements ledger table
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  movement_type movement_type NOT NULL,
  reference_id UUID,
  reference_number TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movements"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON public.stock_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();