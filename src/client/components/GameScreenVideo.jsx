import React, { useState, useEffect, useContext } from 'react';

import { colors } from '../constants';

import './GameScreenVideo.css';

function distToOpacity(distance) {
  let opacities = [1, 0.9, 0.9, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  return opacities[Math.floor(distance)];
}

function distToVolume(distance) {
  let volumes = [1, 1, 1, 1, 0.6, 0.5, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.05];
  return volumes[Math.floor(distance)];
}

export default function GameScreenVideo (props) {
  useEffect(() => {
    let video = document.getElementById("screen-video-" + props.id);
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
    let video = document.getElementById("screen-video-" + props.id);
    if (props.distance) {
      if (distToOpacity(props.distance) !== undefined) {
        video.parentElement.style.opacity = distToOpacity(props.distance);
      }
      if (distToVolume(props.distance) !== undefined) {
        video.volume = distToVolume(props.distance);
      }
    }
  }, [props.distance]);

  let color = colors[parseInt(props.id) % colors.length];

  return (
    <div
      className="screen-video-container">
      <video id={"screen-video-" + props.id} style={{borderColor: color}}></video>
    </div>
  );
}