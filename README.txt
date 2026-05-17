NEUDARMSTADT CMS - STARTANLEITUNG

1. ZIP-Datei entpacken.
2. Im entpackten Ordner start-windows.bat doppelklicken.
3. Das schwarze Fenster offen lassen.
4. Im Browser öffnen:
   http://localhost:3000

Backend:
   http://localhost:3000/admin.html

Login:
   Benutzername: admin
   Passwort: neudarmstadt

Wichtig:
- Nicht index.html direkt öffnen.
- Der Server muss laufen.
- Daten werden dauerhaft in data/data.json gespeichert.
- Bilder können in den Ordner assets gelegt werden.


ONLINE/OFFLINE STATUS:
- UUIDs sind eingetragen.
- Unter den Verantwortlichen erscheint jetzt gruen Online oder rot Offline.
- Im Backend kann der Status manuell geaendert werden.
- Fuer automatische Second-Life-Abfrage liegt second-life-online-status-script.lsl bei.
- Automatisch geht erst, wenn die Webseite oeffentlich erreichbar ist. localhost kann Second Life nicht erreichen.


NACHRICHTEN:
- Unter jedem Verantwortlichen gibt es jetzt den Button "Nachricht senden".
- Besucher koennen Name/Kontakt und Nachricht eintragen.
- Die Nachrichten werden in data/data.json gespeichert.
- Im Backend gibt es die neue Rubrik "Nachrichten".
- Dort koennen Nachrichten gelesen und geloescht werden.


PASSWORT AENDERN:
- Im Backend gibt es jetzt die Rubrik "Passwort aendern".
- Dort kann der Benutzername und das Passwort geaendert werden.
- Das Passwort wird in data/data.json gespeichert.
- Standard beim ersten Start:
  Benutzername: admin
  Passwort: neudarmstadt


RECHTLICHE SEITEN:
- Impressum, Datenschutz und Kontakt wurden hinzugefügt.
- Footer und Cookie-/Session-Hinweis wurden ergänzt.
- Die rechtlichen Angaben können im Backend unter "Rechtliches" bearbeitet werden.
- Bitte unbedingt vollständigen Namen, ladungsfähige Anschrift und E-Mail eintragen.
- Dies ist keine Rechtsberatung, sondern eine technische Umsetzung mit Mustertexten.
