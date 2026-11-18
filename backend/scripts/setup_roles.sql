-- ============================================================================
-- YatraSetu Platform — Production Database Role Provisioning Script
-- ============================================================================
-- Purpose:
--   Establishes strict database-level separation of duties using least-privilege
--   PostgreSQL roles on Neon or standard PostgreSQL 15+.
--
-- Security Rules:
--   1. NO hardcoded passwords or credentials in this script. Passwords must be
--      provisioned via environment variables or secret manager upon deployment.
--   2. yatrasetu_app (application runtime) has NOBYPASSRLS and is NOT database owner.
--   3. yatrasetu_migration executes Alembic migrations.
--   4. yatrasetu_admin is reserved for authorized emergency recovery.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create Roles (Idempotent Execution)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    -- Application Runtime Role (NOBYPASSRLS, NOSUPERUSER, NOCREATEDB)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'yatrasetu_app') THEN
        CREATE ROLE yatrasetu_app WITH LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    ELSE
        ALTER ROLE yatrasetu_app WITH LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;

    -- Migration Role (Schema Author, executes Alembic migrations)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'yatrasetu_migration') THEN
        CREATE ROLE yatrasetu_migration WITH LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    ELSE
        ALTER ROLE yatrasetu_migration WITH LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;

    -- Administration Role (Administrative maintenance, bypasses RLS for emergency recovery)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'yatrasetu_admin') THEN
        CREATE ROLE yatrasetu_admin WITH LOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    ELSE
        ALTER ROLE yatrasetu_admin WITH LOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 2. Schema Usage Privileges
-- ----------------------------------------------------------------------------

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO yatrasetu_app;
GRANT USAGE, CREATE ON SCHEMA public TO yatrasetu_migration;
GRANT USAGE ON SCHEMA public TO yatrasetu_admin;


-- ----------------------------------------------------------------------------
-- 3. Ownership & DDL Privileges (yatrasetu_migration)
-- ----------------------------------------------------------------------------

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO yatrasetu_migration;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO yatrasetu_migration;


-- ----------------------------------------------------------------------------
-- 4. yatrasetu_app Runtime Permissions (Least Privilege DML)
-- ----------------------------------------------------------------------------

-- Grant basic DML on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yatrasetu_app;

-- REVOKE DDL AND PRIVILEGE ESCALATION
REVOKE CREATE ON SCHEMA public FROM yatrasetu_app;

-- REVOKE SENSITIVE TABLE DML
-- Audit logs are strictly append-only: cannot be modified or deleted by application runtime
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_logs FROM yatrasetu_app;

-- Storage object registry: physical records cannot be deleted directly by runtime role
REVOKE DELETE, TRUNCATE ON TABLE storage_object_registry FROM yatrasetu_app;

-- Outbox records cannot be truncated
REVOKE TRUNCATE ON TABLE media_deletion_outbox FROM yatrasetu_app;

-- COLUMN-LEVEL PRIVILEGE DEFENSE-IN-DEPTH ON USERS TABLE
-- Ensure application runtime cannot modify role_id, is_active, or is_verified via direct UPDATE
-- (Only administrative procedures or specific migration tasks can alter user roles)
REVOKE UPDATE (role_id, is_active, is_verified) ON TABLE users FROM yatrasetu_app;

-- Grant sequence usage for serial generation if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yatrasetu_app;

-- Ensure future tables created by migration role automatically grant DML to runtime role
ALTER DEFAULT PRIVILEGES FOR ROLE yatrasetu_migration IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO yatrasetu_app;

ALTER DEFAULT PRIVILEGES FOR ROLE yatrasetu_migration IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO yatrasetu_app;


-- ----------------------------------------------------------------------------
-- 5. yatrasetu_admin Permissions (Audit, Moderation & Maintenance)
-- ----------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO yatrasetu_admin;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO yatrasetu_admin;

-- ============================================================================
-- End of Role Provisioning Script
-- ============================================================================
