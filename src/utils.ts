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
// groupPersons()
export function createGroupsByName(persons: VPerson[]) {
	// https://dev.to/phibya/methods-to-get-unique-values-from-arrays-in-javascript-and-their-performance-1da8
	const uniqueArray = (array: string[]) => Array.from(new Set(array));
	const group_names = uniqueArray(persons.map((p) => p.group_name));
	const groups: GroupWithMembers[] = [];
	let start = 1;
	for (let i = 0; i < group_names.length; i++) {
		const members = persons.filter((p: any) => p.group_name == group_names[i]);
		groups.push({
			name: group_names[i],
			members: members,
			startBy: start,
		})
		start += members.length;
	}
	return groups;
}


export function generateParticipantPassword() {
	const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let uuid = '';

	for (let i = 0; i < 7; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		uuid += characters.charAt(randomIndex);
	}

	return uuid;
}

export function isArrayUnique(array: any[]) {
	return new Set(array).size === array.length;
}