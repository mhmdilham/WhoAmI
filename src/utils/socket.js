import { Peer } from 'peerjs';
import {
  rooms,
  generateRoomCode,
  createRoom,
  joinRoom,
  removePlayer,
  kickPlayer,
  startGame,
  submitSecretCard,
  dealCards,
  nextTurn,
  evaluateGuess,
  getMaskedRoomState
} from '../game/gameLogic';

// Public STUN servers for robust WebRTC traversal across home Wi-Fi and mobile data
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ]
  }
};

class WebRTCSocket {
  constructor() {
    this.id = 'client-' + Math.random().toString(36).slice(2, 9);
    this.connected = true;
    this.isHost = false;
    this.currentRoomCode = null;

    this.peer = null;
    this.hostConn = null; // Used by guest to send data to host
    this.guestConns = new Map(); // Used by host to communicate with guests (peerId -> DataConnection)

    this.listeners = new Map();
    this.pendingCallbacks = new Map();
    this.callbackCounter = 0;

    // Clean up connections on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.destroy();
          } catch (e) {}
        }
      });
    }
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      if (handler) {
        this.listeners.get(event).delete(handler);
      } else {
        this.listeners.delete(event);
      }
    }
  }

  emitLocal(event, ...args) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(h => {
        try {
          h(...args);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  emit(event, ...args) {
    let payload = {};
    let callback = null;

    if (args.length === 1) {
      if (typeof args[0] === 'function') {
        callback = args[0];
      } else {
        payload = args[0] || {};
      }
    } else if (args.length >= 2) {
      if (typeof args[0] === 'function') {
        callback = args[0];
      } else {
        payload = args[0] || {};
      }
      if (typeof args[1] === 'function') {
        callback = args[1];
      }
    }

    switch (event) {
      case 'create_room':
        this.handleCreateRoom(payload, callback);
        break;
      case 'join_room':
        this.handleJoinRoom(payload, callback);
        break;
      case 'update_settings':
        this.handleUpdateSettings(payload);
        break;
      case 'start_game':
        this.handleStartGame(payload, callback);
        break;
      case 'submit_secret_card':
        this.handleSubmitSecretCard(payload, callback);
        break;
      case 'end_turn':
        this.handleEndTurn();
        break;
      case 'guess_identity':
        this.handleGuessIdentity(payload, callback);
        break;
      case 'manual_confirm_guess':
        this.handleManualConfirmGuess(payload);
        break;
      case 'reshuffle_cards':
        this.handleReshuffleCards(callback);
        break;
      case 'back_to_lobby':
        this.handleBackToLobby(callback);
        break;
      case 'save_notes':
        this.handleSaveNotes(payload);
        break;
      case 'kick_player':
        this.handleKickPlayer(payload, callback);
        break;
      case 'leave_room':
        this.handleLeaveRoom();
        break;
      default:
        console.warn('Unhandled socket event:', event);
    }
  }

  // Broadcast latest room state to host and all connected guests
  broadcastRoom(room) {
    if (!room) return;

    // Cache state in host's sessionStorage for refresh persistence
    try {
      sessionStorage.setItem('whoami_host_room_state', JSON.stringify(room));
    } catch (e) {}

    // 1. Host's local masked view
    const hostMasked = getMaskedRoomState(room, this.id);
    this.emitLocal('room_update', hostMasked);

    // 2. Each connected guest's masked view
    for (const player of room.players) {
      if (player.id !== this.id) {
        const conn = this.guestConns.get(player.id);
        if (conn && conn.open) {
          const guestMasked = getMaskedRoomState(room, player.id);
          try {
            conn.send({ type: 'room_update', room: guestMasked });
          } catch (e) {
            console.error('Failed to send room_update to guest:', player.id, e);
          }
        }
      }
    }
  }

  // Host: Setup listener for incoming guest connections
  setupHostPeer(peer, code, hostName, playerToken, callback) {
    this.peer = peer;
    this.id = peer.id;
    this.isHost = true;
    this.currentRoomCode = code;

    let room = rooms.get(code);
    let token = playerToken;
    if (!room) {
      const created = createRoom(code, peer.id, hostName, playerToken);
      room = created.room;
      token = created.playerToken;
    } else {
      const hostPlayer = room.players.find(p => p.token === playerToken || p.isHost);
      if (hostPlayer) {
        hostPlayer.id = peer.id;
        hostPlayer.isConnected = true;
      }
      room.hostId = peer.id;
    }

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        // Connected peer is ready for data
      });

      conn.on('data', (data) => {
        this.handleHostIncomingData(conn, data);
      });

      conn.on('close', () => {
        const currentRoom = rooms.get(code);
        if (currentRoom) {
          const p = currentRoom.players.find(x => x.id === conn.peer);
          if (p) {
            p.isConnected = false;
            this.broadcastRoom(currentRoom);
          }
        }
        this.guestConns.delete(conn.peer);
      });

      conn.on('error', (err) => {
        console.warn('Guest connection error:', err);
      });
    });

    if (callback) {
      callback({ success: true, roomCode: code, playerToken: token });
    }

    this.broadcastRoom(room);
  }

  // Host: Process messages from connected guests
  handleHostIncomingData(conn, data) {
    const { action, payload, callbackId } = data || {};
    const room = rooms.get(this.currentRoomCode);
    if (!room) return;

    const replyCallback = (res) => {
      if (callbackId && conn.open) {
        conn.send({ type: 'callback', callbackId, response: res });
      }
    };

    switch (action) {
      case 'join_room': {
        const result = joinRoom(this.currentRoomCode, conn.peer, payload.playerName, payload.playerToken);
        if (result.error) {
          replyCallback({ success: false, error: result.error });
          return;
        }

        this.guestConns.set(conn.peer, conn);
        replyCallback({
          success: true,
          roomCode: this.currentRoomCode,
          playerToken: result.playerToken
        });

        this.broadcastRoom(result.room);
        break;
      }

      case 'submit_secret_card': {
        const result = submitSecretCard(room, conn.peer, payload.cardName, payload.hint);
        if (result.error) {
          replyCallback({ success: false, error: result.error });
          return;
        }
        replyCallback({ success: true });
        this.broadcastRoom(room);
        break;
      }

      case 'end_turn': {
        nextTurn(room);
        this.broadcastRoom(room);
        break;
      }

      case 'guess_identity': {
        const result = evaluateGuess(room, conn.peer, payload.guessName);
        if (result.error) {
          replyCallback({ success: false, error: result.error });
          return;
        }
        replyCallback({ success: true, correct: result.correct, isClanOnly: result.isClanOnly });
        this.broadcastRoom(room);
        break;
      }

      case 'save_notes': {
        const player = room.players.find(p => p.id === conn.peer);
        if (player) {
          player.notes = payload.notes;
        }
        break;
      }

      case 'leave_room': {
        removePlayer(conn.peer, true);
        this.guestConns.delete(conn.peer);
        this.broadcastRoom(room);
        break;
      }

      default:
        console.warn('Unknown host action:', action);
    }
  }

  // 1. Create Room (Host)
  handleCreateRoom({ hostName, playerToken }, callback) {
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }

    const tryCreate = (attempt = 0) => {
      if (attempt > 5) {
        if (callback) callback({ success: false, error: 'Gagal membuat room. Silakan coba lagi.' });
        return;
      }

      const code = generateRoomCode();
      const peerId = 'whoami-' + code.toLowerCase();
      const peer = new Peer(peerId, PEER_CONFIG);

      peer.on('open', () => {
        this.setupHostPeer(peer, code, hostName, playerToken, callback);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          peer.destroy();
          tryCreate(attempt + 1);
        } else {
          console.error('PeerJS create error:', err);
          if (callback) callback({ success: false, error: 'Koneksi error: ' + (err.message || 'Coba lagi') });
        }
      });
    };

    tryCreate(0);
  }

  // 2. Join / Reconnect Room (Guest or Host Restoring)
  handleJoinRoom({ roomCode, playerName, playerToken, isHost: wasHost }, callback) {
    const code = (roomCode || '').trim().toUpperCase();
    if (!code) {
      if (callback) callback({ success: false, error: 'Kode room tidak valid!' });
      return;
    }

    // Check if user is Host restoring a previous session
    const rawSession = sessionStorage.getItem('whoami_session');
    const savedSession = rawSession ? JSON.parse(rawSession) : null;
    const isHostRestoring = wasHost || (savedSession && savedSession.isHost && savedSession.roomCode === code);

    if (isHostRestoring) {
      const rawState = sessionStorage.getItem('whoami_host_room_state');
      if (rawState) {
        try {
          const restoredRoom = JSON.parse(rawState);
          rooms.set(code, restoredRoom);

          if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
          }

          const peerId = 'whoami-' + code.toLowerCase();
          const peer = new Peer(peerId, PEER_CONFIG);

          peer.on('open', () => {
            this.setupHostPeer(peer, code, playerName, playerToken, callback);
          });

          peer.on('error', () => {
            // Fallback to guest join if host ID taken
            this.connectAsGuest(code, playerName, playerToken, callback);
          });
          return;
        } catch (e) {
          console.error('Failed to parse cached host room state:', e);
        }
      }
    }

    // Connect as Guest
    this.connectAsGuest(code, playerName, playerToken, callback);
  }

  connectAsGuest(code, playerName, playerToken, callback) {
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }

    this.isHost = false;
    this.currentRoomCode = code;

    const peer = new Peer(PEER_CONFIG);
    this.peer = peer;

    let callbackCalled = false;
    const timeout = setTimeout(() => {
      if (!callbackCalled) {
        callbackCalled = true;
        if (callback) callback({ success: false, error: 'Room tidak ditemukan! Pastikan kode benar dan Host sedang membuka game.' });
      }
    }, 9000);

    peer.on('open', (myPeerId) => {
      this.id = myPeerId;
      const targetHostPeerId = 'whoami-' + code.toLowerCase();
      const conn = peer.connect(targetHostPeerId, { reliable: true });
      this.hostConn = conn;

      conn.on('open', () => {
        clearTimeout(timeout);
        // Send join_room request to host
        const cbId = ++this.callbackCounter;
        this.pendingCallbacks.set(cbId, (res) => {
          if (!callbackCalled) {
            callbackCalled = true;
            if (callback) callback(res);
          }
        });

        conn.send({
          action: 'join_room',
          payload: { roomCode: code, playerName, playerToken },
          callbackId: cbId
        });
      });

      conn.on('data', (data) => {
        if (!data) return;
        if (data.type === 'room_update') {
          this.emitLocal('room_update', data.room);
        } else if (data.type === 'callback' && data.callbackId) {
          const cb = this.pendingCallbacks.get(data.callbackId);
          if (cb) {
            this.pendingCallbacks.delete(data.callbackId);
            cb(data.response);
          }
        } else if (data.type === 'room_closed') {
          sessionStorage.removeItem('whoami_session');
          this.emitLocal('room_update', null);
        } else if (data.type === 'kicked') {
          sessionStorage.removeItem('whoami_session');
          this.emitLocal('kicked', data.reason || 'Kamu telah dikeluarkan dari room oleh Host.');
          this.emitLocal('room_update', null);
        }
      });

      conn.on('close', () => {
        console.warn('Disconnected from host');
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        if (!callbackCalled) {
          callbackCalled = true;
          if (callback) callback({ success: false, error: 'Gagal terhubung ke Host: ' + (err.message || 'Coba lagi') });
        }
      });
    });

    peer.on('error', (err) => {
      clearTimeout(timeout);
      if (!callbackCalled) {
        callbackCalled = true;
        if (err.type === 'peer-unavailable') {
          if (callback) callback({ success: false, error: 'Room tidak ditemukan! Pastikan kode room benar.' });
        } else {
          if (callback) callback({ success: false, error: 'Koneksi error: ' + (err.message || 'Coba lagi') });
        }
      }
    });
  }

  // Guest: Send message with callback to host
  sendToHost(action, payload = {}, callback = null) {
    if (!this.hostConn || !this.hostConn.open) {
      if (callback) callback({ success: false, error: 'Terputus dari Host' });
      return;
    }

    let cbId = null;
    if (callback) {
      cbId = ++this.callbackCounter;
      this.pendingCallbacks.set(cbId, callback);
    }

    this.hostConn.send({ action, payload, callbackId: cbId });
  }

  // 3. Update Settings (Host Only)
  handleUpdateSettings({ settings }) {
    if (!this.isHost) return;
    const room = rooms.get(this.currentRoomCode);
    if (!room) return;

    room.settings = { ...room.settings, ...settings };
    this.broadcastRoom(room);
  }

  // 4. Start Game (Host Only)
  handleStartGame(payload, callback) {
    if (!this.isHost) return;
    const room = rooms.get(this.currentRoomCode);
    if (!room) return;

    const result = startGame(room);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    if (callback) callback({ success: true });
    this.broadcastRoom(room);
  }

  // 5. Submit Secret Card
  handleSubmitSecretCard({ cardName, hint }, callback) {
    if (this.isHost) {
      const room = rooms.get(this.currentRoomCode);
      if (!room) return;

      const result = submitSecretCard(room, this.id, cardName, hint);
      if (result.error) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }
      if (callback) callback({ success: true });
      this.broadcastRoom(room);
    } else {
      this.sendToHost('submit_secret_card', { cardName, hint }, callback);
    }
  }

  // 6. End / Pass Turn
  handleEndTurn() {
    if (this.isHost) {
      const room = rooms.get(this.currentRoomCode);
      if (!room) return;
      nextTurn(room);
      this.broadcastRoom(room);
    } else {
      this.sendToHost('end_turn');
    }
  }

  // 7. Guess Identity
  handleGuessIdentity({ guessName }, callback) {
    if (this.isHost) {
      const room = rooms.get(this.currentRoomCode);
      if (!room) return;

      const result = evaluateGuess(room, this.id, guessName);
      if (result.error) {
        if (callback) callback({ success: false, error: result.error });
        return;
      }
      if (callback) callback({ success: true, correct: result.correct, isClanOnly: result.isClanOnly });
      this.broadcastRoom(room);
    } else {
      this.sendToHost('guess_identity', { guessName }, callback);
    }
  }

  // 8. Manual Confirm Guess (Host)
  handleManualConfirmGuess({ targetPlayerId, isCorrect }) {
    if (!this.isHost) return;
    const room = rooms.get(this.currentRoomCode);
    if (!room) return;

    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    if (isCorrect) {
      targetPlayer.isGuessed = true;
    }
    nextTurn(room);
    this.broadcastRoom(room);
  }

  // 9. Reshuffle / Bagi Kartu Baru (Host)
  handleReshuffleCards(callback) {
    if (!this.isHost) {
      if (callback) callback({ success: false, error: 'Hanya host yang bisa mengacak kartu!' });
      return;
    }
    const room = rooms.get(this.currentRoomCode);
    if (!room) return;

    if (room.settings.mode === 'custom') {
      room.status = 'SECRET_INPUT';
      room.players.forEach(p => {
        p.submittedCard = null;
        p.assignedCard = null;
        p.isGuessed = false;
        p.finishRank = null;
        p.notes = '';
      });
    } else {
      dealCards(room);
      room.status = 'PLAYING';
    }

    this.broadcastRoom(room);
    if (callback) callback({ success: true });
  }

  // 10. Back to Lobby (Host)
  handleBackToLobby(callback) {
    if (!this.isHost) return;
    const room = rooms.get(this.currentRoomCode);
    if (!room) return;

    room.status = 'LOBBY';
    room.players.forEach(p => {
      p.isGuessed = false;
      p.finishRank = null;
      p.assignedCard = null;
      p.submittedCard = null;
      p.notes = '';
    });

    this.broadcastRoom(room);
    if (callback) callback({ success: true });
  }

  // 11. Save Notes
  handleSaveNotes({ notes }) {
    if (this.isHost) {
      const room = rooms.get(this.currentRoomCode);
      if (!room) return;
      const player = room.players.find(p => p.id === this.id);
      if (player) {
        player.notes = notes;
      }
    } else {
      this.sendToHost('save_notes', { notes });
    }
  }

  // 12. Kick Player (Host Only)
  handleKickPlayer({ targetPlayerId }, callback) {
    if (!this.isHost) {
      if (callback) callback({ success: false, error: 'Hanya host yang bisa mengeluarkan pemain!' });
      return;
    }
    const room = rooms.get(this.currentRoomCode);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room tidak ditemukan!' });
      return;
    }

    const result = kickPlayer(room, this.id, targetPlayerId);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    const targetConn = this.guestConns.get(targetPlayerId);
    if (targetConn && targetConn.open) {
      try {
        targetConn.send({ type: 'kicked', reason: 'Kamu telah dikeluarkan dari room oleh Host.' });
      } catch (e) {}
      setTimeout(() => {
        try { targetConn.close(); } catch (e) {}
      }, 300);
    }
    this.guestConns.delete(targetPlayerId);

    this.broadcastRoom(room);
    if (callback) callback({ success: true });
  }

  // 13. Leave Room
  handleLeaveRoom() {
    if (this.isHost) {
      // Notify all guests that room is closing
      for (const conn of this.guestConns.values()) {
        if (conn.open) {
          try {
            conn.send({ type: 'room_closed' });
          } catch (e) {}
        }
      }
      if (this.currentRoomCode) {
        rooms.delete(this.currentRoomCode);
      }
    } else {
      this.sendToHost('leave_room');
    }

    if (this.peer && !this.peer.destroyed) {
      try {
        this.peer.destroy();
      } catch (e) {}
    }

    sessionStorage.removeItem('whoami_session');
    sessionStorage.removeItem('whoami_host_room_state');
    this.currentRoomCode = null;
    this.isHost = false;
    this.guestConns.clear();
    this.hostConn = null;
  }
}

export const socket = new WebRTCSocket();
