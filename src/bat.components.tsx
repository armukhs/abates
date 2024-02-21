import { html } from "hono/html";
import { IconPerson, TRHR } from "./components";
import { getAssessorReqs } from "./bat-utils";
import { match } from "ts-pattern";

export const BatchHero = (props: { batch: VBatch }) => {
	return (
		<h1>
			<div class="sub" style="text-transform:capitalize;">{props.batch.name} { props.batch.id }</div>
			<div>{ props.batch.org_name }</div>
			<div class="sub" style="display:flex;align-items:center;gap:.5rem;">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={ 1.5 }
					stroke="currentColor"
					style="display:inline-block;width:22px;height:22px;margin-top:-2px"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
					/>
				</svg>
				<span id="batch-date">{ props.batch.date }</span>
			</div>
		</h1>
	);
}

export const BatchMenu = (props: { batch_id: number; current: string }) => {
	if (!['', 'peserta', 'asesor', 'preps', 'deploy'].includes(props.current)) return <p>MENU ERROR</p>;
	return (
		<div class="batch-menu">
			{ props.current == '' ? <span class="current">Settings</span> : <a href={ `/bat/${props.batch_id}` }>Settings</a> }
			<span>/</span>
			{ props.current == 'peserta' ? <span class="current">Peserta</span> : <a href={ `/bat/${props.batch_id}/peserta` }>Peserta</a> }
			<span>/</span>
			{ props.current == 'asesor' ? <span class="current">Asesor</span> : <a href={ `/bat/${props.batch_id}/asesor` }>Asesor</a> }
			<span>/</span>
			{ props.current == 'preps' ? <span class="current">Preps</span> : <a href={ `/bat/${props.batch_id}/preps` }>Preps</a> }
			<span>/</span>
			{ props.current == 'deploy' ? <span class="current">Deploy</span> : <a href={ `/bat/${props.batch_id}/deploy` }>Deploy</a> }
		</div>
	);
};

export const BatchSettings = (props: { batch: VBatch }) => {
	const batch = props.batch;
	const VData = (props: { l: string; v: any }) => (
		<tr>
			<td width="140">{ props.l }:</td>
			{ props.v ? (
				<td style="font-weight:600">{ props.v }</td>
			) : (
				<td style="color:#789"> - N/A</td>
			) }
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
					__hx-get={ `/htmx/bat/${batch.id}/form` }
					hx-get={ `/htmx/bat/${batch.id}?form` }
					hx-target="#batch-settings"
					hx-swap="outerHTML"
				>
					EDIT
				</button>
			</div>
			<table cellspacing={ 0 } style="line-height:22px">
				<tbody>
					<TRHR colspan={ 2 } />
					<VData l="Tanggal" v={ batch.date } />
					<TRHR colspan={ 2 } />
					<VData l="Modul Selftest" v={ batch.mod_self } />
					<VData l="Modul Case-Based" v={ batch.mod_case } />
					<VData l="Modul FaceToFace" v={ batch.mod_f2f } />
					<VData l="Modul InGroup" v={ batch.mod_lgd } />
					<TRHR colspan={ 2 } />
					<tr>
						<td>Batch Split:</td>
						<td style="font-weight:600">
							<div style="float:right">{ batch.mode }</div>
							<div style="">{ batch.split }</div>
						</td>
					</tr>
					<TRHR colspan={ 2 } />
				</tbody>
			</table>
			{ html`<script>
				// When modules is empty, click btn-edit to load form
				if (typeof MODLEN === 'undefined') MODLEN = ${batch.modules || 0};
				if (MODLEN == 0) setTimeout(() => document.getElementById('btn-edit').click(), 300);
			</script>`}
		</div>
	);
};

const ModuleOptions = (props: { tools: Tools[], filter: string, compare: string | null }) => {
	return (
		<>
			<option value=""> –––––––</option>
			{ props.tools
				.filter((t) => t.category == props.filter)
				.map((t) => (
					<>
						<>{ t.id != props.compare && <option value={ t.id }>{ t.title }</option> }</>
						<>
							{ t.id == props.compare && (
								<option selected value={ t.id }>
									{ t.title }
								</option>
							) }
						</>
					</>
				)) }
		</>
	);
}

export const FormBatchSettings = (props: { batch: VBatch; tools: Tools[] }) => {
	const batch = props.batch;
	const tools = props.tools;
	const FData = (props: { l: string; children: any }) => (
		<tr>
			<td>{ props.l }:</td>
			<td>{ props.children }</td>
		</tr>
	);
	const Radio = (props: { v: number; c: boolean }) => {
		return (
			<label style="margin-right:.5rem">
				<span>{ props.v } </span>
				{ props.c && <input checked id={ `split${props.v}` } type="radio" name="split" value={ props.v } /> }
				{ !props.c && <input id={ `split${props.v}` } type="radio" name="split" value={ props.v } /> }
			</label>
		);
	};
	return (
		<div id="batch-settings" style="">
			{/* <form hx-put="/htmx/bat" hx-target="#batch-geist" hx-swap="outerHTML"> */ }
			<form hx-put={ `/htmx/bat/${batch.id}` } hx-target="#batch-geist" hx-swap="outerHTML">
				<input id="batch-id" type="hidden" name="id" value={ batch.id } />
				<input id="batch-mode" type="hidden" name="mode" value={ batch.mode || '' } />
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
				<table id="batch-settings" cellspacing={ 0 } style="line-height:22px">
					<tbody>
						<TRHR colspan={ 2 } />
						<FData l="Tanggal">
							<input
								id="date"
								type="text"
								autofocus
								name="date"
								value={ batch.date }
								style="width:120px;margin:-4px 0"
								escapedby="cancel-settings"
								onkeydown="__handleEsc(event)"
							/>
						</FData>
						<TRHR colspan={ 2 } />
						<FData l="Modul Selftest">
							<select id="mod-self" name="onSelf" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-2px 0 -4px">
								<ModuleOptions tools={ tools } filter="self" compare={ batch.on_self } />
							</select>
						</FData>
						<FData l="Modul Case-Based">
							<select id="mod-case" name="onCase" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-4px 0">
								<ModuleOptions tools={ tools } filter="case" compare={ batch.on_case } />
							</select>
						</FData>
						<FData l="Modul FaceToFace">
							<select id="mod-f2f" name="onF2f" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-4px 0">
								<ModuleOptions tools={ tools } filter="f2f" compare={ batch.on_f2f } />
							</select>
						</FData>
						<FData l="Modul InGroup">
							<select id="mod-group" name="onGroup" escapedby="cancel-settings" onkeydown="__handleEsc(event)" style="margin:-4px 0 -2px">
								<ModuleOptions tools={ tools } filter="lgd" compare={ batch.on_lgd } />
							</select>
						</FData>
						<TRHR colspan={ 2 } />
						<tr>
							<td width="140">Batch Split:</td>
							<td>
								<div style="float:right">
									<span id="batch-mode-span">{ batch.mode }</span>
								</div>
								<div>
									<Radio v={ 1 } c={ batch.split == 1 } />
									<Radio v={ 2 } c={ batch.split == 2 } />
									<Radio v={ 3 } c={ batch.split == 3 } />
									<Radio v={ 4 } c={ batch.split == 4 } />
								</div>
							</td>
						</tr>
						<TRHR colspan={ 2 } />
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
									hx-get={ `/htmx/bat/${batch.id}` }
									hx-target="#batch-settings"
									hx-swap="outerHTML"
								>
									CANCEL
								</button>
							</td>
						</tr>
					</tbody>
				</table>
				{ html`<script>
					setTimeout(() => __setting(), '500');
				</script>`}
			</form>
		</div>
	);
};

export const BatchPersons = (props: { batch: VBatch; groups: VGroup[] }) => {
	if (!props.batch.modules) return <></>;
	if (!props.batch.persons || props.batch.persons == 0) {
		return <EmptyPersons batch_id={ props.batch.id } org_id={ props.batch.org_id } />;
	}
	return (
		<div id="batch-persons">
			<h3>Peserta Batch</h3>
			<p style="margin:.75rem 0 .5rem">
				Jumlah peserta <b>{ props.batch.persons } orang</b>, terbagi dalam <b>{ props.batch.groups } grup</b> dan jadwal sbb:
			</p>
			<BatchGroups groups={ props.groups } />
			<p style="margin:.5rem 0">
				<span>Daftar lengkap peserta per grup </span>
				<a style="" href={ `/bat/${props.batch.id}/peserta` }>
					dapat dilihat di sini
				</a>
				.
			</p>
		</div>
	);
};

const EmptyPersons = (props: { batch_id: number; org_id: number }) => {
	const { batch_id, org_id } = props;
	return (
		<div id="batch-persons">
			<div style="display:flex;align-items:center;margin:2.5rem 0 .5rem">
				<h3 style="margin:0;flex-grow:1">Peserta Batch</h3>
				<button id="btn-upload" class="small">
					UPLOAD DATA
				</button>
			</div>
			<p id="empty" style="line-height:24px;">
				Belum ada data peserta
			</p>
			{/* <form id="upload-form" hx-post="/htmx/upload" hx-target="#empty" hx-swap="outerHTML" style="display:none"> */ }
			<form
				id="upload-form"
				hx-post={ `/htmx/bat/${batch_id}` }
				hx-target="#batch-persons-assessors"
				hx-swap="outerHTML"
				style="display:none"
			>
				<div style="display:flex;align-items:center;gap:.25rem">
					<span>CSV:</span>
					<input type="hidden" name="participants" />
					<input type="hidden" name="org_id" value={ org_id } />
					<input type="hidden" name="batch_id" value={ batch_id } />
					<input
						id="csv"
						name="csv"
						type="file"
						accept=".csv"
						style="margin-left:0.25rem;"
						escapedby="cancel-upload"
						onkeydown="__handleEsc(event)"
					/>
					<button type="submit" id="process-upload" style="display:none;" />
					<button type="button" id="before-upload" style="margin-left:0.25rem">CREATE</button>
					<button type="button" id="cancel-upload" style="margin-left:0.25rem">
						CANCEL
					</button>
				</div>
			</form>
			{ html`
				<script src="https://unpkg.com/papaparse@5.4.1/papaparse.min.js"></script>
				<script>
					document.getElementById("before-upload").addEventListener("click", async (e) => {
						function toJSON(file) {
							return new Promise((resolve, reject) => {
								const fr = new FileReader()
								fr.onload = (e) => {
									try {
										const t = e.target.result
										const x = (window?.Papa.parse(t))?.data ?? []
										x.shift()
										if(!x.length) return;
										const y = x.map(v => ({
											name: v[0],
											username: v?.[1]?.trim() ? v?.[1] : null,
											password: v?.[2]?.trim() ? v?.[2] : null,
										}))
										return resolve(y)
									} catch (error) {
										reject(error)
									}
								}

								fr.onerror = reject
								fr.readAsText(file)
							})
						}

						const file = document.getElementById("csv").files[0];
						if(!file) return;

						const participants = await toJSON(file)
						document.querySelector("input[name=participants]").value = JSON.stringify(participants)
						document.getElementById("process-upload").click()
					})

					document.getElementById('btn-upload').addEventListener('click', (e) => {
						document.getElementById('empty').style.display = 'none';
						document.getElementById('upload-form').style.display = 'block';
						document.getElementById('btn-upload').setAttribute('disabled', true);
						document.getElementById("csv").value = '';
						document.getElementById("csv").textContent = '';
					});
					document.getElementById('cancel-upload').addEventListener('click', (e) => {
						document.getElementById('upload-form').style.display = 'none';
						document.getElementById('empty').style.display = 'block';
						document.getElementById('btn-upload').removeAttribute('disabled');
						document.getElementById("csv").value = '';
						document.getElementById("csv").textContent = '';
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
		return <td class={ `group-slot ${props.v}` }>{ props.v }</td>;
	};
	return (
		<table class="grouping">
			<thead>
				<tr>
					<td>Grup</td>
					<td width={ 20 }>JA</td>
					<td>Slot 1</td>
					<td>Slot 2</td>
					<td>Slot 3</td>
					<td>Slot 4</td>
				</tr>
			</thead>
			<tbody>
				{ props.groups.map((g: VGroup) => (
					<tr>
						<td>Grup { g.name.split(' ')[1] }</td>
						<td align="center">{ g.members }</td>
						<GroupTd v={ g.slot1 } />
						<GroupTd v={ g.slot2 } />
						<GroupTd v={ g.slot3 } />
						<GroupTd v={ g.slot4 } />
					</tr>
				)) }
			</tbody>
		</table>
	);
};

export const BatchRequirements = (props: { batch: VBatch; alloc: SlotsAlloc | null; title?: string; link?: boolean }) => {
	const { batch, alloc } = props;
	const title = props.title || "";

	if (!batch.modules) return (
		<div id="batch-assessors" style="margin:1rem 0">
			{ title.length > 0 && <h3 style="margin-bottom:0.5rem">{ title }</h3> }
			<p>Modul belum ditetapkan: belum diketahui kebutuhan asesor.</p>
		</div>
	);
	if (!batch.need_assessors) return (
		<div id="batch-assessors" style="margin:1rem 0">
			{ title.length > 0 && <h3 style="margin-bottom:0.5rem">{ title }</h3> }
			<p>Batch ini tidak membutuhkan asesor.</p>
		</div>
	);
	if (batch.persons == 0) return (
		<div id="batch-assessors" style="margin:1rem 0">
			{ title.length > 0 && <h3 style="margin-bottom:0.5rem">{ title }</h3> }
			<p>Peserta belum ditetapkan: belum diketahui kebutuhan asesor.</p>
		</div>
	);

	return (
		<div id="batch-assessors" style="margin:1rem 0">
			{ title.length > 0 && <h3 style="margin-bottom:0.5rem">{ title }</h3> }
			<ReqsTable alloc={ alloc } />
			{ props.link && (
				<p style="margin:.5rem 0">
					<span>Pemenuhan dan pemilihan asesor dapat </span>
					<a style="" href={ `/bat/${batch.id}/asesor` }>
						dilakukan di sini
					</a>
					.
				</p>
			) }
		</div>
	);
};

export const ReqsTable = (props: { alloc: SlotsAlloc | null }) => {
	const { minf2f, minlgd, maxf2f, maxlgd } = getAssessorReqs(props.alloc || undefined);
	const V = (props: { n: number }) => {
		if (props.n < 1) return <td class="center">0</td>;
		return <td class="center bold">{ props.n }</td>;
	};
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
					{/* <td class="center">{'' + minlgd}</td> */ }
					{/* <td class="center">{'' + maxlgd}</td> */ }
					<V n={ minlgd } />
					<V n={ maxlgd } />
					<td class="center">-</td>
				</tr>
				<tr>
					<td>Asesor Individu:</td>
					<V n={ minf2f } />
					<V n={ maxf2f } />
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

export const GroupTable = (props: { group: GroupWithMembers }) => {
	const group = props.group;
	return (
		<div class="group-table">
			<div style="display:flex;align-items:center;margin:1rem 0 .45rem">
				<h4 style="flex-grow:1">
					{ group.name } (<IconPerson style="width:16px;height:16px" /> { group.members.length })
				</h4>
				<div>SLOTS</div>
			</div>
			<hr />
			{ group.members[0].lgd_pos > 0 && (
				<>
					<div style="display:flex;align-items:center;margin-top:.25rem">
						<p style="flex-grow:1;">Asesor Grup:</p>
						<p>{ group.members[0].lgd_assessor_name || '---' }</p>
					</div>
					<hr style="margin-top:.25rem" />
				</>
			) }
			{ group.members.map((p) => (
				<div style="display:flex;align-items:center;margin-top:.25rem">
					<p style="flex-grow:1">{ p.fullname }</p>
					<p>{ p.f2f_assessor_name || "-" }</p>
				</div>
			)) }
		</div>
	);
};

export const Av = (props: { n: number }) => {
	return props.n == 0 || props.n == undefined ? (
		<span style="width:15px;text-align:center">-</span>
	) : (
		<img src="/static/images/checked.png" style="width:15px;height:15px;margin-top:2px;opacity:0.65" />
	);
};

export const AllocationRow = (props: { assessor: VBatchAssessor }) => {
	const { assessor: a } = props;
	
	return (
		<tr class="border-b" style="border-color:#cdd">
			<td>{ a.fullname }</td>
			<td>
				<div style="float:right;display:flex;gap:1rem">
					<Av n={ a.slot1 } />
					<Av n={ a.slot2 } />
					<Av n={ a.slot3 } />
					<Av n={ a.slot4 } />
					<div style="display:flex;gap:8px;padding-left:8px">
						<button
							class="micro"
							hx-get={ `/htmx/bat/ass/${a.ass_id}/${a.type}?batch_id=${a.batch_id}&form` }
							hx-target="closest tr"
							hx-swap="outerHTML"
						>
							✎
						</button>
						{ ` ` }
						<form hx-delete={ `/htmx/bat/${a.batch_id}/assessors` } hx-target="closest tr" hx-swap="outerHTML">
							<input type="hidden" name="ass_id" value={ a.ass_id } />
							<input type="hidden" name="type" value={ a.type } />
							<button class="micro">
								X
							</button>
						</form>
					</div>
				</div>
			</td>
		</tr>
	);
};

export const FormAllocationRow = (props: { assessor: VBatchAssessor }) => {
	const { assessor } = props;
	console.log(assessor)
	const Ax = (props: { name: string; v: number }) => {
		if (props.v == 0) return (
			<input type="checkbox" name={ props.name } />
		);
		return (
			<input type="checkbox" checked name={ props.name } />
		);
	};
	return (
		<tr class="border-b" style="border-color:#cdd">
			<td>{ assessor.fullname }</td>
			<td height={ 36 }>
				<form
					style="display:flex;align-items:center;gap:.975rem;float:right"
					hx-put={ `/htmx/bat/ass/${assessor.batch_id}/${assessor.ass_id}` }
					hx-target="closest tr"
					hx-swap="outerHTML"
				>
					<Ax name="slot1" v={ assessor.slot1 } />
					<Ax name="slot2" v={ assessor.slot2 } />
					<Ax name="slot3" v={ assessor.slot3 } />
					<Ax name="slot4" v={ assessor.slot4 } />
					<div style="display:flex;gap:.25rem">
						<button class="micro">OK</button>
						<button
							class="micro"
							type="button"
							hx-get={ `/htmx/bat/ass/${assessor.ass_id}/${assessor.type}?batch_id=${assessor.batch_id}` }
							hx-target="closest tr"
							hx-swap="outerHTML"
						>
							ESC
						</button>
					</div>
				</form>
			</td>
		</tr>
	);
};

export const AssessorAllocation = (props: { batch_id: number; type: string; minmax: Minmax; title: string; assessors: VBatchAssessor[] }) => {
	const { batch_id, type, minmax, title, assessors } = props;
	const parent_id = `${type}-assessors`;
	const tray_id = `${type}-assessors-tray`;
	const bucket_id = `${type}-assessors-bucket`;
	const minimum = type == "lgd" ? minmax.minlgd : minmax.minf2f;
	const maximum = type == 'lgd' ? minmax.maxlgd : minmax.maxf2f;
	if (minimum == 0) return <></>
	return (
		<div id={ parent_id } style="margin-top:2rem">
			<div style="display:flex;align-items:center;margin-bottom:.5rem">
				<h3 style="flex-grow:1">
					{ title }: { minimum } - { maximum }
				</h3>
			</div>
			<table class="assessor-allocation border-t" style="border-color:#cdd">
				<tbody id={ tray_id }>
					{ assessors.map((a) => (
						<AllocationRow assessor={ a } />
					)) }
				</tbody>
			</table>
			<div id={ `${type}-load-bucket` } style="margin:.5rem 0;display:none">
				<button
					id={ `btn-${type}-load-bucket` }
					class="bucket-loader"
					hx-get={ `/htmx/bat/${batch_id}/assessors/${type}` }
					hx-target={ `#${bucket_id}` }
					hx-swap="innerHTML"
				>
					LOAD BUCKET
				</button>
			</div>
			<div id={ bucket_id }></div>
		</div>
	);
};

export const PairingGroupAssessorWithParticipant = ({ vGroups, VBatchAssessor }: { vGroups: VGroup[], VBatchAssessor: VBatchAssessor[] }) => {
	const groups_by_slots = [
		vGroups.filter(g => g.lgd_pos == 1),
		vGroups.filter(g => g.lgd_pos == 2),
		vGroups.filter(g => g.lgd_pos == 3),
		vGroups.filter((g) => g.lgd_pos == 4),
	];
	const ass_by_slots = [
		VBatchAssessor.filter(a => a.slot1 == 1),
		VBatchAssessor.filter(a => a.slot2 == 1),
		VBatchAssessor.filter(a => a.slot3 == 1),
		VBatchAssessor.filter(a => a.slot4 == 1),
	]

	return (
		<tbody id="PairingGroupAssessorWithParticipant">
			{
				groups_by_slots.map((bs, i) => (
					<>
						<TRHR colspan={ 2 } />
						{ bs.map((g) => (
							<tr>
								<td width="130">
									Slot { g.lgd_pos } &rarr; { g.name }:
								</td>
								<td>
									<form
										hx-swap="outerHTML"
										hx-target="#PairingGroupAssessorWithParticipant"
										hx-put={ `/htmx/bat/${g.batch_id}/preps/assessor-participant/group/${g.id}` }
										style="display:flex;align-items:center;gap:.35rem;margin:-4px 0"
									>
										<select name={ `gslot${g.lgd_pos}` } g={ g.id } style="flex-grow:1">
											<option value="">---------</option>
											{ ass_by_slots[i].map((l) => (
												<option disabled={ Boolean(bs.find(x => x.lgd_ass_id === l.ass_id)) } selected={ l.ass_id === g.lgd_ass_id } value={ l.ass_id }>{ l.fullname }</option>
											)) }
										</select>
										<button style="border-radius:2px;padding-left:6px;padding-right:6px">OK</button>
										<button type="button" style="border-radius:2px;padding-left:6px;padding-right:6px">
											CC
										</button>
									</form>
								</td>
							</tr>
						)) }
					</>
				))
			}
		</tbody>
	)
}

export const PairingF2FAssessorWithParticipant = ({ vPersons, VBatchAssessor }: { vPersons: VPerson[], VBatchAssessor: VBatchAssessor[] }) => {
	type TAssessorAvailability = Record<'1' | '2' | '3' | '4', Record<string, { disabled: boolean; fullname: string; ass_id: number }>>

	const persons_by_group = vPersons.reduce<Record<string, VPerson[]>>((acc, curr) => {
		if (acc[curr.f2f_pos]) {
			acc[curr.f2f_pos].push(curr)
		} else {
			acc[curr.f2f_pos] = [curr]
		}

		return acc
	}, {} as Record<string, VPerson[]>)

	const assessor_by_availability = VBatchAssessor.reduce<TAssessorAvailability>((acc, curr) => {
		const pairedParticipants = vPersons.filter(v => v.f2f_ass_id === curr.ass_id)
		const toPush = {
			fullname: curr.fullname,
			ass_id: curr.ass_id,
			disabled: false,
		}

		const fillAssessor = (position: '1' | '2' | '3' | '4'): void => {
			const copied = { ...toPush }

			if (pairedParticipants.find(x => x.f2f_pos === Number(position))) {
				copied.disabled = true
			}

			if (acc[`${position}`]) {
				acc[`${position}`][curr.ass_id] = copied
			} else {
				acc[`${position}`] = { [curr.ass_id]: copied }
			}
		}

		if (curr.slot1 === 1) {
			fillAssessor('1')
		}
		if (curr.slot2 === 1) {
			fillAssessor('2')
		}
		if (curr.slot3 === 1) {
			fillAssessor('3')
		}
		if (curr.slot4 === 1) {
			fillAssessor('4')
		}

		return acc
	}, {} as TAssessorAvailability)

	return (
		<>
			<tbody id="PairingF2FAssessorWithParticipant">
				{
					Object.entries(persons_by_group).map((bs, i) => (
						<>
							<tr colspan={ 2 }>
								<td>
									<strong>Sesi {bs[0]}</strong>
								</td>
							</tr>
							<TRHR colspan={ 2 } />
							{ bs[1].map((g) => (
								<tr>
									<td width="130">
										{ g.fullname }
									</td>
									<td>
										<form
											hx-swap="outerHTML"
											hx-target="#PairingF2FAssessorWithParticipant"
											hx-put={ `/htmx/bat/${g.batch_id}/preps/assessor-participant/f2f/${g.id}` }
											style="display:flex;align-items:center;gap:.35rem;margin:-4px 0"
										>
											<select style="flex-grow:1" name="ass_id">
												<option value="">---------</option>
												{ match(Boolean(assessor_by_availability[g.f2f_pos as unknown as '1' | '2' | '3' | '4']))
													.with(true, () => (
														<>
															{
																Object.values(assessor_by_availability[g.f2f_pos as unknown as '1' | '2' | '3' | '4']).map((l) => (
																	<option disabled={ l.disabled } selected={ l.ass_id === g.f2f_ass_id } value={ l.ass_id }>{ l.fullname }</option>
																))
															}
														</>
													))
													.otherwise(() => null) }
											</select>
											<button style="border-radius:2px;padding-left:6px;padding-right:6px">OK</button>
											<button type="button" style="border-radius:2px;padding-left:6px;padding-right:6px">
												CC
											</button>
										</form>
									</td>
								</tr>
							)) }
						</>
					))
				}
			</tbody>
		</>
	)
}