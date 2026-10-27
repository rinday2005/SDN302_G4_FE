import React, { useState } from 'react';

export interface StarRatingProps {
  value: number; // 1 to 5
  onChange?: (val: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: '1 sao · Rất không hài lòng',
  2: '2 sao · Chưa hài lòng',
  3: '3 sao · Bình thường',
  4: '4 sao · Hài lòng',
  5: '5 sao · Tuyệt vời & Rất hài lòng',
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  interactive = false,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: 'text-sm gap-0.5',
    md: 'text-base sm:text-lg gap-1',
    lg: 'text-xl sm:text-2xl gap-1.5',
    xl: 'text-2xl sm:text-3xl gap-2',
  }[size];

  const starIconSize = {
    sm: 'text-[15px]',
    md: 'text-[19px]',
    lg: 'text-[26px]',
    xl: 'text-[32px]',
  }[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`flex items-center ${sizeClasses}`}>
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const isFilled = starNumber <= activeValue;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!interactive}
              onClick={() => {
                if (interactive && onChange) {
                  // AC: Rating chỉ từ 1 đến 5
                  onChange(starNumber);
                }
              }}
              onMouseEnter={() => {
                if (interactive) setHoverValue(starNumber);
              }}
              onMouseLeave={() => {
                if (interactive) setHoverValue(null);
              }}
              className={`transition-transform focus:outline-none ${
                interactive
                  ? 'cursor-pointer hover:scale-115 active:scale-95'
                  : 'cursor-default pointer-events-none'
              }`}
              title={`${starNumber} sao`}
              aria-label={`Đánh giá ${starNumber} sao`}
            >
              <span
                className={`material-symbols-outlined transition-colors duration-150 ${starIconSize} ${
                  isFilled ? 'text-amber-400' : 'text-stone-300'
                }`}
                style={{
                  fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                star
              </span>
            </button>
          );
        })}

        {!interactive && value > 0 && (
          <span className="ml-1.5 font-bold text-xs sm:text-sm text-[#1C1A18]">
            {value.toFixed(1)}
          </span>
        )}
      </div>

      {showLabel && activeValue > 0 && (
        <span className="text-[11px] sm:text-xs font-semibold text-amber-700 mt-1 transition-opacity">
          {RATING_DESCRIPTIONS[activeValue] || ''}
        </span>
      )}
    </div>
  );
};

export default StarRating;
