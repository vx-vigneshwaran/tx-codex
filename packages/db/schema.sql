CREATE TABLE IF NOT EXISTS tenant (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS membership (
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS oauth_client (
  app TEXT PRIMARY KEY,
  redirect_uris TEXT[] NOT NULL,
  scopes TEXT[] NOT NULL
);
