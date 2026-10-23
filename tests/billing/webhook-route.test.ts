
import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const secret = "test-webhook-secret";

process.env.RAZORPAY_WEBHOOK_SECRET = secret;

const mocks = vi.hoisted(() => ({
  findEvent: vi.fn(),
  createEvent: vi.fn(),
  findSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  transaction: vi.fn(),
  fetchSubscription: vi.fn(),
  getPlan: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    razorpayWebhookEvent: {
      findUnique: mocks.findEvent,
      create: mocks.createEvent,
    },
    subscription: {
      findFirst: mocks.findSubscription,
      update: mocks.updateSubscription,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/razorpay", () => ({
  razorpay: {
    subscriptions: {
      fetch: mocks.fetchSubscription,
    },
  },
}));

vi.mock("@/lib/razorpay-plans", () => ({
  getPlanFromRazorpayPlanId: mocks.getPlan,
}));

import { POST } from "@/../app/api/billing/webhooks/route";

function makeRequest(payload: object) {
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return new Request("http://localhost/api/billing/webhooks", {
    method: "POST",
    headers: { "x-razorpay-signature": signature },
    body,
  });
}

const event = {
  id: "evt_test_123",
  event: "subscription.activated",
  payload: {
    subscription: {
      entity: { id: "sub_test_123" },
    },
  },
};

describe("Razorpay webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.RAZORPAY_WEBHOOK_SECRET = secret;

    mocks.findEvent.mockResolvedValue(null);
    mocks.createEvent.mockResolvedValue({ id: "event-row-1" });

    mocks.findSubscription.mockResolvedValue({
      id: "subscription-row-1",
      plan: "FREE",
      status: "ACTIVE",
      razorpayCustomerId: null,
    });

    mocks.updateSubscription.mockResolvedValue({});

    mocks.fetchSubscription.mockResolvedValue({
      id: "sub_test_123",
      status: "active",
      plan_id: "razorpay_pro_plan",
      customer_id: "cust_test_123",
      current_start: 1790000000,
      current_end: 1792500000,
    });

    mocks.getPlan.mockReturnValue("PRO");

    mocks.transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          razorpayWebhookEvent: {
            create: mocks.createEvent,
          },
          subscription: {
            findFirst: mocks.findSubscription,
            update: mocks.updateSubscription,
          },
        }),
    );
  });

  it("rejects an invalid signature", async () => {
    const request = new Request(
      "http://localhost/api/billing/webhooks",
      {
        method: "POST",
        headers: {
          "x-razorpay-signature": "0".repeat(64),
        },
        body: JSON.stringify(event),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.findEvent).not.toHaveBeenCalled();
  });

  it("acknowledges duplicate events without fetching Razorpay", async () => {
    mocks.findEvent.mockResolvedValue({ id: "already-processed" });

    const response = await POST(makeRequest(event));

    expect(response.status).toBe(200);
    expect(mocks.fetchSubscription).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("activates a paid subscription", async () => {
    const response = await POST(makeRequest(event));

    expect(response.status).toBe(200);
    expect(mocks.updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "subscription-row-1" },
        data: expect.objectContaining({
          plan: "PRO",
          status: "ACTIVE",
        }),
      }),
    );
  });

  it("marks a cancelled subscription as cancelled", async () => {
    mocks.fetchSubscription.mockResolvedValue({
      id: "sub_test_123",
      status: "cancelled",
      customer_id: "cust_test_123",
    });

    const response = await POST(makeRequest(event));

    expect(response.status).toBe(200);
    expect(mocks.updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "subscription-row-1" },
        data: expect.objectContaining({
          status: "CANCELLED",
        }),
      }),
    );
  });

  it("marks an expired subscription as expired", async () => {
    mocks.fetchSubscription.mockResolvedValue({
      id: "sub_test_123",
      status: "expired",
      customer_id: "cust_test_123",
    });

    const response = await POST(makeRequest(event));

    expect(response.status).toBe(200);
    expect(mocks.updateSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "subscription-row-1" },
        data: expect.objectContaining({
          status: "EXPIRED",
        }),
      }),
    );
  });

  it("returns 500 when processing fails so the event can be retried", async () => {
    mocks.transaction.mockRejectedValue(
      new Error("database unavailable"),
    );

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const response = await POST(makeRequest(event));

      expect(response.status).toBe(500);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
