// "How it works": cards that pin and stack, each one sinking back as the next slides over it.
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { EASE_OUT, Reveal } from '../../motion/kit';
import { CalendarIcon, CheckIcon, PawIcon, SearchIcon, StarIcon } from './icons';

function SearchMock() {
  return (
    <div className="mock mockSearch" aria-hidden="true">
      <div className="mockBar">
        <span>Heraklion</span>
        <span>Dog</span>
        <span>€25</span>
        <span className="mockGo">
          <SearchIcon />
        </span>
      </div>
      {[0, 1, 2].map((i) => (
        <div className="mockRow" key={i} style={{ '--i': i }}>
          <span className="mockAvatar" />
          <span className="mockLines">
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  );
}

function ReviewMock() {
  return (
    <div className="mock mockReview" aria-hidden="true">
      <span className="mockStars">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} />
        ))}
      </span>
      <p>“Photos every evening, and he came home happy.”</p>
      <small>An owner in Heraklion</small>
    </div>
  );
}

function CalendarMock() {
  const days = Array.from({ length: 21 }, (_, i) => i + 8);
  return (
    <div className="mock mockCal" aria-hidden="true">
      <div className="mockCalHead">
        <CalendarIcon /> December
      </div>
      <div className="mockCalGrid">
        {days.map((d) => (
          <span key={d} className={d >= 12 && d <= 15 ? 'inRange' : ''}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

function AcceptedMock() {
  return (
    <div className="mock mockDone" aria-hidden="true">
      <svg viewBox="0 0 52 52" className="mockCheck">
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE_OUT }}
        />
        <motion.path
          d="M15 27l7 7 15-16"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.7 }}
        />
      </svg>
      <strong>Request accepted</strong>
      <small>
        <CheckIcon /> Contact details shared
      </small>
    </div>
  );
}

const STEPS = [
  { title: 'Search nearby', text: 'Filter keepers by city, the kind of pet you have and what you want to spend per day.', Mock: SearchMock, tone: 'ink' },
  { title: 'Compare keepers', text: 'Read each keeper’s profile and the reviews other owners left after their stay.', Mock: ReviewMock, tone: 'warm' },
  { title: 'Request your dates', text: 'Pick your pet and your dates, and send the request. The price is worked out for you.', Mock: CalendarMock, tone: 'pink' },
  { title: 'Relax', text: 'Once your keeper accepts, you’re set. When you’re back, leave a review for the next owner.', Mock: AcceptedMock, tone: 'green' },
];

function StepCard({ i, total, progress, step }) {
  const sinkTo = 1 - (total - 1 - i) * 0.05;
  const scale = useTransform(progress, [i / total, 1], [1, sinkTo]);
  const dim = useTransform(progress, [i / total, 1], [0, (total - 1 - i) * 0.13]);
  const { Mock } = step;

  return (
    <div className="stepSlot" style={{ '--i': i }}>
      <motion.article className={`stepCard tone-${step.tone}`} style={{ scale }}>
        <div className="stepCopy">
          <span className="stepNumber">{String(i + 1).padStart(2, '0')}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </div>
        <div className="stepArt">
          <Mock />
        </div>
        <motion.span className="stepDim" style={{ opacity: dim }} aria-hidden="true" />
      </motion.article>
    </div>
  );
}

export function Steps() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  return (
    <section id="how" className="steps section" aria-labelledby="how-title">
      <div className="sectionHead">
        <Reveal as="span" className="eyebrow" y={13}>
          <PawIcon /> How it works
        </Reveal>
        <Reveal as="h2" id="how-title" className="sectionTitle" delay={0.08}>
          Four steps to a <em>wagging tail.</em>
        </Reveal>
      </div>
      <div className="stepsStack" ref={ref}>
        {STEPS.map((step, i) => (
          <StepCard key={step.title} i={i} total={STEPS.length} progress={scrollYProgress} step={step} />
        ))}
      </div>
    </section>
  );
}
