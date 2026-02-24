const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// --- Config ---
const DELAY_MS = 800; // delay between requests to avoid rate limiting
const PROGRESS_FILE = path.join(__dirname, '..', 'output', 'devpost', '.progress.json');

// --- Helpers ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureOutputDir() {
  const dir = path.join(__dirname, '..', 'output', 'devpost');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { completedProjects: [], attendees: [] };
}

function saveProgress(progress) {
  ensureOutputDir();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// --- Counter ---
let counter = {
  totalProjects: 0,
  processedProjects: 0,
  totalMembers: 0,
  githubsFound: 0,
  currentPage: 0,
  totalPages: 0
};

function printCounter() {
  process.stdout.write(
    `\r[Page ${counter.currentPage}/${counter.totalPages}] ` +
    `Projects: ${counter.processedProjects}/${counter.totalProjects} | ` +
    `Members: ${counter.totalMembers} | ` +
    `GitHubs: ${counter.githubsFound}`
  );
}

// --- Step 1: Get all project URLs from a single gallery page ---
async function getProjectsFromPage(galleryBaseUrl, pageNum) {
  const url = `${galleryBaseUrl}?page=${pageNum}`;
  console.log(`\n  Fetching gallery page ${pageNum}: ${url}`);

  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const projects = [];
  $('a.block-wrapper-link[href*="/software/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const fullUrl = href.startsWith('http') ? href : `https://devpost.com${href}`;
      projects.push(fullUrl);
    }
  });

  // Detect total pages from pagination if on page 1
  if (pageNum === 1) {
    const paginationLinks = $('ul.pagination li a');
    let maxPage = 1;
    paginationLinks.each((_, el) => {
      const text = $(el).text().trim();
      const num = parseInt(text);
      if (!isNaN(num) && num > maxPage) maxPage = num;
    });
    counter.totalPages = maxPage;
  }

  return projects;
}

// --- Step 2: Get project details (title + team member profile URLs) ---
async function getProjectDetails(projectUrl) {
  const res = await fetch(projectUrl);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $('#app-title').text().trim() || $('h1').first().text().trim() || 'Unknown';

  const members = [];
  const seenProfiles = new Set();
  // Team members are in the "contributors" section
  $('li.software-team-member a, .members a[href*="devpost.com/"]').each((_, el) => {
    const href = $(el).attr('href');
    const name = $(el).text().trim() || $(el).find('img').attr('alt') || '';
    if (href && href.includes('devpost.com/') && !href.includes('/software/')) {
      const profileUrl = href.startsWith('http') ? href : `https://devpost.com${href}`;
      if (name && name.length > 0 && name.length < 100 && !seenProfiles.has(profileUrl)) {
        seenProfiles.add(profileUrl);
        members.push({ name, devpost_profile: profileUrl });
      }
    }
  });

  // Fallback: look for member links in different markup patterns
  if (members.length === 0) {
    $('a[href*="devpost.com/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('/software/') && !href.includes('/project-gallery') &&
          !href.includes('devpost.com/hackathons') && !href.includes('devpost.com/api')) {
        const profileUrl = href.startsWith('http') ? href : `https://devpost.com${href}`;
        // Check if it looks like a user profile URL (devpost.com/username)
        const match = profileUrl.match(/devpost\.com\/([a-zA-Z0-9_-]+)\/?$/);
        if (match && match[1] !== 'software' && match[1] !== 'hackathons') {
          const name = $(el).text().trim() || match[1];
          if (!members.find(m => m.devpost_profile === profileUrl)) {
            members.push({ name: name.substring(0, 100), devpost_profile: profileUrl });
          }
        }
      }
    });
  }

  return { title, projectUrl, members };
}

// --- Step 3: Get GitHub from a Devpost profile ---
async function getGithubFromProfile(profileUrl) {
  try {
    const res = await fetch(profileUrl);
    const html = await res.text();
    const $ = cheerio.load(html);

    let github = null;

    // Look for GitHub link in profile
    $('a[href*="github.com/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('github.com/') && !github) {
        // Clean up the URL
        const match = href.match(/(https?:\/\/github\.com\/[a-zA-Z0-9_-]+)/);
        if (match) {
          github = match[1];
        }
      }
    });

    return github;
  } catch (err) {
    console.error(`\n  Error fetching profile ${profileUrl}: ${err.message}`);
    return null;
  }
}

// --- Main Abstraction: Process one full page of projects ---
async function processFullPage(galleryBaseUrl, pageNum, progress) {
  counter.currentPage = pageNum;

  // Step 1: Get all project URLs from this page
  const projectUrls = await getProjectsFromPage(galleryBaseUrl, pageNum);
  console.log(`\n  Found ${projectUrls.length} projects on page ${pageNum}`);

  for (const projectUrl of projectUrls) {
    // Skip if already processed
    if (progress.completedProjects.includes(projectUrl)) {
      counter.processedProjects++;
      printCounter();
      continue;
    }

    await sleep(DELAY_MS);

    // Step 2: Get the project post + team members
    console.log(`\n  >> Project: ${projectUrl}`);
    const project = await getProjectDetails(projectUrl);
    console.log(`     Title: "${project.title}" | Team: ${project.members.length} members`);

    // Step 3: For each member, get their GitHub
    for (const member of project.members) {
      await sleep(DELAY_MS);
      console.log(`     -> Profile: ${member.name} (${member.devpost_profile})`);
      const github = await getGithubFromProfile(member.devpost_profile);
      member.github = github;
      if (github) {
        counter.githubsFound++;
        console.log(`        GitHub: ${github}`);
      } else {
        console.log(`        GitHub: not found`);
      }
      counter.totalMembers++;
      printCounter();

      // Add to results
      progress.attendees.push({
        name: member.name,
        github: github || '',
        devpost_profile: member.devpost_profile,
        project: project.title,
        project_url: project.projectUrl
      });
    }

    counter.processedProjects++;
    progress.completedProjects.push(projectUrl);
    saveProgress(progress);
    printCounter();
  }
}

// --- Entry Point ---
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node devpost-scraper.js <gallery-base-url> [max-pages]');
    console.error('Example: node devpost-scraper.js https://hackthenorth2025.devpost.com/project-gallery 3');
    process.exit(1);
  }

  const galleryBaseUrl = args[0].replace(/\?.*$/, ''); // strip query params
  const maxPages = args[1] ? parseInt(args[1]) : null;
  const eventName = galleryBaseUrl.match(/\/\/([^.]+)\./)?.[1] || 'devpost-event';

  console.log(`\nDevpost Scraper`);
  console.log(`===============`);
  console.log(`Event: ${eventName}`);
  console.log(`Gallery: ${galleryBaseUrl}`);
  if (maxPages) console.log(`Page limit: ${maxPages}`);
  console.log(`Delay between requests: ${DELAY_MS}ms\n`);

  const outputDir = ensureOutputDir();
  let progress = loadProgress();

  // First, detect total pages
  await getProjectsFromPage(galleryBaseUrl, 1);
  const pagesToProcess = maxPages ? Math.min(maxPages, counter.totalPages) : counter.totalPages;
  console.log(`Detected ${counter.totalPages} pages total, processing ${pagesToProcess}`);

  // Count total projects
  counter.totalPages = pagesToProcess;
  counter.totalProjects = pagesToProcess * 24; // approximate
  console.log(`Estimated ~${counter.totalProjects} projects\n`);
  counter.processedProjects = progress.completedProjects.length;

  // Process each page
  for (let page = 1; page <= pagesToProcess; page++) {
    console.log(`\n=== Processing Page ${page}/${counter.totalPages} ===`);
    await processFullPage(galleryBaseUrl, page, progress);
  }

  // Deduplicate attendees by devpost_profile
  const seen = new Set();
  const unique = progress.attendees.filter(a => {
    const key = a.devpost_profile;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Write JSON
  const jsonPath = path.join(outputDir, `${eventName}-attendees.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(unique, null, 2));

  // Write CSV
  const csvPath = path.join(outputDir, `${eventName}-attendees.csv`);
  const csvHeader = 'name,github,devpost_profile,project,project_url\n';
  const csvRows = unique.map(a =>
    `"${a.name.replace(/"/g, '""')}","${a.github}","${a.devpost_profile}","${a.project.replace(/"/g, '""')}","${a.project_url}"`
  ).join('\n');
  fs.writeFileSync(csvPath, csvHeader + csvRows);

  // Cleanup progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  console.log(`\n\n=== Done! ===`);
  console.log(`Total unique attendees: ${unique.length}`);
  console.log(`GitHubs found: ${unique.filter(a => a.github).length}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
