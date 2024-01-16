import { Hono } from 'hono';

const htmx = new Hono<{ Bindings: Env }>();

//

export { htmx };
