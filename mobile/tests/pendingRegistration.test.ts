import assert from "node:assert/strict";
import test from "node:test";

import {
  clearPendingRegistration,
  getPendingRegistration,
  PENDING_REGISTRATION_TTL_MS,
  setPendingRegistration,
} from "../src/utils/pendingRegistration";

test("pendingRegistration stores credentials in memory by normalized email and clears on wipe", () => {
  clearPendingRegistration();
  const baseNow = 1_700_000_000_000;

  setPendingRegistration("  Parent@Example.COM ", "StrongPass1", baseNow);

  assert.deepEqual(getPendingRegistration("parent@example.com", baseNow + 1000), {
    email: "parent@example.com",
    password: "StrongPass1",
  });
  assert.equal(getPendingRegistration("other@example.com", baseNow + 1000), null);

  clearPendingRegistration();
  assert.equal(getPendingRegistration("parent@example.com", baseNow + 1000), null);
});

test("pendingRegistration auto-expires credentials after TTL", () => {
  clearPendingRegistration();
  const baseNow = 1_700_000_000_000;

  setPendingRegistration("parent@example.com", "StrongPass1", baseNow);
  assert.equal(
    getPendingRegistration("parent@example.com", baseNow + PENDING_REGISTRATION_TTL_MS + 1),
    null,
  );
  // Also cleared permanently once expired.
  assert.equal(getPendingRegistration("parent@example.com", baseNow), null);
});
