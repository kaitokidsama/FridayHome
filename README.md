# Friday Home

A personal, local-only iPhone app for running the house. The first module tracks
**finances** (income, expenses, monthly budgets) and **invoices** (expenses whose
invoice hasn't arrived yet, with a reminder on the day it's expected).

- No backend, no account. All data lives in SQLite on the device.
- Built with Expo (SDK 58), TypeScript (strict), and expo-router.

## Quick start

```bash
npm install
npm test           # unit + component tests
npm run typecheck  # tsc --noEmit
npx expo-doctor    # project health check
```

## Run on your iPhone (from a Mac)

### Option A: Expo Go (fastest)

Every native module used here ships in Expo Go, so you can try the app without building.

1. Install **Expo Go** from the App Store. It must support SDK 58.
2. On the Mac, in the project folder: `npx expo start`
3. Scan the QR code with the iPhone camera. The phone and the Mac must be on the same network.

### Option B: Development build (recommended for daily use)

A dev build installs a real "Friday Home" app with its own icon, bundle id
(`com.jairk.fridayhome`), and permission prompts.

1. Install Xcode, open it once, and accept the license.
2. Plug in the iPhone and trust the Mac. Enable **Developer Mode** on the phone
   (Settings → Privacy & Security → Developer Mode).
3. In Xcode → Settings → Accounts, sign in with your Apple ID. A free Personal Team works,
   but the app expires after 7 days. A paid account removes that limit.
4. Run:

   ```bash
   npx expo run:ios --device
   ```

   Pick your iPhone from the list. The first build generates the `ios/` folder
   (it's ignored by git, because the app uses Continuous Native Generation). If signing fails, open
   `ios/FridayHome.xcworkspace`, select your team under *Signing & Capabilities*, and rerun.
5. Later, start the dev server with `npx expo start` and open the installed app.

### Local notifications

- Invoice reminders are **local** scheduled notifications. They fire at 09:00 local time on the
  expected date. They need no push server and no Apple push certificate.
- iOS asks for permission the first time a reminder is scheduled. You can also grant it from
  **Settings → Enable notifications**. If you deny it, re-enable it in iOS Settings → Friday Home.
- No reminder is scheduled for an expected date already in the past. The invoice still shows as
  **Overdue**.
- Reminders are bound to the app install, so reinstalling the app or deleting its data clears them.

## Features (MVP)

| Tab | What it does |
| --- | --- |
| **Summary** | Month selector. Shows income, expense, and balance cards, plus a budget progress bar per category (red when over budget). Also shows the number of pending invoices. |
| **Transactions** | The selected month's transactions, grouped by date. Use the **+** button to add one. Tap a row to edit or delete it. The form has a kind toggle, amount, category, date, description, payment method, and *Invoice pending* with an expected date. |
| **Invoices** | A Pending / Received switch. Pending invoices show their expected date and an *Overdue* badge. The detail screen has **Mark as received**: take a photo, pick one from the library, pick a PDF/file, or mark it without an attachment. Received invoices show an attachment preview. |
| **Settings** | Currency (the default comes from the device locale, with USD as fallback), monthly budgets per category, and notification permission. |

## Project structure

```
app/                         expo-router routes only (thin, delegate to feature UI)
  _layout.tsx                root stack + providers
  (tabs)/                    Summary, Transactions, Invoices, Settings
  transaction/new.tsx        add transaction (modal)
  transaction/[id].tsx       edit transaction (modal)
  invoice/[id].tsx           invoice detail
src/
  finance/
    domain/                  entities + pure logic (summary, budgets, validation)
    application/             use cases + ports (repository interfaces)
    infrastructure/          SQLite repositories
    ui/                      screens, components, hooks
  invoices/
    domain/                  invoice entity, pending/overdue sorting, reminder time
    application/             use cases + ports (InvoiceRepository, AttachmentStorage)
    infrastructure/          SQLite repository, file-system attachment storage
    ui/                      screens + attachment pickers
  shared/
    db/                      connection, migration runner (schema_version), migrations
    i18n/strings.ts          every user-facing string (swap here for Spanish)
    money/                   integer minor-unit money, parsing, Intl formatting
    dates/                   ISO date helpers, clock port, display formatting
    notifications/           ReminderScheduler port + expo-notifications adapter
    ids/                     id generator
    ui/                      theme (light/dark) and UI primitives
  composition/               composition root: wires adapters to use cases
  testing/fakes.ts           in-memory repositories, fake scheduler/storage/clock
```

### Architecture rules

- **Domain is pure TypeScript.** No Expo or React Native imports. It's fully unit tested.
- **Use cases depend on ports**, not on SQLite or Expo. Tests swap in in-memory fakes.
- **Features stay decoupled.** Finance talks to invoices only through its
  `PendingInvoiceTracker` port. The composition root implements that port with the invoices use cases.
- **Money is stored as integer minor units** (cents). User input is parsed with string arithmetic,
  and amounts are formatted with `Intl.NumberFormat`.
- **Migrations** live in `src/shared/db/migrations.ts`. To add one, append a new entry with the next
  `version`. The runner applies each pending migration in its own transaction and records it in
  `schema_version`.
- **Translations:** every string comes from `src/shared/i18n/strings.ts`. To add Spanish, create an
  object with the same `Strings` type and switch the export. Seeded category names are written once,
  at the first launch.

## Testing

- `jest-expo` preset + `@testing-library/react-native`.
- Domain and application layers were written test-first. They use the fakes in
  `src/testing/fakes.ts`.
- To see coverage, run `npm run test:coverage`.

## Roadmap

1. **Pantry / Inventory**
   - Items with quantity, unit, location, and a low-stock threshold.
   - Low-stock alerts feed an auto-generated **shopping list**.
   - Checking off a shopping trip records the grocery purchase as an **expense** in finance,
     through a port, like invoices do today.
2. **Routines**
   - Household routines, such as laundry days, cleaning, or watering plants, with recurring local
     reminders (weekly or custom schedules).
   - A "done" history per routine.
3. Nice-to-haves
   - Spanish translation (`strings.ts`), plus a language picker.
   - Open or share PDF attachments, and a full-screen photo viewer.
   - CSV export and iCloud backup of the SQLite database.
   - Recurring transactions (rent, subscriptions).
