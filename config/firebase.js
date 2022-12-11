import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDh6JI0eQf29vy_lg3APcywXL0jEw5imcA",
    authDomain: "oyoapp-3d53c.firebaseapp.com",
    projectId: "oyoapp-3d53c",
    storageBucket: "oyoapp-3d53c.appspot.com",
    messagingSenderId: "205155970492",
    appId: "1:205155970492:web:25a352bcf874db5d404fb9",
    measurementId: "G-PRSCZD48CR"
  };

  firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const provider = new firebase.auth.GoogleAuthProvider();