#!/usr/bin/env node

/**
 * Generate release notes from Git commits and Linear tasks
 *
 * This script:
 * 1. Fetches commits since the last tag (or between two tags)
 * 2. Extracts Linear task IDs (format: TEAM_ID-TASK_ID, e.g., JS-1234)
 * 3. Fetches task details from Linear API
 * 4. Generates formatted release notes in compact format
 *
 * Tag Types:
 *   - alpha: Tags ending with -alpha (e.g., v0.51.21-alpha)
 *   - beta: Tags ending with -beta (e.g., v0.50.76-beta)
 *   - nightly: Tags ending with -nightly (e.g., v0.51.202512021-nightly)
 *   - public: Semver tags without suffix (e.g., v0.51.2)
 *
 * Usage:
 *   node scripts/generate-release-notes.js [options]
 *
 * Options:
 *   --from <tag>       Start tag/commit (default: auto-detected)
 *   --to <tag>         End tag/commit (default: HEAD)
 *   --output <file>    Output file (default: stdout)
 *   --format <type>    Output format: markdown, json (default: markdown)
 *
 * Default behavior for --from:
 *   - If --to is a specific tag: finds the previous tag of the SAME TYPE
 *     (e.g., alpha->alpha, beta->beta, public->public)
 *   - If --to is HEAD: uses the latest tag
 *
 * Sanity Checks:
 *   - Warns if more than 100 commits found
 *   - Truncates display at 200 commits to keep output manageable
 *
 * Environment Variables:
 *   LINEAR_API_KEY     Linear API key (required)
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

// Configuration
const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_TASK_PATTERN = /\b([A-Z]+-\d+)\b/g;
const MAX_COMMITS_WARNING = 100; // Warn if more than this many commits
const MAX_COMMITS_DISPLAY = 200; // Truncate display if more than this

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		from: null,
		to: 'HEAD',
		output: null,
		format: 'markdown'
	};

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--from':
				options.from = args[++i];
				break;
			case '--to':
				options.to = args[++i];
				break;
			case '--output':
				options.output = args[++i];
				break;
			case '--format':
				options.format = args[++i];
				break;
			case '--help':
			case '-h':
				console.log(`
Generate release notes from Git commits and Linear tasks

Usage: node scripts/generate-release-notes.js [options]

Options:
  --from <tag>       Start tag/commit (default: auto-detected)
  --to <tag>         End tag/commit (default: HEAD)
  --output <file>    Output file (default: stdout)
  --format <type>    Output format: markdown, json (default: markdown)

Tag Types (auto-detected):
  - alpha: Tags ending with -alpha (e.g., v0.51.21-alpha)
  - beta: Tags ending with -beta (e.g., v0.50.76-beta)
  - nightly: Tags ending with -nightly
  - public: Semver tags without suffix (e.g., v0.51.2)

Default behavior for --from:
  - If --to is a specific tag: finds previous tag of SAME TYPE
    (alpha->alpha, beta->beta, public->public)
  - If --to is HEAD: uses the latest tag

Sanity Checks:
  - Warns if >100 commits found (may indicate wrong tag selection)
  - Truncates display at 200 commits for readability

Environment Variables:
  LINEAR_API_KEY     Linear API key (required)

Examples:
  # Generate notes from last tag to HEAD
  LINEAR_API_KEY=your_key node scripts/generate-release-notes.js

  # Generate notes for alpha release (finds previous alpha tag)
  LINEAR_API_KEY=your_key node scripts/generate-release-notes.js --to v0.51.21-alpha

  # Generate notes for beta release (finds previous beta tag)
  LINEAR_API_KEY=your_key node scripts/generate-release-notes.js --to v0.50.76-beta

  # Generate notes between specific tags
  LINEAR_API_KEY=your_key node scripts/generate-release-notes.js --from v0.51.17-alpha --to v0.51.18-alpha

  # Save to file
  LINEAR_API_KEY=your_key node scripts/generate-release-notes.js --output RELEASE_NOTES.md
				`);
				process.exit(0);
		}
	}

	return options;
}

// Get the latest tag if not specified
function getLatestTag() {
	try {
		return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
	} catch (error) {
		console.error('Warning: Could not find any tags. Using all commits.');
		return null;
	}
}

// Extract tag type from a tag (alpha, beta, or public)
function getTagType(tag) {
	if (tag.includes('-alpha')) return 'alpha';
	if (tag.includes('-beta')) return 'beta';
	if (tag.includes('-nightly')) return 'nightly';
	return 'public'; // semver without suffix
}

// Get the previous tag of the same type (the tag before the specified tag)
function getPreviousTag(currentTag) {
	try {
		const currentType = getTagType(currentTag);

		// Get all tags sorted by creation date
		const output = execSync('git tag --sort=-creatordate', { encoding: 'utf-8' }).trim();
		const tags = output.split('\n').filter(tag => tag.trim());

		// Find the index of the current tag
		const currentIndex = tags.indexOf(currentTag);

		if (currentIndex === -1) {
			console.error(`Warning: Current tag ${currentTag} not found in tag list.`);
			return null;
		}

		// Find the next tag of the same type
		for (let i = currentIndex + 1; i < tags.length; i++) {
			if (getTagType(tags[i]) === currentType) {
				return tags[i];
			}
		}

		console.error(`Warning: No previous ${currentType} tag found before ${currentTag}.`);
		return null;
	} catch (error) {
		console.error('Warning: Could not find previous tag:', error.message);
		return null;
	}
}

// Get commits between two refs
function getCommits(from, to) {
	try {
		const range = from ? `${from}..${to}` : to;
		const output = execSync(`git log ${range} --pretty=format:"%H|%s|%an|%ae|%ad" --date=iso`, {
			encoding: 'utf-8'
		});

		if (!output.trim()) {
			return [];
		}

		return output.trim().split('\n').map(line => {
			const [hash, subject, author, email, date] = line.split('|');
			return { hash, subject, author, email, date };
		});
	} catch (error) {
		console.error('Error getting commits:', error.message);
		process.exit(1);
	}
}

// Extract Linear task IDs from commit messages
function extractLinearIds(commits) {
	const idSet = new Set();
	const commitsByTaskId = {};

	commits.forEach(commit => {
		const matches = commit.subject.matchAll(LINEAR_TASK_PATTERN);
		for (const match of matches) {
			const taskId = match[1];
			idSet.add(taskId);

			if (!commitsByTaskId[taskId]) {
				commitsByTaskId[taskId] = [];
			}
			commitsByTaskId[taskId].push(commit);
		}
	});

	return { ids: Array.from(idSet), commitsByTaskId };
}

// Fetch task details from Linear API
async function fetchLinearTasks(taskIds, apiKey) {
	if (taskIds.length === 0) {
		return [];
	}

	// Query each issue individually since Linear API doesn't support filtering by identifier
	const query = `
		query($id: String!) {
			issue(id: $id) {
				id
				identifier
				title
				description
				state {
					name
					type
				}
				priority
				team {
					name
					key
				}
				assignee {
					name
				}
				labels {
					nodes {
						name
					}
				}
			}
		}
	`;

	const tasks = [];
	const errors = [];

	// Fetch issues one by one
	for (const taskId of taskIds) {
		try {
			const task = await fetchSingleIssue(query, taskId, apiKey);
			if (task) {
				tasks.push(task);
			}
		} catch (error) {
			// Log error but continue with other tasks
			errors.push({ taskId, error: error.message });
			console.error(`Warning: Failed to fetch ${taskId}: ${error.message}`);
		}
	}

	if (errors.length > 0 && errors.length === taskIds.length) {
		throw new Error(`Failed to fetch any Linear tasks. Errors: ${JSON.stringify(errors)}`);
	}

	return tasks;
}

// Helper function to fetch a single issue
function fetchSingleIssue(query, taskId, apiKey) {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify({
			query,
			variables: { id: taskId }
		});

		const options = {
			hostname: 'api.linear.app',
			port: 443,
			path: '/graphql',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': apiKey,
				'Content-Length': data.length
			}
		};

		const req = https.request(options, (res) => {
			let body = '';

			res.on('data', (chunk) => {
				body += chunk;
			});

			res.on('end', () => {
				if (res.statusCode !== 200) {
					reject(new Error(`Linear API error: ${res.statusCode} ${body}`));
					return;
				}

				try {
					const response = JSON.parse(body);
					if (response.errors) {
						reject(new Error(`Linear API errors: ${JSON.stringify(response.errors)}`));
						return;
					}
					resolve(response.data.issue);
				} catch (error) {
					reject(new Error(`Failed to parse Linear API response: ${error.message}`));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.write(data);
		req.end();
	});
}

// Format release notes as Markdown
function formatAsMarkdown(tasks, commitsByTaskId, commitsWithoutTasks, fromTag, toTag) {
	let output = '';

	// Header
	const title = toTag === 'HEAD' ? 'Unreleased Changes' : toTag;
	output += `# Release Notes: ${title}\n\n`;

	if (fromTag) {
		const fromType = getTagType(fromTag);
		const toType = getTagType(toTag);
		output += `Changes from ${fromTag} to ${toTag}`;
		if (fromType === toType && fromType !== 'public') {
			output += ` (${fromType} track)`;
		}
		output += `\n\n`;
	}

	// Show total stats compactly
	const totalCommits = tasks.reduce((sum, task) => {
		return sum + (commitsByTaskId[task.identifier]?.length || 0);
	}, 0) + commitsWithoutTasks.length;

	output += `**Summary:** ${tasks.length} tasks, ${totalCommits} commits\n\n`;

	// Group tasks by priority
	const tasksByPriority = {
		urgent: [],
		high: [],
		medium: [],
		low: [],
		none: []
	};

	tasks.forEach(task => {
		const priority = (task.priority || 0);
		let priorityKey = 'none';
		if (priority === 1) priorityKey = 'urgent';
		else if (priority === 2) priorityKey = 'high';
		else if (priority === 3) priorityKey = 'medium';
		else if (priority === 4) priorityKey = 'low';

		tasksByPriority[priorityKey].push(task);
	});

	// Output tasks in compact format
	const priorityOrder = ['urgent', 'high', 'medium', 'low', 'none'];
	const priorityLabels = {
		urgent: 'Urgent',
		high: 'High Priority',
		medium: 'Medium Priority',
		low: 'Low Priority',
		none: 'Other Changes'
	};

	let hasAnyTasks = false;
	let displayedCommits = 0;

	priorityOrder.forEach(priority => {
		const priorityTasks = tasksByPriority[priority];
		if (priorityTasks.length === 0) return;

		hasAnyTasks = true;
		output += `## ${priorityLabels[priority]}\n\n`;

		priorityTasks.forEach(task => {
			// Compact format: just list the task
			output += `- **${task.identifier}**: ${task.title}`;

			// Show commit count if there are multiple commits for this task
			const commits = commitsByTaskId[task.identifier] || [];
			if (commits.length > 1) {
				output += ` (${commits.length} commits)`;
			}
			output += '\n';

			displayedCommits += commits.length;
		});
		output += '\n';
	});

	// Add commits without Linear task IDs (limit display)
	if (commitsWithoutTasks.length > 0) {
		output += `## Other Commits\n\n`;

		const remaining = MAX_COMMITS_DISPLAY - displayedCommits;
		const commitsToShow = commitsWithoutTasks.slice(0, Math.max(remaining, 20));
		const truncated = commitsWithoutTasks.length > commitsToShow.length;

		commitsToShow.forEach(commit => {
			output += `- \`${commit.hash.substring(0, 7)}\` ${commit.subject}\n`;
		});

		if (truncated) {
			output += `\n_... and ${commitsWithoutTasks.length - commitsToShow.length} more commits_\n`;
		}
		output += '\n';
	}

	if (!hasAnyTasks && commitsWithoutTasks.length === 0) {
		output += 'No changes in this release.\n';
	}

	return output;
}

// Format release notes as JSON
function formatAsJSON(tasks, commitsByTaskId, commitsWithoutTasks, fromTag, toTag) {
	return JSON.stringify({
		version: toTag,
		from: fromTag,
		generatedAt: new Date().toISOString(),
		tasks: tasks.map(task => ({
			id: task.identifier,
			title: task.title,
			description: task.description,
			state: task.state?.name,
			priority: task.priority,
			team: task.team?.name,
			assignee: task.assignee?.name,
			labels: task.labels?.nodes.map(l => l.name) || [],
			commits: (commitsByTaskId[task.identifier] || []).map(c => ({
				hash: c.hash,
				subject: c.subject,
				author: c.author,
				date: c.date
			}))
		})),
		otherCommits: commitsWithoutTasks.map(c => ({
			hash: c.hash,
			subject: c.subject,
			author: c.author,
			date: c.date
		}))
	}, null, 2);
}

// Main function
async function main() {
	const options = parseArgs();

	// Check for API key
	const apiKey = process.env.LINEAR_API_KEY;
	if (!apiKey) {
		console.error('Error: LINEAR_API_KEY environment variable is required');
		console.error('Get your API key from: https://linear.app/settings/api');
		process.exit(1);
	}

	// Determine tag range
	if (!options.from) {
		// If 'to' is a specific tag (not HEAD), get the previous tag
		if (options.to !== 'HEAD') {
			options.from = getPreviousTag(options.to);
		} else {
			// If 'to' is HEAD, get the latest tag
			options.from = getLatestTag();
		}
	}

	console.error(`Generating release notes from ${options.from || 'beginning'} to ${options.to}...`);

	// Get commits
	const commits = getCommits(options.from, options.to);
	console.error(`Found ${commits.length} commits`);

	// Sanity checks
	if (commits.length > MAX_COMMITS_WARNING) {
		console.error(`Warning: Found ${commits.length} commits, which is unusually high.`);
		console.error(`This may indicate a large gap between releases or incorrect tag selection.`);
		if (options.from && options.to !== 'HEAD') {
			const fromType = getTagType(options.from);
			const toType = getTagType(options.to);
			console.error(`Tag types: from=${fromType}, to=${toType}`);
		}
	}

	if (commits.length > MAX_COMMITS_DISPLAY) {
		console.error(`Warning: Truncating display to ${MAX_COMMITS_DISPLAY} most recent commits.`);
	}

	// Extract Linear IDs
	const { ids, commitsByTaskId } = extractLinearIds(commits);
	console.error(`Found ${ids.length} unique Linear task IDs`);

	// Get commits without task IDs
	const commitsWithoutTasks = commits.filter(commit => {
		return !commit.subject.match(LINEAR_TASK_PATTERN);
	});

	// Fetch task details from Linear
	let tasks = [];
	if (ids.length > 0) {
		console.error('Fetching task details from Linear...');
		try {
			tasks = await fetchLinearTasks(ids, apiKey);
			console.error(`Fetched details for ${tasks.length} tasks`);
		} catch (error) {
			console.error(`Error fetching from Linear: ${error.message}`);
			process.exit(1);
		}
	}

	// Generate release notes
	let output;
	if (options.format === 'json') {
		output = formatAsJSON(tasks, commitsByTaskId, commitsWithoutTasks, options.from, options.to);
	} else {
		output = formatAsMarkdown(tasks, commitsByTaskId, commitsWithoutTasks, options.from, options.to);
	}

	// Write output
	if (options.output) {
		fs.writeFileSync(options.output, output);
		console.error(`Release notes written to ${options.output}`);
	} else {
		console.log(output);
	}
}

// Run
main().catch(error => {
	console.error('Fatal error:', error);
	process.exit(1);
});
