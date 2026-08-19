// ====================== experiment - WebRTC Video Call ======================
// Optimized for quality + GitHub Pages (static hosting)

const PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // Free TURN (optional fallback - for difficult networks)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  },
  debug: 1
};

// High quality media constraints
const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  },
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user'
  }
};

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const callScreen = document.getElementById('call-screen');
const displayNameInput = document.getElementById('display-name');
const roomIdInput = document.getElementById('room-id');
const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const btnJoinConfirm = document.getElementById('btn-join-confirm');
const btnCopy = document.getElementById('btn-copy');
const btnToggleMic = document.getElementById('btn-toggle-mic');
const btnToggleCam = document.getElementById('btn-toggle-cam');
const btnHangup = document.getElementById('btn-hangup');
const joinPanel = document.getElementById('join-panel');
const createPanel = document.getElementById('create-panel');
const myPeerIdEl = document.getElementById('my-peer-id');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const remotePlaceholder = document.getElementById('remote-placeholder');
const localLabel = document.getElementById('local-label');
const remoteLabel = document.getElementById('remote-label');
const connectionStatus = document.getElementById('connection-status');

// State
let peer = null;
let localStream = null;
let currentCall = null;
let myName = '';
let isMicOn = true;
let isCamOn = true;

// ====================== Helpers ======================
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function setStatus(text, connected = false) {
  connectionStatus.textContent = text;
  connectionStatus.classList.toggle('connected', connected);
}

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.style.cssText = `
    position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
    border-radius: 10px; font-size: 0.9rem; z-index: 100;
    animation: fadeIn 0.3s ease;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ====================== Media ======================
async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    localVideo.srcObject = localStream;
    return true;
  } catch (err) {
    console.error('getUserMedia error:', err);
    // Fallback to lower quality if high fails
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 640, height: 480 }
      });
      localVideo.srcObject = localStream;
      return true;
    } catch (e2) {
      alert('Cannot access camera/microphone. Please allow permission in your browser.');
      return false;
    }
  }
}

function stopLocalStream() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  localVideo.srcObject = null;
}

// ====================== PeerJS ======================
function createPeer(id = null) {
  return new Promise((resolve, reject) => {
    const p = id ? new Peer(id, PEER_CONFIG) : new Peer(PEER_CONFIG);

    p.on('open', (peerId) => {
      console.log('Peer ready:', peerId);
      resolve(p);
    });

    p.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'peer-unavailable') {
        showToast('Peer ID not found');
      } else if (err.type === 'unavailable-id') {
        showToast('ID already in use. Try again.');
      } else {
        showToast('Error: ' + err.type);
      }
      reject(err);
    });

    // Incoming call
    p.on('call', async (call) => {
      console.log('Incoming call from', call.peer);
      if (!localStream) {
        const ok = await getLocalStream();
        if (!ok) return;
      }

      currentCall = call;
      call.answer(localStream);

      call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
        remotePlaceholder.classList.add('hidden');
        setStatus('Connected!', true);
        remoteLabel.textContent = 'Friend';
      });

      call.on('close', () => {
        endCallCleanup();
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        endCallCleanup();
      });

      showScreen(callScreen);
    });
  });
}

async function startCall(remotePeerId) {
  if (!localStream) {
    const ok = await getLocalStream();
    if (!ok) return;
  }

  setStatus('Calling…');
  showScreen(callScreen);

  const call = peer.call(remotePeerId, localStream);
  currentCall = call;

  call.on('stream', (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
    remotePlaceholder.classList.add('hidden');
    setStatus('Connected!', true);
  });

  call.on('close', () => {
    endCallCleanup();
  });

  call.on('error', (err) => {
    console.error('Call error:', err);
    showToast('Could not call. Check the ID.');
    endCallCleanup();
  });
}

function endCallCleanup() {
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }
  remoteVideo.srcObject = null;
  remotePlaceholder.classList.remove('hidden');
  setStatus('Call ended');
  // Go back after short delay
  setTimeout(() => {
    stopLocalStream();
    if (peer) {
      peer.destroy();
      peer = null;
    }
    showScreen(setupScreen);
    createPanel.classList.add('hidden');
    joinPanel.classList.add('hidden');
    myPeerIdEl.textContent = '—';
    roomIdInput.value = '';
  }, 1200);
}

// ====================== UI Events ======================
btnCreate.addEventListener('click', async () => {
  myName = displayNameInput.value.trim() || 'You';
  localLabel.textContent = myName;

  btnCreate.disabled = true;
  btnCreate.textContent = 'Creating…';

  try {
    peer = await createPeer();
    myPeerIdEl.textContent = peer.id;
    createPanel.classList.remove('hidden');
    joinPanel.classList.add('hidden');

    // Get local media early so we're ready
    await getLocalStream();
  } catch (e) {
    console.error(e);
    showToast('Could not create peer. Try again.');
  } finally {
    btnCreate.disabled = false;
    btnCreate.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 4v16m8-8H4"/>
      </svg>
      Create Call
    `;
  }
});

btnJoin.addEventListener('click', () => {
  joinPanel.classList.toggle('hidden');
  createPanel.classList.add('hidden');
});

btnJoinConfirm.addEventListener('click', async () => {
  const remoteId = roomIdInput.value.trim();
  if (!remoteId) {
    showToast('Please enter the Room / Peer ID');
    return;
  }

  myName = displayNameInput.value.trim() || 'You';
  localLabel.textContent = myName;

  btnJoinConfirm.disabled = true;
  btnJoinConfirm.textContent = 'Connecting…';

  try {
    peer = await createPeer();
    await startCall(remoteId);
  } catch (e) {
    console.error(e);
  } finally {
    btnJoinConfirm.disabled = false;
    btnJoinConfirm.textContent = 'Join Now';
  }
});

btnCopy.addEventListener('click', () => {
  const id = myPeerIdEl.textContent;
  if (id && id !== '—') {
    navigator.clipboard.writeText(id).then(() => {
      showToast('ID copied!');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = id;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('ID copied!');
    });
  }
});

btnToggleMic.addEventListener('click', () => {
  if (!localStream) return;
  isMicOn = !isMicOn;
  localStream.getAudioTracks().forEach(t => (t.enabled = isMicOn));

  btnToggleMic.classList.toggle('muted', !isMicOn);
  btnToggleMic.querySelector('.icon-mic-on').classList.toggle('hidden', !isMicOn);
  btnToggleMic.querySelector('.icon-mic-off').classList.toggle('hidden', isMicOn);
});

btnToggleCam.addEventListener('click', () => {
  if (!localStream) return;
  isCamOn = !isCamOn;
  localStream.getVideoTracks().forEach(t => (t.enabled = isCamOn));

  btnToggleCam.classList.toggle('muted', !isCamOn);
  btnToggleCam.querySelector('.icon-cam-on').classList.toggle('hidden', !isCamOn);
  btnToggleCam.querySelector('.icon-cam-off').classList.toggle('hidden', isCamOn);
});

btnHangup.addEventListener('click', () => {
  endCallCleanup();
});

// Enter key support
roomIdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnJoinConfirm.click();
});

displayNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnCreate.click();
});

// Prevent accidental leave
window.addEventListener('beforeunload', (e) => {
  if (currentCall) {
    e.preventDefault();
    e.returnValue = '';
  }
});
