type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type Membership = {
  tenantSlug: string;
  role: string;
};

const tenants = new Map<string, Tenant>();
const memberships = new Map<string, Membership[]>();

export function createTenant(tenant: Tenant): Tenant {
  tenants.set(tenant.slug, tenant);
  return tenant;
}

export function listTenantsForUser(userId: string): Array<Tenant & { role?: string }> {
  const membershipList = memberships.get(userId) ?? [];
  return membershipList
    .map((entry) => tenants.get(entry.tenantSlug))
    .filter((tenant): tenant is Tenant => Boolean(tenant))
    .map((tenant) => ({ ...tenant, role: membershipList.find((m) => m.tenantSlug === tenant.slug)?.role }));
}

export function addMembership({ userId, tenantSlug, role }: { userId: string; tenantSlug: string; role: string }): void {
  const existing = memberships.get(userId) ?? [];
  existing.push({ tenantSlug, role });
  memberships.set(userId, existing);
}

export function assertMembership({ userId, tenantSlug }: { userId: string; tenantSlug: string }): Membership {
  const userMemberships = memberships.get(userId) ?? [];
  const hit = userMemberships.find((entry) => entry.tenantSlug === tenantSlug);
  if (!hit) {
    throw new Error("Forbidden: user is not a tenant member");
  }
  return hit;
}
