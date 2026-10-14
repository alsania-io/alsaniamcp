
let ws;
let participantId;
let userName = prompt('Enter your name:', 'User');
let typingTimeout;

function connect() {
  ws = new WebSocket(`ws://${window.location.hostname}:5001`);
  
  ws.onopen = () => {
    updateStatus('Connected', true);
    joinChat();
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
  };
  
  ws.onclose = () => {
    updateStatus('Disconnected', false);
    setTimeout(connect, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function joinChat() {
  ws.send(JSON.stringify({
    type: 'join',
    name: userName,
    participantType: 'human',
  }));
  
  ws.send(JSON.stringify({
    type: 'history',
    limit: 50,
  }));
}

function handleMessage(data) {
  switch (data.type) {
    case 'connected':
      participantId = data.participantId;
      break;
    
    case 'message':
      addMessage(data.message);
      break;
    
    case 'history':
      data.messages.forEach(msg => addMessage(msg));
      break;
    
    case 'participants':
      updateParticipants(data.participants);
      break;
    
    case 'participant_joined':
      addParticipant(data.participant);
      break;
    
    case 'participant_left':
      removeParticipant(data.participantId);
      break;
    
    case 'typing':
      showTyping(data.participantName, data.isTyping);
      break;
  }
}

function addMessage(message) {
  const messagesDiv = document.getElementById('messages');
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.senderType}`;
  
  const time = new Date(message.timestamp).toLocaleTimeString();
  
  messageEl.innerHTML = `
    <div class="message-header">${message.senderName}</div>
    <div class="message-bubble">${escapeHtml(message.content)}</div>
    <div class="message-time">${time}</div>
  `;
  
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateParticipants(participants) {
  const participantsDiv = document.getElementById('participants');
  participantsDiv.innerHTML = '';
  
  participants.forEach(p => addParticipant(p));
}

function addParticipant(participant) {
  const participantsDiv = document.getElementById('participants');
  const participantEl = document.createElement('div');
  participantEl.className = `participant ${participant.type}`;
  participantEl.id = `participant-${participant.id}`;
  
  let typeLabel = participant.type === 'ai' 
    ? `AI (${participant.modelType})` 
    : 'Human';
  
  participantEl.innerHTML = `
    <div class="participant-name">${participant.name}</div>
    <div class="participant-type">${typeLabel}</div>
  `;
  
  participantsDiv.appendChild(participantEl);
}

function removeParticipant(participantId) {
  const el = document.getElementById(`participant-${participantId}`);
  if (el) el.remove();
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  
  if (!content) return;
  
  ws.send(JSON.stringify({
    type: 'message',
    content: content,
  }));
  
  input.value = '';
}

function sendTyping() {
  ws.send(JSON.stringify({
    type: 'typing',
    isTyping: true,
  }));
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'typing',
      isTyping: false,
    }));
  }, 1000);
}

function showTyping(name, isTyping) {
  const typingDiv = document.getElementById('typing');
  if (isTyping) {
    typingDiv.textContent = `${name} is typing...`;
    typingDiv.style.display = 'block';
  } else {
    typingDiv.style.display = 'none';
  }
}

function updateStatus(text, connected) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = text;
  statusEl.className = 'connection-status' + (connected ? '' : ' disconnected');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('sendButton').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  } else {
    sendTyping();
  }
});

connect();
</script>
