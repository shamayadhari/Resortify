// Shared setup for the API tests. Runs against a throwaway database whose name must end in "_test".
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI ?? "mongodb://127.0.0.1:27017/resortify_test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234567890";
process.env.BCRYPT_COST = "10";
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads-test";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ?? "1000";

export async function startApi() {
  const { connectDb, disconnectDb } = await import("../src/config/db.js");
  const { createApp } = await import("../src/app.js");
  const mongoose = (await import("mongoose")).default;
  await connectDb();
  if (!mongoose.connection.name.endsWith("_test")) throw new Error("Refusing to run tests on a non-test database");
  await mongoose.connection.dropDatabase();
  const { User } = await import("../src/models/User.js");
  const { ContactMessage } = await import("../src/models/ContactMessage.js");
  await Promise.all([User.init(), ContactMessage.init()]).catch(() => {});

  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, path, { body, token, headers = {}, form } = {}) {
    const h = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      h["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(base + path, { method, headers: h, body: payload });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, json, headers: res.headers, raw: text };
  }

  return {
    base,
    call,
    mongoose,
    models: { User, ContactMessage },
    async stop() {
      await new Promise((r) => server.close(r));
      await disconnectDb();
    },
  };
}
