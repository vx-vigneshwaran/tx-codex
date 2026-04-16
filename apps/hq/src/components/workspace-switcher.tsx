type Tenant = { id: string; slug: string; name: string };

export function WorkspaceSwitcher(props: { tenants: Tenant[]; currentSlug: string }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", marginBottom: 6 }}>Workspace</span>
      <select
        value={props.currentSlug}
        onChange={(event) => {
          const slug = event.currentTarget.value;
          if (slug) window.location.href = `/t/${slug}`;
        }}
      >
        {props.tenants.map((tenant) => (
          <option key={tenant.slug} value={tenant.slug}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
