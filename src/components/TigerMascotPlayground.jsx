import React, { useEffect, useRef, useState } from 'react';
import { retroSfx } from '../utils/retroSound';

/**
 * Interactive Walking Tiger Mascot Playground (based on the user's sketch).
 * Supports 4 animated states:
 * - idle: gentle breathing, blinking, tail wag
 * - walking: patrols back & forth with bouncy step cycle
 * - drag: grab & move around with velocity tilt + kicking legs
 * - squish: click to squash & bounce with retro SFX
 */
const GOOFY_LINES = {
  idle: [
    'no thoughts, head empty',
    '*stares blankly*',
    'blep :P',
    'need snacks...',
    'mew...?'
  ],
  walking: [
    'patrolling the canvas',
    'steppy steppy',
    'looking for 3D cubes',
    'on my way to draw',
    'doin a little walk'
  ],
  squish: [
    'BWUH?!',
    '*squish noise*',
    'hey!! flat tiger',
    'my spine!!',
    'plz no pancake'
  ],
  drag: [
    'UNHAND ME!!',
    'WHEEEEE!!',
    'put me down pls',
    'i can fly?!',
    'halp!!'
  ]
};

function pickLine(list, current) {
  const pool = list.filter((l) => l !== current);
  return pool[Math.floor(Math.random() * pool.length)] || list[0];
}

export default function TigerMascotPlayground() {
  const stageRef = useRef(null);
  const mascotW = 104;
  const mascotH = 104;

  const physRef = useRef({
    x: 40,
    y: 0,
    vx: 68,
    vy: 0,
    facing: 1,
    mode: 'walking', // 'walking' | 'idle' | 'drag'
    modeTimer: 3.5,
    squishTimer: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragStartX: 0,
    dragStartY: 0,
    movedDuringDrag: false,
    tilt: 0
  });

  const [dialogue, setDialogue] = useState('no thoughts, head empty');
  const [renderState, setRenderState] = useState({
    x: 40,
    y: 0,
    facing: 1,
    mode: 'walking',
    squished: false,
    blink: false,
    tilt: 0
  });

  useEffect(() => {
    let last = performance.now();
    let rafId;
    let blinkTimer = 2.4;

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;

      const stage = stageRef.current;
      const maxX = stage ? Math.max(40, stage.clientWidth - mascotW - 8) : 320;
      const floorY = stage ? Math.max(0, stage.clientHeight - mascotH - 6) : 90;
      const p = physRef.current;

      // Squish decay
      if (p.squishTimer > 0) {
        p.squishTimer = Math.max(0, p.squishTimer - dt);
      }

      // Blink timer
      blinkTimer -= dt;
      let isBlinking = false;
      if (blinkTimer <= 0) {
        isBlinking = true;
        if (blinkTimer <= -0.14) {
          blinkTimer = 2.2 + Math.random() * 2.5;
          isBlinking = false;
        }
      }

      if (p.mode !== 'drag') {
        // Gravity back to floor after drag release
        if (p.y < floorY) {
          p.vy += 1200 * dt;
          p.y += p.vy * dt;
          if (p.y >= floorY) {
            p.y = floorY;
            p.vy = 0;
            p.squishTimer = 0.16;
            retroSfx.land();
          }
        } else {
          p.y = floorY;
        }

        // Smoothly settle tilt
        p.tilt += (0 - p.tilt) * 0.15;

        // Alternate between walking and idle
        p.modeTimer -= dt;
        if (p.modeTimer <= 0) {
          if (p.mode === 'walking') {
            p.mode = 'idle';
            p.modeTimer = 1.8 + Math.random() * 1.4;
            setDialogue((d) => pickLine(GOOFY_LINES.idle, d));
          } else {
            p.mode = 'walking';
            p.modeTimer = 3.2 + Math.random() * 2.5;
            if (Math.random() < 0.4) p.facing *= -1;
            setDialogue((d) => pickLine(GOOFY_LINES.walking, d));
          }
        }

        if (p.mode === 'walking' && p.squishTimer <= 0) {
          p.x += p.facing * 64 * dt;
          if (p.x >= maxX) {
            p.x = maxX;
            p.facing = -1;
          } else if (p.x <= 8) {
            p.x = 8;
            p.facing = 1;
          }
        }
      }

      setRenderState({
        x: p.x,
        y: p.y,
        facing: p.facing,
        mode: p.mode,
        squished: p.squishTimer > 0,
        blink: isBlinking,
        tilt: p.tilt
      });

      rafId = requestAnimationFrame(tick);
    };

    // Start on floor
    if (stageRef.current) {
      physRef.current.y = Math.max(0, stageRef.current.clientHeight - mascotH - 6);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const p = physRef.current;
    p.mode = 'drag';
    p.vy = 0;
    p.dragStartX = e.clientX;
    p.dragStartY = e.clientY;
    p.movedDuringDrag = false;
    p.dragOffsetX = e.clientX - rect.left - p.x;
    p.dragOffsetY = e.clientY - rect.top - p.y;
    setDialogue((d) => pickLine(GOOFY_LINES.drag, d));
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const p = physRef.current;
    if (p.mode !== 'drag') return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();

    if (
      Math.abs(e.clientX - p.dragStartX) > 4 ||
      Math.abs(e.clientY - p.dragStartY) > 4
    ) {
      p.movedDuringDrag = true;
    }

    const nextX = Math.max(
      0,
      Math.min(stage.clientWidth - mascotW, e.clientX - rect.left - p.dragOffsetX)
    );
    const nextY = Math.max(
      0,
      Math.min(stage.clientHeight - mascotH, e.clientY - rect.top - p.dragOffsetY)
    );
    const dx = nextX - p.x;
    p.tilt = Math.max(-18, Math.min(18, dx * 1.4));
    if (Math.abs(dx) > 1) p.facing = dx > 0 ? 1 : -1;
    p.x = nextX;
    p.y = nextY;
  };

  const handlePointerUp = (e) => {
    const p = physRef.current;
    if (p.mode !== 'drag') return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!p.movedDuringDrag) {
      // Clicked without dragging -> Squish!
      p.squishTimer = 0.34;
      p.mode = 'idle';
      p.modeTimer = 1.5;
      setDialogue((d) => pickLine(GOOFY_LINES.squish, d));
      retroSfx.click();
    } else {
      p.mode = 'walking';
      p.modeTimer = 3.0;
      setDialogue((d) => pickLine(GOOFY_LINES.walking, d));
    }
  };

  return (
    <div ref={stageRef} className="mascot-playground">
      {/* Goofy Speech Bubble following the tiger */}
      <div
        className="mascot-bubble"
        style={{
          transform: `translate3d(${Math.max(8, renderState.x - 14)}px, ${Math.max(4, renderState.y - 34)}px, 0)`
        }}
      >
        {dialogue}
      </div>

      <div
        className={`mascot-wrap mode-${renderState.mode} ${
          renderState.squished ? 'is-squished' : ''
        }`}
        style={{
          transform: `translate3d(${renderState.x}px, ${renderState.y}px, 0) rotate(${renderState.tilt}deg)`
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          viewBox="0 0 120 120"
          className="mascot-svg"
          style={{
            transform: `scaleX(${renderState.facing})`
          }}
        >
          {/* Left & Right Stubby Legs */}
          <path
            d="M42 84 L42 106 L31 106 C30 100, 35 99, 37 99 L37 84"
            className="mascot-line mascot-leg-l"
          />
          <path
            d="M72 84 L72 106 L80 106 C82 100, 77 99, 77 99 L77 84"
            className="mascot-line mascot-leg-r"
          />

          {/* Fluffy Head & Spiky Cheeks Outline (from user's sketch) */}
          <path
            d="M38 30 L20 30 L28 38 L16 44 L24 54 L10 64 L26 70 L16 82 L34 78 C42 86, 54 86, 60 80 C66 86, 78 86, 86 78 L104 82 L94 70 L110 64 L96 54 L104 44 L92 38 L100 30 L82 30 L76 20 L66 26 L60 12 L50 24 L42 14 Z"
            className="mascot-fill"
          />

          {/* Top Spiky Hair Tuft */}
          <path
            d="M46 28 L44 12 L58 20 L62 10 L74 24 L56 36 Z"
            className="mascot-line"
          />

          {/* Left & Right Eyebrows */}
          <path d="M27 36 L44 36 L40 42 L27 42 Z" className="mascot-line" />
          <path d="M76 36 L93 36 L93 42 L80 42 Z" className="mascot-line" />

          {/* Eyes (default chill / blink / surprised on drag / > < on squish) */}
          {renderState.squished ? (
            <g className="mascot-line">
              <path d="M30 46 L42 50 L30 54" />
              <path d="M90 46 L78 50 L90 54" />
            </g>
          ) : renderState.mode === 'drag' ? (
            <g className="mascot-line">
              <circle cx="36" cy="50" r="5" />
              <circle cx="84" cy="50" r="5" />
            </g>
          ) : renderState.blink ? (
            <g className="mascot-line">
              <line x1="28" y1="50" x2="45" y2="50" />
              <line x1="75" y1="50" x2="92" y2="50" />
            </g>
          ) : (
            <g className="mascot-line">
              <line x1="28" y1="49" x2="45" y2="49" />
              <line x1="75" y1="49" x2="92" y2="49" />
            </g>
          )}

          {/* Nose */}
          <path d="M51 54 L69 54 C67 60, 53 60, 51 54 Z" className="mascot-line" />

          {/* :3 Muzzle & Fangs */}
          <path
            d="M28 60 C28 80, 52 80, 60 70 C68 80, 92 80, 92 60"
            className="mascot-line"
          />
          <path d="M35 72 L38 62 L41 73" className="mascot-line" />
          <path d="M79 73 L82 62 L85 72" className="mascot-line" />
        </svg>
      </div>
    </div>
  );
}
