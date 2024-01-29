/*
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
	<path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
</svg>;
<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="currentColor"
	className="w-6 h-6"
	style={`display:inline-block;vertical-align:baseline;margin-bottom:-.1em;${props.style}`}
>
	<path
		fillRule="evenodd"
		d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
		clipRule="evenodd"
	/>
</svg>;
*/
export const PRE = (props: { json: any }) => (
	<pre style="margin:1rem 0;font-size:.85em;background-color:#ffefcf;color:maroon;height:200px;overflow-y:auto">
		{JSON.stringify(props.json, null, 2)}
	</pre>
);
export const IconPerson = (props: { style: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 20 20"
		fill="currentColor"
		className="w-5 h-5"
		style={`display:inline-block;vertical-align:baseline;margin-bottom:-.1em;${props.style}`}
	>
		<path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
	</svg>
);
export const MainMenu = () => {
	return (
		<div id="main-menu">
			<a href="/org">Orglist</a>
			{` — `}
			<a href="/bat">Batch</a>
			{` — `}
			<a href="/mod">Modul</a>
			{` — `}
			<a href="/ass">Asesor</a>
			{` — `}
			<a href="/adm">Admin</a>
			{` — `}
			<a href="/dev">Dev</a>
		</div>
	);
};

export const PageTitle = (props: { text: string; children?: any }) => {
	const { text, children } = props;
	// if (!children) return <h1>{text}</h1>
	return (
		<div style="display:flex;gap:1rem;align-items:center;margin:1.5rem 0">
			<h1 style="margin:0;flex-grow:1">{text}</h1>
			{children}
		</div>
	);
};

export const TRHR = (props: { colspan: number }) => (
	<tr>
		<td colspan={props.colspan} style="height:0.25rem;padding:2px 0">
			<hr />
		</td>
	</tr>
);

// First level list
// OrgList BatchList AssesorList ModuleList
// First level form (new object)
// OrgForm BatchForm AssessorForm ModuleForm
// Page: Batch home
// BatchSettings BatchPersons BatchAssessors
// Page: Batch peserta
// Page: Batch asesor

export const OrgList = (props: { orgs: VOrganization[] }) => {
	const OrgRow = (props: { org: VOrganization }) => {
		const org = props.org;
		return (
			<tr>
				<td>
					<a href={`/org/${org.id}`}>{org.name}</a>
				</td>
				<td align="center">{org.batches || '-'}</td>
				<td align="center">{org.heads || '-'}</td>
				<td align="right">{org.last_batch || '-'}</td>
			</tr>
		);
	};
	return (
		<table>
			<thead>
				<tr style="font-weight:500">
					<td>Nama</td>
					<td>Batch</td>
					<td>Persona</td>
					<td width={80} align="right">
						Last Batch
					</td>
				</tr>
				<TRHR colspan={5} />
			</thead>
			<tbody id="org-list">
				{props.orgs.map((o) => (
					<OrgRow org={o} />
				))}
			</tbody>
		</table>
	);
};

export const OrgInfo = (props: { org: VOrganization; batches: VBatch[] }) => {
	const { org, batches } = props;
	const Row = (props: { l: string; v: string | number | null }) => {
		return (
			<tr>
				<td width="120">{props.l}:</td>
				<td style="font-weight:600">{props.v}</td>
			</tr>
		);
	};
	return (
		<div>
			<table>
				<tbody>
					<Row l="ID" v={org.id} />
					<Row l="Nama" v={org.name} />
					<Row l="Alamat" v={org.address} />
					<Row l="Jumlah batch" v={org.batches} />
					<Row l="Jumlah persona" v={org.heads} />
					<Row l="Batch pertama" v={org.first_batch} />
					<Row l="Batch terakhir" v={org.last_batch} />
				</tbody>
			</table>
			<BatchForm org_id={org.id} />
			<h2 style="margin:2rem 0 1rem;font-size:1.35rem">Daftar Batch</h2>
			<OrgBatches batches={batches} />
		</div>
	);
};

const BatchForm = (props: { org_id: number }) => {
	const _show = `document.getElementById('B1').style.display='none';
	document.getElementById('F1').style.display='flex';
	document.getElementById('F2').focus();`;
	const _hide = `document.getElementById('F2').value='';
	document.getElementById('F1').style.display='none';
	document.getElementById('B1').style.display='inline-block'`;
	return (
		<div class="border-t border-b" style="margin:1rem 0;padding:2rem 0;text-align:center">
			<button id="B1" onclick={_show}>
				NEW BATCH
			</button>
			{/* new-batch */}
			<form id="F1" style="display:none;gap:.5rem;align-items:center;justify-content:center;" hx-post="/htmx/new-batch" hx-swap="none">
				<input type="hidden" name="org_id" value={props.org_id} />
				<input id="F2" type="text" name="date" placeholder="YYYY-MM-DD" />
				<button>SUBMIT</button>
				<button type="button" onclick={_hide}>
					CANCEL
				</button>
			</form>
		</div>
	);
};

const OrgBatches = (props: { batches: VBatch[] }) => {
	return (
		<table>
			<thead>
				<tr>
					<td>ID</td>
					<td>Tanggal</td>
					<td>Model</td>
					<td>Peserta</td>
				</tr>
			</thead>
			<tbody>
				<TRHR colspan={4} />
				{props.batches.map((b) => (
					<tr>
						<td>
							<a href={`/bat/${b.id}`}>BATCH {b.id}</a>
						</td>
						<td>{b.date}</td>
						<td>{b.mode || '-'}</td>
						<td>{b.persons}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export const BatchList = (props: { batches: VBatch[] }) => {
	return (
		<table>
			<thead>
				<tr>
					<td style="background:">Tanggal</td>
					<td style="background:">Organisasi</td>
					<td style="background:">Modul</td>
					<td style="background:">Peserta</td>
				</tr>
			</thead>
			<tbody>
				<TRHR colspan={4} />
				{props.batches.map((b) => (
					<tr>
						<td>{b.date || '-'}</td>
						<td>
							<a href={`/bat/${b.id}`}>{b.org_name}</a>
						</td>
						<td align="center">{b.modules || '-'}</td>
						<td align="center">{b.persons || '-'}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};
