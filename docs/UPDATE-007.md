# Update 007 – Länge fertigen und Meißel bewusst wählen

## Installation

Update 006 muss installiert sein. Die neue ZIP in den Download-Ordner speichern:

```bash
bash ~/update-turningpoint.sh ~/storage/downloads/turningpoint-update-007.zip
```

Nach der Veröffentlichung durch GitHub Pages die Spielseite neu laden. Das
Hauptmenü zeigt UPDATE 007. Das vorhandene Skript aktualisiert weiterhin die
Repo-Kopie in `~/turningpoint` und pusht die Änderungen.

## Neue Rohlinge haben Längenaufmaß

Neu gewählte Rohlinge beginnen mit 6 mm zusätzlicher Länge und weiterhin
4 mm Durchmesser-Aufmaß. Es gibt keine automatische Fertigstellung auf Sollmaß.
Die Auftragszeichnung am Schreibtisch nennt Durchmesser, Länge und Toleranzen.
An der Drehbank bleiben Zielkontur und automatische Maßanzeigen ausgeblendet.

Die direkte Bedienung unter der Maschinenansicht hat jetzt zwei Arbeitsgänge:

| Arbeitsgang | Zustellung | Gehaltener Vorschub | Ergebnis |
| --- | --- | --- | --- |
| Längsdrehen | radial; 0,10 mm entspricht ungefähr 0,20 mm Durchmesserabtrag | Z− / Z+ entlang des Werkstücks | Durchmesser und Manteloberfläche |
| Plandrehen | axial; 0,10 mm entspricht ungefähr 0,10 mm Längenabtrag | X− nach innen / X+ nach außen | Länge und Stirnfläche |

Arbeitsgang und Meißel lassen sich bei stehender Spindel wechseln. Das Werkstück
bleibt eingespannt. Die vorhandenen Zustellungen werden beibehalten; nach einem
Wechsel deshalb den Bezug und die Tiefe prüfen.

## Werkstück auf Länge bringen

1. Bei stehender Spindel **Länge messen**. Die angezeigte Messung wird gespeichert.
2. **Plandrehen** wählen und einen geeigneten Meißel einsetzen, beispielsweise den
   Planmeißel. Die Auswahl steht unter den direkten Bedienelementen.
3. Den radialen Schlitten außen positionieren und **Hier antasten** drücken.
   Damit wird die Stirnfläche als Bezug übernommen und die axiale Zustellung genullt.
4. Eine axiale Schnitttiefe einstellen. Maximal sind im Prototyp 1,50 mm je
   Zustellung möglich; Material, Werkzeug und Vorschub können kleinere Schnitte
   nötig machen.
5. Spindel einschalten und **X− halten**, bis der Meißel über die Stirnfläche
   zur Mitte geführt wurde. Nur überfahrene Radialabschnitte werden gekürzt.
6. Spindel stoppen und die Länge erneut messen. Für einen weiteren Schnitt den
   Schlitten wieder nach außen positionieren, antasten und erneut zustellen.
7. Mit weiteren Schnitten an die Zeichnungslänge annähern. Danach gegebenenfalls
   längsdrehen und schlichten, entgraten und die abschließende Abnahme ausführen.

Loslassen stoppt den Werkzeugweg. Ein nur teilweise ausgeführter Planschnitt
kann eine Stufe stehenlassen; die Länge ist dann nicht über die ganze Stirnfläche
fertig. Zu kurz gedrehte Bereiche bleiben zu kurz und können zum Ausschuss führen.
Zurückstellen eines Reglers fügt kein Material hinzu.

**Ø messen** und **Länge messen** sind getrennte Aktionen. Beide funktionieren
bei stehender Spindel am eingespannten Teil. Die Längenmessung zeigt die größte
vorhandene Länge. Sie allein bestätigt keine ebene Stirnfläche. Frühere Messungen
aktualisieren sich beim Weiterarbeiten nicht automatisch und werden als älterer
Bearbeitungsstand gekennzeichnet.

## Drei Meißelformen

Alle drei Formen liegen im Prototyp bereit. Sie lassen sich an der Drehbank oder
am Werkzeugschrank auswählen. Der Meißel in der Nahansicht ändert seine Form.

| Meißel | Stärke | Folge einer ungeeigneten Verwendung |
| --- | --- | --- |
| Schruppmeißel | Robuste Schneide für größeren Abtrag | Raue Oberfläche und sichtbare Riefen; für die aktuelle Abnahme ist anschließend ein Schlichtschnitt erforderlich |
| Schlichtmeißel | Glatte Mantelfläche bei kleinem Aufmaß | Hohe Belastung und schnellerer Verschleiß bei tiefen Schnitten; kann überlasten |
| Planmeißel | Stirnfläche kürzen und glätten | Beim Längsdrehen ungünstigere Manteloberfläche; ersetzt den Schlichtmeißel nicht für alle Aufgaben |

Die Form beeinflusst Oberflächenberechnung, Belastung und Verschleiß. Ein bloßer
Werkzeugwechsel verbessert die vorhandene Oberfläche nicht: Dafür muss mit der
neuen Schneide tatsächlich Material abgetragen werden. Riefen auf der Mantelfläche
sind in der Maschinenansicht als stärkere Linien dargestellt.

HSS und Hartmetall bleiben zusätzlich als **Schneidstoffe** wählbar. Sie wirken
weiterhin auf geeignete Schnittgeschwindigkeit und Verschleiß. Die Meißelform
wählt die Aufgabe; der Schneidstoff beeinflusst die Schnittbedingungen.

## Abnahme und Bezahlung

Die Prüfung beurteilt gemeinsam:

- Durchmesser an den erhaltenen Profilabschnitten: ± 0,10 mm zur Zeichnung.
- Länge über die bearbeitete Stirnfläche: ± 0,20 mm zur Zeichnung.
- Oberfläche an Mantel und Stirnfläche: Ra höchstens 3,20 µm im Spielmodell.
- Den geforderten Werkstoff und das erfolgte Entgraten.

Abgetrennte beziehungsweise nicht mehr vorhandene Abschnitte des ursprünglichen
Rohlings werden nicht als fertige Mantelfläche bewertet. Eine unvollständig
bearbeitete Stirnfläche kann die Freigabe verhindern. Ein maßhaltiger Durchmesser
allein reicht nicht mehr.

Der Bonus beträgt weiterhin bis zu 50 % des Grundlohns. Jetzt zählt die schlechtere
der beiden Genauigkeiten: größte Durchmesserabweichung relativ zu 0,10 mm oder
größte Längenabweichung relativ zu 0,20 mm. So lässt sich ein ungenaues Längenmaß
nicht durch einen perfekten Durchmesser ausgleichen. Die Oberflächen müssen für
jede Auszahlung die Abnahme bestehen.

## Bestehende Spielstände

Vorhandene Werkstücke aus Update 006 und älter behalten ihre bisherige Länge.
Sie werden beim Update nicht nachträglich verlängert. Kasse, Profil, Messungen,
Aufträge, Ausbau und frühere Auszahlungen bleiben erhalten. Nur neu ausgewählte
Rohlinge erhalten das neue Längenaufmaß.

Alte Spielstände hatten noch keine Meißelform; sie erhalten einen Schlichtmeißel.
Neue Werkstätten starten mit dem Schruppmeißel. Nach dem Update deshalb vor dem
Weiterarbeiten die gewählte Form und Zustellung prüfen. Neue Längenprofile,
Arbeitsgang, Zustellungen, Meißelwahl und Längenmessungen werden gespeichert.
Die internen Werkstattdaten verwenden Version 4; die Speicherplätze bleiben gleich.

## Prüfung und Prototypgrenzen

55 automatisierte Tests bestehen, darunter vollständige Fertigung aller drei
Aufträge, örtlicher Planschnitt, Stoppen beim Loslassen, Länge unabhängig vom
Durchmesser, zu kurze Teile, unterschiedliche Meißeloberflächen, Überlast,
Werkzeugwechsel, Längenbonus und Spielstandmigration. Die SVG-Ansicht eines
laufenden Planschnitts wurde gerendert und visuell geprüft.

Der ZIP-Import mit Commit und Push wurde gegen ein lokales Test-Repository
geprüft. Die tatsächliche Darstellung und Berührungseingabe im Smartphone-Browser
stehen noch als Praxistest aus; die Ereignistests verwenden einen DOM-Testadapter.

Die Geometrie wird vereinfacht in Längs- und Radialabschnitten berechnet.
Dieses Update setzt Längenbearbeitung durch Plandrehen um. Sägen, Abstechen,
Umspannen und frei konstruierte Meißelgeometrien sind noch nicht enthalten.
Schnittdaten, Oberflächenwerte und Temperaturen sind Spielbalancing.

```bash
node --test tests/*.test.js
```
