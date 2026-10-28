import { GeneratedImage } from '../types';

/**
 * Generates an ultra crisp, high-fidelity SVG graphic as a data URL.
 * Employs geometric layering, gradient meshes, lighting highlights, and prompt overlays.
 */
function createDesignArtSvg(
  theme: string,
  variantIndex: number,
  title: string,
  seed: number,
  promptKeyword: string
): string {
  const colorPalettes: Record<string, string[][]> = {
    cyberpunk: [
      ['#0f172a', '#1e1b4b', '#4338ca', '#ec4899', '#06b6d4'],
      ['#020617', '#18181b', '#3b82f6', '#8b5cf6', '#f43f5e'],
      ['#09090b', '#27272a', '#10b981', '#06b6d4', '#6366f1'],
    ],
    surreal: [
      ['#1e293b', '#334155', '#e2e8f0', '#f59e0b', '#10b981'],
      ['#134e4a', '#042f2e', '#2dd4bf', '#fbbf24', '#f87171'],
      ['#3b0764', '#581c87', '#a855f7', '#38bdf8', '#f472b6'],
    ],
    architecture: [
      ['#1e293b', '#475569', '#94a3b8', '#cbd5e1', '#f1f5f9'],
      ['#292524', '#44403c', '#78716c', '#d6d3d1', '#f5f5f4'],
      ['#0f172a', '#1e3a8a', '#3b82f6', '#93c5fd', '#e0f2fe'],
    ],
    nature: [
      ['#064e3b', '#047857', '#10b981', '#a7f3d0', '#fef3c7'],
      ['#14532d', '#166534', '#22c55e', '#86efac', '#fde047'],
      ['#0c4a6e', '#0369a1', '#0284c7', '#7dd3fc', '#bae6fd'],
    ],
    product: [
      ['#18181b', '#27272a', '#3f3f46', '#71717a', '#fafafa'],
      ['#1c1917', '#292524', '#57534e', '#a8a29e', '#e7e5e4'],
      ['#0f172a', '#334155', '#64748b', '#cbd5e1', '#ffffff'],
    ],
    default: [
      ['#1e1e24', '#2b2d42', '#8d99ae', '#edf2f4', '#ef233c'],
      ['#22223b', '#4a4e69', '#9a8c98', '#c9ada7', '#f2e9e4'],
      ['#1b263b', '#415a77', '#778da9', '#e0e1dd', '#00b4d8'],
    ],
  };

  const paletteKey = colorPalettes[theme] ? theme : 'default';
  const paletteList = colorPalettes[paletteKey];
  const palette = paletteList[variantIndex % paletteList.length];

  const c1 = palette[0];
  const c2 = palette[1];
  const c3 = palette[2];
  const c4 = palette[3];
  const c5 = palette[4];

  // Dynamic geometry calculations based on variantIndex (0 to 8)
  const angle = (variantIndex * 40 + 25) % 360;
  const cx1 = 200 + ((variantIndex * 67) % 150) - 75;
  const cy1 = 200 + ((variantIndex * 93) % 150) - 75;
  const r1 = 80 + (variantIndex * 11) % 50;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${seed}_1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="50%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
      <linearGradient id="g_${seed}_2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${c4}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${c5}" stop-opacity="0.2" />
      </linearGradient>
      <radialGradient id="r_${seed}" cx="60%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${c5}" stop-opacity="0.9" />
        <stop offset="60%" stop-color="${c4}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="${c2}" stop-opacity="0" />
      </radialGradient>
      <filter id="glow_${seed}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="400" height="400" fill="url(#g_${seed}_1)" />

    <!-- Grid Texture -->
    <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
      <line x1="0" y1="100" x2="400" y2="100" />
      <line x1="0" y1="200" x2="400" y2="200" />
      <line x1="0" y1="300" x2="400" y2="300" />
      <line x1="100" y1="0" x2="100" y2="400" />
      <line x1="200" y1="0" x2="200" y2="400" />
      <line x1="300" y1="0" x2="300" y2="400" />
    </g>

    <!-- Ambient Glow Orb -->
    <circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="url(#r_${seed})" filter="url(#glow_${seed})" />

    <!-- Geometric Shapes & Compositional Focal Point -->
    <g transform="rotate(${angle} 200 200)">
      <polygon points="200,80 310,290 90,290" fill="none" stroke="${c4}" stroke-width="2.5" opacity="0.75" />
      <circle cx="200" cy="200" r="${r1 * 0.7}" fill="url(#g_${seed}_2)" stroke="${c5}" stroke-width="1.5" />
      <rect x="150" y="150" width="100" height="100" fill="none" stroke="${c3}" stroke-width="2" stroke-dasharray="6,4" />
    </g>

    <!-- Golden Horizon / Diagonal Light Ray -->
    <line x1="0" y1="${320 - (variantIndex * 15)}" x2="400" y2="${280 - (variantIndex * 15)}" stroke="${c5}" stroke-width="1.5" opacity="0.6" />

    <!-- Overlay Framing and Details -->
    <rect x="16" y="16" width="368" height="368" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
    <circle cx="36" cy="36" r="3" fill="${c5}" opacity="0.8" />
    <circle cx="364" cy="36" r="3" fill="${c4}" opacity="0.8" />

    <!-- Minimal Modern Typography -->
    <text x="28" y="360" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="1.5">
      #0${variantIndex + 1} · ${title.toUpperCase()}
    </text>
    <text x="28" y="378" font-family="monospace" font-size="9" fill="rgba(255,255,255,0.7)">
      SEED:${seed} · ITERATION ${promptKeyword}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Creates an exact 9-image grid for a specific prompt iteration round.
 */
export function generate9GridImages(
  theme: string,
  roundNumber: number,
  basePrompt: string
): GeneratedImage[] {
  const images: GeneratedImage[] = [];
  const cleanKeywords = basePrompt.slice(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '_');

  const titles = [
    '主构图变体 A',
    '光影侧逆光变体 B',
    '微距景深特写 C',
    '广角透视延展 D',
    '冷暖色相偏移 E',
    '高对比材质强调 F',
    '超低仰视张力 G',
    '极简空镜意境 H',
    '综合最佳平衡 I',
  ];

  for (let i = 0; i < 9; i++) {
    const seed = 100000 + roundNumber * 1000 + (i + 1) * 73;
    const title = titles[i];
    const url = createDesignArtSvg(theme, i, title, seed, `R${roundNumber}_V${i + 1}`);

    images.push({
      id: `img_r${roundNumber}_${i + 1}_${Date.now()}`,
      url,
      title: `第${roundNumber}轮 · 变体0${i + 1} (${title})`,
      seed,
      promptSnippet: basePrompt,
      styleTag: `${theme.toUpperCase()} · v${i + 1}`,
      aspectRatio: '1:1',
      isSelectedHero: i === 0, // default first one selected as hero
    });
  }

  return images;
}

/**
 * Reads an uploaded image File and compresses/resizes it to a compact Data URL
 * so that 9-grid uploads store reliably in localStorage and render in PDF exports.
 */
export function readImageFileAsDataUrl(file: File, maxDimension = 520): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.width || 400;
          let height = img.height || 400;
          if (w > maxDimension || height > maxDimension) {
            if (w > height) {
              height = Math.round((height * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = w;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(result);
          }
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => reject(new Error('读取图片文件失败'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
