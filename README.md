# RackOS — Warehouse Manager

A visual inventory & warehouse management app for a 4×5 (20-block) storage rack system.

## Stack
- React 18 + Vite
- Supabase (auth, database, storage)
- Deployed on Vercel

## Setup

### 1. Supabase Table
Run this SQL in your Supabase SQL Editor:

```sql
create table inventory (
  part_id bigint generated always as identity primary key,
  part_name text not null,
  category text,
  quantity int4 default 0,
  block_location text,
  photo_url text,
  notes text
);

alter table inventory enable row level security;
create policy "public read" on inventory for select using (true);
create policy "public write" on inventory for all using (true);
```

### 2. Supabase Storage
Go to Storage → New Bucket → name: `part-photos` → set to Public

### 3. Run Locally
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
```bash
npm run build
# then push to GitHub and connect to Vercel
```

## Features
- 🗄 Visual 4×5 rack grid (A1–D5) — click any block to see contents
- 🔍 Real-time search across part name, category, block, notes
- ➕ Add / Edit / Delete parts with full form modal
- 📷 Photo upload — opens camera on mobile
- 📊 Stats dashboard (total parts, occupied blocks, categories)
- 📱 Mobile responsive
