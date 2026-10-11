import type { sequence } from "@sveltejs/kit/hooks";

/**
 * The `Handle` hook type. SvelteKit 2 exports it from `@sveltejs/kit`,
 * SvelteKit 3 from `@sveltejs/kit/hooks`; `sequence` exists in both.
 */
export type Handle = Parameters<typeof sequence>[0];
