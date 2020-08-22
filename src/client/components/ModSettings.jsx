import React, { useState, useContext, useEffect, useRef } from 'react';

import ModContext from './ModContext.jsx';

import './ModSettings.css';

export default function ModSettings(props) {
  let {
    modPasswordCorrect,
    setModPassword,
    checkModPassword,
    changeModPassword,
    changePassword,
    setRoomClosed,
    setModMessage,
    banPlayer,
    unbanPlayer,
    banned,
    result
  } = useContext(ModContext);

  let [newPassword, setNewPassword] = useState("");
  let [newModPassword, setNewModPassword] = useState("");
  let [showingResult, setShowingResult] = useState(false);

  let resultTimer = useRef(-1);

  useEffect(() => {
    // Remove the window on click outside of this window
    function onClick(e) {
      let settingsEl = document.getElementById("modsettings");
      if (settingsEl) {
        let clickedOutside = !(e.target === settingsEl);
        settingsEl.querySelectorAll("*").forEach(el => {
          if (e.target === el) {
            clickedOutside = false;
          }
        });
        if (clickedOutside) {
          document.body.removeEventListener("click", onClick);
          props.onCancel();
        }
      }
    }

    document.body.addEventListener("click", onClick);
  }, []);

  useEffect(() => {
    clearTimeout(resultTimer.current);
    setShowingResult(true);
    resultTimer.current = setTimeout(() => {
      setShowingResult(false);
    }, 3000)
  }, [result])

  function modMessage() {
    let messageEl = document.getElementById("mod-message");
    if (messageEl) {
      setModMessage(messageEl.value);
    }
  }

  return (
    <>
      <div style={{ position: "absolute", top: "1px", right: "1px", zIndex: 99}}>
        {showingResult && result.success ?
          <div key={Math.random()} className="ot-modsettings-fadeout" style={{ color: "white", backgroundColor: "green" }}>Done.</div>
          :
          <></>
        }
        {showingResult && result.failure ?
          <div key={Math.random()} className="ot-modsettings-fadeout" style={{ color: "white", backgroundColor: "red" }}>Failed.</div>
          :
          <></>
        }
      </div>
      {modPasswordCorrect ?
        <div id="modsettings" className="vertical-container ot-modsettings">
          <div className="bold">Change password</div>
          <div className="horizontal-container">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}></input>
            <button onClick={() => { changePassword(newPassword) }}>change</button>
          </div>

          <div className="bold">Change moderation password</div>
          <div className="horizontal-container">
            <input type="password" value={newModPassword} onChange={(e) => setNewModPassword(e.target.value)}></input>
            <button onClick={() => { changeModPassword(newModPassword) }}>change</button>
          </div>

          <div className="bold">Close room</div>
          <button onClick={() => { setRoomClosed(!props.closed) }}>
            {props.closed ? "open" : "close"}
          </button>

          <div className="bold">Moderator message</div>
          <div className="horizontal-container">
            <input id="mod-message" placeholder="Blank means no message"></input>
            <button onClick={() => { modMessage() }}>set</button>
          </div>

          <div className="bold">Recently Seen</div>
          {Object.keys(props.playerInfoMap).map(k => {
            const player = props.playerInfoMap[k]
            let name = player.name || "";
            let id = player.publicId || "";
            return (
              <div key={k} className="ot-modsettings-banlist-item">
                <div>{`${name.substr(0, 10)}#${id.substr(0, 6)}`}</div>
                <button onClick={() => { banPlayer(k) }}>ban</button>
              </div>
            );
          })}

          <div className="bold">Banned</div>
          {banned.map(player => {
            let name = player.name || "";
            let id = player.publicId || "";
            return (
              <div key={id} className="ot-modsettings-banlist-item">
                <div>{`${name.substr(0, 10)}#${id.substr(0, 6)}`}</div>
                <button onClick={() => { unbanPlayer(id) }}>unban</button>
              </div>
            );
          })}
        </div>
        :
        <div id="modsettings" className="vertical-container ot-modsettings">
          <div>Enter moderation password:</div>
          <input type="password" onChange={(e) => setModPassword(e.target.value)}></input>
          <button onClick={() => { checkModPassword() }}>Go</button>
        </div>
      }
    </>
  );
}