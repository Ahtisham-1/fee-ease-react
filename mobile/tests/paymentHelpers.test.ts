import assert from "node:assert/strict";
import test from "node:test";

import type { Payment } from "../src/types/index";
import {
  buildReceiptListViewModel,
  validatePaymentInput,
} from "../src/utils/paymentHelpers";

test("validatePaymentInput rejects invalid, decimal, zero, and over-balance amounts and accepts comma-grouped whole rupees", () => {
  assert.deepEqual(validatePaymentInput("", 2000), {
    valid: false,
    message: "Please enter a valid positive payment amount.",
  });
  assert.deepEqual(validatePaymentInput("0", 2000), {
    valid: false,
    message: "Please enter a valid positive payment amount.",
  });
  assert.deepEqual(validatePaymentInput("-500", 2000), {
    valid: false,
    message: "Please enter a valid positive payment amount.",
  });
  assert.deepEqual(validatePaymentInput("500.50", 2000), {
    valid: false,
    message: "Please enter a whole rupee amount without decimals.",
  });
  assert.deepEqual(validatePaymentInput("2500", 2000), {
    valid: false,
    message: "Payment amount cannot exceed the pending balance of ₹2,000.",
  });
  assert.deepEqual(validatePaymentInput("500", 0), {
    valid: false,
    message: "No pending fee balance remaining for this student.",
  });

  assert.deepEqual(validatePaymentInput(" 1,500 ", 2000), {
    valid: true,
    amount: 1500,
  });
});

test("buildReceiptListViewModel filters by student, sorts newest-first, and maps success vs failed display fields", () => {
  const payments: Payment[] = [
    {
      id: "10",
      amount: 1500,
      dateTime: "2026-04-05T10:00:00Z",
      belongsTo: "1",
      status: "SUCCESS",
    },
    {
      id: "11",
      amount: 2000,
      dateTime: "2026-04-05T10:00:00Z",
      belongsTo: "1",
      status: "FAILED",
    },
    {
      id: "12",
      amount: 3000,
      dateTime: "2026-05-01T08:00:00Z",
      belongsTo: "1",
      status: "SUCCESS",
    },
    {
      id: "99",
      amount: 5000,
      dateTime: "2026-06-01T08:00:00Z",
      belongsTo: "2",
      status: "SUCCESS",
    },
  ];

  const rows = buildReceiptListViewModel(payments, "1");
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((r) => r.id),
    ["12", "11", "10"],
  );

  assert.equal(rows[0].isSuccess, true);
  assert.equal(rows[0].statusLabel, "Success");
  assert.equal(rows[0].amountFormatted, "₹3,000");
  assert.equal(rows[0].failureNote, null);

  assert.equal(rows[1].isSuccess, false);
  assert.equal(rows[1].statusLabel, "Failed");
  assert.equal(rows[1].amountFormatted, "₹2,000");
  assert.match(rows[1].failureNote ?? "", /Balance not deducted/i);

  assert.deepEqual(buildReceiptListViewModel(payments, "unknown"), []);
});
