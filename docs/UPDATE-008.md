# Update 008 – Die eigene GLB-Drehbank

Voraussetzung: installierter Prototyp bis einschließlich Update 007.

Die Datei `TurningPoint_Leitspindeldrehbank.glb` wird unverändert als
Maschinenmodell geladen. Futter, Längs- und Querschlitten sowie Handräder
folgen der vorhandenen Spielsimulation. Der Beispielrohling und Beispielmeißel
des Modells werden durch dynamische Geometrie ersetzt. Durchmesserprofil,
teilweise geplante Stirnflächen und Meißelwahl werden sichtbar.

An der Drehbank stehen Nahansicht, ganze Maschine und Schnittansicht zur Wahl.
Die 3D-Ansicht lässt sich durch Ziehen drehen und durch die übliche Zoomgeste
vergrößern. Die Bedienelemente bleiben unmittelbar darunter. Eine aktuelle
Durchmessermessung zeigt einen Messschieber, solange die Spindel steht.
Die Längenmessung bleibt über die bisherige Messtaste erreichbar.
Die bisherigen Spielstände und die Berechnung der Bezahlung bleiben erhalten.

## Installation

ZIP in den Download-Ordner laden, dann in Termux:

```bash
bash ~/update-turningpoint.sh ~/storage/downloads/turningpoint-update-008.zip
```

Nach Bereitstellung auf GitHub Pages die Spielseite neu laden. Im Startmenü
steht **UPDATE 008**. Die Dateien gehören direkt in das bestehende Repo;
es gibt keinen zusätzlichen umschließenden Ordner im ZIP.

## Technik und Grenzen des Prototyps

- Three.js mit GLTFLoader und OrbitControls liegt einschließlich MIT-Lizenz
  unter `vendor/three`. Kein CDN, kein Build-Schritt und keine neuen Pakete
  auf dem Telefon erforderlich. Die Importpfade der Addons wurden relativiert.
- Aufruf über HTTP(S), beispielsweise GitHub Pages; GLB-Laden über `file://`
  ist nicht unterstützt. Die 3D-Ansicht benötigt WebGL 2. Bei Ladefehlern oder
  verlorenem Grafikkontext bleibt die bedienbare Schnittansicht verfügbar.
- Die Werkstattübersicht bleibt vorerst die bestehende isometrische Szene.
  Das GLB wird beim Öffnen der Drehbank geladen.
- Werkstückabmessungen werden zur Sichtbarkeit einheitlich dreifach gegenüber
  dem Maschinenmaßstab dargestellt. Messwerte, Toleranzen und Materialabtrag
  stammen unverändert aus der Simulation. Die Futterdrehung ist zur Lesbarkeit
  verlangsamt; diese Darstellung beeinflusst keine Schnittwerte.
- Rauheit wird vereinfacht durch Schattierung angedeutet. Keine physikalische
  Kollisionssimulation, keine echte Spanbildung oder Kühlschmierstoffsimulation.

## Prüfung

62 automatisierte Tests: bisherige Spielabläufe und Speicherstände sowie
Import der echten GLB, Bewegung der Achsen, Pause, Meißelwechsel, Messschieber
und Werkstückgeometrie einschließlich teilweise geplanter Stirnflächen.
Die Kamerapositionen wurden zusätzlich mit einer CPU-Projektion der echten
Modellgeometrie geprüft. Das ist kein WebGL-Browsertest.
Ein vollständiger Browser- und Leistungstest auf dem Zieltelefon steht aus.
