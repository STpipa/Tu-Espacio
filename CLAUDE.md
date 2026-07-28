# CLAUDE.md — Tu Espacio 🌿⚡

## Identidad y contexto
Este repo es la app **Tu Espacio**: una plataforma inmersiva de constelaciones familiares en un entorno 3D multiusuario en tiempo real (estilo Roblox), combinando la calidez de un centro de sanación con tecnología interactiva moderna.

Origen del proyecto: documento de arquitectura `Tu_Espacio_Documento_Completo_v3.pdf` (subido por el usuario el 2026-07-27), que define stack, esquema de datos, monetización y una guía de 5 prompts secuenciales para construir la app paso a paso con Claude Code. Este CLAUDE.md es la versión "viva" de ese documento: se actualiza a medida que el proyecto avanza (el PDF original queda como referencia histórica, no se vuelve a editar).

**Estado al 2026-07-27:** carpeta recién creada, sin código todavía. Punto de partida: correr el Paso A de la guía (ver más abajo).

## Identificador técnico
- Nombre de la app: **Tu Espacio**
- Package/bundle id: `com.tuespacio.app` (temporal — confirmar antes de compilar con EAS, puede requerir un dominio real invertido si se registra en las tiendas)

## Stack tecnológico

| Capa | Función | Tecnologías clave |
|---|---|---|
| Plataforma móvil | Navegación, UI, perfiles y gestión | Expo (React Native) |
| Backend / BD | Auth, base de datos, storage de assets | Supabase (Auth, Postgres, Storage) |
| Entorno 3D | Renderizado de mundo inmersivo y avatares | React Three Fiber / Three.js |
| Tiempo real | Sincronización de posiciones 3D y chat | WebSockets (Socket.io o Colyseus) |
| Comunicación de voz | Audio espacial de baja latencia en sala | WebRTC (LiveKit o Agora) |
| Pagos / compras | Suscripciones y monetización | RevenueCat |

## Características del entorno 3D y avatares
- **Cámara orbitable 360°**: libertad total para observar ángulos y dirección de mirada de los representantes.
- **Controles de Super Admin / Curador**: congelar movimiento de avatares, teletransportar/forzar posición (X, Y, Z), silenciar audio/micrófono y chat de texto, expulsar (kick) y bloquear (ban) de la sesión.
- **Avatares modulares personalizables**: capas (ej. Superman), accesorios (ej. Martillo de Thor), disfraces (Monje, Rana), botón "Al azar" para combinaciones aleatorias. La configuración se guarda como JSON en Supabase (`avatar_config`).

## Esquema de base de datos (Supabase / PostgreSQL)

**`profiles`**
- `id` (UUID, referencia a `auth.users`)
- `email`
- `role` (`super_admin` | `curador` | `cliente`)
- `exento_pago` (boolean, default `false`)
- `avatar_config` (JSONB)

**`salas_3d`**
- `id` (UUID)
- `curador_id`
- `codigo_acceso`
- `estado`
- `created_at`

**`catalogo_avatares`**
- `id`
- `nombre`
- `categoria`
- `model_url` (modelos GLB en Supabase Storage)
- `es_premium`

**`sesiones_uso`**
- `id`
- `cliente_id`
- `fecha_asistencia` (control del límite mensual de clientes gratuitos)

## Modelo de monetización y permisos
- **Modelo híbrido**: suscripción para curadores + límite de 2 asistencias gratis/mes para clientes + tienda de accesorios de avatares.
- **Bypass para curadores elegidos**: antes de pedir pago por RevenueCat, verificar `exento_pago == true` o `role == 'super_admin'`.
- **Permisos del sistema**: micrófono (audio WebRTC), notificaciones push (avisos de citas), cámara/galería (foto de perfil) — todos con mensajes explicativos claros al usuario.

## Onboarding y publicación
- Onboarding de 3 pantallas, solo la primera vez: (1) Sanación y Conexión, (2) Espacios 3D e Innovación, (3) Sesiones Guiadas en Vivo.
- `app.json` con `name: "Tu Espacio"`, `package: "com.tuespacio.app"`, listo para build con EAS (iOS/Android).

## Roadmap de implementación — 5 pasos secuenciales
Seguir este orden. Marcar cada paso como hecho en "✅ Próximos pasos" (abajo) y dejar un registro en "📌 Decisiones clave" al completarlo.

**Paso A — Autenticación y roles**
Añadir auth con Supabase a la app de Expo. Crear tabla `profiles` vinculada a `auth.users` con `role` (`super_admin`/`curador`/`cliente`) y `exento_pago` (boolean, default false). Sin sesión → pantalla de login. Cliente → vista principal. Curador → panel de creación de salas.

**Paso B — Entorno virtual 3D y avatares modulares**
Integrar React Three Fiber: sala 3D interactiva con cámara orbitable 360°. Cargar avatares leyendo `avatar_config` (JSONB) desde Supabase. Controles de movimiento en el plano 3D + botón "Al azar" que combina accesorios desde `catalogo_avatares`.

**Paso C — Sincronización en tiempo real y moderación**
Conectar la sala 3D con WebSockets para sincronizar posición/rotación en tiempo real. Panel de herramientas exclusivo para `role = 'curador'` o `'super_admin'`: mover cualquier avatar, congelar movimiento, silenciar audio/chat, expulsar usuario.

**Paso D — Monetización y bypass de pagos**
Límites de uso + pagos con RevenueCat. Clientes gratuitos: máximo 2 asistencias/mes (tabla `sesiones_uso`). Antes de dejar crear una sala a un curador, verificar en Supabase: `role == 'super_admin'` OR `exento_pago == true` OR suscripción activa en RevenueCat.

**Paso E — Permisos, onboarding y preparación EAS**
Configurar permisos (micrófono, notificaciones push, cámara/galería) con mensajes explicativos. Onboarding inicial de 3 pantallas, estética holística, solo la primera vez. `app.json` listo (`name`, `package`) para publicar con EAS Build.

## Credenciales y entorno
Todavía **no hay credenciales reales** (2026-07-27). Convenciones a seguir:
- Variables de entorno en `.env` (nunca commitear), con prefijo `EXPO_PUBLIC_` para lo que necesite el cliente: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- Preferir **tiers gratis/sandbox** mientras se prueba, antes de comprometerse a un plan pago:
  - Supabase: tier gratis alcanza para desarrollo (Auth + Postgres + Storage).
  - RevenueCat: gratis hasta cierto volumen de ingresos + modo sandbox para probar compras sin cobrar de verdad.
  - Tiempo real: Colyseus/Socket.io son open source, sin costo de licencia (el costo es solo del hosting).
  - Voz (WebRTC): LiveKit tiene tier gratis / self-hosted; Agora también tiene tier gratis con límite de minutos — evaluar cuál conviene cuando se llegue al Paso C.
- Si algún servicio termina siendo de pago, avisar antes de asumir el costo y buscar la alternativa gratis equivalente para la fase de pruebas.

## Convenciones de trabajo
- Un repo para este proyecto (no mezclar con otras apps).
- Al final de cada sesión (o tras un cambio completo), commitear y pushear a `origin/main` sin pedir confirmación cada vez, salvo que quede algo a medio terminar o `git status` muestre algo raro.
- Actualizar este `CLAUDE.md` (sección "📌 Decisiones clave" y "✅ Próximos pasos") con cada avance importante.
- **Reflejar cada avance importante en Obsidian**: hay una nota espejo de este proyecto en el "segundo cerebro" del usuario, en `C:\Obsidian Vault\proyectos\tu-espacio.md`. Si Claude Code tiene acceso a esa carpeta, actualizarla junto con este archivo (misma lógica que el resto de los proyectos del usuario: decisiones clave fechadas, próximos pasos con checkboxes). Si no tiene acceso, dejarlo anotado como pendiente de sincronizar manualmente.

## 📌 Decisiones clave
- **2026-07-27:** Proyecto iniciado a partir del documento de arquitectura subido (`Tu_Espacio_Documento_Completo_v3.pdf`). Se armó este `CLAUDE.md` con stack, esquema de Supabase, modelo de monetización/permisos y los 5 prompts secuenciales (Pasos A-E) como roadmap. Se creó la nota espejo en Obsidian (`proyectos/tu-espacio.md`). Sin credenciales reales todavía — se usarán tiers gratis/sandbox de Supabase y RevenueCat para las pruebas iniciales.
- **2026-07-27:** Node.js no estaba instalado en el equipo y no había `winget`/`choco` disponibles para instalarlo, y el instalador MSI oficial falló por falta de permisos de administrador (Error 1925). Se instaló la versión **portable** de Node.js v24.18.0 LTS en `%LOCALAPPDATA%\Programs\nodejs-portable\` (sin necesitar admin) y se agregó al PATH de usuario. Si en una terminal nueva `node`/`npm` no se reconocen, puede requerir cerrar sesión de Windows una vez para que el PATH nuevo se propague, o agregar esa carpeta al PATH manualmente.
- **2026-07-27:** Se inicializó el repo git local (rama `main`). Todavía no tiene remoto configurado en GitHub — falta correr `git remote add origin <url>` con el repo que se cree para este proyecto antes de poder pushear.
- **2026-07-27:** **Paso A completado** (auth + roles). Se scaffoldeó la app con `create-expo-app` (blank-typescript, SDK 57). Se agregó `@supabase/supabase-js` + AsyncStorage para persistencia de sesión, y `@react-navigation` (native-stack) para el ruteo. `src/contexts/AuthContext.tsx` maneja sesión y perfil; `src/navigation/RootNavigator.tsx` decide la pantalla según estado: sin sesión → `LoginScreen`, `role === 'cliente'` → `ClienteScreen`, `role === 'curador'` o `'super_admin'` → `CuradorScreen` (con panel básico de creación de salas, ya conectado a una tabla `salas_3d`). La migración SQL vive en `supabase/schema.sql` (tabla `profiles` con enum de rol + trigger que crea el perfil automáticamente al registrarse, tabla `salas_3d` con RLS). Validado con `tsc --noEmit` (sin errores) y `expo export --platform web` (bundle de 524 módulos sin errores).
- **2026-07-27:** Repo conectado a GitHub (`https://github.com/STpipa/Tu-Espacio.git`) y pusheado a `origin/main`.
- **2026-07-27:** Proyecto real de Supabase creado (`xhhzkxplvwuybgksugxg`, tier free). `.env` cargado con las credenciales reales (`EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` usando la `publishable key`, que es el nuevo nombre de la `anon key`). La `secret key` del proyecto **no** se usa ni se guarda en el repo — es solo para backend/servidor, nunca para el cliente. Se corrió `supabase/schema.sql` en el SQL Editor.
- **2026-07-27:** **Paso A probado end-to-end por el usuario**: registro sin confirmación de email (se desactivó "Confirm email" en Supabase para agilizar pruebas — revisar si se reactiva antes de producción), cambio manual de rol a `curador` desde el Table Editor, panel de curador visible con el botón de creación de sala. Pendiente (anotado por el usuario, no urgente): mejorar el estilo visual del dashboard, hoy es muy plano — no es prioridad ahora, se retoma más adelante.
- **2026-07-27:** **Paso B completado y probado en versión web.** Se agregó `expo-gl` + `three` + `@react-three/fiber` para el entorno 3D. `src/three/Sala3D.tsx` renderiza una sala con piso, luces y un avatar (`AvatarModel.tsx`), con cámara orbitable 360° manejada a mano con `PanResponder` (`useOrbitCamera.ts`: un dedo/mouse rota, dos dedos hacen pinch-zoom — el pinch todavía no tiene equivalente de mouse en la versión web, queda pendiente probarlo en celular). `AvatarEditorScreen.tsx` es la pantalla nueva (accesible desde Cliente y Curador con el botón "Personalizar mi avatar"): selector por categoría (capa/disfraz/accesorio) con flechas, botón "Al azar", botón "Guardar" que persiste en `profiles.avatar_config`, y un D-pad para mover el avatar en el piso. Migración nueva en `supabase/schema_paso_b.sql` (tabla `catalogo_avatares` con 8 filas semilla). **Importante:** todavía no hay modelos `.glb` reales subidos a Supabase Storage — `model_url` queda `NULL` en el catálogo, así que los avatares se ven como cápsulas de colores (color derivado determinísticamente del nombre) en vez de los diseños reales (Superman, rana, martillo de Thor, etc). La arquitectura ya soporta cargar modelos reales cuando se suban; por ahora es placeholder a propósito. Probado por el usuario en navegador (web): funciona y el usuario confirmó que "anda estable" y "le gusta el diseño". **Falta probar en celular** (Expo Go) — pendiente, se hace más adelante.
- **2026-07-27:** **Paso C completado y probado (posición en tiempo real + moderación).** Primer componente de backend propio del proyecto además de Supabase: carpeta `server/` con un servidor **Colyseus** (Node + TypeScript, independiente del proyecto Expo — tiene su propio `package.json`). Versión fijada a la línea `0.16.x` de Colyseus a propósito: el cliente `colyseus.js` todavía no tiene una versión `0.17` publicada, así que usar la versión "latest" del server (`0.17.x`) habría roto el protocolo cliente-servidor.
  - `server/src/rooms/SalaRoom.ts`: valida el JWT de Supabase de cada conexión (`onAuth`), carga el rol real desde `profiles` (nunca confía en un rol mandado por el cliente), sincroniza posición/rotación (`mensaje "mover"`), y expone moderación (`mensaje "moderar"`: congelar/descongelar/silenciar/habilitar/teletransportar/expulsar) solo si `role` es `curador` o `super_admin`.
  - Cada sala de Supabase (`salas_3d.codigo_acceso`) mapea a una instancia aislada de Colyseus vía un endpoint HTTP propio (`POST /salas/resolver`, usando `matchMaker.query`/`matchMaker.createRoom` de `@colyseus/core`) — así dos salas distintas nunca comparten jugadores.
  - **Bug encontrado y arreglado:** la política RLS de `salas_3d` solo dejaba ver la sala a su propio curador, así que un cliente uniéndose por código no podía leerla (`onAuth` fallaba con "La sala no existe"). Se arregló con una función `SECURITY DEFINER` (`buscar_sala_por_codigo`, en `supabase/schema_paso_c.sql`) que devuelve solo la fila que coincide exacto con el código pedido, sin abrir la tabla entera a lectura pública (eso hubiera permitido listar todos los códigos de todas las salas).
  - Cliente: `colyseus.js` (fijado a `0.16.22` para que coincida con el server), `src/hooks/useSalaRoom.ts` maneja la conexión y el estado sincronizado (usa `getStateCallbacks`, el patrón nuevo de callbacks de Colyseus 0.16+, ya no `.onAdd` directo sobre el schema), `src/screens/SalaEnVivoScreen.tsx` es la pantalla en vivo con el D-pad de movimiento y el panel de moderación (solo visible para curador/super_admin).
  - Validado con un script de prueba automatizado (2 clientes simulados con cuentas de Supabase reales) antes de pasarlo al usuario: sincronización de posición ✅, un cliente sin rol de curador no puede moderar ✅, congelar funciona ✅, expulsar funciona ✅.
  - Probado a mano por el usuario con dos ventanas de navegador (una normal + una de incógnito, porque dos pestañas normales comparten sesión): funcionó, vio los dos avatares, la moderación, y reportó que las flechas de movimiento quedaban tapadas por el panel de jugadores — se arregló (las flechas ahora están dentro de su propio contenedor `flex:1` en vez de posicionarse relativas a toda la pantalla).
  - **Incidente:** en un momento los dos servidores de desarrollo (Expo web y Colyseus) quedaron colgados sin escuchar en su puerto (probablemente por correr en ventanas de PowerShell separadas y desatendidas cuya salida no se podía inspeccionar). Desde entonces se corren como procesos en segundo plano con logs legibles en vez de ventanas nuevas — más fácil de diagnosticar si vuelve a pasar.
  - **Todavía no implementado (fuera del alcance de este paso, a propósito):** audio real y chat de texto — "silenciar" hoy es solo una bandera de estado (`silenciado`) sin ningún pipeline de audio/WebRTC detrás, lista para conectarse cuando se decida entre LiveKit/Agora (ver sección de stack). Tampoco hay reconexión automática si se corta la conexión a Colyseus.
- **2026-07-27:** **Paso D completado y probado (monetización + bypass de pagos), decisión: RevenueCat se cablea de código ya, cuenta real queda para después.**
  - **Fix de seguridad primero (prerrequisito real, no cosmético):** durante las pruebas del Paso C se detectó que la RLS de `profiles` dejaba que cualquier usuario cambiara su propio `role`/`exento_pago` desde el cliente — si no se arreglaba, todo el gating de este paso hubiera sido trivial de saltear. Se restringió a nivel de columna (`revoke update ... grant update (avatar_config) ...`, en `supabase/schema_paso_d.sql`), verificado con un test que confirma `permission denied` al intentar auto-ascenderse, y que `avatar_config` se sigue pudiendo editar normalmente.
  - `src/lib/monetizacion.ts`: `puedeCrearSala()` (super_admin, exento_pago, o suscripción activa), `puedeUnirseComoCliente()` (bloquea a los `cliente` sin exención después de 2 asistencias distintas en el mes), `registrarAsistenciaSiHaceFalta()` marca la asistencia del día (idempotente vía `unique(cliente_id, fecha_asistencia)` en la tabla nueva `sesiones_uso`).
  - Conectado en `CuradorScreen` (chequeo antes de crear sala) y `ClienteScreen` (chequeo antes de unirse, más un contador "sesiones usadas este mes: X/2" visible). La asistencia se registra automáticamente al conectar de verdad a una sala (dentro de `useSalaRoom`), no al tocar el botón — así un código inválido no gasta una sesión.
  - **RevenueCat:** el usuario eligió construir toda la lógica ahora y dejar la cuenta/SDK real para después. `src/lib/revenuecat.ts` es un módulo placeholder documentado (`verificarSuscripcionActiva()` siempre devuelve `false` por ahora) — **a propósito NO se instaló** `react-native-purchases` todavía, porque es un módulo nativo: instalarlo rompe la posibilidad de seguir probando con Expo Go/navegador tal cual veníamos haciendo, y pasa a necesitar un dev client propio (`expo prebuild` + EAS Build o build local). Cuando el usuario tenga cuenta de RevenueCat y quiera probarlo de verdad, activar esto es: instalar el paquete, configurar el entitlement, y reemplazar el cuerpo de esa única función.
  - Validado con un script de prueba contra la base real (fix de seguridad, `avatar_config` sigue editable, `sesiones_uso` respeta el límite diario) + `tsc --noEmit` + `expo export --platform web`, todos sin errores.
- **2026-07-27:** **Paso E completado y probado (permisos, onboarding y preparación para EAS) — cierra el roadmap original de 5 pasos.**
  - `src/lib/permisos.ts`: `pedirPermisoGaleria/Camara/Microfono/Notificaciones`, cada uno con un `Alert.alert` explicativo antes de pedir el permiso real (`expo-image-picker`, `expo-audio`, `expo-notifications`).
  - `src/lib/fotoPerfil.ts` + `src/components/FotoPerfil.tsx`: flujo completo elegir→subir→guardar. Sube a un bucket nuevo de Storage (`fotos-perfil`, ruta `<userId>/foto.jpg`) y guarda la URL pública (con cache-busting `?v=timestamp`) en `profiles.foto_url` (columna nueva, migración `supabase/schema_paso_e.sql`, que extiende el `grant update` de columnas de la Paso D a `(avatar_config, foto_url)` — sigue sin poder tocar `role`/`exento_pago` desde el cliente).
  - `src/components/PermisosCard.tsx`: tarjeta con botones para pedir micrófono (preparado para cuando haya audio real vía WebRTC) y notificaciones push (pide el token, todavía no se envía nada real — falta un backend que dispare notificaciones, fuera de alcance de este paso).
  - `src/screens/OnboardingScreen.tsx`: 3 pantallas (Sanación y Conexión / Espacios 3D e Innovación / Sesiones Guiadas en Vivo), se marca como visto en `AsyncStorage` (`src/lib/onboarding.ts`) y `RootNavigator` lo chequea antes que la sesión.
  - `app.json`: plugins de `expo-audio` (permiso de micrófono), `expo-image-picker` (galería + cámara) y `expo-notifications`, cada uno con su mensaje explicativo — ya queda listo para build con EAS.
  - **Bug real encontrado y arreglado (no cosmético):** `Alert.alert` de `react-native-web` es un no-op literal (`class Alert { static alert() {} }`) — no muestra nada y nunca llama a los botones. Como `pedirConfirmacion()` en `permisos.ts` envolvía el `Alert.alert` en una `Promise` que solo se resuelve cuando se aprieta un botón, en la versión web esa promesa nunca se resolvía: el usuario reportó que al tocar "Editar foto" la rueda de carga quedaba girando para siempre. Mismo bug encontrado de paso en el botón "Expulsar" del panel de moderación (`SalaEnVivoScreen.tsx`) — ahí no colgaba nada, pero el botón no hacía nada silenciosamente. Fix: en ambos lugares, si `Platform.OS === "web"` se usa `window.confirm(...)` (sincrónico, dispara solo) en vez de `Alert.alert`. Queda como precedente: cualquier `Alert.alert` nuevo que dependa de que se apriete un botón necesita el mismo chequeo de plataforma para funcionar en la versión web.
  - **Incidente de "pantalla en blanco" (segunda vez esta sesión, causa distinta a la primera):** después de instalar `expo-audio`/`expo-image-picker`/`expo-notifications`/`base64-arraybuffer`, Metro quedó con la caché de resolución de módulos stale y tiraba `Unable to resolve "expo-audio"` aunque el archivo ya existía en disco. Se arregló matando los procesos de Node colgados y reiniciando ambos servidores de desarrollo con `npx expo start --web --clear` (cache de Metro purgada). Confirmado por log limpio de bundling (718 módulos, sin errores).
  - Validado con `tsc --noEmit` sin errores, bundle web limpio, y prueba manual completa del usuario en el navegador: onboarding, subida de foto de perfil, y los botones de micrófono/notificaciones de la tarjeta de permisos — todos funcionando después del fix de `Alert.alert`.

## Cómo correr el proyecto en desarrollo
Son **dos procesos separados** que hay que tener corriendo al mismo tiempo:
1. Servidor de tiempo real: `cd server && npm run dev` (puerto 2567). Necesita su propio `server/.env` (copiar de `server/.env.example`, mismas `SUPABASE_URL`/`SUPABASE_ANON_KEY` que el `.env` de la app — nunca la secret key).
2. App Expo: `npm run web` (o `npx expo start` para probar en celular con Expo Go) desde la raíz del proyecto (puerto 8081). Necesita `EXPO_PUBLIC_COLYSEUS_URL` en el `.env` (`ws://localhost:2567` para desarrollo local; para probar desde el celular hace falta la IP de LAN de esta máquina en vez de `localhost`, todavía no se probó eso).

## ✅ Próximos pasos
- [x] Paso A — Autenticación y roles (Supabase) — completo y probado
- [x] Paso B — Entorno 3D y avatares modulares — completo, probado en web (falta probar en celular)
- [x] Paso C — Sincronización en tiempo real y moderación — completo y probado (web, con dos ventanas)
- [x] Paso D — Monetización y bypass de pagos — completo y probado (código); RevenueCat real queda pendiente (ver abajo)
- [x] Paso E — Permisos, onboarding y preparación EAS — completo y probado (roadmap original de 5 pasos, cerrado)
- [ ] Pulir estilo visual del dashboard (curador/cliente) — pendiente, no urgente, pedido explícito del usuario para después
- [ ] Evaluar reactivar "Confirm email" en Supabase antes de producción (hoy desactivado para pruebas)
- [ ] Probar el Paso B y el Paso C en celular con Expo Go (pinch-zoom de cámara, y la URL de LAN para el server de Colyseus)
- [ ] Conseguir/crear modelos `.glb` reales para `catalogo_avatares` y subirlos a Supabase Storage (hoy son placeholders de colores)
- [ ] Decidir hosting real para el servidor de Colyseus cuando se salga de "solo mi máquina" (Colyseus Cloud tiene tier gratis; evaluar cuando haga falta)
- [ ] Implementar audio real (WebRTC) para que "silenciar" tenga efecto de verdad — hoy es solo una bandera de estado
- [ ] Crear cuenta real de RevenueCat + instalar `react-native-purchases` cuando se quiera probar suscripciones de verdad (implica pasar a un dev client, ya no alcanza Expo Go/navegador) — ver `src/lib/revenuecat.ts`

## 🔗 Relacionado
- Nota espejo en Obsidian: `C:\Obsidian Vault\proyectos\tu-espacio.md`
- Documento original: `Tu_Espacio_Documento_Completo_v3.pdf` (en esta misma carpeta)
