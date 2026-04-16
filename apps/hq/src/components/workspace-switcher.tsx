import { Select, SelectItem } from "@heroui/react";

type Tenant = { id: string; slug: string; name: string };

export function WorkspaceSwitcher(props: { tenants: Tenant[]; currentSlug: string }) {
  return (
    <Select
      label="Workspace"
      selectedKeys={[props.currentSlug]}
      onSelectionChange={(keys) => {
        const [slug] = [...keys].map(String);
        if (slug) window.location.href = `/t/${slug}`;
      }}
    >
      {props.tenants.map((tenant) => (
        <SelectItem key={tenant.slug}>{tenant.name}</SelectItem>
      ))}
    </Select>
  );
}
