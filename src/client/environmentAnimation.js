import { animMap } from "../common/maps";

var imagesMap;
var animCounters;
let oldMap = null;

export function updateAnim(map, ctx, top_x, top_y, objectSizes) {
  if (!animMap[map]) {
    return;
  }

  if (!imagesMap || map !== oldMap) {
    imagesMap = [];
    animCounters = [];
    animMap[map].forEach(animation => {
      let tempFrames = [];
      animation.frames.forEach(frame => {
        let tempFrame = new Image();
        tempFrame.src = frame;
        tempFrames.push(tempFrame);
      });
      imagesMap.push(tempFrames);
      animCounters.push(0);
    });
  }

  imagesMap.forEach((frames, idx) => {
    let animation = animMap[map][idx];
    ctx.drawImage(
      frames[Math.floor(animCounters[idx] / animation.frameGap)],
      objectSizes * animation.pos[1] - top_x,
      objectSizes * animation.pos[0] - top_y
    );
    animCounters[idx] = (animCounters[idx] + 1) % (animation.frameGap * frames.length);
  });

  oldMap = map;
}