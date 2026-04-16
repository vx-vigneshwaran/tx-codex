
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
