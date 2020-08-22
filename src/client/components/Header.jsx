import React, { useState } from 'react';
import { Link } from 'react-router-dom'

import { getSubDomain } from '../utils';
import { subdomainElMap } from '../constants';

import Feedback from './Feedback.jsx';
import ProfileModal from './ProfileModal.jsx';

const Logo = '../images/site/All.png';

import './Header.css';

export default function Header (props) {
  const [showFeedback, setShowFeedback] = useState(false);
  return (
    <div className="ot-header">
      <div>
        <Link to="/">
          <div style={{position: "relative"}}>
            <div style={{height: "18px", width: "15px", overflow: "hidden", position: "absolute"}}>
              <img src={Logo} style={{marginTop: "-54px", marginLeft: "-0px", width: "100px"}}/>
            </div>
          </div>
          <h3 className="action" style={{marginLeft: "24px"}}>Online Town</h3>
        </Link>
      </div>
      <div style={{marginTop: "20px"}}>
        <div className="ot-header-feedback">
        <div className="action" onClick={() => {setShowFeedback(!showFeedback)}}>Feedback</div>
          { showFeedback ?
            <Feedback onCancel={() => {setShowFeedback(false)}}/>
            :
            <div></div>
          }
        </div>
      </div>
      <div className="ot-header-right mobileHide">
        <ProfileModal
          showNewRoom={props.showNewRoom}
        />
      </div>
    </div>
  );
}
