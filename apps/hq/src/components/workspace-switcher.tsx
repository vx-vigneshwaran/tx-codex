type TenantOption = {
  slug: string;
  name: string;
};

export function WorkspaceSwitcher({ tenants, currentSlug }: { tenants: TenantOption[]; currentSlug?: string }) {
  return (
    <div className="workspace-switcher">
      <label htmlFor="workspace">Workspace</label>
      <select
        id="workspace"
        value={currentSlug}
        onChange={(event) => {
          window.location.href = `/t/${event.target.value}`;
        }}
      >
        {tenants.map((tenant) => (
          <option key={tenant.slug} value={tenant.slug}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}
