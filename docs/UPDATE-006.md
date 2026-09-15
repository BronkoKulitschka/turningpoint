# Update 006 – Messen, zustellen, genauer fertigen

## Installation

Dieses Update setzt Update 005 voraus. Die ZIP in den Download-Ordner speichern
und das vorhandene Termux-Skript ausführen:

```bash
bash ~/update-turningpoint.sh ~/storage/downloads/turningpoint-update-006.zip
```

Nach der GitHub-Pages-Veröffentlichung die Spielseite neu laden. Im Hauptmenü
steht **UPDATE 006**. Die lokale Repo-Kopie bleibt in `~/turningpoint`.

## Drehbank und direkte Bedienung

Die Drehbank öffnet einen eigenen Arbeitsplatz. Die Maschinenansicht bleibt mit
Vorschub, Spindelschalter, Schnitttiefe und Messschieber zusammen sichtbar. Nur
die Zusatzfunktionen darunter scrollen. Der Meißel bewegt sich entsprechend der
Längsposition und Zustellung; bei aktivem Schnitt erscheinen Späne.

- **Z− / Z+ halten:** Den Meißel nach links oder rechts führen. Loslassen stoppt
  den Vorschub. Finger, Maus und Leertaste/Enter auf einer Vorschubtaste sind möglich.
- **Schnitttiefe:** Radiale Zustellung in Millimetern eingeben oder mit den vier
  Tasten um 0,01 beziehungsweise 0,10 mm ändern. Sie lässt sich auch während
  des Vorschubs verändern. Mit zwei Fingern kann einer den Vorschub halten,
  während der andere die Tiefe ändert.
- **Antasten:** Bei stehender Spindel wird die Oberfläche an der aktuellen
  Meißelposition als Bezug übernommen; die Zustellung wird auf null gesetzt.
  Das Antasten selbst trägt nichts ab und liefert keinen Durchmesserwert.
- **Schlitten positionieren:** Bei stehender Spindel über den Regler unter den
  direkten Bedienelementen frei verschieben.

0,10 mm radiale Zustellung entspricht ungefähr 0,20 mm Durchmesser-Abtrag.
Die Zustellung bleibt auf die zuletzt angetastete Stelle bezogen. Sie ist kein
absoluter Ziel-Durchmesser. Für einen neuen Schnitt neu antasten oder die bisherige
Zustellung bewusst erhöhen. Auf einem bereits ungleichmäßig bearbeiteten Teil
ist die tatsächliche Schnitttiefe je nach Stelle unterschiedlich.

Der Abtrag erfolgt beim Führen des Meißels über das Werkstück. Reines Antasten,
Positionieren bei stehender Spindel oder eine Zustellung von null erzeugen kein
fertiges Teil. Zurückstellen des Meißels ersetzt kein abgetragenes Material.

## Messen ohne Ausspannen

1. Spindel stoppen; das Teil bleibt eingespannt.
2. Mit **Messstelle Z** die Stelle entlang des Werkstücks wählen. Eine Markierung
   in der Ansicht zeigt die ausgewählte Stelle.
3. **Messschieber anlegen** drücken. Der Messschieber erscheint am Werkstück;
   angezeigt wird der auf 0,01 mm gerundete Durchmesser an dieser Stelle.
4. Weitere Stellen messen, Zustellung anpassen und weiterarbeiten.

Ein Messwert entsteht nur durch Anlegen des Messschiebers. Verschieben der
Messstelle erzeugt keinen neuen Wert. Nach weiterem Materialabtrag wird die letzte
Messung als älterer Bearbeitungsstand gekennzeichnet; sie aktualisiert sich nicht
von selbst. Messungen bleiben beim Speichern erhalten.

Es gibt an der Drehbank keine Sollkontur, keinen eingeblendeten Ziel-Durchmesser
und keine automatische Anzeige des aktuellen Durchmessers oder der Profilgrenzen.
Die Sollmaße stehen auf der Auftragszeichnung am Schreibtisch. Die Länge der
Rohlinge ist in diesem Prototyp bereits zugesägt.

Die Messung an der Maschine ersetzt nicht die abschließende Abnahme. Nach dem
Ausspannen und Entgraten prüft diese das gesamte Profil, die Oberfläche und den
Werkstoff. Eine einzelne gute Messstelle reicht nicht für die Freigabe.

## Genauigkeit bestimmt die Bezahlung

Jeder Auftrag hat einen Grundlohn. Besteht das Werkstück die Abnahme, kommt ein
Genauigkeitsbonus von bis zu **50 % des Grundlohns** dazu. Ausschlaggebend ist die
**größte absolute Durchmesserabweichung über alle Profilabschnitte**.

- An der Toleranzgrenze von ± 0,10 mm: Grundlohn, kein Bonus.
- Je näher alle Abschnitte am Sollmaß liegen, desto höher der Bonus.
- Exaktes Sollmaß an allen Abschnitten: maximaler Bonus.
- Falscher Werkstoff, zu raue Oberfläche oder Maße außerhalb der Toleranz:
  keine Freigabe und keine Auftragszahlung.

Beispiel für einen Grundlohn von 90 € bei bestandener Abnahme:

| Größte Maßabweichung | Auszahlung |
| --- | --- |
| 0,10 mm | 90 € |
| 0,05 mm | 113 € |
| 0,00 mm | 135 € |

Der Bonus steigt linear zwischen Toleranzgrenze und Sollmaß und wird auf ganze
Euro gerundet. Die Abgabe zeigt die gesamte Vergütung; nach Abschluss bleibt die
tatsächliche Auszahlung gespeichert. Wiederholte Abgabe zahlt nicht erneut.

Auch ein bereits bestandenes Teil lässt sich an der Drehbank wieder einspannen,
um den Bonus zu verbessern. Der vorhandene Rohling bleibt erhalten. Weitere
Bearbeitung kann das Teil auch verschlechtern; Untermaß lässt sich nicht beheben.

## Bestehende Spielstände

Update-005-Spielstände behalten Profil, Werkzeugposition, Schnittwerte, Material,
Kasse und Ausbau. Die bisherige Werkzeugposition wird in eine relative Zustellung
überführt, ohne Material zu ändern. Neue Messwerte werden nicht erfunden.

Schon abgeschlossene Aufträge erhalten rückwirkend keinen Bonus. Ihre bisherigen
Auszahlungen und die Kasse bleiben unverändert. Neue Aufträge speichern ihre
Auszahlung einschließlich Bonus. Auch ältere Spielstände bleiben migrierbar.
Die internen Werkstattdaten verwenden jetzt Version 3; das äußere Speicherformat
und die Speicherplätze bleiben unverändert.

Menüwechsel, Verlassen der Drehbank, Tabwechsel, Fokusverlust und Laden halten
die Maschine weiterhin an. Der Materialabtrag läuft nicht im Hintergrund weiter.

## Prüfung und Grenzen

44 automatisierte Tests prüfen unter anderem relative und laufende Zustellung,
örtliche Messungen, veraltete Messwerte, zwei gleichzeitige Berührungen im
Ereignisadapter, ausgeblendete Maßhilfen, Bonusberechnung, einmalige Auszahlung,
Nacharbeit, alte Spielstände und die bestehenden Spielabläufe. Die Maschinen-SVG
mit angelegtem Messschieber wurde gerendert und visuell geprüft.

Der ZIP-Import samt Commit und Push wurde gegen ein lokales Test-Repository
geprüft. Ein vollständiger Layout- und Berührungstest im echten Smartphone-Browser
steht noch aus; die Ereignistests verwenden einen DOM-Testadapter.

Die Schnittsimulation bleibt vereinfacht. Freies Ablängen und manuelles Anlegen
beider Messbacken sind noch nicht umgesetzt; der Spieler wählt die Messstelle
und löst die Messung aus. Schnittwerte und Anzeigen sind Spielwerte.

```bash
node --test tests/*.test.js
```
