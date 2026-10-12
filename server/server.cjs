// Conector de reservas de La Familia — Salon de Barbier (Laval) con la API de socios de Connek.
// Copia del de puntacanabarbers.ca (mismo mecanismo, ver Jorge/puntacanabarbers/server), con la
// marca y los correos en francés.
//
// La web nunca ve el secreto: pide aquí y este servicio firma (HMAC) contra
// `api.dev.connek.ca/v1/*` (microservicio `connek-api-client-public-key`).
//
//   GET  /api/connek/team          el equipo que recibe reservas (GET /v1/staff)
//   GET  /api/connek/availability  las horas libres de un día (GET /v1/availability)
//   POST /api/connek/booking       ficha + reserva con barbero (POST /v1/clients + /v1/bookings)
//   POST /api/connek/submission    formulario viejo -> lead (POST /v1/leads)
//
// La hora y el barbero salen de Connek, no de una lista escrita en la web: el
// barbero elegido viaja como `assigned_staff_id` y cae en SU agenda. Con "sin
// preferencia" Connek asigna uno libre. Si la hora se ocupó mientras tanto,
// Connek contesta 409 y la web vuelve a pedir las horas: eso NO es un fallo
// que haya que convertir en lead.
//
// Respaldos, por orden: lead en Connek (si la reserva falló por otra cosa) y
// correo por Resend (si Connek no respondió en absoluto).
//
// Sin dependencias: node:crypto, node:http, fetch global (Node 18+).
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const { createHash, createHmac } = require("node:crypto");

try {
  for (const line of fs.readFileSync(__dirname + "/.env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {}

const KEY_ID = process.env.CONNEK_API_KEY_ID || "";
const KEY_SECRET = process.env.CONNEK_API_KEY_SECRET || "";
// La API de socios vive en api.dev.connek.ca bajo /v1. `main.dev.connek.ca/api/v1`
// dejó de existir el 2026-09-12 (responde 401 "Se requiere sesion") y
// `api.connek.ca` es el Heroku muerto (503).
const BASE = (process.env.CONNEK_API_BASE_URL || "https://api.dev.connek.ca").replace(/\/+$/, "");
const GATEWAY_KEY = process.env.CONNEK_GATEWAY_KEY || "";
// Servicio de Connek por cada servicio de la web: "fade:390,beard:391,combo:392".
// El que no esté en la lista usa CONNEK_SERVICE_ID.
const DEFAULT_SERVICE_ID = Number(process.env.CONNEK_SERVICE_ID || 390);
const SERVICE_MAP = parseServiceMap(process.env.CONNEK_SERVICES || "");
const BOOKING_MINUTES = Number(process.env.CONNEK_BOOKING_MINUTES || 60);
const TZ = process.env.CONNEK_TZ || "America/Toronto";
// Sin margen, un cliente podía pedir la hora que empieza dentro de dos minutos.
const MIN_LEAD_MINUTES = Number(process.env.CONNEK_MIN_LEAD_MINUTES || 30);
const DEFAULT_COUNTRY_CODE = process.env.CONNEK_DEFAULT_COUNTRY_CODE || "1";
const PORT = Number(process.env.PORT || 3023);
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "La Familia Barber <team@connek.ca>";
const BUSINESS_NOTIFY_EMAIL = process.env.BUSINESS_NOTIFY_EMAIL || "";
// "always" = Resend duplica siempre. "fallback" = Resend sólo si Connek no se encargó.
const RESEND_MODE = process.env.RESEND_MODE || "fallback";

function parseServiceMap(raw) {
  const map = {};
  for (const par of raw.split(",")) {
    const [clave, id] = par.split(":").map((s) => (s || "").trim());
    if (clave && /^\d+$/.test(id || "")) map[clave] = Number(id);
  }
  return map;
}

function serviceIdFor(key) {
  return SERVICE_MAP[key] || DEFAULT_SERVICE_ID;
}

// ── Firma y llamada a Connek ──────────────────────────────────────────────

function sign(method, path, ts, body) {
  const bodySha = createHash("sha256").update(body, "utf8").digest("hex");
  const canonical = `${method}\n${path}\n${ts}\n${bodySha}`;
  return createHmac("sha256", KEY_SECRET).update(canonical, "utf8").digest("hex");
}

// La firma cubre el path SIN query (es lo que verifica el microservicio).
async function connek(method, path, { query, body, headers } = {}) {
  const text = body === undefined ? "" : JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000).toString();
  const h = {
    "X-Connek-Key-Id": KEY_ID,
    "X-Connek-Timestamp": ts,
    "X-Connek-Signature": sign(method, path, ts, text),
    ...(headers || {}),
  };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (GATEWAY_KEY) h["apikey"] = GATEWAY_KEY;
  const qs = query ? new URLSearchParams(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString() : "";
  const res = await fetch(BASE + path + (qs ? `?${qs}` : ""), {
    method, headers: h, body: body === undefined ? undefined : text,
    signal: AbortSignal.timeout(15000),
  });
  const raw = await res.text();
  let json = null;
  try { json = JSON.parse(raw); } catch {}
  return { status: res.status, ok: res.status >= 200 && res.status < 300, json, text: raw };
}

const configured = () => Boolean(KEY_ID && KEY_SECRET);

// ── Teléfono ──────────────────────────────────────────────────────────────

// Connek sólo acepta `{country_code, number}`. Casi toda la clientela marca
// como en Norteamérica (+1): Canadá y también República Dominicana (809/829/849).
// Con "+" se aceptan además los prefijos de esta lista; sin librería no hay
// forma fiable de partir cualquier número del mundo, y partirlo mal es peor
// que pedirlo otra vez.
const COUNTRY_CODES = ["1", "32", "33", "34", "41", "44", "52", "57", "58", "212", "213", "216", "509"];

function normalizePhone(raw) {
  const txt = String(raw || "").trim();
  const digits = txt.replace(/\D/g, "");
  if (txt.startsWith("+")) {
    const cc = COUNTRY_CODES
      .filter((c) => digits.startsWith(c))
      .sort((a, b) => b.length - a.length)[0];
    if (!cc) return null;
    const number = digits.slice(cc.length);
    if (cc === "1" && number.length !== 10) return null;
    if (number.length < 6 || number.length > 14) return null;
    return { country_code: cc, number };
  }
  if (digits.length === 10) return { country_code: DEFAULT_COUNTRY_CODE, number: digits };
  if (digits.length === 11 && digits.startsWith("1")) return { country_code: "1", number: digits.slice(1) };
  return null;
}

// ── Horas ─────────────────────────────────────────────────────────────────

function localParts(instant, tz) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
  const p = Object.fromEntries(fmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

// Fecha+hora locales del negocio -> ISO UTC (formulario viejo, sin start_utc).
function localToUtcIso(dateIso, timeHHMM, tz = TZ) {
  const [y, mo, d] = dateIso.split("-").map(Number);
  const [h, mi] = timeHHMM.split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const seen = localParts(asUtc, tz);
  const [sy, smo, sd] = seen.date.split("-").map(Number);
  const [sh, smi] = seen.time.split(":").map(Number);
  const seenAsUtc = Date.UTC(sy, smo - 1, sd, sh, smi);
  return new Date(asUtc + (asUtc - seenAsUtc)).toISOString().replace(/\.\d{3}Z$/, "Z");
}

const isoZ = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

// Las ventanas libres de /v1/availability, troceadas como las trocea la app de
// Connek: desde el inicio de cada ventana, un turno de `minutes` detrás de otro
// mientras quepa entero. Así toda hora que se ofrece es una que el alta acepta.
// Devuelve una fila por hora (fecha y hora del negocio) con los barberos libres.
function buildSlots(entries, { from, to = from, minutes, now = Date.now(), leadMinutes = MIN_LEAD_MINUTES, tz = TZ }) {
  const porHora = new Map();
  const limite = now + leadMinutes * 60000;
  for (const e of entries || []) {
    const zona = e.timezone || tz;
    for (const v of e.slots || []) {
      const fin = Date.parse(v.end_utc);
      for (let t = Date.parse(v.start_utc); t + minutes * 60000 <= fin; t += minutes * 60000) {
        if (t < limite) continue;
        const local = localParts(t, zona);
        if (local.date < from || local.date > to) continue;
        const clave = isoZ(t);
        const fila = porHora.get(clave) || { date: local.date, time: local.time, start_utc: clave, staff_ids: [] };
        if (e.staff_id !== null && e.staff_id !== undefined && !fila.staff_ids.includes(e.staff_id)) {
          fila.staff_ids.push(e.staff_id);
        }
        porHora.set(clave, fila);
      }
    }
  }
  return [...porHora.values()].sort((a, b) => a.start_utc.localeCompare(b.start_utc));
}

// ── Caché corta de lo que cambia poco ─────────────────────────────────────

const cache = new Map();
async function cached(key, ttlMs, load) {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const value = await load();
  cache.set(key, { value, until: Date.now() + ttlMs });
  return value;
}

async function serviceMinutes(serviceId) {
  try {
    const servicios = await cached("services", 10 * 60000, async () => {
      const r = await connek("GET", "/v1/services");
      if (!r.ok) throw new Error(`services ${r.status}`);
      return Array.isArray(r.json) ? r.json : (r.json && r.json.data) || [];
    });
    const s = servicios.find((x) => Number(x.id) === Number(serviceId));
    if (s && Number(s.duration_minutes) > 0) return Number(s.duration_minutes);
  } catch {}
  return BOOKING_MINUTES;
}

// ── Correos de respaldo (Resend) ──────────────────────────────────────────

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
}

async function sendViaResend({ to, subject, html, replyTo }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html, reply_to: replyTo }),
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`resend ${r.status}: ${body.slice(0, 200)}`);
  return body;
}

async function resendBackup({ first, email, phone, svc, detail }) {
  let emailed = false, emailErr = null;
  const row = (k, v) => `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${esc(v)}</td></tr>`;
  const businessHtml =
    `<h2 style="font-family:sans-serif">Nouvelle réservation — La Familia Barber</h2>` +
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">` +
    row("Service", svc || "—") + row("Détail", detail) + row("Client", first) +
    row("Courriel", email) + row("Téléphone", phone) +
    `</table><p style="font-family:sans-serif;font-size:12px;color:#888">Copie de secours : Connek n’a pas répondu et cette réservation N’EST PAS dans l’agenda. À confirmer manuellement.</p>`;
  const clientHtml =
    `<h2 style="font-family:sans-serif">Demande de réservation reçue</h2>` +
    `<p style="font-family:sans-serif;font-size:14px">Bonjour ${esc(first)}, merci d’avoir réservé chez <b>La Familia Barber</b>. Nous vous écrivons sous peu pour confirmer l’heure.</p>` +
    `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">` +
    row("Service", svc || "—") + row("Détail", detail) +
    `</table><p style="font-family:sans-serif;font-size:13px">225 Boul. de la Concorde O #9, Laval (QC) H7N 5T1.</p>`;
  if (BUSINESS_NOTIFY_EMAIL) {
    try {
      await sendViaResend({ to: BUSINESS_NOTIFY_EMAIL, subject: `Nouvelle réservation — ${first}${svc ? " · " + svc : ""}`, html: businessHtml, replyTo: email });
      emailed = true;
    } catch (e) { emailErr = String(e.message || e); }
  }
  try {
    await sendViaResend({ to: email, subject: "Votre demande de réservation — La Familia Barber", html: clientHtml, replyTo: BUSINESS_NOTIFY_EMAIL || undefined });
    emailed = true;
  } catch (e) { if (!emailErr) emailErr = String(e.message || e); }
  return { emailed, emailErr };
}

// ── Pasos de la reserva ───────────────────────────────────────────────────

// Lead en Connek: lo que queda cuando la reserva no se pudo crear por algo que
// no es "la hora está ocupada". Misma Idempotency-Key para el mismo envío.
async function createLead({ first, last, email, phone, serviceId, detail }) {
  try {
    const key = createHash("sha256").update(`${email}|${detail}`).digest("hex").slice(0, 40);
    const r = await connek("POST", "/v1/leads", {
      headers: { "Idempotency-Key": `lfb-${key}` },
      body: {
        title: "Réservation — site web La Familia Barber",
        description: detail.slice(0, 1000).padEnd(10, "."),
        first_name: first, last_name: last || undefined, email,
        phone: phone || undefined, service_id: serviceId || undefined,
        source: "lafamiliabarber-web",
      },
    });
    if (r.ok) return { ok: true, reference: (r.json && (r.json.reference || (r.json.data || {}).reference)) || null };
  } catch {}
  return { ok: false, reference: null };
}

async function createBooking({ first, last, email, phone, serviceId, minutes, startUtc, staffId }) {
  let clientId = null;
  try {
    const c = await connek("POST", "/v1/clients", {
      body: { first_name: first, last_name: last || undefined, email, phone, source: "lafamiliabarber-web" },
    });
    if (c.ok) clientId = (c.json && c.json.client_id) || null;
    else return { ok: false, reason: `client_${c.status}` };
  } catch { return { ok: false, reason: "client_error" }; }
  if (!clientId) return { ok: false, reason: "client_missing" };

  try {
    const body = {
      client_id: clientId,
      service_id: serviceId,
      start_time_utc: startUtc,
      duration_minutes: minutes,
    };
    if (staffId) body.assigned_staff_id = staffId;
    const r = await connek("POST", "/v1/bookings", { body });
    if (r.ok) {
      const b = (r.json && r.json.booking) || {};
      return { ok: true, bookingId: b.id || null, staffId: b.assigned_staff_id || null };
    }
    // 409 = la hora se ocupó (o nunca estuvo libre): la web ofrece otra.
    if (r.status === 409) return { ok: false, taken: true, reason: "slot_taken" };
    return { ok: false, reason: `booking_${r.status}` };
  } catch {
    return { ok: false, reason: "booking_error" };
  }
}

// ── HTTP ──────────────────────────────────────────────────────────────────

function readJson(req, res, cb) {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > 20000) req.destroy(); });
  req.on("end", () => {
    let p;
    try { p = JSON.parse(raw); } catch { return send(res, 400, { error: "invalid_json" }); }
    cb(p);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

const handlers = {
  async team(query, res) {
    if (!configured()) return send(res, 200, { data: [] });
    const serviceId = serviceIdFor(query.get("service") || "");
    try {
      const data = await cached(`team:${serviceId}`, 5 * 60000, async () => {
        const r = await connek("GET", "/v1/staff", { query: { service_id: serviceId } });
        if (!r.ok) throw new Error(`staff ${r.status}`);
        return ((r.json && r.json.data) || []).map((s) => ({ id: s.id, name: s.name, image: s.image || null }));
      });
      send(res, 200, { data });
    } catch {
      // Sin equipo de Connek la web usa su lista de siempre y reserva "sin preferencia".
      send(res, 200, { data: [], degraded: true });
    }
  },

  // ?from=YYYY-MM-DD&to=YYYY-MM-DD (máx. 14 días) &service=fade &staff=94
  // -> { minutes, timezone, days: { "YYYY-MM-DD": [{time, start_utc, staff_ids}] } }
  async availability(query, res) {
    const from = query.get("from") || query.get("date") || "";
    const to = query.get("to") || from;
    const fecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!fecha.test(from) || !fecha.test(to) || to < from) return send(res, 400, { error: "invalid_date" });
    if ((Date.parse(to) - Date.parse(from)) / 86400000 > 14) return send(res, 400, { error: "range_too_long" });
    if (!configured()) return send(res, 503, { error: "not_configured" });
    const serviceId = serviceIdFor(query.get("service") || "");
    const staff = Number(query.get("staff") || 0) || undefined;
    // Connek no deja pedir días pasados para el negocio: si la web del cliente
    // va por delante (otra zona), se empieza por hoy allí.
    const hoy = localParts(Date.now(), TZ).date;
    const desde = from < hoy ? hoy : from;
    if (to < desde) return send(res, 200, { minutes: BOOKING_MINUTES, timezone: TZ, days: {} });
    try {
      const [minutes, r] = await Promise.all([
        serviceMinutes(serviceId),
        connek("GET", "/v1/availability", {
          query: { from_date: desde, to_date: to, service_id: serviceId, staff_id: staff },
        }),
      ]);
      if (!r.ok) return send(res, 502, { error: "availability_unavailable", status: r.status });
      const entries = (r.json && r.json.data) || [];
      const days = {};
      for (const s of buildSlots(entries, { from: desde, to, minutes })) {
        (days[s.date] = days[s.date] || []).push({ time: s.time, start_utc: s.start_utc, staff_ids: s.staff_ids });
      }
      send(res, 200, { minutes, timezone: (entries[0] && entries[0].timezone) || TZ, days });
    } catch {
      send(res, 502, { error: "availability_unavailable" });
    }
  },

  booking(req, res) {
    return readJson(req, res, async (p) => {
      const first = String(p.first_name || "").trim();
      const last = String(p.last_name || "").trim();
      const email = String(p.email || "").trim();
      const phoneRaw = String(p.phone || "").trim();
      const svcKey = String(p.service || "").trim();
      const svcLabel = String(p.service_label || "").trim();
      const staffId = Number(p.staff_id || 0) || null;
      const staffName = String(p.staff_name || p.barber || "").trim();
      let startUtc = String(p.start_utc || "").trim();
      if (!startUtc && /^\d{4}-\d{2}-\d{2}$/.test(String(p.date_iso || "")) && /^\d{1,2}:\d{2}$/.test(String(p.time || ""))) {
        startUtc = localToUtcIso(String(p.date_iso), String(p.time));
      }
      if (!first || !/\S+@\S+\.\S+/.test(email) || !phoneRaw || Number.isNaN(Date.parse(startUtc))) {
        return send(res, 400, { error: "missing_field" });
      }
      const phone = normalizePhone(phoneRaw);
      if (!phone) return send(res, 400, { error: "invalid_phone" });

      const serviceId = serviceIdFor(svcKey);
      const local = localParts(Date.parse(startUtc), TZ);
      const detail =
        `Réservation (site web La Familia) — ${svcLabel || "coupe"}` +
        (staffName ? ` · Barbier : ${staffName}` : "") + ` · ${local.date} ${local.time}`;

      let via = null, bookingId = null, assigned = null, reference = null, connekOk = false;
      if (configured()) {
        const minutes = await serviceMinutes(serviceId);
        const b = await createBooking({ first, last, email, phone, serviceId, minutes, startUtc: isoZ(Date.parse(startUtc)), staffId });
        if (b.ok) {
          via = "booking"; bookingId = b.bookingId; assigned = b.staffId; connekOk = true;
        } else if (b.taken) {
          return send(res, 409, { ok: false, error: "slot_taken" });
        } else {
          console.warn(`[booking] sin reserva (${b.reason}); se deja como lead`);
          const l = await createLead({ first, last, email, phone, serviceId, detail });
          if (l.ok) { via = "lead"; reference = l.reference; connekOk = true; }
        }
      }

      let emailed = connekOk, emailErr = null;
      if (RESEND_API_KEY && (RESEND_MODE === "always" || !connekOk)) {
        const r = await resendBackup({ first, email, phone: `+${phone.country_code} ${phone.number}`, svc: svcLabel, detail });
        emailed = emailed || r.emailed;
        emailErr = r.emailErr;
        if (!via && r.emailed) via = "resend";
      }
      if (connekOk || emailed) {
        return send(res, 200, { ok: true, via, booking_id: bookingId, staff_id: assigned, reference });
      }
      send(res, 502, { ok: false, error: "delivery_failed", detail: emailErr });
    });
  },

  // Formulario viejo (bundles en caché del navegador): lo que traiga, como lead.
  submission(req, res) {
    return readJson(req, res, async (p) => {
      const first = String(p.client_first_name || "").trim();
      const email = String(p.client_email || "").trim();
      const phoneRaw = String(p.client_phone || "").trim();
      const svc = String(p.subcategory || "").trim();
      const desc = String(p.project_description || "").trim();
      if (!first || !email || !phoneRaw || !desc) return send(res, 400, { error: "missing_field" });
      const phone = normalizePhone(phoneRaw);
      if (!phone) return send(res, 400, { error: "invalid_phone" });

      let via = null, reference = null, connekOk = false;
      if (configured()) {
        const l = await createLead({ first, email, phone, serviceId: DEFAULT_SERVICE_ID, detail: desc });
        if (l.ok) { via = "lead"; reference = l.reference; connekOk = true; }
      }
      let emailed = connekOk, emailErr = null;
      if (RESEND_API_KEY && (RESEND_MODE === "always" || !connekOk)) {
        const r = await resendBackup({ first, email, phone: phoneRaw, svc, detail: desc });
        emailed = emailed || r.emailed;
        emailErr = r.emailErr;
        if (!via && r.emailed) via = "resend";
      }
      if (connekOk || emailed) return send(res, 200, { ok: true, via, reference });
      send(res, 502, { ok: false, error: "delivery_failed", detail: emailErr });
    });
  },
};

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  const url = new URL(req.url || "/", "http://localhost");
  const route = `${req.method} ${url.pathname}`;
  if (route === "GET /api/connek/team") return handlers.team(url.searchParams, res);
  if (route === "GET /api/connek/availability") return handlers.availability(url.searchParams, res);
  if (route === "POST /api/connek/booking") return handlers.booking(req, res);
  if (route === "POST /api/connek/submission") return handlers.submission(req, res);
  send(res, 404, { error: "not_found" });
});

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => console.log(`lafamilia-api en 127.0.0.1:${PORT} -> ${BASE}`));
}

const clearCache = () => cache.clear();

module.exports = { normalizePhone, buildSlots, localToUtcIso, localParts, parseServiceMap, sign, server, clearCache };
