import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, Users, Sliders, Loader2, Crown } from 'lucide-react';
import { fetchPlayers, fetchRoomStatus, updateRoomSettings, startRoom } from '../api';
import { socket } from '../socket';

const INDUSTRIES = [
  { id: 'hollywood', label: 'Hollywood', emoji: '🇺🇸' },
  { id: 'bollywood', label: 'Bollywood', emoji: '🇮🇳' },
  { id: 'kollywood', label: 'Kollywood', emoji: '🎬' },
  { id: 'malayalam', label: 'Malayalam', emoji: '🌴' },
  { id: 'tollywood', label: 'Tollywood', emoji: '🎥' },
  { id: 'korean', label: 'Korean', emoji: '🇰🇷' },
  { id: 'indonesian', label: 'Indonesian', emoji: '🇮🇩' },
];

const LANGUAGES = [
  { id: 'hi', label: 'Hindi' },
  { id: 'en', label: 'English' },
  { id: 'te', label: 'Telugu' },
  { id: 'ta', label: 'Tamil' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'ko', label: 'Korean' },
];

const PROVIDERS = [
  { id: '8', label: 'Netflix' },
  { id: '9', label: 'Prime Video' },
  { id: '337', label: 'Disney+' },
  { id: '15', label: 'Hulu' },
  { id: '1899', label: 'Max' },
];

const GENRES = [
  { id: '28', label: 'Action' },
  { id: '35', label: 'Comedy' },
  { id: '27', label: 'Horror' },
  { id: '878', label: 'Sci-Fi' },
  { id: '10749', label: 'Romance' },
];

export default function WaitingRoom({ roomCode, sessionId, isHost, displayName, onStartSwiping }) {
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // Host settings state
  const [targetRecs, setTargetRecs] = useState(10);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [runtimeLimit, setRuntimeLimit] = useState(false);

  // Poll for players every 3 seconds
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchPlayers(roomCode);
        setPlayers(data.players);
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    loadPlayers();
    const interval = setInterval(loadPlayers, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  // Non-host players listen for game_started socket event
  useEffect(() => {
    if (isHost) return;

    // Optional: still fetch once just in case we joined after start
    fetchRoomStatus(roomCode).then(data => {
      if (data.status === 'swiping') {
        onStartSwiping();
      }
    }).catch(err => console.error(err));

    socket.on('game_started', () => {
      onStartSwiping();
    });

    return () => {
      socket.off('game_started');
    };
  }, [roomCode, isHost, onStartSwiping]);

  // Join the socket room on mount
  useEffect(() => {
    socket.emit('join_room', { room_code: roomCode });
  }, [roomCode]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomCode]);

  const toggleSelection = (id, setter) => {
    setter(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      // Save settings first
      await updateRoomSettings(roomCode, sessionId, {
        target_recommendations: targetRecs,
        industry_filter: selectedIndustries.join(','),
        language_filter: selectedLanguages.join(','),
        provider_filter: selectedProviders.join(','),
        genre_filter: selectedGenres.join(','),
        runtime_limit: runtimeLimit
      });
      // Then trigger start (fetches TMDB movies and sets status to 'swiping')
      await startRoom(roomCode, sessionId);
      socket.emit('start_swiping', { room_code: roomCode });
      onStartSwiping();
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center px-5 py-8 bg-zinc-950 relative overflow-y-auto overflow-x-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">
          Movie Matcher
        </h1>
        <p className="text-white/40 text-sm">
          {isHost ? 'You are the host' : `Joined as ${displayName}`}
        </p>
      </div>

      {/* Room Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md glass-panel rounded-2xl p-6 flex flex-col items-center gap-3 z-10 mb-5"
      >
        <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Share this code</p>
        <div className="flex items-center gap-4">
          <span className="text-4xl font-extrabold tracking-[0.4em] text-white">
            {roomCode}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopyCode}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
          </motion.button>
        </div>
      </motion.div>

      {/* Players List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md glass-panel rounded-2xl p-5 z-10 mb-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white/70">
            <Users size={18} />
            <span className="text-sm font-semibold">Players in Lobby</span>
          </div>
          <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full text-white/60">
            {players.length + 1}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Host is always first */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              <Crown size={16} />
            </div>
            <span className="text-white font-semibold text-sm flex-grow">
              {isHost ? 'You (Host)' : 'Host'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand/20 px-2 py-0.5 rounded-full">
              Host
            </span>
          </div>

          {players.map((player, idx) => (
            <motion.div
              key={player.session_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {player.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white/80 font-medium text-sm">
                {player.display_name}
                {player.session_id === sessionId && !isHost ? ' (You)' : ''}
              </span>
            </motion.div>
          ))}

          {players.length === 0 && (
            <div className="text-center py-4 text-white/30 text-sm">
              <div className="animate-pulse">Waiting for players to join...</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Host Settings Panel */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md glass-panel rounded-2xl p-5 z-10 mb-5"
        >
          <div className="flex items-center gap-2 text-white/70 mb-5">
            <Sliders size={18} />
            <span className="text-sm font-semibold">Room Settings</span>
          </div>

          {/* Target Recommendations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wide">
                Target Recommendations
              </label>
              <span className="text-brand font-bold text-lg tabular-nums">{targetRecs}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={targetRecs}
              onChange={(e) => setTargetRecs(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-brand"
            />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* Industry Filters */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-3">
              Industry Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(ind => {
                const active = selectedIndustries.includes(ind.id);
                return (
                  <motion.button
                    key={ind.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(ind.id, setSelectedIndustries)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                      active
                        ? 'bg-brand/20 border-brand/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {ind.emoji} {ind.label}
                  </motion.button>
                );
              })}
            </div>
            {selectedIndustries.length === 0 && (
              <p className="text-white/30 text-xs mt-2">No filter = top popular movies globally</p>
            )}
          </div>

          {/* Languages Filters */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-3">
              Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => {
                const active = selectedLanguages.includes(lang.id);
                return (
                  <motion.button
                    key={lang.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(lang.id, setSelectedLanguages)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      active
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {lang.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Providers Filters */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-3">
              Streaming Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map(prov => {
                const active = selectedProviders.includes(prov.id);
                return (
                  <motion.button
                    key={prov.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(prov.id, setSelectedProviders)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      active
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {prov.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Genres Filters */}
          <div className="mb-6">
            <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-3">
              Genres
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => {
                const active = selectedGenres.includes(genre.id);
                return (
                  <motion.button
                    key={genre.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSelection(genre.id, setSelectedGenres)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {genre.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Runtime Limit */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={runtimeLimit}
                  onChange={(e) => setRuntimeLimit(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${runtimeLimit ? 'bg-brand' : 'bg-zinc-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${runtimeLimit ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-semibold text-white/80">Limit to under 2 hours</span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-md px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center z-10 mb-4">
          {error}
        </div>
      )}

      {/* Start Button (Host only) */}
      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md z-10 mt-auto pt-4 pb-2"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={starting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {starting ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Play size={22} fill="white" />
            )}
            {starting ? 'Loading Movies...' : 'Start Swiping'}
          </motion.button>
        </motion.div>
      )}

      {/* Non-host waiting message */}
      {!isHost && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md z-10 mt-auto pt-4 pb-2"
        >
          <div className="w-full py-4 rounded-2xl glass-panel text-white/50 font-medium text-center flex items-center justify-center gap-3">
            <Loader2 size={18} className="animate-spin" />
            Waiting for host to start...
          </div>
        </motion.div>
      )}
    </div>
  );
}
