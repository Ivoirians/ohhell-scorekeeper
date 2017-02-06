import * as firebase from 'firebase';

var config = {
  apiKey: "AIzaSyChWYU04cxASlH_NL32nL7IOTs6YnnN_RI",
  authDomain: "ohhellscorekeeper.firebaseapp.com",
  databaseURL: "https://ohhellscorekeeper.firebaseio.com",
  storageBucket: "ohhellscorekeeper.appspot.com",
  messagingSenderId: "165596737293"
};
firebase.initializeApp(config);

export var database = firebase.database();

