import React, { useEffect } from 'react';

import './AltGameChat.css';
import { colors } from '../../constants';

export default function AltGameChat (props) {
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
      <div key={idx} className="alt-chat-message">
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

  return (
    <div className="alt-chat-container">
      <div id="chat-messages" className="alt-chat-message-container">
        { chatMessages }
      </div>
      <input
        id="send-chat"
        className="alt-chat-input"
        placeholder="Enter message...">
      </input>
    </div>
  );
}