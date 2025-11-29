import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Mood value ranges: 0-20 Very Unpleasant, 20-40 Unpleasant, 40-60 Neutral, 60-80 Pleasant, 80-100 Very Pleasant

const MOOD_LABELS = [
  { min: 0, max: 20, label: 'Very Unpleasant', color: 'from-red-500 to-red-600', emoji: '😢' },
  { min: 20, max: 40, label: 'Unpleasant', color: 'from-orange-400 to-orange-500', emoji: '😕' },
  { min: 40, max: 60, label: 'Neutral', color: 'from-yellow-400 to-yellow-500', emoji: '😐' },
  { min: 60, max: 80, label: 'Pleasant', color: 'from-lime-400 to-green-500', emoji: '🙂' },
  { min: 80, max: 100, label: 'Very Pleasant', color: 'from-green-400 to-emerald-500', emoji: '😊' },
];

const EMOTIONS = [
  // Positive emotions
  { name: 'Happy', emoji: '😊', category: 'positive' },
  { name: 'Grateful', emoji: '🙏', category: 'positive' },
  { name: 'Excited', emoji: '🎉', category: 'positive' },
  { name: 'Calm', emoji: '😌', category: 'positive' },
  { name: 'Proud', emoji: '💪', category: 'positive' },
  { name: 'Hopeful', emoji: '✨', category: 'positive' },
  { name: 'Loved', emoji: '❤️', category: 'positive' },
  { name: 'Inspired', emoji: '💡', category: 'positive' },
  // Neutral emotions
  { name: 'Thoughtful', emoji: '🤔', category: 'neutral' },
  { name: 'Curious', emoji: '🧐', category: 'neutral' },
  { name: 'Surprised', emoji: '😮', category: 'neutral' },
  { name: 'Nostalgic', emoji: '💭', category: 'neutral' },
  // Negative emotions
  { name: 'Anxious', emoji: '😰', category: 'negative' },
  { name: 'Sad', emoji: '😢', category: 'negative' },
  { name: 'Frustrated', emoji: '😤', category: 'negative' },
  { name: 'Tired', emoji: '😴', category: 'negative' },
  { name: 'Stressed', emoji: '😫', category: 'negative' },
  { name: 'Lonely', emoji: '🥺', category: 'negative' },
];

const getMoodInfo = (value) => {
  return MOOD_LABELS.find(m => value >= m.min && value <= m.max) || MOOD_LABELS[2];
};

const MoodSlider = ({ value, onChange }) => {
  const moodInfo = getMoodInfo(value);
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div className="space-y-4">
      {/* Mood Emoji and Label */}
      <div className="text-center">
        <motion.div
          key={moodInfo.emoji}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="text-6xl mb-2"
        >
          {moodInfo.emoji}
        </motion.div>
        <motion.p
          key={moodInfo.label}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'text-lg font-medium bg-gradient-to-r bg-clip-text text-transparent',
            moodInfo.color
          )}
        >
          {moodInfo.label}
        </motion.p>
      </div>
      
      {/* Custom Slider */}
      <div className="relative px-2 py-4">
        {/* Track background with gradient */}
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 opacity-30" />
        
        {/* Active track */}
        <motion.div
          className={cn('absolute left-2 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r', moodInfo.color)}
          style={{ width: `${value}%` }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        {/* Input slider (invisible but functional) */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="relative w-full h-8 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-black/20
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:cursor-grab
          "
        />
        
        {/* Thumb glow effect */}
        <motion.div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full blur-md opacity-50 pointer-events-none bg-gradient-to-r',
            moodInfo.color
          )}
          style={{ left: `calc(${value}% - 20px + 8px)` }}
          animate={{
            scale: isDragging ? 1.5 : 1,
            opacity: isDragging ? 0.7 : 0.5,
          }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>Very Unpleasant</span>
        <span>Very Pleasant</span>
      </div>
    </div>
  );
};

const EmotionTag = ({ emotion, isSelected, onToggle }) => {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(emotion.name)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
        isSelected
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      <span className="text-base">{emotion.emoji}</span>
      <span>{emotion.name}</span>
      {isSelected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
        />
      )}
    </motion.button>
  );
};

export default function MoodSelector({ mood, onChange, onDone, compact = false }) {
  const [moodValue, setMoodValue] = useState(mood?.value ?? 50);
  const [selectedEmotions, setSelectedEmotions] = useState(mood?.emotions ?? []);
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  
  // Sync with prop changes
  useEffect(() => {
    if (mood) {
      setMoodValue(mood.value ?? 50);
      setSelectedEmotions(mood.emotions ?? []);
    }
  }, [mood]);
  
  // Debounced onChange
  const handleChange = useCallback((newValue, newEmotions) => {
    onChange?.({ value: newValue, emotions: newEmotions });
  }, [onChange]);
  
  const handleMoodChange = (value) => {
    setMoodValue(value);
    handleChange(value, selectedEmotions);
  };
  
  const handleEmotionToggle = (emotionName) => {
    const newEmotions = selectedEmotions.includes(emotionName)
      ? selectedEmotions.filter(e => e !== emotionName)
      : [...selectedEmotions, emotionName];
    
    setSelectedEmotions(newEmotions);
    handleChange(moodValue, newEmotions);
  };
  
  // Get suggested emotions based on mood value
  const getSuggestedEmotions = () => {
    if (moodValue >= 60) return EMOTIONS.filter(e => e.category === 'positive');
    if (moodValue <= 40) return EMOTIONS.filter(e => e.category === 'negative');
    return EMOTIONS.filter(e => e.category === 'neutral');
  };
  
  const displayedEmotions = showAllEmotions ? EMOTIONS : getSuggestedEmotions();
  
  if (compact) {
    const moodInfo = getMoodInfo(moodValue);
    return (
      <div className="flex items-center gap-3">
        <span className="text-2xl">{moodInfo.emoji}</span>
        <div className="flex flex-wrap gap-1">
          {selectedEmotions.slice(0, 3).map(emotionName => {
            const emotion = EMOTIONS.find(e => e.name === emotionName);
            return emotion ? (
              <span key={emotionName} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {emotion.emoji} {emotion.name}
              </span>
            ) : null;
          })}
          {selectedEmotions.length > 3 && (
            <span className="text-xs text-muted-foreground">+{selectedEmotions.length - 3}</span>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-1">How are you feeling?</h3>
        <p className="text-sm text-muted-foreground">Move the slider and select emotions that describe your mood</p>
      </div>
      
      {/* Mood Slider */}
      <MoodSlider value={moodValue} onChange={handleMoodChange} />
      
      {/* Emotions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            {showAllEmotions ? 'All Emotions' : 'Suggested Emotions'}
          </h4>
          <button
            type="button"
            onClick={() => setShowAllEmotions(!showAllEmotions)}
            className="text-xs text-primary hover:underline"
          >
            {showAllEmotions ? 'Show Suggested' : 'Show All'}
          </button>
        </div>
        
        <motion.div
          layout
          className="flex flex-wrap gap-2"
        >
          <AnimatePresence mode="popLayout">
            {displayedEmotions.map((emotion) => (
              <motion.div
                key={emotion.name}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <EmotionTag
                  emotion={emotion}
                  isSelected={selectedEmotions.includes(emotion.name)}
                  onToggle={handleEmotionToggle}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Selected emotions summary */}
      {selectedEmotions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground">Selected: </span>
          {selectedEmotions.join(', ')}
        </motion.div>
      )}
      
      {/* Done button */}
      {onDone && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDone}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Done
        </motion.button>
      )}
    </div>
  );
}

// Export for use in other components
export { MOOD_LABELS, EMOTIONS, getMoodInfo };
