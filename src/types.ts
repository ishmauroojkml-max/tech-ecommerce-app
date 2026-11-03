export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  stock?: number;
};

export type CartItem = Product & { quantity: number };

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
};

export type Order = {
  id: string;
  email: string;
  items: CartItem[];
  total: number;
  date: string;
  status: string;
};

export type Review = {
  id: string;
  product_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  display_name: string;
};

export type View = 'store' | 'login' | 'signup' | 'admin' | 'account' | 'orders' | 'product' | 'demo-pay';

export type ProductRow = Omit<Product, 'originalPrice'> & { original_price: number; stock?: number };

export type CartItemRow = {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
};

export const fromProductRow = (row: ProductRow): Product => ({
  ...row,
  originalPrice: Number(row.original_price),
  stock: row.stock,
});
