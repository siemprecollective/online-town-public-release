import React, { useState, useEffect } from 'react';
import GameNamesContainer from './GameNamesContainer.jsx';
import GameChangeCharacter from './GameChangeCharacter.jsx';
import GameChat from './GameChat.jsx';

import { localPreferences } from '../LocalPreferences.js';

import './GameCanvas.css';
import { updateUserData } from '../userData.js';

export default function GameCanvas (props) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    let userData = localPreferences.get("user");
    if (userData && !userData["seenTutorial"]) {
      setShowTutorial(true);
    }
  }, []);

  function seenTutorial() {
    setShowTutorial(false);
    updateUserData({"seenTutorial": true});
  }

  let linkContainer = <div className="ot-link-container">
  </div>;
  if(props.hasLinks){
    linkContainer = <div className="ot-link-container">
      <p><a href={props.url1}>{props.name1}</a></p>
      <p><a href={props.url2}>{props.name2}</a></p>
    </div>;
  }

  return (
    <div style={{position: "relative"}} className="game-container">
      {linkContainer}
      <canvas id="canvas" width="600" height="400"></canvas>
      { 
        props.inGame ?
          <>
            <GameChat
              sendChatMessage={props.sendChatMessage}
              chatMessages={props.chatMessages}
              playerInfoMap={props.playerInfoMap}
              hasLinks={props.hasLinks}
            />
            <GameNamesContainer
              playerInfoMap={props.playerInfoMap}
              playerVideoMap={props.playerVideoMap}
              profPics={props.profPics}
            />
            <GameChangeCharacter
              setCharacterId={props.setCharacterId}
              characterId={props.characterId}
              currentMap={props.currentMap}
            />
          </>
        :
          null
      }
      {Object.keys(props.playerInfoMap).map(key =>
        <div key={key} className="map-name-container" id={"map-name-container-"+key}></div>
      )}
      <div id="blocked-text" hidden>We detect you've been blocked. Press spacebar, if you'd like to teleport out.</div>
      {
        showTutorial && props.inGame ?
          <div id="tutorial-text">
            <div>
              1) Use your arrow keys to move around <br />
              2) You only see and hear people when you move next to them (and if you can't check if your webcam is connected) <br />
              3) You can block users by hovering your mouse over their video
            </div>
            <div onClick={() => { seenTutorial() }}>
              <i 
                className="fas fa-times selection-icon-fas red"
                style={{position: "absolute", top: "10px", right: "10px"}}
              ></i>
            </div>
          </div>
        :
          null
      }
    </div>
  );
}
