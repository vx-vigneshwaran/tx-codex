CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS membership (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS oauth_client (
  app TEXT PRIMARY KEY,
  redirect_uris TEXT[] NOT NULL,
  scopes TEXT[] NOT NULL

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT
);

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE
);

CREATE TABLE memberships (
  user_id TEXT,
  tenant_id TEXT,
  role TEXT
);

CREATE TABLE app_access (
  user_id TEXT,
  app_id TEXT,
  scopes TEXT
);
