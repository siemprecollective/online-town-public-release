import React, { useState } from 'react';
import { Link } from 'react-router-dom'

import { getSubDomain } from '../utils';
import { subdomainElMap } from '../constants';

import Feedback from './Feedback.jsx';
import ProfileModal from './ProfileModal.jsx';

const Logo = '/images/site/All.png';

import './GameHeader.css';

export default function GameHeader (props) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
  <div className="ot-game-header">
    <div className="ot-game-header-left">
      <Link to="/">
        <div className="horizontal-container">
          <div style={{height: "18px", width: "15px", overflow: "hidden", marginRight: "10px"}}>
            <img src={Logo} style={{marginTop: "-54px", marginLeft: "-0px", width: "100px"}}/>
          </div>
          <h3 className="action">{ subdomainElMap[getSubDomain()]["header-title"] }</h3>
        </div>
      </Link>
      
      <div className="ot-game-header-left-links">
        {props.showCreateNewRoom ?
        <div>
          <Link to="/private" target="_blank">
            <div className="ot-game-header-about action">
              <p style={{color: "green"}}><b>+ Create new room</b></p>
            </div>
          </Link>
        </div>
        :
        <></>
        }
        <div className="ot-game-header-feedback">
          <div className="action" onClick={() => {setShowFeedback(!showFeedback)}}><p>Feedback</p></div>
          { showFeedback ?
            <Feedback onCancel={() => {setShowFeedback(false)}}/>
            :
            <div></div>
          }
        </div>
      </div>
    </div>

    <div className="ot-game-header-right">
      <ProfileModal
        showNewRoom={true}
      />
    </div>
  </div>
  );
}
