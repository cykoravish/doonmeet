// Sponsored-post pricing — safe to import from client components (no secrets).

export const PROMOTION_CURRENCY = "INR";
/** Price of one sponsored week, in paise (Razorpay amounts are integers in the smallest unit). */
export const PROMOTION_PRICE_PAISE = 4900;
export const PROMOTION_DAYS = 7;
/** Don't let anyone pre-pay more than this far ahead (stops accidental repeat purchases). */
export const PROMOTION_MAX_QUEUE_DAYS = 28;

export const PROMOTION_PRICE_LABEL = `₹${PROMOTION_PRICE_PAISE / 100}`;
export const PROMOTION_PLAN_LABEL = `${PROMOTION_PRICE_LABEL} / ${PROMOTION_DAYS} days`;
