import React from 'react';

import { FILTER_THRESHOLD } from '../../../common/constants';

import GameName from './AltGameName.jsx';

import './AltGameNamesContainer.css';

function returnGameNames(playerInfoMap, playerIds, profPics) {
  if (playerInfoMap) {
    return playerIds.map(playerId => {
      let name = (playerId in playerInfoMap) ? playerInfoMap[playerId]["name"] : "";
      return (
        <GameName
          key={playerId}
          playerId={playerId}
          name={name}
          pic={profPics[playerId]}
        />
      );
    })
  }
  return null;
}

export default function AltGameNamesContainer (props) {
  let nearPlayerIds = [];
  let farPlayerIds = [];
  let outsidePlayerIds = [];
  if (props.playerVideoMap && props.playerVideoMap["playerToDist"]) {
    Object.keys(props.playerVideoMap["playerToDist"]).forEach(playerId => {
      if (props.playerVideoMap["playerToDist"][playerId] <= FILTER_THRESHOLD) {
        nearPlayerIds.push(playerId);
      } else {
        farPlayerIds.push(playerId);
      }
    });
    Object.keys(props.playerInfoMap).forEach(playerId => {
      if (!(playerId in props.playerVideoMap["playerToDist"])) {
        outsidePlayerIds.push(playerId);
      }
    });
  }

  return (
    <div id="alt-names-container" className="mobileHide">
      <div className="bold">Near</div>
      { returnGameNames(props.playerInfoMap, nearPlayerIds, props.profPics) }
      <div className="bold">Far</div>
      { returnGameNames(props.playerInfoMap, farPlayerIds, props.profPics) }
      <div className="bold">Beyond</div>
      { returnGameNames(props.playerInfoMap, outsidePlayerIds, props.profPics) }
    </div>
  )
}