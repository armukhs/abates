import { Hono } from "hono";
import { serveStatic } from 'hono/cloudflare-workers';
import { sealData } from 'iron-session';
import { setCookie } from 'hono/cookie';
import { bat } from "./bat";
import { getSessionUser } from "./utils";
import { htmx } from "./htmx";
import { Layout } from "./layout";
import { MainMenu } from "./components";

const app = new Hono<{ Bindings: Env }>();
app.use('/static/*', serveStatic({ root: './' }));

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

app.get('/org', async (c) => {
	return c.html(
		<Layout title="Daftar Organisasi">
			<MainMenu />
			<h1>Daftar Organisasi</h1>
		</Layout>
	);
});

app.get('/bat', async (c) => {
	return c.html(
		<Layout title="Daftar Batch">
			<MainMenu />
			<h1>Daftar Batch</h1>
		</Layout>
	);
});

app.get('/ass', async (c) => {
	return c.html(
		<Layout title="Daftar Asesor">
			<MainMenu />
			<h1>Daftar Asesor</h1>
		</Layout>
	);
});

app.get('/mod', async (c) => {
	return c.html(
		<Layout title="Daftar Modul">
			<MainMenu />
			<h1>Daftar Modul</h1>
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
			<h1>Dev Page</h1>
		</Layout>
	);
});

app.route('/bat', bat);
app.route("/htmx", htmx)
export default app;

