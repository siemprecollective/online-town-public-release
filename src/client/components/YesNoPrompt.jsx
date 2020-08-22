import React from 'react';

import './YesNoPrompt.css';

export default function YesNoPrompt (props) {
  let {prompt, onYes, onNo, ...other} = props;
  return (
    <div className="vertical-center-container" style={{fontSize: "18px"}} {...other}> 
      <div> {prompt} </div> 
      <div> 
        <div className="ot-yesnoprompt-options horizontal-container" style={{margin: "10px 0", width: "150px", justifyContent: "space-evenly"}}> 
          <div className="horizontal-container action" onClick={() => onYes()}> 
            <i className="fas fa-check ot-yesnoprompt-icon green"></i> 
            <div>Yes</div> 
          </div> 
          <div className="horizontal-container action" onClick={() => onNo()}> 
            <i className="fas fa-times ot-yesnoprompt-icon red"></i> 
            <div>No</div> 
          </div> 
        </div> 
      </div> 
    </div>
  )
}
