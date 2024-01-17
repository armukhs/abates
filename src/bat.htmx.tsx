import { Hono } from 'hono';
import { BatchAssessors, BatchPersons, BatchSettings, FormBatchSettings } from './bat.components';
import { createSample, getAssessorReqs, regroupBatch, updateBatch } from './bat-utils';

const app = new Hono<{ Bindings: Env }>();

// Return batch settings box
app.get('/:id', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const rs = await c.env.DB.prepare(stm0).bind(id).first();
	if (!rs) {
		c.status(404);
		return c.body('')
	}
	const batch = rs as VBatch;
	return c.html(<BatchSettings batch={batch} />);
});

// /htmx/bat/:id/form
// Return batch settings form
app.get('/:id/form', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM tools`;
	const rs = await c.env.DB.batch([c.env.DB.prepare(stm0).bind(id), c.env.DB.prepare(stm1)]);
	if (rs[0].results.length == 0) {
		c.status(404);
		return c.body('');
	}
	const batch = rs[0].results[0] as VBatch;
	const tools = rs[1].results as Tools[];
	// c.res.headers.append('HX-Trigger', `{"batch-updated":{"date" : "${batch.date}"}}`);
	return c.html(<FormBatchSettings batch={batch} tools={tools} />);
});

/**
 * PUT /htmx/bat
 * Update batch (date, modules, split)
 * Return ...
 */
app.put('/', async (c) => {
	const updated = await updateBatch(c);
	if (!updated) { /*  */ }

	const batch = updated as VBatch;
	const { id } = await c.req.parseBody();
	let groups: VGroup[] = [];
	let alloc: SlotsAlloc|null = null;

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
				<BatchAssessors batch={batch} alloc={alloc} />
			</div>
		</div>
	);
});

// POST htmx/bat -> upload data
app.post("/", async (c) => {
	const body = await c.req.parseBody();
	const batch_id = parseInt(body.batch_id as string);
	const org_id = parseInt(body.org_id as string);
	const samplenum = parseInt(body.samplenum as string);
	await createSample(c.env.DB, batch_id, org_id, samplenum);

	// batch must be loaded AFTER person data has been saved
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const batch = (await c.env.DB.prepare(stm0).bind(batch_id).first()) as VBatch;
	const groups = await regroupBatch(c.env.DB, batch);

	// reqs must be loaded AFTER regrouping
	const stm1 = `SELECT * FROM v_slotallocs WHERE batch_id=?`;
	const req = (await c.env.DB.prepare(stm1).bind(batch.id).first()) as SlotsAlloc;
	const { minlgd, maxlgd, minf2f, maxf2f } = getAssessorReqs(req);
	return c.html(<BatchPersons batch={batch} groups={groups} />);
})

export { app };
