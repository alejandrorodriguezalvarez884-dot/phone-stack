# Phone Stack

App móvil (iOS y Android) para el juego de las cenas: todos ponen el móvil boca abajo sobre la mesa y **el primero que lo levanta paga**. Los teléfonos se sincronizan; en cuanto el acelerómetro detecta que alguien coge el suyo, suena una alarma en todos y sale su nombre con un castigo. Español e inglés según el idioma del dispositivo.

## Cómo funciona una partida

1. Uno crea la mesa (código de 4 caracteres) y los demás se unen con el código.
2. El anfitrión pulsa **Empezar ronda** y todos ponen el móvil boca abajo.
3. Cuando todos los móviles están boca abajo y quietos, la ronda se arma (pitido corto).
4. El primero que inclina su móvil más de 25° (o sale de la app, o se desconecta) hace sonar la alarma en todos. El anfitrión decide quién ha sido, sortea un castigo y suma una al marcador.

El anfitrión es quien entró primero en la mesa; si se va, el siguiente toma el relevo con el estado y el marcador.

También hay un **modo práctica** para una sola persona que no necesita servidor.

## Sincronización (Supabase Realtime)

Las mesas usan [Supabase Realtime](https://supabase.com/docs/guides/realtime): *presence* para saber quién está y quién tiene el móvil boca abajo, y *broadcast* para los mensajes del juego. No hay tablas ni base de datos.

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **Project Settings → API Keys** copia la URL del proyecto y la clave *publishable* (o *anon*). Nunca la *secret* / *service_role*.
3. En **Realtime → Settings**, deja activado el acceso público a los canales (viene así por defecto).
4. `cp .env.example .env.local` y rellena `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY`.
5. Para las builds de EAS, crea esas dos variables también en EAS (`npx eas-cli@latest env:create`), porque se incrustan en la app al compilar.

Sin estas variables la app funciona, pero solo deja practicar.

## Desarrollo

```bash
npm install
npx expo start          # escanea el QR con Expo Go
npx expo start --web    # vista rápida en el navegador (sin sensor: botones "Simular")
npx tsc --noEmit && npx expo lint
```

Los sonidos se generan con `node scripts/generate-sounds.mjs` y los iconos con `node scripts/generate-icons.mjs`.

## Estructura

- `App.tsx`: carga la identidad guardada y alterna entre inicio y mesa
- `src/components/HomeScreen.tsx`: nombre, crear/unirse a mesa, práctica
- `src/components/RoomScreen.tsx`: la mesa (fases, alarma, marcador)
- `src/useGame.ts`: estado del juego y lógica del anfitrión
- `src/room.ts`: canal de Supabase (presence + broadcast) y mesa local para practicar
- `src/useFaceDown.ts`: acelerómetro, detección de boca abajo y de levantamiento
- `src/useSounds.ts`: alarma, pitido de inicio y vibración
- `src/i18n.ts`: textos y castigos en español e inglés
- `docs/privacy.html`: política de privacidad (para GitHub Pages)

## Pendiente de probar en dispositivos reales

- El signo del eje Z del acelerómetro (`DOWN_SIGN` en `src/useFaceDown.ts`): iOS y Android lo dan al revés y está compensado según la documentación de cada plataforma, pero hay que confirmarlo con un móvil de cada.
- Los umbrales (boca abajo a partir de 0,85 g, levantado a partir de 25° durante 3 lecturas) pueden necesitar ajuste para evitar falsos positivos por golpes en la mesa.

## Publicación

Las builds se compilan en la nube con EAS (`npx eas-cli@latest build`), así que no hace falta un Mac para iOS. El identificador del paquete es `com.alejandrorodriguez.phonestack`.

Ideas de monetización: anuncios entre rondas y packs de castigos personalizados de pago (la lista está en `src/i18n.ts`).
