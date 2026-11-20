// Small inline icons for the landing page. Decorative unless given a title.
const base = { width: '1em', height: '1em', 'aria-hidden': true, focusable: 'false' };

export const PawIcon = (props) => (
  <svg viewBox="0 0 64 64" fill="currentColor" {...base} {...props}>
    <ellipse cx="32" cy="42" rx="13" ry="11" />
    <ellipse cx="17" cy="27" rx="5.5" ry="7" />
    <ellipse cx="47" cy="27" rx="5.5" ry="7" />
    <ellipse cx="25" cy="17" rx="5" ry="6.5" />
    <ellipse cx="39" cy="17" rx="5" ry="6.5" />
  </svg>
);

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const ArrowIcon = (props) => (
  <svg viewBox="0 0 24 24" {...stroke} {...base} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronIcon = ({ left, ...props }) => (
  <svg viewBox="0 0 24 24" {...stroke} {...base} {...props}>
    <path d={left ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
  </svg>
);

export const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.6} {...base} {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" {...stroke} {...base} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const StarIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...base} {...props}>
    <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
  </svg>
);

export const CalendarIcon = (props) => (
  <svg viewBox="0 0 24 24" {...stroke} {...base} {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);
