type CspOptions = {
  /** Fresh for every request; Next.js adds it to its own scripts. */
  nonce: string;
  supabaseUrl: string;
  dev: boolean;
};

/**
 * The Content-Security-Policy for pages. Scripts need this request's nonce; audio, images and API
 * calls may only reach this site and Supabase. Inline styles stay allowed because server-rendered
 * animation and map positions use style attributes.
 */
export function buildContentSecurityPolicy({ nonce, supabaseUrl, dev }: CspOptions): string {
  const supabase = new URL(supabaseUrl).origin;
  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    ["script-src", "'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", "blob:", "data:", supabase],
    ["media-src", "'self'", "blob:", supabase],
    ["font-src", "'self'"],
    ["connect-src", "'self'", supabase],
    ["worker-src", "'self'"],
    ["manifest-src", "'self'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'", supabase, "https://accounts.google.com"],
    ["frame-ancestors", "'none'"],
  ];
  if (supabase.startsWith("https:")) directives.push(["upgrade-insecure-requests"]);
  return directives.map((parts) => parts.join(" ")).join("; ");
}
