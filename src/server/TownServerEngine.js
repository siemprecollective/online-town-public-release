import {
  ServerEngine,
  TwoVector
} from 'lance-gg';
import bcrypt from 'bcrypt';
import osu from 'node-os-utils';
import { directionMap, VIDEO_THRESHOLD } from '../common/constants';
import { collisionMap } from '../common/maps';
import { Player } from '../common/gameObjects';
import { db, auth } from './constants';
import firebase from 'firebase-admin';
import { logAmpEvent } from './amplitude-server';

import { characterMap } from '../common/maps';
import { getPlayerDistance } from '../common/utils';

export default class TownServerEngine extends ServerEngine {

  assignPlayerToRoom(playerId, roomName) {
    super.assignPlayerToRoom(playerId, roomName);
    this.playerToRoom[playerId] = roomName;
    this.playerInfo[roomName][playerId] = {};
  }

  createRoom(room) {
    if (!this.initialized) {
      this.playerInfo = {};
      this.playerToRoom = {};
      this.playerToMap = {};
      this.playerToSocket = {};
      this.playerNeedsInit = {};
      this.playerVideoMetric = {};
      this.playerOnVideoMetric = {};
      this.modMessages = {};
      this.roomSettings = {};
      this.initialized = true;
    }
    if (!(room in this.rooms)) {
      super.createRoom(room);
      this.playerInfo[room] = {};
      this.modMessages[room] = "";
    }
  }

  initializePlayer(map, playerId, room) {
    let startX = 0;
    let startY = 0;
    collisionMap[map].forEach((row, idxY) => {
      row.forEach((element, idxX) => {
        if (element === -1) {
          startX = idxX;
          startY = idxY;
        }
      });
    });

    var newPlayer = new Player(this.gameEngine, null, { position: new TwoVector(startX, startY) });
    newPlayer.currentDirection = directionMap['stand'];
    newPlayer.currentMap = map;
    if (map in characterMap) {
      newPlayer.characterId = characterMap[map][0];
    } else {
      newPlayer.characterId = 1;
    }
    newPlayer.playerId = playerId;
    this.assignObjectToRoom(newPlayer, room);
    this.gameEngine.addObjectToWorld(newPlayer);
  }

  setCharacterId(playerId, characterId) {
    if (!playerId) {
      return;
    }
    let myPlayer = this.gameEngine.world.queryObject({ playerId });
    if (!myPlayer) {
      return;
    }
    if (characterMap[myPlayer.currentMap].includes(characterId)) {
      myPlayer.characterId = characterId;
    }
  }

  onPlayerConnected(socket) {
    super.onPlayerConnected(socket);
    this.playerToSocket[socket.playerId] = socket;
    this.playerVideoMetric[socket.playerId] = {};
    this.playerOnVideoMetric[socket.playerId] = null;
    socket.on('roomId', (data) => {
      let room = data.roomId;
      let password = data.password;
      let authToken = data.userToken;

      let roomFirebase = room.replace("/", "\\");
      db.collection("rooms").doc(roomFirebase).get()
        .then(doc => {
          if (!doc.exists) {
            throw new Error('Room does not exist in db');
          }

          /* handle banned users */
          let bannedIPs = doc.data()["bannedIPs"] || {}
          if (bannedIPs[socket.handshake.address]) {
            console.log("rejecting banned user: ", socket.handshake.address);
            socket.conn.close();
            return;
          }

          let roomClosed = doc.data()["closed"]
          if (roomClosed === undefined) roomClosed = false;

          if (roomClosed) {
            socket.emit("roomClosed");
            socket.conn.close();
            return;
          }

          let map = doc.data()['map'];
          if (!map) {
            throw new Error('Map is not valid');
          }

          let roomSettings = doc.data()['settings'];
          if (roomSettings) {
            this.roomSettings[room] = roomSettings;
          }

          const initialize = () => {
            if (this.roomSettings[room] && "sizeLimit" in this.roomSettings[room] && this.playerInfo[room]) {
              if (Object.keys(this.playerInfo[room]).length >= this.roomSettings[room]["sizeLimit"]) {
                socket.emit("sizeLimit", this.roomSettings[room]["sizeLimit"]);
                return;
              }
            }

            let playerId = socket.playerId;
            this.playerToMap[playerId] = map;
            this.createRoom(room);
            this.assignPlayerToRoom(playerId, room);
            if (this.playerNeedsInit[playerId]) {
              this.initializePlayer(map, socket.playerId, room);
            }
            socket.emit("serverPlayerInfo", Object.assign({ "firstUpdate": true }, this.playerInfo[room]));
            socket.emit("modMessage", this.modMessages[room]);
            if (this.roomSettings[room]) {
              socket.emit("roomSettings", this.roomSettings[room]);
            }
          }
          
          if ("password" in doc.data()) {
            if (password && bcrypt.compareSync(password, doc.data()["password"])) {
              initialize();
            } else if (authToken) {
              auth.verifyIdToken(authToken)
                .then(decodedToken => {
                  let uid = decodedToken.uid;
                  return db.collection("rooms").doc(roomFirebase).collection("users").doc(uid).get();
                }).then(doc => {
                  if (doc.exists && doc.data()["hasAccess"]) {
                    initialize();
                  }
                }).catch(error => {
                  throw new Error("error verifying token" + error.message);
                });
            } else {
              throw new Error("incorrect password/ doesnt have access");
            }
          } else {
            initialize();
          }
        })
        .catch(err => {
          console.log("Error onplayerconnect", err);
        })
    })

    socket.on('initPlayer', () => {
      console.log("got initPlayer", socket.playerId);
      if (socket.playerId in this.playerToRoom) {
        this.initializePlayer(this.playerToMap[socket.playerId], socket.playerId, this.playerToRoom[socket.playerId]);
      } else {
        this.playerNeedsInit[socket.playerId] = true;
      }
    });

    socket.on("setCharacterId", (newId) => {
      this.setCharacterId(socket.playerId, newId);
    });

    socket.on('sendPrivatePrompt', data => {
      console.log("got sendPrivatePrompt");
      let room = data.room || "";
      let password = data.password || "";
      let roomFirebase = room.replace("/", "\\");
      if (!roomFirebase) return;
      db.collection("rooms").doc(roomFirebase).get()
        .then(doc => {
          if (!doc.exists) {
            return;
          }
          if (doc.data()["modPassword"] && bcrypt.compareSync(password, doc.data()["modPassword"])) {
            console.log("sendPrivatePrompt to ", roomFirebase);
            Object.keys(this.playerInfo[roomFirebase]).forEach(playerId => {
              this.playerToSocket[playerId].emit("createPrivatePrompt");
              this.playerToSocket[playerId].conn.close();
            });
          } else {
            console.log("incorrect password");
          }
        })
        .catch(err => {
          console.log(err);
        });
    });

    socket.on("playerInfo", (data) => {
      let curRoom = this.playerToRoom[socket.playerId];
      if (this.playerInfo[curRoom]) {
        Object.assign(this.playerInfo[curRoom][socket.playerId], data);
        Object.keys(this.playerInfo[curRoom]).forEach(playerId => {
          if (this.playerToRoom[playerId] === curRoom) {
            this.playerToSocket[playerId].emit("serverPlayerInfo", this.playerInfo[curRoom]);
          }
        });
      }
    });

    socket.on("videoMetric", (data) => {
      if (data.isStart) {
        this.playerVideoMetric[socket.playerId][data.playerId] = {
          "userId": data.userId,
          "time": data.time,
          "isProd": data.isProd,
        };
      } else {
        if (this.playerVideoMetric &&
          this.playerVideoMetric[socket.playerId] &&
          this.playerVideoMetric[socket.playerId][data.playerId] &&
          this.playerVideoMetric[socket.playerId][data.playerId].time) {
          let interactedTime = (data.time - this.playerVideoMetric[socket.playerId][data.playerId].time) / 1000;
          console.log("interacted for ", interactedTime);
          logAmpEvent(data.userId, "Exit Video Call", { "duration_seconds": interactedTime }, data.isProd);
          delete this.playerVideoMetric[socket.playerId][data.playerId];
        }
      }
    });

    socket.on("onVideoMetric", (data) => {
      if (data.isStart) {
        this.playerOnVideoMetric[socket.playerId] = {
          "userId": data.userId,
          "time": data.time,
          "isProd": data.isProd,
        };
      } else {
        if (this.playerOnVideoMetric &&
            this.playerOnVideoMetric[socket.playerId] &&
            this.playerOnVideoMetric[socket.playerId].time) {
            let interactedTime = (data.time - this.playerOnVideoMetric[socket.playerId].time) / 1000;
            logAmpEvent(data.userId, "Exit On Video Call", { "duration_seconds": interactedTime }, data.isProd);
            this.playerOnVideoMetric[socket.playerId] = null;
        }
      }
    });

    socket.on("chatMessage", (message, blockedMap) => {
      let playerId = socket.playerId;
      let myPlayer = this.gameEngine.world.queryObject({ playerId });
      let players = this.gameEngine.world.queryObjects({ instanceType: Player });
      let playersObj = {};
      players.forEach(player => {
        let dist = getPlayerDistance(myPlayer, player);
        if (dist) {
          playersObj = Object.assign(playersObj, dist);
        }
      })

      let curRoom = this.playerToRoom[socket.playerId];
      if (!this.playerInfo[curRoom]) {
        return;
      }
      let infoFromRoom = this.playerInfo[curRoom];
      if (!infoFromRoom) {
        return;
      }

      Object.keys(playersObj).forEach(id => {
        if (!(id in infoFromRoom)) {
          return;
        }
        let publicId = infoFromRoom[id].publicId;
        let blocked = !publicId || (publicId in blockedMap && blockedMap[publicId]);
        //if (playersObj[id] <= VIDEO_THRESHOLD && !blocked) {
        if (!blocked) {
          this.playerToSocket[id].emit("serverChatMessage", {
            id: playerId + "",
            message: message
          });
        }
      });
    });
  }

  onPlayerDisconnected(socketId, playerId) {
    super.onPlayerDisconnected(socketId, playerId);
    let player = this.gameEngine.world.queryObject({ playerId });
    if (player) {
      this.gameEngine.removeObjectFromWorld(player);
    }

    // Log video call ended metric
    let nowTime = new Date().getTime();
    // console.log(this.playerVideoMetric[playerId]);
    Object.keys(this.playerVideoMetric[playerId]).forEach(otherPlayerId => {
      let metricData = this.playerVideoMetric[playerId][otherPlayerId];
      let interactedTime = (nowTime - metricData.time) / 1000;
      // console.log("disconnect with ", otherPlayerId, "interacted for ", interactedTime);
      logAmpEvent(metricData.userId, "Exit Video Call", { "duration_seconds": interactedTime }, metricData.isProd);
    })
    if (this.playerOnVideoMetric[playerId]) {
      let metricData = this.playerOnVideoMetric[playerId];
      let interactedTime = (nowTime - metricData.time) / 1000;
      logAmpEvent(metricData.userId, "Exit On Video Call", { "duration_seconds": interactedTime }, metricData.isProd);
    }

    let curRoom = this.playerToRoom[playerId];
    if (this.playerInfo[this.playerToRoom[playerId]]) {
      delete this.playerInfo[curRoom][playerId];
    }

    if (this.playerInfo[curRoom]) {
      Object.keys(this.playerInfo[curRoom]).forEach(id => {
        if (this.playerToRoom[id] === curRoom) {
          this.playerToSocket[id].emit("serverPlayerInfo", this.playerInfo[curRoom]);
        }
      });
    }

    delete this.playerToSocket[playerId];
    delete this.playerToMap[playerId];
    delete this.playerToRoom[playerId];
    delete this.playerVideoMetric[playerId];
    console.log("disconnect", this.playerInfo);
  }

  async gameStatus() {
    try {
      let [cpu, memInfo] = await Promise.all([osu.cpu.usage(), osu.mem.used()])
      let gameStatus = {
        numPlayers: Object.keys(this.connectedPlayers).length,
        cpuPercentLoad: cpu,
        memLoad: memInfo.usedMemMb + "MB / " + memInfo.totalMemMb + "MB",
        roomCount: Object.keys(this.playerInfo).map(roomId => Object.keys(this.playerInfo[roomId]).length)
      }
      return gameStatus;
    }
    catch (err) {
      console.log("gameStatus err: ", err);
      return null;
    }
  }

  // moderation tools
  checkModPasswordInternal(room, password) {
    let roomFirebase = room.replace("/", "\\");
    if (!roomFirebase) return;
    return db.collection("rooms").doc(roomFirebase).get()
      .then(doc => {
        if (!doc.exists) {
          return Promise.reject();
        }
        if (doc.data()["modPassword"] && bcrypt.compareSync(password, doc.data()["modPassword"])) {
          return Promise.resolve(doc.data());
        }
        return Promise.reject();
      })
  }

  checkModPassword(room, password) {	
    let roomFirebase = room.replace("/", "\\");	
    return this.checkModPasswordInternal(room, password).then((roomData) => {	
      if (roomData.bannedIPs) {	
        return Object.values(roomData.bannedIPs);	
      }	
      return [];	
    })	
  };

  banPlayer(room, password, player) {
    let roomFirebase = room.replace("/", "\\");
    if (!this.playerToSocket[player]) throw Exception;
    return this.checkModPasswordInternal(room, password).then((roomData) => {
      let newBannedIPs = {
        ...roomData["bannedIPs"],
        [this.playerToSocket[player].handshake.address]: this.playerInfo[roomFirebase][player]
      }
      db.collection("rooms").doc(roomFirebase).update("bannedIPs", newBannedIPs);
      this.playerToSocket[player].conn.close();
      return Object.values(newBannedIPs);
    })
  }

  unbanPlayer(room, password, player) {
    let roomFirebase = room.replace("/", "\\");
    return this.checkModPasswordInternal(room, password).then((roomData) => {
      let banned = roomData["bannedIPs"];
      Object.keys(banned).forEach((ip) => {
        if (banned[ip]["publicId"] === player) {
          delete banned[ip];
        }
      })
      db.collection("rooms").doc(roomFirebase).update("bannedIPs", banned);
      return Object.values(banned);
    })
  }

  setRoomClosed(room, password, closed) {
    let roomFirebase = room.replace("/", "\\");
    return this.checkModPasswordInternal(room, password).then((_) => {
      db.collection("rooms").doc(roomFirebase).update({
        "closed": !!closed
      });
      if (closed) {
        Object.keys(this.playerInfo[roomFirebase]).forEach(playerId => {
          this.playerToSocket[playerId].emit("roomClosed");
          this.playerToSocket[playerId].conn.close();
        });
      }
      return;
    });
  }

  changeModPassword(room, password, newPassword) {
    let roomFirebase = room.replace("/", "\\");
    return this.checkModPasswordInternal(room, password).then(() => {
      return db.collection("rooms").doc(roomFirebase).update({
        "modPassword": bcrypt.hashSync(newPassword, 10)
      })
    });
  }

  changePassword(room, password, newPassword) {
    let roomFirebase = room.replace("/", "\\");
    return this.checkModPasswordInternal(room, password).then(() => {
      if (newPassword) {
        return db.collection("rooms").doc(roomFirebase).update({
          "password": bcrypt.hashSync(newPassword, 10)
        })
      } else {
        // remove password
        return db.collection("rooms").doc(roomFirebase).update({
          "password": firebase.firestore.FieldValue.delete()
        })
      }
    });
  }

  setModMessage(room, password, message) {
    return this.checkModPasswordInternal(room, password).then(() => {
      Object.keys(this.playerInfo[room]).forEach(playerId => {
        if (this.playerToRoom[playerId] === room) {
          this.playerToSocket[playerId].emit("modMessage", message);
          this.modMessages[room] = message;
        }
      });
    });
  }
}