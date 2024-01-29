import { Hono } from "hono";
import { html } from "hono/html";
import { serveStatic } from 'hono/cloudflare-workers';
import { sealData } from 'iron-session';
import { setCookie } from 'hono/cookie';
import { app as bat } from "./bat";
import { getSessionUser } from "./utils";
import { htmx } from "./htmx";
import { Layout } from "./layout";
import { BatchList, MainMenu, OrgInfo, OrgList, PageTitle, TRHR } from "./components";
import { app as batHtmx } from "./bat.htmx";

const app = new Hono<{ Bindings: Env }>();
app.use('/static/*', serveStatic({ root: './' }));
app.use('*', async (c, next) => {
	const start = Date.now();
	await next();
	const end = Date.now();
	c.res.headers.set('X-Response-Time', `${end - start}`);
});

app.get("/", async (c) => {
	return c.html(
		<Layout title="Selamat Datang">
			<div style="width:300px;margin:0 auto">
				<h3 style="text-align:center;margin:4rem 0 1rem">Login</h3>
				{/* <form hx-post="/login" hx-target="closest div"> */}
				<form method="post" action="/" hx-target="closest div">
					<p style="margin:.5rem 0">
						<span style="display:inline-block;width:80px;">Username:</span>
						<input id="username" value="" type="text" name="username" autofocus style="width:210px" />
					</p>
					<p style="margin:.5rem 0">
						<span style="display:inline-block;width:80px;">Password:</span>
						<input id="password" value="" type="password" name="password" style="width:210px" />
					</p>
					<p style="margin:1rem 0;text-align:center">
						<button type="submit" style="width:80px;height:32px;">
							LOGIN
						</button>
					</p>
				</form>
			</div>
		</Layout>
	);
})

app.post("/", async (c) => {
	const body = await c.req.parseBody();
	const username = body.username as string;
	const password = body.password as string;
	if (username != "admin") return c.redirect("/")
	const sealedData = await sealData({ name: "Admin", alamat: "Ngargorejo" }, { password: c.env.COOKIE_PASSWORD });
	setCookie(c, c.env.COOKIE_NAME, sealedData, { path: '/' });
	c.status(200);
	return c.redirect("/me")
})

app.get("/me", async (c) => {
	const user = await getSessionUser(c);
	if (!user) return c.html(
		<div>
			<h1>HELLO GUEST</h1>
			<a href="/">LOGIN</a>
		</div>
	);
	return c.html(
		<div>
			<h1>HELLO USER</h1>
			<pre>{JSON.stringify(user, null, 2)}</pre>
		</div>
	)
})

// =============================================================

/**
 * Simple listing with:
 * - show-hide form to add item
 * - htmx POST with Server-Side Event (SSE)
 * - SSE to trigger hiding form after submission
 * - keyup event to enable/disable submit button
 * - shared behavior on handling Escape
 */
app.get('/org', async (c) => {
	const stm = `SELECT * FROM v_organizations`;
	const rs = await c.env.DB.prepare(stm).all();

	const _showForm = `document.getElementById('F0').style.display='none';
	document.getElementById('F1').style.display='block';
	document.getElementById('F2').focus();`;

	const _hideForm = `document.getElementById('F2').value='';
	document.getElementById('F1').style.display='none';
	document.getElementById('F0').style.display='inline-block'`;

	return c.html(
		<Layout title="Daftar Organisasi">
			<MainMenu />
			<PageTitle text="Daftar Organisasi">
				<button id="F0" onclick={_showForm}>NEW</button>
			</PageTitle>
			<div id="F1" class="border-ts" style="background:#f0f5f9;display:none;margin:1rem 0;padding:2rem 0;text-align:center">
				<form
					style="display:flex;gap:.5rem;align-items:center;justify-content:center;"
					hx-post="/htmx/new-org"
					hx-target="#org-list"
					hx-swap="beforeend"
					hx-reset-on-success
				>
					<span>Nama:</span>
					<input
						id="F2"
						type="text"
						name="name"
						placeholder="Nama perusahaan"
						style="width:230px"
						escapedby="F4"
						onkeydown="__handleEsc(event)"
					/>
					<button id="F3" disabled>
						SUBMIT
					</button>
					<button id="F4" type="button" onclick={_hideForm}>
						X
					</button>
				</form>
			</div>
			<OrgList orgs={rs.results as VOrganization[]} />
			{html`
				<script>
					document.body.addEventListener('orgAdded', function () {
						document.getElementById('F4').click();
					});
					document.getElementById('F2').addEventListener('keyup', function (ev) {
						const len = ev.target.value.length;
						if (len > 10) document.getElementById('F3').removeAttribute('disabled');
						else document.getElementById('F3').setAttribute('disabled', true);
					});
				</script>
			`}
		</Layout>
	);
});

app.get('/org/:id', async (c) => {
	const id = c.req.param("id");
	const stm0 = `SELECT * FROM v_organizations WHERE id=?`;
  const stm1 = `SELECT * FROM v_batches WHERE org_id=?`
  const rs = await c.env.DB.batch([
    c.env.DB.prepare(stm0).bind(id),
    c.env.DB.prepare(stm1).bind(id),
  ])
  const org = rs[0].results[0] as VOrganization;
  const batches = rs[1].results as VBatch[];
  if (!org) return c.notFound();
	return c.html(
		<Layout title={org.name}>
			<MainMenu />
			<h1>{org.name}</h1>
			<hr />
			<OrgInfo org={org} batches={batches} />
			{html`
				<script>
					document.body.addEventListener('batch-created', function (evt) {
						console.log('evt.detail', evt.detail);
						if (evt.detail.location) {
							document.location = evt.detail.location;
						}
					});
				</script>
			`}
		</Layout>
	);
});

app.get('/bat', async (c) => {
	const stm = `SELECT * FROM v_batches`;
	const rs = await c.env.DB.prepare(stm).all();
	return c.html(
		<Layout title="Daftar Batch">
			<MainMenu />
			<h1>Daftar Batch</h1>
			<BatchList batches={rs.results as VBatch[]} />
		</Layout>
	);
});

app.get('/ass', async (c) => {
	const stm = `SELECT * FROM assessors`;
	const rs = await c.env.DB.prepare(stm).all();
	return c.html(
		<Layout title="Daftar Asesor">
			<MainMenu />
			<h1>Daftar Asesor</h1>
			<table>
				<thead>
					<tr>
						<td style="background:">Nama</td>
						<td style="background:">Username</td>
						<td style="background:">Rating</td>
						<td style="background:">Tahun</td>
					</tr>
				</thead>
				<tbody>
					<TRHR colspan={4} />
					{(rs.results as Assessor[]).map((t) => (
						<tr>
							<td style="background:">{t.fullname}</td>
							<td style="background:">{t.username}</td>
							<td style="background:"> - </td>
							<td style="background:"> - </td>
						</tr>
					))}
				</tbody>
			</table>
		</Layout>
	);
});

app.get('/mod', async (c) => {
	const stm = `SELECT * FROM tools`;
	const rs = await c.env.DB.prepare(stm).all();
	return c.html(
		<Layout title="Daftar Modul">
			<MainMenu />
			<h1>Daftar Modul</h1>
			<table>
				<thead>
					<tr>
						<td style="background:">Nama</td>
						<td style="background:">Tipe</td>
						<td style="background:">Versi</td>
						<td style="background:">Tahun</td>
					</tr>
				</thead>
				<tbody>
					<TRHR colspan={4} />
					{(rs.results as Tools[]).map((t) => (
						<tr>
							<td style="background:">{t.title}</td>
							<td style="background:">{t.category.toUpperCase()}</td>
							<td style="background:">{t.version}</td>
							<td style="background:"> - </td>
						</tr>
					))}
				</tbody>
			</table>
		</Layout>
	);
});

app.get('/adm', async (c) => {
	return c.html(
		<Layout title="Khusus Admin">
			<MainMenu />
			<h1>Khusus Admin</h1>
		</Layout>
	);
});

app.get('/dev', async (c) => {
	return c.html(
		<Layout title="Dev Page">
			<MainMenu />
			<h1 style="font-size:1.65rem;margin:1.5rem 0">Desain Tabel</h1>
			<table>
				<thead>
					<tr>
						<td>Kolom 1</td>
						<td>Kolom 2</td>
						<td>Kolom 3</td>
					</tr>
					<TRHR colspan={3} />
				</thead>
				<tbody>
					<tr>
						<td>Row 1 Kolom 1</td>
						<td>Row 1 Kolom 2</td>
						<td>Row 1 Kolom 3</td>
					</tr>
					<tr>
						<td>Row 2 Kolom 1</td>
						<td>Row 2 Kolom 2</td>
						<td>Row 2 Kolom 3</td>
					</tr>
					<tr>
						<td>Row 3 Kolom 1</td>
						<td>Row 3 Kolom 2</td>
						<td>Row 3 Kolom 3</td>
					</tr>
					<TRHR colspan={3} />
					<tr>
						<td style="padding:.25rem 0">
							<input type="text" />
						</td>
						<td style="padding:.25rem 0">
							<button>BUTTON</button>
						</td>
						<td style="padding:.25rem 0">
							<button class="micro">BUTTON</button>
						</td>
					</tr>
					<tr>
						<td style="padding:.25rem 0">
							<input type="text" />
						</td>
						<td style="padding:.25rem 0">
							<button>BUTTON</button>
						</td>
						<td style="padding:.25rem 0">
							<button class="micro">BUTTON</button>
						</td>
					</tr>
				</tbody>
			</table>
		</Layout>
	);
});

app.route('/bat', bat);
app.route("/htmx", htmx)
app.route('/htmx/bat', batHtmx);
export default app;
