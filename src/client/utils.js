import { localPreferences } from './LocalPreferences';
import { roomNameMap } from './constants';
import axios from 'axios';

export function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

export function max(a, b) {
  return a >= b ? a : b;
}

export function isProd() {
  return window.location.hostname.includes("BLANK") || window.location.hostname.includes("theonline.town");
}

export function getSubDomain() {
  let subDomain = window.location.hostname.split(".")[0];
  if (subDomain !== "town" && subDomain !== "theonline" && isProd()) {
    return subDomain;
  }
  return "";
}

export function getWhichPublic() {
  let whichPublic = 1;
  let publicRoomData = localPreferences.get("public");
  if (publicRoomData && publicRoomData["whichPublic"]) {
    whichPublic = publicRoomData["whichPublic"];
  }
  return whichPublic;
}

export function getRoomFromPath() {
  let temp = decodeURI(window.location.pathname).split("/");
  if (temp.length >= 3) {
    let toReturn = temp.slice(1).join("\\");
    if (/^(pub\\.*)$/.test(toReturn)) {
      return toReturn + getWhichPublic();
    }
    // private room
    return toReturn;
  }
  // homepage room
  if (getSubDomain()) {
    return "pub\\" + getSubDomain() + getWhichPublic();
  }

  if (isProd()) {
    return "public" + getWhichPublic();
  } else {
    return "publicdev" + getWhichPublic();
  }
}

export function getRoomNameFromPath() {
  let temp = decodeURI(window.location.pathname).split("/");
  let name = temp[temp.length - 1];
  if (name) {
    return name;
  }
  if (getSubDomain()) {
    return roomNameMap[getSubDomain()];
  }
  return "Public Room";
}

export function getNameFromRoom(room) {
  let temp = room.split("\\");
  if (temp.length >= 2) {
    return temp[temp.length - 1];
  }
  let publicName = room.substr(0, room.length - 1);
  if (publicName in roomNameMap) {
    return roomNameMap[publicName];
  }
  return publicName;
}

export function getURLFromRoom(room) {
  let temp = room.split("\\");
  if (temp.length >= 2) {
    return 'BLANK' + temp[0] + '/' + temp[1];
  }
  let publicName = room.substr(0, room.length - 1);
  return 'https://' + publicName + 'BLANK';
}

export function isPublic() {
  return /^(public.*)$/.test(getRoomFromPath()) || /^(pub\\.*)$/.test(getRoomFromPath());
}

export function makeId(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function hexToRGB(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
      return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}
