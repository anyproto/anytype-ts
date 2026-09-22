import { Block, Helpers } from './common';

// TODO: add screenshots (57/N.png on the help CDN) to the feature sections once available.
export default (h: Helpers): Block[] => {
	const { cmd, shift, hl, icon, title, h2, h4, text, bullet, toggle, link } = h;
	return [
		icon('🔍'),

		title(`Search Everything`),
		h4(`<span>Release 0.57.0</span>`),
		text(``),
		text(`Search is the headline of this release. One shortcut now opens a panel that looks across every space you're in – objects, channels, people and chat messages – with filter tokens to narrow it down as you type. Alongside it: AnyBlock v2 and API v2 for moving content in and out and for building on top of Anytype, an approval prompt for any app that wants to connect on your machine, a reworked import, and downloads you can finally watch. Underneath, copy and paste has been rebuilt and sync now recovers from bad networks on its own.`),
		text(``),

		h2(`Search Across Every Space`),
		text(`Press ${hl(`${cmd}+${shift}+Space`)} anywhere – even with no space open – and a quick search panel appears. It searches across all of your spaces at once: objects, channels, people and, for the first time, the contents of your chat messages.`),
		text(`Chat search works at three levels. Inside one conversation, across every chat in a space, or across every space at once – so a half-remembered message is findable even when you can't recall where it was said.`),
		text(`Type filter tokens straight into the input to narrow things down: ${hl('/by')} to search by who wrote it, ${hl('/in')} to limit it to a space or channel, and ${hl('/is')} to limit it to a kind of object. Suggestions adapt as you type, and matching people are grouped so the same person never appears twice. One-to-one conversations show up as their own rows, with a clear action for opening the chat versus opening the person.`),
		text(``),

		h2(`AnyBlock v2 and API v2`),
		text(`A new export format, marked ${hl('Preview')}, writes your objects as AnyBlock JSON – a readable format that round-trips, built for moving content between tools and for handing to scripts and AI agents. Import understands it too, so a bundle can go out and come back with its tables, dataviews and inline formatting intact. Exports now end with a report of what was written and what was skipped.`),
		text(`The same work brings API v2, a reworked interface for anything built on top of Anytype: creating and editing objects, starting them from templates, reading and writing object discussions, and managing sidebar widgets. Operations describe their own schemas and report back what actually happened, warnings included.`),
		text(``),

		h2(`Approve Apps That Connect to Anytype`),
		text(`Anything that wants to pair with Anytype on your computer – an integration, a script, an editor plugin – now has to ask. A prompt shows you who is asking and which spaces they want, and nothing is issued until you approve it. You grant access per space rather than all at once, and a request you ignore expires on its own.`),
		text(`On top of its existing auth token, the link between Anytype and its background process is now additionally keyed by a secret generated fresh at every launch and passed privately, so nothing else on your machine can reach it. Thanks to @${link('https://github.com/alicangnll', 'Ali Can Gönüllü')} for highlighting where this flow could be hardened!`),
		text(``),

		h2(`Import, Reworked`),
		text(`Importing from Notion and other tools has been rebuilt. Long imports no longer break partway through, files come across reliably, pages that used to be skipped now arrive, and Select properties stay Select instead of turning into Multi-Select. Imported objects keep their names even when they arrive before their type does.`),
		text(`The import screen itself is clearer, with a guide for finding your Notion token, a way back to the format list, and – if you use AI-assisted import – a dropdown for choosing your provider, with an explicit note about where your data goes.`),
		text(``),

		h2(`Downloads You Can Watch`),
		text(`Downloading a file now shows its progress in the sidebar, alongside imports and exports, with a row you can cancel and a per-file breakdown on hover. When you download something you already have, Anytype recognises the copy on disk and skips the transfer entirely.`),
		text(`Opening a file is smarter as well. Files the system can display are opened directly, while archives, installers and scripts are revealed in your file manager instead of being run – and opening the same file twice no longer leaves a second copy behind. Images that were saved at an older size now download correctly.`),
		text(``),

		h2(`Copy and Paste That Keeps Its Shape`),
		text(`Selecting text across multiple blocks arrived last release, and this one makes it hold together. Copying and pasting across blocks now preserves the order of what you selected, and pasting into an empty or styled block keeps the first pasted block's style, its checked state and its children instead of quietly dropping them.`),
		text(`Code and quotes travel properly too. A pasted code block keeps its language, a callout keeps its icon, copied code stays code when pasted into other apps, and links inside quotes survive a Markdown export. Indenting a selection that spans several list items works again, and ${hl('Tab')} on the first item no longer sends it to the bottom of the list.`),
		text(``),

		h2(`Sync That Recovers on Its Own`),
		text(`Anytype now notices when the network or your device changes – waking from sleep, switching Wi-Fi, losing a VPN – and re-establishes connections proactively instead of waiting for the next attempt to time out.`),
		text(`Connections are also more stubborn on hostile networks. When a connection is being throttled or interfered with, Anytype automatically falls back to a different transport rather than stalling, and a new ${hl('Prefer TCP')} setting on the login screen lets you choose that route up front if your network is known to block the faster one. Self-hosted and local-network setups benefit most: address lookups no longer give up early, dead ports no longer hold up a connection, and devices on the same network can now serve each other a first sync.`),
		text(``),

		h2(`A Clearer Start-up`),
		text(`Setting up a device or recovering an account no longer sits behind three animated dots. Anytype now reports what it is actually doing while your account comes down – and because the account is returned as soon as it's ready, logging in no longer repeats its own start-up work several times over.`),
		text(`Opening the same account from two Anytype processes at once is now prevented outright, which removes a class of confusing failures on machines where the app was launched twice.`),
		text(``),

		h2(`Removal History`),
		text(`Channels now keep a record of what was removed, by whom and when. Open it to see the objects and messages that were deleted from a channel, so a surprise disappearance has an answer instead of a shrug.`),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Reset a Forgotten PIN</b>`),
		text(`Forgetting your PIN no longer locks you out. The lock screen now offers a reset using your recovery phrase, and logging out clears the PIN so the next person to sign in isn't stopped by it. Thanks to @${link('https://community.anytype.io/t/31144', 'jolt')}!`),
		text(``),

		text(`<b>See Where a File Came From</b>`),
		text(`Media and bookmark objects now show the object they were created in, so you can jump straight back to the page an image or link belongs to instead of hunting for it.`),
		text(``),

		text(`<b>One Home Widget</b>`),
		text(`The Home widget and its pinned widget have been merged into a single entry in the sidebar, removing a duplicate that served no purpose.`),
		text(``),

		text(`<b>Create a Channel Without Scrolling</b>`),
		text(`When your channel list is short, ${hl('Create Channel')} now appears inline right under the last channel instead of only in the menu.`),
		text(``),

		text(`<b>Quieter Grid Scrollbars</b>`),
		text(`The horizontal scrollbar in grid views now hides itself when unused on macOS, matching how scrollbars behave everywhere else on the system.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Editor & Blocks (6)</b>`, [
			bullet(`Changing a text colour twice in the same selection now applies the second change.`),
			bullet(`${hl('Backspace')} now lands on the right character in code blocks containing pasted invisible characters. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/2196', 'Toseef-Ahmad')}!`),
			bullet(`Indenting with ${hl('Tab')} works again when the selection spans several list items. Thanks to @${link('https://community.anytype.io/t/31094', 'geesecross')}!`),
			bullet(`${hl('Tab')} on the first item in a list no longer moves it to the end.`),
			bullet(`The table of contents now highlights the heading you clicked rather than its neighbour.`),
			bullet(`A broken image now offers a way to open or download the underlying file instead of being a dead placeholder.`),
		]),

		toggle(`<b>Chat & Messaging (2)</b>`, [
			bullet(`Pasted text no longer turns ordinary words into links just because they contain a dot.`),
			bullet(`Pasting over a link no longer leaves the link attached to whatever word replaced it.`),
		]),

		toggle(`<b>Objects & Views (5)</b>`, [
			bullet(`Opening the filter menu on an inline collection no longer crashes the app. Thanks to @${link('https://community.anytype.io/t/31079', 'Shoon')}!`),
			bullet(`The parameter menu for an empty Query now opens next to what you clicked instead of the top-left corner. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/2277', 'amkhlv')}!`),
			bullet(`Text properties in an object header now open an editor when clicked. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/2278', 'TheLastEnvoy')}!`),
			bullet(`Date properties shown as a line in the header now let you set the time. Thanks to @${link('https://community.anytype.io/t/31104', 'mariusgerome')}!`),
			bullet(`Changing the property a Query filters on no longer resets that view's settings, and Queries no longer drop objects with empty values or lose their tag and status options.`),
		]),

		toggle(`<b>Widgets & Sidebar (2)</b>`, [
			bullet(`The calendar widget's month and year dropdown no longer opens behind the sidebar.`),
			bullet(`The sidebar toggles are back on the empty object screen when both side panels are collapsed.`),
		]),

		toggle(`<b>Navigation & Window Management (2)</b>`, [
			bullet(`Choosing ${hl('Open as Object')} from an image preview now closes the preview instead of opening the object behind it.`),
			bullet(`The global search panel keeps the app in the Dock and the menu bar, offers the Messages filter, and reopens correctly when summoned again straight away.`),
		]),

		toggle(`<b>Miscellaneous (5)</b>`, [
			bullet(`Recording a keyboard shortcut that contains ${hl('Space')} no longer silently breaks it.`),
			bullet(`Mention and picker searches no longer do extra work they never display.`),
			bullet(`Opening an object in a shared space no longer hangs indefinitely.`),
			bullet(`Quitting Anytype no longer leaves a background process running.`),
			bullet(`On Windows, log files are written again and a busy port no longer stops the app from starting.`),
		]),
	];
};
