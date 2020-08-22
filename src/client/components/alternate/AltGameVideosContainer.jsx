import React, { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';

import { amplitudeInstance } from '../../amplitude';
import { getRoomFromPath } from '../../utils';
import { updateUserData } from '../../userData';

import GameVideo from '../GameVideo.jsx';
import GameSelfVideo from '../GameSelfVideo.jsx';
import GameScreenVideo from '../GameScreenVideo.jsx';

import './AltGameVideosContainer.css';

let DEV_ENDPOINT = `BLANK`;
let PROD_ENDPOINT = `BLANK`;

let MAX_VIDEOS_DEFAULT = 10000;

import { localPreferences } from '../../LocalPreferences.js';

export default function AltGameVideosContainer(props) {
  const [isError, setIsError] = useState(false);
  const [ownVideoEnabled, setOwnVideoEnabled] = useState(true);
  const [ownAudioEnabled, setOwnAudioEnabled] = useState(true);
  const [streamMap, setStreamMap] = useState({});
  const [screenStreamMap, setScreenStreamMap] = useState({});
  const [ownStreamMap, setOwnStreamMap] = useState({});
  const [otherVideoEnabled, setOtherVideoEnabled] = useState({});
  const [otherAudioEnabled, setOtherAudioEnabled] = useState({});
  const [maxVideos, setMaxVideos] = useState(MAX_VIDEOS_DEFAULT);
  const [isScreensharing, setIsScreensharing] = useState(false);

  const peers = useRef({});
  const imageRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    // IT IS VERY IMPORTANT THAT IF YOU CHANGE THIS YOU KNOW WHAT YOU'RE DOING
    // MAKE SURE TO THOROUHGLY TEST _ANY_ CHANGES
    // IT'S POSSIBLE TO MAKE VIDEO MUTING NOT WORK BUT LOOK LIKE IT WORKS BY DOING
    // THIS WRONG
    let closestIds = Object.keys(props.playerVideoMap["playerToDist"])
      .filter(playerId => {
        return (playerId !== props.myPlayerId + "") && (playerId !== props.playerVideoMap["announcerPlayer"] + "")
      })
      .sort((a, b) => {
        return props.playerVideoMap["playerToDist"][a] < props.playerVideoMap["playerToDist"][b] ? -1 : 1;
      })
      .slice(0, maxVideos);
    let inStreamingDistance = (id) => {
      if (id === props.playerVideoMap["announcerPlayer"]) {
        return true;
      }
      if (props.myPlayerId === props.playerVideoMap["announcerPlayer"]) {
        return true;
      }
      if (!(closestIds.includes(id))) {
        return false;
      }
      if (id in props.playerVideoMap["playerToDist"]) {
        return props.playerVideoMap["playerToDist"][id] <= props.videoThreshold;
      } else {
        return false;
      }
    }
    Object.keys(streamMap).forEach((id) => {
      let persistentId = id in props.playerInfoMap ? props.playerInfoMap[id]["publicId"] : "NOTANID"
      let idBlocked = persistentId in props.blocked ? props.blocked[persistentId] : false;
      let idVideoEnabled = id in otherVideoEnabled ? otherVideoEnabled[id] : true;
      let idAudioEnabled = id in otherAudioEnabled ? otherAudioEnabled[id] : true;
      streamMap[id].getVideoTracks().forEach((track) => {
        track.enabled = !idBlocked && idVideoEnabled && inStreamingDistance(id);
      })
      streamMap[id].getAudioTracks().forEach((track) => {
        track.enabled = !idBlocked && idAudioEnabled && inStreamingDistance(id);
      })
    });
    Object.keys(ownStreamMap).forEach((id) => {
      let persistentId = id in props.playerInfoMap ? props.playerInfoMap[id]["publicId"] : "NOTANID"
      let idBlocked = persistentId in props.blocked ? props.blocked[persistentId] : false;
      if (id === props.myPlayerId) {
        // what new connections see
        ownStreamMap[id].getVideoTracks().forEach((track) => {
          track.enabled = ownVideoEnabled;
        })
        ownStreamMap[id].getAudioTracks().forEach((track) => {
          track.enabled = ownAudioEnabled;
        })
      } else {
        ownStreamMap[id].getVideoTracks().forEach((track) => {
          track.enabled = ownVideoEnabled && !idBlocked && inStreamingDistance(id);
        })
        ownStreamMap[id].getAudioTracks().forEach((track) => {
          track.enabled = ownAudioEnabled && !idBlocked && inStreamingDistance(id);
        })
      }
    });
  }, [
    maxVideos, props.playerVideoMap, props.playerInfoMap,
    props.myPlayerId, props.blocked, props.videoThreshold,
    streamMap, ownStreamMap,
    ownVideoEnabled, ownAudioEnabled,
    otherVideoEnabled, otherAudioEnabled
  ])

  useEffect(() => {
    if (props.ownImage && props.ownImage.data) {
      Object.keys(peers.current).forEach(peerId => {
        console.log(peers.current[peerId]._channel.readyState);
        if (peers.current[peerId] && peers.current[peerId].connected) {
          peers.current[peerId].send(props.ownImage.data);
        }
      });
      imageRef.current = props.ownImage.data;
    }
  }, [props.ownImage]);

  useEffect(() => {
    let playerId = "#" + props.myPlayerId;
    let mediaSettings = {
      audio: { latency: 0.03, echoCancellation: true },
      video: { width: 150, facingMode: "user" }
    };

    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        let connectDeviceId = "";
        devices = devices.filter(device => device.kind === "videoinput");
        let notIR = devices.filter(device => !(device.label.includes("IR")));
        if (notIR.length < devices.length) {
          let frontDevices = notIR.filter(device => device.label.includes("Front"));
          if (frontDevices.length > 0) {
            connectDeviceId = frontDevices[0].deviceId;
          } else {
            connectDeviceId = notIR[0].deviceId;
          }
        }

        if (connectDeviceId) {
          mediaSettings.video = Object.assign(mediaSettings.video, { deviceId: connectDeviceId });
        }
        return navigator.mediaDevices.getUserMedia(mediaSettings);
      })
      .then(stream => {
        initialize(stream);
        amplitudeInstance.logEvent("getUserMedia", {
          "type": "success",
          "message": "Success"
        });
      })
      .catch(err => {
        console.log('media devices err', err.toString());
        amplitudeInstance.logEvent('getUserMedia', {
          'type': 'error',
          'message': err.toString()
        });
        setIsError(true);
      })

    function initialize(stream) {
      const ws = new WebSocket(window.location.origin.includes("localhost") ? DEV_ENDPOINT : PROD_ENDPOINT);
      ws.isConnected = false;

      setOwnStreamMap((prevOwnStreamMap) => {
        let newOwnStreamMap = Object.assign({}, prevOwnStreamMap);
        newOwnStreamMap[props.myPlayerId] = stream;
        return newOwnStreamMap;
      });

      let pendingSends = [];
      ws.addEventListener("open", () => {
        console.log("websocket open");
        ws.isConnected = true;
        ws.send(JSON.stringify({
          "event": "identify",
          "data": playerId,
          "room": getRoomFromPath()
        }));
        pendingSends.forEach(send => {
          ws.send(send);
        });
        pendingSends = [];
      });

      ws.addEventListener("message", json => {
        let data = JSON.parse(json.data);
        console.log("message", data);
        if (data.event === "handshake") {
          if (data.from in peers.current) {
            peers.current[data.from].signal(JSON.parse(data.data));
          } else {
            peers.current[data.from] = createPeer(data.from, false);
            peers.current[data.from].signal(JSON.parse(data.data));
          }
        } else if (data.event === "connect") {
          peers.current[data.id] = createPeer(data.id, true);
        }
      });

      function createPeer(id, initiator) {
        let idIdx = parseInt(id.substring(1));
        let streamClone = stream.clone();
        setOwnStreamMap((prevOwnStreamMap) => {
          let newOwnStreamMap = Object.assign({}, prevOwnStreamMap);
          newOwnStreamMap[idIdx] = streamClone;
          return newOwnStreamMap;
        });
       
        let streams = [];
        if (streamClone) streams.push(streamClone);
        if (screenStreamRef.current) streams.push(screenStreamRef.current);

        let peer = new Peer({
          initiator: initiator,
          trickle: false,
          reconnectTimer: 100,
          iceTransportPolicy: 'relay',
          config: {
            iceServers: [
              { urls: 'BLANK' },
              {
                urls: 'BLANK',
                username: 'user',
                credential: 'credential',
              }
            ]
          },
          streams: streams
        })

        peer.on('signal', data => {
          if (ws.isConnected) {
            ws.send(JSON.stringify({
              "event": "handshake",
              "to": id,
              "from": playerId,
              "data": JSON.stringify(data),
              "room": getRoomFromPath()
            }));
          } else {
            pendingSends.push(JSON.stringify({
              "event": "handshake",
              "to": id,
              "from": playerId,
              "data": JSON.stringify(data),
              "room": getRoomFromPath()
            }));
          }
        })

        peer.on('data', data => {
          console.log('got data');
          if (typeof (data) === "object") {
            // Assumes that the width is 150
            let height = parseInt(data.length / (150 * 4));
            let newImageData = new ImageData(Uint8ClampedArray.from(data), 150, height);
            props.setPicOfId(idIdx, newImageData);
          }
        })

        peer.on('error', err => console.log('error', err));

        peer.on('connect', () => {
          console.log('connect', imageRef.current);
          if (imageRef.current) {
            peer.send(imageRef.current);
          }
        });

        peer.on('stream', stream => {
          if (peer._remoteStreams.length === 1) {
            setStreamMap((prevStreamMap) => {
              let newStreamMap = Object.assign({}, prevStreamMap);
              newStreamMap[idIdx] = stream;
              return newStreamMap;
            });
          } else {
            setScreenStreamMap((prevStreamMap) => {
              let newStreamMap = Object.assign({}, prevStreamMap);
              newStreamMap[idIdx] = stream;
              return newStreamMap;
            });
            stream.addEventListener('removetrack', () => {
              setScreenStreamMap((prevStreamMap) => {
                let newStreamMap = Object.assign({}, prevStreamMap);
                delete newStreamMap[idIdx];
                return newStreamMap;
              });
            })
          }
        })

        return peer;
      }
    }
  }, []);

  function startScreenshare() {
    navigator.mediaDevices.getDisplayMedia({
      video: true
    }).then((stream) => {
      setIsScreensharing(true);
      screenStreamRef.current = stream;
      Object.keys(peers.current).forEach(id => {
        let peer = peers.current[id];
        peer.addStream(stream);
      })
    }).catch(() => {
      console.log("screenshare error")
    })
  }

  function stopScreenshare() {
    setIsScreensharing(false);
    let stream = screenStreamRef.current;
    screenStreamRef.current = null;
    if (!stream) return;
    stream.getVideoTracks()[0].stop();
    Object.keys(peers.current).forEach(id => {
      let peer = peers.current[id];
      peer.removeStream(stream);
    });
  }

  function getGameVideo(playerId) {
    let persistentId = playerId in props.playerInfoMap ? props.playerInfoMap[playerId]["publicId"] : "NOTANIDSET"
    const setBlocked = (blocked) => {
      let blockedList = localPreferences.get("blocked") || {};
      console.log(persistentId, blockedList);
      if (!blocked && persistentId in blockedList) {
        console.log("unblock");
        delete blockedList[persistentId];
      } else if (blocked) {
        blockedList[persistentId] = true;
      }
      updateUserData({"blocked": blockedList});
    }

    let distance = props.playerVideoMap["playerToDist"][playerId];
    if (playerId === props.playerVideoMap["announcerPlayer"]) {
      distance = 0;
    }

    return (
      <>
      <GameVideo
        key={playerId}
        id={playerId}
        playerInfo={props.playerInfoMap[playerId]}
        stream={streamMap[playerId]}
        ownStream={ownStreamMap[playerId]}
        distance={distance}
        videoEnabled={playerId in otherVideoEnabled ? otherVideoEnabled[playerId] : true}
        audioEnabled={playerId in otherAudioEnabled ? otherAudioEnabled[playerId] : true}
        blocked={persistentId in props.blocked ? props.blocked[persistentId] : false}
        setVideoEnabled={(enabled) => setOtherVideoEnabled({ ...otherVideoEnabled, [playerId]: enabled })}
        setAudioEnabled={(enabled) => setOtherAudioEnabled({ ...otherAudioEnabled, [playerId]: enabled })}
        setBlocked={(blocked) => setBlocked(blocked)}
      />
      {
        playerId in screenStreamMap ?
        <GameScreenVideo
          key={"screen"+playerId}
          id={playerId}
          stream={screenStreamMap[playerId]}
          distance={distance}
        />
        :
        <></>
      }
      </>
    );
  }

  let errorComponent = (
    <div style={{ color: "red", marginTop: "10px" }}>
      Could not get your camera. Online Town requires audio and video to work properly!
      If you don't want to be on audio/video right now, you can check out our
      <a style={{ color: "orangered" }} target="_blank" href="/about.html">about</a>
      page to understand what this is.
    </div>
  );

  let otherVideoComponents = null;
  otherVideoComponents = Object.keys(props.playerVideoMap["playerToDist"])
    .filter(playerId => {
      return (playerId !== props.myPlayerId + "") && (playerId !== props.playerVideoMap["announcerPlayer"] + "")
    })
    .map(playerId => getGameVideo(playerId));

  let videoComponents = (
    <>
      {props.playerVideoMap["announcerPlayer"] && (props.playerVideoMap["announcerPlayer"] !== props.myPlayerId) ?
        getGameVideo(props.playerVideoMap["announcerPlayer"])
        : null}
      <GameSelfVideo
        myPlayer={props.myPlayerId}
        stream={ownStreamMap[props.myPlayerId]}
        videoEnabled={ownVideoEnabled}
        audioEnabled={ownAudioEnabled}
        setVideoEnabled={(enabled) => setOwnVideoEnabled(enabled)}
        setAudioEnabled={(enabled) => setOwnAudioEnabled(enabled)}
        setOwnImage={(imageData) => props.setOwnImage(imageData)}
      />
      {otherVideoComponents}
    </>
  )

  let message1 = (
    <div>
      <p>You can't see/hear some people around you because there's too many people around.</p>
      <p>If you think your computer can handle it, increase the max connections to see them.</p>
    </div>
  )

  let message2 = (
    <div>
      <p>Experiencing lag?</p>
      <p>Try lowering the max connections.</p>
    </div>
  )

  let videoOptions = (
    <div className="videos-max-connections mobileHide">
      { props.hasScreenshare ?
        (isScreensharing ? 
          <p><button onClick={() => stopScreenshare()}>stop screenshare</button></p>
        : 
          <p><button onClick={() => startScreenshare()}>screenshare</button></p>
        )
      :
      <></>
      }
      <p style={{width: "100%"}}>{"Max connections: "}
        <select value={maxVideos} onChange={(e) => setMaxVideos(e.target.value)}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={4}>4</option>
          <option value={8}>8</option>
          <option value={16}>16</option>
          <option value={32}>32</option>
          <option value={10000}>no limit</option>
        </select>
      </p>
      {maxVideos < otherVideoComponents.length ?
        message1
        :
        message2
      }
    </div>
    );

  return (
    <>
      <div id="videos" className="alt-videos-container mobileHide">
        {isError ? errorComponent : videoComponents}
      </div>
    </>
  );
}
