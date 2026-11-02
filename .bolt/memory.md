# Project memory

## Product intent & audience

- E-commerce store built with Vite + React, Tailwind CSS, Lucide React icons
- Shopping cart with checkout flow; demo payment form accessible from cart drawer
- Audience: shoppers/end-users; payment form is a production-quality demo (no real charges)

## Brand personality & voice

- Modern, polished, premium e-commerce experience
- "Beautiful, not cookie cutter" — production-worthy UI is a core expectation

## Visual design & UX direction

- Dark-mode UI with indigo gradients and glowing sheen effects
- 3D credit card preview: live-updating, flips to back on CVC focus
- Auto-formatting: card numbers spaced every 4 digits, expiry as MM/YY
- Card brand detection (VISA, Mastercard, AMEX, Discover) via corner badge
- Smooth focus animations on inputs; 3D flip animation on card
- Success state: animated checkmark, receipt summary (amount, masked card, cardholder, approved status), "Continue shopping" CTA
- Simulated processing delay (~1.8s) with loading spinner before success screen
- Field validation with inline hints for incomplete values

## Decisions, constraints & rationale

- Component route: `DemoPaymentForm` added as new view/component, wired into App routing
- Navigation: cart drawer includes "Try the demo payment form" button below regular checkout
- CartDrawer component extended to accept new prop for navigation callback
- Amount pre-filled from cart total (or $0.00 if cart empty)
- View type enum extended to include demo payment form route
- Path alias `@/` used for all imports; no extra UI/icon packages installed
- Existing app uses a custom routing pattern (navigate path + popstate handler + view render switch)

## Open questions & assumptions

- Assumed existing app has a View type/enum, App.tsx routing switch, and CartDrawer component — confirmed via code inspection
- No persistence of payment state beyond success screen (no order history integration)
- Cart total passed as prop; no real payment gateway integration intended