import { getLocales } from 'expo-localization';

const es = {
  appName: 'Phone Stack',
  tagline: 'El primero que coge el móvil, paga',
  yourName: 'Tu nombre',
  namePlaceholder: 'Cómo te llaman en la mesa',
  createTable: 'Crear mesa',
  joinTable: 'Unirse',
  codePlaceholder: 'CÓDIGO',
  practice: 'Practicar solo',
  noBackend: 'Falta configurar el servidor de sincronización. De momento solo puedes practicar.',
  howTitle: 'Cómo se juega',
  howSteps: [
    'Uno crea la mesa y los demás se unen con el código.',
    'Todos ponen el móvil boca abajo sobre la mesa.',
    'Cuando estén todos, suena un pitido: empieza la ronda.',
    'El primero que levante el suyo hace sonar la alarma en todos. Le toca pagar.',
  ],

  table: 'Mesa',
  share: 'Compartir',
  shareMessage: (code: string) => `Únete a mi mesa en Phone Stack con el código ${code}. ¡El primero que coja el móvil paga!`,
  leave: 'Salir',
  connecting: 'Conectando…',
  connectionError: 'No se pudo conectar. Revisa tu conexión.',
  players: 'Jugadores',
  you: 'tú',
  host: 'anfitrión',
  losses: (n: number) => (n === 1 ? '1 vez' : `${n} veces`),

  lobbyHost: 'Cuando estéis todos, empieza la ronda.',
  lobbyGuest: 'Esperando a que el anfitrión empiece…',
  needPlayers: 'Hacen falta al menos 2 jugadores.',
  startRound: 'Empezar ronda',

  placeTitle: 'Móvil boca abajo',
  placeHint: 'Déjalo sobre la mesa con la pantalla hacia abajo. La ronda empieza cuando estén todos.',
  waitingFor: (names: string) => `Faltan: ${names}`,
  ready: 'listo',
  notReady: 'esperando',

  armedTitle: 'Que nadie lo toque',
  armedHint: 'La ronda está en marcha. Si levantas el móvil, sonará la alarma en todos.',

  liftedTitle: '¡Alguien lo ha cogido!',
  loserTitle: 'Le toca pagar a',
  youLose: '¡Te toca pagar!',
  penaltyTitle: 'Castigo',
  silence: 'Silenciar',
  nextRound: 'Otra ronda',
  waitingHost: 'Esperando al anfitrión para otra ronda…',
  scoreboard: 'Marcador',

  practiceTitle: 'Modo práctica',
  practiceHint: 'Prueba el sensor: pon el móvil boca abajo y luego levántalo.',

  sensorMissing: 'Este dispositivo no tiene acelerómetro.',
  simulateDown: 'Simular boca abajo',
  simulateLift: 'Simular levantar',

  penalties: [
    'Paga la ronda.',
    'Paga el postre de todos.',
    'Paga los cafés.',
    'Invita a la siguiente ronda.',
    'Elige la próxima canción… y la canta.',
    'Recoge la mesa.',
    'Brinda con un discurso de 30 segundos.',
    'Guarda el móvil en el bolso de otro hasta el final.',
  ],
};

type Strings = typeof es;

const en: Strings = {
  appName: 'Phone Stack',
  tagline: 'First one to grab their phone pays',
  yourName: 'Your name',
  namePlaceholder: 'What the table calls you',
  createTable: 'Create table',
  joinTable: 'Join',
  codePlaceholder: 'CODE',
  practice: 'Practice solo',
  noBackend: 'The sync server is not configured yet. For now you can only practice.',
  howTitle: 'How to play',
  howSteps: [
    'One person creates a table, the rest join with the code.',
    'Everyone puts their phone face down on the table.',
    'Once everyone is in, a beep starts the round.',
    'The first one to pick theirs up sets off the alarm on every phone. They pay.',
  ],

  table: 'Table',
  share: 'Share',
  shareMessage: (code: string) => `Join my Phone Stack table with code ${code}. First one to grab their phone pays!`,
  leave: 'Leave',
  connecting: 'Connecting…',
  connectionError: 'Could not connect. Check your connection.',
  players: 'Players',
  you: 'you',
  host: 'host',
  losses: (n: number) => (n === 1 ? '1 time' : `${n} times`),

  lobbyHost: 'Start the round once everyone is here.',
  lobbyGuest: 'Waiting for the host to start…',
  needPlayers: 'You need at least 2 players.',
  startRound: 'Start round',

  placeTitle: 'Phone face down',
  placeHint: 'Put it on the table with the screen facing down. The round starts once everyone is ready.',
  waitingFor: (names: string) => `Waiting for: ${names}`,
  ready: 'ready',
  notReady: 'waiting',

  armedTitle: 'Nobody touch it',
  armedHint: 'The round is live. Pick up your phone and the alarm goes off on everyone’s.',

  liftedTitle: 'Someone grabbed it!',
  loserTitle: 'Paying this time',
  youLose: 'You’re paying!',
  penaltyTitle: 'Penalty',
  silence: 'Silence',
  nextRound: 'Next round',
  waitingHost: 'Waiting for the host to start another round…',
  scoreboard: 'Scoreboard',

  practiceTitle: 'Practice mode',
  practiceHint: 'Try the sensor: put the phone face down, then pick it up.',

  sensorMissing: 'This device has no accelerometer.',
  simulateDown: 'Simulate face down',
  simulateLift: 'Simulate pick up',

  penalties: [
    'Pay for the round.',
    'Pay for everyone’s dessert.',
    'Pay for the coffees.',
    'Buy the next round.',
    'Pick the next song… and sing it.',
    'Clear the table.',
    'Give a 30-second toast.',
    'Hand your phone to someone else until the end of the night.',
  ],
};

const language = getLocales()[0]?.languageCode;

export const t: Strings = language === 'es' ? es : en;
