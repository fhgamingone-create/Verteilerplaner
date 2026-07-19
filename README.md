# Schaltschrank-Planer

Ein einfacher, vollständig clientseitiger Planer für Unterverteilungen und Schaltschränke.  
Er funktioniert ohne Server und kann direkt über **GitHub Pages** veröffentlicht werden.

## Funktionen

- Verteiler-Vorlagen wie 5 Reihen × 12 TE
- Benutzerdefinierte Anzahl Reihen und TE je Reihe
- Geräte in 0,5-TE-Schritten
- Vorlagen für FI/RCD, Automat C16 L+N, Hauptschalter und weitere Geräte
- Verteileransicht mit Hutschienen-Raster
- Drag-and-drop von Geräten zwischen Reihen
- Angaben zu Stromkreis, Funktion, angeschlossenem Verbraucher und Notizen
- Automatische Berechnung von belegten und freien TE
- Warnung bei überbelegten Reihen
- Speicherung im Browser
- JSON-Import und -Export
- Druckansicht / PDF über den Browser

## Lokal starten

Die Datei `index.html` kann direkt im Browser geöffnet werden.

Alternativ mit einem kleinen lokalen Webserver:

```bash
python -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

## Auf GitHub Pages veröffentlichen

1. Neues GitHub-Repository erstellen.
2. `index.html`, `styles.css` und `app.js` in das Repository hochladen.
3. In GitHub zu **Settings → Pages** wechseln.
4. Unter **Build and deployment** die Option **Deploy from a branch** wählen.
5. Branch `main` und Ordner `/root` auswählen.
6. Speichern. GitHub zeigt anschließend die öffentliche URL an.

## Wichtiger Hinweis

Der Planer ist eine Planungshilfe und ersetzt keine fachgerechte elektrische Planung, Dimensionierung, Dokumentation oder Prüfung.  
Gerätebreiten und technische Daten unterscheiden sich je nach Hersteller und Typ. Vor der Umsetzung immer die konkreten Datenblätter und geltenden Vorschriften prüfen.
