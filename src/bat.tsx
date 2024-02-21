import { Hono } from 'hono';
import { Layout } from './layout';
import { MainMenu, PRE, TRHR } from './components';
import { BatchRequirements, BatchHero, BatchMenu, BatchPersons, BatchSettings, FormBatchSettings, GroupTable, AssessorAllocation, PairingGroupAssessorWithParticipant, PairingF2FAssessorWithParticipant, Av } from './bat.components';
import { html } from 'hono/html';
import { createGroupsByName } from './utils';
import { getAssessorReqs } from './bat-utils';
import { P, match } from 'ts-pattern'

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
		<Layout title={ `Batch #${batch.id}` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="" />
			<div id="batch-geist">
				<BatchSettings batch={ batch } />
				<div id="batch-persons-assessors" style="margin-top:2rem">
					<BatchPersons batch={ batch } groups={ groups } />
					<BatchRequirements title="Kebutuhan Asesor" batch={ batch } alloc={ alloc } link={ true } />
				</div>
			</div>
			<script src="/static/js/batch-settings.js"></script>
			{ html`
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
		<Layout title={ `Batch #${batch.id} - Peserta` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="peserta" />
			{ by_groups.map((group) => <GroupTable group={ group } />) }
			<pre>{ JSON.stringify(by_groups[0], null, 2) }</pre>
		</Layout>
	);
});

app.get('/:id/asesor', async (c) => {
	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT s.* FROM batches b LEFT JOIN v_slotallocs s ON b.id=s.batch_id WHERE b.id=?`;
	const stm2 = `SELECT * FROM v_batch_assessors WHERE batch_id=?`;
	const stm3 = `SELECT * FROM assessors`;
	const stm4 = `SELECT * FROM v_persons WHERE batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
		/* 2 */ c.env.DB.prepare(stm2).bind(id),
		/* 3 */ c.env.DB.prepare(stm3),
		/* 4 */ c.env.DB.prepare(stm4).bind(id),
	]);

	if (!rs[0].results.length) return c.notFound();

	const batch = rs[0].results[0] as VBatch;
	const alloc = rs[1].results[0] as SlotsAlloc;
	const allocated = rs[2].results as VBatchAssessor[];
	const f2f_assessors = allocated.filter((x) => x.type == 'f2f');
	const lgd_assessors = allocated.filter((x) => x.type == 'lgd');
	// const allocated_ids = allocated.map(x => x.ass_id);
	// const assessors = (rs[3].results as Assessor[]).filter((x) => !allocated_ids.includes(x.id));
	const { minf2f, minlgd, maxf2f, maxlgd } = getAssessorReqs(alloc);
	const minmax: Minmax = getAssessorReqs(alloc);

	return c.html(
		<Layout title={ `Batch #${batch.id} - Alokasi Asesor` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="asesor" />
			<BatchRequirements batch={ batch } alloc={ alloc } />
			{/* <PRE json={f2f_assessors} /> */ }
			<AssessorAllocation batch_id={ batch.id } type="lgd" minmax={ minmax } title="Asesor Grup" assessors={ lgd_assessors } />
			<AssessorAllocation batch_id={ batch.id } type="f2f" minmax={ minmax } title="Asesor Individu" assessors={ f2f_assessors } />
			{ html`<script>
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
	function renderGroupAssessors(vGroups: VGroup[], VBatchAssessor: VBatchAssessor[]) {
		return (
			<>
				<h3>Asesor LGD</h3>
				<table>
					<PairingGroupAssessorWithParticipant vGroups={ vGroups } VBatchAssessor={ VBatchAssessor } />
				</table>
			</>
		)
	}


	function renderF2FAssessors(vPersons: VPerson[], VBatchAssessor: VBatchAssessor[]) {
		return (
			<>
				<h3 style="margin-top:3rem;">Asesor F2F</h3>
				<table>
					<PairingF2FAssessorWithParticipant vPersons={ vPersons } VBatchAssessor={ VBatchAssessor } />
				</table>
			</>
		)
	}

	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const stm2 = `SELECT * FROM v_batch_assessors WHERE type='lgd' AND batch_id=?`;
	const stm3 = `SELECT * FROM v_persons WHERE batch_id=?`;
	const stm4 = `SELECT * FROM v_batch_assessors WHERE type='f2f' AND batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
		/* 2 */ c.env.DB.prepare(stm2).bind(id),
		/* 3 */ c.env.DB.prepare(stm3).bind(id),
		/* 4 */ c.env.DB.prepare(stm4).bind(id),
	]);

	const batch = rs[0].results[0] as VBatch;
	if (!batch) return c.notFound();

	const groupAssessorsToRender = renderGroupAssessors(rs[1].results as VGroup[], rs[2].results as VBatchAssessor[]);
	const F2FAssessorsToRender = renderF2FAssessors(rs[3].results as VPerson[], rs[4].results as VBatchAssessor[]);

	return c.html(
		<Layout title={ `Batch #${batch.id} - Preparasi` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="preps" />
			{ batch.need_assessors
				? (
					<>
						<a href={ `/bat/${batch.id}/preps/asesor` } style="margin-bottom:30px;display:block;">Alokasi Assessor</a>
						{ batch.mod_lgd && groupAssessorsToRender }
						{ batch.mod_f2f && F2FAssessorsToRender }
					</>
				) :
				<p>Batch ini tidak membutuhkan asesor.</p> }
			<script src="/static/js/preps.js"></script>
		</Layout>
	);
});

app.get('/:id/preps/asesor', async (c) => {
	type TUsedAsesor = {
		"pos": number;
		"ass_id": number;
	}

	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT ass_id, batch_id, fullname, type FROM v_batch_assessors WHERE batch_id=?`;
	const stm2 = `SELECT lgd_pos as pos, lgd_ass_id as ass_id FROM v_groups WHERE batch_id=? AND lgd_ass_id IS NOT NULL`;
	const stm3 = `SELECT f2f_pos as pos, f2f_ass_id as ass_id FROM v_groupings WHERE batch_id=? AND f2f_ass_id IS NOT NULL`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
		/* 2 */ c.env.DB.prepare(stm2).bind(id),
		/* 2 */ c.env.DB.prepare(stm3).bind(id),
	]);

	if (!rs[0].results.length) return c.notFound();

	const allocated = rs[1].results as (VBatchAssessor & { slots: Record<any, number> })[];
	const lgd_assessors = allocated.filter((x) => x.type == 'lgd').map(x => {
		x.slots = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
		}
		const current = (rs[2].results as unknown as TUsedAsesor[]).filter(y => y.ass_id === x.ass_id)
		for (const c of current) {
			x.slots[`${c.pos}`] = 1
		}
		return x
	});
	const f2f_assessors = allocated.filter((x) => x.type == 'f2f').map(x => {
		x.slots = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
		}
		const current = (rs[3].results as unknown as TUsedAsesor[]).filter(y => y.ass_id === x.ass_id)
		for (const c of current) {
			x.slots[`${c.pos}`] = 1
		}
		return x
	});

	const batch = rs[0].results[0] as VBatch;

	return c.html(
		<Layout title={ `Batch #${batch.id} - Alokasi Asesor` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="preps" />
			{/* <pre>{JSON.stringify(batch, null, 2)}</pre> */ }
			<a href={ `/bat/${batch.id}/preps` } style="margin-bottom:30px;display:block;">Back</a>
			<>
				{ batch.mod_lgd && (
					<div style="margin-top:2rem">
						<div style="display:flex;align-items:center;margin-bottom:.5rem">
							<h3 style="flex-grow:1">
								Asesor LGD
							</h3>
						</div>
						<table class="assessor-allocation border-t" style="border-color:#cdd">
							<tbody>
								{ lgd_assessors.map(v => (
									<tr class="border-b" style="border-color:#cdd">
										<td>{ v.fullname }</td>
										<td>
											<div style="float:right;display:flex;gap:1rem">
												{ Object.values(v.slots).map(v => (
													<Av n={ v } />
												)) }
											</div>
										</td>
									</tr>
								)) }
							</tbody>
						</table>
					</div>
				) }
				{ batch.mod_f2f && (
					<div style="margin-top:2rem">
						<div style="display:flex;align-items:center;margin-bottom:.5rem">
							<h3 style="flex-grow:1">
								Asesor F2F
							</h3>
						</div>
						<table class="assessor-allocation border-t" style="border-color:#cdd">
							<tbody>
								{ f2f_assessors.map(v => (
									<tr class="border-b" style="border-color:#cdd">
										<td>{ v.fullname }</td>
										<td>
											<div style="float:right;display:flex;gap:1rem">
												{ Object.values(v.slots).map(v => (
													<Av n={ v } />
												)) }
											</div>
										</td>
									</tr>
								)) }
							</tbody>
						</table>
					</div>
				) }
			</>
		</Layout>
	);
});

app.get('/:id/deploy', async (c) => {
	type TSlot = {
		slot1: string | null;
		slot2: string | null;
		slot3: string | null;
		slot4: string | null;
	}

	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT slot1, slot2, slot3, slot4 FROM v_groups WHERE batch_id=?`;
	const rs = await c.env.DB.batch([
		/* 0 */ c.env.DB.prepare(stm0).bind(id),
		/* 1 */ c.env.DB.prepare(stm1).bind(id),
	])
	const batch = rs[0].results.pop() as VBatch;
	if (!batch) return c.notFound();

	const bId = batch.id
	const bName = batch.name.replace(/[aeiou]/gi, '');
	const org = batch.org_name.split(" ").reduce((acc, curr, i) => {
		if (i === 0) return acc
		acc += curr[0]
		return acc
	}, '')
	const slotTime = (rs[1].results as TSlot[]).reduce((acc, curr) => {
		Object.entries(curr).forEach(([k, v]) => {
			if (!acc[(k as keyof TSlot)]) {
				acc[(k as keyof TSlot)] = v
			}
		})
		return acc
	}, {} as TSlot);


	return c.html(
		<Layout title={ `Batch #${batch.id} - Deployment` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="deploy" />
			<h3>Pengaturan Waktu</h3>
			<form hx-put={ `/htmx/bat/${batch.id}/deploy/time` } hx-swap="none" style="margin-top:20px;" class="time-form">
				{ Object.entries(slotTime).map(([k, v]) => {
					const num = k.replaceAll('slot', '');
					if (!v) return
					return (
						<div style="display:block;margin-top:10px;display:flex;align-items:center;" class="time-container">
							<label htmlFor={ `time${num}` } style="margin-right:10px;width:20%">Time { num }</label>
							<input type="text" placeholder='15:00' name={ `time${num}` } value={ batch[`time${num}` as keyof VBatch] as string } id={ `time${num}` } style="width:100%;" />
						</div>
					)
				}) }
				<div style="display:flex;justify-content:end;">
					<button disabled class="micro" style="margin:20px 0 auto 0;">SAVE</button>
				</div>
			</form>
			<hr style="margin:20px 0;" />
			<h3>Pengaturan Slug</h3>
			<form hx-put={ `/htmx/bat/${batch.id}/deploy/slug` } hx-swap="none" style="margin-top:20px;">
				<div style="display:block;margin-top:10px;display:flex;align-items:center;">
					<label htmlFor={ `slug` } style="margin-right:10px;width:30%">Slug (Unik)</label>
					<input required type="text" placeholder='/slug-name' name={ `slug` } id={ `slug` } style="width:100%;" value={ batch.slug ?? `${org}-${bName}-${bId}`.toLocaleLowerCase() } />
				</div>
				<div style="display:flex;justify-content:end;">
					<button class="micro" style="margin:20px 0 auto 0;">SAVE</button>
				</div>
			</form>
			<script src='/static/js/deploy.js'></script>
		</Layout>
	);
});

export { app }
