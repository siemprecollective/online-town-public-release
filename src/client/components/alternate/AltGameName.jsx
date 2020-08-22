import React, { useState, useEffect } from 'react';

import { colors } from '../../constants';

import './AltGameName.css';

export default function AltGameName(props) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    let initialSelected = false;
    if (window.selectedIds && window.selectedIds[props.playerId]) {
      initialSelected = true;
    }
    setSelected(initialSelected);
  }, [props.playerId]);
  
  useEffect(() => {
    if (!window.selectedIds) {
      window.selectedIds = {};
    }
    window.selectedIds[props.playerId] = selected;
    let hasTrue = false;
    Object.keys(window.selectedIds).forEach(playerId => {
      hasTrue = hasTrue || window.selectedIds[playerId];
    });
    if (!hasTrue) {
      delete window["selectedIds"];
    }
  }, [selected]);

  let color = colors[parseInt(props.playerId) % colors.length];
  let selectedClass = selected ? " alt-name-selected" : "";

  return (
    <div
      style={{borderColor: color, display: "block"}}
      className={"horizontal-container alt-name-container action" + selectedClass}
    >
      {
        props.pic ?
          <img src={props.pic} className="alt-name-pic"></img>
        :
          <div className="alt-name-color" style={{color: color, backgroundColor: color, float: "right"}}></div>
      }
      <div className="alt-name-text" style={{color: color}}>
        { props.name }
      </div>
    </div>
  );
}