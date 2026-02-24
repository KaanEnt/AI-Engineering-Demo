---
name: devpost-scraper
version: 1.0.0
description: Scrape Devpost hackathon project galleries to extract attendee profiles and GitHub links. Processes each gallery page, visits each project post, gets team members, then fetches their GitHub from their Devpost profiles.
user_invocable: true
trigger_phrases:
  - scrape devpost
  - get devpost attendees
  - devpost profiles
  - hackathon attendees
  - devpost github
arguments:
  - name: gallery_url
    description: "The Devpost project gallery URL (e.g., https://hackthenorth2025.devpost.com/project-gallery)"
    required: true
---

# Devpost Scraper

Scrapes Devpost hackathon project galleries to extract all attendee names and their GitHub profiles.

## How It Works

The script processes in this order:

1. **Get the full page of projects** - fetches a gallery page and extracts all project URLs
2. **Get each project post** - visits the project page, extracts title and team member Devpost profile links
3. **Get each member's GitHub** - visits their Devpost profile and pulls the GitHub URL

A live counter tracks progress: `[Page X/Y] Projects: N/Total | Members: N | GitHubs: N`

## Usage

Run the scraper with a gallery URL:

```bash
node scripts/devpost-scraper.js <gallery-url>
```

Example:

```bash
node scripts/devpost-scraper.js https://hackthenorth2025.devpost.com/project-gallery
```

## Output

Results are saved to `output/devpost/`:

- **JSON**: `output/devpost/<event-name>-attendees.json`
- **CSV**: `output/devpost/<event-name>-attendees.csv`

### JSON format

```json
[
  {
    "name": "Jason Liu",
    "github": "https://github.com/pekachoo",
    "devpost_profile": "https://devpost.com/pekachoo",
    "project": "DUM-E",
    "project_url": "https://devpost.com/software/dum-e-kgx6at"
  }
]
```

### CSV columns

`name, github, devpost_profile, project, project_url`

## Resume Support

If interrupted, the script saves progress to `output/devpost/.progress.json`. Re-running the same command will skip already-processed projects and resume where it left off.

## Rate Limiting

The script waits 800ms between requests to avoid being blocked by Devpost. For ~261 projects with ~4 members each, expect the full run to take a while. The counter shows real-time progress.

## Instructions for Claude

When the user asks to scrape a Devpost event:

1. Confirm the gallery URL with the user
2. Run: `node scripts/devpost-scraper.js <url>`
3. Monitor the output counter for progress
4. When done, report the totals (attendees found, GitHubs found)
5. Offer to filter or transform the output (e.g., only people with GitHubs, group by project, etc.)
