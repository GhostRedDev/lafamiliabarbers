import { useCallback, useEffect, useMemo, useState } from 'react';
import { services } from '../content/services';

/*
  Reserva con Connek — mismo flujo que Punta Cana Barbers (Jorge/puntacanabarbers):
  - el equipo (GET /api/connek/team) y las horas libres (GET /api/connek/availability) salen de
    Connek en vivo; la web no tiene barberos ni horarios escritos a mano;
  - POST /api/connek/booking crea la ficha del cliente y la cita (con el barbero elegido o "sin
    preferencia"); 409 = la hora se ocupó mientras tanto: se vuelve a las horas, recargadas;
  - sin conector (o Connek caído) se ofrecen horas de referencia y la solicitud llega igual: el
    servidor la valida contra la agenda o la deja como lead / correo de respaldo.
*/

export interface Barber { id: number | null; name: string; image: string | null }
export interface Slot { time: string; start_utc: string | null; staff_ids?: number[] }
export interface DayOption { i: number; iso: string; dow: string; day: string; mon: string; sunday: boolean }
type AvailStatus = 'idle' | 'loading' | 'ok' | 'error';
export type Notice = 'slotTaken' | 'invalidPhone' | null;
export type Sent = 'booking' | 'request' | null;

export const STEP_COUNT = 6;
const NO_PREFERENCE: Barber = { id: null, name: 'Sans préférence', image: null };
// Horas de referencia (sin Connek), dentro del horario del salón: lun–vie 10–19 h, sáb 9–17 h.
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => `${String(from + k).padStart(2, '0')}:00`);
const WEEKDAY_TIMES = range(10, 18);
const SATURDAY_TIMES = range(9, 16);

/** Horas de referencia de un día; las de hoy, solo a partir de dentro de 30 min (hora de Laval). */
function referenceTimes(d: DayOption): string[] {
  const wd = new Date(`${d.iso}T12:00:00`).getDay();
  const list = wd === 0 ? [] : wd === 6 ? SATURDAY_TIMES : WEEKDAY_TIMES;
  if (d.i !== 0) return list;
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const min = now.getHours() * 60 + now.getMinutes() + 30;
  return list.filter((t) => Number(t.slice(0, 2)) * 60 >= min);
}
const DOWS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function buildDates(): DayOption[] {
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    return { i, iso, dow: i === 0 ? 'Auj.' : DOWS[d.getDay()], day: String(d.getDate()), mon: MONS[d.getMonth()], sunday: d.getDay() === 0 };
  });
}

export function useBooking() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<number | null>(null);
  const [team, setTeam] = useState<Barber[]>([]);
  // Servicio cuyo equipo ya llegó: hasta entonces no se salta el paso del barbero.
  const [teamFor, setTeamFor] = useState<string | null>(null);
  const [barber, setBarber] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [avail, setAvail] = useState<{ status: AvailStatus; days: Record<string, Slot[]> }>({ status: 'idle', days: {} });
  const [availToken, setAvailToken] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent>(null);
  const [sendError, setSendError] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const dates = useMemo(buildDates, []);
  const svcKey = service !== null ? services[service].key : null;
  const barbers = useMemo(() => (team.length ? [NO_PREFERENCE, ...team] : [NO_PREFERENCE]), [team]);
  const hasTeam = barbers.length > 1;
  const teamReady = svcKey !== null && teamFor === svcKey;
  const chosen = barbers[barber] ?? barbers[0];
  const staffId = chosen.id;
  const day = dates[dateIdx];

  // Equipo de Connek para ese servicio.
  useEffect(() => {
    if (!open || !svcKey) return undefined;
    let alive = true;
    fetch(`/api/connek/team?service=${encodeURIComponent(svcKey)}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => { if (alive) { setTeam(Array.isArray(j.data) ? j.data : []); setTeamFor(svcKey); } })
      .catch(() => { if (alive) { setTeam([]); setTeamFor(svcKey); } });
    return () => { alive = false; };
  }, [open, svcKey]);
  useEffect(() => { if (barber >= barbers.length) setBarber(0); }, [barber, barbers.length]);

  // Horas libres de los próximos días, de una vez, para ese servicio y barbero.
  const needsTimes = open && svcKey !== null && step >= 2;
  useEffect(() => {
    if (!needsTimes || !svcKey) return undefined;
    let alive = true;
    setAvail({ status: 'loading', days: {} });
    const q = new URLSearchParams({ service: svcKey, from: dates[0].iso, to: dates[dates.length - 1].iso });
    if (staffId) q.set('staff', String(staffId));
    fetch(`/api/connek/availability?${q}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => { if (alive) setAvail({ status: 'ok', days: j.days || {} }); })
      .catch(() => { if (alive) setAvail({ status: 'error', days: {} }); });
    return () => { alive = false; };
  }, [needsTimes, svcKey, staffId, dates, availToken]);
  useEffect(() => { setSlot(null); }, [svcKey, staffId, dateIdx]);

  const dayHasSlots = useCallback(
    (d: DayOption) => (avail.status === 'ok' ? (avail.days[d.iso] || []).length > 0 : referenceTimes(d).length > 0),
    [avail],
  );
  // Si el día marcado no tiene horas, se salta al primero que sí tenga.
  useEffect(() => {
    if ((avail.status !== 'ok' && avail.status !== 'error') || dayHasSlots(dates[dateIdx])) return;
    const first = dates.find((d) => dayHasSlots(d));
    if (first) setDateIdx(first.i);
  }, [avail, dateIdx, dates, dayHasSlots]);

  const daySlots: Slot[] =
    avail.status === 'ok'
      ? avail.days[day.iso] || []
      : avail.status === 'error'
        ? referenceTimes(day).map((time) => ({ time, start_utc: null }))
        : [];

  const goNext = () => setStep((s) => { const n = Math.min(STEP_COUNT - 1, s + 1); return n === 1 && teamReady && !hasTeam ? 2 : n; });
  const goBack = () => setStep((s) => { const n = Math.max(0, s - 1); return n === 1 && !hasTeam ? 0 : n; });

  const openBooking = (svc?: number) => {
    if (svc !== undefined) { setService(svc); setStep(1); } else { setStep(0); }
    setSent(null); setSendError(false); setSending(false); setNotice(null);
    setOpen(true);
  };
  // Con un servicio ya elegido se abre en el paso siguiente (sin equipo, directamente la fecha).
  useEffect(() => { if (open && step === 1 && teamReady && !hasTeam) setStep(2); }, [open, step, teamReady, hasTeam]);

  const phoneDigits = phone.replace(/\D/g, '');
  const canAdvance =
    step === 0 ? service !== null
    : step === 2 ? dayHasSlots(day)
    : step === 3 ? slot !== null
    : step === 4 ? name.trim().length > 1 && phoneDigits.length >= 10 && /\S+@\S+\.\S+/.test(email)
    : true;

  const submit = async () => {
    if (sending || sent || service === null) return;
    setSending(true); setSendError(false); setNotice(null);
    try {
      const res = await fetch('/api/connek/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          service: svcKey,
          service_label: services[service].name,
          staff_id: staffId,
          staff_name: staffId ? chosen.name : '',
          start_utc: slot?.start_utc || undefined,
          date_iso: day.iso,
          time: slot?.time,
        }),
      });
      if (res.status === 409) {
        setNotice('slotTaken'); setSlot(null); setStep(3); setAvailToken((n) => n + 1);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 400 && body.error === 'invalid_phone') { setNotice('invalidPhone'); setStep(4); return; }
      if (!res.ok) throw new Error(String(res.status));
      setSent(body.via === 'booking' ? 'booking' : 'request');
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  return {
    open, setOpen, openBooking, step, setStep, goNext, goBack, canAdvance,
    service, setService, barbers, hasTeam, teamReady, barber, setBarber, chosen,
    dates, dateIdx, setDateIdx, day, dayHasSlots, daySlots, slot, setSlot, availStatus: avail.status,
    name, setName, phone, setPhone, email, setEmail,
    sending, sent, sendError, notice, submit,
  };
}

export type BookingState = ReturnType<typeof useBooking>;
