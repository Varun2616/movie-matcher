import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Loader2 } from 'lucide-react';
import { fetchLeaderboard } from '../api';
import { socket } from '../socket';

export default function Leaderboard({ roomCode, sessionId, isHost }) {
  const [movies, setMovies] = useState([]);
  const [isTie, setIsTie] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Poll the leaderboard every 3 seconds to see live updates from other players
    const loadData = async () => {
      try {
        const data = await fetchLeaderboard(roomCode);
        setMovies(data);
        if (data.length > 1 && data[0].score > 0 && data[0].score === data[1].score) {
          setIsTie(true);
        } else {
          setIsTie(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-zinc-950">
        <Loader2 size={48} className="animate-spin text-brand mb-4" />
        <p className="text-white/50 text-lg font-medium">Calculating final results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-zinc-950 px-6">
        <div className="px-6 py-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 text-center max-w-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center px-5 py-8 bg-zinc-950 relative overflow-y-auto overflow-x-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md z-10 flex flex-col items-center gap-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-2 shadow-lg shadow-orange-500/30">
          <Trophy size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white text-center">
          Final Results
        </h1>
        <p className="text-white/50 text-sm font-medium uppercase tracking-widest">
          Room {roomCode}
        </p>
      </div>

      {/* Top 3 Podium (Optional, could just list them) */}
      <div className="w-full max-w-md z-10 flex flex-col gap-4">
        {movies.map((movie, index) => {
          const isWinner = index === 0;
          return (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl glass-panel ${isWinner ? 'border-brand/40 bg-brand/10' : ''
                }`}
            >
              {/* Rank / Thumbnail */}
              <div className="relative">
                <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 relative">
                  {movie.thumbnail ? (
                    <img
                      src={movie.thumbnail}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      No Image
                    </div>
                  )}
                  {/* Rank Badge */}
                  <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-zinc-300 text-zinc-800' :
                      index === 2 ? 'bg-orange-400 text-orange-950' :
                        'bg-zinc-800 text-white border border-zinc-700'
                    }`}>
                    #{index + 1}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-grow flex flex-col min-w-0">
                <h3 className="text-white font-bold text-lg leading-tight truncate">
                  {movie.title}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {movie.year || 'Unknown Year'}
                </p>
                <div className="flex items-center gap-1 mt-auto pt-2 text-yellow-400 font-semibold text-sm">
                  <Star size={14} fill="currentColor" />
                  {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                </div>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center justify-center px-4">
                <span className="text-3xl font-black text-white">{movie.score}</span>
                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest mt-1">Score</span>
              </div>
            </motion.div>
          );
        })}

        {movies.length === 0 && (
          <div className="text-center text-white/40 py-8">
            No movies found. Did everyone veto everything?
          </div>
        )}
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="w-full max-w-md z-10 mt-6 flex flex-col gap-3">
          {isTie && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => socket.emit('start_tiebreaker', { room_code: roomCode })}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              Run Tiebreaker
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => socket.emit('return_to_lobby', { room_code: roomCode })}
            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg border border-white/20 flex items-center justify-center gap-2 transition-colors"
          >
            Return to Lobby
          </motion.button>
        </div>
      )}

    </div>
  );
}
