import { Hono } from 'hono';

const htmx = new Hono<{ Bindings: Env }>();

htmx.post("/new-org", async (c) => {
	const { name } = await c.req.parseBody();
	const stm0 = `INSERT INTO organizations (name) VALUES (?)`;
	const stm1 = `SELECT * FROM v_organizations ORDER BY id DESC LIMIT 1`;
	const res = await c.env.DB.batch([
		//
		c.env.DB.prepare(stm0).bind(name),
		c.env.DB.prepare(stm1),
	]);
	console.log(res[0]);
	const org = res[1].results[0] as VOrganization;
	// HX-Trigger: {"showMessage":{"level" : "info", "message" : "Here Is A Message"}}
	// c.res.headers.append('HX-Trigger', `{"batch-created":{"batch_id" : ${batch.id}}}`);
	c.res.headers.append('HX-Trigger', "orgAdded");
	return c.html(
		<tr>
			<td>
				<a href={`/org/${org.id}`}>{org.name}</a>
			</td>
			<td align="center">{org.batches || '-'}</td>
			<td align="center">{org.heads || '-'}</td>
			<td align="right">{org.last_batch || '-'}</td>
		</tr>
	);
})

htmx.post('/new-batch', async (c) => {
	const { org_id, date } = await c.req.parseBody();
	const stm = `SELECT * FROM organizations WHERE id=?`;
	const rs = await c.env.DB.prepare(stm).bind(org_id).first();
	if (!rs) return c.notFound();
	const stm0 = `INSERT INTO batches (org_id, date, name) VALUES (?,?,?)`;
	const stm1 = `SELECT * FROM v_batches WHERE org_id=? ORDER BY id DESC LIMIT 1`;
	const res = await c.env.DB.batch([c.env.DB.prepare(stm0).bind(org_id, date, 'BATCH'), c.env.DB.prepare(stm1).bind(org_id)]);
	const batch = res[1].results[0] as Batch;
	console.log(res[0]);
	console.log(res[1]);
	// HX-Trigger: {"showMessage":{"level" : "info", "message" : "Here Is A Message"}}
	c.res.headers.append('HX-Trigger', `{"batch-created":{"batch_id" : ${batch.id}}}`);
	return c.body('');
});

export { htmx };
