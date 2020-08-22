import React, { useState, useEffect, useContext } from 'react';

import { hexToRGB } from '../utils';
import { colors } from '../constants';

import ModContext from './ModContext.jsx';

import './GameVideo.css';
import './GameVideoMenu.css';

function distToOpacity(distance) {
  let opacities = [1, 1, 1, 1, 0.8, 0.6, 0.4, 0.2, 0, 0, 0, 0, 0];
  return opacities[Math.floor(distance)];
}

function distToVolume(distance) {
  let volumes = [1, 1, 1, 1, 0.6, 0.5, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.05];
  return volumes[Math.floor(distance)];
}

export default function GameVideo (props) {
  const [showMenu, setShowMenu] = useState(false);

  const { modPasswordCorrect } = useContext(ModContext);

  useEffect(() => {
    let video = document.getElementById("video-" + props.id);
    if ("srcObject" in video) {
      if (props.stream) {
        video.srcObject = props.stream;
      }
    } else {
      video.src = window.URL.createObjectURL(props.stream); // For older browsers
    }
    video.play();
  }, [props.stream]);

  useEffect(() => {
    let video = document.getElementById("video-" + props.id);
    if (props.distance) {
      if (distToOpacity(props.distance) !== undefined) {
        video.parentElement.parentElement.style.opacity = distToOpacity(props.distance);
      }
      if (distToVolume(props.distance) !== undefined) {
        video.volume = distToVolume(props.distance);
      }
    }
  }, [props.distance]);

  function toggleVideoEnabled() {
    props.setVideoEnabled(!props.videoEnabled);
  }

  function toggleAudioEnabled() {
    props.setAudioEnabled(!props.audioEnabled);
  }

  function toggleBlocked() {
    props.setBlocked(!props.blocked);
  }

  let color = colors[parseInt(props.id) % colors.length];

  let videoMenu = (
    <div className="selfvideo-stream-controls" style={{backgroundColor: hexToRGB(color, 0.8)}}>
      <div className="menu-horizontal-container action" onClick={() => toggleVideoEnabled()}>
        {props.videoEnabled ?
          <i key="enable">
            <span className="fas fa-video menu-video-icon" />
          </i> 
        :
          <i key="disable">
            <span className="fas fa-video-slash menu-disable-video-icon" />
          </i> 
        }
        <div>{!props.videoEnabled ? "Enable video" : "Disable video"}</div>
      </div>
      <div className="menu-horizontal-container action" onClick={() => toggleAudioEnabled()}>
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
      <div className="menu-horizontal-container action" onClick={() => toggleBlocked()}>
        <i className="fas fa-ban menu-ban-icon" />
        <div>{props.blocked ? "Unblock" : "Block"}</div>
      </div>
    </div>
  );

  let name = props.playerInfo && props.playerInfo["name"] ? props.playerInfo["name"] : "";
  let id = props.playerInfo && props.playerInfo["publicId"] ? props.playerInfo["publicId"] : "";

  let displayName = name;
  if (modPasswordCorrect) displayName = name + "#" + id.substr(0, 6);
  return (
    <div
      className="vertical-container video-container"
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}>
      <div style={{position: "relative"}}>
        <video id={"video-" + props.id} style={{borderColor: color}}></video>
        { showMenu ? videoMenu : null }
      </div>
      <div className="name-video-container" style={{color: color}}>
        {displayName}
      </div>
    </div>
  );
}