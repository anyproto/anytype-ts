import { Block, Helpers } from './common';

// TODO: add screenshots (57/N.png on the help CDN) to the feature sections once available.
export default (h: Helpers): Block[] => {
	const { cmd, shift, hl, icon, title, h2, h4, text, bullet, toggle, link } = h;
	return [
		icon('🔍'),

		title(`Search Everything`),
		h4(`<span>Release 0.57.0</span>`),
		text(``),
		text(`Search now works across every space from one panel, opened with a single shortcut. Find objects, channels, people and chat messages, and filter the results as you type. AnyBlock v2 and API v2 give you new ways to move content in and out and build on Anytype. You can limit which spaces an integration can reach, and keep it read-only. We've reworked import and rebuilt copying and pasting. Downloads show their progress, and sync recovers from bad networks on its own.`),
		text(``),

		h2(`Search Across Every Space`),
		text(`Press ${hl(`${cmd}+${shift}+Space`)} to open quick search from anywhere, even when Anytype is minimized. The panel searches objects, channels and people across all your spaces at once. For the first time, it also searches the contents of your chat messages.`),
		text(`If you can't remember where a message was sent, you can search every chat in a space or all your spaces at once. You can also search within a single conversation.`),
		text(`Type ${hl('/')} in the search field to filter what comes back: by author, by space or channel, or by kind of object.`),
		text(``),

		h2(`AnyBlock v2 and API v2`),
		text(`AnyBlock v2 introduces a simpler, human-readable format for Anytype data, designed to be easier for both people and AI agents to understand while remaining suitable for export, import, and backup. API v2 builds on this format with clearer schemas, structured error hints, and more complete access to Anytype objects and spaces.`),
		text(`Together, they make integrations more efficient, reduce unnecessary model iterations, and create a stronger foundation for future local AI experiences on user devices.`),
		text(`${link('https://community.anytype.io/t/anyblock-v2-and-api-v2-less-guessing-more-creating/31269', 'Read more about AnyBlock v2 and API v2')} in the community.`),
		text(``),

		h2(`Limit What Integrations Can Reach`),
		text(`You can now limit which spaces an integration can reach, and give it read-only access instead of read and write.`),
		text(`We've also hardened the local API that Anytype and its background process use to talk to each other. Thanks to @${link('https://github.com/alicangnll', 'Ali Can Gönüllü')} for pointing out where it could be stronger!`),
		text(``),

		h2(`Import, Reworked`),
		text(`We've rebuilt import from Notion and other tools. Data formats are handled more reliably, long imports no longer fail partway through, and the steps are simpler to follow.`),
		text(`You can optionally let AI suggest Types and Properties as you import, so your content arrives structured the Anytype way instead of as plain pages. Only the names of your databases, folders and properties are sent, never the text inside your pages, and you can run it on your own device so nothing leaves your machine.`),
		text(``),

		h2(`Downloads You Can Watch`),
		text(`Downloads now show their progress in the sidebar, next to imports and exports, and you can cancel them. A file you already have isn't fetched again. Files your system can display open directly, while archives, installers and scripts are shown in your file manager instead of being run.`),
		text(``),

		h2(`Copy and Paste That Keeps Its Shape`),
		text(`Copying a selection that spans several blocks now keeps them in the right order, and what you paste keeps its shape: styles, checked state, nested children, a code block's language, a callout's icon. Copied code stays code in other apps, and links inside quotes survive a Markdown export.`),
		text(``),

		h2(`Sync That Recovers on Its Own`),
		text(`Waking from sleep, switching Wi-Fi or dropping a VPN no longer leaves Anytype waiting for a timeout: it notices and reconnects. If a connection is throttled, it switches transport so sync keeps going. Self-hosted and local-network setups gain the most, and devices on the same network can now give each other a first sync.`),
		text(`The new ${hl('Prefer TCP')} setting on the login screen is there for restricted networks, where the faster transport is blocked or interfered with.`),
		text(``),

		h2(`A Clearer Start-up`),
		text(`When you set up a device or recover an account, Anytype now shows what it's doing as it downloads your account. This replaces the three animated dots. Your account becomes available as soon as it's ready, so logging in no longer repeats the start-up work several times.`),
		text(`Two Anytype processes can no longer open the same account at once. This prevents failures caused by launching the app twice.`),
		text(``),

		h2(`Removal History`),
		text(`Channels now keep a removal history. Open it to see deleted objects, who removed them and when.`),
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

		toggle(`<b>Miscellaneous (6)</b>`, [
			bullet(`Keyboard shortcuts containing ${hl('Space')} now work after recording.`),
			bullet(`Mention and picker searches no longer do unnecessary work for results they don't display.`),
			bullet(`Opening an object in a shared space no longer hangs indefinitely.`),
			bullet(`Quitting Anytype no longer leaves a background process running.`),
			bullet(`On Windows, log files are written again and a busy port no longer stops the app from starting.`),
			bullet(`A member that never went through a space's approval no longer appears as a nameless join request, where Approve and Decline did nothing. Thanks to @${link('https://github.com/anyproto/anytype-ts/pull/2384', 'nrydanov')}!`),
		]),
	];
};
