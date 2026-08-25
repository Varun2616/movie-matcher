import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Onboarding from './components/Onboarding';
import SwipeDeck from './components/SwipeDeck';

function App() {
  const [screen, setScreen] = useState('onboarding'); // 'onboarding' | 'swiping'
  const [roomData, setRoomData] = useState(null);

  const handleRoomReady = (data) => {
    setRoomData(data);
    setScreen('swiping');
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
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
