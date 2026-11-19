
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

function SignatureCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const auraRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    if (!finePointer.matches || reducedMotion.matches) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const aura = auraRef.current;
    const label = labelRef.current;

    if (!cursor || !dot || !ring || !aura || !label) return;

    let targetX = -100;
    let targetY = -100;

    let ringX = targetX;
    let ringY = targetY;

    let auraX = targetX;
    let auraY = targetY;

    let velocityX = 0;
    let velocityY = 0;

    let previousX = targetX;
    let previousY = targetY;

    let frameId = null;
    let active = false;

    const animate = () => {
      const dx = targetX - ringX;
      const dy = targetY - ringY;

      ringX += dx * 0.19;
      ringY += dy * 0.19;

      auraX += (targetX - auraX) * 0.09;
      auraY += (targetY - auraY) * 0.09;

      velocityX = targetX - previousX;
      velocityY = targetY - previousY;

      previousX = targetX;
      previousY = targetY;

      const speed = Math.min(
        Math.hypot(velocityX, velocityY) / 35,
        1
      );

      const angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI);

      dot.style.left = `${targetX}px`;
      dot.style.top = `${targetY}px`;

      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      aura.style.left = `${auraX}px`;
      aura.style.top = `${auraY}px`;

      ring.style.setProperty('--cursor-speed', speed.toFixed(2));
      ring.style.setProperty('--cursor-angle', `${angle}deg`);

      frameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const handleMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!active) {
        ringX = targetX;
        ringY = targetY;
        auraX = targetX;
        auraY = targetY;
        previousX = targetX;
        previousY = targetY;
        active = true;
      }

      cursor.classList.add('cursor-visible');
      startAnimation();
    };

    const handleHover = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const project = target.closest(
        'a[href*="/projects/"]'
      );

      const interactive = target.closest(
        'a, button, [role="button"], input, textarea, select, label'
      );

      cursor.classList.toggle('cursor-project', Boolean(project));

      cursor.classList.toggle(
        'cursor-interactive',
        Boolean(interactive) && !project
      );

      label.textContent = project
        ? 'VIEW PROJECT'
        : interactive
          ? 'EXPLORE'
          : '';
    };

    const handleLeave = () => {
      active = false;
      cursor.classList.remove('cursor-visible');
      stopAnimation();
    };

    const handleDown = () => {
      cursor.classList.add('cursor-pressed');
    };

    const handleUp = () => {
      cursor.classList.remove('cursor-pressed');
    };

    window.addEventListener('pointermove', handleMove, {
      passive: true,
    });

    window.addEventListener('pointerleave', handleLeave);
    window.addEventListener('blur', handleLeave);

    document.addEventListener('pointerover', handleHover);
    document.addEventListener('pointerdown', handleDown);
    document.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('blur', handleLeave);

      document.removeEventListener('pointerover', handleHover);
      document.removeEventListener('pointerdown', handleDown);
      document.removeEventListener('pointerup', handleUp);

      stopAnimation();
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="fluid-cursor"
        aria-hidden="true"
      >
        <div ref={auraRef} className="fluid-cursor-aura" />

        <div ref={ringRef} className="fluid-cursor-ring">
          <span className="fluid-cursor-inner" />
          <span ref={labelRef} className="fluid-cursor-label" />
        </div>

        <div ref={dotRef} className="fluid-cursor-dot" />
      </div>

      <style>{`
        @media (pointer: fine) and (prefers-reduced-motion: no-preference) {

          html.has-fluid-cursor,
          html.has-fluid-cursor * {
            cursor: none !important;
          }

          .fluid-cursor {
            position: fixed;
            inset: 0;
            z-index: 99999;
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition: opacity 250ms ease, visibility 250ms ease;
          }

          .fluid-cursor.cursor-visible {
            opacity: 1;
            visibility: visible;
          }

          .fluid-cursor-aura {
            position: absolute;
            width: 100px;
            height: 100px;
            margin: -50px 0 0 -50px;
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(255,61,110,.10) 0%,
              rgba(255,61,110,.035) 45%,
              transparent 72%
            );
            filter: blur(9px);
            will-change: left, top;
          }

          .fluid-cursor-ring {
            --cursor-speed: 0;
            --cursor-angle: 0deg;

            position: absolute;
            width: 42px;
            height: 42px;
            margin: -21px 0 0 -21px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(255,255,255,.58);
            border-radius: 50%;
            background: rgba(255,255,255,.025);
            backdrop-filter: blur(4px);
            box-shadow: 0 0 18px rgba(255,61,110,.035);
            transform: rotate(var(--cursor-angle)) scaleX(
              calc(1 + var(--cursor-speed) * .22)
            );
            will-change: left, top, transform;
            transition:
              width 380ms cubic-bezier(.2,.8,.2,1),
              height 380ms cubic-bezier(.2,.8,.2,1),
              margin 380ms cubic-bezier(.2,.8,.2,1),
              border-radius 380ms ease,
              border-color 300ms ease,
              background 300ms ease,
              box-shadow 300ms ease;
          }

          .fluid-cursor-ring::before {
            content: "";
            position: absolute;
            inset: 5px;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: inherit;
          }

          .fluid-cursor-inner {
            position: absolute;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: rgba(255,255,255,.7);
            transition: opacity 200ms ease;
          }

          .fluid-cursor-dot {
            position: absolute;
            width: 7px;
            height: 7px;
            margin: -3.5px 0 0 -3.5px;
            border-radius: 50%;
            background: #ff3d6e;
            box-shadow:
              0 0 8px rgba(255,61,110,.8),
              0 0 18px rgba(255,61,110,.35);
            will-change: left, top;
            transition: transform 180ms ease;
          }

          .fluid-cursor-label {
            position: relative;
            z-index: 2;
            color: white;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: .12em;
            white-space: nowrap;
            opacity: 0;
            transform: scale(.75);
            transition:
              opacity 250ms ease,
              transform 350ms cubic-bezier(.2,.8,.2,1);
          }

          .fluid-cursor.cursor-interactive .fluid-cursor-ring {
            width: 58px;
            height: 58px;
            margin: -29px 0 0 -29px;
            border-color: rgba(255,61,110,.8);
            background: rgba(255,61,110,.08);
          }

          .fluid-cursor.cursor-project .fluid-cursor-ring {
            width: 108px;
            height: 108px;
            margin: -54px 0 0 -54px;
            border-radius: 38%;
            border-color: rgba(255,61,110,.9);
            background: rgba(255,61,110,.11);
            box-shadow:
              0 0 25px rgba(255,61,110,.12),
              inset 0 0 20px rgba(255,61,110,.04);
            transform: rotate(var(--cursor-angle)) scaleX(1);
          }

          .fluid-cursor.cursor-project .fluid-cursor-label {
            opacity: 1;
            transform: scale(1);
          }

          .fluid-cursor.cursor-project .fluid-cursor-inner {
            opacity: 0;
          }

          .fluid-cursor.cursor-pressed .fluid-cursor-ring {
            transform: scale(.88);
          }

          .fluid-cursor.cursor-pressed .fluid-cursor-dot {
            transform: scale(.65);
          }
        }
      `}</style>
    </>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    const updateCursorMode = () => {
      document.documentElement.classList.toggle(
        'has-fluid-cursor',
        finePointer.matches && !reducedMotion.matches
      );
    };

    updateCursorMode();

    finePointer.addEventListener('change', updateCursorMode);
    reducedMotion.addEventListener('change', updateCursorMode);

    return () => {
      finePointer.removeEventListener('change', updateCursorMode);
      reducedMotion.removeEventListener('change', updateCursorMode);

      document.documentElement.classList.remove('has-fluid-cursor');
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SignatureCursor />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
