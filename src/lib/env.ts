// Development flag shared by the Next.js app and the Vite-based tools (unit tests, ad renderer).
// Next.js and Vite both replace process.env.NODE_ENV at build time, so this works in browser bundles too.
export const IS_DEV: boolean = process.env.NODE_ENV !== 'production';
