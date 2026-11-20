// A one-month date-range picker. Click a first day for the start and a later
// one for the end; the start and end markers glide between days.
import { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { EASE_OUT } from '../motion/kit';
import { ChevronIcon } from '../pages/landing/icons';

const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthOf = (iso) => iso.slice(0, 7); // YYYY-MM
const shiftMonth = (ym, by) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const monthTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const dayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function monthDays(ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const count = new Date(y, m, 0).getDate();
  return {
    lead,
    days: Array.from({ length: count }, (_, i) => toIso(y, m - 1, i + 1)),
    date: first,
  };
}

const slide = {
  enter: (dir) => ({ x: dir * 34, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: (dir) => ({ x: dir * -34, opacity: 0, transition: { duration: 0.16 } }),
};

export function MiniCalendar({ start, end, min, onChange }) {
  const [month, setMonth] = useState(() => monthOf(start || min));
  const [dir, setDir] = useState(1);
  const [hover, setHover] = useState(null);

  // Follow the start date when it is typed into the form.
  useEffect(() => {
    if (!start) return;
    setMonth((current) => {
      const next = monthOf(start);
      if (next !== current) setDir(next > current ? 1 : -1);
      return next;
    });
  }, [start]);

  const go = (by) => {
    setDir(by);
    setMonth((m) => shiftMonth(m, by));
  };

  const pick = (iso) => {
    if (!start || end || iso < start) onChange({ start: iso, end: '' });
    else onChange({ start, end: iso });
  };

  const rangeEnd = end || (start && hover && hover > start ? hover : null);
  const { lead, days, date } = monthDays(month);
  const canGoBack = month > monthOf(min);

  return (
    <div className="miniCal">
      <div className="miniCalHead">
        <button type="button" className="miniCalNav" onClick={() => go(-1)} disabled={!canGoBack} aria-label="Previous month">
          <ChevronIcon left />
        </button>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.strong
            key={month}
            className="miniCalTitle"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            aria-live="polite"
          >
            {monthTitle.format(date)}
          </motion.strong>
        </AnimatePresence>
        <button type="button" className="miniCalNav" onClick={() => go(1)} aria-label="Next month">
          <ChevronIcon />
        </button>
      </div>

      <div className="miniCalWeek" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="miniCalViewport" onPointerLeave={() => setHover(null)}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={month}
            className="miniCalGrid"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <LayoutGroup id="miniCalMarks">
              {lead > 0 && <span style={{ gridColumn: `span ${lead}` }} />}
              {days.map((iso) => {
                const disabled = iso < min;
                const isStart = iso === start;
                const isEnd = iso === end;
                const inRange = start && rangeEnd && iso > start && iso < rangeEnd;
                const isPreviewEnd = !end && iso === rangeEnd;
                const cls = [
                  'miniCalDay',
                  inRange && 'inRange',
                  start && rangeEnd && isStart && 'rangeStart',
                  (isEnd || isPreviewEnd) && 'rangeEnd',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button
                    key={iso}
                    type="button"
                    className={cls}
                    disabled={disabled}
                    aria-pressed={isStart || isEnd}
                    aria-label={dayLabel.format(new Date(`${iso}T12:00:00`))}
                    onClick={() => pick(iso)}
                    onPointerEnter={() => setHover(iso)}
                  >
                    {isStart && <motion.span layoutId="calStart" className="miniCalMark" />}
                    {isEnd && <motion.span layoutId="calEnd" className="miniCalMark" />}
                    <span className="miniCalNum">{Number(iso.slice(8))}</span>
                  </button>
                );
              })}
            </LayoutGroup>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
