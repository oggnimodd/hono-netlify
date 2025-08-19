import { Hono } from "hono";
import type { Context } from "@netlify/functions";

type Env = {
	Bindings: {
		context: Context;
	};
};

const app = new Hono<Env>().basePath("/api");

app.get("/", (c) => {
	return c.text("Hello from the root of the Hono app!");
});

app.get("/users", (c) => {
	return c.json({ id: 1, name: "Orenji" });
});

app.get("/country", (c) =>
	c.json({
		"You are in": c.env.context.geo.country?.name,
	}),
);

app.all("*", (c) => {
	console.log(c.req.url);
	return c.text("Route not found........", 404);
});

export default app;
