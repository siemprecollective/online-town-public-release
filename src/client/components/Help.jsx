import React from 'react';

import './Help.css';

import GameHeader from './GameHeader.jsx';

const ogPreview = '/images/site/og-preview.png';
const Logo = '/images/site/logo.png';
const Twitter = '/images/site/twitter.png';

export default function About () {
  return (
    <div className="vertical-center-container">
      <GameHeader />
      <div style={{display: "flex", flexDirection: "column"}} className="ot-about">
        <div style={{maxWidth: "400px", marginTop: "30px", paddingBottom: "20px", fontSize: "16px", lineHeight: "24px"}}>
          <div style={{textAlign: "center", marginBottom: "20px"}}><h3>Help / FAQ</h3></div>
          <div>
            <p className="bold">How do I move my character?</p>
            <p>To move, make sure you've clicked on the map and then use your keyboard's arrow keys to move.</p>
          </div>
          <div>
            <p>My computer is getting really slow. What's happening?</p>
            <p>Because Online Town uses WebRTC for its video streams, every user is sending their video stream to every other user they're seeing. This takes a lot of work for each user's machine and can be aggressive on both the user's battery and CPU.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
