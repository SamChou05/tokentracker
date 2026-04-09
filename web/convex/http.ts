import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { syncCreature } from "./sync";

const http = httpRouter();

// Auth routes (OAuth callbacks, etc.)
auth.addHttpRoutes(http);

// Sync endpoint for CLI
http.route({
  path: "/api/sync",
  method: "POST",
  handler: syncCreature,
});

export default http;
