import test from "node:test";
import assert from "node:assert/strict";
import { addMembership, assertMembership, createTenant, listTenantsForUser } from "../packages/core/src/tenants.ts";

test("tenant membership checks are server-side", () => {
  createTenant({ id: "tenant-1", name: "Acme", slug: "acme" });
  addMembership({ userId: "user-1", tenantSlug: "acme", role: "owner" });

  const membership = assertMembership({ userId: "user-1", tenantSlug: "acme" });
  assert.equal(membership.role, "owner");

  const list = listTenantsForUser("user-1");
  assert.equal(list.length >= 1, true);
});
