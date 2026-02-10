/**
 * Fetch publications from Semantic Scholar API using ORCID.
 * Called at build time. Falls back to cached data if API is unavailable.
 *
 * Usage: node src/scripts/fetch-publications.mjs
 * Output: src/content/publications-cache.json
 */

import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTHOR_ID = '66470460'; // Semantic Scholar author ID for Pranay Shrestha
const API = 'https://api.semanticscholar.org/graph/v1';
const OUTPUT = resolve(__dirname, '../content/publications-cache.json');

async function fetchPapers() {
  const url = `${API}/author/${AUTHOR_ID}?fields=papers.title,papers.year,papers.venue,papers.publicationVenue,papers.externalIds,papers.authors,papers.citationCount,papers.url`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  const papers = data.papers || [];

  return papers
    .filter((p) => p.title && p.year)
    .map((p) => ({
      id: p.paperId,
      title: p.title,
      year: p.year,
      venue: p.publicationVenue?.name || p.venue || '',
      doi: p.externalIds?.DOI || null,
      authors: p.authors.map((a) => a.name),
      citations: p.citationCount || 0,
      url: p.url,
    }))
    .sort((a, b) => b.year - a.year || b.citations - a.citations);
}

async function main() {
  console.log('Fetching publications from Semantic Scholar...');
  try {
    const publications = await fetchPapers();
    const output = {
      fetchedAt: new Date().toISOString(),
      count: publications.length,
      publications,
    };
    writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
    console.log(`Wrote ${publications.length} publications to publications-cache.json`);
  } catch (err) {
    console.error('Failed to fetch:', err.message);
    if (existsSync(OUTPUT)) {
      console.log('Using existing cache.');
    } else {
      writeFileSync(OUTPUT, JSON.stringify({ fetchedAt: null, count: 0, publications: [] }, null, 2));
      console.log('Wrote empty cache.');
    }
  }
}

main();
