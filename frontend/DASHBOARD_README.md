# KommuneApp - Municipality Management Dashboard

Et moderne dark mode dashboard for norske kommuner til administrasjon av kunder, prosjekter og kostnadsdeling.

## Funksjoner

### 1. Oversikt Dashboard
- Statistikk over totale kunder, prosjekter og kostnader
- Rask tilgang til nylige kunder og prosjekter
- KPI-kort med viktige metrics

### 2. Kundeadministrasjon
- Opprett, rediger og slett kunder
- Se kundeinfo (navn, kontaktperson, telefon, e-post)
- Søk og filtrer kunder
- Tilknytting av kunder til prosjekter

### 3. Prosjektstyring
- Opprett og rediger prosjekter
- Vis prosjektstatus (aktiv, venter, fullført)
- Se total kostnad per prosjekt
- Detaljer om involvert kunder
- Moderne kort-basert layout

### 4. Kostnadsdeling
- Knytt kunder til prosjekter
- Administrer hver kundes kostnadsandel
- Visuell visning av kostnadsfordeling
- Rask kalkulator for kostnadsandeler (50%, 33%, 100%)
- Fjern kunder fra prosjekter

### 5. Rapporter & Analyse
- Kostnadsoversikt per prosjekt (søylediagram)
- Prosjekter etter status (sirkeldiagram)
- Detaljert tabell med alle prosjekter
- KPI-kort for hovedmetrikker
- Responsiv design for alle enheter

## Teknologi Stack

- **Frontend**: Next.js 16 med React 19
- **Styling**: Tailwind CSS + Dark Mode
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend API**: FastAPI (http://localhost:8000)

## Setup & Kjøring

### Krav
- Node.js 18+
- FastAPI backend kjørende på `http://localhost:8000`

### Installasjon
```bash
npm install
# eller
pnpm install
```

### Kjør Dev Server
```bash
npm run dev
# eller
pnpm dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Mappestruktur

```
components/
├── dashboard/
│   ├── layout.tsx                 # Hovedlayout med navigasjon
│   ├── overview.tsx               # Dashboard oversikt
│   ├── customers/
│   │   ├── view.tsx              # Kundeliste
│   │   ├── create-modal.tsx       # Opprett kunde
│   │   └── edit-modal.tsx         # Rediger kunde
│   ├── projects/
│   │   ├── view.tsx              # Prosjektliste
│   │   ├── create-modal.tsx       # Opprett prosjekt
│   │   ├── edit-modal.tsx         # Rediger prosjekt
│   │   └── detail-modal.tsx       # Prosjektdetaljer
│   ├── cost-sharing/
│   │   ├── view.tsx              # Kostnadsdeling oversikt
│   │   └── link-customer-modal.tsx # Knytt kunde til prosjekt
│   └── reports/
│       └── view.tsx              # Rapporter & analyse
app/
├── layout.tsx                     # Root layout
├── page.tsx                       # Startside
├── customers/
│   └── page.tsx
├── projects/
│   └── page.tsx
├── cost-sharing/
│   └── page.tsx
└── reports/
    └── page.tsx
```

## API-integrasjon

Dashboardet integrerer med FastAPI backend:

- `GET /customers` - Hent alle kunder
- `POST /customers` - Opprett ny kunde
- `PUT /customers/{id}` - Rediger kunde
- `DELETE /customers/{id}` - Slett kunde
- `GET /projects` - Hent alle prosjekter
- `POST /projects` - Opprett nytt prosjekt
- `PUT /projects/{id}` - Rediger prosjekt
- `DELETE /projects/{id}` - Slett prosjekt
- `GET /projects/{id}/customers` - Hent kunder for prosjekt
- `POST /projects/{id}/customers/{customer_id}` - Knytt kunde til prosjekt
- `DELETE /projects/{id}/customers/{customer_id}` - Fjern kunde fra prosjekt

## Design System

### Farger (Dark Mode)
- **Background**: #0f1419 (very dark blue)
- **Card**: #151b24 (dark blue)
- **Primary**: #3b82f6 (bright blue)
- **Accent**: #06b6d4 (cyan)
- **Foreground**: #e4e7eb (light gray)
- **Muted**: #1e293b (slate)

### Komponenter
- Moderne, minimalistisk design
- Responsive layout (mobile-first)
- Smooth transitions og hover effects
- Consistent spacing og typography

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

---

Laget for norske kommuner - Modern, skalbar, og brukervennlig.
