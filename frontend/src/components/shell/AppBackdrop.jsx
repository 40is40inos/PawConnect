// Slow-drifting warm light behind the app screens, plus a faint golden spiral.
// Pure CSS animation on transforms, so it costs almost nothing per frame.
import { goldenSpiralPath } from '../../motion/kit';

const SPIRAL = goldenSpiralPath(61.8, 38.2, 62, 3);

export function AppBackdrop() {
  return (
    <div className="appBackdrop" aria-hidden="true">
      <span className="appGlow appGlowA" />
      <span className="appGlow appGlowB" />
      <span className="appGlow appGlowC" />
      <svg className="appSpiral" viewBox="0 0 100 100">
        <path d={SPIRAL} />
      </svg>
    </div>
  );
}
