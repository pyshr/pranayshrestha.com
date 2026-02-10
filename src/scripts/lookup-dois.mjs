import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cachePath = resolve(process.cwd(), 'src/content/publications-cache.json');
const cache = JSON.parse(readFileSync(cachePath, 'utf-8'));

async function queryDOI(title) {
  const encoded = encodeURIComponent(title);
  const url = `https://api.crossref.org/works?query.title=${encoded}&query.author=Shrestha&rows=1&mailto=pranay.shrestha@materials.ox.ac.uk`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const item = data?.message?.items?.[0];
    if (!item?.DOI) return null;
    // Check title similarity
    const retTitle = (item.title?.[0] || '').toLowerCase();
    const queryTitle = title.toLowerCase();
    // Simple check: first 40 chars overlap
    if (retTitle.substring(0, 40) === queryTitle.substring(0, 40)) {
      return item.DOI;
    }
    // Fallback: check if substantial overlap
    const words = queryTitle.split(/\s+/).slice(0, 6);
    const matchCount = words.filter(w => retTitle.includes(w)).length;
    if (matchCount >= 4) return item.DOI;
    console.log(`  SKIP mismatch: "${retTitle.substring(0,60)}"`);
    return null;
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    return null;
  }
}

async function main() {
  let found = 0;
  for (let i = 0; i < cache.publications.length; i++) {
    const pub = cache.publications[i];
    if (pub.doi) { found++; continue; }
    console.log(`[${i+1}/${cache.publications.length}] ${pub.title.substring(0, 70)}...`);
    const doi = await queryDOI(pub.title);
    if (doi) {
      pub.doi = doi;
      found++;
      console.log(`  -> ${doi}`);
    } else {
      console.log(`  -> not found`);
    }
    // Rate limit: 0.5s between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Add 2 patents
  cache.publications.push({
    id: 'patent-1',
    title: 'Wrist mechanism for body-powered prosthetic devices',
    year: 2016,
    venue: 'Patent',
    doi: null,
    authors: ['Shrestha, P.', 'Nand, A.', 'Carey, J.'],
    citations: 0,
    url: ''
  });
  cache.publications.push({
    id: 'patent-2',
    title: '3D-printed wrist joint for above-wrist prosthetic devices',
    year: 2015,
    venue: 'Patent',
    doi: null,
    authors: ['Shrestha, P.', 'Nand, A.', 'Carey, J.'],
    citations: 0,
    url: ''
  });

  cache.count = cache.publications.length;
  console.log(`\nDone. Found ${found}/${cache.publications.length - 2} DOIs. Total entries: ${cache.count}`);
  writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n');
  console.log('Written to', cachePath);
}

main();
