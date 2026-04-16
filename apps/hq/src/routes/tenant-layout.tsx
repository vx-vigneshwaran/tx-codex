import { WorkspaceSwitcher } from "../components/workspace-switcher";

export function TenantLayout({ tenantSlug, children }: { tenantSlug: string; children: unknown }) {
  return (
    <main>
      <WorkspaceSwitcher
        currentSlug={tenantSlug}
        tenants={[
          { slug: "acme", name: "Acme" },
          { slug: "globex", name: "Globex" },
        ]}
      />
      {children as any}
    </main>
  );
}
