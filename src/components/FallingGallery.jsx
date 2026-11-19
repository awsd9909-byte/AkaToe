import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';

/**
 * Interactive multi-lane falling gallery linked to /GAL artworks.
 * Smoothly decelerates to a complete standstill ("time freeze") on hover.
 */
export default function FallingGallery({ artworks, onSelectArt }) {
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const stateRef = useRef({
    offsets: [],
    speedFactor: 1,
    isHovered: false,
    lastTime: 0
  });

  const [hoveredId, setHoveredId] = useState(null);

  // Build 2 staggered lanes with shuffled/varied artworks from /GAL
  const lanes = useMemo(() => {
    if (!artworks || artworks.length === 0) return [];

    // Create enough items per lane to seamlessly loop even with 4 artworks
    const buildLaneItems = (seedOffset, repeatCount) => {
      const list = [];
      for (let r = 0; r < repeatCount; r++) {
        for (let i = 0; i < artworks.length; i++) {
          const idx = (i * 3 + seedOffset + r) % artworks.length;
          const art = artworks[idx];
          list.push({
            key: `${seedOffset}-${r}-${i}-${art.id}`,
            art
          });
        }
      }
      return list;
    };

    return [
      { id: 0, baseSpeed: 42, items: buildLaneItems(0, 3) },
      { id: 1, baseSpeed: 30, items: buildLaneItems(2, 3) }
    ];
  }, [artworks]);

  useEffect(() => {
    if (lanes.length === 0) return;

    const laneHeight = () => {
      // Measure half of a lane's scrollHeight (we duplicate items inside each lane for seamless wrap)
      const firstLane = containerRef.current?.querySelector('.falling-lane-track');
      return firstLane ? firstLane.scrollHeight / 2 : 900;
    };

    // Initialize staggered starting offsets
    stateRef.current.offsets = [0, -240];
    stateRef.current.lastTime = performance.now();

    let rafId;
    const tick = (now) => {
      const dt = Math.min((now - stateRef.current.lastTime) / 1000, 0.05);
      stateRef.current.lastTime = now;

      // Smoothly ease speedFactor toward 0 when hovered (time freeze), or 1 when unhovered
      const target = stateRef.current.isHovered ? 0 : 1;
      const ease = stateRef.current.isHovered ? 0.075 : 0.055;
      stateRef.current.speedFactor +=
        (target - stateRef.current.speedFactor) * ease;

      if (Math.abs(stateRef.current.speedFactor) < 0.002 && target === 0) {
        stateRef.current.speedFactor = 0;
      }

      const tracks = containerRef.current?.querySelectorAll('.falling-lane-track');
      if (tracks) {
        lanes.forEach((lane, idx) => {
          const track = tracks[idx];
          if (!track) return;
          const loopDist = track.scrollHeight / 2 || 900;
          // Move downward (+Y)
          stateRef.current.offsets[idx] +=
            lane.baseSpeed * stateRef.current.speedFactor * dt;

          // Wrap seamlessly between -loopDist and 0
          if (stateRef.current.offsets[idx] >= 0) {
            stateRef.current.offsets[idx] -= loopDist;
          }

          track.style.transform = `translate3d(0, ${stateRef.current.offsets[idx]}px, 0)`;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    // Start negative so cards enter from top seamlessly
    const initTimer = setTimeout(() => {
      const half = laneHeight();
      stateRef.current.offsets = [-half * 0.5, -half * 0.85];
    }, 30);

    rafId = requestAnimationFrame(tick);
    return () => {
      clearTimeout(initTimer);
      cancelAnimationFrame(rafId);
    };
  }, [lanes]);

  const handleStageEnter = () => {
    stateRef.current.isHovered = true;
  };

  const handleStageLeave = () => {
    stateRef.current.isHovered = false;
    setHoveredId(null);
  };

  return (
    <div
      ref={containerRef}
      className="falling-stage"
      onMouseEnter={handleStageEnter}
      onMouseLeave={handleStageLeave}
    >
      <div className="falling-grid">
        {lanes.map((lane) => (
          <div key={lane.id} className="falling-lane">
            <div className="falling-lane-track">
              {/* Render items twice for seamless infinite downward loop */}
              {[...lane.items, ...lane.items].map((entry, idx) => {
                const uniqueKey = `${entry.key}-${idx}`;
                const isCardHovered = hoveredId === uniqueKey;
                return (
                  <div
                    key={uniqueKey}
                    ref={(el) => (cardRefs.current[uniqueKey] = el)}
                    className={`falling-card ${isCardHovered ? 'is-focused' : ''}`}
                    onMouseEnter={() => setHoveredId(uniqueKey)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectArt(entry.art.id)}
                    title={`Click to inspect "${entry.art.title}"`}
                  >
                    <div className="falling-card-media">
                      <img
                        src={entry.art.image}
                        alt={entry.art.title}
                        className="falling-card-img"
                        draggable={false}
                      />
                      <div className="falling-card-zoom">
                        <Maximize2 size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Subtle status pill in bottom corner */}
      <div className={`time-status-pill ${hoveredId ? 'frozen' : ''}`}>
        <span className="time-dot" />
        <span>
          {hoveredId ? 'TIME FROZEN — CLICK TO INSPECT' : 'HOVER TO SLOW & FREEZE'}
        </span>
      </div>
    </div>
  );
}
