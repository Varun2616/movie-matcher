import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import { fetchMovies } from '../api';
import { socket } from '../socket';

export default function SwipeDeck({ roomCode, sessionId, displayName, onDeckEmpty, isTiebreaker }) {
  const [movies, setMovies] = useState([]);
  const [vetosLeft, setVetosLeft] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  const activeCardRef = useRef(null);

  useEffect(() => {
    socket.on('show_leaderboard', () => {
      onDeckEmpty();
    });
    return () => socket.off('show_leaderboard');
  }, [onDeckEmpty]);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchMovies(roomCode);
        setMovies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, [roomCode]);

  const handleAction = (action) => {
    if (movies.length === 0) return;
    
    if (action === 'veto') {
      if (isTiebreaker) return;
      if (vetosLeft > 0) {
        activeCardRef.current?.triggerSwipe('down');
      }
    } else {
      activeCardRef.current?.triggerSwipe(action);
    }
  };

  const handleDragEnd = (direction) => {
    const movie = movies[0];
    if (movie) {
      socket.emit('swipe', { room_code: roomCode, movie_id: movie.id, action: direction === 'right' ? 'right' : 'left' });
    }
    setMovies(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setWaitingForOthers(true);
        socket.emit('deck_empty', { room_code: roomCode, session_id: sessionId });
      }
      return next;
    });
  };
  
  const handleVetoUsed = () => {
    if (isTiebreaker) return;
    const movie = movies[0];
    if (movie) {
      socket.emit('swipe', { room_code: roomCode, movie_id: movie.id, action: 'veto' });
    }
    setVetosLeft(prev => prev - 1);
    setMovies(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setWaitingForOthers(true);
        socket.emit('deck_empty', { room_code: roomCode, session_id: sessionId });
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-zinc-950">
        <Loader2 size={48} className="animate-spin text-brand mb-4" />
        <p className="text-white/50 text-lg font-medium">Loading your deck...</p>
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

  if (waitingForOthers) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-zinc-950 px-6">
        <Loader2 size={48} className="animate-spin text-brand mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Deck Complete!</h2>
        <p className="text-white/50 text-center">Waiting for other players to finish swiping...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden bg-zinc-950">
      
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">
          Movie Matcher
        </h1>
        <div className="glass-panel px-3 py-1.5 rounded-full text-xs font-medium text-white/80">
          Room: {roomCode}
        </div>
      </div>

      {/* Card Deck Area */}
      <div className="relative w-full max-w-sm flex-grow my-6 flex items-center justify-center perspective-[1000px]">
        {movies.length > 0 ? (
          movies.map((movie, index) => {
            // Only render the top 3 cards for performance and visual stacking
            if (index > 2) return null;
            
            return (
              <SwipeCard 
                key={movie.id} 
                movie={movie} 
                index={index} 
                isFront={index === 0}
                ref={index === 0 ? activeCardRef : null}
                onSwipe={handleDragEnd}
                onVeto={handleVetoUsed}
              />
            );
          }).reverse() // Reverse so index 0 renders last (on top)
        ) : (
          <div className="text-center text-white/50 animate-pulse">
            <h2 className="text-xl font-semibold mb-2">Deck Empty!</h2>
            <p>All movies have been swiped.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="z-10 w-full max-w-sm">
        <ActionButtons onAction={handleAction} vetosLeft={vetosLeft} disableVeto={vetosLeft === 0 || isTiebreaker} />
      </div>

    </div>
  );
}
