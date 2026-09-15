# Update 004 – Erster interaktiver Werkstatt-Prototyp

## Installation

Version 003 muss bereits installiert sein. `turningpoint-update-004.zip` in den
Download-Ordner laden und in Termux ausführen:

```bash
bash ~/update-turningpoint.sh
```

Nach der GitHub-Pages-Veröffentlichung die Spielseite neu laden. „Fortsetzen“ öffnet
nun die Werkstatt. Auch bestehende Spiele funktionieren; fehlende Werkstattdaten
werden beim Laden ergänzt. Ein neues Spiel ist nicht erforderlich.

## Erster Testauftrag

1. Schreibtisch anklicken, „Ein Bolzen für Kowalski“ annehmen.
2. Am Materialständer einen Aluminium-Rohling auswählen.
3. Am Werkzeugwagen „Werkzeuge bereitlegen“ drücken.
4. Drehbank anklicken. Die voreingestellten Testwerte sind 450 U/min und 0,1 mm/U.
5. Drehbank starten. Der erste Durchgang dauert im Spiel zwölf Sekunden.
6. Am Schraubstock das Werkstück entgraten.
7. Am Messschieber den Durchmesser messen.
8. Am Schreibtisch den geprüften Auftrag abgeben: 90 € werden gutgeschrieben.

Weitere Testaufträge kommen von Frau Brenner und Mehmet. Neue, laufende und
abgeschlossene Aufträge werden am Schreibtisch getrennt angezeigt. Ein Auftrag
wird zur selben Zeit bearbeitet. Nach drei abgeschlossenen Aufträgen ist der
vorbereitete Auftragsbestand dieses Prototyps abgearbeitet.

## Funktionen der Werkstattobjekte

| Objekt | Funktion |
| --- | --- |
| Schreibtisch | Aufträge annehmen, Status ansehen, fertige Aufträge abgeben |
| Regal rechts | Lagerbestand und fertige Teile, Material nachbestellen |
| Materialständer | Passenden Rohling für den laufenden Auftrag auswählen |
| Drehbank | Schnittwerte einstellen, Bearbeitung starten/pausieren, Nacharbeit, Arbeitslicht |
| Werkzeugschrank | HSS oder geliehenes Hartmetall auswählen, Verschleiß prüfen, instand setzen |
| Werkzeugwagen | Werkzeug und Messmittel für den Auftrag bereitlegen |
| Schraubstock | Gedrehte Werkstücke entgraten |
| Messschieber | Maßkontrolle, Freigabe oder Rückgabe zur Nacharbeit |
| Späneeimer und Besen | Boden reinigen, eingesammelte Späne verkaufen |
| Radio | Eigenständig erzeugten Klang ein-/ausschalten und Lautstärke einstellen |
| Katze Späne | Streicheln, Reaktion und Zähler |
| Bauplan | Sichtbaren Anbau kaufen; zusätzliche Standbohrmaschine aufstellen |
| Neue Standbohrmaschine | Probebohrung mit Verbrauch eines Alu-Rohlings; Probestück zum Schrott |

Die Gegenstände sind direkt anklickbar. Die Leiste am unteren Bildschirmrand
öffnet dieselben Arbeitsbereiche und erleichtert die Bedienung auf kleinen
Bildschirmen. Mit +/− lässt sich die Szene vergrößern; im vergrößerten Ausschnitt
kann gescrollt beziehungsweise mit einem Finger verschoben werden. „Übersicht“
setzt den Zoom zurück. Das × schließt den Arbeitsbereich.

## Spielregeln im Funktionstest

- Werkstattkasse am Start: 250 €. Vorrat: 4 Alu-, 3 C45- und 2 Messing-Rohlinge.
- Ein passender Rohling wird beim Auswählen verbraucht.
- Werkzeugverschleiß und Späne steigen nach einem abgeschlossenen Durchgang.
- Ab 85 % Verschleiß muss das Werkzeug instand gesetzt werden.
- Nach fünf Durchgängen ohne Reinigung stoppt der Start weiterer Bearbeitungen.
- 450 U/min und 0,1 mm/U mit ausreichend scharfem Werkzeug liefern im vereinfachten
  Modell ein maßhaltiges Teil. Andere Einstellungen können Übermaß erzeugen.
- Ein gemessenes Teil mit Übermaß kann nachgearbeitet werden. Dabei wird kein
  zweiter Rohling verbraucht. Entgraten und Messen sind erneut erforderlich.
- Vergütung erfolgt erst nach erfolgreicher Prüfung und Abgabe.
- Lieferung, Entgraten, Messung, Probebohrung und Ausbau werden sofort ausgeführt.
- Der Anbau erweitert von 6 × 5 m auf 8 × 5 m. Er kostet 200 €, die Bohrmaschine 180 €.
- Schnittwerte, Toleranzen, Preise und Zeiten sind Testbalancing, keine realistische
  Zerspanungssimulation oder Maschinenanleitung.

## Speichern und Wiederaufnehmen

Jede Aktion wird im Autosave gespeichert. Während einer Bearbeitung wird ihr
Fortschritt etwa einmal pro Sekunde gespeichert. Das Öffnen des Hauptmenüs,
Ausblenden der Seite und Laden eines Spielstands pausieren die Maschine.
Zum Weiterarbeiten an der Drehbank „Bearbeitung fortsetzen“ wählen. Es gibt
noch keine Bearbeitung im geschlossenen Browser.

Drei manuelle Speicherplätze sowie JSON-Export und -Import bleiben bestehen.
Manuelle Spielstände sind unabhängige Momentaufnahmen. Das neue Dateiformat ist
Version 2; ältere Dateien der Version 1 werden übernommen. Die Speicherplatz-
Schlüssel im Browser bleiben identisch. Alte Notizinhalte werden nur zur
verlustfreien Sicherung mitgeführt und weiterhin nicht angezeigt.

Bei Änderungen durch einen anderen geöffneten Tab pausiert dieser Tab und stoppt
seinen Autosave. Bei Bedarf den eigenen Stand auf einem manuellen Platz sichern
und anschließend diesen Platz ausdrücklich laden. So wird fremder Fortschritt
nicht ohne Hinweis überschrieben.

## Grafik und technische Struktur

Die erste Werkstatt verwendet eine vereinfachte, modular gezeichnete isometrische
SVG-Szene. Sie übernimmt die wesentliche Raumaufteilung der Referenz; die
Detailqualität der Pixelart-Vorlage ist in diesem Funktionstest noch nicht umgesetzt.
Boden und Wände sind die architektonische Hülle; Arbeitsobjekte sind getrennte
Grafikelemente. Positionen, Raumgröße, Anbau und Maschinenbesitz werden gespeichert.
Die Illustration kann später durch detailliertere Einzelgrafiken ersetzt werden.

- `src/workshop-state.js`: Spielregeln, Auftragszustände, Validierung, Fortschritt.
- `src/workshop-ui.js`: Objektfunktionen und Werkstattoberfläche.
- `src/scene.js`: getrennte Grafikmodule der Raumhülle und Gegenstände.
- `scripts/build-scene.py`: reproduzierbarer Generator der SVG-Grafikmodule.
- `workshop.css`: Werkstattlayout, Smartphone-Bedienung und Animationen.
- `src/storage.js`: kompatible Spielstandmigration.

Die Funktionstests laufen mit Node.js:

```bash
node --test tests/*.test.js
```

19 automatisierte Tests bestanden. Die gerenderte SVG-Illustration wurde visuell
geprüft; die Menüaktionen wurden im Ereignis-Testadapter geprüft. Ein vollständiger
Test des Layouts und der Audiowiedergabe in einem echten Browser steht noch aus.
