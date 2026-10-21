Status: ready-for-agent

## Problem Statement

Una persona en Perú quiere enviar soles a alguien en Europa y entender, en un solo recorrido, cuánto llega, a quién, cómo paga y en qué estado está el envío. Hoy Few existe como diseño en Figma y como conjunto de reglas, pero no hay una aplicación donde ese recorrido se pueda hacer de principio a fin.

## Solution

Una aplicación web en español, con dinero simulado y dominio real. La persona entra con Google o con correo y contraseña, cotiza de Perú hacia Europa en el inicio, elige el país, continúa, deja sus datos de remitente una sola vez, elige o crea un destinatario, paga a la cuenta de Few, sube el voucher y ve el envío pasar de revisión a camino y a confirmado. Actividad guarda el historial.

## User Stories

1. Como visitante, quiero entrar con Google, para llegar a la cotización sin inventar una contraseña.
2. Como visitante, quiero crear una cuenta solo con correo y contraseña, para registrarme sin documento ni celular.
3. Como visitante, quiero entrar con el correo y la contraseña que acabo de crear, para volver a mi cotización.
4. Como visitante, quiero que el correo no tenga que confirmarse por un mensaje, para usar Few en el momento.
5. Como visitante, quiero ver «¡Qué bueno volver a verte!» en Entrar, con Continuar con Google, correo, contraseña y Entrar, para reconocer la pantalla de acceso.
6. Como visitante, quiero un enlace a Crear cuenta desde Entrar, para registrarme si todavía no tengo cuenta.
7. Como visitante, quiero ver «Crea tu cuenta.» y «Transfiere dinero al instante entre Perú y Europa», para saber que el registro es solo la cuenta.
8. Como visitante, quiero un enlace Ingresar desde Crear cuenta, para volver al acceso si ya tengo cuenta.
9. Como visitante, quiero abrir el menú de la barra negra y leer cómo funciona Few (cotizar, pagar, subir el voucher), para entender el producto antes de entrar.
10. Como remitente con sesión, quiero que ese mismo menú muestre mi correo y, si ya los guardé, mi nombre, DNI y celular en solo lectura, más Cerrar sesión, para ver mi cuenta sin otra pantalla.
11. Como remitente con sesión, quiero que el menú no repita Inicio ni Actividad, para no tener dos navegaciones.
12. Como remitente, quiero cerrar sesión desde el menú, para que otra persona no vea mis envíos en este navegador.
13. Como remitente, quiero una barra negra con Few a la izquierda y el menú a la derecha en todas las pantallas, para reconocer la aplicación.
14. Como remitente, quiero que toda la interfaz esté en español y sin selector de idioma, para leer un solo producto.
15. Como remitente, quiero que el inicio sea la cotización, para no pasar por una portada antes de enviar.
16. Como remitente que entró con Google, quiero un saludo con mi primer nombre, para sentir que la cotización es mía.
17. Como remitente que ya guardó sus datos, quiero que el saludo use el nombre del remitente, para ver el nombre con el que envío.
18. Como remitente que solo tiene correo, quiero que el saludo sea «Hola», para no inventar un nombre que todavía no di.
19. Como remitente, quiero ver «¿Cuánto enviamos hoy?», para saber que el inicio pide el monto.
20. Como remitente, quiero editar solo «Tú envías», entre S/ 50 y S/ 20,000 con dos decimales, para acotar el monto.
21. Como remitente, quiero que un monto fuera de ese rango no deje continuar, para no cotizar algo que Few no acepta.
22. Como remitente, quiero ver «Ellos reciben», la comisión y el total calculados, para no hacer la cuenta yo.
23. Como remitente, quiero que Europa → Perú se vea y no se pueda elegir, para saber que el regreso todavía no existe.
24. Como remitente, quiero abrir una hoja sobre el inicio para elegir el país de Europa, para no salir de la cotización.
25. Como remitente, quiero buscar entre España, Italia, Alemania, Francia, Países Bajos, Portugal, Bélgica, Irlanda, Suiza y Reino Unido, para encontrar el país.
26. Como remitente, quiero cerrar la hoja con X sin cambiar el país, para seguir con la cotización anterior.
27. Como remitente, quiero que al elegir país se cierre la hoja y se recalcule lo que reciben, la comisión y el total, para ver el efecto al momento.
28. Como remitente, quiero el tipo fijo del país (EUR a S/ 4.16, CHF a S/ 4.45, GBP a S/ 4.85), para que la cotización coincida con el diseño.
29. Como remitente, quiero una comisión del 1% del monto enviado, redondeada half-up a dos decimales, para saber qué cobra Few.
30. Como remitente, quiero que lo recibido sea monto dividido entre el tipo, con el mismo redondeo, para que S/ 1,200 a España sean €288.46.
31. Como remitente, quiero ver el total a pagar como monto más comisión, para saber cuánto transferir.
32. Como remitente, quiero pulsar Continuar y dejar monto, país y tipo bloqueados 15 minutos, para pagar con ese número.
33. Como remitente, quiero ver «Tipo bloqueado» con la cuenta atrás, para saber cuánto queda.
34. Como remitente, quiero que nacer la referencia FEW- y cinco dígitos al continuar, para usar la misma referencia en el pago.
35. Como remitente sin datos guardados, quiero que Continuar me lleve a «¿Quién envía?», para dejar nombre, DNI y celular una sola vez.
36. Como remitente, quiero ver ejemplos vacíos en nombre, DNI y celular, para saber qué escribir.
37. Como remitente, quiero que el DNI tenga 8 dígitos y que nadie lo consulte en RENIEC ni por SMS, para completar el paso sin una verificación externa.
38. Como remitente que ya guardó sus datos, quiero que Continuar salte al destinatario, para no repetir el formulario.
39. Como remitente, quiero volver atrás en remitente, destinatario y pago, para corregir antes de enviar el voucher.
40. Como remitente, quiero elegir un destinatario ya guardado del país cotizado, para no reescribir el IBAN.
41. Como remitente, quiero pulsar «Nuevo destinatario» y ver el formulario en lugar de la lista, para cargar a alguien nuevo.
42. Como remitente, quiero que el nombre sea obligatorio y que el IBAN tenga formato, dígito de control y prefijo del país cotizado, para no enviar a una cuenta inválida.
43. Como remitente, quiero que un IBAN de otro país no deje continuar, para que el dinero y el país coincidan.
44. Como remitente, quiero que el destinatario válido quede guardado en mi cuenta, para usarlo la próxima vez.
45. Como remitente, quiero ver «Paga y envía.» con el total exacto, Few Peru S.A.C. y la cuenta 000-0000000-0-00, para saber a dónde transferir.
46. Como remitente, quiero ver la referencia de esa cotización en la pantalla de pago, para ponerla en el depósito.
47. Como remitente, quiero subir un JPG, PNG o PDF de hasta 10 MB, para probar el pago.
48. Como remitente, quiero que sin archivo, o con un archivo que no cumple, Enviar voucher no cree el envío, para no avanzar vacío.
49. Como remitente, quiero que un candado vencido impida crear el envío y me devuelva a cotizar, para no pagar un tipo viejo.
50. Como remitente, quiero que elegir destinatario no alargue los 15 minutos, para que el plazo sea el de la cotización.
51. Como remitente, quiero ver «Revisando tu voucher.» con remitente, destinatario y pago en Listo, revisión En curso y envío Pendiente, para saber qué falta.
52. Como remitente, quiero que a los 20 segundos de enviar el voucher el envío pase a «el dinero ya va», para ver el segundo estado.
53. Como remitente, quiero que 20 segundos después quede confirmado, para ver que el dinero «aterrizó».
54. Como remitente, quiero que ese avance ocurra aunque cierre la pestaña, para encontrarlo actualizado al volver.
55. Como remitente, quiero que si dejo la revisión abierta la pantalla pase sola a envío y luego a confirmado, para no pulsar nada.
56. Como remitente, quiero que revisión, envío y confirmado no tengan flecha atrás, porque el estado ya no se edita.
57. Como remitente, quiero ver en confirmado el destinatario, lo enviado, la comisión, lo recibido, la referencia bancaria y la fecha, para guardar el resultado.
58. Como remitente, quiero descargar un recibo en PDF con esos datos, para tener un comprobante.
59. Como remitente, quiero que el recibo solo exista cuando el envío está confirmado, para no descargar un pago a medias.
60. Como remitente, quiero pulsar Enviar de nuevo y volver al inicio con el mismo destinatario y el mismo monto, para repetir el envío.
61. Como remitente, quiero que Enviar de nuevo bloquee un tipo nuevo al pulsar Continuar, para no reutilizar el candado anterior.
62. Como remitente, quiero una barra inferior solo con Inicio y Actividad, y solo en esas dos pantallas, para moverme entre cotizar y el historial.
63. Como remitente, quiero ver en Actividad mis envíos reales, del más nuevo al más antiguo, para no mezclarlos con ejemplos.
64. Como remitente con cuenta nueva, quiero Actividad vacía más la tarjeta «Envía dinero a casa», para cotizar desde ahí.
65. Como remitente, quiero que Cotizar en esa tarjeta vuelva al inicio, para empezar otro envío.
66. Como remitente, quiero que una cotización caducada sin voucher no aparezca en Actividad, para ver solo envíos creados.
67. Como remitente, quiero que revisión y envío en curso se muestren como Verificando, y solo el aterrizado como Confirmado, para leer la lista de un vistazo.
68. Como remitente, quiero abrir una fila y caer en el paso actual de ese envío, para retomar la revisión, el camino o la confirmación.
69. Como remitente, quiero que otra persona no pueda leer ni escribir mis destinatarios, cotizaciones, envíos ni vouchers, para que la cuenta sea mía.
70. Como remitente, quiero que el archivo del voucher se guarde y que nadie lo «coteje» contra un banco, para que el prototipo no finja un depósito real.

## Implementation Decisions

- La aplicación es Next.js con App Router. Corre en local primero. Auth, Postgres y el archivo del voucher viven en Supabase. El correo de Auth no exige confirmación. Google y correo con contraseña son los dos accesos.
- Hay un perfil ligado al usuario de Auth. El correo viene del acceso. Nombre, DNI y celular nacen vacíos y se escriben una sola vez en el paso del remitente.
- El saludo del inicio usa, en este orden, el nombre del remitente ya guardado, el primer nombre de Google, o «Hola» si no hay ninguno.
- El menú sin sesión muestra cómo funciona. El menú con sesión muestra correo, datos del remitente en solo lectura y Cerrar sesión. No edita el perfil y no recupera la contraseña.
- La cotización guarda monto enviado, país, moneda, tipo, comisión, monto recibido, total, instante de bloqueo y referencia. La referencia es `FEW-` más cinco dígitos y nace al continuar.
- Tipos fijos: EUR 4.16, CHF 4.45, GBP 4.85, en soles por unidad de moneda extranjera. Comisión = 1% del monto enviado. Recibido = monto / tipo. Total = monto + comisión. Todo a dos decimales, half-up.
- El candado vence a los 15 minutos de Continuar. Elegir destinatario no lo reinicia. Enviar voucher después de vencido no crea envío.
- El destinatario guarda nombre e IBAN normalizado, y solo se ofrece si su país es el de la cotización vigente. La validación es de formato y dígito de control, más el prefijo.
- El envío se crea al enviar el voucher, con la cotización vigente, el remitente, el destinatario y el archivo. La cuenta de cobro mostrada es siempre Few Peru S.A.C., `000-0000000-0-00`.
- El archivo aceptado es JPG, PNG o PDF, máximo 10 MB, en un almacén privado. El servidor no lee el contenido.
- El estado no usa una cola. Se calcula al leer, a partir del instante en que se envió el voucher:

```
0s–20s    revisión
20s–40s   envío en curso
40s+      confirmado
```

- En la lista, revisión y envío en curso se presentan como Verificando. Confirmado solo cuando ya pasaron los 40 segundos.
- La pantalla abierta de un envío no confirmado vuelve a leer cada pocos segundos y navega sola cuando el estado cambia.
- Enviar de nuevo no reabre la cotización vieja: arma una cotización nueva con el mismo destinatario y el mismo monto, y el bloqueo ocurre otra vez al continuar.
- El recibo se genera solo para un envío confirmado, en PDF, en español, con destinatario, enviado, comisión, recibido, referencia bancaria y fecha.
- Cada usuario solo lee y escribe su perfil, sus destinatarios, sus cotizaciones, sus envíos y sus archivos.
- Un solo módulo de operaciones de remesa es el contrato que usan las pantallas: cotizar, bloquear, guardar remitente, guardar destinatario, enviar voucher y leer el envío (incluido el listado). La interfaz no calcula tipos, plazos ni estados por su cuenta.

## Testing Decisions

- Un buen test mira el comportamiento externo de esas operaciones, no los componentes ni el detalle de cómo se dibuja la pantalla.
- Hay un solo punto de prueba: ese módulo de operaciones, con una base de datos de prueba y un reloj que el test mueve. Ahí se cubren el cálculo, el rango del monto, el país, el candado y su vencimiento, el IBAN, el perfil del remitente, el archivo, la creación del envío, el avance a los 20 y 40 segundos, lo que aparece en el historial y los datos del recibo.
- El inicio de sesión con Google, el parecido visual con Figma y los componentes de React quedan fuera de ese punto. La sesión de prueba se inyecta.
- No hay tests previos en el repo que sirvan de modelo. Esta suite es la primera.

## Out of Scope

Dinero real, licencia, cotejo del voucher contra un banco, panel de operador, el corredor Europa hacia Perú, tipo de cambio en vivo, notificaciones push, recuperar la contraseña y editar el perfil desde el menú. Tampoco entran datos de ejemplo en una cuenta nueva.

## Further Notes

El diseño de referencia es el archivo de Figma «Few — Remittances Perú ↔ Europa (Mobile)». La barra inferior es solo Inicio y Actividad. Los pasos visibles después de Continuar son seis: Remitente, Destinatario, Pago, Revisión, Envío y Confirmado. Los tres primeros pueden volver atrás; los tres últimos no.
