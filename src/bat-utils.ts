import { Context } from "hono";
import { randomNamesAndUsernames } from "./names";
import { TParticipants } from "./types/participant";
import { generateParticipantPassword, isArrayUnique } from "./utils";

function groupPattern(pop: number) {
	// let n = parseInt(pop);
	let n = Math.round(pop);
	if (isNaN(n) || n < 1) return [];
	if (n <= 7) return [n];
	if (n == 7) return [4, 3];
	if (n == 8) return [4, 4];
	if (n == 9) return [5, 4];
	if (n == 10) return [5, 5];
	if (n == 11) return [4, 4, 3];
	if (n == 12) return [4, 4, 4];
	if (n == 13) return [5, 4, 4];
	if (n == 14) return [5, 5, 4];

	let jumlahGrup = n % 20 < 5 ? Math.floor(n / 5) : Math.ceil(n / 5)
	let array = Array(jumlahGrup).fill(5);
	let mod1 = n % 5;
	let mod2 = n % 20;
	if (mod1 == 0) return array;
	let index = mod2 < 5 ? jumlahGrup - mod2 : jumlahGrup + mod1 - 5;
	let tweak = mod2 < 5 ? 6 : 4;
	array.fill(tweak, index);
	return array.sort((a, b) => b - a);
}

function slotGroupPattern(pop: number, permutation: number) {
	if (![2, 3, 4].includes(permutation)) return [pop];
	if (permutation == 2) {
		const a = Math.round(pop / permutation)
		return [a, pop - a]
	} else {
		const base = Math.floor(pop / permutation);
		const remainder = pop - base * permutation;
		const rs = Array(permutation).fill(base);
		if (remainder) {
			for (let i = 0; i < remainder; i++) {
				rs[i] += 1;
			}
		}
		console.log("rs", rs)
		return rs;
	}
}

async function deleteGroupings(db: D1Database, batch_id: number) {
	const stm0 = `DELETE FROM groupings WHERE batch_id=?`
	const stm1 = `DELETE FROM groups WHERE batch_id=?`
	return await db.batch([
		db.prepare(stm0).bind(batch_id),
		db.prepare(stm1).bind(batch_id),
	])
}

export async function updateBatch(c: Context<{ Bindings: Env }>) {
	const body = await c.req.parseBody();
	const id = body.id;
	const date = body.date;
	// Force to null if empty
	const mode = body.mode || null;
	const onSelf = body.onSelf || null;
	const onCase = body.onCase || null;
	const onF2f = body.onF2f || null;
	const onGroup = body.onGroup || null;
	const split = body.split || null;
	const stm0 = `UPDATE batches SET date=?, mode=?, split=?, on_self=?, on_case=?, on_f2f=?, on_lgd=? WHERE id=?`;
	const stm1 = `SELECT * FROM v_batches WHERE id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(date, mode, split, onSelf, onCase, onF2f, onGroup, id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
	]);
	if (rs[1].results.length == 0) return null;
	return rs[1].results[0] as VBatch;
}

export async function regroupBatch(db: D1Database, batch: VBatch) {
	await deleteGroupings(db, batch.id);

	if (batch.persons == 0) return [];

	// 1. Define slot permutation
	const group_type = batch.group_type;
	const modules = batch.modules;
	let permutation = 4;
	if (modules != 4) {
		permutation = 3;
		if (modules == 2) {
			if (batch.mode == 'SELF-CASE') permutation = batch.split > 1 ? 2 : 1;
			else permutation = batch.split > 1 ? 4 : 2;
		} else if (modules == 1) {
			permutation = batch.split;
		}
	}
	console.log('batch.modules', batch.modules);
	console.log('batch.split', batch.split);
	console.log('permutation', permutation);

	// 2. Load slots and persons
	const stm0 = `SELECT s.id FROM slots s LEFT JOIN batches b ON s.mode=b.mode WHERE b.id=? LIMIT ?`;
	const stm1 = `SELECT id FROM persons WHERE batch_id=?`;
	const rs = await db.batch([db.prepare(stm0).bind(batch.id, permutation), db.prepare(stm1).bind(batch.id)]);
	const slots = rs[0].results as { id: string }[];
	const persons = rs[1].results as { id: string }[];
	const pattern = group_type == 'group' ? groupPattern(persons.length) : slotGroupPattern(persons.length, permutation);

	// 3. Define groups with slot_id
	const groups: any[] = pattern.map((g, i) => {
		const index = i % permutation;
		// GROUP ID: XXXX-09
		// Assuming group counts will never reach 100
		return {
			id: `${batch.id}-${String(i + 1).padStart(2, '0')}`,
			members: g,
			batch_id: batch.id,
			name: 'Grup ' + (i + 1),
			slot_id: slots[index].id,
		};
	});

	// 4. Define groupings
	const groupings: Grouping[] = [];
	let personIndex = 0;
	for (let i = 0; i < groups.length; i++) {
		const g = groups[i].members as number;
		for (let j = 0; j < g; j++) {
			groupings.push({
				batch_id: batch.id,
				group_id: groups[i].id,
				person_id: persons[personIndex].id,
				f2f_ass_id: null,
				case_ass_id: null,
			});
			personIndex++;
		}
	}

	// 5. Save groups and groupings
	const groupValues = groups.map((g) => `('${g.id}', ${g.batch_id}, '${g.name}', '${g.slot_id}')`).join(', ');
	const groupingValues = groupings.map((g) => `(${g.batch_id}, '${g.group_id}', '${g.person_id}')`).join(', ');
	const stm2 = `INSERT INTO groups (id, batch_id, name, slot_id) VALUES ${groupValues}`;
	const stm3 = `INSERT INTO groupings (batch_id, group_id, person_id) VALUES ${groupingValues}`;
	const stm4 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const rsx = await db.batch([
		/* 0 */ db.prepare(stm2),
		/* 1 */ db.prepare(stm3),
		/* 2 */ db.prepare(stm4).bind(batch.id)
	]);

	// Return groups
	return rsx[2].results as VGroup[];
}

export async function createParticipants(db: D1Database, batch_id: number, org_id: number, participants: TParticipants) {
	const persons = participants.filter(x => !!x.name.trim()).map((n, i) => {
		n.username = n?.username?.trim() ?? (n.name.split(" ")[0].length > 3 ? n.name.split(" ")[0] : `${n.name.split(" ")[0]}-123`)
		n.password = n?.password ?? generateParticipantPassword()
		return n
	});
	if (!isArrayUnique(persons.map(x => x.username))) throw new Error("Username harus unik")

	const toSave = persons.map((n, i) => `('${batch_id}-${String(i + 1).padStart(4, '0')}', ${org_id}, ${batch_id}, '${n.name}', '${n.username}', '${n.password}')`)
	const stm0 = `INSERT INTO persons (id, org_id, batch_id, fullname, username, password) VALUES ${toSave.join(", ")}`;
	
	return await db.prepare(stm0).run();
}

export function getAssessorReqs(alloc?: SlotsAlloc) {
	if (!alloc) return { minlgd: 0, maxlgd: 0, minf2f: 0, maxf2f: 0 }
	const minlgd = !alloc ? 0 : Math.max(alloc.lgd_slot1, alloc.lgd_slot2, alloc.lgd_slot3, alloc.lgd_slot4);
	const maxlgd = !alloc ? 0 : [alloc.lgd_slot1, alloc.lgd_slot2, alloc.lgd_slot3, alloc.lgd_slot4].reduce((a, o) => { return a + o }, 0);
	const minf2f = !alloc ? 0 : Math.max(alloc.f2f_slot1_size, alloc.f2f_slot2_size, alloc.f2f_slot3_size, alloc.f2f_slot4_size);
	const maxf2f = !alloc ? 0 : [alloc.f2f_slot1_size, alloc.f2f_slot2_size, alloc.f2f_slot3_size, alloc.f2f_slot4_size].reduce((a, o) => { return a + o; }, 0);
	return { minlgd, maxlgd, minf2f, maxf2f }
}
