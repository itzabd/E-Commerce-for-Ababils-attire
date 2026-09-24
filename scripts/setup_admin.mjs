import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tufmjeeodmfnrubkkqya.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Zm1qZWVvZG1mbnJ1YmtrcXlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI2MjI1MywiZXhwIjoyMTA1ODM4MjUzfQ.4hx2fDZA92NjVTMjkPsifxYcc4M1sYM6OrRB7qBJbqQ';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'ababils@attire.com';
  const password = 'AyeshaBuri6411';

  console.log(`Checking if user ${email} already exists...`);
  const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existing = userList.users.find(u => u.email === email);
  let userId = existing?.id;

  if (existing) {
    console.log(`User already exists with ID: ${userId}. Updating password...`);
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true,
      user_metadata: { full_name: 'Sanjida Bethi', role: 'superadmin' }
    });
    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('User password and metadata updated successfully!');
    }
  } else {
    console.log(`Creating user ${email}...`);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: 'Sanjida Bethi', role: 'superadmin' }
    });
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    userId = createData.user.id;
    console.log(`User created successfully with ID: ${userId}!`);
  }

  console.log(`\n========================================`);
  console.log(`ADMIN USER UUID: ${userId}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`========================================\n`);
}

main();
