import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anon);

export function getServerSupabase() {
  if (!supabaseEnabled) return null;
  const cookieStore = cookies();
  return createServerClient(url!, anon!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        /* no-op — server components cannot set cookies */
      },
      remove() {
        /* no-op */
      },
    },
  });
}
