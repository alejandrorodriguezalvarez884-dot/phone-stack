# Phone Stack

App móvil (iOS y Android) para el juego de las cenas: todos ponen el móvil boca abajo sobre la mesa y **el primero que lo levanta paga**. Los teléfonos se sincronizan; en cuanto el acelerómetro detecta que alguien coge el suyo, suena una alarma en todos y sale su nombre con un castigo. Español e inglés según el idioma del dispositivo.

## Cómo funciona una partida

1. Uno crea la mesa (código de 4 caracteres) y los demás se unen con el código.
2. El anfitrión pulsa **Empezar ronda** y todos ponen el móvil boca abajo.
3. Cuando todos los móviles están boca abajo y quietos, la ronda se arma (pitido corto).
4. El primero que inclina su móvil más de 25° (o sale de la app, o se desconecta) hace sonar la alarma en todos. La base de datos se queda solo con el primero que levanta el móvil en cada ronda, y el anfitrión lo anuncia, sortea un castigo y suma una al marcador.

El anfitrión es quien entró primero en la mesa; si se va, el siguiente toma el relevo con el estado y el marcador.

También hay un **modo práctica** para una sola persona que no necesita servidor.

## Sincronización (Firebase Realtime Database)

Las mesas viven en Firebase Realtime Database, proyecto `phone-stack-omtr` (región `europe-west1`), en `rooms/{CÓDIGO}`:

- `players/{id}`: nombre, si el móvil está boca abajo y hora de entrada (de servidor). Se borra solo al desconectarse.
- `state`: fase, ronda, perdedor, castigo y marcador. Solo lo escribe el anfitrión.
- `lifts/{ronda}`: el primero que levantó el móvil en esa ronda. Las reglas no dejan sobrescribirlo.

La configuración web está en `src/config.ts` (no es secreta: el acceso lo controlan las reglas). Las reglas están en `database.rules.json`; para desplegarlas:

```bash
npx firebase-tools@latest deploy --only database
```

Las mesas abandonadas se quedan en la base de datos (son unos pocos bytes); quien crea una mesa nueva borra lo que hubiera con ese código.

Con el plan gratuito (Spark) caben 100 conexiones simultáneas, unas 25 mesas de 4 a la vez. Para más, pasa el proyecto a Blaze (pago por uso).

## Desarrollo

```bash
npm install
npx expo start          # escanea el QR con Expo Go
npx expo start --web    # vista rápida en el navegador (sin sensor: botones "Simular")
npx tsc --noEmit && npx expo lint
npm test                # Jest: códigos de mesa, traducciones, sensor y una ronda de práctica
```

Para probar la build nativa en el simulador: `npx expo run:ios` (necesita Xcode y CocoaPods). En el simulador no hay acelerómetro, así que aparecen los botones "Simular".

Los sonidos se generan con `node scripts/generate-sounds.mjs` y los iconos con `node scripts/generate-icons.mjs`.

## Estructura

- `App.tsx`: carga la identidad guardada y alterna entre inicio y mesa
- `src/components/HomeScreen.tsx`: nombre, crear/unirse a mesa, práctica
- `src/components/RoomScreen.tsx`: la mesa (fases, alarma, marcador)
- `src/useGame.ts`: estado del juego y lógica del anfitrión
- `src/room.ts`: mesa en Firebase y mesa local para practicar
- `src/useFaceDown.ts`: acelerómetro, detección de boca abajo y de levantamiento
- `src/useSounds.ts`: alarma, pitido de inicio y vibración
- `src/i18n.ts`: textos y castigos en español e inglés
- `plugins/withSceneLifecycle.js`: adopta el ciclo de vida UIScene, sin el que la app se cierra al arrancar en iOS 27
- `locales/`: textos de Info.plist (permiso de movimiento) en inglés y español
- `__tests__/`: tests de Jest
- `docs/`: política de privacidad, soporte y portada (para GitHub Pages) y la guía de publicación
- `fastlane/`: ficha de App Store (textos y capturas) en inglés y español

## Pendiente de probar en dispositivos reales

- El signo del eje Z del acelerómetro (`DOWN_SIGN` en `src/useFaceDown.ts`): iOS y Android lo dan al revés y está compensado según la documentación de cada plataforma, pero hay que confirmarlo con un móvil de cada.
- Los umbrales (boca abajo a partir de 0,85 g, levantado a partir de 25° durante 3 lecturas) pueden necesitar ajuste para evitar falsos positivos por golpes en la mesa.

## Publicación

Las builds se compilan en la nube con EAS (`npx eas-cli@latest build`, perfiles en `eas.json`), así que no hace falta un Mac para iOS. El identificador del paquete es `com.alejandrorodriguez.phonestack`.

Los pasos para App Store (ficha, capturas, privacidad y lo que falta hacer con la cuenta de Apple) están en [`docs/APP_STORE.md`](docs/APP_STORE.md).

Ideas de monetización: anuncios entre rondas y packs de castigos personalizados de pago (la lista está en `src/i18n.ts`).
