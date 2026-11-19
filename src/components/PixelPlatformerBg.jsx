import React, { useEffect, useRef } from 'react';
import { retroSfx } from '../utils/retroSound';

// 16x16 Pixel Furry Tiger Sprite ('.' = transparent, 'O' = dark outline/stripes, 'F' = main fur, 'L' = light muzzle/belly/fluff)
const TIGER_RUN_1 = [
  '..OO........OO..',
  '.OLLO......OLLO.',
  '.OFFO.OOOO.OFFO.',
  '.OFFFOFFFFOFFFO.',
  'OFOFFFFOOFFFFOFO',
  'OFFFFFFFFFFFFFFO',
  '.OOFFLLLLLLFFOO.',
  '..OFFLLOOLLFFO..',
  '...OFFFFFFFFO...',
  '.OO.OFOFFOFO....',
  'OFO.OFFLLFFO....',
  '.OO.OFOFFOFO....',
  '....OFFFFFFO....',
  '...OFFO..OFFO...',
  '..OFFO....OFFO..',
  '..OOO......OOO..'
];

const TIGER_RUN_2 = [
  '..OO........OO..',
  '.OLLO......OLLO.',
  '.OFFO.OOOO.OFFO.',
  '.OFFFOFFFFOFFFO.',
  'OFOFFFFOOFFFFOFO',
  'OFFFFFFFFFFFFFFO',
  '.OOFFLLLLLLFFOO.',
  '..OFFLLOOLLFFO..',
  '...OFFFFFFFFO...',
  '.OO.OFOFFOFO....',
  'OFO.OFFLLFFO....',
  '.OO.OFOFFOFO....',
  '....OFFFFFFO....',
  '....OFFOOFFO....',
  '....OFFOOFFO....',
  '....OOO..OOO....'
];

const TIGER_JUMP = [
  '..OO........OO..',
  '.OLLO......OLLO.',
  '.OFFO.OOOO.OFFO.',
  '.OFFFOFFFFOFFFO.',
  'OFOFFFFOOFFFFOFO',
  'OFFFFFFFFFFFFFFO',
  '.OOFFLLLLLLFFOO.',
  '..OFFLLOOLLFFO..',
  '.O.OFFFFFFFFO.O.',
  'OFOOFOFFOFOOFO..',
  '.OO.OFFLLFFO....',
  '....OFOFFOFO....',
  '....OFFFFFFO....',
  '...OFFO..OFFO...',
  '...OOO....OOO...',
  '................'
];

function drawTiger(ctx, sprite, x, y, scale, flipX, palette) {
  const rows = sprite.length;
  const cols = sprite[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = sprite[r][c];
      if (ch === '.') continue;
      ctx.fillStyle =
        ch === 'O' ? palette.outline : ch === 'L' ? palette.light : palette.fur;
      const px = flipX ? x + (cols - 1 - c) * scale : x + c * scale;
      const py = y + r * scale;
      ctx.fillRect(Math.round(px), Math.round(py), scale, scale);
    }
  }
}

/**
 * Pixel-art landscape platformer stage:
 * - Moon, drifting pixel clouds, dithered sky, layered mountains, pine forest, pixel grass
 * - Playable Pixel Furry Tiger (Space/Click to jump, Arrow/AD to move)
 * - Floating random artwork frames from /GAL as collectibles
 */
export default function PixelPlatformerBg({
  theme,
  heroRef,
  artworks = [],
  onSelectArt
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const heroEl = heroRef?.current;
    if (!canvas || !heroEl) return;

    const ctx = canvas.getContext('2d');
    const P = 4; // Pixel block size
    let width = 0;
    let height = 0;

    // Preload HTMLImageElement for each artwork in /GAL
    const loadedImgs = {};
    artworks.forEach((art) => {
      const img = new Image();
      img.src = art.image;
      loadedImgs[art.id] = img;
    });

    const resize = () => {
      width = heroEl.clientWidth;
      height = heroEl.clientHeight;
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener('resize', resize);

    const charScale = 3;
    const charW = 16 * charScale;
    const charH = 16 * charScale;
    const groundH = 28;

    const keys = { left: false, right: false };

    const player = {
      x: 90,
      y: height - groundH - charH,
      vx: 115,
      vy: 0,
      onGround: true,
      facingLeft: false,
      autoPatrol: true,
      animTimer: 0
    };

    const clouds = [
      { x: 120, y: 155, w: 120, speed: 12 },
      { x: 460, y: 185, w: 160, speed: 8 },
      { x: 860, y: 145, w: 130, speed: 15 },
      { x: 1150, y: 195, w: 96, speed: 10 }
    ];

    // Twinkling pixel stars & floating fireflies
    const stars = Array.from({ length: 28 }, (_, i) => ({
      x: ((i * 197 + 43) % 100) / 100,
      y: ((i * 89 + 17) % 42) / 100,
      phase: i * 0.9,
      size: i % 3 === 0 ? P * 1.5 : P
    }));

    const fireflies = Array.from({ length: 16 }, (_, i) => ({
      x: ((i * 131 + 29) % 100) / 100,
      yOffset: 24 + ((i * 47) % 150),
      speed: 14 + (i % 5) * 6,
      phase: i * 1.3
    }));

    const particles = [];
    let shootingStar = { active: false, x: 0, y: 0, vx: 0, vy: 0, timer: 2.5 };

    const pickRandomArt = (excludeId) => {
      if (!artworks.length) return null;
      if (artworks.length === 1) return artworks[0];
      const pool = artworks.filter((a) => a.id !== excludeId);
      return pool[Math.floor(Math.random() * pool.length)] || artworks[0];
    };

    // Helper to compute natural aspect-ratio dimensions (never squished/forced to landscape)
    const getDrawSize = (img) => {
      const maxSide = 136;
      if (!img || !img.complete || !img.naturalWidth) {
        return { w: 100, h: 100 };
      }
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (nw >= nh) {
        return { w: maxSide, h: Math.round((nh / nw) * maxSide) };
      }
      return { w: Math.round((nw / nh) * maxSide), h: maxSide };
    };

    // Spawn 4 floating random artwork collectibles across the stage
    const collectibles = [0.18, 0.39, 0.61, 0.82].map((ratio, idx) => ({
      xRatio: ratio,
      yOffset: idx % 2 === 0 ? 155 : 195,
      art: artworks.length ? artworks[idx % artworks.length] : null,
      phase: idx * 1.4,
      respawn: 0
    }));

    const popups = [];

    const triggerJump = () => {
      if (player.onGround) {
        player.vy = -560;
        player.onGround = false;
        retroSfx.jump();
      }
    };

    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (window.scrollY < height) {
          e.preventDefault();
          triggerJump();
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.left = true;
        player.autoPatrol = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.right = true;
        player.autoPatrol = false;
      }
    };

    const onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    };

    const onHeroClick = (e) => {
      if (e.target.closest('a, button, input')) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const gY = height - groundH;

      // Check if user clicked directly on a floating artwork collectible
      for (const item of collectibles) {
        if (!item.art || item.respawn > 0) continue;
        const { w: dw, h: dh } = getDrawSize(loadedImgs[item.art.id]);
        const ix = Math.round(width * item.xRatio) - dw / 2;
        const iy = gY - item.yOffset;
        if (mx >= ix - 6 && mx <= ix + dw + 6 && my >= iy - 12 && my <= iy + dh + 12) {
          onSelectArt?.(item.art.id);
          return;
        }
      }

      triggerJump();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    heroEl.addEventListener('click', onHeroClick);

    let last = performance.now();
    let rafId;

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;

      const gY = height - groundH;
      const isDark = theme === 'dark';

      // Pure black & white monochrome pixel landscape palette
      const pal = isDark
        ? {
            dither: 'rgba(255,255,255,0.06)',
            moon: 'rgba(255,255,255,0.92)',
            moonGlow: 'rgba(255,255,255,0.12)',
            cloud: 'rgba(255,255,255,0.18)',
            mtnBack: '#151515',
            mtnFront: '#1f1f1f',
            mtnHighlight: 'rgba(255,255,255,0.16)',
            trees: '#0b0b0b',
            grass: '#7a7a7a',
            dirt: '#404040',
            tiger: { outline: '#000000', fur: '#d9d9d9', light: '#ffffff' },
            frame: '#ffffff',
            text: '#ffffff'
          }
        : {
            dither: 'rgba(0,0,0,0.06)',
            moon: 'rgba(0,0,0,0.85)',
            moonGlow: 'rgba(0,0,0,0.08)',
            cloud: 'rgba(0,0,0,0.12)',
            mtnBack: '#e2e2e2',
            mtnFront: '#cccccc',
            mtnHighlight: 'rgba(0,0,0,0.18)',
            trees: '#1a1a1a',
            grass: '#6b6b6b',
            dirt: '#a3a3a3',
            tiger: { outline: '#000000', fur: '#8a8a8a', light: '#f5f5f5' },
            frame: '#000000',
            text: '#000000'
          };

      // Update clouds
      for (const cl of clouds) {
        cl.x += cl.speed * dt;
        if (cl.x > width + 40) cl.x = -cl.w - 40;
      }

      // Update player horizontal movement
      if (player.autoPatrol) {
        if (player.x > width - charW - 28) {
          player.vx = -125;
          player.facingLeft = true;
        } else if (player.x < 28) {
          player.vx = 125;
          player.facingLeft = false;
        }
      } else {
        if (keys.left && !keys.right) {
          player.vx = -210;
          player.facingLeft = true;
        } else if (keys.right && !keys.left) {
          player.vx = 210;
          player.facingLeft = false;
        } else {
          player.vx *= 0.8;
        }
      }

      player.x += player.vx * dt;
      if (player.x < 8) player.x = 8;
      if (player.x > width - charW - 8) player.x = width - charW - 8;

      // Gravity
      const wasOnGround = player.onGround;
      player.vy += 1260 * dt;
      player.y += player.vy * dt;
      if (player.y >= gY - charH) {
        player.y = gY - charH;
        player.vy = 0;
        player.onGround = true;
        if (!wasOnGround) {
          retroSfx.land();
          for (let k = 0; k < 6; k++) {
            particles.push({
              x: player.x + charW / 2,
              y: gY - 4,
              vx: (Math.random() - 0.5) * 140,
              vy: -Math.random() * 80,
              life: 0.45
            });
          }
        }
      } else {
        player.onGround = false;
      }

      // Check collectible collisions
      for (const item of collectibles) {
        if (item.respawn > 0) {
          item.respawn -= dt;
          if (item.respawn <= 0) {
            item.art = pickRandomArt(item.art?.id);
          }
          continue;
        }
        if (!item.art) continue;
        const { w: dw, h: dh } = getDrawSize(loadedImgs[item.art.id]);
        const ix = Math.round(width * item.xRatio) - dw / 2;
        const iy = gY - item.yOffset + Math.sin(now * 0.004 + item.phase) * 6;
        const hit =
          player.x + charW > ix &&
          player.x < ix + dw &&
          player.y + charH > iy &&
          player.y < iy + dh;
        if (hit) {
          retroSfx.collect();
          popups.push({ x: ix + dw / 2 - 8, y: iy - 8, life: 0.9 });
          for (let k = 0; k < 12; k++) {
            const ang = (k / 12) * Math.PI * 2;
            particles.push({
              x: ix + dw / 2,
              y: iy + dh / 2,
              vx: Math.cos(ang) * 150,
              vy: Math.sin(ang) * 150,
              life: 0.55
            });
          }
          item.respawn = 3.2;
        }
      }

      // ------------------------------------------------------------------
      // RENDER PIXEL SCENE (Transparent sky base)
      // ------------------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // 0. Twinkling Pixel Stars & Shooting Star
      for (const st of stars) {
        const alpha = 0.18 + 0.38 * (0.5 + 0.5 * Math.sin(now * 0.003 + st.phase));
        ctx.fillStyle = isDark
          ? `rgba(255,255,255,${alpha.toFixed(2)})`
          : `rgba(0,0,0,${(alpha * 0.7).toFixed(2)})`;
        ctx.fillRect(
          Math.round((st.x * width) / P) * P,
          Math.round((st.y * height) / P) * P,
          st.size,
          st.size
        );
      }

      if (!shootingStar.active) {
        shootingStar.timer -= dt;
        if (shootingStar.timer <= 0) {
          shootingStar = {
            active: true,
            x: Math.random() * width * 0.6,
            y: 30 + Math.random() * height * 0.2,
            vx: 420,
            vy: 140,
            timer: 3.5 + Math.random() * 4
          };
        }
      } else {
        shootingStar.x += shootingStar.vx * dt;
        shootingStar.y += shootingStar.vy * dt;
        ctx.fillStyle = pal.moon;
        for (let t = 0; t < 5; t++) {
          ctx.fillRect(
            Math.round((shootingStar.x - t * 9) / P) * P,
            Math.round((shootingStar.y - t * 3) / P) * P,
            P,
            P
          );
        }
        if (shootingStar.x > width + 60) shootingStar.active = false;
      }

      // 1. Animated Halftone / Dithered pixel sky band
      ctx.fillStyle = pal.dither;
      const ditherTop = Math.round(height * 0.48);
      const ditherBot = Math.round(height * 0.70);
      const ditherShift = Math.floor(now * 0.015) % (P * 2);
      for (let dy = ditherTop; dy < ditherBot; dy += P * 2) {
        for (let dx = (dy % (P * 4) === 0 ? 0 : P) - ditherShift; dx < width; dx += P * 2) {
          ctx.fillRect(dx, dy, P, P);
        }
      }

      // 2. Big Pixel Moon with pulsing halo in center sky
      const moonCx = Math.round(width * 0.5);
      const moonCy = Math.round(height * 0.48);
      const moonR = 52;
      const haloR = moonR + 8 + Math.round(Math.sin(now * 0.0025) * 4);
      ctx.fillStyle = pal.moonGlow;
      for (let my = -haloR; my <= haloR; my += P) {
        for (let mx = -haloR; mx <= haloR; mx += P) {
          if (mx * mx + my * my <= haloR * haloR) {
            ctx.fillRect(moonCx + mx, moonCy + my, P, P);
          }
        }
      }
      ctx.fillStyle = pal.moon;
      for (let my = -moonR; my <= moonR; my += P) {
        for (let mx = -moonR; mx <= moonR; mx += P) {
          if (mx * mx + my * my <= moonR * moonR) {
            ctx.fillRect(moonCx + mx, moonCy + my, P, P);
          }
        }
      }

      // 3. Drifting Pixel Clouds
      ctx.fillStyle = pal.cloud;
      for (const cl of clouds) {
        const cx = Math.round(cl.x / P) * P;
        const cy = Math.round(cl.y / P) * P;
        ctx.fillRect(cx + 16, cy, cl.w - 32, P * 2);
        ctx.fillRect(cx, cy + P * 2, cl.w, P * 3);
        ctx.fillRect(cx + 12, cy + P * 5, cl.w - 24, P * 2);
      }

      // 4. Stepped Pixel Mountains (Back & Front ridges)
      const drawPixelMountain = (peakX, peakY, halfW, fillColor, rimColor) => {
        for (let y = peakY; y < gY; y += P) {
          const progress = (y - peakY) / (gY - peakY);
          const span = Math.round((halfW * progress) / P) * P;
          ctx.fillStyle = fillColor;
          ctx.fillRect(peakX - span, y, span * 2, P);
          if (rimColor) {
            ctx.fillStyle = rimColor;
            ctx.fillRect(peakX - span, y, P * 2, P);
          }
        }
      };

      drawPixelMountain(Math.round(width * 0.22), Math.round(height * 0.56), 280, pal.mtnBack, pal.mtnHighlight);
      drawPixelMountain(Math.round(width * 0.72), Math.round(height * 0.58), 320, pal.mtnBack, pal.mtnHighlight);
      drawPixelMountain(Math.round(width * 0.42), Math.round(height * 0.64), 300, pal.mtnFront, pal.mtnHighlight);
      drawPixelMountain(Math.round(width * 0.90), Math.round(height * 0.62), 260, pal.mtnFront, pal.mtnHighlight);

      // 5. Pine Forest Silhouette along the horizon
      ctx.fillStyle = pal.trees;
      for (let tx = 0; tx < width; tx += 18) {
        const treeH = 26 + ((tx * 17) % 24);
        const base = gY;
        for (let tier = 0; tier < treeH; tier += P) {
          const w = Math.max(P, Math.round(((tier / treeH) * 18) / P) * P);
          ctx.fillRect(tx + 9 - w / 2, base - treeH + tier, w, P);
        }
      }

      // 6. Pixel Grass & Ground
      ctx.fillStyle = pal.grass;
      ctx.fillRect(0, gY, width, P * 2);
      ctx.fillStyle = pal.dirt;
      ctx.fillRect(0, gY + P * 2, width, groundH - P * 2);
      ctx.fillStyle = pal.grass;
      for (let gx = 0; gx < width; gx += P * 3) {
        if ((gx / P) % 2 === 0) ctx.fillRect(gx, gY - P, P, P);
      }

      // 7. Floating Random Artworks from /GAL (Natural aspect ratio, never squished)
      for (const item of collectibles) {
        if (!item.art || item.respawn > 0) continue;
        const img = loadedImgs[item.art.id];
        const { w: dw, h: dh } = getDrawSize(img);
        const ix = Math.round(width * item.xRatio) - dw / 2;
        const iy = Math.round(gY - item.yOffset + Math.sin(now * 0.004 + item.phase) * 6);

        // Crisp 2px pixel frame around the artwork
        ctx.fillStyle = pal.frame;
        ctx.fillRect(ix - 2, iy - 2, dw + 4, dh + 4);

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, ix, iy, dw, dh);
          ctx.imageSmoothingEnabled = false;
        }
      }

      // 8. Floating Pixel Fireflies & Burst Particles
      for (const ff of fireflies) {
        const fx = Math.round(((ff.x * width + Math.sin(now * 0.0018 + ff.phase) * 24) / P)) * P;
        const fy = Math.round((gY - ((ff.yOffset + (now * 0.001 * ff.speed)) % 180)) / P) * P;
        ctx.fillStyle = pal.moon;
        ctx.fillRect(fx, fy, P, P);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pal.text;
        ctx.fillRect(Math.round(pt.x / P) * P, Math.round(pt.y / P) * P, P, P);
      }

      // 9. "+1" Popups
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.y -= 42 * dt;
        p.life -= dt;
        if (p.life <= 0) {
          popups.splice(i, 1);
          continue;
        }
        ctx.fillStyle = pal.text;
        ctx.font = 'bold 14px monospace';
        ctx.fillText('+1', p.x, p.y);
      }

      // 9. Draw Pixel Furry Tiger
      player.animTimer += dt * (Math.abs(player.vx) > 20 ? 10 : 0);
      const sprite = !player.onGround
        ? TIGER_JUMP
        : Math.floor(player.animTimer) % 2 === 0
        ? TIGER_RUN_1
        : TIGER_RUN_2;
      drawTiger(
        ctx,
        sprite,
        player.x,
        player.y,
        charScale,
        player.facingLeft,
        pal.tiger
      );

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      heroEl.removeEventListener('click', onHeroClick);
    };
  }, [theme, heroRef, artworks, onSelectArt]);

  return <canvas ref={canvasRef} className="pixel-bg-canvas" />;
}
