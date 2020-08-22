import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom'
import axios from 'axios';

import YesNoPrompt from './YesNoPrompt.jsx';
import GameComponent from './GameComponent.jsx';
import PasswordPrompt from './PasswordPrompt.jsx';
import ProfileModal from './ProfileModal.jsx';
import Feedback from './Feedback.jsx';

import { localPreferences } from '../LocalPreferences.js';
import { updateUserData } from '../userData.js';
import { amplitudeAnonInstance, amplitudeInstance } from '../amplitude.js';
import { getRoomFromPath, getSubDomain } from '../utils.js';
import { db } from '../constants';

import './Homepage.css';

const Twitter = '/images/site/twitter.png';

const CreateRoom = (props) => {
  let [clicked, setClicked] = useState("");
  let [user, setUser] = useState(localPreferences.get("user"))

  let yesNoMessage = <div id="yes-no-message">
                        <p>Are you above the age of 18? 
                          <span style={{fontWeight: "600"}}>
                            (required)
                          </span>
                        </p>
                      </div>;

  useEffect(() => {
    let handle = localPreferences.on("user", (info) => {
      setUser(user);
    })
    return () => {
      localPreferences.remove("user", handle);
    };
  }, [])

  let dialog = <div></div>;
  
  if (clicked === "") {
    dialog = (
      <div style={{
          backgroundColor: "#0EBF55",
          borderRadius: "10px",
          width: "130px",
          height: "34px",
          margin: "20px auto 20px",
          cursor: "pointer",
        }} 
        onClick={() => {
          if (user.overAge) {
            props.onPrivate();
          } else {
            setClicked("private")
          }
        }}
        >
        <p className="button-text">CREATE ROOM</p>
      </div>
    );
  } else if (!user.overAge) {
    dialog = (
      <YesNoPrompt
        prompt={yesNoMessage}
        onYes={() => {
          updateUserData({ "overAge": true });
          props.onPrivate();
          setClicked("")
        }}
        onNo={() => { setClicked("") }}
      />
    );
  }
  return dialog;
}

function FeedbackLeft() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div style={{position: "absolute", width: "100%", top: "40px", textAlign: "center"}}>
      <div style={{width: "600px", textAlign: "left", margin: "auto"}}>
        <div className="ot-header-feedback">
        <div className="action" onClick={() => {setShowFeedback(!showFeedback)}}>Feedback</div>
          { showFeedback ?
            <Feedback onCancel={() => {setShowFeedback(false)}}/>
            :
            <div></div>
          }
        </div>
      </div>
    </div>
  );
}

function Top() {

  let createRoom = (
    <CreateRoom
      onPrivate={() => {
        window.location.href = "/private"
      }}
    />
  );

  return (
    <div style={{maxWidth: "338px", textAlign: "center", marginTop: "100px"}} className="writing">
      {createRoom}
    </div>

  );
}

export default function Homepage() {
  return (
    <div className={classNames({"vertical-center-container": true, "dark-mode": false})}>
      <FeedbackLeft />
      <Top />
    </div>
  );
}
