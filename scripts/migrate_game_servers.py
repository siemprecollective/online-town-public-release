import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

ROOM_COLLECTION = "rooms"

cred = credentials.Certificate("../onlinetown-401f0-firebase-adminsdk-gab3z-1a7a54c2da.json");
firebase_admin.initialize_app(cred)
db = firestore.client()

SERVER_MAP = {
    "BLANK": "BLANK",
}

if __name__ == '__main__':
  docs = db.collection(ROOM_COLLECTION).stream()
  for doc in docs:
    # map = doc.to_dict()['map']
    # print("{} map: {}".format(doc.id, map))
    # if (map == 100 or map == 101):
    #   print("Changing {}".format(doc.id))
    #   db.collection(ROOM_COLLECTION).document(doc.id).update({'map': 140})
    newServer = ""
    try:
        server = doc.to_dict()['serverURL']
        try:
            newServer = SERVER_MAP[server]
            db.collection(ROOM_COLLECTION).document(doc.id).update({'serverURL': newServer})
        except KeyError:
            newServer = server
    except KeyError:
        server = "KeyError"
        newServer = ""

    print(server, newServer)
