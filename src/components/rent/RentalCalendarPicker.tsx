import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { BookedDateRange } from '../../pages/data/rent/rentOrderDetailData';
import { findEarliestAvailableRentalRange } from '../../pages/data/rent/rentOrderDetailData';

interface RentalCalendarPickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (startDate: string, endDate: string, days: number) => void;
  bookedRanges?: BookedDateRange[];
  className?: string;
}

// Utility formatting helpers
const formatYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatDisplayDateVN = (ymd: string): { dayMonth: string; weekday: string } => {
  if (!ymd) return { dayMonth: '--/--', weekday: 'Chưa chọn' };
  const d = parseYMD(ymd);
  if (isNaN(d.getTime())) return { dayMonth: '--/--', weekday: 'Chưa chọn' };

  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return {
    dayMonth: `${day}/${month}/${year}`,
    weekday: weekdays[d.getDay()],
  };
};

export const RentalCalendarPicker: React.FC<RentalCalendarPickerProps> = ({
  startDate,
  endDate,
  onChange,
  bookedRanges = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Month navigation view
  const initialDate = startDate ? parseYMD(startDate) : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => formatYMD(new Date()), []);

  // Map booked ranges into a quick lookup set & note map
  const bookedDatesMap = useMemo(() => {
    const map = new Map<string, string>();
    bookedRanges.forEach((range) => {
      if (!range.startDate || !range.endDate) return;
      const cur = parseYMD(range.startDate);
      const end = parseYMD(range.endDate);
      while (cur <= end) {
        const ymd = formatYMD(cur);
        map.set(ymd, range.note || range.customerName || 'Đã có khách đặt thuê trước');
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [bookedRanges]);

  // Check if a range has any booked date conflict
  const hasBookedConflict = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    const cur = parseYMD(start <= end ? start : end);
    const stop = parseYMD(start <= end ? end : start);
    while (cur <= stop) {
      if (bookedDatesMap.has(formatYMD(cur))) {
        return true;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  };

  // Calculate rental duration in days
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = parseYMD(start);
    const e = parseYMD(end);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  // Sync internal state when external props change (adjust state during render)
  const [prevDates, setPrevDates] = useState({
    startDate,
    endDate,
    rangesCount: bookedRanges.length,
  });
  if (
    prevDates.startDate !== startDate ||
    prevDates.endDate !== endDate ||
    prevDates.rangesCount !== bookedRanges.length
  ) {
    setPrevDates({ startDate, endDate, rangesCount: bookedRanges.length });
    let nextStart = startDate;
    let nextEnd = endDate;
    if (
      !nextStart ||
      nextStart < todayStr ||
      bookedDatesMap.has(nextStart) ||
      (nextEnd && hasBookedConflict(nextStart, nextEnd))
    ) {
      const earliest = findEarliestAvailableRentalRange(
        bookedRanges,
        calculateDays(nextStart, nextEnd) || 3
      );
      nextStart = earliest.startDate;
      nextEnd = earliest.endDate;
    }
    setTempStart(nextStart);
    setTempEnd(nextEnd);
  }

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Days in current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday as 0: (getDay() + 6) % 7
    const startingDayIndex = (firstDay.getDay() + 6) % 7;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isBooked: boolean;
      bookedNote?: string;
    }> = [];

    // Preceding padding days from previous month
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      const str = formatYMD(prevDate);
      days.push({
        dateStr: str,
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        isPast: str < todayStr,
        isBooked: bookedDatesMap.has(str),
        bookedNote: bookedDatesMap.get(str),
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(viewYear, viewMonth, i);
      const str = formatYMD(curDate);
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: true,
        isPast: str < todayStr,
        isBooked: bookedDatesMap.has(str),
        bookedNote: bookedDatesMap.get(str),
      });
    }

    // Trailing padding days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const str = formatYMD(nextDate);
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: false,
        isPast: str < todayStr,
        isBooked: bookedDatesMap.has(str),
        bookedNote: bookedDatesMap.get(str),
      });
    }

    return days;
  }, [viewYear, viewMonth, todayStr, bookedDatesMap]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setErrorMessage(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle clicking a day cell
  const handleDayClick = (dateStr: string, isPast: boolean, isBooked: boolean) => {
    if (isPast || dateStr < todayStr) {
      setErrorMessage('Không được chọn thời gian trong quá khứ. Vui lòng chọn từ hôm nay trở đi!');
      return;
    }
    if (isBooked || bookedDatesMap.has(dateStr)) {
      setErrorMessage(`Thiết bị đã được thuê vào ngày ${formatDisplayDateVN(dateStr).dayMonth}. Vui lòng chọn ngày còn trống!`);
      return;
    }

    setErrorMessage(null);

    // If current tempStart is already invalid or booked, force new start
    if (selectionStep === 'start' || !tempStart || (tempStart && tempEnd) || bookedDatesMap.has(tempStart)) {
      // Start a new selection
      setTempStart(dateStr);
      setTempEnd('');
      setSelectionStep('end');
    } else {
      // Completing the range
      if (dateStr < tempStart) {
        // If clicked earlier than current start, make it new start (provided it's not past)
        setTempStart(dateStr);
        setTempEnd('');
      } else {
        // Check if there is any booked conflict between tempStart and dateStr
        if (hasBookedConflict(tempStart, dateStr)) {
          setErrorMessage('Khoảng thời gian bạn chọn có ngày thiết bị đã được khách khác đặt thuê. Vui lòng chọn lại khoảng ngày trống liên tục!');
          return;
        }

        setTempEnd(dateStr);
        const days = calculateDays(tempStart, dateStr);
        onChange(tempStart, dateStr, days);
        setSelectionStep('start');
        setIsOpen(false);
      }
    }
  };

  const isStartBooked = Boolean(tempStart && bookedDatesMap.has(tempStart));
  const isEndBooked = Boolean(tempEnd && bookedDatesMap.has(tempEnd));
  const isPastStart = Boolean(tempStart && tempStart < todayStr);
  const isPastEnd = Boolean(tempEnd && tempEnd < todayStr);
  const isConflict = Boolean(
    !tempStart ||
    isStartBooked ||
    isEndBooked ||
    isPastStart ||
    isPastEnd ||
    (tempStart && (tempEnd ? hasBookedConflict(tempStart, tempEnd) : false))
  );

  const handleApply = () => {
    if (!tempStart) return;
    if (tempStart < todayStr) {
      setErrorMessage('Không được chọn thời gian trong quá khứ. Vui lòng chọn từ hôm nay trở đi!');
      return;
    }
    if (bookedDatesMap.has(tempStart)) {
      setErrorMessage(`Ngày nhận máy ${formatDisplayDateVN(tempStart).dayMonth} đã có người thuê! Vui lòng chọn ngày còn trống trên lịch.`);
      return;
    }
    const finalEnd = tempEnd || tempStart;
    if (finalEnd < todayStr) {
      setErrorMessage('Ngày hoàn trả không thể ở trong quá khứ!');
      return;
    }
    if (bookedDatesMap.has(finalEnd)) {
      setErrorMessage(`Ngày hoàn trả ${formatDisplayDateVN(finalEnd).dayMonth} đã có người thuê! Vui lòng chọn ngày khác.`);
      return;
    }
    if (hasBookedConflict(tempStart, finalEnd)) {
      setErrorMessage('Khoảng thời gian chọn bị trùng với lịch đã có người thuê. Vui lòng chọn khoảng ngày trống liên tục!');
      return;
    }
    const days = calculateDays(tempStart, finalEnd);
    onChange(tempStart, finalEnd, days);
    setIsOpen(false);
  };

  const startInfo = formatDisplayDateVN(tempStart || startDate);
  const endInfo = formatDisplayDateVN(tempEnd || endDate);
  const totalDays = calculateDays(tempStart || startDate, tempEnd || endDate);
  const isTriggerStartBooked = Boolean((tempStart || startDate) && bookedDatesMap.has(tempStart || startDate));

  // Month title format: "Tháng 11, 2026"
  const monthTitle = `Tháng ${viewMonth + 1}, ${viewYear}`;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* ── Trigger Bar: Two Interactive Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Ngày nhận máy */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setIsOpen(true);
            setSelectionStep('start');
          }}
          className={`p-3 rounded-xl border transition-all text-left cursor-pointer group select-none ${
            isOpen && selectionStep === 'start'
              ? 'bg-white border-[#1C1A18] shadow-md ring-2 ring-[#1C1A18]/10'
              : isTriggerStartBooked
              ? 'bg-rose-50/80 border-rose-200'
              : 'bg-[#F4F0EA]/70 hover:bg-[#F4F0EA] border-transparent hover:border-[#E7E2DA]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#78736A] mb-1">
            <span>Ngày nhận máy</span>
            <span className="material-symbols-outlined text-[15px] text-[#1C1A18] group-hover:scale-110 transition-transform">
              calendar_month
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-bold font-mono ${isTriggerStartBooked ? 'text-rose-600 line-through' : 'text-[#1C1A18]'}`}>
              {startInfo.dayMonth}
            </span>
            {isTriggerStartBooked && (
              <span className="text-[10px] text-rose-600 font-bold bg-rose-100 px-1.5 py-0.2 rounded">
                Đã đặt
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#78736A] mt-0.5">{startInfo.weekday}</div>
        </div>

        {/* Card 2: Ngày hoàn trả */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setIsOpen(true);
            setSelectionStep('end');
          }}
          className={`p-3 rounded-xl border transition-all text-left cursor-pointer group select-none ${
            isOpen && selectionStep === 'end'
              ? 'bg-white border-[#1C1A18] shadow-md ring-2 ring-[#1C1A18]/10'
              : 'bg-[#F4F0EA]/70 hover:bg-[#F4F0EA] border-transparent hover:border-[#E7E2DA]'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#78736A] mb-1">
            <span>Ngày hoàn trả</span>
            <span className="material-symbols-outlined text-[15px] text-[#1C1A18] group-hover:scale-110 transition-transform">
              event_available
            </span>
          </div>
          <div className="text-sm font-bold text-[#1C1A18] font-mono">{endInfo.dayMonth}</div>
          <div className="text-[11px] text-[#78736A] mt-0.5">{endInfo.weekday} ({totalDays} ngày)</div>
        </div>
      </div>

      {/* ── Custom Interactive Calendar Popover ── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 z-40 bg-white rounded-3xl p-5 shadow-2xl border border-[#E7E2DA] animate-fade-in space-y-4">
          {/* Header navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F4F0EA]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1C1A18]">{monthTitle}</span>
              <span className="text-[10px] font-semibold bg-[#F4F0EA] text-[#78736A] px-2 py-0.5 rounded-full">
                {totalDays} ngày thuê
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F0EA] text-[#1C1A18] transition-colors"
                title="Tháng trước"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F4F0EA] text-[#1C1A18] transition-colors"
                title="Tháng tiếp theo"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Prompt banner for user */}
          <div className={`rounded-xl px-3 py-2 text-xs flex items-center justify-between transition-colors ${
            isStartBooked
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-[#FBF9F5] text-[#5E5A53]'
          }`}>
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`material-symbols-outlined text-[16px] ${isStartBooked ? 'text-rose-600' : 'text-amber-600'}`}>
                {isStartBooked ? 'event_busy' : 'info'}
              </span>
              {isStartBooked
                ? 'Ngày nhận máy đã có khách thuê, vui lòng chọn ngày khác còn trống!'
                : selectionStep === 'start' || !tempStart
                ? 'Chọn ngày nhận máy'
                : 'Chọn ngày hoàn trả thiết bị'}
            </span>
            {tempStart && (
              <span className={`text-[11px] font-mono font-medium ${isStartBooked ? 'text-rose-700 line-through font-bold' : 'text-[#1C1A18]'}`}>
                Bắt đầu: {formatDisplayDateVN(tempStart).dayMonth}
              </span>
            )}
          </div>

          {/* Error conflict alert */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
              <span className="flex-1">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#78736A]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-amber-700">CN</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => {
              const isStart = cell.dateStr === tempStart;
              const isEnd = cell.dateStr === tempEnd;
              const isInRange =
                tempStart &&
                tempEnd &&
                cell.dateStr > tempStart &&
                cell.dateStr < tempEnd;
              const isHoveredRange =
                tempStart &&
                !tempEnd &&
                hoverDate &&
                cell.dateStr > tempStart &&
                cell.dateStr <= hoverDate;

              let btnClass = 'relative h-9 w-full flex flex-col items-center justify-center rounded-xl text-xs transition-all font-medium select-none ';

              if (cell.isPast) {
                btnClass += 'text-stone-300 opacity-40 cursor-not-allowed bg-transparent';
              } else if (cell.isBooked) {
                // Booked dates: in đỏ rõ ràng, gạch ngang, khóa chọn
                btnClass +=
                  'bg-red-50 text-red-600 border border-red-300 cursor-not-allowed font-bold line-through group shadow-xs hover:bg-red-50';
              } else if (isStart || isEnd) {
                btnClass += 'bg-[#1C1A18] text-white font-bold shadow-sm z-10';
              } else if (isInRange || isHoveredRange) {
                btnClass += 'bg-[#EAE5DC] text-[#1C1A18] font-semibold';
              } else if (!cell.isCurrentMonth) {
                btnClass += 'text-stone-400 hover:bg-[#F4F0EA]';
              } else {
                btnClass += 'text-[#1C1A18] hover:bg-[#F4F0EA]';
              }

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  disabled={cell.isPast || cell.isBooked}
                  onClick={() => handleDayClick(cell.dateStr, cell.isPast, cell.isBooked)}
                  onMouseEnter={() => {
                    if (tempStart && !tempEnd && !cell.isPast && !cell.isBooked) {
                      setHoverDate(cell.dateStr);
                    }
                  }}
                  onMouseLeave={() => setHoverDate(null)}
                  className={btnClass}
                  title={cell.isBooked ? `Đã có khách thuê ngày này: ${cell.bookedNote}` : cell.dateStr}
                >
                  <span className={cell.isBooked ? 'line-through text-red-600' : ''}>{cell.dayNumber}</span>

                  {/* Indicator for booked days */}
                  {cell.isBooked && (
                    <span
                      className="absolute bottom-0.5 text-[8px] font-black text-red-600 uppercase tracking-tighter"
                      title={cell.bookedNote}
                    >
                      ĐÃ ĐẶT
                    </span>
                  )}

                  {/* Indicator for today */}
                  {cell.dateStr === todayStr && !isStart && !isEnd && !cell.isBooked && (
                    <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Legend: Ghi chú lịch rõ ràng ── */}
          <div className="pt-2 border-t border-[#F4F0EA] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#78736A]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Trống</span>
              </span>
              <span className="flex items-center gap-1.5 text-red-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>In đỏ: Đã có khách thuê (Khóa chọn)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1C1A18]" />
                <span>Đang chọn</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTempStart('');
                  setTempEnd('');
                  setSelectionStep('start');
                }}
                className="text-[11px] text-[#78736A] hover:text-[#1C1A18] underline cursor-pointer"
              >
                Xóa chọn
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!tempStart || isConflict}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                  !tempStart || isConflict
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                    : 'bg-[#1C1A18] text-white hover:bg-[#292724] cursor-pointer'
                }`}
                title={
                  isConflict
                    ? 'Khoảng ngày bạn chọn có ngày bị trùng với lịch đã có người thuê'
                    : 'Xác nhận khoảng thời gian thuê'
                }
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
