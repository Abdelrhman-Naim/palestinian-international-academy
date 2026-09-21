import React, { useState } from 'react';

export default function StarRating({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'md',
  showLabel = false 
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const starDimensions = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const containerGaps = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
    xl: 'gap-2.5',
  };

  const labels = {
    1: 'ضعيف جداً',
    2: 'مقبول',
    3: 'جيد',
    4: 'جيد جداً',
    5: 'ممتاز وفوق التوقعات',
  };

  const activeValue = hoverValue || value;

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Stars Row Container with single onMouseLeave to prevent any flicker */}
      <div 
        className={`flex items-center shrink-0 ${containerGaps[size] || containerGaps.md}`}
        onMouseLeave={() => !readOnly && setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeValue >= star;
          const isHalf = !isFilled && activeValue >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onFocus={() => !readOnly && setHoverValue(star)}
              className={`p-1 border-0 bg-transparent leading-none flex items-center justify-center transition-none outline-none ${
                readOnly 
                  ? 'cursor-default' 
                  : 'cursor-pointer active:scale-95'
              }`}
              title={!readOnly ? `${star} من 5 (${labels[star]})` : undefined}
            >
              <svg 
                className={`${starDimensions[size] || starDimensions.md} transition-colors duration-100 ${
                  isFilled || isHalf
                    ? 'text-amber-400 drop-shadow-[0_1px_3px_rgba(245,158,11,0.35)]'
                    : 'text-stone-300 dark:text-stone-700'
                }`} 
                viewBox="0 0 24 24"
              >
                {isFilled ? (
                  // Full Solid Star
                  <path 
                    fill="currentColor" 
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
                  />
                ) : isHalf ? (
                  // Half Star (Left Filled, Right Outline)
                  <g>
                    <path 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.8" 
                      strokeLinejoin="round" 
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
                    />
                    <path 
                      fill="currentColor" 
                      d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27V2z" 
                    />
                  </g>
                ) : (
                  // Outline Empty Star
                  <path 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.8" 
                    strokeLinejoin="round" 
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>

      {/* Fixed-width label container: Never causes layout shifting or vibrating flicker */}
      {showLabel && !readOnly && (
        <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-alexandria w-32 shrink-0 text-start min-h-[20px] flex items-center">
          {activeValue > 0 ? labels[activeValue] : ''}
        </span>
      )}
    </div>
  );
}
