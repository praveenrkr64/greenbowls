# Deploying to AWS (2-3 month trial using AWS credits)

This covers: testing the app locally first, then deploying the backend + database to AWS
(EC2 + RDS), while keeping the frontend on Vercel. Standard Postgres + a plain Spring Boot
jar are used throughout so migrating off AWS later is just a data dump/restore, no rewrite.

---

## 1. Local setup (test before deploying)

### Backend
Requires Java 17+, Maven, and a local PostgreSQL instance.

```bash
psql -U postgres -c "CREATE DATABASE cloudkitchen;"

cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
On first run, Hibernate creates the tables and the seeder inserts sample menu items and
communities automatically. Override `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD`
as env vars if your local Postgres credentials differ from `postgres`/`postgres` on `localhost:5432`.

API runs at `http://localhost:8080`. Confirm `http://localhost:8080/api/menu` loads in a browser.

### Frontend
Requires Node 18+.

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
App runs at `http://localhost:3000`.

- Set `NEXT_PUBLIC_ADMIN_API_KEY` (frontend) and `ADMIN_API_KEY` (backend) to the same value.
- Set `ADMIN_USER` / `ADMIN_PASSWORD` in `.env.local` for the `/admin` login.

**Walk the full flow once before deploying:** browse menu → customize a bowl → cart →
checkout → confirmation page → check the order shows up in `/admin`.

---

## 2. AWS deployment (EC2 + RDS)

Only the backend + database move to AWS. The frontend stays on Vercel — it's already free
and has no reason to move, which also keeps one less thing tangled up in AWS for later.

### Step 1 — RDS PostgreSQL
- RDS console → Create database → PostgreSQL → Free tier template if eligible, else db.t3.micro
- DB name: `cloudkitchen`, note the master username/password
- Public access: **No** — only the EC2 instance should reach it; put both in the same VPC
- Note the endpoint once created (looks like `xxx.rds.amazonaws.com`)

### Step 2 — EC2 instance
- Launch t3.micro, Ubuntu 22.04 LTS
- Security group: allow port 22 (SSH, your IP only), 80 and 443 (HTTP/HTTPS, anywhere)
- Allocate an Elastic IP and associate it, so the address doesn't change on reboot

### Step 3 — RDS security group
- Edit RDS's security group → allow inbound port 5432 **from the EC2 instance's security
  group** (not from the internet)

### Step 4 — SSH in and set up the server
```bash
ssh -i your-key.pem ubuntu@<elastic-ip>

sudo apt update && sudo apt install -y openjdk-17-jre-headless maven git

# Caddy (auto SSL, simplest reverse proxy option)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

### Step 5 — Build and deploy the jar
```bash
git clone <your-repo-url>
cd cloud-kitchen/backend
mvn clean package -DskipTests
sudo mkdir -p /opt/cloudkitchen
sudo cp target/cloud-kitchen-backend-0.1.0.jar /opt/cloudkitchen/app.jar
```

### Step 6 — systemd service (keeps it running, restarts on crash/reboot)
```bash
sudo tee /etc/systemd/system/cloudkitchen.service << 'EOF'
[Unit]
Description=Cloud Kitchen Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/cloudkitchen
Environment="DATABASE_URL=jdbc:postgresql://<rds-endpoint>:5432/cloudkitchen"
Environment="DATABASE_URL=jdbc:postgresql://<rds-endpoint>:5432/cloudkitchen"
Environment="DATABASE_USERNAME=<your-rds-username>"
Environment="DATABASE_PASSWORD=<your-rds-password>"
Environment="CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app"
Environment="ADMIN_API_KEY=<long-random-string>"
ExecStart=/usr/bin/java -jar /opt/cloudkitchen/app.jar
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cloudkitchen
sudo systemctl start cloudkitchen
sudo systemctl status cloudkitchen   # confirm it's running
```

### Step 7 — Point a domain/subdomain at it (e.g. `api.yourkitchen.com`)
```bash
sudo tee /etc/caddy/Caddyfile << 'EOF'
api.yourkitchen.com {
    reverse_proxy localhost:8080
}
EOF
sudo systemctl restart caddy
```
Caddy provisions the Let's Encrypt SSL cert automatically once DNS points to your Elastic IP.

### Step 8 — Update Vercel
Set `NEXT_PUBLIC_API_BASE_URL=https://api.yourkitchen.com` in the Vercel project's
environment variables, then redeploy the frontend.

### Step 9 — Set a billing alarm
AWS Budgets console → create a budget (e.g. $50 threshold) with an email alert, so nothing
surprises you against the $150 credit. A t3.micro + db.t3.micro running 24/7 costs roughly
$20-25/month, so the credit comfortably covers a 2-3 month trial.

---

## 3. Migrating off AWS later (if the trial goes well)

Because everything here is standard Postgres and a plain Spring Boot jar, moving to a
different host later needs no code changes:

```bash
# On the EC2 instance (or anywhere with network access to RDS):
pg_dump -h <rds-endpoint> -U <username> -d cloudkitchen -F c -f cloudkitchen_backup.dump

# Copy the dump file to wherever you're migrating to, then restore:
pg_restore -h <new-host> -U <new-username> -d cloudkitchen --clean cloudkitchen_backup.dump
```

Then:
1. Redeploy the same `app.jar` (or rebuild from the same source) on the new host — Render,
   Railway, another VPS, wherever.
2. Update the new backend's `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` to
   point at the new Postgres instance.
3. Update `CORS_ALLOWED_ORIGINS` on the backend and `NEXT_PUBLIC_API_BASE_URL` in Vercel to
   point at the new backend URL.
4. Update your domain's DNS if the backend's address changed.

**Avoid during the AWS trial:** don't reach for AWS-specific conveniences (Lambda,
DynamoDB, S3-tied image processing, etc.) even if they look easier — that's exactly what
makes a later migration painful. Standard Postgres + a portable jar is the whole point of
this setup.
