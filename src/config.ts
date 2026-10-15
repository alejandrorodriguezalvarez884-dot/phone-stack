// Firebase web config for the phone-stack project. These values identify the project; they are not
// secrets (access is controlled by database.rules.json). Without a databaseURL the app still runs,
// but only the solo practice mode is available.
export const firebaseConfig = {
  apiKey: 'AIzaSyBtrU785KORd8Td3W462Z3Cq8dVTVb3g9I',
  authDomain: 'phone-stack-omtr.firebaseapp.com',
  databaseURL: 'https://phone-stack-omtr-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'phone-stack-omtr',
  storageBucket: 'phone-stack-omtr.firebasestorage.app',
  messagingSenderId: '494105251571',
  appId: '1:494105251571:web:5f199a17cf0cad9e9ab186',
};

export const hasBackend = firebaseConfig.databaseURL !== '';
