import { X, Heart, ThumbsDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActionButtons({ onAction, vetosLeft, disableVeto }) {
  return (
    <div className="flex items-center justify-center gap-6 w-full">
      {/* Left Swipe Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onAction('left')}
        className="w-16 h-16 flex items-center justify-center bg-zinc-800 rounded-full border-2 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-500 hover:text-white transition-colors duration-200"
      >
        <X size={32} strokeWidth={3} />
      </motion.button>

      {/* Veto Button */}
      <motion.button
        whileHover={{ scale: disableVeto ? 1 : 1.1 }}
        whileTap={{ scale: disableVeto ? 1 : 0.9 }}
        onClick={() => onAction('veto')}
        disabled={disableVeto}
        className={`relative w-14 h-14 flex items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          disableVeto 
            ? 'bg-zinc-900 border-zinc-700 text-zinc-600 opacity-50 cursor-not-allowed' 
            : 'bg-zinc-800 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-500 hover:text-zinc-900'
        }`}
      >
        <ThumbsDown size={24} strokeWidth={2.5} />
        {/* Veto Counter Badge */}
        {!disableVeto && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-zinc-900 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-zinc-950">
            {vetosLeft} left
          </div>
        )}
      </motion.button>

      {/* Right Swipe Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onAction('right')}
        className="w-16 h-16 flex items-center justify-center bg-zinc-800 rounded-full border-2 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-500 hover:text-white transition-colors duration-200"
      >
        <Heart size={30} strokeWidth={3} fill="currentColor" />
      </motion.button>
    </div>
  );
}
