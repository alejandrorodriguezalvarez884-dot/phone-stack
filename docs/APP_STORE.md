# Publicar Phone Stack en App Store

Todo lo que se puede preparar sin credenciales de Apple ya está en el repo. Esta guía resume qué hay y qué falta.

## Qué hay en el repo

| Qué | Dónde |
| --- | --- |
| Bundle id, versión (1.0.0) y build (1) | `app.json` (`ios.bundleIdentifier`, `version`, `ios.buildNumber`) |
| Icono (1024×1024 sin transparencia; Xcode genera el resto de tamaños) | `assets/icon.png`, generado con `scripts/generate-icons.mjs` |
| Launch screen (fondo oscuro + logo) | plugin `expo-splash-screen` en `app.json` |
| `ITSAppUsesNonExemptEncryption = false` | `app.json` → `ios.infoPlist` |
| Texto del permiso de movimiento en inglés y español | `locales/en.json`, `locales/es.json` |
| Privacy manifest (`PrivacyInfo.xcprivacy`) | `app.json` → `ios.privacyManifests` (Expo lo fusiona con los de las librerías) |
| Ciclo de vida UIScene (obligatorio en iOS 27) | `plugins/withSceneLifecycle.js` |
| Ficha de la tienda en `en-US` y `es-ES` | `fastlane/metadata/` |
| Notas para el revisor | `fastlane/metadata/review_information/notes.txt` |
| Capturas 6,9" (1320×2868) y 6,5" (1284×2778) | `fastlane/screenshots/` |
| Política de privacidad, soporte y portada | `docs/privacy.html`, `docs/support.html`, `docs/index.html` |
| Perfiles de EAS Build / Submit | `eas.json` |

Las capturas se sacaron del simulador iPhone 17 (6,3") con cuatro jugadores conectados por Firebase y se escalaron a los tamaños que pide App Store Connect. En las de "boca abajo" y "ronda en marcha" se quitó la tarjeta "Este dispositivo no tiene acelerómetro", que solo sale en el simulador.

## Ficha

- **Nombre en la tienda:** Phone Stack: Dinner Game / Phone Stack: juego de cenas ("Phone Stack" a secas ya lo usa otra app). Bajo el icono se sigue viendo "Phone Stack".
- **Subtítulo:** First to grab their phone pays / Quien coja el móvil, paga
- **Categoría:** Juegos → Casual y Familia (secundaria: Entretenimiento)
- **Precio:** gratis, sin compras dentro de la app
- **URLs:** `https://alejandrorodriguezalvarez884-dot.github.io/phone-stack/privacy.html` (privacidad), `.../support.html` (soporte), `.../` (marketing). Las sirve GitHub Pages desde la carpeta `docs/` de `main`.

## Respuestas para App Store Connect

**Privacidad de la app (App Privacy):**

- ¿Recoges datos? Sí.
- *Contact Info → Name* (el nombre que escribe el jugador): uso **App Functionality**, **vinculado** a la identidad (un nombre identifica por sí mismo), **no** se usa para rastreo.
- *Identifiers → User ID* (identificador aleatorio de la instalación): uso **App Functionality**, **vinculado** (va junto al nombre), **no** rastreo.
- Nada más: sin ubicación, sin contactos, sin analítica, sin anuncios. Es lo mismo que declara el privacy manifest.

**Clasificación por edades:** todo "No/Ninguno" salvo, para ir sobre seguro, *Referencias al alcohol: poco frecuentes/leves* (castigos como "invita a la siguiente ronda" o "brinda con un discurso"). Si el formulario pregunta por contenido generado por usuarios: los jugadores solo ven el nombre que escriben los demás en su misma mesa (con código privado).

**Cifrado:** la app solo usa HTTPS estándar; `ITSAppUsesNonExemptEncryption` ya está a `false`, así que no pedirá documentación.

**Sign-in:** no hace falta cuenta; las notas para el revisor explican cómo probar con un solo dispositivo (modo práctica) y con dos.

## App Review Guidelines revisadas

- **2.1 Completitud:** la app funciona contra Firebase (proyecto `phone-stack-omtr`); tiene que estar activo y con las reglas desplegadas mientras dure la revisión. Probado en el simulador con 4 jugadores el 15/10/2026.
- **2.3 Metadatos:** las capturas muestran la app real; la descripción no promete nada que no haga.
- **4.2 Funcionalidad mínima:** juego multijugador con sincronización en tiempo real, sensor y modo práctica; no es una web empaquetada.
- **5.1.1 Privacidad:** política accesible desde la ficha; sin cuentas; los datos se borran al salir de la mesa.
- **1.2 Contenido de usuarios:** solo nombres visibles dentro de una mesa privada. Si Apple lo pidiera, habría que añadir una forma de expulsar a un jugador.
- **iPad:** `supportsTablet` es `false`; en iPad se ejecuta en modo compatibilidad de iPhone, que Apple acepta.

## Estado de la publicación (15/10/2026)

Hecho:

- App creada en App Store Connect (id 6823333935, bundle `com.alejandrorodriguez.phonestack`, equipo J44H9U6HLW) con la ficha en inglés y español, capturas, privacidad, clasificación por edades, precio gratis y disponibilidad en 175 países (no en Mac ni Vision Pro).
- Build 1.0.0 (1) subida desde este Mac y enviada a revisión el 15/10/2026, con publicación automática tras la aprobación.
- GitHub Pages publica `docs/` desde `main`.

16/10/2026: App Review respondió con *Guideline 2.1 - Information Needed* (cuenta con poco historial). Piden un vídeo en un iPhone real con el último iOS, más propósito, instrucciones, servicios externos, diferencias regionales y regulación. La respuesta (en inglés) está en `fastlane/metadata/review_information/notes.txt`: se pega en la respuesta del Resolution Center **y** en *App Review Information → Notes*, con el enlace al vídeo.

Pendiente:

- **Grabar el vídeo** en un iPhone real (instala la build 1.0.0 (1) por TestFlight, testers internos, sin revisión) y responder en App Store Connect.
- **Probar en un iPhone real** el signo del eje Z y los umbrales del sensor (ver README → "Pendiente de probar en dispositivos reales"). El simulador no tiene acelerómetro.

## Cómo se firmó y subió (para la próxima versión)

1. Sube `version` en `app.json` (y `ios.buildNumber` si no usas EAS).
2. `npx expo prebuild -p ios --clean` y `xcodebuild -workspace ios/PhoneStack.xcworkspace -scheme PhoneStack -configuration Release -destination generic/platform=iOS -archivePath ios/build/PhoneStack.xcarchive CODE_SIGNING_ALLOWED=NO archive`.
3. Exporta y sube con `xcodebuild -exportArchive` y firma manual: certificado "Apple Distribution: Alejandro Rodriguez" y perfil "Phone Stack App Store", ambos creados con la API de App Store Connect. La clave de la API es `~/.appstoreconnect/private_keys/AuthKey_HXJ4689RD6.p8` (rol App Manager, Issuer ID `a389ee17-16d7-409a-96e7-f8a30c5a484c`). El certificado y su clave privada están en `~/.appstoreconnect/signing/` y en el llavero `phonestack-signing`. Con App Manager la firma automática "en la nube" de Xcode no funciona; por eso se firma a mano.

Alternativa sin nada de lo anterior: EAS (`npx eas-cli@latest build -p ios --profile production` y `npx eas-cli@latest submit -p ios --latest`), que inicia sesión con tu Apple ID y gestiona sus propios certificados.

CocoaPods: en este Mac no hay Homebrew y el Ruby del sistema es demasiado antiguo; se usó el Ruby portátil de Homebrew (`portable-ruby` 3.4.5) con `gem install cocoapods`.
