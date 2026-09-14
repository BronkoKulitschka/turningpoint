# Update 002 – Startmenü, Laden und Speichern

## Installieren

`turningpoint-update-002.zip` in den Download-Ordner des Handys laden, danach:

```bash
bash ~/update-turningpoint.sh
```

Die ZIP enthält die Webdateien direkt auf der obersten Ebene. Sie wird mit der lokalen
Kopie in `~/turningpoint` zusammengeführt; vorhandene Update-Skripte und Dokumente bleiben erhalten.

## Einmal GitHub Pages aktivieren

Im Repository auf GitHub: **Settings → Pages → Build and deployment → Source:
Deploy from a branch → Branch: main → /(root) → Save**.

Sobald GitHub die Veröffentlichung abgeschlossen hat, den dort angezeigten Website-Link öffnen.
Künftige Pushs auf `main` aktualisieren die Website automatisch. Es ist kein Build erforderlich.

Offizielle Anleitung:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Enthalten

- Responsives Startmenü mit eigener isometrischer Werkstattillustration.
- Neues Spiel: Name und Werkstattname eingeben, ersten Speicherplatz wählen.
- Fortsetzen: geöffnete Werkstatt oder zuletzt gespeicherten gültigen Stand öffnen.
- Drei manuelle Speicherplätze plus separater Autosave.
- Werkstattbuch mit editierbarer Notiz als erstem speicherbaren Inhalt.
- Autosave kurz nach dem Schreiben, beim Verlassen der Ansicht und beim Ausblenden der Seite.
- Laden, Überschreiben und Löschen mit Bestätigung.
- Einzelne Spielstände als JSON exportieren und in einen ausgewählten Platz importieren.
- Prüfung von Dateityp/Inhalt, Version, Feldern und Dateigröße beim Import.
- Beschädigte Speicherstände werden markiert und können unverändert exportiert werden.
- Meldung bei vollem oder gesperrtem Browserspeicher.

Diese Version enthält noch keine bedienbare Drehbank oder Auftragsbearbeitung.
Die Werkstattansicht nach Spielbeginn ist zunächst das Werkstattbuch.

## Wo wird gespeichert?

Spielstände liegen im lokalen Speicher des Browsers. Sie werden weder ins GitHub-Repository
noch automatisch auf andere Geräte übertragen. Ein normaler Quellcode-Update-Push löscht diese
Spielstände nicht. Das Löschen von Browser-/Websitedaten, ein anderer Browser oder eine andere
Website-Adresse kann die vorhandenen Stände jedoch unzugänglich machen. Vorher exportieren.
Privates Surfen kann die Speicherung beschränken oder beim Schließen löschen.

## Entwicklung

Statische Dateien ohne externe Fonts, Bibliotheken, CDN oder API. Relative Pfade unterstützen
GitHub-Pages-Projektseiten unter `/turningpoint/`. Kein Service Worker: keine zusätzliche Cache-Schicht.

```bash
cd ~/turningpoint
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Die HTML-Datei über HTTP/HTTPS aufrufen, nicht direkt
als lokale `file:`-Datei, da die JavaScript-Module über den Webserver geladen werden.

`src/storage.js` enthält das versionierte Speicherformat und die Speicherzugriffe;
`src/app.js` die Menüaktionen; `style.css` das Layout. Tests mit Node.js 20+:

```bash
node --test tests/*.test.js
```

Die automatisierten Speicherformat-Tests wurden ausgeführt. Ein Test im echten Browser
war in der Erstellungsumgebung wegen einer Zugriffsbeschränkung nicht möglich.

## Kurzer Funktionstest auf dem Handy

1. Neues Spiel anlegen und eine Notiz schreiben.
2. Seite neu laden, „Fortsetzen“ wählen: Name und Notiz müssen erhalten bleiben.
3. Manuell auf Platz 2 speichern. Notiz verändern. Platz 2 laden: ursprüngliche Notiz erscheint.
4. Eine Sicherung exportieren, dann wieder importieren und Platz 3 wählen.
5. Einen belegten Platz überschreiben und die Bestätigung prüfen.
