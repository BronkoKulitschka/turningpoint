# Update 003 – Das Werkstatt-Klemmbrett

## Installieren

`turningpoint-update-003.zip` in den Download-Ordner laden, dann:

```bash
bash ~/update-turningpoint.sh
```

Danach die veröffentlichte GitHub-Pages-Seite neu laden. CSS und JavaScript erhalten
eine neue Versionskennung. Dieses Update setzt die installierte Version 002 voraus.
Das bereits funktionierende ZIP-Skript muss nicht ersetzt werden.

## Änderungen

- Ein altes Holzklemmbrett auf einer Werkbank bildet das gesamte Spielmenü.
- Metallklammer mit Schrauben, Holzmaserung, Papierstapel, gealtertes Papier und Stempel.
- Nummerierte Spielaktionen statt Website-Navigation und Werbetexten.
- Auf größeren Bildschirmen liegen Werkstattfoto, Werkzeug und Bleistift neben dem Klemmbrett.
- Auf Smartphones konzentriert sich die Ansicht auf das bedienbare Klemmbrett.
- Werkstattnotiz und Eingabelogik entfernt.
- Nach dem Laden erscheinen Werkstattname, Inhaber und Startdatum als kompakte Betriebsakte.
- Neue Spielstände enthalten kein Notizfeld mehr. Ältere Spielstände und JSON-Sicherungen
  bleiben kompatibel; deren altes Notizfeld wird nur zum verlustfreien Reexport mitgeführt,
  nicht angezeigt oder bearbeitet.
- Laden, drei Speicherplätze, Autosave sowie Export und Import bleiben vorhanden.

Die Betriebsakte ist noch keine spielbare Werkstatt. Die Maschinenbedienung folgt separat.

## Prüfung

Elf automatisierte Speicher- und Menüaktionstests bestanden, einschließlich Import eines
Spielstands aus Update 002 und Prüfung der entfernten Notizeingabe. Der Testadapter prüft
die Ereignislogik, nicht das tatsächliche Browserlayout. Eine Live-Browserprüfung ist in
dieser Umgebung durch eine Zugriffsbeschränkung nicht verfügbar.

Statische SVG-/CSS-Oberflächen, keine zusätzlichen Bibliotheken oder externen Bildquellen.
