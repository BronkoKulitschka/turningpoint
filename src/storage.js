import { freshWorkshop, validateWorkshop } from './workshop-state.js?v=004';
export const SLOT_IDS = ['auto', '1', '2', '3'];
export const PREFIX = 'turningpoint.save.v1.';
const text = (s, max, empty = false) => typeof s === 'string' && s.length <= max && (empty || s.trim().length > 0);
const date = s => typeof s === 'string' && /^\d{4}-\d\d-\d\dT/.test(s) && Number.isFinite(Date.parse(s));

export function validateSave(value) {
  if (!value || value.game !== 'turningpoint' || ![1, 2].includes(value.version)) {
    throw new Error('Diese Datei ist kein unterstützter Turning-Point-Spielstand.');
  }
  const s = value.state;
  if (!s || !text(s.id, 100) || !text(s.workshopName, 40) || !text(s.ownerName, 40) ||
      (s.note !== undefined && !text(s.note, 2000, true)) || s.chapter !== 1 || !date(s.createdAt) || !date(s.updatedAt) || !date(value.savedAt)) {
    throw new Error('Der Spielstand ist unvollständig oder beschädigt.');
  }
  if (value.version === 2 && s.workshop === undefined) throw new Error('Werkstattdaten fehlen in dieser Sicherung.');
  const workshop = validateWorkshop(s.workshop);
  // Nur bekannte Felder übernehmen, keine fremden Objekte oder HTML ausführen.
  return { game: 'turningpoint', version: 2, savedAt: value.savedAt, state: {
    id: s.id, workshopName: s.workshopName.trim(), ownerName: s.ownerName.trim(),
    // Alte Sicherungen aus Update 002 bleiben verlustfrei lesbar.
    ...(s.note !== undefined ? { note: s.note } : {}),
    chapter: 1, createdAt: s.createdAt, updatedAt: s.updatedAt, workshop,
  } };
}

export function makeSave(state) {
  return validateSave({ game: 'turningpoint', version: 2, savedAt: new Date().toISOString(), state });
}

export function newState(workshopName, ownerName) {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), workshopName: workshopName.trim(), ownerName: ownerName.trim(),
    chapter: 1, createdAt: now, updatedAt: now, workshop: freshWorkshop() };
}

export function createStore(storage) {
  const key = id => {
    if (!SLOT_IDS.includes(id)) throw new Error('Unbekannter Speicherplatz.');
    return PREFIX + id;
  };
  return {
    read(id) {
      let raw;
      try { raw = storage.getItem(key(id)); }
      catch { return { status: 'unavailable' }; }
      if (raw === null) return { status: 'empty' };
      try { return { status: 'ok', save: validateSave(JSON.parse(raw)) }; }
      catch { return { status: 'corrupt', raw }; }
    },
    write(id, save) {
      const valid = validateSave(save);
      try { storage.setItem(key(id), JSON.stringify(valid)); }
      catch { throw new Error('Speichern nicht möglich. Der Browserspeicher ist voll oder gesperrt. Bitte eine Sicherung exportieren.'); }
      return valid;
    },
    remove(id) {
      try { storage.removeItem(key(id)); }
      catch { throw new Error('Dieser Speicherplatz konnte nicht gelöscht werden.'); }
    },
    latest() {
      return SLOT_IDS.map(id => ({ id, ...this.read(id) })).filter(s => s.status === 'ok')
        .sort((a, b) => Date.parse(b.save.savedAt) - Date.parse(a.save.savedAt))[0] || null;
    },
  };
}
