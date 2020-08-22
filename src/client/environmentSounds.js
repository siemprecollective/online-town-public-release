import { audioMap } from '../common/maps';

let oldMap;

function getDistance(myPlayer, posX, posY) {
  let xs = myPlayer.position.x - posX;
  let ys = myPlayer.position.y - posY;
  xs *= xs;
  ys *= ys;
  return Math.sqrt(xs + ys);
}

export function updateSound(myPlayer) {
  if (!myPlayer) {
    return;
  }

  if (oldMap !== myPlayer.currentMap) {
    // Clear audio from the old map
    let audioEls = document.getElementsByTagName("audio");
    for (let i = audioEls.length - 1; i >= 0; i--) {
      document.body.removeChild(audioEls[i]);
    }
    oldMap = myPlayer.currentMap;
  }

  let backgroundAudios = audioMap[myPlayer.currentMap];
  if (backgroundAudios) {
    backgroundAudios.forEach(bgAudio => {
      let dist = getDistance(myPlayer, bgAudio.pos[1], bgAudio.pos[0]);
      let audioEl = document.getElementById("audio-" + bgAudio.id);
      if (Math.ceil(dist) < bgAudio.volume.length) {
        if (audioEl) {
          audioEl.volume = bgAudio.volume[Math.ceil(dist)];
        } else {
          audioEl = document.createElement("audio");
          audioEl.id = "audio-" + bgAudio.id;
          audioEl.src = bgAudio.path;
          audioEl.volume = bgAudio.volume[Math.ceil(dist)];
          audioEl.loop = true;
          audioEl.play();
          document.body.appendChild(audioEl);
        }
      } else {
        if (audioEl) {
          document.body.removeChild(audioEl);
        }
      }
    });
  }
}