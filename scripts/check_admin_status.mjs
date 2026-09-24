import { createClient } from '@supabase/supabase-js';

const url = 'https://tufmjeeodmfnrubkkqya.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Zm1qZWVvZG1mbnJ1YmtrcXlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI2MjI1MywiZXhwIjoyMTA1ODM4MjUzfQ.4hx2fDZA92NjVTMjkPsifxYcc4M1sYM6OrRB7qBJbqQ';
const supabase = createClient(url, serviceKey);

async function main() {
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('AUTH USERS:', users.users.map(u => ({ id: u.id, email: u.email })));

  const { data: adminRows, error: adminErr } = await supabase.from('admin_users').select('*');
  console.log('ADMIN_USERS TABLE:', { rows: adminRows, error: adminErr });

  if (users.users.length > 0) {
    const adminUser = users.users.find(u => u.email === 'ababils@attire.com');
    if (adminUser) {
      console.log('Target admin user ID in auth:', adminUser.id);
      const matchingRow = adminRows?.find(r => r.id === adminUser.id);
      console.log('Matching row in admin_users:', matchingRow);

      if (!matchingRow && !adminErr) {
        console.log('Inserting admin record into admin_users...');
        const { data: insertData, error: insertErr } = await supabase.from('admin_users').insert({
          id: adminUser.id,
          email: adminUser.email,
          full_name: 'Sanjida Bethi',
          role: 'superadmin',
          is_active: true
        }).select();
        console.log('Insert result:', { insertData, insertErr });
      }
    }
  }
}

main();
