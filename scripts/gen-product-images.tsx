// Generates one product image per service (Product.image) from the service's lucide icon, in Shadow Gate's colours.
//   node --import tsx scripts/gen-product-images.tsx   → public/images/products/<slug>.svg
import { mkdirSync, writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Icons from 'lucide-react';
import { createElement, type ComponentType, type SVGProps } from 'react';
import { SEED_SERVICES } from './seed/catalog-data';

const out = 'public/images/products';
mkdirSync(out, { recursive: true });
for (const s of SEED_SERVICES) {
  const Icon = (Icons as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[s.icon];
  if (!Icon) throw new Error(`Missing icon ${s.icon}`);
  const icon = renderToStaticMarkup(createElement(Icon, { width: 96, height: 96, stroke: "#35F2C4", strokeWidth: 1.6, x: 112, y: 72 }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="${s.name.en}">
  <defs><radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="#35F2C4" stop-opacity=".22"/><stop offset="1" stop-color="#070B14" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="240" rx="24" fill="#070B14"/>
  <rect width="320" height="240" rx="24" fill="url(#g)"/>
  <path d="M0 60H320M0 120H320M0 180H320M80 0V240M160 0V240M240 0V240" stroke="#F3F6FA" stroke-opacity=".05"/>
  <rect x="96" y="56" width="128" height="128" rx="28" fill="#0D1424" stroke="#35F2C4" stroke-opacity=".35"/>
  ${icon}
  <rect x=".5" y=".5" width="319" height="239" rx="23.5" fill="none" stroke="#F3F6FA" stroke-opacity=".12"/>
</svg>
`;
  writeFileSync(`${out}/${s.id}.svg`, svg);
}
console.log(`wrote ${SEED_SERVICES.length} product images to ${out}`);
