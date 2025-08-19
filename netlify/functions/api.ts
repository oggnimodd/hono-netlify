import { handle } from "hono/netlify";
import app from "../../dist/index.js";

export default handle(app);
