import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, Users, ArrowRight, Loader2 } from 'lucide-react';
import { createRoom, joinRoom } from '../api';

export default function Onboarding({ onRoomReady }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await createRoom();
      onRoomReady({
        roomCode: data.room_code,
        sessionId: data.host_session_id,
        isHost: true,
        displayName: 'Host'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim() || !displayName.trim()) {
      setError('Please enter both a room code and your name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await joinRoom(roomCode.trim(), displayName.trim());
      onRoomReady({
        roomCode: data.room_code,
        sessionId: data.session_id,
        isHost: false,
        displayName: data.display_name
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center px-6 bg-zinc-950 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {mode === null && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-8 z-10 w-full max-w-sm"
          >
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-orange-500 flex items-center justify-center shadow-xl shadow-brand/30">
                <Clapperboard size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent tracking-tight">
                Movie Matcher
              </h1>
              <p className="text-white/50 text-sm text-center max-w-[260px]">
                Swipe with friends and find the perfect movie to watch together.
              </p>
            </div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('create')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-orange-500 text-white font-bold text-lg shadow-lg shadow-brand/30 flex items-center justify-center gap-3 transition-shadow hover:shadow-brand/50"
            >
              <Clapperboard size={22} />
              Create a Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('join')}
              className="w-full py-4 rounded-2xl glass-panel text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
            >
              <Users size={22} />
              Join a Room
            </motion.button>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 z-10 w-full max-w-sm"
          >
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-orange-500 flex items-center justify-center shadow-lg shadow-brand/30">
                <Clapperboard size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">Create a Room</h2>
              <p className="text-white/50 text-sm text-center">
                Start a new session and share the code with your friends.
              </p>
            </div>

            {error && (
              <div className="w-full px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-orange-500 text-white font-bold text-lg shadow-lg shadow-brand/30 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <ArrowRight size={22} />
              )}
              {loading ? 'Creating Room...' : 'Generate Room Code'}
            </motion.button>

            <button
              onClick={() => { setMode(null); setError(''); }}
              className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-5 z-10 w-full max-w-sm"
          >
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Users size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mt-2">Join a Room</h2>
              <p className="text-white/50 text-sm text-center">
                Enter the 6-digit code shared by your host.
              </p>
            </div>

            {error && (
              <div className="w-full px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full py-4 px-5 rounded-2xl bg-zinc-900 border border-white/10 text-white text-center text-2xl font-bold tracking-[0.3em] placeholder:text-white/20 placeholder:tracking-[0.3em] focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20 transition-all"
            />

            <input
              type="text"
              maxLength={20}
              placeholder="Your Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full py-4 px-5 rounded-2xl bg-zinc-900 border border-white/10 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20 transition-all"
            />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <ArrowRight size={22} />
              )}
              {loading ? 'Joining...' : 'Join Room'}
            </motion.button>

            <button
              onClick={() => { setMode(null); setError(''); }}
              className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
