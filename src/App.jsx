import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  LayoutGrid,
  Columns,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Mail,
  ArrowUpRight,
  Layers,
  Award,
  MapPin,
  Sun,
  Moon,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ARTIST_INFO, ARTWORKS } from './data/portfolioData';
import PixelPlatformerBg from './components/PixelPlatformerBg';
import TigerMascotPlayground from './components/TigerMascotPlayground';
import { retroSfx } from './utils/retroSound';

export default function App() {
  const artworks = ARTWORKS;
  const heroRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('akatora-theme') || 'dark';
  });
  const [sfxEnabled, setSfxEnabled] = useState(() => {
    return localStorage.getItem('akatora-sfx') !== 'off';
  });
  const [loaderPhase, setLoaderPhase] = useState('loading'); // 'loading' | 'exiting' | 'done'
  const [loadProgress, setLoadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('exhibition'); // 'exhibition' | 'uniform'
  const [selectedArtId, setSelectedArtId] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Initial 1.8s retro loading scene
  useEffect(() => {
    let pct = 0;
    const stepTimer = setInterval(() => {
      pct = Math.min(100, pct + 5);
      setLoadProgress(pct);
      if (pct >= 100) clearInterval(stepTimer);
    }, 85);

    const exitTimer = setTimeout(() => {
      setLoaderPhase('exiting');
    }, 1850);

    const doneTimer = setTimeout(() => {
      setLoaderPhase('done');
    }, 2450);

    return () => {
      clearInterval(stepTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // Sync theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('akatora-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    retroSfx.click();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSfx = () => {
    setSfxEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('akatora-sfx', next ? 'on' : 'off');
      if (next) retroSfx.openArt();
      return next;
    });
  };

  // Filtered Artworks (by search query only — no categories)
  const filteredArtworks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artworks;
    return artworks.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.medium.toLowerCase().includes(q) ||
        item.year.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [artworks, searchQuery]);

  const currentLightboxIndex = useMemo(() => {
    if (!selectedArtId) return -1;
    return filteredArtworks.findIndex((a) => a.id === selectedArtId);
  }, [selectedArtId, filteredArtworks]);

  const activeLightboxArt = useMemo(() => {
    if (!selectedArtId) return null;
    return artworks.find((a) => a.id === selectedArtId) || null;
  }, [selectedArtId, artworks]);

  const handleNextArt = () => {
    if (filteredArtworks.length === 0) return;
    retroSfx.switchArt();
    const nextIdx = (currentLightboxIndex + 1) % filteredArtworks.length;
    setSelectedArtId(filteredArtworks[nextIdx].id);
    setIsZoomed(false);
  };

  const handlePrevArt = () => {
    if (filteredArtworks.length === 0) return;
    retroSfx.switchArt();
    const prevIdx =
      (currentLightboxIndex - 1 + filteredArtworks.length) %
      filteredArtworks.length;
    setSelectedArtId(filteredArtworks[prevIdx].id);
    setIsZoomed(false);
  };

  useEffect(() => {
    if (!selectedArtId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        retroSfx.closeArt();
        setSelectedArtId(null);
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight') {
        handleNextArt();
      } else if (e.key === 'ArrowLeft') {
        handlePrevArt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtId, currentLightboxIndex, filteredArtworks]);

  // Scroll-reveal IntersectionObserver for live entrance animations
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredArtworks.length, viewMode]);

  return (
    <div>
      {/* Initial 1-3s Retro Loading Scene */}
      {loaderPhase !== 'done' && (
        <div
          className={`loading-screen ${
            loaderPhase === 'exiting' ? 'is-exiting' : ''
          }`}
        >
          <div className="loading-inner">
            <div className="loading-seal">
              <img
                src={ARTIST_INFO.avatar}
                alt={ARTIST_INFO.name}
                className="seal-img"
              />
            </div>
            <div className="loading-brand">{ARTIST_INFO.name}</div>
            <div className="loading-bar-track">
              <div
                className="loading-bar-fill"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="loading-status">
              <span>LOADING ARCHIVE...</span>
              <span>{loadProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Fixed Navigation */}
      <header className="navbar">
        <div className="container navbar-inner">
          <a
            href="#top"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              retroSfx.click();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="brand-name">{ARTIST_INFO.name}</span>
          </a>

          <div className="nav-right">
            <nav className="nav-links">
              <a href="#gallery" className="nav-link">
                Gallery
              </a>
              <a href="#about" className="nav-link">
                About & Bio
              </a>
            </nav>

            <button
              type="button"
              className="theme-toggle"
              onClick={toggleSfx}
              title={sfxEnabled ? 'Mute Retro SFX' : 'Enable Retro SFX'}
            >
              {sfxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{sfxEnabled ? 'SFX ON' : 'SFX OFF'}</span>
            </button>

            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Pure Playable Pixel Interactive Stage + Top-Center User Info */}
      <section id="top" ref={heroRef} className="hero hero-game-only">
        <PixelPlatformerBg
          theme={theme}
          heroRef={heroRef}
          artworks={artworks}
          onSelectArt={(id) => {
            retroSfx.openArt();
            setSelectedArtId(id);
            setIsZoomed(false);
          }}
        />
        <div className="hero-top-userinfo">
          {ARTIST_INFO.avatar && (
            <img
              src={ARTIST_INFO.avatar}
              alt={ARTIST_INFO.name}
              className="hero-top-avatar"
            />
          )}
          <div>
            <h1 className="hero-top-name">{ARTIST_INFO.name}</h1>
            <p className="hero-top-role">
              {ARTIST_INFO.role} • {ARTIST_INFO.location}
            </p>
            <div className="hero-top-socials">
              {ARTIST_INFO.socials
                .filter((s) =>
                  ['Instagram', 'Twitter', 'TikTok'].includes(s.name)
                )
                .map((soc) => (
                  <a
                    key={soc.name}
                    href={soc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hero-top-social-link"
                  >
                    <span>{soc.name}</span>
                    <ArrowUpRight size={12} />
                  </a>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section (No Categories) */}
      <section id="gallery" className="section">
        <div className="container">
          <div className="section-header reveal">
            <div>
              <div className="section-kicker">
                <span>01 // EXHIBITION ARCHIVE</span>
              </div>
              <h2 className="section-title">Selected Works</h2>
            </div>
          </div>

          {/* Search & Layout Toolbar */}
          <div className="gallery-toolbar">
            <div className="gallery-count-label">
              Showing {filteredArtworks.length} of {artworks.length} Artworks
            </div>

            <div className="toolbar-right">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search title, medium..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="view-toggles" title="Switch Gallery Layout">
                <button
                  type="button"
                  className={`view-btn ${
                    viewMode === 'exhibition' ? 'active' : ''
                  }`}
                  onClick={() => setViewMode('exhibition')}
                  title="Exhibition Showcase Layout"
                >
                  <Columns size={16} />
                </button>
                <button
                  type="button"
                  className={`view-btn ${
                    viewMode === 'uniform' ? 'active' : ''
                  }`}
                  onClick={() => setViewMode('uniform')}
                  title="Uniform Grid Layout"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Artwork Grid */}
          {filteredArtworks.length === 0 ? (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.6rem',
                  marginBottom: '8px'
                }}
              >
                No artworks match your search.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'exhibition'
                  ? 'art-grid-masonry'
                  : 'art-grid-uniform'
              }
            >
              {filteredArtworks.map((art, idx) => (
                <article
                  key={art.id}
                  className="art-card reveal"
                  style={{ transitionDelay: `${Math.min(idx * 90, 540)}ms` }}
                  onClick={() => {
                    retroSfx.openArt();
                    setSelectedArtId(art.id);
                    setIsZoomed(false);
                  }}
                >
                  <div className="art-card-media">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="art-card-img"
                      loading="lazy"
                    />
                    <div className="art-card-inspect" title="Inspect Artwork">
                      <Maximize2 size={15} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About / Artist Bio & Statement Section */}
      <section id="about" className="section">
        <div className="container">
          <div className="section-header reveal">
            <div>
              <div className="section-kicker">
                <span>02 // ARTIST MANIFESTO & BIO</span>
              </div>
              <h2 className="section-title">Behind the Canvas</h2>
            </div>
          </div>

          <div className="about-grid about-grid-single">
            <div className="artist-card reveal">
              <div className="artist-card-header-row">
                <div>
                  {ARTIST_INFO.avatar && (
                    <div className="artist-avatar-wrap">
                      <img
                        src={ARTIST_INFO.avatar}
                        alt={ARTIST_INFO.name}
                        className="artist-avatar"
                      />
                    </div>
                  )}

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '2.2rem',
                      fontWeight: 700,
                      marginBottom: '6px'
                    }}
                  >
                    {ARTIST_INFO.name}
                  </h3>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.92rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MapPin size={15} />
                    <span>{ARTIST_INFO.location}</span>
                  </p>
                </div>

                <TigerMascotPlayground />
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '22px',
                  marginTop: '12px'
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Layers size={14} />
                  <span>Primary Mediums & Studio Pipeline</span>
                </div>
                <div className="chip-group">
                  {ARTIST_INFO.tools.map((tool, i) => (
                    <span key={i} className="tool-chip">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '22px',
                  marginTop: '22px'
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Mail size={14} />
                  <span>Socials & Studio Contact</span>
                </div>
                <div className="social-cards">
                  {ARTIST_INFO.socials.map((soc, i) => (
                    <a
                      key={i}
                      href={soc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="social-card"
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                          {soc.name}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {soc.handle}
                        </div>
                      </div>
                      <ArrowUpRight size={14} color="var(--text-secondary)" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="brand-seal"
              style={{ width: '28px', height: '28px' }}
            >
              <img
                src={ARTIST_INFO.avatar}
                alt={ARTIST_INFO.name}
                className="seal-img"
              />
            </div>
            <span>
              © {new Date().getFullYear()} {ARTIST_INFO.name}. All artworks & rights reserved.
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            Archive linked to <code>/GAL</code>
          </div>
        </div>
      </footer>

      {/* High-Res Lightbox Modal */}
      {activeLightboxArt && (
        <div
          className="lightbox-backdrop"
          onClick={() => {
            retroSfx.closeArt();
            setSelectedArtId(null);
            setIsZoomed(false);
          }}
        >
          <div
            className="lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-stage">
              <button
                type="button"
                className="lightbox-nav-btn prev"
                onClick={handlePrevArt}
                title="Previous Artwork (←)"
              >
                <ChevronLeft size={22} />
              </button>

              <img
                key={activeLightboxArt.id}
                src={activeLightboxArt.image}
                alt={activeLightboxArt.title}
                className={`lightbox-img ${isZoomed ? 'zoomed' : ''}`}
                onClick={() => setIsZoomed(!isZoomed)}
              />

              <button
                type="button"
                className="lightbox-nav-btn next"
                onClick={handleNextArt}
                title="Next Artwork (→)"
              >
                <ChevronRight size={22} />
              </button>

              <div className="lightbox-stage-controls">
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                  <span>
                    {isZoomed ? 'Reset Zoom (100%)' : 'Click to Zoom (175%)'}
                  </span>
                </button>
                <span>•</span>
                <span>Use ← / → keys</span>
              </div>
            </div>

            <div className="lightbox-details">
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}
                >
                  <span className="art-tag">{activeLightboxArt.year}</span>
                  <button
                    type="button"
                    className="lightbox-close"
                    onClick={() => {
                      setSelectedArtId(null);
                      setIsZoomed(false);
                    }}
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2.1rem',
                    fontWeight: 600,
                    lineHeight: 1.15,
                    marginBottom: '14px'
                  }}
                >
                  {activeLightboxArt.title}
                </h2>
                {activeLightboxArt.description && (
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.94rem',
                      lineHeight: 1.7
                    }}
                  >
                    {activeLightboxArt.description}
                  </p>
                )}

                <div className="spec-table">
                  <div className="spec-row">
                    <span className="spec-label">Year</span>
                    <span className="spec-value">{activeLightboxArt.year}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Medium / Tools</span>
                    <span className="spec-value">
                      {activeLightboxArt.medium}
                    </span>
                  </div>
                  {activeLightboxArt.dimensions && (
                    <div className="spec-row">
                      <span className="spec-label">Canvas Resolution</span>
                      <span className="spec-value">
                        {activeLightboxArt.dimensions}
                      </span>
                    </div>
                  )}
                  <div className="spec-row">
                    <span className="spec-label">Source File</span>
                    <span className="spec-value">
                      {activeLightboxArt.filename}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={activeLightboxArt.image}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                <span>Open Full Resolution File</span>
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
