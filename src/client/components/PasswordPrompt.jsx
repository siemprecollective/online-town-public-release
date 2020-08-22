import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { auth } from '../constants';
import { getRoomFromPath } from '../utils.js'

import './PasswordPrompt.css';

export default function PasswordPrompt(props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("key")) {
      // this is to try to make sure the account is signed in...
      setTimeout(() => {
        submitPassword(urlParams.get("key"));
      }, 200);
    }
  }, []);

  const submitPassword = (password) => {
    let passwordPayload = {
      roomId: getRoomFromPath(),
      password: password,
    };
    if (auth.currentUser) {
      passwordPayload["authUser"] = auth.currentUser.uid;
    }

    axios.post(window.location.origin + '/api/submitPassword', passwordPayload)
    .then(response => {
      if (response.status === 200) {
        props.gotPassword(password);
      } else {
        throw new Error('response not 200');
      }
    })
    .catch(err => {
      console.error(err);
      setError(true);
    });
  }

  return (
    <div className="ot-privateroom-overlay ot-password-large-container">
      <div className="ot-password-container">
        <div>
          <p>This is a private room on Online Town</p>
          <p>To continue, please enter the password:</p>
        </div>
        <input
          className="ot-password-input"
          type="password"
          onChange={(e) => setPassword(e.target.value)}>
          </input>
        { error ? <div className="red">Incorrect password</div> : null }
        <button
          className="ot-password-submit-button action"
          onClick={() => submitPassword(password)}>
          Submit
        </button>
      </div>
    </div>
  )
}
