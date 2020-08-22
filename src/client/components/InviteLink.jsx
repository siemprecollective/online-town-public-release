import React, {useState, useRef} from 'react';

import './InviteLink.css';

export default function InviteLink() {
  const [showLink, setShowLink] = useState(false);
  const linkElRef = useRef(null);
  
  const copyLink = (e) => {
    linkElRef.current.select();
    document.execCommand("copy");
  }
  
  return (
      <div className="ot-invitelink">
        { showLink ?
          <div className="ot-invitelink-link">
            <div className="ot-invitelink-close">
              <i className="fas fa-times action" 
                style={{marginRight: "7px"}}
                onClick={() => {setShowLink(false)}}></i>
              Send this link to someone to invite them into this room:
            </div>
            <div className="action" onClick={() => copyLink()}>
              <input type="text"
                style={{padding: "3px"}}
                ref={linkElRef}
                value={window.location.href}
                size={window.location.href.length} readOnly></input>
            </div>
          </div>
        :
          <div className="action" onClick={() => setShowLink(true)}><i className="fas fa-share"></i> Invite others</div>
        }
      </div>
  )
}