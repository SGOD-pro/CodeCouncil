// lib/supabase.ts — Lazy Supabase client (avoids build crash with empty env vars)
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Returns true only when both Supabase credentials are set */
export const hasSupabase = (): boolean => Boolean(url && key);

// Lazy singleton — only instantiated the first time getSupabase() is called,
// and only when credentials are present. Never called during build-time SSR.
let _client: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
    if (!_client) _client = createClient(url, key);
    return _client;
}

/**
 * Drop-in `supabase` export via Proxy.
 * Delegates to getSupabase() on first property access,
 * so createClient is never called at module-load time during Next.js build.
 * Always guard calls with hasSupabase() to avoid runtime errors.
 */
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
