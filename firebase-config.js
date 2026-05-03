const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
