import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyRazorpayWebhookSignature } from "../../src/lib/razorpay-webhook-signature";

const secret = "test-webhook-secret";
const body = JSON.stringify({ event: "subscription.activated", id: "evt_test_123" });

function sign(payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

describe("Razorpay webhook signature verification", () => {
  it("accepts a valid signature", () => {
    expect(verifyRazorpayWebhookSignature(body, sign(body), secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyRazorpayWebhookSignature(body, "0".repeat(64), secret)).toBe(false);
  });

  it("rejects a modified payload", () => {
    expect(
      verifyRazorpayWebhookSignature(body + " ", sign(body), secret),
    ).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyRazorpayWebhookSignature(body, null, secret)).toBe(false);
  });

  it("rejects a malformed signature", () => {
    expect(verifyRazorpayWebhookSignature(body, "not-a-signature", secret)).toBe(false);
  });
});
