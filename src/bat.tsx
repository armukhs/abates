import { Hono } from 'hono';
import { Layout } from './layout';
import { MainMenu, PRE, TRHR } from './components';
import { BatchRequirements, BatchHero, BatchMenu, BatchPersons, BatchSettings, FormBatchSettings, GroupTable, AssessorAllocation, PairingGroupAssessorWithParticipant, PairingF2FAssessorWithParticipant } from './bat.components';
import { html } from 'hono/html';
import { createGroupsByName } from './utils';
import { getAssessorReqs } from './bat-utils';
import { match } from 'ts-pattern'

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
	const allocated_ids = allocated.map(x => x.ass_id);
	const assessors = (rs[3].results as Assessor[]).filter((x) => !allocated_ids.includes(x.id));
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
			<pre>{ JSON.stringify(rs[4].results, null, 2) }</pre>
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
					<PairingGroupAssessorWithParticipant vGroups={vGroups} VBatchAssessor={VBatchAssessor} />
				</table>
			</>
		)
	}


	function renderF2FAssessors(vPersons: TVPersonCustom[], VBatchAssessor: VBatchAssessor[]) {
		return (
			<>
				<h3 style="margin-top:3rem;">Asesor F2F</h3>
				<table>
					<PairingF2FAssessorWithParticipant vPersons={vPersons} VBatchAssessor={VBatchAssessor} />
				</table>
			</>
		)
	}

	const id = c.req.param('id');
	const stm0 = `SELECT * FROM v_batches WHERE id=?`;
	const stm1 = `SELECT * FROM v_groups WHERE batch_id=?`;
	const stm2 = `SELECT * FROM v_batch_assessors WHERE type='lgd' AND batch_id=?`;
	const stm3 = `SELECT batch_id, id as person_id, fullname, group_id, group_name, f2f_ass_id, f2f_pos FROM v_persons WHERE batch_id=?`;
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
	const F2FAssessorsToRender = renderF2FAssessors(rs[3].results as TVPersonCustom[], rs[4].results as VBatchAssessor[]);

	return c.html(
		<Layout title={ `Batch #${batch.id} - Preparasi` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="preps" />
			{ groupAssessorsToRender }
			{ F2FAssessorsToRender }
			<PRE json={ rs[3].results } />
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
		<Layout title={ `Batch #${batch.id} - Deployment` } class="batch">
			<MainMenu />
			<BatchHero batch={ batch } />
			<BatchMenu batch_id={ batch.id } current="deploy" />
		</Layout>
	);
});

export { app }
