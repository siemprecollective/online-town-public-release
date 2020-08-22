import React, { useState } from 'react';

import { getRoomNameFromPath } from '../utils';

import ModSettings from './ModSettings.jsx';
import InviteLink from './InviteLink.jsx';

import './RoomTitle.css';

export default function RoomTitle (props) {
  let [modSettingsOpen, setModSettingsOpen] = useState(false);

  return (
    <div className="room-title-container">
      <div className="room-title horizontal-container" style={{justifyContent: "space-between"}}>
        <div><h3 id="room-title">{ getRoomNameFromPath() }</h3></div>
        <div style={{width: "150px"}}>
          <div style={{float: "left", marginRight: "10px"}}>
            <InviteLink />
          </div>
          <div style={{float: "right"}}>
            <div id="report-abuse-header" className="action"
              onClick={() => {setModSettingsOpen(!modSettingsOpen)}}
            ><i className="fas fa-cog"></i></div>
            { modSettingsOpen ?
              <ModSettings 
                closed={props.closed}
                playerInfoMap={props.playerInfoMap}
                onCancel={() => {setModSettingsOpen(false)}}
              />
            :
             <></>
            }
          </div>
        </div>
      </div>
      {props.modMessage ?
        <div className="mod-message-container">
          <span className="bold">Host: </span>
          { props.modMessage }
        </div>
      : null
      }
    </div>
  );
}
