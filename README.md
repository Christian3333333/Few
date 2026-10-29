# Few

Aplicación web en construcción para enviar dinero entre Perú y Europa. Actualmente el dinero es simulado. La cotización, la cuenta y el historial son reales.

Publicado en [few-two.vercel.app](https://few-two.vercel.app).

## Recorrido

1. Entrar con Google o con correo y contraseña.
2. Cotizar en el inicio: cuánto envías y a qué país de Europa.
3. Dejar los datos del remitente una sola vez.
4. Elegir o crear un destinatario con IBAN.
5. Pagar a la cuenta de Few y subir el voucher.
6. Ver el envío pasar de revisión a camino y a confirmado.
7. Descargar el recibo en PDF y repetir el envío desde Actividad.

Europa hacia Perú se muestra y no se puede elegir.

## Cómo se calcula el envío

Se puede enviar entre S/ 50 y S/ 20,000. La comisión es el 1% de lo enviado. 

Tipos de cambio usados (aun sin implementar API):

| Moneda | Tipo fijo |
| --- | --- |
| Euro (EUR) | S/ 4.16 |
| Franco suizo (CHF) | S/ 4.45 |
| Libra (GBP) | S/ 4.85 |

Al iniciar la operación, ese tipo de canbio queda bloqueado 15 minutos y nace una referencia `FEW-` de cinco dígitos. 

Debes subir un comprobante de pago (JPG, PNG o PDF de hasta 10 MB). Actualmente nadie lo coteja contra un banco.

El estado se calcula al leer, desde el instante en que se envió el voucher:

| Tiempo | Lo que ve la persona |
| --- | --- |
| 0 a 20 segundos | Revisando el voucher |
| 20 a 40 segundos | El dinero ya va |
| Desde los 40 segundos | Confirmado |

## Países a los que se puede enviar

España, Italia, Alemania, Francia, Países Bajos, Portugal, Bélgica e Irlanda usan euro. Suiza usa franco suizo. Reino Unido usa libra.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Sin variables de entorno, la sesión y los datos quedan en `.data/` de esta máquina. Para usar Supabase, copia `.env.example` a `.env.local` y completa la URL y la clave publicable. En el proyecto de Supabase hay que desactivar la confirmación de correo.

```bash
npm test
```

Las pruebas cubren el cálculo, el candado, el IBAN y el avance del envío.

## Qué no hace

No mueve dinero real, no tiene licencia de remesadora, no consulta el DNI en RENIEC y no ofrece un tipo de cambio en vivo.

El detalle del producto está en `docs/specs/few-remesas.md`.
