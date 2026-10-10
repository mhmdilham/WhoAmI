import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/sfx';
import { copyToClipboard } from '../utils/clipboard';

import GameHeader from './game/GameHeader';
import TurnBanner from './game/TurnBanner';
import PlayerCard from './game/PlayerCard';
import PodiumView from './game/PodiumView';
import GuessModal from './GuessModal';

export default function GameBoard({ room, myPlayerId, onLeave }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [reshuffling, setReshuffling] = useState(false);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [notes, setNotes] = useState('');

  const isHost = room.hostId === myPlayerId;
  const myPlayer = room.players.find(p => p.id === myPlayerId);
  const currentTurnPlayer = room.players[room.currentTurnIndex];
  const isMyTurn = currentTurnPlayer?.id === myPlayerId;
  const isGameOver = room.status === 'GAME_OVER';

  // Load initial notes from room state
  useEffect(() => {
    if (myPlayer?.notes !== undefined) {
      setNotes(myPlayer.notes || '');
    }
  }, [myPlayer?.notes]);

  // Turn announcement SFX
  useEffect(() => {
    if (room.status === 'PLAYING') {
      if (isMyTurn) {
        sfx.playTurn();
      }
    } else if (room.status === 'GAME_OVER') {
      sfx.playWin();
    }
  }, [room.currentTurnIndex, room.status, isMyTurn]);

  // Reveal own card if guessed or if game is over
  useEffect(() => {
    if (myPlayer?.isGuessed || isGameOver) {
      setIsCardRevealed(true);
    }
  }, [myPlayer?.isGuessed, isGameOver]);

  const handleNotesChange = (text) => {
    setNotes(text);
    socket.emit('save_notes', { notes: text });
  };

  const handleEndTurn = () => {
    socket.emit('end_turn');
  };

  const handleKickPlayer = (targetId, targetName) => {
    if (!isHost) return;
    if (window.confirm(`Keluarkan ${targetName} dari room?`)) {
      socket.emit('kick_player', { targetPlayerId: targetId });
    }
  };

  const handleReshuffleCards = () => {
    if (!isHost || reshuffling) return;
    setReshuffling(true);
    socket.emit('reshuffle_cards', {}, () => {
      setReshuffling(false);
      setIsCardRevealed(false);
    });
  };

  const handleBackToLobby = () => {
    if (!isHost) return;
    socket.emit('back_to_lobby', {});
  };

  const handleCopyCode = () => {
    copyToClipboard(room.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto px-4 py-4 min-h-[95vh]">
      {/* 1. Header with Room Info & Controls */}
      <GameHeader
        roomCode={room.code}
        copiedCode={copiedCode}
        onCopyCode={handleCopyCode}
        difficulty={room.settings?.difficulty}
        isPresetMode={room.settings?.mode === 'preset'}
        isHost={isHost}
        reshuffling={reshuffling}
        onReshuffle={handleReshuffleCards}
        onBackToLobby={handleBackToLobby}
        onLeave={onLeave}
      />

      {/* 2. Top Arena: Game Over Podium OR Active Turn Banner */}
      {isGameOver ? (
        <PodiumView
          players={room.players}
          isHost={isHost}
          reshuffling={reshuffling}
          onReshuffle={handleReshuffleCards}
          onBackToLobby={handleBackToLobby}
        />
      ) : (
        <TurnBanner
          currentTurnPlayer={currentTurnPlayer}
          isMyTurn={isMyTurn}
          onOpenGuessModal={() => setIsGuessModalOpen(true)}
          onPassTurn={handleEndTurn}
        />
      )}

      {/* 3. Cards Board Grid ("Layar Jidat Digital") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {room.players.map((player) => {
          const isSelf = player.id === myPlayerId;
          const isTurn = player.id === currentTurnPlayer?.id && !isGameOver;

          return (
            <PlayerCard
              key={player.id}
              player={player}
              isSelf={isSelf}
              isTurn={isTurn}
              isCardRevealed={isCardRevealed}
              isGameOver={isGameOver}
              isHost={isHost}
              notes={notes}
              onNotesChange={handleNotesChange}
              onKickPlayer={handleKickPlayer}
            />
          );
        })}
      </div>

      {/* 4. Guess Identity Modal */}
      {isGuessModalOpen && (
        <GuessModal
          isOpen={isGuessModalOpen}
          onClose={() => setIsGuessModalOpen(false)}
        />
      )}
    </div>
  );
}
