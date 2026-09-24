import { createClient } from '@supabase/supabase-js';

const url = 'https://tufmjeeodmfnrubkkqya.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Zm1qZWVvZG1mbnJ1YmtrcXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNjIyNTMsImV4cCI6MjEwNTgzODI1M30.CCXnJEBeLg0vKVl9UC6nlv8gB5ZPOaW1WxhzoKYoh0A';

const supabaseClient = createClient(url, anonKey);

async function testLogin() {
  console.log('Testing signInWithPassword using anon client...');
  const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
    email: 'ababils@attire.com',
    password: 'AyeshaBuri6411'
  });

  if (signInError) {
    console.error('Sign in failed:', signInError);
    return;
  }

  console.log('Sign in succeeded! User ID:', data.user.id);
  console.log('Now querying admin_users table as this authenticated user...');

  const { data: adminRecord, error: queryError } = await supabaseClient
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .eq('is_active', true)
    .single();

  console.log('Query adminRecord result:', { adminRecord, queryError });
}

testLogin();
