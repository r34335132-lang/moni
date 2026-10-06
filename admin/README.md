# MONI · Panel de administración

Dashboard web (solo lectura) para ver cuentas creadas, suscripciones Premium, uso del bot de WhatsApp y actividad diaria.

## 1. Base de datos (una sola vez)

1. En Supabase → SQL Editor, corre `supabase/migrations/008_admin_dashboard.sql`.
2. Agrega tu cuenta como administradora (usa el correo con el que entras a MONI):

```sql
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'tu@correo.com';
```

Solo las cuentas en `admin_users` pueden leer las métricas. Las funciones son `SECURITY DEFINER` y validan `is_admin()`, así que el panel usa la llave **anon** (nunca la `service_role`).

## 2. Configuración

Crea `admin/.env` (a partir de `.env.example`) con los mismos valores de `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` de la app. Ajusta `VITE_PRICE_MONTHLY` / `VITE_PRICE_YEARLY` para el ingreso mensual estimado.

## 3. Correr en local

```bash
cd admin
npm install
npm run dev        # http://localhost:5180
```

## 4. Publicar en Vercel

1. Sube el código a GitHub (`admin/.env` no se sube, está en `.gitignore`).
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio.
3. **Root Directory:** `admin` (Vercel detecta Vite; build `npm run build`, output `dist`).
4. **Environment Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PRICE_MONTHLY`, `VITE_PRICE_YEARLY`.
5. Deploy. Cada `git push` a `main` vuelve a publicar.
6. En Supabase → Authentication → URL Configuration agrega el dominio de Vercel a **Redirect URLs** (solo necesario si luego usas recuperación de contraseña o magic links).
