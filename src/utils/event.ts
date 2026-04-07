import { RequestEvent } from "@sveltejs/kit";
import { COOKIE_STATE, cookieGetAndDelete } from "./cookie";

export function eventStateValid(event: RequestEvent): boolean {
	const state = event.url.searchParams.get("state") ?? undefined;
	const stateCookie = cookieGetAndDelete(event.cookies, COOKIE_STATE);

	return state === stateCookie;
}
