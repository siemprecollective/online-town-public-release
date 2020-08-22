import React, {useState, useEffect} from 'react';

import './Landing.css';

export default function Landing() {
  return (
    <div className="ot-landing vertical-container">
      <hr style={{borderTop: "1px solid #52bfce"}} />

      <div className="ot-landing-section">
        <div style={{width: "200px"}}>
          <div>
            <p>Online Town is designed to support any kind of gathering.</p>
            <p>Parties, reunions, remote offices, hangouts, conferences, happy hours, summits..</p>
          </div>
        </div>
        <img className="logo-icon" src="/images/site/xr1.png" style={{height: "200px"}} />
      </div>

      <hr style={{borderTop: "1px solid #92d050"}} />

      <div className="ot-landing-section">
        <img className="logo-icon" src="/images/site/friends-cleaned.png" style={{height: "100px"}} />
        <div style={{width: "200px"}}>

          <div>
            <p>Online Town works by fading each user’s audio and video based on how far they are from each other </p>
          </div>
        </div>

      </div>

      <hr style={{borderTop: "1px solid #fbb258"}} />

      <div className="ot-landing-section">
        
        <div style={{width: "250px"}}>
          <div >
            <p>Online Town is designed to prioritize your safety and to protect your data.</p>
            <p>We send audio and video peer-to-peer using WebRTC, meaning your audio and video are fully encrypted end-to-end.</p>
          </div>
        </div>
        <img className="logo-icon" src="/images/site/webrtc-logo.png" style={{height: "128px"}} />
      </div>

      <hr style={{borderTop: "1px solid #6f30a0"}} />

      <div className="ot-landing-section">
        <div style={{width: "200px"}}>

          <div>
            <p>Online Town provides you a handful of different maps to choose from and more are on the way!</p>
          </div>
        </div>
      
        <img className="logo-icon" src="/images/maps/preview/preview-apartment.png" style={{height: "100px"}} />
        <img className="logo-icon" src="/images/maps/preview/preview-black_chairs.png" style={{height: "100px"}} />
        <img className="logo-icon" src="/images/maps/preview/preview-office.png" style={{height: "100px"}} />

      </div>

      <hr style={{borderTop: "1px solid #00b0f0"}} />

      <div className="ot-landing-section">
        <img className="logo-icon" src="/images/site/xr2.png" style={{height: "200px"}} />
        <div style={{width: "200px"}}>
          <div>
            <p>Want to run a custom event?</p>
            <p>Not sure whether Online Town could be useful to you?</p>
            <p>You can reach us at <a href="mailto:hello@theonline.town"><b>hello@theonline.town</b></a>! We'd be happy to hear from you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
