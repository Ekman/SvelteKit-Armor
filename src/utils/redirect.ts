import { redirect } from "@sveltejs/kit";

type RedirectWithExternal = (
	status: number,
	location: string,
	options?: { external?: string[] },
) => never;

/**
 * Redirect to an external URL, allowing only that URL's origin.
 * SvelteKit 3 requires the `external` option; SvelteKit 2 ignores it.
 */
export function redirectExternal(status: number, location: string): never {
	const { origin } = new URL(location);
	return (redirect as RedirectWithExternal)(status, location, {
		external: [origin],
	});
}
