import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { unsealData } from "iron-session";

export async function getSessionUser(c: Context) {
	// Test user uses cookie
	const cookie = getCookie(c, c.env.COOKIE_NAME);
	if (!cookie) return null;
	const user = await unsealData(cookie, { password: c.env.COOKIE_PASSWORD });
	// Validate shape
	return user;

	// return null;
}
