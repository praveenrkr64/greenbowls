# Sprout & Bowl — Cloud Kitchen Ordering App

Full-stack ordering app: customers browse the menu, customize bowls (sprouts, protein
add-ons, rice, etc.), add to cart, and check out with delivery restricted to your served
apartment communities — no online payment, matches your WhatsApp-link ordering flow.

```
cloud-kitchen/
  backend/   Spring Boot (Java 17, Maven) — REST API + Postgres
  frontend/  Next.js (TypeScript, Tailwind) — customer PWA + admin panel
```

## 1. Run locally

### Backend
Requires Java 17+, Maven, and a local PostgreSQL instance.

```bash
# create the database once
psql -U postgres -c "CREATE DATABASE cloudkitchen;"

cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
On first run, Hibernate creates the tables and the seeder inserts sample menu items and
communities automatically (only when the `menu_items` table is empty, so it won't
duplicate data on later runs).

If your local Postgres uses different credentials than `postgres`/`postgres` on
`localhost:5432`, override via env vars:
```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/cloudkitchen \
DATABASE_USERNAME=postgresql \
DATABASE_PASSWORD=postgres123 \
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

API runs at `http://localhost:8080`. Confirm `http://localhost:8080/api/menu` loads in a browser.

### Frontend
Requires Node 18+.

```bash
cd frontend
cp .env.example .env.local   # edit if needed - defaults work for local dev
npm install
npm run dev
```
App runs at `http://localhost:3000`. Admin panel at `http://localhost:3000/admin`
(login: whatever you set `ADMIN_USER` / `ADMIN_PASSWORD` to in `.env.local`).

For the admin panel to actually load orders, `NEXT_PUBLIC_ADMIN_API_KEY` (frontend) must
match `ADMIN_API_KEY` (backend) — easiest to set both to the same value locally.

## 2. What's built

- **Menu & customization** — items belong to variant groups (e.g. "Choose your sprouts",
  "Add protein") with required/optional and min/max-selection rules, each option can carry
  its own price delta. Validated both client-side (UI won't let you submit incomplete
  choices) and server-side (the API rejects invalid selections even if someone bypasses the UI).
- **Cart** — persisted in the browser (localStorage) so it survives a refresh.
- **Checkout** — apartment community is a dropdown of communities you actually serve, not
  free-text or GPS — matches your "only certain apartment communities" delivery model. No
  payment step; order is confirmed by a follow-up call, as you described.
- **Order confirmation** — receipt-style summary the customer can screenshot or refer back to.
- **Admin panel** (`/admin`) — live order list (polls every 20s), filter by status, one-tap
  status updates (New → Confirmed → Preparing → Out for delivery → Delivered). Protected by
  HTTP Basic Auth at the page level and an API key at the backend level.

## 3. What's intentionally NOT built yet (v2 ideas)

- WhatsApp Business API auto-reply (you're doing this manually for now, which is fine at
  your current volume)
- Menu item CRUD UI for admin (add/edit dishes) — for now, edit `DataSeeder.java` or insert
  rows directly into Postgres; a proper admin CRUD screen is a natural next addition
  once you've validated the ordering flow
- Order limits/anti-spam per phone number (worth adding before this scales, since there's
  no payment gate stopping fake orders)
- Multi-admin login (current setup assumes one kitchen operator)

## 4. Deploying

**Trying AWS first with credits?** See `DEPLOY_AWS.md` for the full EC2 + RDS setup, plus
local testing steps and a migration guide for when you move off AWS later.

**Frontend → Vercel**
1. Push this repo to GitHub, import the `frontend/` folder as the project root in Vercel.
2. Set environment variables in Vercel project settings: `NEXT_PUBLIC_API_BASE_URL` (your
   Render backend URL), `NEXT_PUBLIC_ADMIN_API_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD`.
3. Point your custom domain at the Vercel project once you've bought one.

**Backend + DB → Render**
1. New "Web Service" on Render, point it at the `backend/` folder. Render auto-detects
   Maven; build command `mvn clean package -DskipTests`, start command
   `java -jar target/cloud-kitchen-backend-0.1.0.jar`.
2. New "PostgreSQL" instance on Render (same region as the web service).
3. Set environment variables on the web service: `DATABASE_URL`, `DATABASE_USERNAME`,
   `DATABASE_PASSWORD` (from the Render Postgres connection details),
   `CORS_ALLOWED_ORIGINS` (your Vercel URL, and later your custom domain),
   `ADMIN_API_KEY` (same value as `NEXT_PUBLIC_ADMIN_API_KEY` in Vercel).
4. Do **not** run with the `local` profile in production — leave `SPRING_PROFILES_ACTIVE`
   unset so it uses `application.properties` (Postgres) instead of the H2 seed data.
5. You'll need to add your real menu items and communities once — either a temporary
   admin CRUD screen, or directly via SQL against the Render Postgres instance.

## 5. Before taking real orders

- Set a real `ADMIN_PASSWORD` and `ADMIN_API_KEY` (long random strings, not the example
  placeholders).
- Load your actual menu and served apartment communities into the database (replacing the
  sample data).
- Test the full flow end-to-end on a phone, on your actual delivery-hour network conditions.
