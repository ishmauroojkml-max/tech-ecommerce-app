import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fromProductRow, type CartItem, type Order, type Product, type ProductRow, type Review, type User, type View } from '@/types';
import DemoPaymentForm from '@/components/DemoPaymentForm';
import { categories, currency, formatDate, isValidEmail } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  UserRound,
  X,
  Zap,
} from 'lucide-react';

const seedProducts: Product[] = [
  { id: 1, name: 'iPhone 15 Pro Max', category: 'Smartphones', price: 999, originalPrice: 1199, rating: 4.9, reviews: 128, image: 'https://images.pexels.com/photos/13844013/pexels-photo-13844013.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', badge: 'Hot Deal', stock: 50 },
  { id: 2, name: 'Dell XPS 13 Plus', category: 'Laptops', price: 1099, originalPrice: 1299, rating: 4.8, reviews: 86, image: 'https://images.pexels.com/photos/129205/pexels-photo-129205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', badge: '20% Off', stock: 50 },
  { id: 3, name: 'Sony WH-1000XM5', category: 'Audio', price: 299, originalPrice: 399, rating: 4.9, reviews: 214, image: 'https://images.pexels.com/photos/14935011/pexels-photo-14935011.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', badge: 'Best Seller', stock: 50 },
  { id: 4, name: 'Samsung Galaxy Watch 6', category: 'Smartwatches', price: 249, originalPrice: 329, rating: 4.7, reviews: 74, image: 'https://images.pexels.com/photos/12564670/pexels-photo-12564670.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', badge: 'New', stock: 50 },
  { id: 5, name: 'AirPods Pro 2nd Gen', category: 'Audio', price: 189, originalPrice: 249, rating: 4.8, reviews: 165, image: 'https://images.pexels.com/photos/33298190/pexels-photo-33298190.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', badge: '15% Off', stock: 50 },
  { id: 6, name: 'Canon EOS R50', category: 'Cameras', price: 549, originalPrice: 699, rating: 4.6, reviews: 42, image: 'https://images.pexels.com/photos/38555191/pexels-photo-38555191.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', badge: 'Limited', stock: 50 },
];

function StarRating({ value, onChange, size = 'h-4 w-4' }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={onChange ? 'hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star className={`${size} ${star <= value ? 'fill-[#f6b51b] text-[#f6b51b]' : 'fill-transparent text-slate-300'}`} />
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, onAdd, onBuyNow, onView }: { product: Product; onAdd: (product: Product) => void; onBuyNow: (product: Product) => void; onView: (id: number) => void }) {
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const lowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;
  return (
    <article className="product-card group">
      <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-[#f3f5fb]">
        {product.badge && <span className="absolute left-3 top-3 z-10 rounded-md bg-[#ef2d48] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{product.badge}</span>}
        {outOfStock && <span className="absolute right-3 top-3 z-10 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-white">Out of stock</span>}
        {!outOfStock && <button aria-label={`Save ${product.name}`} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-400 shadow-sm hover:text-[#4338ca]"><Heart className="h-4 w-4" /></button>}
        <img src={product.image} alt={product.name} onClick={() => onView(product.id)} className="h-full w-full cursor-pointer object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-2.5 px-1 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{product.category}</p>
        <h3 className="cursor-pointer truncate text-sm font-bold text-slate-900 hover:text-[#4438ca]" onClick={() => onView(product.id)}>{product.name}</h3>
        <div className="flex items-center gap-1 text-xs">
          <Star className="h-3.5 w-3.5 fill-[#f6b51b] text-[#f6b51b]" />
          <span className="font-semibold text-slate-700">{product.rating}</span>
          <span className="text-slate-400">({product.reviews})</span>
        </div>
        {lowStock && <p className="text-[10px] font-bold text-orange-500">Only {product.stock} left!</p>}
        <div className="flex items-center gap-2 pt-1">
          <div className="min-w-0">
            <span className="text-base font-extrabold text-slate-900">{currency(product.price)}</span>
            <span className="ml-1 text-xs text-slate-400 line-through">{currency(product.originalPrice)}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAdd(product)}
            disabled={outOfStock}
            className="flex-1 rounded-lg bg-[#4438ca] px-3 py-2 text-xs font-bold text-white hover:-translate-y-0.5 hover:bg-[#3730a3] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {outOfStock ? 'Sold out' : 'Add to cart'}
          </button>
          <button
            onClick={() => onBuyNow(product)}
            disabled={outOfStock}
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}

function Header({ user, cartCount, search, setSearch, onView, onCart }: { user: User | null; cartCount: number; search: string; setSearch: (value: string) => void; onView: (view: View) => void; onCart: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="bg-[#111827] px-4 py-2 text-center text-[11px] font-medium text-white">
        Free shipping on all orders over $100 <span className="mx-2 text-slate-500">|</span> Easy returns within 30 days
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[74px] items-center gap-5">
            <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
            <button onClick={() => onView('store')} className="flex shrink-0 items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4438ca] text-white shadow-lg shadow-indigo-200"><Zap className="h-5 w-5 fill-white" /></span>
              <span className="text-lg font-black tracking-tight">NEXA<span className="text-[#4438ca]">TECH</span></span>
            </button>
            <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 lg:flex">
              <a href="#store">Shop</a><a href="#categories">Categories</a><a href="#deals">Deals</a><a href="#new">New Arrivals</a>
            </nav>
            <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for products..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 focus:bg-white" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              {user ? (
                <button onClick={() => onView(user.role === 'admin' ? 'admin' : 'account')} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Account">
                  <UserRound className="h-[18px] w-[18px]" />
                </button>
              ) : (
                <button onClick={() => onView('login')} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Sign in">
                  <UserRound className="h-[18px] w-[18px]" />
                </button>
              )}
              {user?.role === 'admin' && <button onClick={() => onView('admin')} className="hidden rounded-lg p-2 hover:bg-slate-100 sm:block" aria-label="Admin dashboard"><LayoutDashboard className="h-[18px] w-[18px]" /></button>}
              {user && user.role === 'customer' && <button onClick={() => onView('orders')} className="hidden rounded-lg p-2 hover:bg-slate-100 sm:block" aria-label="Order history"><Clock className="h-[18px] w-[18px]" /></button>}
              <button onClick={onCart} className="relative rounded-lg p-2 hover:bg-slate-100" aria-label="Shopping cart">
                <ShoppingCart className="h-[19px] w-[19px]" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4438ca] px-1 text-[9px] font-bold text-white">{cartCount}</span>
              </button>
            </div>
          </div>
          {open && (
            <div className="border-t border-slate-100 py-4 lg:hidden">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                <a href="#store">Shop</a><a href="#categories">Categories</a><a href="#deals">Deals</a><a href="#new">New Arrivals</a>
                {user && user.role === 'customer' && <button onClick={() => { onView('orders'); setOpen(false); }}>My Orders</button>}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

function AuthPage({ mode, onMode, onLogin, onSignup, onAdminBypass, onBack }: {
  mode: 'login' | 'signup';
  onMode: (mode: 'login' | 'signup') => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  onAdminBypass: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) { setError('Enter a valid email address.'); return; }
    if (mode === 'signup' && (!name.trim() || password.length < 6)) { setError('Enter your name and a password with at least 6 characters.'); return; }
    setError(''); setSubmitting(true);
    try {
      if (mode === 'login') {
        if (normalizedEmail === 'admin@tech.com') { onAdminBypass(); return; }
        await onLogin(normalizedEmail, password);
      } else {
        await onSignup(name.trim(), normalizedEmail, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We could not complete that request.';
      setError(message);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="auth-shell">
      <button onClick={onBack} className="absolute left-5 top-5 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to store</button>
      <div className="auth-card">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4438ca] text-white"><Zap className="h-5 w-5 fill-white" /></span>
          <span className="text-xl font-black">NEXA<span className="text-[#4438ca]">TECH</span></span>
        </div>
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-black">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Sign in to continue shopping.' : 'Save your cart and track every order.'}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="form-input" />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="form-input" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="form-input" />
          {error && <p className="text-xs font-semibold text-[#ef2d48]">{error}</p>}
          <button disabled={submitting} className="w-full rounded-lg bg-[#4438ca] py-3 text-sm font-bold text-white hover:bg-[#3730a3] disabled:opacity-60">{submitting ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#4438ca]" /> Admin access is assigned to approved accounts. <button onClick={onAdminBypass} className="font-bold text-[#4438ca] hover:underline">Use admin credentials</button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">{mode === 'login' ? 'New to NexaTech?' : 'Already have an account?'} <button onClick={() => onMode(mode === 'login' ? 'signup' : 'login')} className="font-bold text-[#4438ca]">{mode === 'login' ? 'Create one' : 'Sign in'}</button></p>
      </div>
    </div>
  );
}

function CartDrawer({ items, onClose, onChange, onCheckout, onDemoPay }: { items: CartItem[]; onClose: () => void; onChange: (id: number, amount: number) => void; onCheckout: () => void; onDemoPay: () => void }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[#4438ca]">Your bag</p><h2 className="mt-1 text-xl font-black">Shopping cart</h2></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-auto py-5">
          {items.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Your cart is waiting for something great.</div> : items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover mix-blend-multiply" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{item.name}</p>
                <p className="mt-1 text-sm font-black text-[#4438ca]">{currency(item.price)}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <button onClick={() => onChange(item.id, -1)} className="h-6 w-6 rounded border border-slate-200">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onChange(item.id, 1)} className="h-6 w-6 rounded border border-slate-200">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-5">
          <div className="flex justify-between text-sm font-bold"><span>Subtotal</span><span>{currency(total)}</span></div>
          <p className="mt-2 text-xs text-slate-400">Taxes and shipping calculated at checkout.</p>
          <button disabled={!items.length} onClick={onCheckout} className="mt-5 w-full rounded-lg bg-[#4438ca] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Secure checkout <ArrowRight className="ml-1 inline h-4 w-4" /></button>
          <button disabled={!items.length} onClick={onDemoPay} className="mt-2 w-full rounded-lg border border-slate-200 py-2.5 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Try the demo payment form</button>
        </div>
      </aside>
    </div>
  );
}

function CheckoutModal({ items, user, onClose, onStripeCheckout, onDemoCheckout, stripeReady }: {
  items: CartItem[];
  user: User;
  onClose: () => void;
  onStripeCheckout: () => Promise<void>;
  onDemoCheckout: (items: CartItem[]) => Promise<string>;
  stripeReady: boolean;
}) {
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleStripe = async () => {
    setError(''); setProcessing(true);
    try { await onStripeCheckout(); } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed.';
      setError(message);
    } finally { setProcessing(false); }
  };

  const handleDemo = async () => {
    setError(''); setProcessing(true);
    try { const id = await onDemoCheckout(items); setOrderId(id); setDone(true); } catch (err) {
      const message = err instanceof Error ? err.message : 'We could not save your order.';
      setError(message);
    } finally { setProcessing(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="checkout-modal">
        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
            <h2 className="mt-5 text-2xl font-black">Payment successful</h2>
            <p className="mt-2 text-sm text-slate-500">Your order <b>#{orderId}</b> has been confirmed.</p>
            <div className="invoice-box mt-6 text-left">
              <div className="flex justify-between"><span>Invoice total</span><b>{currency(total)}</b></div>
              <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Confirmation sent to</span><span>{user?.email || 'guest@nexatech.com'}</span></div>
            </div>
            <button onClick={onClose} className="mt-6 w-full rounded-lg bg-[#4438ca] py-3 text-sm font-bold text-white">Continue shopping</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-widest text-[#4438ca]">Checkout</p><h2 className="mt-1 text-xl font-black">Secure payment</h2></div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
            </div>
            <div className="payment-preview mt-6">
              <span className="text-xs font-bold text-indigo-200">NEXA<span className="text-white">PAY</span></span>
              <span className="text-xl tracking-[0.2em]">Total: {currency(total)}</span>
              <div className="flex justify-between text-[10px] text-indigo-200"><span>{items.length} ITEM{items.length > 1 ? 'S' : ''}</span><span>SECURE</span></div>
            </div>
            {error && <p className="mt-4 text-xs font-semibold text-[#ef2d48]">{error}</p>}
            {stripeReady ? (
              <button disabled={processing} onClick={handleStripe} className="mt-6 w-full rounded-lg bg-[#4438ca] py-3 text-sm font-bold text-white disabled:opacity-60">
                {processing ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
              </button>
            ) : (
              <button disabled={processing} onClick={handleDemo} className="mt-6 w-full rounded-lg bg-[#4438ca] py-3 text-sm font-bold text-white disabled:opacity-60">
                {processing ? 'Processing...' : 'Pay securely (demo)'}
              </button>
            )}
            <p className="mt-3 text-center text-[10px] text-slate-400">
              <ShieldCheck className="mr-1 inline h-3 w-3" />
              {stripeReady ? 'You will be redirected to Stripe to complete your payment.' : 'Demo checkout — no real charge is made. Add a Stripe key for real payments.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ProductDetail({ product, user, onAdd, onBuyNow, onBack }: { product: Product; user: User | null; onAdd: (product: Product) => void; onBuyNow: (product: Product) => void; onBack: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadReviews = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_product_reviews', { p_product_id: product.id });
    if (error) { console.error('[reviews] load error:', error.message); return; }
    setReviews((data || []) as Review[]);
  }, [product.id]);

  useEffect(() => {
    setLoading(true); void loadReviews().finally(() => setLoading(false));
  }, [loadReviews]);

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { setReviewError('Please sign in to leave a review.'); return; }
    setReviewError(''); setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_review', {
        p_product_id: product.id, p_rating: myRating, p_comment: myComment.trim() || null,
      });
      if (error) throw error;
      setReviewSuccess(true); setMyComment('');
      await loadReviews();
      window.setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit review.';
      setReviewError(message);
    } finally { setSubmitting(false); }
  };

  const outOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to store</button>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl bg-[#f3f5fb]">
          <img src={product.image} alt={product.name} className="h-full w-full rounded-2xl object-cover mix-blend-multiply" />
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{product.category}</p>
          <h1 className="text-3xl font-black tracking-tight">{product.name}</h1>
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(product.rating)} size="h-5 w-5" />
            <span className="text-sm font-semibold text-slate-700">{product.rating}</span>
            <span className="text-sm text-slate-400">({product.reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-slate-900">{currency(product.price)}</span>
            <span className="text-lg text-slate-400 line-through">{currency(product.originalPrice)}</span>
            {product.badge && <span className="rounded-md bg-[#ef2d48] px-2 py-1 text-[10px] font-bold uppercase text-white">{product.badge}</span>}
          </div>
          {product.stock !== undefined && (
            <p className={`text-sm font-semibold ${outOfStock ? 'text-red-600' : product.stock <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
              {outOfStock ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left in stock!` : `${product.stock} in stock`}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => onAdd(product)}
              disabled={outOfStock}
              className="flex-1 rounded-lg bg-[#4438ca] py-3.5 text-sm font-bold text-white hover:bg-[#3730a3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {outOfStock ? 'Sold out' : 'Add to cart'}
            </button>
            <button
              onClick={() => onBuyNow(product)}
              disabled={outOfStock}
              className="flex-1 rounded-lg bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {outOfStock ? 'Sold out' : 'Buy Now'}
            </button>
          </div>
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-black">Reviews ({reviews.length})</h2>
            {loading ? <p className="mt-3 text-sm text-slate-400">Loading reviews...</p> : reviews.length === 0 ? <p className="mt-3 text-sm text-slate-400">No reviews yet. Be the first!</p> : (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{review.display_name}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(review.created_at)}</span>
                    </div>
                    <div className="mt-1"><StarRating value={review.rating} size="h-3.5 w-3.5" /></div>
                    {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={submitReview} className="mt-6 space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold">{user ? 'Write a review' : 'Sign in to review'}</h3>
              <StarRating value={myRating} onChange={setMyRating} size="h-6 w-6" />
              <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Share your thoughts (optional)" rows={3} className="form-input resize-none" />
              {reviewError && <p className="text-xs font-semibold text-[#ef2d48]">{reviewError}</p>}
              {reviewSuccess && <p className="text-xs font-semibold text-emerald-600">Review submitted! Thank you.</p>}
              <button type="submit" disabled={!user || submitting} className="w-full rounded-lg bg-[#4438ca] py-2.5 text-xs font-bold text-white disabled:opacity-40">
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountPage({ user, orders, onView, onLogout }: { user: User; orders: Order[]; onView: (view: View) => void; onLogout: () => Promise<void> }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#4438ca]">Account</p>
        <h1 className="mt-1 text-3xl font-black">Welcome, {user.name}</h1>
        <p className="mt-2 text-sm text-slate-500">{user.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => onView('orders')} className="stat-card text-left hover:shadow-md">
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#4438ca]" /> Order history</span>
          <b>{orders.length}</b>
          <small>View your past orders</small>
        </button>
        <button onClick={() => onView('store')} className="stat-card text-left hover:shadow-md">
          <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#4438ca]" /> Continue shopping</span>
          <b>Browse</b>
          <small>Back to the store</small>
        </button>
      </div>
      <button onClick={onLogout} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500"><LogOut className="h-4 w-4" /> Sign out</button>
    </div>
  );
}

function OrdersPage({ orders, onBack }: { orders: Order[]; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#4438ca]">History</p><h1 className="mt-1 text-3xl font-black">Your orders</h1></div>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <b className="text-sm">#{order.id.slice(0, 8)}</b>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(order.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">{order.status}</span>
                  <span className="font-black">{currency(order.total)}</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img src={item.image} alt="" className="h-8 w-8 rounded object-cover mix-blend-multiply" />
                    <span className="flex-1 font-semibold">{item.name}</span>
                    <span className="text-slate-400">×{item.quantity}</span>
                    <span className="font-bold">{currency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPage({ products, orders, onSaveProduct, onDeleteProduct, onLogout, onStore }: {
  products: Product[];
  orders: Order[];
  onSaveProduct: (product: Product, editingId: number | null) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  onLogout: () => Promise<void>;
  onStore: () => void;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<Product>>({});
  const [error, setError] = useState('');
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const openForm = (product?: Product) => {
    setDraft(product || { name: '', category: 'Audio', price: 0, originalPrice: 0, rating: 5, reviews: 0, image: seedProducts[2].image, badge: 'New', stock: 50 });
    setEditing(product || null);
    setShowForm(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const price = Number(draft.price);
    const originalPrice = Number(draft.originalPrice);
    const stock = Number(draft.stock ?? 50);
    if (!draft.name?.trim() || !draft.image?.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(originalPrice) || originalPrice < price) {
      setError('Enter a product name, image, and valid prices.'); return;
    }
    const next: Product = { id: editing?.id || 0, name: draft.name.trim(), category: draft.category || 'Accessories', price, originalPrice, rating: Number(draft.rating) || 5, reviews: Number(draft.reviews) || 0, image: draft.image.trim(), badge: draft.badge || 'New', stock };
    try { await onSaveProduct(next, editing?.id || null); setShowForm(false); setError(''); } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this product.';
      console.error('[AdminPage] saveProduct failed:', err);
      setError(message);
    }
  };
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="admin-topbar">
        <button onClick={onStore} className="flex items-center gap-2 text-sm font-black"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4438ca] text-white"><Zap className="h-4 w-4 fill-white" /></span>NEXATECH <span className="ml-2 rounded bg-indigo-100 px-2 py-1 text-[9px] font-bold uppercase text-[#4438ca]">Admin</span></button>
        <div className="flex items-center gap-4 text-sm text-slate-500"><button onClick={onStore} className="hidden sm:block">View store</button><button onClick={onLogout} className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Sign out</button></div>
      </div>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div><p className="text-xs font-bold uppercase tracking-widest text-[#4438ca]">Overview</p><h1 className="mt-1 text-3xl font-black">Good morning, Admin</h1><p className="mt-2 text-sm text-slate-500">Manage your catalog and keep an eye on store performance.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card"><span>Total sales</span><b>{currency(totalSales || 24850)}</b><small className="text-emerald-600">+18.4% this month</small></div>
          <div className="stat-card"><span>Total orders</span><b>{orders.length || 124}</b><small className="text-emerald-600">+12.6% this month</small></div>
          <div className="stat-card"><span>Products</span><b>{products.length}</b><small>Active in catalog</small></div>
          <div className="stat-card"><span>Conversion rate</span><b>4.8%</b><small className="text-emerald-600">+0.7% this month</small></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="admin-panel">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-black">Sales overview</h2><p className="mt-1 text-xs text-slate-500">Revenue over the last 7 months</p></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">Last 7 months <ChevronDown className="ml-1 inline h-3 w-3" /></button></div>
            <div className="chart"><div className="chart-bars">{[48, 62, 43, 72, 58, 84, 96].map((h, i) => <div key={i} className="chart-column"><span style={{ height: `${h}%` }} /><small>{['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'][i]}</small></div>)}</div></div>
          </section>
          <section className="admin-panel">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">Recent orders</h2><Package className="h-5 w-5 text-[#4438ca]" /></div>
            {orders.slice(0, 4).map((order) => <div key={order.id} className="flex items-center justify-between border-b border-slate-100 py-3 text-xs"><div><b>#{order.id.slice(0, 8)}</b><p className="mt-1 text-slate-400">{order.email}</p></div><span className="font-bold">{currency(order.total)}</span></div>)}
            {!orders.length && <p className="rounded-lg bg-slate-50 p-5 text-center text-xs text-slate-500">Orders will appear here after checkout.</p>}
          </section>
        </div>
        <section className="admin-panel">
          <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-black">Product catalog</h2><p className="mt-1 text-xs text-slate-500">Add, edit, and manage your store products.</p></div><button onClick={() => openForm()} className="flex items-center gap-2 rounded-lg bg-[#4438ca] px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add product</button></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400"><tr><th className="pb-3">Product</th><th className="pb-3">Category</th><th className="pb-3">Price</th><th className="pb-3">Stock</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100">
                    <td className="py-3"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-9 w-9 rounded object-cover mix-blend-multiply" /><b>{product.name}</b></div></td>
                    <td className="py-3 text-slate-500">{product.category}</td>
                    <td className="py-3 font-bold">{currency(product.price)}</td>
                    <td className="py-3"><span className={product.stock !== undefined && product.stock <= 5 ? 'font-bold text-orange-500' : ''}>{product.stock ?? '—'}</span></td>
                    <td className="py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${product.stock !== undefined && product.stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{product.stock !== undefined && product.stock <= 0 ? 'Sold out' : 'Active'}</span></td>
                    <td className="py-3 text-right">
                      <button onClick={() => openForm(product)} className="mr-2 rounded p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { void onDeleteProduct(product.id); }} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      {showForm && (
        <div className="modal-backdrop">
          <form onSubmit={submit} className="product-form">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">{editing ? 'Edit product' : 'Add product'}</h2><button type="button" onClick={() => setShowForm(false)}><X /></button></div>
            {error && <p className="mt-4 text-xs font-semibold text-[#ef2d48]">{error}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input required value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Product name" className="form-input sm:col-span-2" />
              <select value={draft.category || 'Audio'} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="form-input">{categories.map((c) => <option key={c}>{c}</option>)}</select>
              <input value={draft.badge || ''} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} placeholder="Badge" className="form-input" />
              <input required type="number" value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} placeholder="Sale price" className="form-input" />
              <input required type="number" value={draft.originalPrice || ''} onChange={(e) => setDraft({ ...draft, originalPrice: Number(e.target.value) })} placeholder="Original price" className="form-input" />
              <input required type="number" value={draft.stock ?? 50} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} placeholder="Stock quantity" className="form-input sm:col-span-2" />
              <input required value={draft.image || ''} onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="Image URL" className="form-input sm:col-span-2" />
            </div>
            <button className="mt-5 w-full rounded-lg bg-[#4438ca] py-3 text-sm font-bold text-white">Save product</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Storefront({ products, search, setSearch, activeCategory, setActiveCategory, onAdd, onBuyNow, onView }: {
  products: Product[];
  search: string;
  setSearch: (value: string) => void;
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  onAdd: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onView: (id: number) => void;
}) {
  const filtered = useMemo(() =>
    products.filter((p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())) &&
      (activeCategory === 'All' || p.category === activeCategory)
    ), [products, search, activeCategory]);

  return (
    <main id="top" className="mx-auto max-w-7xl space-y-10 px-4 py-7 sm:px-6 lg:px-8">
      <section className="hero-banner relative overflow-hidden rounded-2xl bg-[#080817] px-7 py-10 text-white sm:px-14 sm:py-14">
        <div className="relative z-10 max-w-sm">
          <span className="mb-4 inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">New collection 2025</span>
          <h1 className="text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">Future<br /><span className="text-indigo-300">Technology</span><br />Today.</h1>
          <p className="mt-4 max-w-xs text-xs leading-5 text-slate-300">Explore the latest smart devices and innovations designed for your everyday.</p>
          <button onClick={() => document.getElementById('store')?.scrollIntoView({ behavior: 'smooth' })} className="mt-7 rounded-lg bg-[#5146e5] px-5 py-3 text-xs font-bold text-white hover:bg-indigo-400">Shop Now <ArrowRight className="ml-2 inline h-3.5 w-3.5" /></button>
        </div>
        <div className="hero-orbit" /><div className="hero-devices"><div className="phone-shape" /><div className="earbuds-shape"><span /><span /></div><div className="watch-shape">10:09</div></div>
      </section>
      <section id="categories" className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-4">
        <button onClick={() => setActiveCategory('All')} className={`category-tile ${activeCategory === 'All' ? 'category-active' : ''}`}><span className="category-icon">⊙</span><span className="text-[10px] font-bold text-slate-700">All items</span><span className="text-[9px] text-slate-400">View all</span></button>
        {categories.map((category) => <button key={category} onClick={() => setActiveCategory(activeCategory === category ? 'All' : category)} className={`category-tile ${activeCategory === category ? 'category-active' : ''}`}><span className="category-icon">◉</span><span className="text-[10px] font-bold text-slate-700">{category}</span><span className="text-[9px] text-slate-400">Explore</span></button>)}
      </section>
      <section id="deals" className="grid gap-4 md:grid-cols-3">
        <div className="deal-card bg-[#111827] text-white"><div><span className="text-[10px] font-bold uppercase text-slate-400">Limited time offer</span><h2 className="mt-2 text-xl font-black">MacBook Air M2</h2><p className="mt-1 text-[10px] text-slate-300">Starting from $999.00</p><button onClick={() => setSearch('laptop')} className="mt-5 rounded-md bg-white px-3 py-2 text-[10px] font-bold text-slate-900">Shop now <ArrowRight className="ml-1 inline h-3 w-3" /></button></div><img src="https://images.pexels.com/photos/4006158/pexels-photo-4006158.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Laptop workspace" /></div>
        <div className="deal-card bg-[#4d32c8] text-white"><div><span className="text-[10px] font-bold uppercase text-indigo-200">Mega deal</span><h2 className="mt-2 text-xl font-black">Grab Up to<br />40% Off</h2><p className="mt-1 text-[10px] text-indigo-100">On selected items</p><button onClick={() => setActiveCategory('Audio')} className="mt-5 rounded-md bg-white px-3 py-2 text-[10px] font-bold text-slate-900">Shop deals <ArrowRight className="ml-1 inline h-3 w-3" /></button></div><img src="https://images.pexels.com/photos/14935011/pexels-photo-14935011.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Wireless headphones" /></div>
        <div className="grid gap-4">
          <div className="mini-deal bg-[#e4effd]"><div><h2 className="text-lg font-black text-slate-900">Sound That<br />Moves You.</h2><button onClick={() => setActiveCategory('Audio')} className="mt-3 rounded bg-white px-2 py-1.5 text-[10px] font-bold">Shop audio</button></div><img src="https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="White headphones" /></div>
          <div className="mini-deal bg-[#eaf4ca]"><div><h2 className="text-lg font-black text-slate-900">Capture Every<br />Detail.</h2><button onClick={() => setActiveCategory('Cameras')} className="mt-3 rounded bg-white px-2 py-1.5 text-[10px] font-bold">Shop cameras</button></div><img src="https://images.pexels.com/photos/10703759/pexels-photo-10703759.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Camera and accessories" /></div>
        </div>
      </section>
      <section id="store">
        <div className="mb-5 flex items-end justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4438ca]">Handpicked for you</p><h2 className="mt-1 text-2xl font-black tracking-tight">Flash Deals</h2></div>
          <button className="text-xs font-bold text-slate-600">View all deals <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button>
        </div>
        <div className="mb-5 flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="rounded bg-[#ef2d48] px-2 py-1 text-[10px] text-white">ENDS IN</span>
          <span className="rounded bg-white px-2 py-1 shadow-sm">07</span><b>:</b><span className="rounded bg-white px-2 py-1 shadow-sm">45</span><b>:</b><span className="rounded bg-white px-2 py-1 shadow-sm">32</span>
          {activeCategory !== 'All' && <button onClick={() => setActiveCategory('All')} className="ml-auto flex items-center gap-1 text-[#4438ca]">Clear filter <X className="h-3 w-3" /></button>}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onBuyNow={onBuyNow} onView={onView} />)}
        </div>
        {!filtered.length && <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">No products match that search.</p>}
      </section>
      <section id="new" className="border-t border-slate-200 pt-9">
        <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4438ca]">Just landed</p><h2 className="mt-1 text-2xl font-black tracking-tight">New Arrivals</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="new-arrival bg-[#e9e7ff]"><div><span className="rounded bg-[#4438ca] px-2 py-1 text-[9px] font-bold text-white">NEW</span><h3 className="mt-4 text-2xl font-black">AirPods Pro<br />(2nd Gen)</h3><p className="mt-2 max-w-[170px] text-xs text-slate-600">Active noise cancellation for an immersive sound.</p><button onClick={() => onView(5)} className="mt-5 rounded-lg bg-[#4438ca] px-4 py-2 text-[10px] font-bold text-white">Explore now <ArrowRight className="ml-1 inline h-3 w-3" /></button></div><img src="https://images.pexels.com/photos/33298190/pexels-photo-33298190.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="AirPods Pro" /></div>
          <div className="new-arrival bg-[#dff0ff]"><div><span className="rounded bg-[#0f766e] px-2 py-1 text-[9px] font-bold text-white">SMART LIVING</span><h3 className="mt-4 text-2xl font-black">Build your<br />perfect setup.</h3><p className="mt-2 max-w-[170px] text-xs text-slate-600">Everything you need to work, play, and create better.</p><button onClick={() => setActiveCategory('All')} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-[10px] font-bold text-white">Explore collection <ArrowRight className="ml-1 inline h-3 w-3" /></button></div><img src="https://images.pexels.com/photos/10703759/pexels-photo-10703759.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Modern tech setup" /></div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [view, setView] = useState<View>(window.location.pathname === '/admin' ? 'admin' : 'store');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [adminBypass, setAdminBypass] = useState(() => localStorage.getItem('nexa-admin-bypass') === '1');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [stripeReady] = useState(() => !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  useEffect(() => {
    try { const savedCart = localStorage.getItem('nexa-cart'); if (savedCart) setCart(JSON.parse(savedCart) as CartItem[]); } catch { setCart([]); }
  }, []);
  useEffect(() => { localStorage.setItem('nexa-cart', JSON.stringify(cart)); }, [cart]);

  const navigate = (next: View) => {
    setView(next);
    const path = next === 'admin' ? '/admin' : next === 'account' ? '/account' : next === 'orders' ? '/orders' : next === 'product' ? '/product' : next === 'demo-pay' ? '/demo-pay' : '/';
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname;
      setView(p === '/admin' ? 'admin' : p === '/account' ? 'account' : p === '/orders' ? 'orders' : p === '/demo-pay' ? 'demo-pay' : 'store');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0) return;
    setCart((items) => {
      const found = items.find((item) => item.id === product.id);
      return found ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your cart`);
    window.setTimeout(() => setNotice(''), 2200);
  };
  const changeCart = (id: number, amount: number) =>
    setCart((items) => items.flatMap((item) => item.id === id ? (item.quantity + amount > 0 ? [{ ...item, quantity: item.quantity + amount }] : []) : [item]));

  const buyNow = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0) return;
    setCart([{ ...product, quantity: 1 }]);
    navigate('demo-pay');
  };

  const loadProfile = async (authUser: { id: string; email?: string; user_metadata?: { name?: string } }) => {
    const { data, error } = await supabase.from('profiles').select('id, display_name, role').eq('id', authUser.id).maybeSingle();
    if (error) throw error;
    return { id: authUser.id, name: data?.display_name || authUser.user_metadata?.name || 'Nexa customer', email: authUser.email || '', role: data?.role === 'admin' ? 'admin' as const : 'customer' as const };
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [{ data: productRows, error: productError }, { data: sessionResult, error: sessionError }] = await Promise.all([
        supabase.from('products').select('id, name, category, price, original_price, rating, reviews, image, badge, stock').order('created_at'),
        supabase.auth.getSession(),
      ]);
      if (productError || sessionError) {
        if (mounted) setDataError('We could not load the store. Please refresh and try again.');
      } else if (mounted) {
        setProducts(((productRows || []) as ProductRow[]).map(fromProductRow));
        if (sessionResult.session?.user) {
          try { setUser(await loadProfile(sessionResult.session.user)); } catch { setDataError('We could not load your account.'); }
        }
      }
      if (mounted) {
        if (localStorage.getItem('nexa-admin-bypass') === '1') setUser({ id: 'admin-bypass', name: 'Nexa Admin', email: 'admin@tech.com', role: 'admin' });
        setLoading(false);
      }
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!mounted) return;
        if (!session?.user) { if (localStorage.getItem('nexa-admin-bypass') !== '1') setUser(null); return; }
        try { setUser(await loadProfile(session.user)); } catch { setUser(null); }
      })();
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || user.role === 'admin') { setOrders([]); return; }
    void supabase.from('orders').select('id, email, items, total, created_at, status').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) { setDataError('We could not load your orders.'); return; }
      setOrders(((data || []) as Array<{ id: string; email: string; items: CartItem[]; total: number; created_at: string; status: string }>).map((o) => ({ id: o.id, email: o.email, items: o.items, total: Number(o.total), date: o.created_at, status: o.status })));
    });
  }, [user]);

  const loginAsAdminBypass = () => { localStorage.setItem('nexa-admin-bypass', '1'); setAdminBypass(true); setUser({ id: 'admin-bypass', name: 'Nexa Admin', email: 'admin@tech.com', role: 'admin' }); navigate('admin'); };
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await loadProfile(data.user);
    setUser(profile);
    navigate(profile.role === 'admin' ? 'admin' : 'store');
  };
  const signup = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    navigate('store');
  };
  const logout = async () => {
    localStorage.removeItem('nexa-admin-bypass');
    setAdminBypass(false);
    await supabase.auth.signOut();
    setUser(null);
    navigate('store');
  };

  const saveProduct = async (product: Product, editingId: number | null) => {
    const { data: savedRow, error: saveError } = await supabase.rpc('save_product', {
      p_id: editingId, p_name: product.name, p_category: product.category, p_price: product.price,
      p_original_price: product.originalPrice, p_image: product.image, p_stock: product.stock ?? 50,
      p_rating: product.rating, p_reviews: product.reviews, p_badge: product.badge || 'New',
    });
    if (saveError || !savedRow || !(savedRow as ProductRow[]).length) {
      console.error('[saveProduct] Database error:', saveError?.message, saveError?.code);
      throw saveError || new Error('Product was not saved');
    }
    const savedProduct = fromProductRow((savedRow as ProductRow[])[0]);
    setProducts((current) => editingId ? current.map((item) => item.id === editingId ? savedProduct : item) : [savedProduct, ...current]);
  };
  const deleteProduct = async (id: number) => {
    const { error: deleteError } = await supabase.rpc('delete_product', { p_id: id });
    if (deleteError) { console.error('[deleteProduct] Database error:', deleteError.message); throw deleteError; }
    setProducts((current) => current.filter((item) => item.id !== id));
  };

  const completeOrder = async (items: CartItem[]) => {
    const { data, error } = await supabase.rpc('create_order', { p_items: items.map((item) => ({ id: item.id, quantity: item.quantity })) });
    if (error || !data) throw error || new Error('Order was not created');
    setCart([]);
    const orderId = String(data);
    const { data: latestOrders } = await supabase.from('orders').select('id, email, items, total, created_at, status').order('created_at', { ascending: false });
    if (latestOrders) setOrders((latestOrders as Array<{ id: string; email: string; items: CartItem[]; total: number; created_at: string; status: string }>).map((o) => ({ id: o.id, email: o.email, items: o.items, total: Number(o.total), date: o.created_at, status: o.status })));
    // Refresh products to get updated stock
    const { data: refreshed } = await supabase.from('products').select('id, name, category, price, original_price, rating, reviews, image, badge, stock').order('created_at');
    if (refreshed) setProducts(((refreshed as ProductRow[]).map(fromProductRow)));
    return orderId;
  };

  const startStripeCheckout = async () => {
    if (!user || user.role === 'admin') throw new Error('Please sign in as a customer to checkout.');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      body: JSON.stringify({ items: cart.map((item) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity, image: item.image })), origin: window.location.origin }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Checkout failed (${response.status})`);
    }
    const { url } = await response.json();
    if (url) window.location.href = url;
  };

  const selectedProduct = selectedProductId !== null ? products.find((p) => p.id === selectedProductId) || null : null;

  if (loading && view === 'store') return <div className="auth-shell"><div className="text-sm font-semibold text-slate-500">Loading NexaTech...</div></div>;
  if (view === 'login' || view === 'signup') return <AuthPage mode={view} onMode={setView} onLogin={login} onSignup={signup} onAdminBypass={loginAsAdminBypass} onBack={() => navigate('store')} />;
  if (view === 'admin') return (user?.role === 'admin' || adminBypass) ? <AdminPage products={products} orders={orders} onSaveProduct={saveProduct} onDeleteProduct={deleteProduct} onLogout={logout} onStore={() => navigate('store')} /> : <AuthPage mode="login" onMode={setView} onLogin={login} onSignup={signup} onAdminBypass={loginAsAdminBypass} onBack={() => navigate('store')} />;
  if (view === 'demo-pay') { const demoTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0; return <DemoPaymentForm total={demoTotal} onBack={() => navigate('store')} onComplete={async () => { setCart([]); }} />; }
  if (view === 'product' && selectedProduct) return <div className="min-h-screen bg-[#f8f9fc] text-slate-900"><Header user={user} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} search={search} setSearch={setSearch} onView={navigate} onCart={() => setCartOpen(true)} /><ProductDetail product={selectedProduct} user={user} onAdd={addToCart} onBuyNow={buyNow} onBack={() => navigate('store')} /></div>;
  if (view === 'account' && user) return <div className="min-h-screen bg-[#f8f9fc] text-slate-900"><Header user={user} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} search={search} setSearch={setSearch} onView={navigate} onCart={() => setCartOpen(true)} /><AccountPage user={user} orders={orders} onView={navigate} onLogout={logout} /></div>;
  if (view === 'orders' && user) return <div className="min-h-screen bg-[#f8f9fc] text-slate-900"><Header user={user} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} search={search} setSearch={setSearch} onView={navigate} onCart={() => setCartOpen(true)} /><OrdersPage orders={orders} onBack={() => navigate('store')} /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900">
      {dataError && <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-700">{dataError}</div>}
      {notice && <div className="toast"><ShoppingCart className="h-4 w-4" /> {notice}</div>}
      <Header user={user} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} search={search} setSearch={setSearch} onView={navigate} onCart={() => setCartOpen(true)} />
      <Storefront products={products} search={search} setSearch={setSearch} activeCategory={activeCategory} setActiveCategory={setActiveCategory} onAdd={addToCart} onBuyNow={buyNow} onView={(id) => { setSelectedProductId(id); navigate('product'); }} />
      <footer className="mt-12 bg-[#111827] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          <div><div className="flex items-center gap-2 text-lg font-black"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4438ca]"><Zap className="h-4 w-4 fill-white" /></span>NEXA<span className="text-indigo-300">TECH</span></div><p className="mt-4 max-w-xs text-xs leading-5 text-slate-400">Powering your world with the latest technology and thoughtful design.</p></div>
          <div><h4 className="text-xs font-bold">Customer service</h4><p className="mt-4 text-xs leading-7 text-slate-400">Help center<br />Shipping & delivery<br />Returns & refunds</p></div>
          <div><h4 className="text-xs font-bold">About NexaTech</h4><p className="mt-4 text-xs leading-7 text-slate-400">Our story<br />Careers<br />Contact us</p></div>
          <div><h4 className="text-xs font-bold">Stay in the loop</h4><p className="mt-4 text-xs text-slate-400">Get new product news and exclusive offers.</p><div className="mt-3 flex rounded-lg bg-white/10 p-1"><input className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" placeholder="Your email" /><button className="rounded bg-[#4438ca] p-2"><Bell className="h-3.5 w-3.5" /></button></div></div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[10px] text-slate-500">© 2025 NexaTech. All rights reserved.</div>
      </footer>
      {cartOpen && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onChange={changeCart} onCheckout={() => { setCartOpen(false); if (user && user.role !== 'admin') setCheckoutOpen(true); else navigate('login'); }} onDemoPay={() => { setCartOpen(false); navigate('demo-pay'); }} />}                         
    </div>
  );
}
