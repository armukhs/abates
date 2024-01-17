import { Hono } from 'hono';
import { Layout } from './layout';
import { MainMenu } from './components';
import { BatchAssessors, BatchHero, BatchMenu, BatchPersons, BatchSettings, FormBatchSettings } from './bat.components';
import { html } from 'hono/html';

const app = new Hono<{ Bindings: Env }>();

app.get("/:id", async (c) => {
	// const id = c.req.param("id");
	// const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	// const batch = await c.env.DB.prepare(stm0).bind(id).first() as VBatch;
	// if (!batch) return c.notFound();
	// const id = c.req.param('id');
	// const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	// const stm1 = `SELECT * FROM tools`;
	// const rs = await c.env.DB.batch([c.env.DB.prepare(stm0).bind(id), c.env.DB.prepare(stm1)]);
	// if (rs[0].results.length == 0) {
	// 	c.status(404);
	// 	return c.body('');
	// }
	// const batch = rs[0].results[0] as VBatch;
	// const tools = rs[1].results as Tools[];
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const stm2 = `SELECT * FROM tools`;
	const stm3 = `SELECT * FROM v_slotallocs WHERE batch_id=?`;
	const rs = await c.env.DB.batch([
		c.env.DB.prepare(stm0).bind(id),
		c.env.DB.prepare(stm1).bind(id),
		c.env.DB.prepare(stm2),
		c.env.DB.prepare(stm3).bind(id),
	]);
	if (!rs[0].results.length) return c.notFound();
	const batch = rs[0].results[0] as VBatch;
	const groups = rs[1].results as VGroup[];
	const alloc = rs[3].results[0] as SlotsAlloc;
	return c.html(
		<Layout title={`Batch #${batch.id}`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="" />
			<div id="batch-geist">
				<BatchSettings batch={batch} />
				<div id="batch-persons-assessors">
					<BatchPersons batch={batch} groups={groups} />
					<BatchAssessors batch={batch} alloc={alloc} />
				</div>
			</div>
			<script src="/static/js/batch-settings.js"></script>
			{html`
				<script>
					let MODLEN = ${batch.modules || 0};
					// HX-Trigger: {"showMessage":{"level" : "info", "message" : "Here Is A Message"}}
					document.body.addEventListener('batch-updated', function (evt) {
						console.log('evt.detail.date', evt.detail.date);
						document.getElementById('batch-date').innerText = evt.detail.date;
						if (evt.detail.date) {
						}
					});
				</script>
			`}
		</Layout>
	);
})

app.get('/:id/peserta', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const batch = (await c.env.DB.prepare(stm0).bind(id).first()) as VBatch;
	if (!batch) return c.notFound();
	return c.html(
		<Layout title={`Batch #${batch.id} - Peserta`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="peserta" />
		</Layout>
	);
});

app.get('/:id/asesor', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const batch = (await c.env.DB.prepare(stm0).bind(id).first()) as VBatch;
	if (!batch) return c.notFound();
	return c.html(
		<Layout title={`Batch #${batch.id} - Alokasi Asesor`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="asesor" />
		</Layout>
	);
});

app.get('/:id/preps', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const batch = (await c.env.DB.prepare(stm0).bind(id).first()) as VBatch;
	if (!batch) return c.notFound();
	return c.html(
		<Layout title={`Batch #${batch.id} - Preparasi`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="preps" />
		</Layout>
	);
});

app.get('/:id/deploy', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const batch = (await c.env.DB.prepare(stm0).bind(id).first()) as VBatch;
	if (!batch) return c.notFound();
	return c.html(
		<Layout title={`Batch #${batch.id} - Deployment`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="deploy" />
		</Layout>
	);
});

export { app }
