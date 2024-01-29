import { Hono } from 'hono';
import { Layout } from './layout';
import { MainMenu, PRE, TRHR } from './components';
import { BatchRequirements, BatchHero, BatchMenu, BatchPersons, BatchSettings, FormBatchSettings, GroupTable, AssessorAllocation } from './bat.components';
import { html } from 'hono/html';
import { createGroupsByName } from './utils';
import { getAssessorReqs } from './bat-utils';

const app = new Hono<{ Bindings: Env }>();

app.get("/:id", async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const stm2 = `SELECT * FROM v_slotallocs WHERE batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
		/* 2 */ c.env.DB.prepare(stm2).bind(id),
	]);

	if (!rs[0].results.length) return c.notFound();

	const batch = rs[0].results[0] as VBatch;
	const groups = rs[1].results as VGroup[];
	const alloc = rs[2].results[0] as SlotsAlloc;

	return c.html(
		<Layout title={`Batch #${batch.id}`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="" />
			<div id="batch-geist">
				<BatchSettings batch={batch} />
				<div id="batch-persons-assessors" style="margin-top:2rem">
					<BatchPersons batch={batch} groups={groups} />
					<BatchRequirements title="Kebutuhan Asesor" batch={batch} alloc={alloc} link={true} />
				</div>
			</div>
			<script src="/static/js/batch-settings.js"></script>
			{html`
				<script>
					let MODLEN = ${batch.modules || 0};
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
	const stm0 = 'SELECT * FROM v_batches WHERE id=?';
	const stm1 = `SELECT * FROM v_persons WHERE batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
	]);
	const batch = rs[0].results[0] as VBatch;
	const persons = rs[1].results as VPerson[];
	const by_groups = createGroupsByName(persons);
	return c.html(
		<Layout title={`Batch #${batch.id} - Peserta`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="peserta" />
			{by_groups.map((group) => <GroupTable group={group} />)}
			<pre>{JSON.stringify(by_groups[0], null, 2)}</pre>
		</Layout>
	);
});

app.get('/:id/asesor', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT s.* FROM batches b LEFT JOIN v_slotallocs s ON b.id=s.batch_id WHERE b.id=?`;
	const stm2 = `SELECT * FROM v_batch_assessors WHERE batch_id=?`;
	const stm3 = `SELECT * FROM assessors`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
		/* 2 */ c.env.DB.prepare(stm2).bind(id),
		/* 3 */ c.env.DB.prepare(stm3),
	]);

	if (!rs[0].results.length) return c.notFound();

	const batch = rs[0].results[0] as VBatch;
	const alloc = rs[1].results[0] as SlotsAlloc;
	const allocated = rs[2].results as VBatchAssessor[];
	const f2f_assessors = allocated.filter((x) => x.type == 'f2f');
	const lgd_assessors = allocated.filter((x) => x.type == 'lgd');
	const allocated_ids = allocated.map(x => x.ass_id);
	const assessors = (rs[3].results as Assessor[]).filter((x) => !allocated_ids.includes(x.id));
	const { minf2f, minlgd, maxf2f, maxlgd } = getAssessorReqs(alloc);
	const minmax: Minmax = getAssessorReqs(alloc);

	return c.html(
		<Layout title={`Batch #${batch.id} - Alokasi Asesor`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="asesor" />
			<BatchRequirements batch={batch} alloc={alloc} />
			{/* <PRE json={f2f_assessors} /> */}
			<AssessorAllocation batch_id={batch.id} type="lgd" minmax={minmax} title="Asesor Grup" assessors={lgd_assessors} />
			<AssessorAllocation batch_id={batch.id} type="f2f" minmax={minmax} title="Asesor Individu" assessors={f2f_assessors} />
			{html`<script>
				const TESTVAR = 'Badak Bercula';
				const MIN_LGD = ${minlgd};
				const MAX_LGD = ${maxlgd};
				const MIN_F2F = ${minf2f};
				const MAX_F2F = ${maxf2f};
				const LGD_ASS_IDS = [${lgd_assessors.map((x) => x.ass_id).join(',')}];
				const F2F_ASS_IDS = [${f2f_assessors.map((x) => x.ass_id).join(',')}];
			</script>`}
			<script src="/static/js/asesor.js"></script>
		</Layout>
	);
});

app.get('/:id/preps', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const stm2 = `SELECT * FROM v_batch_assessors WHERE type='lgd' AND batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
		/* 2 */ c.env.DB.prepare(stm2).bind(id),
	]);
	// const batch = (await c.env.DB.prepare(stm0).bind(id).first()) as VBatch;
	const batch = rs[0].results[0] as VBatch;
	if (!batch) return c.notFound();
	const groups = rs[1].results as VGroup[];
	const list = rs[2].results as VBatchAssessor[];
	const groups_1 = groups.filter(g => g.lgd_pos == 1);
	const groups_2 = groups.filter(g => g.lgd_pos == 2);
	const groups_3 = groups.filter(g => g.lgd_pos == 3);
	const groups_4 = groups.filter((g) => g.lgd_pos == 4);
	const groups_by_slots = [
		groups.filter(g => g.lgd_pos == 1),
		groups.filter(g => g.lgd_pos == 2),
		groups.filter(g => g.lgd_pos == 3),
		groups.filter((g) => g.lgd_pos == 4),
	];
	const ass_by_slots = [
		list.filter(a => a.slot1 == 1),
		list.filter(a => a.slot2 == 1),
		list.filter(a => a.slot3 == 1),
		list.filter(a => a.slot4 == 1),
	]
	groups.sort((a,b)=> {return a.lgd_pos - b.lgd_pos})
	const list1 = list.filter(a => a.slot1 == 1);
	const list2 = list.filter(a => a.slot2 == 1);
	const list3 = list.filter(a => a.slot3 == 1);
	const list4 = list.filter(a => a.slot4 == 1);
	return c.html(
		<Layout title={`Batch #${batch.id} - Preparasi`} class="batch">
			<MainMenu />
			<BatchHero batch={batch} />
			<BatchMenu batch_id={batch.id} current="preps" />
			<h3>Asesor LGD</h3>
			<input type="hidden" name="batch_id" value={batch.id} />
			{groups_1.map((g) => (
				<input type="hidden" name="gid[]" value={g.id} />
			))}
			<table>
				<tbody>
					{groups_by_slots.map((bs, i) => (
						<>
							<TRHR colspan={2} />
							{bs.map((g) => (
								<tr>
									<td width="130">
										Slot {g.lgd_pos} &rarr; {g.name}:
									</td>
									<td>
										<form style="display:flex;align-items:center;gap:.35rem;margin:-4px 0">
											<select name={`gslot${g.lgd_pos}`} g={g.id} style="flex-grow:1">
												<option value="">---------</option>
												{ass_by_slots[i].map((l) => (
													<option value={l.ass_id}>{l.fullname}</option>
												))}
											</select>
											<button style="border-radius:2px;padding-left:6px;padding-right:6px">OK</button>
											<button type="button" style="border-radius:2px;padding-left:6px;padding-right:6px">
												CC
											</button>
										</form>
									</td>
								</tr>
							))}
						</>
					))}
				</tbody>
				<tbody>
					<tr>
						<td colspan={2}>
							<hr />
						</td>
					</tr>
					{groups_2.map((g) => (
						<tr>
							<td>
								Slot {g.lgd_pos} &rarr; {g.name}:
							</td>
							<td>
								<div style="display:flex;align-items:center">
									<span style="flex-grow:1;font-weight:600">Nama Asesor Terpasang</span>
									<button class="micro">E</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<button>SUBMIT</button>

			<PRE json={batch} />
			<script src="/static/js/preps.js"></script>
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
