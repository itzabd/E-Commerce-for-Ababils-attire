import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tufmjeeodmfnrubkkqya.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Zm1qZWVvZG1mbnJ1YmtrcXlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI2MjI1MywiZXhwIjoyMTA1ODM4MjUzfQ.4hx2fDZA92NjVTMjkPsifxYcc4M1sYM6OrRB7qBJbqQ';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Testing Supabase Auth Admin...');
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('List users error:', listError);
  } else {
    console.log(`Found ${users.users.length} users:`, users.users.map(u => ({ id: u.id, email: u.email })));
  }

  console.log('Testing Supabase REST tables...');
  const { data: products, error: prodError } = await supabaseAdmin.from('products').select('*').limit(5);
  console.log('Products query:', { count: products?.length, error: prodError });
}

main();
