import React from 'react';
import firebase from 'firebase';

firebase.initializeApp({
  apiKey: "BLANK",
  authDomain: "BLANK",
  databaseURL: "BLANK",
  projectId: "BLANK",
  storageBucket: "BLANK",
  messagingSenderId: "BLANK",
  appId: "BLANK"
});

export const auth = firebase.auth();
export const db = firebase.firestore();

export var colors = [
  '#d32f2f',
  '#c2185b',
  '#7b1fa2',
  '#512da8',
  '#303f9f',
  '#1976d2',
  '#0288d1',
  '#0097a7',
  '#00796b',
  '#388e3c',
  '#689f38',
  '#afb42b',
  '#ffd835',
  '#ffb300',
  '#fb8c00',
  '#f4511e',
];

export const subdomainElMap = {
  "": {
    "header-title": <>Online Town</>,
    "public-text": <><span style={{color: 'red'}}>The public room is currently down.</span> Check back later!</>,
  },
}

export const roomNameMap = {

}

export var PUBLIC_MAP = {
  "": 160,
};

export var characterIds = {
  1: "/images/characters/player_0.png",
  2: "/images/characters/player_1.png",
  3: "/images/characters/player_2.png",
  4: "/images/characters/player_3.png",
  5: "/images/characters/player_4.png",
  6: "/images/characters/player_5.png",
  7: "/images/characters/player_6.png",
  8: "/images/characters/player_7.png",
  9: "/images/characters/player_8.png",
  10: "/images/characters/player_9.png",
  11: "/images/characters/player_10.png",
  12: "/images/characters/player_11.png",
  13: "/images/characters/player_12.png",
  14: "/images/characters/player_13.png",
  15: "/images/characters/player_14.png",
  16: "/images/characters/player_15.png",
  100: "/images/characters/player_bike_0.png",
  101: "/images/characters/player_bike_6.png",
  102: "/images/characters/player_bike_7.png",
  164: "/images/characters/james.png"
}


export var CHAT_LIMIT = 100;
