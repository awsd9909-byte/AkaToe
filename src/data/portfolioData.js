// ============================================================================
// AKATORA PORTFOLIO CONFIGURATION
// Images are automatically loaded from the /GAL folder!
// Drop any .jpg, .png, .webp, or .svg into /GAL and it will appear on the site.
// ============================================================================

const galModules = import.meta.glob(
  '/GAL/*.{png,jpg,jpeg,webp,gif,svg,PNG,JPG,JPEG,WEBP,GIF,SVG}',
  { eager: true, import: 'default' }
);

export const ARTIST_INFO = {
  name: "AKATORA",
  role: "Visual Artist, Concept Illustrator & 3D Sculpting",
  location: "Thailand / Remote Worldwide",
  email: "studio@akatora.art",
  avatar: galModules['/GAL/profile.gif'] || galModules['/GAL/123.jpg'] || Object.values(galModules)[0] || "",
  heroFeaturedFile: "Key Visual Final.jpg",
  statement:
    "My work explores the quiet tension between myth and modernity—combining atmospheric composition, speculative architecture, and dramatic chiaroscuro lighting.",
  bioParagraphs: [
    "Working under the moniker AKATORA, I specialize in high-contrast narrative illustration, character keyframes, and atmospheric environment design.",
    "Each canvas is crafted to command attention—balancing deep negative space with deliberate, luminous detail."
  ],
  stats: [
    { label: "Years Creating", value: "6+" },
    { label: "Curated Works", value: String(Object.keys(galModules).length) },
    { label: "Client Projects", value: "40+" },
    { label: "Exhibitions", value: "7" }
  ],
  tools: [
    "Clip Studio Paint EX",
    "Procreate",
    "Adobe Photoshop",
    "Blender 3D",
    "ZBrush"
  ],
  timeline: [
    {
      year: "2026",
      title: "Solo Showcase: 'Nocturnes in Monochrome'",
      org: "Shibuya Underground Gallery, Tokyo",
      type: "Exhibition"
    },
    {
      year: "2025",
      title: "Lead Keyframe & Character Concept Artist",
      org: "Project KAGEROU (Indie Action RPG)",
      type: "Client Work"
    },
    {
      year: "2024",
      title: "Featured Anthology Cover Illustrator",
      org: "Neo-Mythos Artbook Vol. IV",
      type: "Publication"
    }
  ],
  socials: [
    { name: "Instagram", handle: "@akatora_artacc", url: "https://www.instagram.com/akatora_artacc/" },
    { name: "Twitter", handle: "@akatora_sama", url: "https://x.com/akatora_sama" },
    { name: "TikTok", handle: "@awsdover", url: "https://www.tiktok.com/@awsdover" },
    { name: "ArtStation", handle: "awsd66981", url: "https://www.artstation.com/awsd66981" }
  ]
};

// Optional metadata overrides by exact filename in /GAL
const ARTWORK_METADATA = {
  "Key Visual Final.jpg": {
    order: 1,
    title: "Key Visual Final",
    year: "2026",
    medium: "Full CG Key Visual",
    dimensions: "7016 × 3933 px",
    featured: true,
    description:
      "Primary key visual centerpiece showcasing full-scale composition, lighting, and atmosphere."
  },
  "final full cg เก็บงานของจริง.jpg": {
    order: 2,
    title: "Final Full CG — Refined Edition",
    year: "2026",
    medium: "Full CG Illustration",
    dimensions: "3508 × 1973 px",
    featured: true,
    description:
      "Polished full-CG illustration with refined lighting, surface detail, and color grading."
  },
  "ของจริง.jpg": {
    order: 3,
    title: "Original Study (ของจริง)",
    year: "2026",
    medium: "Digital Painting",
    dimensions: "1806 × 1045 px",
    featured: false,
    description:
      "Original finished piece from the 2026 studio collection."
  },
  "123.jpg": {
    order: 4,
    title: "Study No. 123",
    year: "2026",
    medium: "Digital Illustration",
    dimensions: "1478 × 1045 px",
    featured: false,
    description:
      "Visual study exploring form, contrast, and framing."
  }
};

export const ARTWORKS = Object.entries(galModules)
  .filter(([path]) => !path.toLowerCase().endsWith('/profile.gif'))
  .map(([path, url]) => {
    const filename = path.split('/').pop();
    const meta = ARTWORK_METADATA[filename] || {};
    const fallbackTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return {
      id: filename,
      filename,
      order: meta.order ?? 99,
      title: meta.title || fallbackTitle,
      year: meta.year || "2026",
      medium: meta.medium || "Digital Artwork",
      dimensions: meta.dimensions || "",
      featured: meta.featured ?? false,
      image: url,
      description: meta.description || ""
    };
  })
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
