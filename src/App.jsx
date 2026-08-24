import { useState, useRef } from 'react';
import SwipeCard from './components/SwipeCard';
import ActionButtons from './components/ActionButtons';

const DUMMY_MOVIES = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    whereToWatch: ["Netflix", "Amazon Prime"],
    thumbnail: "https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQGNV5Pu5.jpg"
  },
  {
    id: 2,
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac"],
    whereToWatch: ["Netflix"],
    thumbnail: "https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"
  },
  {
    id: 3,
    title: "Everything Everywhere All at Once",
    year: 2022,
    cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu"],
    whereToWatch: ["Hulu"],
    thumbnail: "https://image.tmdb.org/t/p/original/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg"
  },
  {
    id: 4,
    title: "The Dark Knight",
    year: 2008,
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    whereToWatch: ["Max"],
    thumbnail: "https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
  },
  {
    id: 5,
    title: "Parasite",
    year: 2019,
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"],
    whereToWatch: ["Hulu", "Max"],
    thumbnail: "https://image.tmdb.org/t/p/original/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg"
  }
];

function App() {
  const [movies, setMovies] = useState(DUMMY_MOVIES);
  const [vetosLeft, setVetosLeft] = useState(3);

  const activeCardRef = useRef(null);

  const handleAction = (action) => {
    if (movies.length === 0) return;
    
    if (action === 'veto') {
      if (vetosLeft > 0) {
        activeCardRef.current?.triggerSwipe('down');
      }
    } else {
      activeCardRef.current?.triggerSwipe(action);
    }
  };

  const handleDragEnd = () => {
     setMovies(prev => prev.slice(1));
  };
  
  const handleVetoUsed = () => {
      setVetosLeft(prev => prev - 1);
      setMovies(prev => prev.slice(1));
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden bg-zinc-950">
      
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">
          Movie Matcher
        </h1>
        <div className="glass-panel px-3 py-1.5 rounded-full text-xs font-medium text-white/80">
          Room: ABCD12
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
            <p>Waiting for host...</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="z-10 w-full max-w-sm">
        <ActionButtons onAction={handleAction} vetosLeft={vetosLeft} disableVeto={vetosLeft === 0} />
      </div>

    </div>
  );
}

export default App;
