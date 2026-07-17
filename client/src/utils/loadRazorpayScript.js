const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Module-level cache of the in-flight/completed load attempt. Declared
 * outside the function so it's shared across every call site and every
 * component that imports this module — the whole point is that dozens of
 * components could call loadRazorpayScript() (e.g. re-mounting the
 * donation form) without ever injecting the <script> tag more than once.
 */
let loadPromise = null;

/**
 * Dynamically load the Razorpay Checkout SDK (checkout.js) exactly once,
 * no matter how many times or from how many components this is called.
 *
 * Loaded as a plain <script> tag (Razorpay's documented integration
 * method) rather than an npm package, since Checkout.js is meant to be
 * served fresh from Razorpay's CDN — bundling a pinned copy would risk
 * running a stale/unsupported version of their payment flow.
 *
 * @returns {Promise<boolean>} resolves true if the SDK is available
 *   (window.Razorpay exists) and false if it failed to load. This never
 *   rejects — callers can `if (await loadRazorpayScript())` without a
 *   try/catch, and a "true" result is a required precondition before
 *   constructing `new window.Razorpay(...)`.
 */
const loadRazorpayScript = () => {
  // Already loaded in this page session (e.g. a previous successful call,
  // or the script tag was added by some other means) — nothing to do.
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }

  // An in-flight or already-settled load attempt exists — every caller
  // shares that same promise instead of racing to add duplicate scripts.
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve) => {
    if (typeof document === 'undefined') {
      // Defensive guard for any non-browser context (e.g. SSR tooling);
      // this utility only makes sense in a real browser.
      resolve(false);
      return;
    }

    // Guard against a script tag already present in the DOM from some
    // other code path — reuse it instead of injecting a second one.
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => {
        // Reset so a later call can genuinely retry instead of being
        // permanently stuck on this one failure — see the matching note
        // below for why this reset (and the element removal) matters.
        loadPromise = null;
        existingScript.remove();
        resolve(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;

    script.onload = () => resolve(true);
    // Script failures (offline, ad-blocker, CDN outage) are handled
    // gracefully here rather than throwing — the caller decides how to
    // surface "payment is temporarily unavailable" to the donor.
    //
    // Failures are very often transient (a momentary network blip, an
    // ad-blocker rule that gets disabled, a CDN hiccup), so a failed
    // attempt must NOT permanently poison every future call. Resetting
    // loadPromise to null lets the next caller start a genuinely fresh
    // attempt; removing the failed <script> tag ensures that fresh
    // attempt injects a new element rather than being mistaken for an
    // "existing" tag that's already known to be broken.
    script.onerror = () => {
      loadPromise = null;
      script.remove();
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return loadPromise;
};

export default loadRazorpayScript;