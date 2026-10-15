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
- **URLs:** `https://alejandrorodriguezalvarez884-dot.github.io/phone-stack/privacy.html` (privacidad), `.../support.html` (soporte), `.../` (marketing). Funcionan cuando se activa GitHub Pages (paso 2 de abajo).

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

## Lo que queda (necesita tu cuenta)

1. **Apple Developer Program** activo (99 €/año) con el Apple ID con el que vas a publicar.
2. **GitHub Pages:** en GitHub → *Settings → Pages*, publica la rama `main`, carpeta `/docs` (después de fusionar el PR). Comprueba que abre `https://alejandrorodriguezalvarez884-dot.github.io/phone-stack/privacy.html`.
3. **Probar en un iPhone real** el signo del eje Z y los umbrales del sensor (ver README → "Pendiente de probar en dispositivos reales"). El simulador no tiene acelerómetro.
4. **Compilar, firmar y subir.** Dos caminos:

   **A. EAS (recomendado, en la nube):**

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build -p ios --profile production
   npx eas-cli@latest submit -p ios --latest
   ```

   EAS te pedirá iniciar sesión con tu Apple ID, crea el identificador, el certificado de distribución y el perfil de aprovisionamiento, y la primera vez también la app en App Store Connect.

   **B. Xcode en este Mac:**

   ```bash
   npx expo prebuild -p ios --clean
   open ios/PhoneStack.xcworkspace
   ```

   En Xcode: *Settings → Accounts* añade tu Apple ID; en el target *PhoneStack → Signing & Capabilities* elige tu equipo; luego *Product → Archive* y *Distribute App → App Store Connect*. Antes crea la app en [App Store Connect](https://appstoreconnect.apple.com) (*Apps → +*) con el bundle id `com.alejandrorodriguez.phonestack`.

   CocoaPods: en este Mac no hay Homebrew y el Ruby del sistema es demasiado antiguo; se usó el Ruby portátil de Homebrew (`portable-ruby` 3.4.5) con `gem install cocoapods`.

5. **Rellenar la ficha** en App Store Connect: copia los textos de `fastlane/metadata/` y sube las capturas de `fastlane/screenshots/` (o usa `fastlane deliver` con esas carpetas), responde *App Privacy* y la clasificación por edades como arriba, y precio gratis.
6. **Enviar a revisión** desde App Store Connect, eligiendo el build subido.

Para versiones siguientes: sube `version` en `app.json`; EAS incrementa el build solo (`autoIncrement`).
