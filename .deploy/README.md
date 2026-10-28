# Deployment: Server holt sich Änderungen selbst

Der Webserver (`78.47.183.65`) prüft jede Minute per Cronjob, ob auf GitHub
neue Commits in `main` liegen, und spult dann per `git merge --ff-only` vor.
GitHub braucht dafür keinen SSH-Zugang zum Server.

Das Repo ist öffentlich, der Server holt also ohne Zugangsdaten über HTTPS.
`.deploy/` ist wie alle Punkt-Ordner von nginx gesperrt (403).

## Einmalige Einrichtung auf dem Server

Alle Befehle als **Site-User `scholar`** ausführen, nicht als root – sonst
gehören neue Dateien root und nginx/PHP kann sie nicht mehr lesen.

```bash
sudo -iu scholar
cd /home/scholar/htdocs/scholar.schule
```

1. **Zustand prüfen.** Es dürfen keine lokalen Änderungen vorhanden sein:

   ```bash
   git status --short
   git remote -v
   ```

   Ist `git status` nicht leer, die Änderungen erst sichern oder mit
   `git stash` beiseitelegen.

2. **Remote auf HTTPS stellen** (kein SSH-Key nötig, Repo ist öffentlich):

   ```bash
   git remote set-url origin https://github.com/DaveoneWRS/Scholar.Schule_Webseite.git
   ```

3. **Einmal von Hand aktualisieren**, damit das Skript überhaupt da ist:

   ```bash
   git pull --ff-only origin main
   chmod +x .deploy/auto-pull.sh
   ```

4. **Skript testen.** Ohne neue Commits gibt es keine Ausgabe und Exit-Code 0:

   ```bash
   .deploy/auto-pull.sh; echo "Exit-Code: $?"
   ```

5. **Cronjob anlegen** mit `crontab -e` und diese Zeile einfügen:

   ```cron
   * * * * * /home/scholar/htdocs/scholar.schule/.deploy/auto-pull.sh >> /home/scholar/auto-pull.log 2>&1
   ```

   In CloudPanel geht das alternativ unter *Sites → scholar.schule → Cron Jobs*
   mit demselben Befehl und dem Intervall „jede Minute“.

## Im Betrieb

- Nach einem Push auf `main` ist die Änderung spätestens nach etwa einer Minute live.
- Log ansehen: `tail -n 20 /home/scholar/auto-pull.log`
  Dort steht nur etwas, wenn aktualisiert wurde oder ein Fehler auftrat.
- Hängt das Deployment, steht im Log meist
  `Not possible to fast-forward` – dann wurde auf dem Server direkt etwas
  geändert. Mit `git status` nachsehen und die Änderung entfernen oder ins Repo
  übernehmen.
- Cloudflare cacht CSS/JS. Bei geänderten Styles ggf. im Cloudflare-Dashboard
  *Caching → Purge Cache* ausführen.
