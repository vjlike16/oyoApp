importScripts('https://www.gstatic.com/firebasejs/8.6.5/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.6.5/firebase-messaging.js');

var firebaseConfig = {
    apiKey: "AIzaSyBknM87YF_6scofTVWZMFwHFtSVCBh2Fus",
    authDomain: "pro01-29e4b.firebaseapp.com",
    projectId: "pro01-29e4b",
    storageBucket: "pro01-29e4b.appspot.com",
    messagingSenderId: "716669500088",
    appId: "1:716669500088:web:496098fdb040e20581124d"
    };

    firebase.initializeApp(
        firebaseConfig
      );
   var messaging = firebase.messaging();
   messaging.setBackgroundMessageHandler(function(payload){
   console.log(payload);
   // Customize notification here
   const notificationTitle = "Background Message Title";
   const notificationOptions = {
       body: "Background Message body.",
       icon: "/itwonders-web-logo.png",
   };

   return self.registration.showNotification(
       notificationTitle,
       notificationOptions,
   );
   })
