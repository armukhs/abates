import { Hono } from 'hono';

const bat = new Hono<{ Bindings: Env }>();

bat.get('/', async (c) => {
	return c.body('/bat');
});
bat.get("/:id", async (c) => {
	const id = c.req.param("id");
	return c.body("bat: "+ id )
})

export { bat }
