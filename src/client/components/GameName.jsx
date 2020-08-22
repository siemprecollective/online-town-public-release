import React, { useState, useEffect } from 'react';

import { colors } from '../constants';

import './GameName.css';

export default function GameName(props) {
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
  let selectedClass = selected ? " name-selected" : "";

  return (
    <div
      className={"horizontal-container name-container action" + selectedClass}
      style={{borderColor: color}}
      onClick={() => setSelected(!selected)}
    >
      {
        props.pic ?
          <img src={props.pic} className="name-pic"></img>
        :
          <div className="name-color" style={{color: color, backgroundColor: color}}></div>
      }
      <div className="name-text" style={{color: color}}>
        { props.name }
      </div>
    </div>
  );
}