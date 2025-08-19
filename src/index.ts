import { Hono } from "hono";
import type { Context } from "@netlify/functions";
import { router } from "./router";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

const handler = new OpenAPIHandler(router, {
  plugins: [new CORSPlugin()],
});

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

type Env = {
  Bindings: {
    context: Context;
  };
};

const app = new Hono<Env>().basePath("/api");

app.get("/", (c) => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>My Client</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="https://orpc.unnoq.com/icon.svg" />
      </head>
      <body>
        <div id="app"></div>

        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', {
            url: '/api/spec.json',
            authentication: {
              securitySchemes: {
                bearerAuth: {
                  token: 'default-token',
                },
              },
            },
          })
        </script>
      </body>
    </html>
  `;
  return c.html(html);
});

app.get("/spec.json", async (c) => {
  const spec = await openAPIGenerator.generate(router, {
    info: {
      title: "My Playground",
      version: "1.0.0",
    },
    servers: [
      { url: "/api/rpc" },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  });
  return c.json(spec);
});

app.get("/users", (c) => {
  return c.json({ id: 1, name: "Orenji" });
});

app.get("/country", (c) =>
  c.json({
    "You are in": c.env.context.geo.country?.name,
  })
);

app.use("/rpc/*", async (c, next) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/api/rpc",
    context: { headers: c.req.header() },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.all("*", (c) => {
  console.log(c.req.url);
  return c.text("Route not found........", 404);
});

export default app;
