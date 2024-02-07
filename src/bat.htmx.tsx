import { Hono } from 'hono';
import { BatchRequirements, BatchPersons, BatchSettings, FormBatchSettings, AllocationRow, FormAllocationRow, PairingGroupAssessorWithParticipant, PairingF2FAssessorWithParticipant } from './bat.components';
import { createParticipants, getAssessorReqs, regroupBatch, updateBatch } from './bat-utils';
import { PRE } from './components';
import { TParticipants } from './types/participant';

const app = new Hono<{ Bindings: Env }>();

// Settings
/* ============================= */

// GET /htmx/bat/:batch_id[?form]
app.get('/:batch_id', async (c) => {
	const id = c.req.param('batch_id');
	const isForm = c.req.query('form') != undefined;
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM tools`;
	const array = [c.env.DB.prepare(stm0).bind(id)];
	if (isForm) array.push(c.env.DB.prepare(stm1));

	const rs = await c.env.DB.batch([...array]);
	const batch = rs[0].results[0] as VBatch;

	if (!batch) {
		c.status(404);
		return c.body('');
	}

	// Handle isForm
	if (isForm) {
		const tools = rs[1].results as Tools[];
		return c.html(<FormBatchSettings batch={ batch } tools={ tools } />);
	}
	return c.html(<BatchSettings batch={ batch } />);
});

// PUT /htmx/bat/:batch_id
app.put('/:batch_id', async (c) => {
	const id = c.req.param('batch_id');
	const updated = await updateBatch(c);
	// TODO: handle update error
	if (!updated) {
		/*  */
	}

	const batch = updated as VBatch;
	// const { id } = await c.req.parseBody();
	let groups: VGroup[] = [];
	let alloc: SlotsAlloc | null = null;

	if (batch.persons) {
		groups = await regroupBatch(c.env.DB, batch);
		if (groups.length) {
			const stm1 = `SELECT * FROM v_slotallocs WHERE batch_id=?`;
			alloc = await c.env.DB.prepare(stm1).bind(id).first();
		}
	}
	c.res.headers.append('HX-Trigger', `{"batch-updated":{"date" : "${batch.date}"}}`);
	return c.html(
		<div id="batch-geist">
			<BatchSettings batch={ batch } />
			<div id="batch-persons-assessors">
				<BatchPersons batch={ batch } groups={ groups } />
				<BatchRequirements title="Kebutuhan Asesor" batch={ batch } alloc={ alloc } link={ true } />
			</div>
		</div>
	);
});

// POST /htmx/bat/:batch_id --> Upload data
app.post('/:batch_id', async (c) => {
	const id = c.req.param('batch_id');
	const body = await c.req.parseBody();
	const org_id = parseInt(body.org_id as string);
	const participants = JSON.parse(body.participants as string) as TParticipants;
	await createParticipants(c.env.DB, parseInt(id), org_id, participants);

	// batch must be loaded AFTER person data has been saved
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_slotallocs WHERE batch_id=?`;
	const rs = await c.env.DB.batch([/* 0 */ c.env.DB.prepare(stm0).bind(id), /* 1 */ c.env.DB.prepare(stm1).bind(id)]);
	const batch = rs[0].results[0] as VBatch;
	const alloc = rs[1].results[0] as SlotsAlloc;
	const groups = await regroupBatch(c.env.DB, batch);

	return c.html(
		<div id="batch-persons-assessors">
			<BatchPersons batch={ batch } groups={ groups } />
			<BatchRequirements title="Kebutuhan Asesor" batch={ batch } alloc={ alloc } link={ true } />
		</div>
	);
});

// Asesor
/* ============================= */

// POST /htmx/bat/:batch_id/assessors
app.post('/:batch_id/assessors', async (c) => {
	async function getGroupingsToUpdate(batch_id: string) {
		return (await c.env.DB.batch(Array.from({ length: 4 }).map((_, i) => {
			const stm = `SELECT group_id, person_id FROM v_groupings WHERE batch_id = ? AND f2f_pos = ? AND  f2f_ass_id IS NULL LIMIT 1`
			return c.env.DB.prepare(stm).bind(batch_id, i + 1)
		}))).map((v, i) => {
			const curr = v.results.pop() as { person_id: string; group_id: string }
			if (!curr) return null
			if (!curr?.group_id) return null
			if (!curr?.person_id) return null
			return {
				group_id: curr.group_id,
				person_id: curr.person_id,
			}
		}).filter((v: any) => !!v)
	}

	const batch_id = c.req.param('batch_id');
	const body = await c.req.parseBody();
	const type = body.type as string;
	const ass_id = parseInt(body.ass_id as string);
	const groupingsToUpdate = await getGroupingsToUpdate(batch_id)

	const stm0 = `INSERT INTO batch_assessors (batch_id,ass_id,type) VALUES (?,?,?)`;
	const stm1 = `SELECT * FROM v_batch_assessors WHERE batch_id=? AND ass_id=? AND type=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(batch_id, ass_id, type),
		/* 1 */ c.env.DB.prepare(stm1).bind(batch_id, ass_id, type),
		...groupingsToUpdate.map(v => {
			return c.env.DB.prepare("UPDATE groupings SET f2f_ass_id = ? WHERE group_id = ? AND person_id = ? AND batch_id = ?")
				.bind(ass_id, v?.group_id, v?.person_id, batch_id)
		})
	]);
	const asesor = rs[1].results[0] as VBatchAssessor;
	const json = JSON.stringify({ type: asesor.type, ass_id: asesor.ass_id })
	c.res.headers.append('HX-Trigger', `{"assessor-saved" : ${json}}`);
	return c.html(<AllocationRow assessor={ asesor } />);
});

// DELETE /htmx/bat/:batch_id/assessors
app.delete('/:batch_id/assessors', async (c) => {
	async function getGroupingsToUpdate(ass_id: number, batch_id: string) {
		const stm = `SELECT group_id, person_id FROM v_groupings WHERE f2f_ass_id = ? AND batch_id = ?`
		return (await c.env.DB.prepare(stm).bind(ass_id, batch_id).all()).results
	}

	const batch_id = c.req.param('batch_id');
	const body = await c.req.parseBody();
	const ass_id = parseInt(body.ass_id as string);
	const type = body.type as string;
	const groupingsToUpdate = await getGroupingsToUpdate(ass_id, batch_id)

	const stm0 = `DELETE FROM batch_assessors WHERE batch_id=? AND ass_id=?`;
	await c.env.DB.batch([
		c.env.DB.prepare(stm0).bind(batch_id, ass_id),
		...groupingsToUpdate.map(v => {
			return c.env.DB.prepare("UPDATE groupings SET f2f_ass_id = ? WHERE group_id = ? AND person_id = ? AND batch_id = ?")
				.bind(null, v?.group_id, v?.person_id, batch_id)
		})
	]);

	const json = JSON.stringify({ ass_id, type });
	c.res.headers.append('HX-Trigger', `{"assessor-dropped" : ${json}}`);
	return c.body('');
});

// GET /htmx/bat/:id/assessors/:type --> Load assessors
app.get("/:batch_id/assessors/:type", async (c) => {
	const id = c.req.param('batch_id');
	const type = c.req.param('type');
	if (type != "lgd" && type != "f2f") return c.notFound();
	const filter = type == "lgd" ? "f2f" : "lgd";
	const stm0 = `SELECT ass_id FROM batch_assessors WHERE batch_id=? AND type IS ?`;
	const stm1 = `SELECT * FROM assessors`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id, filter),
		/* 1 */ c.env.DB.prepare(stm1),
	]);
	const filter_ids = rs[0].results.map((x: any) => x.ass_id);
	const assessors = (rs[1].results as Assessor[]).filter((x) => !filter_ids.includes(x.id));
	const s1 = `display:grid;grid-template-columns:1fr 1fr;grid-template-rows: auto;column-gap:20px;row-gap:8px;
	margin:.5rem 0;padding:4px 8px;border:1px solid #234;height:150px;overflow-y:auto;`;
	const onclick = `document.getElementById("${type}-assessors-bucket").innerHTML="";
	document.querySelectorAll(".bucket-loader").forEach((b) => b.removeAttribute("disabled"))
	document.getElementById("${type}-load-bucket").style.display="block";`;
	c.res.headers.append('HX-Trigger', `{"bucket-loaded":{"loader": "${type}-load-bucket", "type":"${type}"}}`);
	return c.html(
		<div>
			<div style={ s1 }>
				{ assessors.map((a) => (
					<form hx-post={ `/htmx/bat/${id}/assessors` } hx-target={ `#${type}-assessors-tray` } hx-swap="beforeend">
						<input type="hidden" name="type" value={ type } />
						<input type="hidden" name="ass_id" value={ a.id } />
						<p class="bucket-item" id={ `A-${a.id}` } ass_id={ a.id } style="cursor:default">
							{ a.fullname }
						</p>
						<button style="display:none" />
					</form>
				)) }
			</div>
			<div>
				<button onclick={ onclick }>CLOSE BUCKET</button>
			</div>
		</div>
	);
})

// POST /htmx/bat/ass/:batch_id/:id/:type
app.post("/:id/:ass_id/:type", async (c) => {
	const { id, ass_id, type } = c.req.param();
})
/**
 * POST /htmx/bat/asx/:mixed
 */
app.post('/asx/:mixed', async (c) => {
	const { mixed } = c.req.param();
	const arr = mixed.split("-")
	const ass_id = arr[1];// c.req.param("ass_id");
	const batch_id = arr[0];// c.req.param('batch_id');
	const type = arr[2];// c.req.param('type');
	console.log('POST', batch_id, ass_id, type);
	const stm0 = `INSERT INTO batch_assessors (batch_id,ass_id,type) VALUES (?,?,?)`;
	const stm1 = `SELECT * FROM v_batch_assessors WHERE batch_id=? AND ass_id=? AND type=?`;
	console.log(stm1)
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(batch_id, ass_id, type),
		/* 1 */ c.env.DB.prepare(stm1).bind(batch_id, ass_id, type),
	]);
	const found = rs[1].results[0] as VBatchAssessor;
	console.log('FOUND', found);
	return c.html(<AllocationRow assessor={ found } />);
});

// Get individual entry of batch assessor
// GET htmx/bat/ass/:batch_id/:id/:type[?form&batch_id]
app.get('/ass/:id/:type', async (c) => {
	const form = c.req.query('form');
	const ass_id = c.req.param('id');
	const batch_id = c.req.query('batch_id');
	// const batch_id = c.req.param('batch_id');
	const type = c.req.param('type');
	console.log(batch_id, ass_id, type, form);
	const stm0 = `SELECT * FROM v_batch_assessors WHERE batch_id=? AND ass_id=? AND type=?`;
	const found = (await c.env.DB.prepare(stm0).bind(batch_id, ass_id, type).first()) as VBatchAssessor;
	console.log(found);
	if (!found) {
		c.status(404);
		return c.body('');
	}
	if (form !== undefined) return c.html(<FormAllocationRow assessor={ found } />);
	return c.html(<AllocationRow assessor={ found } />);
});

// PUT htmx/bat/ass/:batch_id/:ass_id
app.put('/ass/:batch_id/:ass_id', async (c) => {
	async function getToUpdateGroupings(vAll: number[], ass_id: string, batch_id: string): Promise<{ toNull: any[], toFill: any[] }> {
		type groupings = { group_id: string, person_id: string, f2f_pos: number, f2f_ass_id: string | null }
		type groupingsObject = Record<string, groupings>

		// prepare to get groupings with f2f_ass is empty in all position [1,2,3,4]
		const stms = [0, 1, 2, 3].map((v, i) => {
			const stm = `SELECT group_id, person_id, f2f_pos FROM v_groupings WHERE batch_id = ? AND f2f_pos = ? AND f2f_ass_id IS NULL LIMIT 1`
			return c.env.DB.prepare(stm).bind(batch_id, i + 1)
		})

		// prepare to get latest groupings
		const stm = c.env.DB.prepare('SELECT group_id, person_id, f2f_pos FROM v_groupings WHERE batch_id = ? AND f2f_ass_id = ?').bind(batch_id, ass_id)

		// get exec batch query
		const [latest, ...empty] = await c.env.DB.batch([
			stm,
			...stms
		])

		// init groupings variable to update f2f_ass = null
		const toNull = []

		// convert to object with the keys is the position
		const y = (latest.results as unknown as groupings[]).reduce<groupingsObject>((acc, curr: groupings) => {
			acc[curr.f2f_pos as any] = curr
			return acc
		}, ({}))

		// unwrap the empty array to .results
		const z = empty.map(v => v.results).flat() as groupings[]

		// delete latest groupings current position [v1,v2,v3,v4] and push it to toNull variable
		for (let i = 0; i < vAll.length; i++) {
			if (vAll[i] === 0) {
				const c = y[`${i + 1}`]
				if(c) {
					c.f2f_ass_id = null
					toNull.push(c)
					delete y[`${i + 1}`]
				}
			}
		}

		// fill latest groupings by empty result base lack of it
		for (let i = 0; i < vAll.length; i++) {
			if (vAll[i] === 1) {
				const tmp = y[`${i + 1}`]
				if (!tmp) {
					y[`${i + 1}`] = z.find(v => v.f2f_pos === i + 1) as groupings
				}
			}
		}

		// set f2f_ass_id base on vAll
		for (let i = 0; i < vAll.length; i++) {
			if(y[`${i + 1}`]) {
				if (vAll[i] === 1) {
					y[`${i + 1}`].f2f_ass_id = ass_id
				} else {
					y[`${i + 1}`].f2f_ass_id = null
				}
			}
		}

		return {
			toNull,
			toFill: Object.values(y)
		}
	}

	const { batch_id, ass_id } = c.req.param();
	const { slot1, slot2, slot3, slot4 } = await c.req.parseBody();
	const v1 = slot1 ? 1 : 0;
	const v2 = slot2 ? 1 : 0;
	const v3 = slot3 ? 1 : 0;
	const v4 = slot4 ? 1 : 0;
	const vAll = [v1, v2, v3, v4]

	const { toNull, toFill } = await getToUpdateGroupings(vAll, ass_id, batch_id)

	const stm0 = `UPDATE batch_assessors SET slot1=?, slot2=?, slot3=?, slot4=? WHERE batch_id=? AND ass_id=?`;
	await c.env.DB.batch([
		c.env.DB.prepare(stm0).bind(v1, v2, v3, v4, batch_id, ass_id),
		...[...toFill,...toNull].map(v => {
			return c.env.DB.prepare("UPDATE groupings SET f2f_ass_id = ? WHERE group_id = ? AND person_id = ? AND batch_id = ?")
				.bind(v.f2f_ass_id, v.group_id, v.person_id, batch_id)
		}),
	]);


	const stm1 = `SELECT * FROM v_batch_assessors WHERE batch_id=? AND ass_id=?`;
	const found = (await c.env.DB.prepare(stm1).bind(batch_id, ass_id).first()) as VBatchAssessor;

	if (!found) {
		c.status(404);
		return c.body('');
	}
	return c.html(<AllocationRow assessor={ found } />);
});

// /ass/1102/1
app.delete('/ass/:batch_id/:ass_id', async (c) => {
	const { batch_id, ass_id } = c.req.param();
	const stm0 = `DELETE FROM batch_assessors WHERE batch_id=? AND ass_id=?`;
	await c.env.DB.prepare(stm0).bind(batch_id, ass_id).run();
	return c.body('')
});

// Preps htmx route
// Assessor - Participant
app.put('/:batch_id/preps/assessor-participant/group/:group_id', async (c) => {
	const x = await c.req.parseBody();
	const groupId = c.req.param('group_id')
	const batchId = c.req.param('batch_id');

	// update
	await c.env.DB.prepare(`UPDATE groups SET lgd_ass_id = ? WHERE id = ?`).bind(Object.values(x).pop(), groupId).run()

	// get updated data

	const stm0 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const stm1 = `SELECT * FROM v_batch_assessors WHERE type='lgd' AND batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(batchId),
		/* 1 */ c.env.DB.prepare(stm1).bind(batchId),
	]);
	const groups = rs[0].results as VGroup[];
	const list = rs[1].results as VBatchAssessor[];

	return c.html(<PairingGroupAssessorWithParticipant vGroups={ groups } VBatchAssessor={list} />)
})

app.put('/:batch_id/preps/assessor-participant/f2f/:person_id', async (c) => {
	const x = await c.req.parseBody();
	const batchId = c.req.param('batch_id');
	const personId = c.req.param('person_id')

	// update
	await c.env.DB.prepare(`UPDATE groupings SET f2f_ass_id = ? WHERE batch_id = ? AND person_id = ?`).bind(x?.ass_id ?? null, batchId, personId).run()

	// get updated data
	
	const stm0 = `SELECT batch_id, id as person_id, fullname, group_id, group_name, f2f_ass_id, f2f_pos FROM v_persons WHERE batch_id=?`;
	const stm1 = `SELECT * FROM v_batch_assessors WHERE type='f2f' AND batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(batchId),
		/* 1 */ c.env.DB.prepare(stm1).bind(batchId),
	]);

	return c.html(<PairingF2FAssessorWithParticipant vPersons={rs[0].results as TVPersonCustom[]} VBatchAssessor={rs[1].results as VBatchAssessor[]} />)

	// const stm0 = `SELECT * FROM v_groups WHERE batch_id=?`;
	// const stm1 = `SELECT * FROM v_batch_assessors WHERE type='lgd' AND batch_id=?`;
	// const rs = await c.env.DB.batch([
	// 	/* 0 */ c.env.DB.prepare(stm0).bind(batchId),
	// 	/* 1 */ c.env.DB.prepare(stm1).bind(batchId),
	// ]);
	// const groups = rs[0].results as VGroup[];
	// const list = rs[1].results as VBatchAssessor[];
	// const groups_by_slots = [
	// 	groups.filter(g => g.lgd_pos == 1),
	// 	groups.filter(g => g.lgd_pos == 2),
	// 	groups.filter(g => g.lgd_pos == 3),
	// 	groups.filter((g) => g.lgd_pos == 4),
	// ];
	// const ass_by_slots = [
	// 	list.filter(a => a.slot1 == 1),
	// 	list.filter(a => a.slot2 == 1),
	// 	list.filter(a => a.slot3 == 1),
	// 	list.filter(a => a.slot4 == 1),
	// ]

	// return c.html(<PairingGroupAssessorWithParticipant groups_by_slots={ groups_by_slots } ass_by_slots={ ass_by_slots } />)
})

export { app };
