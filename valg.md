# Valg i løsningen

Dette dokumentet oppsummerer de viktigste valgene som er tatt i løsningen, og svarer på punkt 4 i oppgaveteksten.

## 1) Backend (FastAPI + PostgreSQL)

- **Rammeverk:** FastAPI er valgt for enkel, tydelig og rask API-utvikling med automatisk validering via Pydantic.
- **Databaselag:** SQLAlchemy ORM + Alembic migrasjoner for kontrollert schema-utvikling og sporbarhet.
- **Domene- og datamodell:**
  - `customers`
  - `projects`
  - `expenses`
  - `project_customers` (koblingstabell for kostnadsfordeling per kunde/prosjekt)
- **Dataintegritet i databasen:**
  - Foreign keys mellom tabeller
  - `CHECK`-constraint på `cost_percentage` (0–100)
  - Cascade-delete på relasjoner for å unngå foreldreløse rader
- **Forretningsvalidering i applikasjon:**
  - CRUD-laget validerer at sum av andeler per prosjekt ikke overstiger 100 %
  - Egen validerings-API for å hente total andel og status (`is_valid`)
- **Samtidighet (concurrency):**
  - Advisory lock (`pg_advisory_xact_lock`) på `project_id` ved endring av andeler for å unngå race conditions.
- **Dataimport:** CSV-baserte expenses via seed/import gir enkel demo og reproducerbar oppstart.

## 2) Frontend (Next.js + Tailwind + shadcn)

- **Rammeverk:** Next.js (App Router) med fokus på enkel, modulær struktur.
- **Designsystem/UI:** Tailwind + shadcn-komponenter for konsistent UI og rask utvikling.
- **Arkitektur i frontend:**
  - Sidebasert struktur i `app/`
  - Dashboard-domener i `components/dashboard/*`
  - API-kall kapslet i `lib/api-client.ts`
- **Deploy-vennlig oppsett:** `output: "standalone"` i Next.js for enklere pakking og kjøring i App Service.
- **Pragmatisk prioritering:** Fokus på tydelige oversikter (kunder, prosjekter, kostnadsdeling, rapporter) fremfor kompleks frontend-logikk.

## 3) CI/CD

- **Commit-kvalitet:** `commitlint` i GitHub Actions for Conventional Commits.
- **Release-prosess:** `release-please` for automatisk versjonering, tags og release-notes.
- **Deploy-strøm:** Deploy trigges på publisert GitHub Release (eller manuelt), som gir ryddig release-gating.
- **Azure deploy:**
  - OIDC-basert innlogging (unngår statiske deploy secrets)
  - Separate jobs for backend og frontend
  - App-innstillinger settes i pipeline
  - ZIP-deploy med validering av app-navn og runtime-filer

## 4) Arkitektur / Infrastruktur

- **Monorepo:** Felles repo for frontend + backend + infrafiler for enklere vedlikehold.
- **Lokalt miljø:** Docker Compose med tre hovedtjenester:
  - PostgreSQL
  - FastAPI backend
  - Next.js frontend
- **Migrasjoner som egen tjeneste:** `migrate`-service for eksplisitt schema-oppgradering.
- **Nettverk/isolasjon:** Egne compose-nettverk og tydelige service-avhengigheter (`depends_on` + healthcheck).
- **Cloud-mål:** Enkelt og kostnadseffektivt Azure-oppsett som viser produksjonsnær CI/CD uten unødig kompleksitet.

---

## Svar på oppgavetekst punkt 4: Delvis kostnadsdekning

### Hva som er implementert

For delvis kostnadsdekning er følgende allerede implementert i løsningen:

1. **Databasenivå**
  - `CHECK (cost_percentage >= 0 AND cost_percentage <= 100)` sikrer gyldig prosentverdi per rad.

2. **Applikasjonsnivå i backend**
  - Ved `create/update/delete` av kundetilknytning på prosjekt brukes transaksjonell lås (`pg_advisory_xact_lock(project_id)`) for å redusere race conditions.
  - Ved oppretting og oppdatering valideres totalsum for prosjektet før lagring.
  - Request avvises med feilrespons dersom ny total ville blitt > 100 %.

3. **Valideringsstøtte i API**
  - Eget valideringsendepunkt gir `total_percentage` og `is_valid` per prosjekt.

4. **Korrekt kostnadsfordeling i oversikter**
  - Kostnad beregnes i backend fra samme datagrunnlag:
    - `kunde_kostnad = prosjekt_total * (andel / 100)`
  - Frontend henter ferdig beregnede data fra backend, slik at visningen blir konsistent.

### Hva som anbefales videre

For å sikre videre kvalitet og unngå regresjon anbefales følgende testoppsett:

1. **Enhetstester (CRUD/regler)**
  - Opprett andel når sum <= 100 (skal lykkes)
  - Opprett andel når sum > 100 (skal feile)
  - Oppdater andel som passerer 100 (skal feile)
  - Oppdater andel innenfor grense (skal lykkes)
  - Fjern andel og verifiser ny totalsum

2. **Integrasjonstester (API + DB)**
  - Kjør mot testdatabase med migrasjoner
  - Verifiser HTTP-statuskoder og responsfelter
  - Verifiser at oversikter/rapporter returnerer riktig kostnadsfordeling

3. **Regresjonstester for eksisterende funksjonalitet**
  - CRUD for kunder/prosjekter/expenses fungerer fortsatt som før
  - Seed/import av CSV fungerer fortsatt
  - Endepunkter utenfor kostnadsdeling er upåvirket

4. **CI-kjøring**
  - `lint` + testjobb på pull requests
  - Enkel smoke-test av sentrale API-ruter
  - Deploy kun etter grønn pipeline/release

Denne kombinasjonen av implementerte kontroller og anbefalt teststrategi gir robust dataintegritet og lav regressjonsrisiko.