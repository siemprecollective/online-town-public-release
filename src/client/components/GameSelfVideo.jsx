import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { getRoomFromPath, hexToRGB } from "../utils";
import { localPreferences } from "../LocalPreferences";
import { updateRoomData } from "../userData";
import { colors } from '../constants';

import './GameSelfVideo.css';
import './GameVideoMenu.css';

export default function GameSelfVideo (props) {
  const [nameValue, setNameValue] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  let color = colors[parseInt(props.myPlayer) % colors.length];

  useEffect(() => {
    let initData = localPreferences.get("rooms")[getRoomFromPath()];
    if (initData && "name" in initData) {
      setNameValue(initData["name"]);
    }
  }, []);

  useEffect(() => {
    let inputEl = document.getElementById("self-name-input");
    if (inputEl) {
      inputEl.style.color = color;
    }
  }, [props.myPlayer])

  useEffect(() => {
    let video = document.getElementById("self-video");
    if ("srcObject" in video) {
      if (props.stream) {
        video.srcObject = props.stream;
      }
    } else {
      video.src = window.URL.createObjectURL(props.stream); // For older browsers
    }
    video.play();
    video.muted = true;
  }, [props.stream]);

  function nameOnChange(e) {
    let newValue = e.target.value;
    if (newValue.length > 50) {
      newValue = newValue.slice(0, 50);
    }
    setNameValue(newValue);

    updateRoomData(getRoomFromPath(), {"name": newValue});
  }

  function takePicture() {
    let ownVideo = document.getElementById("self-video");
    let canvas = document.getElementById("take-picture-canvas");
    if (ownVideo && canvas) {
      let context = canvas.getContext("2d");
      let width = ownVideo.videoWidth;
      let height = ownVideo.videoHeight;
      canvas.width = width;
      canvas.height = height;
      context.drawImage(ownVideo, 0, 0, width, height);
      props.setOwnImage(context.getImageData(0, 0, width, height));
    }
  }

  let videoMenu = (
    <div className="selfvideo-stream-controls" style={{backgroundColor: hexToRGB(color, 0.8)}}>
      <div className="menu-horizontal-container action" onClick={() => props.setVideoEnabled(!props.videoEnabled)}>
        {props.videoEnabled ?
          <i key="enable">
            <span className="fas fa-video menu-video-icon" />
          </i> 
        :
          <i key="disable">
            <span className="fas fa-video-slash menu-disable-video-icon" />
          </i> 
        }
        <div>{props.videoEnabled ? "Disable video" : "Enable video"}</div>
      </div>
      <div className="menu-horizontal-container action" onClick={() => props.setAudioEnabled(!props.audioEnabled)}>
        {props.audioEnabled ?
          <i key="enable">
            <span className="fas fa-microphone menu-mic-icon" />
          </i> 
        :
          <i key="disable">
            <span className="fas fa-microphone-slash menu-disable-mic-icon" />
          </i> 
        }
        <div>{props.audioEnabled ? "Mute mic" : "Unmute mic"}</div>
      </div>
    </div>
  );

  return (
    <div
      className="vertical-container self-video-container"
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}>
        <div style={{position: "relative"}}>
          <video id="self-video" style={{borderColor: color}}></video>
          { showMenu ? videoMenu : null }
        </div>
      <input
        id="self-name-input"
        className="name-input"
        placeholder="Enter name here..."
        onChange={nameOnChange}
        value={nameValue}></input>
    </div>
  )
}