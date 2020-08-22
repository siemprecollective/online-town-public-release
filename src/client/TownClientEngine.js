import { ClientEngine } from 'lance-gg';
import { getRoomFromPath, isPublic, isProd, getSubDomain } from './utils';
import { drawInit, update, updatePlayerMap, publicUpdate, setShowNames }  from './drawCanvas';
import { updateSound } from './environmentSounds';
import { PUBLIC_MAP, auth } from './constants';
import { localPreferences } from './LocalPreferences';
import { updateRoomVisit, updateRoomData } from './userData';
import newKeyboardControls from './NonStealingKeyboardControls';
import { getPlayerDistance } from '../common/utils';
import { Player } from '../common/gameObjects';
import { collisionMap } from '../common/maps';
import EventProvider from '../common/EventProvider';

import deepEqual from 'fast-deep-equal';

export default class TownClientEngine extends ClientEngine {
  constructor(gameEngine, inputOptions, renderer) {
    super(gameEngine, inputOptions, renderer);

    this.playerVideoMap = {};

    console.log(window.location.pathname);
    this.roomId = getRoomFromPath();
    if (!isPublic()) {
      this.videosEnabled = true;
    } else {
      this.isPublic = true;
    }

    gameEngine.on('client__rendererReady', this.clientSideInit.bind(this));
    gameEngine.on('client__draw', this.clientSideDraw.bind(this));

    this.eventProvider = new EventProvider([]);

    let roomsData = localPreferences.get("rooms");
    if (!roomsData || !(getRoomFromPath() in roomsData)) {
      updateRoomData(getRoomFromPath(), {"name": ""});
    }
    updateRoomVisit(getRoomFromPath());
    localPreferences.on("rooms", (data) => {
      let thisRoomData = data[getRoomFromPath()];
      if (thisRoomData) {
        this.sendPlayerInfo(thisRoomData);
      }
    })

    this.currentMap = null;
    this.characterId = null;

    /*
      playerInfo schema:
      {
        "publicId": ""
        "name": "blah
      }
    */
    // TODO this is hack
    window.sendPrivatePrompt = this.sendPrivatePrompt.bind(this);
  }

  connect() {
    return super.connect().then(() => {
      let data = { roomId: this.roomId };
      if (this.password) {
        data["password"] = this.password;
      }
      let tokenPromise = Promise.resolve(null);
      if (auth.currentUser) {
        // Is it causing more latency to do force refresh all the time?
        tokenPromise = auth.currentUser.getIdToken(true);
      }
      tokenPromise.then(token => {
        if (token) {
          data["userToken"] = token;
        }
        this.socket.emit("roomId", data);
      })
      .catch(err => {
        console.error("Error with token promise", err);
      });

      this.socket.on("serverPlayerInfo", (data) => {
        if ("firstUpdate" in data) {
          console.log("firstupdate");
          let id = localPreferences.get("user")["id"];
          let firstUpdate = localPreferences.get("rooms")[getRoomFromPath()];
          this.sendPlayerInfo(Object.assign(firstUpdate, {"publicId": id}));
          delete data["firstUpdate"];
        }
        updatePlayerMap(data);
        this.eventProvider.fire("updatePlayerMap", data);
      });

      this.socket.on("createPrivatePrompt", () => {
        let privatePrompt = document.getElementById("create-private-prompt");
        privatePrompt.hidden = false;
      });

      this.socket.on("roomClosed", () => {
        this.eventProvider.fire("roomClosed");
      })

      this.socket.on("serverChatMessage", (data) => {
        this.eventProvider.fire("serverChatMessage", data);
      });

      this.socket.on("modMessage", message => {
        this.eventProvider.fire("modMessage", message);
      });

      this.socket.on("roomSettings", settings => {
        if (settings.showNames !== undefined) {
          setShowNames(settings.showNames)
        }
        this.eventProvider.fire("settings", settings);
      });

      this.socket.on("sizeLimit", limit => {
        this.eventProvider.fire("sizeLimit", limit);
      })

      this.socket.on("")

      if (this.pendingInitPlayer) {
        this.initPlayer();
      }
    })
  }

  initPlayer() {
    if (!this.socket) {
      this.pendingInitPlayer = true;
      return;
    }
    
    this.socket.emit("initPlayer", getRoomFromPath());
    this.videosEnabled = true;
    this.playerInitialized = true;
    this.pendingInitPlayer = false;
  }

  sendPlayerInfo(info) {
    console.log("sendplayerinfo", info);
    this.socket.emit("playerInfo", info);
  }

  sendVideoMetric(playerId, time, isStart) {
    // time is milliseconds since epoch
    // isStart is if it's the start of a call, or end of call
    this.socket.emit("videoMetric", {
      "userId": localPreferences.get("user")["id"],
      "playerId": playerId,
      "time": time,
      "isStart": isStart,
      "isProd": isProd()
    });
  }

  sendOnVideoMetric(time, isStart) {
    // If the player was on video with anyone
    this.socket.emit("onVideoMetric", {
      "userId": localPreferences.get("user")["id"],
      "time": time,
      "isStart": isStart,
      "isProd": isProd()
    });
  }

  ///////////////////////////////////////////////////////
  //                                                   //
  //                Game Logic Code:                   //
  //                                                   //
  ///////////////////////////////////////////////////////

  initKeyboardControls() {
    this.gameEngine.controls = newKeyboardControls(this);
    this.gameEngine.controls.bindKey(['up', 'w'], 'up', { repeat: true } );
    this.gameEngine.controls.bindKey(['down', 's'], 'down', { repeat: true } );
    this.gameEngine.controls.bindKey(['left', 'a'], 'left', { repeat: true } );
    this.gameEngine.controls.bindKey(['right', 'd'], 'right', { repeat: true } );
    this.gameEngine.controls.bindKey('space', 'space', { repeat: false } );
    this.gameEngine.controls.bindKey('k', 'k', { repeat: false } );
  }

  clientSideInit() {
    drawInit();
  }

  sendInput(input, inputOptions) {
    super.sendInput(input, inputOptions)
    if (input === "k") {
      setShowNames()
    }
  }

  clientSideDraw() {
    let playerId = this.gameEngine.playerId;
    let myPlayer = this.gameEngine.world.queryObject({ playerId });
    let players = this.gameEngine.world.queryObjects({ instanceType: Player });

    if (myPlayer) {
      if (myPlayer.currentMap !== this.currentMap) {
        this.currentMap = myPlayer.currentMap;
        this.eventProvider.fire("mapChanged", this.currentMap);
      }
      if (myPlayer.characterId !== this.characterId) {
        this.characterId = myPlayer.characterId;
        this.eventProvider.fire("characterChanged", this.characterId);
      }
    }

    if (this.isPublic && !this.playerInitialized) {
      players = players.filter((tempPlayer) => {
        return tempPlayer.currentMap === PUBLIC_MAP[getSubDomain()];
      });
      publicUpdate(players);
    } else {
      if (!myPlayer) {
        return;
      }
      players = players.filter((tempPlayer) => {
        return myPlayer.currentMap === tempPlayer.currentMap;
      });
          
      updateSound(myPlayer);
      update(myPlayer, players);
    }

    if (this.videosEnabled && this.videosInitialized) {
      let inRangePlayers = players.map(player => getPlayerDistance(myPlayer, player)).filter(obj => obj);
      let playersObj = {};
      inRangePlayers.forEach(obj => {
        playersObj = Object.assign(playersObj, obj);
      });

      let announcerPlayer = this.getAnnouncerPlayer(players);
      let playerVideoMap = {
        "playerToDist": playersObj,
        "announcerPlayer": (announcerPlayer !== null ? announcerPlayer + "" : null)
      };
      if (!deepEqual(playerVideoMap, this.playerVideoMap)) {
        this.playerVideoMap = playerVideoMap;
        this.eventProvider.fire("updateVideos", this.playerVideoMap);
      }
    }

    if (this.videosEnabled && !isNaN(playerId) && !this.videosInitialized) {
      this.videosInitialized = true;
      this.eventProvider.fire("initVideos", playerId + "");
    }
  }

  getAnnouncerPlayer(players) {
    for (let i = 0; i < players.length; i++) {
      if (collisionMap[players[i].currentMap][players[i].position.y][players[i].position.x] === 2) {
        return players[i].playerId;
      }
    }
    return null;
  }

  sendPrivatePrompt(password, room) {
    this.socket.emit("sendPrivatePrompt", {
      "password": password,
      "room": room,
    });
  }

  setCharacterId(characterId) {
    this.socket.emit("setCharacterId", characterId);
  }

  sendChatMessage(message, blockedMap) {
    this.socket.emit("chatMessage", message, blockedMap);
  }
}
