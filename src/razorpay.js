// Loads Razorpay's Checkout script on demand (only when the customer clicks Pay).
let loading;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay failed to load.")));
      s.onerror = () => {
        loading = null; // allow a retry
        reject(new Error("Couldn't load the payment window. Check your internet connection and try again."));
      };
      document.body.appendChild(s);
    });
  }
  return loading;
}
