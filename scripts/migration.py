import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

ROOM_COLLECTION = "rooms"

cred = credentials.Certificate("../onlinetown-401f0-firebase-adminsdk-gab3z-1a7a54c2da.json");
firebase_admin.initialize_app(cred)
db = firestore.client()

if __name__ == '__main__':
  docs = [e for e in db.collection(ROOM_COLLECTION).stream()]
  for doc in docs:
    # map = doc.to_dict()['map']
    # print("{} map: {}".format(doc.id, map))
    # if (map == 100 or map == 101):
    #   print("Changing {}".format(doc.id))
    #   db.collection(ROOM_COLLECTION).document(doc.id).update({'map': 140})
    split_id = doc.id.split("\\")
    name = split_id[len(split_id) - 1]
    print('{} name: {}'.format(doc.id, name))
    db.collection(ROOM_COLLECTION).document(doc.id).update({'name': name})