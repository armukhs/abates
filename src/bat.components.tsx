import { html } from "hono/html";
import { TRHR } from "./components";
import { getAssessorReqs } from "./bat-utils";

export const BatchHero = (props: { batch: VBatch }) => {
	return (
		<h1>
			<div class="sub">BATCH {props.batch.id}</div>
			<div>{props.batch.org_name}</div>
			<div class="sub" style="display:flex;align-items:center;gap:.5rem;">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					style="display:inline-block;width:24px;height:24px;margin-top:-2px"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
					/>
				</svg>
				<span id="batch-date">{props.batch.date}</span>
			</div>
		</h1>
	);
}

export const BatchMenu = (props: { batch_id: number; current: string }) => {
	if (!['', 'peserta', 'asesor', 'preps', 'deploy'].includes(props.current)) return <p>MENU ERROR</p>;
	return (
		<div class="batch-menu">
			{props.current == '' ? <span class="current">Settings</span> : <a href={`/bat/${props.batch_id}`}>Settings</a>}
			<span>/</span>
			{props.current == 'peserta' ? <span class="current">Peserta</span> : <a href={`/bat/${props.batch_id}/peserta`}>Peserta</a>}
			<span>/</span>
			{props.current == 'asesor' ? <span class="current">Asesor</span> : <a href={`/bat/${props.batch_id}/asesor`}>Asesor</a>}
			<span>/</span>
			{props.current == 'preps' ? <span class="current">Preps</span> : <a href={`/bat/${props.batch_id}/preps`}>Preps</a>}
			<span>/</span>
			{props.current == 'deploy' ? <span class="current">Deploy</span> : <a href={`/bat/${props.batch_id}/deploy`}>Deploy</a>}
		</div>
	);
};

export const BatchSettings = (props: { batch: VBatch }) => {
	const batch = props.batch;
	const VData = (props: { l: string; v: any }) => (
		<tr>
			<td width="140">{props.l}:</td>
			{props.v ? (
				<td style="font-weight:600">{props.v}</td>
			) : (
				<td style="color:#789"> - N/A</td>
			)}
		</tr>
	);
	return (
		<div id="batch-settings" style="">
			<div style="display:flex;align-items:center;margin-bottom:0.5rem">
				<h3 style="margin:0;flex-grow:1">Tanggal &amp; Modul</h3>
				<button
					id="btn-edit"
					class="small"
					type="button"
					hx-get={`/htmx/bat/${batch.id}/form`}
					hx-target="#batch-settings"
					hx-swap="outerHTML"
				>
					EDIT
				</button>
			</div>
			<table cellspacing={0} style="line-height:22px">
				<tbody>
					<TRHR colspan={2} />
					<VData l="Tanggal" v={batch.date} />
					<TRHR colspan={2} />
					<VData l="Modul Selftest" v={batch.mod_self} />
					<VData l="Modul Case-Based" v={batch.mod_case} />
					<VData l="Modul FaceToFace" v={batch.mod_f2f} />
					<VData l="Modul InGroup" v={batch.mod_lgd} />
					<TRHR colspan={2} />
					<tr>
						<td>Batch Split:</td>
						<td style="font-weight:600">
							<div style="float:right">{batch.mode}</div>
							<div style="">{batch.split}</div>
						</td>
					</tr>
					<TRHR colspan={2} />
				</tbody>
			</table>
			{html`<script>
				// When modules is empty, click btn-edit to load form
				if (typeof MODLEN === 'undefined') MODLEN = ${batch.modules || 0};
				if (MODLEN == 0) setTimeout(() => document.getElementById('btn-edit').click(), 300);
			</script>`}
		</div>
	);
};

const ModuleOptions = (props: { tools: Tools[], filter: string, compare: string|null }) => {
	return (
		<>
			<option value=""> –––––––</option>
			{props.tools
				.filter((t) => t.category == props.filter)
				.map((t) => (
					<>
						<>{t.id != props.compare && <option value={t.id}>{t.title}</option>}</>
						<>
							{t.id == props.compare && (
								<option selected value={t.id}>
									{t.title}
								</option>
							)}
						</>
					</>
				))}
		</>
	);
}

export const FormBatchSettings = (props: { batch: VBatch; tools: Tools[] }) => {
	const batch = props.batch;
	const tools = props.tools;
	const FData = (props: { l: string; children: any }) => (
		<tr>
			<td>{props.l}:</td>
			<td>{props.children}</td>
		</tr>
	);
	const Radio = (props: { v: number; c: boolean }) => {
		return (
			<label style="margin-right:.5rem">
				<span>{props.v} </span>
				{props.c && <input checked id={`split${props.v}`} type="radio" name="split" value={props.v} />}
				{!props.c && <input id={`split${props.v}`} type="radio" name="split" value={props.v} />}
			</label>
		);
	};
	return (
		<div id="batch-settings" style="">
			<form hx-put="/htmx/bat" hx-target="#batch-geist" hx-swap="outerHTML">
				<input id="batch-id" type="hidden" name="id" value={batch.id} />
				<input id="batch-mode" type="hidden" name="mode" value={batch.mode || ''} />
				<div style="display:flex;align-items:center;margin-bottom:0.5rem">
					<h3 style="margin:0;flex-grow:1">Tanggal &amp; Modul</h3>
					<div style="display:flex;align-items:center;gap:.5rem;height:25px">
						{/* <button class="small" id="modules-submit" disabled type="submit">
							SAVE
						</button>
						<button
							type="button"
							class="small"
							id="cancel-settings"
							hx-get={`/htmx/bat/${batch.id}`}
							hx-target="#batch-settings"
							hx-swap="outerHTML"
						>
							CANCEL
						</button> */}
					</div>
				</div>
				<table id="batch-settings" cellspacing={0} style="line-height:22px">
					<tbody>
						<TRHR colspan={2} />
						<FData l="Tanggal">
							<input
								id="date"
								type="text"
								autofocus
								name="date"
								value={batch.date}
								style="width:120px;margin:-4px 0"
								escapedby="cancel-settings"
								onkeydown="__handleEsc(event)"
							/>
						</FData>
						<TRHR colspan={2} />
						<FData l="Modul Selftest">
							<select id="mod-self" name="onSelf" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-2px 0 -4px">
								<ModuleOptions tools={tools} filter="self" compare={batch.on_self} />
							</select>
						</FData>
						<FData l="Modul Case-Based">
							<select id="mod-case" name="onCase" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-4px 0">
								<ModuleOptions tools={tools} filter="case" compare={batch.on_case} />
							</select>
						</FData>
						<FData l="Modul FaceToFace">
							<select id="mod-f2f" name="onF2f" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-4px 0">
								<ModuleOptions tools={tools} filter="f2f" compare={batch.on_f2f} />
							</select>
						</FData>
						<FData l="Modul InGroup">
							<select id="mod-group" name="onGroup" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-4px 0 -2px">
								<ModuleOptions tools={tools} filter="lgd" compare={batch.on_lgd} />
							</select>
						</FData>
						<TRHR colspan={2} />
						<tr>
							<td width="140">Batch Split:</td>
							<td>
								<div style="float:right">
									<span id="batch-mode-span">{batch.mode}</span>
								</div>
								<div>
									<Radio v={1} c={batch.split == 1} />
									<Radio v={2} c={batch.split == 2} />
									<Radio v={3} c={batch.split == 3} />
									<Radio v={4} c={batch.split == 4} />
								</div>
							</td>
						</tr>
						<TRHR colspan={2} />
						<tr>
							<td></td>
							<td>
								<button id="modules-submit" disabled type="submit">
									SAVE
								</button>
								<button
									type="button"
									id="cancel-settings"
									style="margin-left:.5rem"
									hx-get={`/htmx/bat/${batch.id}`}
									hx-target="#batch-settings"
									hx-swap="outerHTML"
								>
									CANCEL
								</button>
							</td>
						</tr>
					</tbody>
				</table>
				{html`<script>
					setTimeout(() => __setting(), '500');
				</script>`}
			</form>
		</div>
	);
};

export const BatchPersons = (props: { batch: VBatch; groups: VGroup[] }) => {
	if (!props.batch.modules) return <></>;
	if (!props.batch.persons || props.batch.persons == 0) {
		return <EmptyPersons batch_id={props.batch.id} org_id={props.batch.org_id} />;
	}
	return (
		<div id="batch-persons">
			<h3>Peserta Batch</h3>
			<p style="margin:.75rem 0 .5rem">
				Jumlah peserta <b>{props.batch.persons} orang</b>, terbagi dalam <b>{props.batch.groups} grup</b> dan jadwal sbb:
			</p>
			<BatchGroups groups={props.groups} />
			<p style="margin:.5rem 0">
				<span>Daftar lengkap peserta per grup </span>
				<a style="" href={`/bat/${props.batch.id}/peserta`}>
					dapat dilihat di sini
				</a>
				.
			</p>
		</div>
	);
};

const EmptyPersons = (props: { batch_id: number; org_id: number }) => {
	return (
		<div id="batch-persons">
			<div style="display:flex;align-items:center;margin:2.5rem 0 .5rem">
				<h3 style="margin:0;flex-grow:1">Peserta Batch</h3>
				<button id="btn-upload" class="small">UPLOAD DATA</button>
			</div>
			<p id="empty" style="line-height:24px;">
				Belum ada data peserta
			</p>
			{/* <form id="upload-form" hx-post="/htmx/upload" hx-target="#empty" hx-swap="outerHTML" style="display:none"> */}
			<form
				id="upload-form"
				hx-post="/htmx/bat"
				hx-target="#batch-persons-assessors"
				hx-swap="outerHTML" style="display:none">
				<div style="display:flex;align-items:center;gap:.25rem">
					<span>Jumlah sample:</span>
					<input type="hidden" name="org_id" value={props.org_id} />
					<input type="hidden" name="batch_id" value={props.batch_id} />
					<input
						id="samplenum"
						type="number"
						name="samplenum"
						value={28}
						style="margin-left:0.25rem;width:50px"
						escapedby="cancel-upload"
						onkeydown="__handleEsc(event)"
					/>
					<button style="margin-left:0.25rem">CREATE</button>
					<button type="button" id="cancel-upload" style="margin-left:0.25rem">
						CANCEL
					</button>
				</div>
			</form>
			{html`
				<script>
					document.getElementById('btn-upload').addEventListener('click', (e) => {
						document.getElementById('empty').style.display = 'none';
						document.getElementById('upload-form').style.display = 'block';
						document.getElementById('btn-upload').setAttribute('disabled', true);
						document.getElementById('samplenum').focus();
					});
					document.getElementById('cancel-upload').addEventListener('click', (e) => {
						document.getElementById('upload-form').style.display = 'none';
						document.getElementById('empty').style.display = 'block';
						document.getElementById('btn-upload').removeAttribute('disabled');
					});
				</script>
			`}
		</div>
	);
};

export const BatchGroups = (props: { groups: VGroup[] }) => {
	const GroupTd = (props: { v: any }) => {
		// return props.v ? <td class="group-slot">{props.v}</td> : <td class="group-slot blank"></td>;
		if (!props.v) return <td class="group-slot blank"></td>;
		return <td class={`group-slot ${props.v}`}>{props.v}</td>;
	};
	return (
		<table class="grouping">
			<thead>
				<tr>
					<td>Grup</td>
					<td width={20}>JA</td>
					<td>Slot 1</td>
					<td>Slot 2</td>
					<td>Slot 3</td>
					<td>Slot 4</td>
				</tr>
			</thead>
			<tbody>
				{props.groups.map((g: VGroup) => (
					<tr>
						<td>Grup {g.name.split(' ')[1]}</td>
						<td align="center">{g.members}</td>
						<GroupTd v={g.slot1} />
						<GroupTd v={g.slot2} />
						<GroupTd v={g.slot3} />
						<GroupTd v={g.slot4} />
					</tr>
				))}
			</tbody>
		</table>
	);
};

export const BatchAssessors = (props: { batch: VBatch; alloc: SlotsAlloc|null }) => {
	if (!props.batch.modules) return <></>;
	if (props.batch.persons == 0) return <></>;
	const need_assessors = props.batch.need_assessors > 0;
	// const { minf2f, minlgd, maxf2f, maxlgd } = getAssessorReqs(props.ass_reqs);
	return (
		<div id="batch-assessors">
			<h3 style="margin-bottom:0.5rem">Kebutuhan Asesor</h3>
			{!need_assessors && <p>Batch ini tidak memerlukan asesor.</p>}
			{need_assessors && (
				<>
					<ReqsTable alloc={props.alloc} />
					<p style="margin:.5rem 0">
						<span>Pemenuhan dan pengaturan asesor dapat </span>
						<a style="" href={`/bat/${props.batch.id}/asesor`}>
							dilakukan di sini
						</a>
						.
					</p>
				</>
			)}
			{/*  */}
		</div>
	);
};

export const ReqsTable = (props: { alloc: SlotsAlloc|null }) => {
	// let minlgd = 0,
	// 	maxlgd = 0,
	// 	minf2f = 0,
	// 	maxf2f = 0;
	// if (props.req) {
	// 	const x = getAssessorReqs(props.req);
	// 	minlgd = x.minlgd;
	// 	maxlgd = x.maxlgd;
	// 	minf2f = x.minf2f;
	// 	maxf2f = x.maxf2f;
	// }
	const { minf2f, minlgd, maxf2f, maxlgd } = getAssessorReqs(props.alloc||undefined);
	return (
		<table>
			<thead>
				<tr>
					<td class="border-b">Jenis Asesor</td>
					<td class="center border-b">Minimum</td>
					<td class="center border-b">Maksimum</td>
					<td class="center border-b">Tersedia</td>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Asesor Grup:</td>
					<td class="center">{'' + minlgd}</td>
					<td class="center">{'' + maxlgd}</td>
					<td class="center">-</td>
				</tr>
				<tr>
					<td>Asesor Individu:</td>
					<td class="center">{'' + minf2f}</td>
					<td class="center">{'' + maxf2f}</td>
					<td class="center">-</td>
				</tr>
				<tr>
					<td class="border-b">Case Reviewer</td>
					<td class="center border-b">-</td>
					<td class="center border-b">-</td>
					<td class="center border-b">-</td>
				</tr>
			</tbody>
		</table>
	);
};
