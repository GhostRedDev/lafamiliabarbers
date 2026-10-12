// node --test server/
"use strict";

process.env.CONNEK_API_KEY_ID = "ck_live_prueba";
process.env.CONNEK_API_KEY_SECRET = "ck_sec_prueba";
process.env.CONNEK_API_BASE_URL = "https://connek.test";
process.env.CONNEK_SERVICES = "fade:390,beard:391";
process.env.RESEND_API_KEY = "";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash, createHmac } = require("node:crypto");
const {
  normalizePhone, buildSlots, localToUtcIso, parseServiceMap, server, clearCache,
} = require("./server.cjs");

test("teléfono: Norteamérica y República Dominicana van con +1", () => {
  assert.deepEqual(normalizePhone("514 555 0123"), { country_code: "1", number: "5145550123" });
  assert.deepEqual(normalizePhone("1-514-555-0123"), { country_code: "1", number: "5145550123" });
  assert.deepEqual(normalizePhone("+1 (809) 555-0123"), { country_code: "1", number: "8095550123" });
  assert.deepEqual(normalizePhone("+33 6 12 34 56 78"), { country_code: "33", number: "612345678" });
  assert.equal(normalizePhone("5550123"), null);
  assert.equal(normalizePhone("+1 514 555"), null);
  assert.equal(normalizePhone("+999 123456789"), null);
});

test("servicios de la web -> servicios de Connek", () => {
  assert.deepEqual(parseServiceMap("fade:390, beard:391,mal,combo:x"), { fade: 390, beard: 391 });
});

test("hora local -> UTC, también el día del cambio de hora", () => {
  assert.equal(localToUtcIso("2026-10-31", "10:00", "America/Toronto"), "2026-10-31T14:00:00Z");
  assert.equal(localToUtcIso("2026-11-02", "10:00", "America/Toronto"), "2026-11-02T15:00:00Z");
});

test("las ventanas se trocean como en la app y se juntan por hora", () => {
  const entries = [
    { staff_id: 7, timezone: "America/Toronto",
      slots: [{ start_utc: "2026-10-20T14:00:00Z", end_utc: "2026-10-20T17:30:00Z" }] },
    { staff_id: 8, timezone: "America/Toronto",
      slots: [{ start_utc: "2026-10-20T15:00:00Z", end_utc: "2026-10-20T16:00:00Z" }] },
  ];
  const slots = buildSlots(entries, { from: "2026-10-20", minutes: 60, now: Date.parse("2026-10-01T00:00:00Z") });
  assert.deepEqual(slots.map((s) => [s.date, s.time, s.staff_ids]), [
    ["2026-10-20", "10:00", [7]], ["2026-10-20", "11:00", [7, 8]], ["2026-10-20", "12:00", [7]],
  ]);
  // 13:00 no sale: 13:00-14:00 no cabe entero en una ventana que cierra 13:30.
});

test("no se ofrece lo que ya pasó ni lo que empieza en menos del margen", () => {
  const entries = [{ staff_id: null, timezone: "America/Toronto",
    slots: [{ start_utc: "2026-10-20T14:00:00Z", end_utc: "2026-10-20T18:00:00Z" }] }];
  const slots = buildSlots(entries, {
    from: "2026-10-20", minutes: 60, now: Date.parse("2026-10-20T15:40:00Z"), leadMinutes: 30,
  });
  assert.deepEqual(slots.map((s) => s.time), ["13:00"]);
  assert.deepEqual(slots[0].staff_ids, []);
});

// ── Flujo HTTP contra un Connek de mentira ────────────────────────────────

const realFetch = globalThis.fetch;
let llamadas = [];
let respuestas = {};

function firmaValida(init, path) {
  const h = init.headers;
  const bodySha = createHash("sha256").update(init.body || "", "utf8").digest("hex");
  const esperado = createHmac("sha256", "ck_sec_prueba")
    .update(`${init.method}\n${path}\n${h["X-Connek-Timestamp"]}\n${bodySha}`, "utf8").digest("hex");
  return h["X-Connek-Signature"] === esperado;
}

globalThis.fetch = async (url, init = {}) => {
  if (!String(url).startsWith("https://connek.test")) return realFetch(url, init);
  const u = new URL(url);
  llamadas.push({ method: init.method, path: u.pathname, query: Object.fromEntries(u.searchParams),
    body: init.body ? JSON.parse(init.body) : null, headers: init.headers,
    firmada: firmaValida(init, u.pathname) });
  const r = respuestas[`${init.method} ${u.pathname}`] || [200, {}];
  return new Response(JSON.stringify(r[1]), { status: r[0] });
};

let base;
test.before(async () => {
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => {
  // fetch deja las conexiones en keep-alive: sin cerrarlas, el proceso no termina.
  server.closeAllConnections();
  server.close();
  globalThis.fetch = realFetch;
});
test.beforeEach(() => { llamadas = []; respuestas = {}; clearCache(); });

const reservar = (extra = {}) => realFetch(`${base}/api/connek/booking`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ first_name: "Ana", email: "ana@example.com", phone: "514 555 0123",
    service: "fade", service_label: "Fade", staff_id: 94, staff_name: "Taylor",
    start_utc: "2026-10-20T15:00:00Z", ...extra }),
});

test("la reserva viaja con el barbero, firmada, y sin notas inventadas", async () => {
  respuestas["GET /v1/services"] = [200, { data: [{ id: 390, duration_minutes: 45 }] }];
  respuestas["POST /v1/clients"] = [200, { business_client_id: 3, client_id: "c-1" }];
  respuestas["POST /v1/bookings"] = [200, { booking: { id: 501, assigned_staff_id: 94 } }];
  const r = await reservar();
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, via: "booking", booking_id: 501, staff_id: 94, reference: null });

  const alta = llamadas.find((l) => l.path === "/v1/bookings");
  assert.deepEqual(alta.body, { client_id: "c-1", service_id: 390, start_time_utc: "2026-10-20T15:00:00Z",
    duration_minutes: 45, assigned_staff_id: 94 });
  const ficha = llamadas.find((l) => l.path === "/v1/clients");
  assert.deepEqual(ficha.body.phone, { country_code: "1", number: "5145550123" });
  assert.ok(llamadas.every((l) => l.firmada));
  assert.ok(!llamadas.some((l) => l.path === "/v1/leads"));
});

test("sin preferencia no manda barbero: lo asigna Connek", async () => {
  respuestas["POST /v1/clients"] = [200, { client_id: "c-1" }];
  respuestas["POST /v1/bookings"] = [200, { booking: { id: 502, assigned_staff_id: 7 } }];
  const r = await reservar({ staff_id: null });
  assert.equal((await r.json()).staff_id, 7);
  assert.ok(!("assigned_staff_id" in llamadas.find((l) => l.path === "/v1/bookings").body));
});

test("hora ocupada = 409 para la web, y no se convierte en lead", async () => {
  respuestas["POST /v1/clients"] = [200, { client_id: "c-1" }];
  respuestas["POST /v1/bookings"] = [409, { detail: { error: { code: "operation_failed" } } }];
  const r = await reservar();
  assert.equal(r.status, 409);
  assert.deepEqual(await r.json(), { ok: false, error: "slot_taken" });
  assert.ok(!llamadas.some((l) => l.path === "/v1/leads"));
});

test("si la reserva falla por otra cosa, queda como lead", async () => {
  respuestas["POST /v1/clients"] = [403, { detail: "Missing required scope: clients:write" }];
  respuestas["POST /v1/leads"] = [200, { data: { reference: "LEAD-9" } }];
  const r = await reservar();
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.equal(cuerpo.via, "lead");
  const lead = llamadas.find((l) => l.path === "/v1/leads");
  assert.match(lead.headers["Idempotency-Key"], /^lfb-[0-9a-f]{40}$/);
  assert.match(lead.body.description, /Barbier : Taylor/);
});

test("un teléfono que no se puede leer se pide otra vez", async () => {
  const r = await reservar({ phone: "12345" });
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: "invalid_phone" });
  assert.equal(llamadas.length, 0);
});

test("horas libres de la semana: la query no entra en la firma y se agrupa por día", async () => {
  respuestas["GET /v1/services"] = [200, { data: [{ id: 390, duration_minutes: 60 }] }];
  respuestas["GET /v1/availability"] = [200, { data: [
    { date: "2030-10-20", staff_id: 94, timezone: "America/Toronto",
      slots: [{ start_utc: "2030-10-20T14:00:00Z", end_utc: "2030-10-20T16:00:00Z" }] },
    { date: "2030-10-21", staff_id: 94, timezone: "America/Toronto", slots: [] },
  ] }];
  const r = await realFetch(`${base}/api/connek/availability?from=2030-10-20&to=2030-10-26&service=fade&staff=94`);
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.deepEqual(Object.keys(cuerpo.days), ["2030-10-20"]);
  assert.deepEqual(cuerpo.days["2030-10-20"].map((s) => s.time), ["10:00", "11:00"]);
  const pedida = llamadas.find((l) => l.path === "/v1/availability");
  assert.deepEqual(pedida.query,
    { from_date: "2030-10-20", to_date: "2030-10-26", service_id: "390", staff_id: "94" });
  assert.ok(pedida.firmada);
});

test("un rango largo o al revés se rechaza sin llamar a Connek", async () => {
  const largo = await realFetch(`${base}/api/connek/availability?from=2030-10-01&to=2030-11-01`);
  const reves = await realFetch(`${base}/api/connek/availability?from=2030-10-05&to=2030-10-01`);
  assert.equal(largo.status, 400);
  assert.equal(reves.status, 400);
  assert.equal(llamadas.length, 0);
});

test("el equipo sale de Connek", async () => {
  respuestas["GET /v1/staff"] = [200, { data: [{ id: 94, name: "Taylor", image: null, role: "barber" }] }];
  const r = await realFetch(`${base}/api/connek/team?service=beard`);
  assert.deepEqual(await r.json(), { data: [{ id: 94, name: "Taylor", image: null }] });
  assert.deepEqual(llamadas[0].query, { service_id: "391" });
});
