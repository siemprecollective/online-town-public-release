import firebase from 'firebase';

import { auth, db } from './constants';
import { localPreferences } from './LocalPreferences';
import { amplitudeInstance } from './amplitude';

export function dataOnSignIn() {
  if (auth.currentUser) {
    db.collection("auth-users").doc(auth.currentUser.uid).get()
      .then(doc => {
        if (doc.exists) {
          let data = doc.data();
          localPreferences.set("user", {
            "id": data.publicId,
            "analytics": data.analytics,
            "overAge": data.overAge,
            "seenTutorial": data.seenTutorial,
          });
          localPreferences.set("blocked", doc.blocked);
          db.collection("auth-users").doc(auth.currentUser.uid).collection("rooms").get()
            .then(docs => {
              let roomsDict = {};
              docs.forEach(doc => {
                roomsDict[doc.id] = doc.data();
                let lastVisited = doc.data()["lastVisited"];
                if (lastVisited) {
                  roomsDict[doc.id]["lastVisited"] = lastVisited.toDate();
                }
              });
              localPreferences.set("rooms", roomsDict);
            });
        } else {
          let userData = Object.assign(
            {"analytics": false, "overAge": false, "seenTutorial": false}, localPreferences.get("user"));
          let blockedData = localPreferences.get("blocked") || {};
          let roomData = localPreferences.get("rooms") || {};
          db.collection("auth-users").doc(auth.currentUser.uid).set({
            "publicId": userData.id,
            "analytics": userData.analytics,
            "overAge": userData.overAge,
            "seenTutorial": userData.seenTutorial,
            "blocked": blockedData
          });
          Object.keys(roomData).forEach(roomId => {
            db.collection("auth-user").doc(auth.currentUser.uid).collection("rooms")
              .doc(roomId).set(roomData[roomId]);
          });
        }
      });

    amplitudeInstance.setUserId(localPreferences.get("user").id);
  } else {
    console.error("Called signed in without a null current user");
  }
}

export function dataOnSignOut() {
  localPreferences.set("blocked", []);
  localPreferences.set("rooms", {});
}

function dummyFirestoreObj(exists, data) {
  let dummyObj = {};
  dummyObj.exists = exists;
  dummyObj.data = () => data;
  return dummyObj;
}

export function getUserData() {
  if (auth.currentUser) {
    return db.collection("auth-users").doc(auth.currentUser.uid).get();
  } else {
    let userData = Object.assign(
      {"analytics": false, "overAge": false, "seenTutorial": false}, localPreferences.get("user"));
    let blockedData = localPreferences.get("blocked") || {};

    return Promise.resolve(
      dummyFirestoreObj(true, {
        "publicId": userData.id,
        "analytics": userData.analytics,
        "overAge": userData.overAge,
        "seenTutorial": userData.seenTutorial,
        "blocked": blockedData
      })
    );
  }
}

export function updateUserData(data) {
  if (auth.currentUser) {
    db.collection("auth-users").doc(auth.currentUser.uid).set(data, { merge: true });
  }

  if ("blocked" in data) {
    localPreferences.set("blocked", data.blocked);
  }

  let userUpdate = {};
  ["publicId", "analytics", "overAge", "seenTutorial"].forEach(key => {
    if (key in data) {
      let prefKey = (key === "publicId") ? "id" : key;
      userUpdate[prefKey] = data[key];
    }
  })
  if (Object.keys(userUpdate).length > 0) {
    let curData = localPreferences.get("user") || {};
    localPreferences.set("user", Object.assign(curData, userUpdate));
  }
}

export function getRoomData(roomId) {
  if (auth.currentUser) {
    return db.collection("auth-users").doc(auth.currentUser.uid)
      .collection("rooms").doc(roomId).get();
  } else {
    let roomsData = localPreferences.get("rooms");
    if (roomId in roomsData) {
      return Promise.resolve(dummyFirestoreObj(true, roomsData[roomId]));
    } else {
      return Promise.resolve(dummyFirestoreObj(false, {}));
    }
  }
}

// DO NOT use this for lastVisited!
export function updateRoomData(roomId, data) {
  if (auth.currentUser) {
    db.collection("auth-users").doc(auth.currentUser.uid)
      .collection("rooms").doc(roomId).set(data, { merge: true });
  }

  let roomsData = localPreferences.get("rooms") || {};
  let curRoomData = (roomsData && roomsData[roomId]) || {};
  roomsData[roomId] = Object.assign(curRoomData, data);
  localPreferences.set("rooms", roomsData);
}

export function updateRoomVisit(roomId) {
  let curDate = new Date();
  if (auth.currentUser) {
    db.collection("auth-users").doc(auth.currentUser.uid)
      .collection("rooms").doc(roomId).set({
        "lastVisited": firebase.firestore.Timestamp.fromDate(curDate)
      }, { merge: true });
  }

  let roomsData = localPreferences.get("rooms") || {};
  let curRoomData = (roomsData && roomsData[roomId]) || {};
  roomsData[roomId] = Object.assign(curRoomData, {"lastVisited": curDate});
  localPreferences.set("rooms", roomsData);
}