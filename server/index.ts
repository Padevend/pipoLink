import { createRouter } from "./start/kernel.js";

const app = createRouter();

app.get("/__health", (c) => c.text("ok"));

export default app;