/**
 * Fetch publications from Semantic Scholar API using ORCID.
 * Called at build time. Falls back to cached data if API is unavailable.
 *
 * Usage: npx tsx src/scripts/fetch-publications.ts
 * Output: src/content/publications-cache.json
 */

const ORCID = '0000-0002-9881-1973';
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';
const OUTPUT_PATH = new URL('../content/publications-cache.json', import.meta.url);

interface SemanticPaper {
  paperId: string;
  title: string;
  year: number;
  venue: string;
  publicationVenue?: { name: string } | null;
  externalIds?: { DOI?: string } | null;
  authors: { name: string; authorId: string }[];
  citationCount: number;
  url: string;
}

interface PublicationEntry {
  id: string;
  title: string;
  year: number;
  venue: string;
  doi: string | null;
  authors: string[];
  citations: number;
  url: string;
}

async function fetchFromSemanticScholar(): Promise<PublicationEntry[]> {
  // Step 1: Find author by ORCID
  const searchUrl = `${SEMANTIC_SCHOLAR_API}/author/ORCID:${ORCID}?fields=papers.title,papers.year,papers.venue,papers.publicationVenue,papers.externalIds,papers.authors,papers.citationCount,papers.url`;

  const response = await fetch(searchUrl);

  if (!response.ok) {
    throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const papers: SemanticPaper[] = data.papers || [];

  return papers
    .filter((p: SemanticPaper) => p.title && p.year)
    .map((p: SemanticPaper): PublicationEntry => ({
      id: p.paperId,
      title: p.title,
      year: p.year,
      venue: p.publicationVenue?.name || p.venue || '',
      doi: p.externalIds?.DOI || null,
      authors: p.authors.map((a: { name: string }) => a.name),
      citations: p.citationCount || 0,
      url: p.url,
    }))
    .sort((a: PublicationEntry, b: PublicationEntry) => b.year - a.year || b.citations - a.citations);
}

async function main() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const outputFile = path.resolve(new URL('.', import.meta.url).pathname, '../content/publications-cache.json');

  console.log('Fetching publications from Semantic Scholar...');

  try {
    const publications = await fetchFromSemanticScholar();
    const output = {
      fetchedAt: new Date().toISOString(),
      count: publications.length,
      publications,
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`Wrote ${publications.length} publications to publications-cache.json`);
  } catch (error) {
    console.error('Failed to fetch:', error);

    // Check if cache exists
    if (fs.existsSync(outputFile)) {
      console.log('Using existing cache.');
    } else {
      // Write empty cache
      fs.writeFileSync(outputFile, JSON.stringify({ fetchedAt: null, count: 0, publications: [] }, null, 2));
      console.log('Wrote empty cache.');
    }
  }
}

main();
