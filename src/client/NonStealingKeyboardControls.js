import {KeyboardControls} from 'lance-gg';

// has to be in a function because this is imported on the server accidentally
// and keyboard controls doesn't show up there
// TODO fix this when move non-server code outside of server
export default function newKeyboardControls(args) {
  class NonStealingKeyboardControls extends KeyboardControls {
    onKeyChange(e, isDown) {
      e = e || window.event;
      if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
        return;
      }
      super.onKeyChange(e, isDown);
    }
  }
  return new NonStealingKeyboardControls(args);
}