import {
  BaseTypes,
  DynamicObject
} from 'lance-gg';

export class Player extends DynamicObject {

  constructor(gameEngine, options, props) {
    super(gameEngine, options, props);
  }

  static get netScheme() {
    return Object.assign({
      currentDirection: { type: BaseTypes.TYPES.UINT8 },
      characterId: { type: BaseTypes.TYPES.UINT8 },
      currentMap: { type: BaseTypes.TYPES.INT16 }
    }, super.netScheme);
  }

  get bending() {
    return {
      position: {percent: 1.0}
    }
  }

  syncTo(other) {
    super.syncTo(other);
    this.currentDirection = other.currentDirection;
    this.characterId = other.characterId;
    this.currentMap = other.currentMap;
  }
}