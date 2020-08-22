import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom'
import axios from 'axios';

import GameComponent from './GameComponent.jsx';
import AltGameComponent from './alternate/AltGameComponent.jsx';
import GameHeader from './GameHeader.jsx';
import YesNoPrompt from './YesNoPrompt.jsx';
import PasswordPrompt from './PasswordPrompt.jsx';

import { amplitudeAnonInstance, amplitudeInstance } from '../amplitude';
import { getRoomFromPath } from '../utils';
import { auth } from '../constants';
import { localPreferences } from '../LocalPreferences.js';
import { updateUserData } from '../userData.js';

const OGPreview = '/images/site/og-preview.png'

import './PrivateRoom.css';

const EnterPrivateText = () => {
  return (
    <div className="ot-privateroom-overlay" style={{ margin: "50px" }}>
      <div className="vertical-center-container" style={{ width: "600px" }}>
        <h3>About private rooms</h3>
        <div style={{ display: "flex", margin: "65px 0 0 0", alignItems: "start" }}>
          <img style={{ width: "300px" }} src={OGPreview}></img>
          <div className="vertical-container" style={{ flex: 1, paddingLeft: "15px" }}>
            <p>You are about to enter a private room.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const EnterPrivateIntro = (props) => {
  let [wantToUse, setWantToUse] = useState(false);
  let [user, setUser] = useState(localPreferences.get("user"))
  useEffect(() => {
    let handle = localPreferences.on("user", (info) => {
      setUser(user);
    })
    return () => {
      localPreferences.remove("user", handle);
    };
  }, [])

  return (
    <div style={{ marginBottom: "50px" }} className="vertical-center-container">
      <EnterPrivateText />
      {wantToUse ?
        <YesNoPrompt
          prompt={<>Are you above the age of 18? <span className="bold">(required)</span></>}
          onYes={() => {
            updateUserData({"overAge": true});
            props.onYes();
          }}
          onNo={() => props.onNo()}
        />
        :
        <YesNoPrompt
          prompt={<>Do you want to enter this room?</>}
          onYes={() => {
            setWantToUse(true)
            if (user.overAge) {
              props.onYes();
            }
          }}
          onNo={() => props.onNo()}
        />
      }
    </div>
  );
}

export default function PrivateRoom() {
  const [doneWithIntro, setDoneWithIntro] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [password, setPassword] = useState();
  const [showHeader, setShowHeader] = useState(true);
  const [hasAlternateLayout, setHasAlternateLayout] = useState(false);

  const [hasLinks, setHasLinks] = useState(false);
  const [url1, setURL1] = useState();
  const [url2, setURL2] = useState();
  const [name1, setName1] = useState();
  const [name2, setName2] = useState();

  useEffect(() => {
    axios.get(window.location.origin + '/api/hasPassword', {
      params: { roomId: getRoomFromPath() }
    })
    .then(response => {
      console.log('responded with ', response.status, ' ', response.data);
      if (response.status === 200 && response.data) {
        setHasPassword(true);
      } else {
        setHasPassword(false);
      }
    });
  }, []);

  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      if(user) {
        user.getIdToken(true).then(token => {
          return axios.get(window.location.origin + '/api/hasAccess', {
            params: {
              roomId: getRoomFromPath(),
              authToken: token,
            }
          });
        })
        .then(response => {
          console.log("hasaccess responded with ", response.status, response.data);
          if (response.status === 200 & response.data) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        })
      }
    })
  }, []);

  function startGame(password) {
    if (password) {
      setPassword(password);
    }
    amplitudeAnonInstance.logEvent("Enter Private", {
      "room": getRoomFromPath()
    });
    amplitudeAnonInstance.setUserId(null);
    amplitudeAnonInstance.regenerateDeviceId();
    amplitudeInstance.logEvent("Enter Private Identified", {});
  }

  useEffect(() => {
    if (doneWithIntro) {
      if (!hasPassword || hasAccess) {
        startGame();
      }
    }
  }, [doneWithIntro]);

  return (
    <div className="vertical-center-container">
      {doneWithIntro ?
        ((hasPassword && !password && !hasAccess) ?
          <div>
            <GameHeader />
            <PasswordPrompt
              gotPassword={(password) => startGame(password)}
            />
          </div>
          :
          <div>
            {hasAlternateLayout ? 
              <AltGameComponent
                inGame={true}
                isPrivate={true}
                password={password}
                setHasAlternateLayout={setHasAlternateLayout}
              />
              :
              <div>
                {showHeader ? 
                  <GameHeader />
                  :
                  <div> </div>
                }
                <GameComponent
                  inGame={true}
                  isPrivate={true}
                  password={password}
                  setHasAlternateLayout={setHasAlternateLayout}
                  setShowHeader={setShowHeader}
                  setHasLinks={setHasLinks}
                  setName1={setName1}
                  setName2={setName2}
                  setURL1={setURL1}
                  setURL2={setURL2}
                  hasLinks={hasLinks}
                  name1={name1}
                  name2={name2}
                  url1={url1}
                  url2={url2}
                />
              </div>
            }
          </div>
        )
        :
        <div>
          <GameHeader />
          <EnterPrivateIntro
            onYes={() => { setDoneWithIntro(true) }}
            onNo={() => { window.location.href = "/" }}
          />
        </div>
      }
    </div>
  );
}