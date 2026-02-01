-- ====================================
-- InspireWallet Gateway Database Init
-- ====================================
-- This script runs automatically when the PostgreSQL container starts
-- for the first time.

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS audit;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE inspirewallet TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'InspireWallet database initialized successfully at %', now();
END
$$;
