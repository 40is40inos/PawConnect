// Public front page for visitors who aren't logged in.
import { MotionConfig } from 'motion/react';
import { useSmoothScroll } from '../../motion/kit';
import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { Bento, MarqueeBand, Statement } from './Story';
import { Steps } from './Steps';
import { KeeperCarousel } from './KeeperCarousel';
import { FinalCta, Footer, Reviews } from './Closing';
import { useLandingData } from './useLandingData';
import './landing.css';

export const Landing = () => {
  useSmoothScroll();
  const { keepers, reviews, stats } = useLandingData();

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing">
        <LandingNav />
        <main>
          <Hero stats={stats} keepers={keepers} />
          <MarqueeBand />
          <Statement />
          {stats && <Bento stats={stats} />}
          <Steps />
          {keepers.length > 0 && <KeeperCarousel keepers={keepers} />}
          {reviews.length > 0 && <Reviews reviews={reviews} />}
          <FinalCta />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
};
