import 'server-only';
// App entry point for the Supabase client: 'server-only' makes any import from browser code fail the build, so the
// service key can never be bundled for the browser. Implementation: lib/supabaseRest.ts (also used by seed scripts).
export * from './supabaseRest';
