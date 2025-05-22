importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBC5OPhRXTqZgm3ZWWVx7P4D_Xd45Gj5dg",
  authDomain: "smart-frozen-food-dagsap.firebaseapp.com",
  databaseURL: "https://smart-frozen-food-dagsap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-frozen-food-dagsap",
  storageBucket: "smart-frozen-food-dagsap.appspot.com",
  messagingSenderId: "141794939862",
  appId: "1:141794939862:web:53d451f4406bc33d2f0a77"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
