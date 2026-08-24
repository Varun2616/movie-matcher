import { forwardRef, useImperativeHandle, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Play, Info } from 'lucide-react';

const SwipeCard = forwardRef(({ movie, index, isFront, onSwipe, onVeto }, ref) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const [isProgrammatic, setIsProgrammatic] = useState(false);

  // Rotation based on X drag
  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  // Opacities for the overlays based on drag distances
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -100], [0, 1]);
  const vetoOpacity = useTransform(y, [0, 150], [0, 1]);

  useImperativeHandle(ref, () => ({
    triggerSwipe: async (direction) => {
      setIsProgrammatic(true);
      let targetX = 0;
      let targetY = 0;
      
      if (direction === 'left') targetX = -500;
      if (direction === 'right') targetX = 500;
      if (direction === 'down') targetY = 800;

      await controls.start({
        x: targetX,
        y: targetY,
        transition: { duration: 0.4, ease: "easeOut" }
      });

      if (direction === 'down') {
        onVeto();
      } else {
        onSwipe();
      }
    }
  }));

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100;
    const swipeDownThreshold = 150;

    if (info.offset.x > swipeThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      onSwipe('left');
    } else if (info.offset.y > swipeDownThreshold) {
      onVeto();
    } else {
      // Snap back if not dragged far enough
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  // Stack styling for cards behind the front one
  const scale = isFront ? 1 : 1 - (index * 0.05);
  const yOffset = isFront ? 0 : index * -15;

  return (
    <motion.div
      className="absolute w-full h-[65vh] rounded-3xl shadow-xl border border-white/10 overflow-hidden bg-zinc-900 origin-bottom"
      style={{
        x: isProgrammatic ? undefined : x,
        y: isProgrammatic ? undefined : y,
        rotate,
        scale,
        top: yOffset,
        zIndex: 10 - index
      }}
      animate={controls}
      drag={isFront ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={isFront ? { cursor: 'grabbing' } : {}}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${movie.thumbnail})` }}
      />
      
      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90 pointer-events-none" />

      {/* Swipe Status Overlays */}
      <motion.div 
        className="absolute inset-0 bg-green-500/40 flex items-center justify-center pointer-events-none z-20"
        style={{ opacity: likeOpacity }}
      >
        <div className="border-4 border-green-500 text-green-500 font-black text-6xl py-2 px-6 rounded-xl rotate-[-15deg] uppercase tracking-widest shadow-lg shadow-black/50 bg-black/40">
          LIKE
        </div>
      </motion.div>
      <motion.div 
        className="absolute inset-0 bg-red-500/40 flex items-center justify-center pointer-events-none z-20"
        style={{ opacity: nopeOpacity }}
      >
        <div className="border-4 border-red-500 text-red-500 font-black text-6xl py-2 px-6 rounded-xl rotate-[15deg] uppercase tracking-widest shadow-lg shadow-black/50 bg-black/40">
          NOPE
        </div>
      </motion.div>
      <motion.div 
        className="absolute inset-0 bg-yellow-500/50 flex flex-col items-center justify-center pointer-events-none z-20"
        style={{ opacity: vetoOpacity }}
      >
        <div className="border-4 border-yellow-500 text-yellow-500 font-black text-5xl py-2 px-6 rounded-xl uppercase tracking-widest shadow-lg shadow-black/50 bg-black/50 mb-2">
          VETO
        </div>
        <div className="text-yellow-400 font-bold bg-black/60 px-4 py-1 rounded-full text-lg shadow-black/50">
          Never Recommend
        </div>
      </motion.div>

      {/* Movie Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2 pointer-events-none z-10 text-white">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md leading-tight">
              {movie.title}
            </h2>
            <p className="text-white/80 font-medium text-lg flex items-center gap-2 mt-1">
              {movie.year}
            </p>
          </div>
          <div className="bg-brand text-white p-2 rounded-full backdrop-blur-md bg-opacity-90 shadow-lg mb-1 pointer-events-auto cursor-pointer hover:bg-brand-hover transition-colors">
            <Info size={24} />
          </div>
        </div>

        <p className="text-sm text-white/70 font-medium mt-1 drop-shadow-sm">
          {movie.cast.join(' • ')}
        </p>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {movie.whereToWatch.map(platform => (
            <div key={platform} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-xs font-semibold shrink-0">
              <Play size={12} className="fill-white" />
              {platform}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default SwipeCard;
