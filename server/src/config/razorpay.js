import Razorpay from "razorpay";
import { HttpError } from "../utils/errors.js";

let client;

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID;
}

export function getRazorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new HttpError(503, "Payments are not configured on the server (missing Razorpay keys).");
  }
  if (!client) client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  return client;
}
