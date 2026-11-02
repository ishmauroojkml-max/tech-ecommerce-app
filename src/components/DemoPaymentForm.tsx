import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Check, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { currency } from '@/lib/utils';

type DemoPaymentFormProps = {
  total: number;
  onBack: () => void;
  onComplete: () => Promise<void>;
};

const formatCardNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const detectBrand = (digits: string) => {
  const n = digits.replace(/\s/g, '');
  if (/^4/.test(n)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'MASTERCARD';
  if (/^3[47]/.test(n)) return 'AMEX';
  if (/^6/.test(n)) return 'DISCOVER';
  return '';
};

export default function DemoPaymentForm({ total, onBack, onComplete }: DemoPaymentFormProps) {
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const digits = cardNumber.replace(/\s/g, '');
  const brand = useMemo(() => detectBrand(cardNumber), [cardNumber]);

  const maskedNumber = useMemo(() => {
    const groups = [0, 1, 2, 3].map((i) => digits.slice(i * 4, i * 4 + 4) || '••••');
    return groups.join(' ');
  }, [digits]);

  const expiryValid = /^\d{2}\/\d{2}$/.test(expiry);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const nameValid = name.trim().length > 1;
  const cardValid = digits.length >= 15;
  const formValid = expiryValid && cvcValid && nameValid && cardValid;

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    if (!formValid || status !== 'idle') return;
    setStatus('processing');
    await new Promise((r) => setTimeout(r, 1800));
    try {
      await onComplete();
      setStatus('success');
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="demo-pay-shell">
        <div className="demo-pay-card-success">
          <div className="demo-pay-success-ring">
            <Check className="h-9 w-9 text-emerald-400" strokeWidth={3} />
          </div>
          <h2 className="mt-6 text-2xl font-black text-white">Payment Successful</h2>
          <p className="mt-2 text-sm text-slate-400">Your payment of <b className="text-white">{currency(total)}</b> has been confirmed. A receipt has been sent to your email.</p>
          <div className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left text-xs">
            <div className="flex justify-between text-slate-400"><span>Amount</span><span className="font-bold text-white">{currency(total)}</span></div>
            <div className="mt-2 flex justify-between text-slate-400"><span>Card</span><span className="font-bold text-white">•••• {digits.slice(-4) || '0000'}</span></div>
            <div className="mt-2 flex justify-between text-slate-400"><span>Cardholder</span><span className="font-bold text-white">{name.trim() || 'Guest User'}</span></div>
            <div className="mt-2 flex justify-between text-slate-400"><span>Status</span><span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">Approved</span></div>
          </div>
          <button onClick={onBack} className="mt-6 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition hover:bg-indigo-400">
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-pay-shell">
      <button onClick={onBack} className="absolute left-5 top-5 flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to store
      </button>

      <div className="demo-pay-grid">
        {/* Live card preview */}
        <div className="demo-pay-preview-wrap">
          <div className={`demo-pay-card ${flipped ? 'is-flipped' : ''}`}>
            {/* Front */}
            <div className="demo-pay-card-face demo-pay-card-front">
              <div className="demo-pay-card-glow" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                    <CreditCard className="h-5 w-5 text-white" />
                  </span>
                  <span className="text-sm font-bold tracking-wide text-white/90">NEXAPAY</span>
                </div>
                <span className="text-xs font-black tracking-[0.2em] text-white/70">{brand || 'CARD'}</span>
              </div>
              <div className="relative mt-8 h-10 w-14 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500/80 shadow-inner" />
              <p className="mt-6 font-mono text-lg tracking-[0.12em] text-white sm:text-xl">{maskedNumber}</p>
              <div className="mt-5 flex items-end justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50">Cardholder</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{name.trim() || 'YOUR NAME'}</p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50">Expires</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white">{expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>
            {/* Back */}
            <div className="demo-pay-card-face demo-pay-card-back">
              <div className="demo-pay-card-glow" />
              <div className="mt-5 h-10 w-full bg-black/70" />
              <div className="mt-5 flex items-center">
                <div className="h-9 flex-1 rounded-r bg-white/85" />
                <div className="demo-pay-cvc-strip font-mono text-sm font-bold text-slate-800">{cvc || '•••'}</div>
              </div>
              <p className="mt-6 text-[9px] font-semibold uppercase tracking-widest text-white/50">Authorized signature</p>
              <div className="mt-1 h-7 w-full rounded bg-white/20" />
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">Card preview updates live as you type below</p>
        </div>

        {/* Form */}
        <form onSubmit={handlePay} className="demo-pay-form" noValidate>
          <h1 className="text-2xl font-black text-white">Checkout</h1>
          <p className="mt-1 text-sm text-slate-400">Complete your secure demo payment of <b className="text-white">{currency(total)}</b></p>

          <div className="mt-7 space-y-5">
            <div>
              <label className="demo-pay-label">Cardholder name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                placeholder="John Appleseed"
                className="demo-pay-input"
                autoComplete="cc-name"
              />
            </div>
            <div>
              <label className="demo-pay-label">Card number</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                onFocus={() => setFlipped(false)}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                className="demo-pay-input"
                autoComplete="cc-number"
              />
              {digits.length > 0 && !cardValid && <p className="demo-pay-hint">Enter a valid 16-digit card number.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="demo-pay-label">Expiry date</label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  onFocus={() => setFlipped(false)}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  className="demo-pay-input"
                  autoComplete="cc-exp"
                />
                {expiry.length > 0 && !expiryValid && <p className="demo-pay-hint">Use MM/YY format.</p>}
              </div>
              <div>
                <label className="demo-pay-label">CVC</label>
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  placeholder="123"
                  inputMode="numeric"
                  className="demo-pay-input"
                  autoComplete="cc-csc"
                />
                {cvc.length > 0 && !cvcValid && <p className="demo-pay-hint">3–4 digits.</p>}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!formValid || status === 'processing'}
            className="demo-pay-submit"
          >
            {status === 'processing' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              <><Lock className="h-4 w-4" /> Pay {currency(total)}</>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Demo payment — no real charge is made. 256-bit secured.
          </div>
        </form>
      </div>
    </div>
  );
}
