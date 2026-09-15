# Update 005 – Selbst an die Drehbank

Dieses Update ersetzt den automatischen Timerdurchgang durch eine bedienbare
Drehbank. Es baut auf Update 004 auf. Die anderen Arbeitsbereiche bleiben im
bisherigen Prototypumfang; Entgraten, Messprüfung und Probebohrung sind noch
vereinfachte Aktionen.

## Installation

`turningpoint-update-005.zip` in den Download-Ordner speichern. In Termux:

```bash
bash ~/update-turningpoint.sh ~/storage/downloads/turningpoint-update-005.zip
```

Das vorhandene Skript entpackt die geänderten Dateien nach `~/turningpoint`,
committet sie und pusht sie in dein Repo. Nach der Veröffentlichung durch GitHub
Pages die Spielseite neu laden. Im Startmenü steht jetzt **UPDATE 005**.
Ein neues Spiel ist nicht erforderlich.

## Bedienung

1. Auftrag am Schreibtisch annehmen, Rohling am Materialständer wählen,
   Werkzeug am Werkzeugwagen bereitlegen und die Drehbank öffnen.
2. Der Rohling ist auf die Auftragslänge zugesägt und hat 4 mm Durchmesser-Aufmaß.
   Am **Querschlitten** den Ziel-Durchmesser eingeben. Kleinere Werte bedeuten
   mehr Abtrag; die radiale Zustellung ist die halbe Durchmesserdifferenz.
3. Bei stehender Spindel den **Längsschlitten** mit dem Schieberegler positionieren.
   Links ist Z = 0, rechts die Auftragslänge.
4. Drehzahl, Vorschub und Kühlung wählen und die Schnittwerte übernehmen.
5. Spindel einschalten. **Z+ oder Z− gedrückt halten**, um den Meißel entlang des
   Werkstücks zu führen. Finger, Maus und die Leertaste/Enter auf einer fokussierten
   Vorschubtaste sind vorgesehen. Loslassen beendet den Vorschub.
6. Für einen weiteren Schnitt Spindel stoppen, Zustellung ändern und Schlitten
   zurücksetzen. Das vorhandene Profil bleibt erhalten.
7. Erst wenn du fertig bist: Spindel stoppen, Werkstück ausspannen, am Schraubstock
   entgraten, am Messschieber prüfen und am Schreibtisch abgeben.

Für den ersten Alu-Bolzen kannst du dich mit drei Schnitten vertraut machen:
Ziel-Ø 22,00 → 20,40 → 20,02 mm, jeweils über die ganze Länge. 450 U/min,
0,10 mm/U und eingeschaltete Kühlung sind ein möglicher Einstieg im Spiel.
Das ist keine automatische Erfolgseinstellung: Position, tatsächlich abgefahrene
Länge, Werkzeugzustand und schon entfernte Bereiche bleiben entscheidend.

Auf dem Smartphone nimmt die Drehbank den Arbeitsbereich ein. Das × führt zurück
zur Werkstatt. Die Anzeigen zeigen das bearbeitete Profil und die Werkzeugposition;
unter „Werkstück & Schnitt beobachten“ findest du weitere Messwerte.

## Entscheidungen und Folgen

| Entscheidung | Folge im Spiel |
| --- | --- |
| Material | Verbraucht den gewählten Rohling; beeinflusst Schnittlast, Wärme und Werkzeugverschleiß. Falsches Material besteht die Auftragsprüfung nicht. |
| Ziel-Durchmesser | Bestimmt den örtlichen Abtrag. Untermaß ist dauerhaft und erfordert einen neuen Rohling. |
| Position und Vorschubrichtung | Nur überfahrene Abschnitte werden gedreht. Stehengebliebene Bereiche behalten ihr Aufmaß. |
| Vorschub pro Umdrehung | Mehr Vorschub bewegt schneller, erhöht die Belastung und hinterlässt eine rauere Oberfläche. |
| Drehzahl | Bestimmt mit Durchmesser und Werkstoff die Schnittgeschwindigkeit; beeinflusst Vorschubgeschwindigkeit, Wärme, Oberfläche und Verschleiß. |
| HSS / Hartmetall | Unterschiedliche geeignete Geschwindigkeiten, Oberflächen und Verschleißraten. Wechsel auf Hartmetall kostet 12 €. |
| Werkzeugzustand | Stumpfe Schneiden belasten stärker und verschlechtern Maß und Oberfläche; Instandsetzung kostet 5 €. |
| Kühlung | Senkt die Wärme, verbraucht aber Flüssigkeit, solange die Spindel läuft. Ein leerer Tank kühlt nicht; Auffüllen kostet 6 €. |
| Großer Schnitt | Kann Überlast auslösen. Die Spindel stoppt, das Werkzeug verschleißt zusätzlich; bis dahin erfolgter Abtrag bleibt erhalten. |
| Zu hohe Wärme / Verschleiß | Schutzstopp; erst abkühlen beziehungsweise Werkzeug instand setzen. |
| Ausspannen | Beendet die Bearbeitung zu deinem gewählten Zeitpunkt, unabhängig vom erreichten Maß. |
| Nacharbeit | Verwendet dasselbe Profil und keinen weiteren Rohling. Zu klein gewordene Abschnitte lassen sich nicht reparieren. |
| Ausschuss | Nach bewusster Auswahl wird das Werkstück verworfen. Das Material bleibt verbraucht, der Auftrag bleibt offen. |

Die Abnahme prüft alle 24 Profilabschnitte: Durchmesser ± 0,10 mm,
Oberfläche Ra höchstens 3,20 µm und den geforderten Werkstoff. Erst ein entgratetes,
geprüftes Teil kann abgegeben werden. Es gibt keine Bezahlung durch bloßes Warten.
Späne entstehen beim Ausspannen nur, wenn tatsächlich Material abgetragen wurde.

Die Werkstücklänge ist in diesem Update vorgegeben. Freies Ablängen, Einspannen,
interaktives Entgraten und manuell angelegte Messmittel sind noch nicht simuliert.
Schnittwerte, Rauheit, Temperaturen und beschleunigter Vorschub sind vereinfachtes
Spielbalancing; sie sind keine Anleitung für reale Maschinen.

## Speichern und ältere Spielstände

- Profil, Schnittwerte, Werkzeugposition, Wärme, Kühlmittel und Verschleiß werden
  gespeichert. Manuelle Speicherplätze sowie JSON-Export und -Import bleiben erhalten.
- Loslassen, abgebrochene Berührung und Fokusverlust beenden den Vorschub. Menü,
  Stationswechsel, versteckter Tab und Laden stoppen außerdem die Spindel.
- Bearbeitung läuft nicht im Hintergrund weiter. Wärme sinkt bei geöffneter
  Werkstatt auch mit gestoppter Spindel.
- Update-004-Spielstände behalten Kasse, Lager, Ausbau und abgeschlossene Aufträge.
  Ein alter laufender Timerdurchgang hat noch kein Profil und wird deshalb als
  bereits bezahlter, ungedrehter Rohling mit stehender Spindel übernommen. Dafür
  wird kein weiterer Rohling abgezogen.
- Alte bereits gefertigte Teile erhalten ein gleichmäßiges Profil mit ihrem
  gespeicherten Durchmesser. Abgeschlossene Aufträge bleiben abgeschlossen.
- Das äußere Sicherungsformat bleibt Version 2; die internen Werkstattdaten
  steigen von Version 1 auf 2. Ältere App-Versionen können diesen neuen Stand
  nicht laden. Die Browser-Speicherschlüssel bleiben gleich.

## Prüfung und technische Dateien

32 automatisierte Tests bestehen: manuelle Fertigung aller drei Aufträge,
örtlicher Abtrag, Richtungen, Loslassen, Menü- und Fokuswechsel, erneutes Laden,
Materialfehler, Untermaß, Nacharbeit, Oberflächenprüfung, Überlast, Kosten,
Kühlung, Speichermigration und bestehende Menüs. Die Maschinen-SVG wurde gerendert
und visuell geprüft. Der ZIP-Import samt Commit und Push wurde gegen ein lokales
Test-Repository geprüft. Ein vollständiger Test im echten Smartphone-Browser
steht noch aus; die Ereignistests verwenden einen DOM-Testadapter.

- `src/machining.js`: Profil, Schnittmodell und Qualitätsprüfung.
- `src/lathe-ui.js`: Maschinenansicht, Handräder, Anzeigen und Vorschubsteuerung.
- `src/workshop-state.js`: Spielaktionen und Migration.
- `src/app.js`: gehaltene Bedienung, Stoppen, Fortschritt und Speichern.
- `workshop.css`: Maschinenarbeitsplatz und mobile Ansicht.

```bash
node --test tests/*.test.js
```
