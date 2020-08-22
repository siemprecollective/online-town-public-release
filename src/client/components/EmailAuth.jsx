import React, { useState, useEffect } from 'react';

import { auth } from '../constants';
import { dataOnSignIn } from '../userData';

import GameHeader from './GameHeader.jsx';

import './EmailAuth.css';

export default function EmailAuth () {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let email = window.localStorage.getItem("emailForSignIn");
    if (email) {
      signIn(email);
    } else {
      setLoading(false);
    }
  }, []);

  function signIn(email) {
    if (auth.isSignInWithEmailLink(window.location.href)) {
      auth.signInWithEmailLink(email, window.location.href)
        .then((result) => {
          dataOnSignIn();
          window.localStorage.removeItem("emailForSignIn");
          window.setTimeout(() => window.location.href = "/", 1000);
          setSuccess("Successfully signed in!");
        })
        .catch(err => {
          setLoading(false);
          setError(err.message);
        })
    } else {
      setLoading(false);
      setError("Not a valid verification link. Please try sending another one");
    }
  }

  function submitEmail() {
    let emailInput = document.getElementById("email-auth-input");
    if (emailInput && emailInput.value) {
      signIn(emailInput.value);
    }
  }

  return (
    <div className="vertical-center-container">
      <GameHeader />
        <div className="ot-email-auth-large-container">
          {loading ?
            (success ? 
              <div className="green">{success}</div>
            : <div>Loading...</div>
            )
          :
            <div className="ot-email-auth-container">
              <div>To complete your sign in, enter your email address again here:</div>
              <input
                id="email-auth-input"
                placeholder="email@address.com"
                className="ot-email-auth-input">
                </input>
              { success ?
                <div className="green">{success}</div>
              : (error ?
                  <div className="red">{error}</div>
                : null)
              }
              <button
                className="ot-auth-submit-button action"
                onClick={() => submitEmail()}>
                Submit
              </button>
            </div>
          }
        </div>
    </div>
  );
}