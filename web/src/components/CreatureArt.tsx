"use client";

import { useMemo } from "react";

// Inline the generator since it's pure computation — no Node.js deps
// In production, this would be a shared package

interface TraitDNA {
  element: string;
  archetype: string;
  formModifier: string;
  hue: number;
  saturation: number;
  brightness: number;
  formSeed: number;
  complexity: number;
  energy: number;
  symmetry: number;
  density: number;
  primaryLanguage: string;
  secondaryLanguage: string | null;
  frameworks: string[];
  domainKeywords: string[];
  domainConfidence: number;
  dnaHash: string;
}

interface CreatureArtProps {
  dna: TraitDNA | null;
  level: number;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Renders a procedural creature SVG from Trait DNA.
 * Falls back to a placeholder if no DNA is available.
 */
export function CreatureArt({ dna, level, width = 400, height = 400, className }: CreatureArtProps) {
  const svgMarkup = useMemo(() => {
    if (!dna) return placeholderSVG(width, height, level);
    return generateCreatureSVG(dna, { width, height, level });
  }, [dna, level, width, height]);

  // CSS effects based on level
  const glowIntensity = Math.min(1, level / 10);
  const pulseSpeed = Math.max(2, 6 - level * 0.4); // Faster pulse at higher levels
  const hue = dna?.hue ?? 200;

  const containerStyle: React.CSSProperties = {
    position: 'relative' as const,
    ...(level >= 3 ? {
      filter: `drop-shadow(0 0 ${4 + glowIntensity * 12}px hsla(${hue}, 80%, 60%, ${glowIntensity * 0.4}))`,
    } : {}),
    ...(level >= 5 ? {
      animation: `creature-pulse ${pulseSpeed}s ease-in-out infinite`,
    } : {}),
  };

  return (
    <>
      {level >= 5 && (
        <style>{`
          @keyframes creature-pulse {
            0%, 100% { filter: drop-shadow(0 0 ${4 + glowIntensity * 12}px hsla(${hue}, 80%, 60%, ${glowIntensity * 0.4})); }
            50% { filter: drop-shadow(0 0 ${8 + glowIntensity * 20}px hsla(${hue}, 80%, 60%, ${glowIntensity * 0.6})); }
          }
          @keyframes shimmer {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
        `}</style>
      )}
      <div
        className={className}
        style={containerStyle}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </>
  );
}

function placeholderSVG(w: number, h: number, level: number): string {
  const emoji = level === 0 ? '🥚' : '🐉';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="hsl(220, 10%, 8%)"/>
    <text x="${w/2}" y="${h/2}" text-anchor="middle" dominant-baseline="central" font-size="80">${emoji}</text>
  </svg>`;
}

// ─── INLINE GENERATOR (pure computation, no Node deps) ─────

class SeededRNG {
  private state: number;
  constructor(seed: number) { this.state = seed | 0; }
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number { return min + this.next() * (max - min); }
  int(min: number, max: number): number { return Math.floor(this.range(min, max + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  gaussian(): number {
    const u1 = this.next(), u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
  }
  chance(p: number): boolean { return this.next() < p; }
}

function hsl(h: number, s: number, l: number): string { return `hsl(${Math.round(h % 360)}, ${Math.round(s)}%, ${Math.round(l)}%)`; }
function hsla(h: number, s: number, l: number, a: number): string { return `hsla(${Math.round(h % 360)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`; }

interface Palette { primary: string; secondary: string; accent: string; background: string; glow: string; focal: string; muted: string; }

function generatePalette(dna: TraitDNA, rng: SeededRNG): Palette {
  const h = dna.hue, s = dna.saturation, b = dna.brightness;
  const offsets: Record<string, number[]> = {
    athletic: [0,30,15], winged: [0,120,240], playful: [0,60,180], sentinel: [0,15,195],
    cerebral: [0,45,180], crystalline: [0,150,210], harmonic: [0,40,80], organic: [0,30,60],
    phantom: [0,180,270], primal: [0,20,40], radiant: [0,60,120], adaptive: [0,90,180],
  };
  const o = offsets[dna.archetype] ?? [0,120,240];
  const hs = rng.range(-5,5);
  return {
    primary: hsl(h+o[0]+hs, s, b), secondary: hsl(h+o[1]+hs, s*0.8, b*0.9),
    accent: hsl(h+o[2]+hs, s*0.9, b*1.1), glow: hsla(h+o[0], s*1.2, b*1.3, 0.6),
    focal: hsl(h+o[0], 90, 70), muted: hsl(h+o[0], s*0.3, b*0.5), background: hsl(h+o[0], 10, 8),
  };
}

function blobPath(rng: SeededRNG, cx: number, cy: number, r: number, irreg: number = 0.3, pts: number = 8): string {
  const points: {x:number;y:number}[] = [];
  for (let i = 0; i < pts; i++) {
    const a = (i/pts)*Math.PI*2 + rng.gaussian()*irreg*0.3;
    const ri = r * Math.max(0.5, Math.min(1.5, 1 + rng.gaussian()*irreg));
    points.push({ x: cx+Math.cos(a)*ri, y: cy+Math.sin(a)*ri });
  }
  return smoothPath(points);
}

function crystalPath(rng: SeededRNG, cx: number, cy: number, r: number, f: number = 6): string {
  const pts: {x:number;y:number}[] = [];
  for (let i = 0; i < f; i++) {
    const a = (i/f)*Math.PI*2 - Math.PI/2;
    const ri = r * (0.7 + rng.next()*0.6);
    pts.push({ x: cx+Math.cos(a)*ri, y: cy+Math.sin(a)*ri });
  }
  return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
}

function flowCurve(rng: SeededRNG, x1: number, y1: number, x2: number, y2: number, w: number = 0.3): string {
  const mx = (x1+x2)/2, my = (y1+y2)/2, d = Math.sqrt((x2-x1)**2+(y2-y1)**2);
  return `M ${x1} ${y1} Q ${mx+rng.gaussian()*d*w} ${my+rng.gaussian()*d*w} ${x2} ${y2}`;
}

function nodeCircle(rng: SeededRNG, cx: number, cy: number, r: number, count: number): {x:number;y:number;r:number}[] {
  const nodes: {x:number;y:number;r:number}[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i/count)*Math.PI*2 + rng.range(-0.1,0.1);
    const d = r * (0.6 + rng.next()*0.8);
    nodes.push({ x: cx+Math.cos(a)*d, y: cy+Math.sin(a)*d, r: 2+rng.next()*4 });
  }
  return nodes;
}

function starburstPath(rng: SeededRNG, cx: number, cy: number, ir: number, or_: number, spikes: number): string {
  const pts: {x:number;y:number}[] = [];
  for (let i = 0; i < spikes*2; i++) {
    const a = (i/(spikes*2))*Math.PI*2 - Math.PI/2;
    const r = i%2===0 ? or_*(0.8+rng.next()*0.4) : ir*(0.7+rng.next()*0.6);
    pts.push({ x: cx+Math.cos(a)*r, y: cy+Math.sin(a)*r });
  }
  return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
}

function smoothPath(pts: {x:number;y:number}[]): string {
  if (pts.length < 3) return '';
  const n = pts.length;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i-1+n)%n], p1 = pts[i], p2 = pts[(i+1)%n], p3 = pts[(i+2)%n];
    const t = 0.3;
    d += ` C ${p1.x+(p2.x-p0.x)*t} ${p1.y+(p2.y-p0.y)*t}, ${p2.x-(p3.x-p1.x)*t} ${p2.y-(p3.y-p1.y)*t}, ${p2.x} ${p2.y}`;
  }
  return d + ' Z';
}

function generateCreatureSVG(dna: TraitDNA, opts: {width:number;height:number;level:number}): string {
  const { width: w, height: h, level } = opts;
  const rng = new SeededRNG(dna.formSeed);
  const pal = generatePalette(dna, rng);
  const cx = w/2, cy = h/2, br = Math.min(w,h)*0.3;
  const lc = Math.min(2+level, 8);
  const layers: string[] = [];

  layers.push(`<rect width="${w}" height="${h}" fill="${pal.background}"/>`);
  layers.push(`<defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter><filter id="sg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="15" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter><filter id="ig"><feGaussianBlur stdDeviation="4" result="b"/><feComposite in="b" in2="SourceGraphic" operator="atop"/></filter><radialGradient id="cg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${pal.focal}" stop-opacity="1"/><stop offset="60%" stop-color="${pal.primary}" stop-opacity="0.6"/><stop offset="100%" stop-color="${pal.primary}" stop-opacity="0"/></radialGradient></defs>`);

  // Ambient
  const ap: string[] = [];
  for (let i = 0; i < 10+level*5; i++) ap.push(`<circle cx="${rng.range(0,w)}" cy="${rng.range(0,h)}" r="${rng.range(0.5,2.5)}" fill="${pal.glow}" opacity="${rng.range(0.1,0.4)}"/>`);
  layers.push(`<g>${ap.join('')}</g>`);

  // Body by archetype
  const gen: Record<string, () => string> = {
    cerebral: () => genCerebral(rng,cx,cy,br,pal,lc),
    sentinel: () => genSentinel(rng,cx,cy,br,pal,lc),
    athletic: () => genAthletic(rng,cx,cy,br,pal,lc),
    winged: () => genWinged(rng,cx,cy,br,pal,lc),
    crystalline: () => genCrystalline(rng,cx,cy,br,pal,lc),
    playful: () => genPlayful(rng,cx,cy,br,pal,lc),
    phantom: () => genPhantom(rng,cx,cy,br,pal,lc),
  };
  layers.push((gen[dna.archetype] ?? (() => genOrganic(rng,cx,cy,br,pal,lc)))());

  // Focal
  const gr = br*0.15*(2+level*0.3);
  const fr = br*0.15;
  layers.push(`<g filter="url(#g)"><circle cx="${cx}" cy="${cy}" r="${gr}" fill="url(#cg)" opacity="0.5"/><circle cx="${cx}" cy="${cy}" r="${fr*1.5}" fill="${pal.focal}" opacity="0.3"/><circle cx="${cx}" cy="${cy}" r="${fr}" fill="${pal.focal}" opacity="0.8"/><circle cx="${cx}" cy="${cy}" r="${fr*0.4}" fill="white" opacity="0.9"/></g>`);

  // Level-based aura
  if (level >= 3) {
    const ai = Math.min(1, (level-2)/8);
    const ar = br*(0.8+ai*0.6);
    layers.push(`<circle cx="${cx}" cy="${cy}" r="${ar}" fill="none" stroke="${pal.glow}" stroke-width="${1+ai*2}" opacity="${ai*0.3}" filter="url(#sg)"/>`);
  }
  if (level >= 6) layers.push(`<circle cx="${cx}" cy="${cy}" r="${br*1.3}" fill="none" stroke="${pal.focal}" stroke-width="0.5" opacity="0.15" stroke-dasharray="4 8"/>`);
  if (level >= 9) { for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2,d=br*1.15;layers.push(`<circle cx="${cx+Math.cos(a)*d}" cy="${cy+Math.sin(a)*d}" r="2" fill="${pal.focal}" opacity="0.6"/>`);} }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${layers.join('\n')}</svg>`;
}

function genCerebral(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let l=0;l<lc;l++){const r=br*(0.4+l*0.15),nc=5+l*2,nodes=nodeCircle(rng,cx,cy,r,nc);
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(rng.chance(0.3))parts.push(`<path d="${flowCurve(rng,nodes[i].x,nodes[i].y,nodes[j].x,nodes[j].y,0.4)}" fill="none" stroke="${p.secondary}" stroke-width="0.8" opacity="${0.1+(lc-l)*0.05}"/>`);
  for(const n of nodes){parts.push(`<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${p.primary}" opacity="${0.3+(lc-l)*0.1}"/>`);if(rng.chance(0.4))parts.push(`<circle cx="${n.x}" cy="${n.y}" r="${n.r*2}" fill="${p.glow}" opacity="${(0.3+(lc-l)*0.1)*0.3}"/>`);}}
  const cp=blobPath(rng,cx,cy,br*0.4,0.3,10);parts.push(`<path d="${cp}" fill="${p.primary}" opacity="0.4" filter="url(#sg)"/><path d="${cp}" fill="none" stroke="${p.accent}" stroke-width="1" opacity="0.5"/>`);
  return `<g>${parts.join('\n')}</g>`;
}

function genSentinel(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let i=lc;i>=1;i--){const r=br*(i/lc)*1.1,f=4+rng.int(0,4),path=crystalPath(rng,cx,cy,r,f);parts.push(`<path d="${path}" fill="${p.primary}" opacity="${0.15+(lc-i)*0.05}" stroke="${p.secondary}" stroke-width="0.5"/>`);}
  for(let i=0;i<lc*2;i++){const a=rng.range(0,Math.PI*2),d=rng.range(br*0.2,br*0.9),px=cx+Math.cos(a)*d,py=cy+Math.sin(a)*d,pr=rng.range(5,15);parts.push(`<path d="${crystalPath(rng,px,py,pr,rng.int(3,6))}" fill="${p.accent}" opacity="0.3" stroke="${p.secondary}" stroke-width="0.3"/>`);}
  parts.push(`<path d="${crystalPath(rng,cx,cy,br*0.3,6)}" fill="${p.primary}" opacity="0.5" filter="url(#ig)"/>`);
  return `<g>${parts.join('\n')}</g>`;
}

function genAthletic(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];parts.push(`<path d="${starburstPath(rng,cx,cy,br*0.3,br*0.9,5+lc)}" fill="${p.primary}" opacity="0.2" filter="url(#sg)"/>`);
  for(let i=0;i<lc;i++){const ox=rng.gaussian()*br*0.1,oy=rng.gaussian()*br*0.1,r=br*(0.7-i*0.06),path=blobPath(rng,cx+ox,cy+oy,r,0.4,8+i),op=0.15+i*0.05;parts.push(`<path d="${path}" fill="${p.primary}" opacity="${op}"/><path d="${path}" fill="none" stroke="${p.accent}" stroke-width="0.5" opacity="${op*0.8}"/>`);}
  for(let i=0;i<3;i++)parts.push(`<circle cx="${cx}" cy="${cy}" r="${br*(0.5+i*0.2)}" fill="none" stroke="${p.glow}" stroke-width="1" opacity="${0.2-i*0.05}"/>`);
  return `<g>${parts.join('\n')}</g>`;
}

function genWinged(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let i=0;i<lc;i++){const sp=br*(0.5+i*0.15),lf=rng.range(-br*0.3,br*0.1);parts.push(`<path d="${flowCurve(rng,cx,cy+lf,cx-sp,cy-sp*0.5,0.5)}" fill="none" stroke="${p.primary}" stroke-width="${2-i*0.2}" opacity="${0.4-i*0.03}"/><path d="${flowCurve(rng,cx,cy+lf,cx+sp,cy-sp*0.5,0.5)}" fill="none" stroke="${p.primary}" stroke-width="${2-i*0.2}" opacity="${0.4-i*0.03}"/>`);}
  const nodes=nodeCircle(rng,cx,cy,br*0.6,8+lc*2);for(const n of nodes)parts.push(`<circle cx="${n.x}" cy="${n.y}" r="${n.r*0.8}" fill="${p.accent}" opacity="0.3"/>`);
  parts.push(`<path d="${blobPath(rng,cx,cy,br*0.35,0.2,8)}" fill="${p.primary}" opacity="0.4" filter="url(#sg)"/>`);
  return `<g>${parts.join('\n')}</g>`;
}

function genCrystalline(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let i=0;i<lc*3;i++){const a=rng.range(0,Math.PI*2),d=rng.range(0,br*0.8),px=cx+Math.cos(a)*d,py=cy+Math.sin(a)*d,sz=rng.range(8,br*0.3);parts.push(`<path d="${crystalPath(rng,px,py,sz,rng.int(3,7))}" fill="${rng.chance(0.5)?p.primary:p.secondary}" opacity="${0.1+rng.next()*0.3}" stroke="${p.accent}" stroke-width="0.3"/>`);}
  for(let i=0;i<lc*2;i++){const x1=cx+rng.gaussian()*br*0.5,y1=cy+rng.gaussian()*br*0.5,x2=cx+rng.gaussian()*br*0.5,y2=cy+rng.gaussian()*br*0.5;parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.glow}" stroke-width="0.5" opacity="0.2"/>`);}
  return `<g>${parts.join('\n')}</g>`;
}

function genPlayful(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let i=0;i<lc*3;i++){const a=rng.range(0,Math.PI*2),d=rng.range(0,br*0.9),px=cx+Math.cos(a)*d,py=cy+Math.sin(a)*d,r=rng.range(5,25);parts.push(`<circle cx="${px}" cy="${py}" r="${r}" fill="${rng.pick([p.primary,p.secondary,p.accent])}" opacity="${rng.range(0.15,0.45)}"/>`);}
  parts.push(`<path d="${blobPath(rng,cx,cy,br*0.4,0.5,10)}" fill="${p.primary}" opacity="0.5"/>`);
  return `<g>${parts.join('\n')}</g>`;
}

function genPhantom(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let i=0;i<lc*3;i++){const sa=rng.range(0,Math.PI*2),sd=rng.range(br*0.1,br*0.4),ed=rng.range(br*0.5,br*1.2),x1=cx+Math.cos(sa)*sd,y1=cy+Math.sin(sa)*sd,x2=cx+Math.cos(sa+rng.range(-0.5,0.5))*ed,y2=cy+Math.sin(sa+rng.range(-0.5,0.5))*ed;
  parts.push(`<path d="${flowCurve(rng,x1,y1,x2,y2,0.6)}" fill="none" stroke="${p.primary}" stroke-width="${rng.range(0.5,3)}" opacity="${rng.range(0.1,0.3)}" filter="url(#sg)"/>`);}
  parts.push(`<path d="${blobPath(rng,cx,cy,br*0.25,0.2,8)}" fill="${p.muted}" opacity="0.6"/>`);
  return `<g>${parts.join('\n')}</g>`;
}

function genOrganic(rng:SeededRNG,cx:number,cy:number,br:number,p:Palette,lc:number):string {
  const parts:string[]=[];
  for(let i=lc;i>=0;i--){const r=br*(0.3+i*0.1),path=blobPath(rng,cx,cy,r,0.3,6+i*2),op=0.1+(lc-i)*0.05;parts.push(`<path d="${path}" fill="${i%2===0?p.primary:p.secondary}" opacity="${op}"/>`);}
  for(let i=0;i<lc;i++){const a=rng.range(0,Math.PI*2),x1=cx+Math.cos(a)*br*0.2,y1=cy+Math.sin(a)*br*0.2,x2=cx+Math.cos(a)*br*(0.7+rng.next()*0.5),y2=cy+Math.sin(a)*br*(0.7+rng.next()*0.5);parts.push(`<path d="${flowCurve(rng,x1,y1,x2,y2,0.5)}" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity="0.25"/>`);}
  return `<g>${parts.join('\n')}</g>`;
}
