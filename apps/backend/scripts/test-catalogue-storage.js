/* Local integration checks. Run after npm run build && npm run migrate. */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const express = require("express");
const { randomUUID } = require("node:crypto");
const { env } = require("../dist/config/env");
const { pool } = require("../dist/infrastructure/database/mysql/connection");
const { JwtService } = require("../dist/infrastructure/security/jwt.service");
const routes = require("../dist/modules/catalogue/presentation/routes/catalogueProduct.routes").default;

const userIds = [randomUUID(), randomUUID(), randomUUID()];
const uploadedFiles = [];
let server;
let base;
const tokens = userIds.map((sub) => JwtService.signAccessToken({ sub, email: "catalogue-test@example.invalid", roles: [] }));

async function start() {
  const app = express();
  app.use(express.json());
  app.use("/catalogue", routes);
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ error: { message: error.message } }));
  server = await new Promise((resolve) => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}`;
}
async function request(route, actor = 0, method = "GET", body) {
  const response = await fetch(base + route, {
    method, headers: { ...(actor === null ? {} : { Authorization: `Bearer ${tokens[actor]}` }),
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}) },
    body: body ? body instanceof FormData ? body : JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { status: response.status, ...data };
}
async function close() {
  if (server) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections(); });
  server = null;
}

(async () => {
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(env.db.host), "Tests require a local DB host");
  const [roles] = await pool.query("SELECT id FROM roles WHERE name = 'System Admin'");
  assert.equal(roles.length, 1, "Local bootstrap System Admin role required");
  for (const id of userIds) await pool.query(
    "INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
    [id, `${id}@catalogue-test.invalid`, "not-a-login-password", "Catalogue storage test fixture"]
  );
  await pool.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [userIds[2], roles[0].id]);
  await start();
  assert.equal((await request("/catalogue/products", null)).status, 401);
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0X8AAAAASUVORK5CYII=", "base64");
  const body = new FormData();
  body.append("file", new Blob([image], { type: "image/png" }), "sample.png");
  const upload = await request("/catalogue/images", 0, "POST", body);
  assert.equal(upload.status, 201);
  assert.match(upload.data.url, /^\/uploads\/catalogue\/[a-f0-9-]+\.png$/);
  uploadedFiles.push(path.resolve(__dirname, ".." + upload.data.url));
  const badBody = new FormData();
  badBody.append("file", new Blob(["<svg onload='bad()'/>"]), "bad.svg");
  assert.equal((await request("/catalogue/images", 0, "POST", badBody)).status, 400);

  const product = { name: "Catalogue persistence test", sku: randomUUID(), image: upload.data.url,
    images: [{ id: "cover", label: "Cover", url: upload.data.url, previewUrl: upload.data.url, isMain: true }],
    fullDetails: { material: "Acacia", sellingPriceVal: "234", customField: "preserve" }, category: "Furniture" };
  const saved = await request("/catalogue/products", 0, "POST", product);
  assert.equal(saved.status, 201);
  assert.equal(saved.data.createdBy, userIds[0]);
  const id = saved.data.id;
  assert.deepEqual(saved.data.fullDetails, product.fullDetails);
  // New HTTP server represents a fresh session/process; DB and file survive.
  await close(); await start();
  const adminList = await request("/catalogue/products", 2);
  assert.ok(adminList.data.some((p) => p.id === id));
  const viewerList = await request("/catalogue/products", 1);
  assert.ok(viewerList.data.some((p) => p.id === id));
  const imageResponse = await fetch(base + upload.data.url);
  assert.equal(imageResponse.status, 200);
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), image);
  assert.equal((await request(`/catalogue/products/${id}`, 1, "PUT", { ...saved.data, name: "Unauthorized" })).status, 403);
  const edited = await request(`/catalogue/products/${id}`, 2, "PUT", { ...saved.data, name: "Admin edit" });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.version, 2);
  assert.equal((await request(`/catalogue/products/${id}`, 0, "PUT", saved.data)).status, 409);
  assert.equal((await request("/catalogue/products", 0, "POST", { ...product, image: "blob:expired" })).status, 400);
  const imported = await request("/catalogue/products/import", 0, "POST", { legacyId: "original-browser:PF-123", product });
  const retried = await request("/catalogue/products/import", 0, "POST", { legacyId: "original-browser:PF-123", product: { ...product, name: "Do not overwrite" } });
  assert.equal(imported.status, 201);
  assert.equal(retried.data.alreadyImported, true);
  assert.equal(imported.data.product.id, retried.data.product.id);
  assert.equal(retried.data.product.name, product.name);
  assert.equal((await request(`/catalogue/products/${id}`, 0, "DELETE")).status, 403);
  assert.equal((await request(`/catalogue/products/${id}`, 2, "DELETE")).status, 200);
  assert.equal((await request(`/catalogue/products/${id}`, 2)).status, 404);
  const [deleted] = await pool.query("SELECT deleted_at, product_json FROM catalogue_products WHERE id = ?", [id]);
  assert.ok(deleted[0].deleted_at);
  assert.ok(deleted[0].product_json);
  assert.equal((await fetch(base + upload.data.url)).status, 200);
  console.log("PASS: authenticated access, durable images, cross-user/Admin visibility, complete details, restart persistence, edit ownership, optimistic locking, idempotent import, rejected blob URLs and recoverable deletion.");
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await close();
  // Delete only fixtures created by this run; never touch existing products.
  await pool.query("DELETE FROM catalogue_products WHERE created_by IN (?)", [userIds]);
  await pool.query("DELETE FROM user_roles WHERE user_id IN (?)", [userIds]);
  await pool.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  for (const file of uploadedFiles) await fs.unlink(file).catch(() => {});
  await pool.end();
});
