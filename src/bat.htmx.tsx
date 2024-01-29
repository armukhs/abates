import { Hono } from 'hono';
import { BatchRequirements, BatchPersons, BatchSettings, FormBatchSettings, AllocationRow, FormAllocationRow } from './bat.components';
import { createSample, getAssessorReqs, regroupBatch, updateBatch } from './bat-utils';
import { PRE } from './components';

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
		return c.html(<FormBatchSettings batch={batch} tools={tools} />);
	}
	return c.html(<BatchSettings batch={batch} />);
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
			<BatchSettings batch={batch} />
			<div id="batch-persons-assessors">
				<BatchPersons batch={batch} groups={groups} />
				<BatchRequirements title="Kebutuhan Asesor" batch={batch} alloc={alloc} link={true} />
			</div>
		</div>
	);
});

// POST /htmx/bat/:batch_id --> Upload data
app.post('/:batch_id', async (c) => {
	const id = c.req.param('batch_id');
	const body = await c.req.parseBody();
	const org_id = parseInt(body.org_id as string);
	const samplenum = parseInt(body.samplenum as string);
	await createSample(c.env.DB, parseInt(id), org_id, samplenum);

	// batch must be loaded AFTER person data has been saved
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_slotallocs WHERE batch_id=?`;
	const rs = await c.env.DB.batch([/* 0 */ c.env.DB.prepare(stm0).bind(id), /* 1 */ c.env.DB.prepare(stm1).bind(id)]);
	const batch = rs[0].results[0] as VBatch;
	const alloc = rs[1].results[0] as SlotsAlloc;
	const groups = await regroupBatch(c.env.DB, batch);

	return c.html(
		<div id="batch-persons-assessors">
			<BatchPersons batch={batch} groups={groups} />
			<BatchRequirements title="Kebutuhan Asesor" batch={batch} alloc={alloc} link={true} />
		</div>
	);
});

// Asesor
/* ============================= */

// POST /htmx/bat/:batch_id/assessors
app.post('/:batch_id/assessors', async (c) => {
	const batch_id = c.req.param('batch_id');
	const body = await c.req.parseBody();
	const type = body.type as string;
	const ass_id = parseInt(body.ass_id as string);
	const stm0 = `INSERT INTO batch_assessors (batch_id,ass_id,type) VALUES (?,?,?)`;
	const stm1 = `SELECT * FROM v_batch_assessors WHERE batch_id=? AND ass_id=? AND type=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(batch_id, ass_id, type),
		/* 0 */ c.env.DB.prepare(stm1).bind(batch_id, ass_id, type),
	]);
	const asesor = rs[1].results[0] as VBatchAssessor;
	const json = JSON.stringify({ type: asesor.type, ass_id: asesor.ass_id })
	c.res.headers.append('HX-Trigger', `{"assessor-saved" : ${json}}`);
	return c.html(<AllocationRow assessor={asesor} />);
});

// DELETE /htmx/bat/:batch_id/assessors
app.delete('/:batch_id/assessors', async (c) => {
	const batch_id = c.req.param('batch_id');
	const body = await c.req.parseBody();
	const ass_id = parseInt(body.ass_id as string);
	const type = body.type as string;
	const stm0 = `DELETE FROM batch_assessors WHERE batch_id=? AND ass_id=?`;
	const rs = await c.env.DB.prepare(stm0).bind(batch_id,ass_id).run();
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
			<div style={s1}>
				{assessors.map((a) => (
					<form hx-post={`/htmx/bat/${id}/assessors`} hx-target={`#${type}-assessors-tray`} hx-swap="beforeend">
						<input type="hidden" name="type" value={type} />
						<input type="hidden" name="ass_id" value={a.id} />
						<p class="bucket-item" id={`A-${a.id}`} ass_id={a.id} style="cursor:default">
							{a.fullname}
						</p>
						<button style="display:none" />
					</form>
				))}
			</div>
			<div>
				<button onclick={onclick}>CLOSE BUCKET</button>
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
	return c.html(<AllocationRow assessor={found} />);
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
	if (form !== undefined) return c.html(<FormAllocationRow assessor={found} />);
	return c.html(<AllocationRow assessor={found} />);
});

// PUT htmx/bat/ass/:batch_id/:ass_id
app.put('/ass/:batch_id/:ass_id', async (c) => {
	const { batch_id, ass_id } = c.req.param();
	const { slot1, slot2, slot3, slot4 } = await c.req.parseBody();
	const v1 = slot1 ? 1 : 0;
	const v2 = slot2 ? 1 : 0;
	const v3 = slot3 ? 1 : 0;
	const v4 = slot4 ? 1 : 0;
	const stm0 = `UPDATE batch_assessors SET slot1=?, slot2=?, slot3=?, slot4=? WHERE batch_id=? AND ass_id=?`;
	const rs = await c.env.DB.prepare(stm0).bind(v1,v2,v3,v4,batch_id,ass_id).run();
	const stm1 = `SELECT * FROM v_batch_assessors WHERE batch_id=? AND ass_id=?`;
	const found = (await c.env.DB.prepare(stm1).bind(batch_id, ass_id).first()) as VBatchAssessor;
	console.log(found);
	if (!found) {
		c.status(404);
		return c.body('');
	}
	return c.html(<AllocationRow assessor={found} />);
});

// /ass/1102/1
app.delete('/ass/:batch_id/:ass_id', async (c) => {
	const { batch_id, ass_id } = c.req.param();
	const stm0 = `DELETE FROM batch_assessors WHERE batch_id=? AND ass_id=?`;
	await c.env.DB.prepare(stm0).bind(batch_id, ass_id).run();
	return c.body('')
});

export { app };
