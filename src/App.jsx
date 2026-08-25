import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Onboarding from './components/Onboarding';
import WaitingRoom from './components/WaitingRoom';
import SwipeDeck from './components/SwipeDeck';
import Leaderboard from './components/Leaderboard';
import { socket } from './socket';

function App() {
  const [screen, setScreen] = useState('onboarding'); // 'onboarding' | 'waiting' | 'swiping' | 'leaderboard'
  const [roomData, setRoomData] = useState(null);

  const [isTiebreaker, setIsTiebreaker] = useState(false);

  useEffect(() => {
    socket.on('lobby_restarted', () => {
      setScreen('waiting');
      setIsTiebreaker(false);
    });
    socket.on('tiebreaker_started', () => {
      setScreen('swiping');
      setIsTiebreaker(true);
    });
    socket.on('room_closed', () => {
      alert("The host has closed the room.");
      setScreen('onboarding');
      setRoomData(null);
      setIsTiebreaker(false);
    });
    return () => {
      socket.off('lobby_restarted');
      socket.off('tiebreaker_started');
      socket.off('room_closed');
    };
  }, []);

  const handleRoomReady = (data) => {
    setRoomData(data);
    setScreen('waiting');
  };

  const handleStartSwiping = () => {
    setScreen('swiping');
  };

  const handleDeckEmpty = () => {
    setScreen('leaderboard');
  };

  const handleLeaveRoom = () => {
    setScreen('onboarding');
    setRoomData(null);
    setIsTiebreaker(false);
  };

  return (
    <AnimatePresence mode="wait">
      {screen === 'onboarding' && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Onboarding onRoomReady={handleRoomReady} />
        </motion.div>
      )}

      {screen === 'waiting' && roomData && (
        <motion.div
          key="waiting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <WaitingRoom
            roomCode={roomData.roomCode}
            sessionId={roomData.sessionId}
            isHost={roomData.isHost}
            displayName={roomData.displayName}
            onStartSwiping={handleStartSwiping}
            onLeaveRoom={handleLeaveRoom}
          />
        </motion.div>
      )}

      {screen === 'swiping' && roomData && (
        <motion.div
          key="swiping"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SwipeDeck
            roomCode={roomData.roomCode}
            sessionId={roomData.sessionId}
            displayName={roomData.displayName}
            onDeckEmpty={handleDeckEmpty}
            isTiebreaker={isTiebreaker}
          />
        </motion.div>
      )}

      {screen === 'leaderboard' && roomData && (
        <motion.div
          key="leaderboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Leaderboard
            roomCode={roomData.roomCode}
            sessionId={roomData.sessionId}
            isHost={roomData.isHost}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
