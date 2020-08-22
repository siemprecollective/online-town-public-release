import React, { useEffect } from 'react';

import './GameChat.css';
import { colors } from '../constants';

export default function GameChat (props) {
  useEffect(() => {
    let chatInput = document.getElementById("send-chat");
    chatInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        props.sendChatMessage(chatInput.value);
        chatInput.value = "";
      } else {
        chatInput.value = chatInput.value.slice(0, 500);
      }
    });
  }, []);

  let chatMessages = props.chatMessages.map((messageData, idx) => {
    let chatName = "NoName";
    if (messageData.id in props.playerInfoMap) {
      chatName = props.playerInfoMap[messageData.id].name;
    }
    return (
      <div key={idx} className="ot-chat-message">
        <div>
          <span style={{color: colors[parseInt(messageData.id) % colors.length]}}>
            { chatName + ": " }
          </span>
          { messageData.message }
        </div>
      </div>
    );
  });

  useEffect(() => {
    let chatMessagesContainer = document.getElementById("chat-messages");
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }, [props.chatMessages]);

  let newTop = 5;
  let newHeightA = 391;
  let newHeightB = 355; 

  if(props.hasLinks){
    newTop = 65;
    newHeightA = 331;
    newHeightB = 295;
  }

  return (
    <div className="ot-chat-container" style={{top: newTop, height: newHeightA}}>
      <div id="chat-messages" className="ot-chat-message-container" style={{height: newHeightB}}>
        { chatMessages }
      </div>
      <input
        id="send-chat"
        className="ot-chat-input"
        placeholder="Enter message...">
      </input>
    </div>
  );
}