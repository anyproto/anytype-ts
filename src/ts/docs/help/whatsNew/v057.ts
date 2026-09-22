import { Block, Helpers } from './common';

// TODO: add screenshots (57/N.png on the help CDN) to the feature sections once available.
export default (h: Helpers): Block[] => {
	const { cmd, shift, hl, icon, title, h2, h4, text, bullet, toggle, link } = h;
	return [
		icon('🔍'),

		title(`Search Everything`),
		h4(`<span>Release 0.57.0</span>`),
		text(``),
		text(`Search now works across every space from one panel, opened with a single shortcut. Find objects, channels, people and chat messages, and narrow the results with filter tokens as you type. AnyBlock v2 and API v2 give you new ways to move content in and out and build on Anytype. Apps that connect to Anytype on your computer now need your approval. We've reworked import and rebuilt copying and pasting. Downloads show their progress, and sync recovers from bad networks on its own.`),
		text(``),

		h2(`Search Across Every Space`),
		text(`Press ${hl(`${cmd}+${shift}+Space`)} to open quick search from anywhere, even when no space is open. The panel searches objects, channels and people across all your spaces at once. For the first time, it also searches the contents of your chat messages.`),
		text(`If you can't remember where a message was sent, you can search every chat in a space or all your spaces at once. You can also search within a single conversation.`),
		text(`Type filter tokens into the search field to narrow the results. Use ${hl('/by')} to search by author and ${hl('/in')} to limit the search to a space or channel. ${hl('/is')} filters by kind of object. Suggestions update as you type, and matching people are grouped so each person appears only once. One-to-one conversations have their own rows, with separate actions to open the chat or the person.`),
		text(``),

		h2(`AnyBlock v2 and API v2`),
		text(`You can now export objects as AnyBlock JSON. The new format is marked ${hl('Preview')}. It's a readable format for moving content between tools or passing to scripts and AI agents. You can import a bundle back into Anytype without losing its tables, dataviews or inline formatting. Each export now ends with a report showing what was written and what was skipped.`),
		text(`API v2 reworks the interface for tools built on Anytype. It lets you create and edit objects, including starting from templates. You can also read and write object discussions and manage sidebar widgets. Each operation describes its schema and reports what happened, including any warnings.`),
		text(``),

		h2(`Approve Apps That Connect to Anytype`),
		text(`Apps now need your approval to pair with Anytype on your computer. This also applies to scripts and editor plugins. The prompt shows which app or integration is asking and which spaces it wants to access. You approve access for each space, and nothing is issued before you agree. Unanswered requests expire automatically.`),
		text(`The connection between Anytype and its background process now requires a secret generated at each launch, as well as the existing auth token. The secret is passed privately so other processes on your computer can't access the connection. Thanks to @${link('https://github.com/alicangnll', 'Ali Can Gönüllü')} for pointing out where this flow could be hardened!`),
		text(``),

		h2(`Import, Reworked`),
		text(`We've rebuilt import from Notion and other tools. Long imports no longer fail partway through. Files import reliably, and pages that used to be skipped are now included. Select properties no longer turn into Multi-Select, and imported objects keep their names even if they arrive before their type.`),
		text(`The import screen now includes a guide to finding your Notion token and a way to return to the format list. For AI-assisted import, you can choose your provider from a dropdown and see where your data will be sent.`),
		text(``),

		h2(`Downloads You Can Watch`),
		text(`Downloads now appear alongside imports and exports in the sidebar. Each row shows progress and lets you cancel the download. Hover over it for a per-file breakdown. If the file is already on disk, Anytype recognises it and skips the transfer.`),
		text(`Files your system can display now open directly. Archives, installers and scripts are shown in your file manager without being run. Opening the same file twice no longer creates a second copy. Images saved at an older size now download correctly too.`),
		text(``),

		h2(`Copy and Paste That Keeps Its Shape`),
		text(`Last release added text selection across multiple blocks. Copying and pasting that selection now keeps the blocks in the right order. When you paste into an empty or styled block, the first pasted block keeps its style and checked state, along with its children.`),
		text(`Pasted code blocks keep their language, and callouts keep their icons. Copied code stays code when pasted into other apps. Links inside quotes are preserved in Markdown exports. You can indent a selection across several list items again, and ${hl('Tab')} on the first item no longer moves it to the bottom of the list.`),
		text(``),

		h2(`Sync That Recovers on Its Own`),
		text(`Anytype now detects changes to your network or device and reconnects without waiting for the next connection attempt to time out. This includes waking from sleep or switching Wi-Fi, as well as losing a VPN connection.`),
		text(`If a connection is throttled or interfered with, Anytype automatically switches to another transport so sync can continue. The new ${hl('Prefer TCP')} setting on the login screen lets you choose TCP from the start if your network blocks the faster transport. Self-hosted and local-network setups benefit most from these changes. Address lookups no longer stop too early, and dead ports no longer delay connections. Devices on the same network can now provide each other's first sync.`),
		text(``),

		h2(`A Clearer Start-up`),
		text(`When you set up a device or recover an account, Anytype now shows what it's doing as it downloads your account. This replaces the three animated dots. Your account becomes available as soon as it's ready, so logging in no longer repeats the start-up work several times.`),
		text(`Two Anytype processes can no longer open the same account at once. This prevents failures caused by launching the app twice.`),
		text(``),

		h2(`Removal History`),
		text(`Channels now keep a removal history. Open it to see deleted objects and messages, who removed them and when.`),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Reset a Forgotten PIN</b>`),
		text(`You can now reset a forgotten PIN from the lock screen using your recovery phrase. Logging out also clears the PIN, so it won't block the next person who signs in. Thanks to @${link('https://community.anytype.io/t/31144', 'jolt')}!`),
		text(``),

		text(`<b>See Where a File Came From</b>`),
		text(`Media and bookmark objects now show which object they were created in. You can jump straight back to the page an image or link belongs to.`),
		text(``),

		text(`<b>One Home Widget</b>`),
		text(`The Home widget and its pinned widget now share a single sidebar entry.`),
		text(``),

		text(`<b>Create a Channel Without Scrolling</b>`),
		text(`When your channel list is short, ${hl('Create Channel')} now appears right below the last channel. It's still available in the menu.`),
		text(``),

		text(`<b>Quieter Grid Scrollbars</b>`),
		text(`On macOS, the horizontal scrollbar in grid views now hides when you're not using it, like other system scrollbars.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Editor & Blocks (6)</b>`, [
			bullet(`Changing a text colour twice in the same selection now applies the second change.`),
			bullet(`${hl('Backspace')} now lands on the right character in code blocks containing pasted invisible characters. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/2196', 'Toseef-Ahmad')}!`),
			bullet(`Indenting with ${hl('Tab')} works again when the selection spans several list items. Thanks to @${link('https://community.anytype.io/t/31094', 'geesecross')}!`),
			bullet(`${hl('Tab')} on the first item in a list no longer moves it to the end.`),
			bullet(`The table of contents now highlights the heading you clicked rather than its neighbour.`),
			bullet(`Broken image placeholders now let you open or download the underlying file.`),
		]),

		toggle(`<b>Chat & Messaging (2)</b>`, [
			bullet(`Pasting ordinary words that contain a dot no longer turns them into links.`),
			bullet(`Pasting over a link no longer leaves the replacement text linked.`),
		]),

		toggle(`<b>Objects & Views (5)</b>`, [
			bullet(`Opening the filter menu on an inline collection no longer crashes the app. Thanks to @${link('https://community.anytype.io/t/31079', 'Shoon')}!`),
			bullet(`The parameter menu for an empty Query now opens next to what you clicked instead of the top-left corner. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/2277', 'amkhlv')}!`),
			bullet(`Text properties in an object header now open an editor when clicked. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/2278', 'TheLastEnvoy')}!`),
			bullet(`Date properties shown as a line in the header now let you set the time. Thanks to @${link('https://community.anytype.io/t/31104', 'mariusgerome')}!`),
			bullet(`Changing the property a Query filters on now keeps the view's settings. Queries also keep objects with empty values and no longer lose tag and status options.`),
		]),

		toggle(`<b>Widgets & Sidebar (2)</b>`, [
			bullet(`The calendar widget's month and year dropdown no longer opens behind the sidebar.`),
			bullet(`The sidebar toggles are back on the empty object screen when both side panels are collapsed.`),
		]),

		toggle(`<b>Navigation & Window Management (2)</b>`, [
			bullet(`Choosing ${hl('Open as Object')} from an image preview now closes the preview instead of opening the object behind it.`),
			bullet(`The app stays in the Dock and menu bar while global search is open. The panel now includes the Messages filter and reopens correctly if you open it again straight away.`),
		]),

		toggle(`<b>Miscellaneous (5)</b>`, [
			bullet(`Keyboard shortcuts containing ${hl('Space')} now work after recording.`),
			bullet(`Mention and picker searches no longer do unnecessary work for results they don't display.`),
			bullet(`Opening an object in a shared space no longer hangs indefinitely.`),
			bullet(`Quitting Anytype no longer leaves a background process running.`),
			bullet(`On Windows, log files are written again and a busy port no longer stops the app from starting.`),
		]),
	];
};
