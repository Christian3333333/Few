# Conectar Few a Supabase

El proyecto `vzjwjqsgjxulbbrhhkfw` está activo. La app elige Supabase cuando existen las dos variables, en `src/infra/get-store.ts` y `src/auth/session.ts`. Las cuentas de `.data/` no se copian.

## 1. Tablas en español, antes de crearlas

Cambiar `supabase/migrations/20261021180000_few_init.sql` y los `.from(...)` de `src/infra/supabase-store.ts`. Las columnas se quedan como están (`user_id`, `send_amount`, `locked_at`, …): el adaptador ya las traduce. Solo cambian los nombres de tabla, sin acentos.

- `profiles` pasa a `perfiles`
- `quotes` pasa a `cotizaciones`
- `recipients` pasa a `destinatarios`
- `transfers` pasa a `envios`

El bucket privado sigue llamándose `vouchers`. Las políticas y el trigger de alta de perfil se reescriben sobre esos nombres. Como el proyecto está vacío, no hay que migrar datos.

## 2. Variables locales

Crear `.env.local` (ya está en `.gitignore`) con:

- `NEXT_PUBLIC_SUPABASE_URL=https://vzjwjqsgjxulbbrhhkfw.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` con la clave publishable del proyecto

La clave no se pega en el chat ni se commitea. Reiniciar `npm run dev` para que Next la lea.

## 3. Aplicar el esquema

Ejecutar la migración ya renombrada en el proyecto. Crea las cuatro tablas, el trigger que abre el perfil al registrarse, las políticas de que cada persona solo toca lo suyo, y el bucket `vouchers`.

## 4. Correo sin confirmación

En el panel de Supabase, antes de probar Crear cuenta:

1. Authentication
2. Sign In / Providers
3. Email
4. Desactivar **Confirm email**
5. Guardar

Si queda activo, la cuenta se crea pero no abre sesión. El código no puede apagarlo.

## 5. Refresco de sesión

Añadir `src/proxy.ts` para que la cookie de Supabase se refresque en cada request.

## 6. Probar el correo

Crear una cuenta nueva, cotizar, guardar remitente y destinatario, subir un voucher y ver el envío en Actividad. Una segunda cuenta no debe ver ese envío.

## 7. Google, después del correo

El botón ya redirige a `http://localhost:3000/auth/callback`. El Client ID y el Client Secret se pegan en el panel de Supabase, no en el chat. Se hace cuando el correo ya entra.

1. En Google Cloud Console, un proyecto propio, la pantalla de consentimiento en modo de prueba, y un cliente OAuth de tipo Web.
2. Authorized redirect URI: `https://vzjwjqsgjxulbbrhhkfw.supabase.co/auth/v1/callback`
3. En Supabase, Authentication, Providers, Google: activar el proveedor y pegar Client ID y Client secret.
4. En Authentication, URL Configuration: Site URL `http://localhost:3000`. En Redirect URLs, añadir `http://localhost:3000/auth/callback`.
5. Añadir el correo de Google como usuario de prueba si el cliente sigue en modo Testing.
6. Probar Continuar con Google desde Entrar y desde Crear cuenta. El saludo del inicio usa el primer nombre que entregue Google.

Si el proveedor no está, el correo sigue funcionando y el botón muestra el aviso de que Google no está configurado.
