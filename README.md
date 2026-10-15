# DiamondTop — Free Fire LATAM

Proyecto Next.js para Vercel, con integración servidor-a-servidor de Shop2TopUp y Neon. La clave de Shop2TopUp nunca debe exponerse en el navegador ni subirse al repositorio.

## Incluye
- Diseño responsive en español.
- Catálogo dinámico de Free Fire desde Shop2TopUp y consulta de precio actual por paquete.
- Validación del ID y nombre de jugador mediante `/player/validate`.
- Endpoint de creación de órdenes con UUID idempotente, comprobación de precio y persistencia en Neon.
- Endpoint para consultar el estado de una orden.
- Las órdenes están **desactivadas por defecto** mediante `ALLOW_TEST_ORDERS=false`.

## Antes de empezar
La clave que se compartió en un chat debe considerarse expuesta. Revócala y genera otra desde Shop2TopUp. No pongas la clave real en `.env.example`, GitHub ni el código cliente.

## Instalación
1. Sube esta carpeta a un repositorio nuevo de GitHub.
2. Importa el repositorio en Vercel.
3. En Vercel → Settings → Environment Variables, crea:
   - `SHOP2TOPUP_API_KEY`: clave nueva completa `keyId.secret`.
   - `SHOP2TOPUP_BASE_URL`: `https://shop2topup.com/api/endpoints/v1` (opcional, tiene ese valor por defecto).
   - `DATABASE_URL`: cadena de conexión de Neon con `sslmode=require`.
   - `ALLOW_TEST_ORDERS`: `false`.
4. Redeploy. Abre la web y comprueba que el catálogo y la validación de jugador funcionen.
5. Neon crea la tabla `orders` automáticamente al activar y ejecutar una orden de prueba.

## Recargas reales y pago
El endpoint de crear órdenes de Shop2TopUp puede descontar inmediatamente de la billetera del proveedor. Como aún no hay pasarela de pago, `ALLOW_TEST_ORDERS` debe permanecer `false`. Si aceptas explícitamente el cargo de prueba, cambia temporalmente a `true` en Vercel y redeploy; hazlo solo con un ID propio y un paquete económico. Después vuelve a `false`.

La validación de jugador depende de la cobertura de Shop2TopUp para ese juego/región. La entrega no puede garantizarse hasta que la API confirme una orden como `completed`. Este proyecto no inventa un nombre ni simula éxito si la API falla.

## Desarrollo local
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Endpoints propios
- `GET /api/catalog`
- `POST /api/validate` con `{ "itemId": 123, "categoryId": 12, "playerId": "123456789" }`
- `POST /api/orders` (desactivado salvo `ALLOW_TEST_ORDERS=true`)
- `GET /api/orders/<uuid>`

## Nota sobre webhook
El estado puede consultarse en `GET /api/orders/<uuid>`. Para producción, registra además un endpoint webhook firmado con HMAC-SHA256 siguiendo la documentación vigente de Shop2TopUp antes de aceptar pagos de clientes. No registres una URL webhook hasta que el endpoint esté implementado y verificado.
