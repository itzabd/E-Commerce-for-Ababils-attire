import fs from 'fs';
import path from 'path';

const migrationsDir = 'supabase/migrations';
const files = [
  '20260924000001_initial_schema.sql',
  '20260924000002_rls_policies.sql',
  '20260924000003_functions_and_rpc.sql',
  '20260924000004_storage_setup.sql',
  '20260925000001_store_settings_and_manual_order.sql'
];

let fullSql = `-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi - COMPLETE ALL-IN-ONE SUPABASE DEPLOYMENT
-- Includes:
-- 1. All Tables, Triggers, Indexes & Constraints
-- 2. Complete RLS Policies & Security Controls
-- 3. Stored Procedures, Functions & Guest Checkout RPC
-- 4. Storage Buckets (product-images) & Permissions
-- 5. Store Settings, Reviews, and Manual Order RPC
-- 6. Superadmin User Insertion (ababils@attire.com)
-- 7. Initial Seed Catalog (Dresses, Cakes & Store Settings)
-- ==============================================================================

`;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  console.log(`Adding ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  fullSql += `\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
  fullSql += `-- FILE: ${file}\n`;
  fullSql += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
  fullSql += content;
  fullSql += `\n\n`;
}

// Add admin profile select policy to avoid any RLS recursion
fullSql += `
-- ==============================================================================
-- EXTRA RLS POLICY: ALLOW SELF-PROFILE SELECT FOR ADMIN USERS
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_users' AND policyname = 'Users can view their own admin profile'
    ) THEN
        CREATE POLICY "Users can view their own admin profile"
            ON admin_users
            FOR SELECT
            USING (id = auth.uid());
    END IF;
END $$;

`;

// Add the Admin User insertion
fullSql += `
-- ==============================================================================
-- ADMIN USER CONFIGURATION (ababils@attire.com)
-- ==============================================================================
INSERT INTO public.admin_users (id, email, full_name, role, is_active)
VALUES (
    'ccaaafc3-5f50-4ac2-ba83-bc0610b6fb0d',
    'ababils@attire.com',
    'Sanjida Bethi',
    'superadmin',
    TRUE
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    role = 'superadmin',
    is_active = TRUE;

`;

// Append seed data
if (fs.existsSync('supabase/seed.sql')) {
  console.log('Adding supabase/seed.sql...');
  const seed = fs.readFileSync('supabase/seed.sql', 'utf8');
  fullSql += `\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
  fullSql += `-- FILE: seed.sql\n`;
  fullSql += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
  fullSql += seed;
}

const outputPath = 'supabase/COMPLETE_SETUP.sql';
fs.writeFileSync(outputPath, fullSql, 'utf8');
console.log(`\nSuccessfully created ${outputPath} (${(fullSql.length / 1024).toFixed(1)} KB)`);
