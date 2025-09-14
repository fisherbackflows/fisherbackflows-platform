-- Add constraints and indexes (execute after the ALTER TABLE above)

ALTER TABLE companies
DROP CONSTRAINT IF EXISTS companies_name_check,
DROP CONSTRAINT IF EXISTS companies_slug_check,
DROP CONSTRAINT IF EXISTS companies_subdomain_check;

ALTER TABLE companies
ADD CONSTRAINT companies_name_check CHECK (LENGTH(name) >= 2),
ADD CONSTRAINT companies_slug_check CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$'),
ADD CONSTRAINT companies_subdomain_check CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$');

CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug);
CREATE UNIQUE INDEX IF NOT EXISTS companies_subdomain_unique ON companies(subdomain);

UPDATE companies
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE (slug IS NULL OR slug = '') AND name IS NOT NULL AND TRIM(name) != '';

UPDATE companies
SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g')
WHERE slug IS NOT NULL;

UPDATE companies
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL;