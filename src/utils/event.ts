import {RequestEvent} from "@sveltejs/kit";
import {COOKIE_STATE, cookieGetAndDelete} from "./cookie";
import {ArmorInvalidStateError} from "../errors";

export function eventStateValidOrThrow(event: RequestEvent): void {
	const state = event.url.searchParams.get("state") ?? undefined;
	const stateCookie = cookieGetAndDelete(event.cookies, COOKIE_STATE);

	if (state !== stateCookie) {
		throw new ArmorInvalidStateError();
	}
}
