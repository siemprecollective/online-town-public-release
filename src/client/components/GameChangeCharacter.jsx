import React from 'react';
import classNames from 'classnames';

import { characterIds } from '../constants';
import { characterMap } from '../../common/maps';

import './GameChangeCharacter.css';

export default function GameChangeCharacter (props) {
  if (props.characterId && props.currentMap && characterMap[props.currentMap]) {
    let ids = characterMap[props.currentMap];
    return (
      <div id="change-character">
        {
          ids.map(id => {
            return (
              <div key={id}>
                <img
                  src={characterIds[id]}
                  onClick={() => props.setCharacterId(id)}
                  className={classNames({"not-selected": id !== props.characterId})}
                />
              </div>
            );
          })
        }
      </div>
    )
  } else {
    return <></>;
  }
}