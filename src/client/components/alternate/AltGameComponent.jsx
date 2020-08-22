import React, { useState, useEffect, useRef } from 'react';

import axios from 'axios';

import { VIDEO_THRESHOLD } from '../../../common/constants';
import initClientEngine from '../../initClientEngine';

import { getRoomFromPath } from '../../utils';
import { localPreferences } from '../../LocalPreferences';

import AltRoomTitle from './AltRoomTitle.jsx';
import GameCanvas from './../GameCanvas.jsx';
import AltGameVideosContainer from './AltGameVideosContainer.jsx';
import AltGameNamesContainer from './AltGameNamesContainer.jsx';
import AltGameChangeCharacter from './AltGameChangeCharacter.jsx';
import AltGameChat from './AltGameChat.jsx';

import './AltGameComponent.css';

import ModContext from './../ModContext.jsx';
import { CHAT_LIMIT } from '../../constants';

export default function AltGameComponent(props) {
  const [ownImage, setOwnImage] = useState(null);
  const [profPics, setProfPics] = useState({});
  const [modPassword, setModPassword] = useState("");
  const [modPasswordCorrect, setModPasswordCorrect] = useState(false);
  const [modMessage, setModMessage] = useState("");
  const [banned, setBanned] = useState([]);
  const [disconnected, setDisconnected] = useState(false);

  const [playerInfoMap, setPlayerInfoMap] = useState({});
  const [playerVideoMap, setPlayerVideoMap] = useState({});
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [hasVideos, setHasVideos] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [sizeLimit, setSizeLimit] = useState(null);
  const [modResult, setModResult] = useState({});
  const [currentMap, setCurrentMap] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [videoThreshold, setVideoThreshold] = useState(VIDEO_THRESHOLD);
  const [hasScreenshare, setHasScreenshare] = useState(false);
  const [hasFrameURL, setHasFrameURL] = useState("");
  
  const [blocked, setBlocked] = useState({});
  const [clientInitialized, setClientInitialized] = useState(false);

  const clientEngineRef = useRef(null);
  const prevRangeVideos = useRef([]);

  // Gotta be a better way to do this
  const blockedRef = useRef({});
  blockedRef.current = blocked;

  useEffect(() => {
    initClientEngine().then(clientEngine => {
      clientEngine.password = props.password;
      clientEngine.eventProvider.on("updatePlayerMap", (data) => {
        setPlayerInfoMap(data);
      });
      clientEngine.eventProvider.on("updateVideos", (data) => {
        setPlayerVideoMap(data);
      });
      clientEngine.eventProvider.on("initVideos", (playerId) => {
        setMyPlayerId(playerId);
        setHasVideos(true);
        clientEngine.socket.on("disconnect", () => {
          setDisconnected(true);
        });
      });
      clientEngine.eventProvider.on("roomClosed", () => {
        setRoomClosed(true);
      })
      clientEngine.eventProvider.on("mapChanged", (currentMap) => {
        setCurrentMap(currentMap);
      })
      clientEngine.eventProvider.on("characterChanged", (characterId) => {
        setCharacterId(characterId);
      });
      clientEngine.eventProvider.on("modMessage", (message) => {
        setModMessage(message);
      });
      clientEngine.eventProvider.on("settings", settings => {
        if ("videoThreshold" in settings) {
          setVideoThreshold(settings["videoThreshold"]);
        }
        if ("hasScreenshare" in settings) {
          setHasScreenshare(settings["hasScreenshare"]);
        }
        if ("hasFrameURL" in settings) {
          setHasFrameURL(settings["hasFrameURL"]);
        }
        if ("hasAlternateLayout" in settings) {
          props.setHasAlternateLayout(settings["hasAlternateLayout"]);
        }
      });
      clientEngine.eventProvider.on("sizeLimit", limit => {
        setSizeLimit(limit);
      });

      clientEngine.start();

      clientEngineRef.current = clientEngine;
      setClientInitialized(true);
    });

    return () => {
      if (clientEngineRef.current) {
        clientEngineRef.current.disconnect();
      }
    }
  }, []);

  useEffect(() => {
    setBlocked(localPreferences.get("blocked") || {});
    let handle = localPreferences.on("blocked", val => {
      setBlocked({ ...val });
      setChatMessages(prevChatMessages => {
        let newChatMessages = [].concat(prevChatMessages);
        newChatMessages = newChatMessages.filter(chatPayload => {
          let publicId = playerInfoMap[chatPayload.id].publicId;
          return publicId && !(publicId in val && val[publicId]);
        });
        return newChatMessages;
      })
    });
    return () => {
      localPreferences.remove("blocked", handle);
    }
  }, [playerInfoMap]);

  useEffect(() => {
    if (!clientInitialized) {
      return;
    }

    let handle = clientEngineRef.current.eventProvider.on("serverChatMessage",
      (messagePayload) => {
      console.log("in serverchatmessage", messagePayload);
      if (!playerInfoMap || !playerInfoMap[messagePayload.id]) {
        return;
      }

      let publicId = playerInfoMap[messagePayload.id].publicId;
      if (publicId && !(publicId in blocked && blocked[publicId])) {
        setChatMessages(prevChatMessages => {
          let newChatMessages = [].concat(prevChatMessages);
          newChatMessages.push(messagePayload);
          if (newChatMessages.length > CHAT_LIMIT) {
            newChatMessages.shift();
          }
          return newChatMessages;
        });
      }
    });
    return () => {
      clientEngineRef.current.eventProvider.remove("serverChatMessage", handle);
    }
  }, [playerInfoMap, blocked, clientInitialized]);

  useEffect(() => {
    if (props.inGame && clientInitialized) {
      clientEngineRef.current.initKeyboardControls();
      clientEngineRef.current.initPlayer();
    }
  }, [props.inGame, clientInitialized])

  useEffect(() => {
    if (ownImage) {
      setPicOfId(myPlayerId, ownImage);
    }
  }, [ownImage]);

  useEffect(() => {
    if (playerVideoMap && playerVideoMap["playerToDist"] && clientEngineRef.current) {
      let inRangeIds = Object.keys(playerVideoMap["playerToDist"]).filter(x => {
        return playerVideoMap["playerToDist"][x] <= videoThreshold && x !== myPlayerId + "";
      });
      let gainedVideos = inRangeIds.filter(x => {
        return !(prevRangeVideos.current.includes(x));
      });
      let lostVideos = prevRangeVideos.current.filter(x => {
        return !(inRangeIds.includes(x));
      });

      let curTime = new Date().getTime();
      gainedVideos.forEach(playerId => {
        clientEngineRef.current.sendVideoMetric(playerId, curTime, true);
      });
      lostVideos.forEach(playerId => {
        clientEngineRef.current.sendVideoMetric(playerId, curTime, false);
      });

      if (prevRangeVideos.current.length === 0 && inRangeIds.length > 0) {
        clientEngineRef.current.sendOnVideoMetric(curTime, true);
      } else if (prevRangeVideos.current.length > 0 && inRangeIds.length === 0) {
        clientEngineRef.current.sendOnVideoMetric(curTime, false);
      }

      prevRangeVideos.current = inRangeIds;
    }
  }, [playerVideoMap]);

  function changeCharacterId(id) {
    clientEngineRef.current.setCharacterId(id);
  }

  function sendChatMessage(message) {
    clientEngineRef.current.sendChatMessage(message, blockedRef.current);
  }

  function setPicOfId(id, imageData) {
    console.log("set pic of id", id, imageData);
    let canvas = document.getElementById("get-picture-canvas");
    if (canvas) {
      let ctx = canvas.getContext('2d');
      if (imageData.width > imageData.height) {
        canvas.width = imageData.height;
        canvas.height = imageData.height;
        ctx.putImageData(
          imageData,
          0, 0, 0, 0,
          imageData.height, imageData.height);
      } else {
        canvas.width = imageData.width;
        canvas.height = imageData.width;
        ctx.putImageData(imageData, 0, parseInt((imageData.height - imageData.width) / 2), 0, 0);
      }

      setProfPics((prevProfPics) => {
        let newProfPics = Object.assign({}, prevProfPics);
        newProfPics[id] = canvas.toDataURL();
        return newProfPics
      });
    }
  }

  function gameServerAPIURL() {
    let gameServerURL = new URL(clientEngineRef.current.options.serverURL);
    let protocol = "https:";
    if (gameServerURL.hostname === "localhost") {
      protocol = "http:"
    }
    return protocol + gameServerURL.href.substr(gameServerURL.protocol.length)
  }

  function checkModPassword() {
    axios.post(gameServerAPIURL() + 'checkModPassword', {
      room: getRoomFromPath(),
      password: modPassword,
    }).then((res) => {
      setModPasswordCorrect(true);
      setBanned(res.data);
      setModResult({success: true});
    }).catch(() => {
      setModResult({failure: true});
    })
  }

  function banPlayer(playerId) {
    axios.post(gameServerAPIURL() + 'banPlayer', {
      room: getRoomFromPath(),
      password: modPassword,
      player: playerId
    }).then((res) => {
      setBanned(res.data);
      setModResult({success: true});
    }).catch(() => {
      setModResult({failure: true});
    })
  }

  function unbanPlayer(playerId) {
    axios.post(gameServerAPIURL() + 'unbanPlayer', {
      room: getRoomFromPath(),
      password: modPassword,
      player: playerId
    }).then((res) => {
      setBanned(res.data);
      setModResult({success: true});
    }).catch(() => {
      setModResult({failure: true});
    })
  }
  
  function setRoomClosedServer(closed) {
    axios.post(gameServerAPIURL() + 'setRoomClosed', {
      room: getRoomFromPath(),
      password: modPassword,
      closed: closed
    }).then(() => {
      if (!closed) window.location.reload();
    }).catch(() => {
      setModResult({failure: true});
    })
  }
  
  function changeModPassword(newPassword) {
    axios.post(gameServerAPIURL() + 'changeModPassword', {
      room: getRoomFromPath(),
      password: modPassword,
      newPassword: newPassword
    }).then(() => {
      setModResult({success: true});
      window.location.reload();
    }).catch(() => {
      setModResult({failure: true});
    })
  }

  function changePassword(newPassword) {
    axios.post(gameServerAPIURL() + 'changePassword', {
      room: getRoomFromPath(),
      password: modPassword,
      newPassword: newPassword
    }).then(() => {
      setModResult({success: true});
    }).catch(() => {
      setModResult({failure: true});
    })
  }

  function changeModMessage(message) {
    axios.post(gameServerAPIURL() + 'setModMessage', {
      room: getRoomFromPath(),
      password: modPassword,
      message: message
    }).then(() => {
      setModResult({success: true});
    }).catch(() => {
      setModResult({failure: true});
    })
  }

  const modContext = {
    modPasswordCorrect: modPasswordCorrect,
    banned: banned,
    result: modResult,
    setModPassword: setModPassword,
    checkModPassword: checkModPassword,
    banPlayer: banPlayer,
    unbanPlayer: unbanPlayer,
    setRoomClosed: setRoomClosedServer,
    changeModPassword: changeModPassword,
    changePassword: changePassword,
    setModMessage: changeModMessage,
  }

  let videoComponent = null;
  if (hasVideos &&
    myPlayerId !== null &&
    playerInfoMap &&
    playerVideoMap &&
    playerVideoMap["playerToDist"]) {
      let filteredDistMap = {};
      let shallowCloneMap = Object.assign({}, playerVideoMap);
      Object.keys(playerVideoMap["playerToDist"]).forEach(playerId => {
        if (playerVideoMap["playerToDist"][playerId] <= videoThreshold) {
          filteredDistMap[playerId] = playerVideoMap["playerToDist"][playerId];
        }
      });
      shallowCloneMap["playerToDist"] = filteredDistMap;

      videoComponent =
        <AltGameVideosContainer
          myPlayerId={myPlayerId}
          playerInfoMap={playerInfoMap}
          playerVideoMap={shallowCloneMap}
          ownImage={ownImage}
          setOwnImage={setOwnImage}
          setPicOfId={setPicOfId}
          blocked={blocked}
          videoThreshold={videoThreshold}
          hasScreenshare={hasScreenshare}
        />;
  }

  let closedRoomScreen = (
    <div className="fullpage-message">
      <p>This room is currently closed. Come back later!</p>
    </div>
    );
  let roomSizeReachedScreen = (
    <div className="fullpage-message">
      <p>This room has hit its set capacity of {sizeLimit}, check back later!</p>
    </div>
    );
  let desktopOnlyScreen = (
    <div className="fullpage-message">
      <p>We don't support mobile right now. Please visit us on desktop!</p>
    </div>
    );
  
  let header = (
    <div style={{height: "20px", margin: "20px auto", width: "200px"}}>
      <AltRoomTitle
        isPrivate={props.isPrivate}
        closed={roomClosed}
        playerInfoMap={playerInfoMap}
        modMessage={modMessage}
      />
    </div>
    );


  let gameCanvas = (
      <div style={{position: "absolute", left: "100px", top: "0px"}}>
        <canvas id="canvas" width="600" height="400"></canvas>
      </div>
    );

  let characterSelection = (
      <div style={{position: "absolute", left: "100px", top: "-13px"}}>
        <AltGameChangeCharacter
          setCharacterId={changeCharacterId}
          characterId={characterId}
          currentMap={currentMap}
        />
      </div>
    );

  let nameList = (
      <div style={{position: "absolute", left: "0px", top: "100px"}}>
        <AltGameNamesContainer
          playerInfoMap={playerInfoMap}
          playerVideoMap={playerVideoMap}
          profPics={profPics}
        />
      </div>
    );

  let embeddedFrame = (
      <div style={{position: "absolute", left: "0px", top: "420px"}}>
        <iframe 
              style={{borderRadius: "20px", width: "700px", height: "400px"}}
              src={hasFrameURL}
        />

      </div>
    );

  let userStreams = (
      <div style={{position: "absolute", left: "10px", top: "0px", 
                  width: "800px", height: "400px"}}>
        {videoComponent}
      </div>
    );

  let chat = (
      <div style={{position: "absolute", left: "10px", top: "420px"}}>
        <AltGameChat
          sendChatMessage={sendChatMessage}
          chatMessages={chatMessages}
          playerInfoMap={playerInfoMap}
        />
      </div>
    );

  let gameScreen = (
    <>
      {header}
      <div style={{display: "flex", width: "1400px", height: "820px"}}>
        
        <div className="alt-left-column" style={{position: "relative", width: "700px"}}>
          {gameCanvas}
          {nameList}
          {characterSelection}
          {embeddedFrame}
        </div>
        <div className="alt-right-column" style={{position: "relative", width: "700px"}}>
          {userStreams}
          {chat}
        </div>
        
      </div>
    </>
    );

  return (
    <div>
      <div className="mobileHide">
        {roomClosed ?
          {closedRoomScreen}
          :
          (
            sizeLimit ?
            {roomSizeReachedScreen}
            :
            <ModContext.Provider value={modContext}>
              {gameScreen}
            </ModContext.Provider>
          )
        }
      </div>
      <div className="mobileShow">
        {desktopOnlyScreen}
      </div>    
    </div>
  );
}