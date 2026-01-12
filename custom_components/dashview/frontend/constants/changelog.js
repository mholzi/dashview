/**
 * Changelog Data
 * Manually curated changelog entries for the "What's New" popup
 *
 * The popup appears AFTER an update is installed (when CURRENT_VERSION > lastSeenVersion)
 *
 * INSTRUCTIONS:
 * 1. Update CURRENT_VERSION to match your release version
 * 2. Add a new entry at the TOP of the CHANGELOG array
 * 3. Each entry can have as many or few items as you want
 */

/**
 * Current version of the installed integration
 * UPDATE THIS with each release - must match manifest.json/const.py
 */
export const CURRENT_VERSION = '1.0.25';

/**
 * Changelog entries - newest first
 *
 * Each entry:
 * - version: Must match the release version
 * - date: Display date (any format you want)
 * - title: Release title/name
 * - changes: Array of { type, description }
 *   - type: 'feature' | 'improvement' | 'fix' | 'breaking'
 *   - description: Text to display
 */
export const CHANGELOG = [
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.16 - i18n module singleton fix
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.16',
    page: 1,
    date: 'Dezember 2025',
    title: 'Bugfix',
    subtitle: 'Übersetzungen funktionieren jetzt zuverlässig',
    changes: [
      { type: 'fix', description: 'i18n-Modul teilt jetzt den Status über alle Instanzen' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.12 - Safari compatibility fix
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.12',
    page: 1,
    date: 'Dezember 2025',
    title: 'Bugfix',
    subtitle: 'Safari-Kompatibilität',
    changes: [
      { type: 'fix', description: 'i18n funktioniert jetzt auch in Safari' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.11 - Internationalization (i18n) support
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.11',
    page: 1,
    date: 'Dezember 2025',
    title: 'Mehrsprachigkeit',
    subtitle: 'Jetzt auch auf Englisch',
    changes: [
      { type: 'feature', description: 'Vollständige englische Übersetzung hinzugefügt' },
      { type: 'feature', description: 'Sprache wird automatisch von Home Assistant übernommen' },
      { type: 'improvement', description: 'Alle Texte können jetzt einfach übersetzt werden' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.10 - UI improvements & caching fix
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.10',
    page: 1,
    date: 'Dezember 2025',
    title: 'Verbesserungen',
    subtitle: 'UI und Caching optimiert',
    changes: [
      { type: 'improvement', description: 'Entity-ID wird in Raumkonfiguration angezeigt' },
      { type: 'fix', description: 'Browser-Cache wird nach Updates automatisch aktualisiert' },
      { type: 'fix', description: 'TV-Bereich im Raum-Popup hat jetzt gleiches Layout wie Lichter' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.9 - Device names & Security fix
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.9',
    page: 1,
    date: 'Dezember 2025',
    title: 'Verbesserungen',
    subtitle: 'Admin-Bereich optimiert',
    changes: [
      { type: 'feature', description: 'Gerätename wird unter Entity-Name in Raumkonfiguration angezeigt' },
      { type: 'fix', description: 'Sicherheits-Tab zeigt jetzt alle Fenster, Garagen und Bewegungsmelder' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.8 - Long press for more-info
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.8',
    page: 1,
    date: 'Dezember 2025',
    title: 'Verbesserung',
    subtitle: 'Mehr Details per Long-Press',
    changes: [
      { type: 'feature', description: 'Langer Druck auf Licht öffnet Details-Dialog' },
      { type: 'improvement', description: 'Kurzes Tippen schaltet weiterhin das Licht' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.7 - Settings and TV fixes
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.7',
    page: 1,
    date: 'Dezember 2025',
    title: 'Bugfixes',
    subtitle: 'Einstellungen und TV-Anzeige',
    changes: [
      { type: 'fix', description: 'Einstellungen werden nicht mehr beim Neuladen überschrieben' },
      { type: 'fix', description: 'TV-Bereich im Raum-Popup wird korrekt dargestellt' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.6 - Floor/room activity indicators fix
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.6',
    page: 1,
    date: 'November 2025',
    title: 'Bugfixes',
    subtitle: 'Aktivitätsanzeige funktioniert wieder',
    changes: [
      { type: 'fix', description: 'Etagen- und Raum-Aktivitätsanzeige zeigt aktive Räume' },
      { type: 'fix', description: 'Chips im Raum-Popup werden korrekt angezeigt' },
      { type: 'fix', description: 'Lichter-Zählung und Status funktioniert wieder' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.5 - Settings persistence fixes
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.5',
    page: 1,
    date: 'November 2025',
    title: 'Bugfixes',
    subtitle: 'Einstellungen werden jetzt korrekt gespeichert',
    changes: [
      { type: 'fix', description: 'Etagen- und Raum-Reihenfolge bleibt nach Neuladen erhalten' },
      { type: 'fix', description: 'Alle aktivierten Geräte werden korrekt geladen' },
      { type: 'fix', description: 'Etagen-Übersicht und Karteneinstellungen bleiben erhalten' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.4 - Bug fixes for default-enabled behavior
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.4',
    page: 1,
    date: 'November 2025',
    title: 'Bugfixes',
    subtitle: 'Stabilität und Zuverlässigkeit verbessert',
    changes: [
      { type: 'fix', description: 'Geräte werden jetzt korrekt im Raum-Popup angezeigt' },
      { type: 'fix', description: 'Status-Anzeige im Header funktioniert wieder (Lichter an, etc.)' },
      { type: 'fix', description: 'Etagen-Übersicht wird korrekt angezeigt' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.3 - TV Support, Default enabled & bug fixes
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.3',
    page: 1,
    date: 'November 2025',
    title: 'Neu: Fernseher-Unterstützung',
    subtitle: 'Jetzt auch mit TV-Steuerung',
    changes: [
      { type: 'feature', description: 'Fernseher in Raum-Popups anzeigen und steuern' },
      { type: 'feature', description: 'TV-Status in der Übersicht ("X Fernseher an")' },
      { type: 'feature', description: 'Neues Label "dashview_tv" für Fernseher' },
    ]
  },
  {
    version: '0.0.3',
    page: 2,
    date: 'November 2025',
    title: 'Einfacherer Start',
    subtitle: 'Alles ist jetzt standardmäßig aktiviert',
    changes: [
      { type: 'improvement', description: 'Alle Räume und Geräte sind nach der Installation sofort sichtbar' },
      { type: 'improvement', description: 'Neue Geräte mit Labels werden automatisch aktiviert' },
      { type: 'fix', description: 'Müllkalender Etagenauswahl funktioniert wieder' },
    ]
  },
  // ══════════════════════════════════════════════════════════════
  // VERSION 0.0.2 - Split into 3 pages for better onboarding
  // ══════════════════════════════════════════════════════════════
  {
    version: '0.0.2',
    page: 1,
    date: 'Oktober 2025',
    title: 'Willkommen bei Dashview!',
    subtitle: 'Dein neues Smart Home Dashboard',
    changes: [
      { type: 'feature', description: 'Übersichtliches Dashboard für alle Räume und Etagen' },
      { type: 'feature', description: 'Schneller Zugriff auf Lichter, Rollos und Klimageräte' },
      { type: 'feature', description: 'Wetteranzeige mit Vorhersage direkt im Header' },
    ]
  },
  {
    version: '0.0.2',
    page: 2,
    date: 'Oktober 2025',
    title: 'Einfache Einrichtung',
    subtitle: 'Alles anpassbar über die Einstellungen',
    changes: [
      { type: 'feature', description: 'Räume und Etagen per Drag & Drop sortieren' },
      { type: 'feature', description: 'Geräte einzeln aktivieren oder deaktivieren' },
      { type: 'feature', description: 'Labels nutzen um Geräte automatisch zuzuordnen' },
    ]
  },
  {
    version: '0.0.2',
    page: 3,
    date: 'Oktober 2025',
    title: 'Immer auf dem Laufenden',
    subtitle: 'Verpasse keine Updates mehr',
    changes: [
      { type: 'feature', description: '"Was ist neu?" Popup nach jedem Update' },
      { type: 'improvement', description: 'Einfache Installation über HACS' },
      { type: 'improvement', description: 'Regelmäßige Updates mit neuen Features' },
    ]
  },
  // ──────────────────────────────────────────────────────────────
  // Add new versions ABOVE this line
  // For multi-page releases, use same version with different page numbers
  // ──────────────────────────────────────────────────────────────
];

/**
 * Compare two version strings (semver-like)
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareVersions(a, b) {
  if (!a) return -1;
  if (!b) return 1;

  const partsA = a.split('.').map(p => parseInt(p, 10) || 0);
  const partsB = b.split('.').map(p => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Check if there are new changes to show
 * Compares CURRENT_VERSION (installed) with lastSeenVersion (stored)
 * @param {string|null} lastSeenVersion - The last version the user has seen
 * @returns {boolean} True if current version is newer than last seen
 */
export function hasNewChanges(lastSeenVersion) {
  return compareVersions(CURRENT_VERSION, lastSeenVersion) > 0;
}

/**
 * Get changelog entries newer than a given version
 * @param {string|null} lastSeenVersion - The last version the user has seen
 * @returns {Array} Array of changelog entries to show
 */
export function getNewChanges(lastSeenVersion) {
  if (!lastSeenVersion) {
    // First time user - show only current version
    return CHANGELOG.filter(entry => entry.version === CURRENT_VERSION);
  }

  // Return all entries newer than lastSeenVersion
  return CHANGELOG.filter(entry =>
    compareVersions(entry.version, lastSeenVersion) > 0
  );
}

export default {
  CURRENT_VERSION,
  CHANGELOG,
  compareVersions,
  hasNewChanges,
  getNewChanges,
};
