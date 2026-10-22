import { Block, Helpers } from './common';

// TODO: add screenshots (56/N.png on the help CDN) to the feature sections once available.
export default (h: Helpers): Block[] => {
	const { cmd, shift, hl, icon, title, h2, h4, text, bullet, toggle, link } = h;
	return [
		icon('⏩'),

		title(`Fast Forward`),
		h4(`<span>Release 0.56.0</span>`),
		text(``),
		text(`This release is all about speed and polish. Chat is dramatically faster – big conversations open much quicker and scroll smoothly no matter how long they get – and the whole app starts faster and stays lighter on memory and battery, especially if you have many spaces. On top of that: real code blocks in chat, reworked invites with a new Admin role, and Bin cleanup suggestions that help you tidy up leftover objects.`),
		text(``),

		h2(`A Faster, Smoother Chat`),
		text(`Chat received a major performance overhaul. Long conversations now open much faster – especially big chats – and scrolling stays smooth even in very long threads. Messages load seamlessly as you scroll up or down, without the view jumping around or snapping to the bottom.`),
		text(`Under the hood we also fixed a range of timing issues, so read counters, sync status, live messages, and file uploads stay accurate even when a lot is happening at once.`),
		text(``),

		h2(`A Faster, Lighter App`),
		text(`Anytype starts up much faster and uses less memory and CPU. Spaces, chats, and members now load on demand instead of all at once – so the more spaces you have, the bigger the difference. The app keeps less in memory, no longer opens every chat at launch, and sends fewer internal updates, which means less heat and better battery life. Search is quicker, large Objects open faster, and leaving a space now frees up its storage.`),
		text(`Opening an Object is instant too, with no flash on open and your scroll position restored right where you left off.`),
		text(``),

		h2(`Code Blocks in Chat`),
		text(`You can now write multi-line code blocks directly in chat messages. Wrap your code in triple backticks in the message box and it sends as a proper code block – with syntax highlighting and a language label – matching the way code looks in Object discussions. Great for sharing snippets, logs, or commands with your team.`),
		text(``),

		h2(`Reworked Invites & the New Admin Role`),
		text(`The way you invite people and manage members has been reworked. Invite links are now held by the Space owner, and joining defaults to request-to-join, so owners decide who comes in. There's also a new Admin role: owners can now share management of people and content with trusted members, while invite links stay with the owner. The Members section got a cleaner, clearer layout to match.`),
		text(``),

		h2(`Space Cleanup Suggestions`),
		text(`The Bin can now help you tidy up. A new Suggestions area finds orphaned objects – leftover items that are no longer linked to anything – and lets you review and remove them. Nothing is ever removed without your confirmation, and your chats are left untouched. Suggestions are grouped by where they came from and can be collapsed, so you can clean up at your own pace.`),
		text(``),

		h2(`Select Text Across Blocks`),
		text(`You can now select text that spans multiple blocks and copy, cut, or quote it all at once. Grabbing a passage that runs across several paragraphs or list items no longer means doing it one block at a time.`),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Vault Location Safety Warning</b>`),
		text(`Anytype now warns you if your vault is in a cloud-synced folder (Dropbox, iCloud Drive, OneDrive, and others) or on a network drive, since that can silently corrupt your data.`),
		text(``),

		text(`<b>Download Files from a Chat Message</b>`),
		text(`A message's menu now lets you download a single file or all of its files at once. When there's just one file, the menu even shows its name so you know exactly what you're saving.`),
		text(``),

		text(`<b>Copy a Message Link vs. a Link in a Message</b>`),
		text(`The chat message menu now clearly separates "Copy link" – for a web address inside the message text – from "Copy message link", which links to the message itself. Right-clicking a link now does what you'd expect.`),
		text(``),

		text(`<b>Show Favorites as Cards or Links</b>`),
		text(`My Favorites in the sidebar now has a "Show as" toggle, so you can display your favorites as rich cards or as a compact list of links, whichever suits you.`),
		text(``),

		text(`<b>Smarter Link Detection in Chat</b>`),
		text(`Chat no longer turns ordinary words that happen to contain a dot into links – only real web addresses become clickable.`),
		text(``),

		text(`<b>Chat API for Integrations</b>`),
		text(`A new Chat API lets developers build integrations on top of Anytype chats.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Chat & Messaging (7)</b>`, [
			bullet(`Double-clicking the last word of a message no longer also selects the timestamp.`),
			bullet(`The unread notification no longer blinks for the chat you're actively reading.`),
			bullet(`The Last Edited widget no longer reloads all of its icons when you react to a chat message.`),
			bullet(`Searching within a chat now finds all matching messages, including ones it used to miss.`),
			bullet(`Unread message counts are now accurate.`),
			bullet(`Message previews no longer show up blank.`),
			bullet(`Names and messages are no longer lost after the app rebuilds data in the background.`),
		]),

		toggle(`<b>Editor & Blocks (18)</b>`, [
			bullet(`Pressing ${hl('Enter')} now reliably creates a new line instead of sometimes behaving like ${hl(`${shift}+Enter`)}. Thanks to @${link('https://community.anytype.io/t/2402', 'Tim-Luca')}!`),
			bullet(`Typing angle brackets like ${hl('&lt;a&gt;')} in a code block no longer makes your text disappear. Thanks to @${link('https://community.anytype.io/t/30353', 'V_Cassel')}!`),
			bullet(`Values in a code block no longer disappear when you click outside the block. Thanks to @${link('https://community.anytype.io/t/30411', 'nozense')}!`),
			bullet(`${hl('Backspace')} and ${hl('Delete')} now work reliably again, fixing a state where they could stop responding after certain input.`),
			bullet(`Applying code formatting with backticks on international or dead-key keyboards no longer adds an extra leading space. Thanks to @${link('https://community.anytype.io/t/30207', 'manu81031')}!`),
			bullet(`Italic and other emphasis no longer leak past their markers. Thanks to @${link('https://community.anytype.io/t/28674', 'JulienKaspar')}!`),
			bullet(`Markdown formatting no longer extends past the point where you stopped it. Thanks to @${link('https://community.anytype.io/t/30944', 'tatumon')}!`),
			bullet(`Inline code no longer leaves a stray formatted fragment on the previous line. Thanks to @${link('https://community.anytype.io/t/31025', 'Nupky')}!`),
			bullet(`Moving a block into an empty toggle with the keyboard now works, and you can move into empty toggles with the arrow keys. Thanks to @${link('https://community.anytype.io/t/29453', 'Code-Jack')}!`),
			bullet(`${hl('Backspace')} at the start of a toggle's first line now keeps the cursor inside the toggle.`),
			bullet(`Cutting or copying a toggle from the block menu now keeps its contents instead of emptying it. Thanks to @${link('https://community.anytype.io/t/29781', 'Code-Jack')}!`),
			bullet(`Pasting from a block's action menu now pastes into the selected block instead of jumping to the end of the page. Thanks to @${link('https://community.anytype.io/t/29780', 'Code-Jack')}!`),
			bullet(`Text is no longer lost when two edits land on the same empty block at once.`),
			bullet(`Typing with an input method (such as Chinese or Japanese) no longer causes text to jump or the wrong characters to appear. Thanks to @${link('https://community.anytype.io/t/28320', 'Qusay')}!`),
			bullet(`ChartJS and other embeds can now be edited when placed side by side in columns. Thanks to @${link('https://community.anytype.io/t/30550', 'e1sordo')}!`),
			bullet(`Copying and pasting is more reliable across the app.`),
			bullet(`Fixed extra space and scrollbar glitches at the very bottom of a page.`),
			bullet(`Breaking out of a toggle block with ${hl('Enter')} now lets you keep typing right away. Thanks to @${link('https://github.com/anyproto/anytype-ts/pull/2305', 'psalmsdove')}!`),
		]),

		toggle(`<b>Objects & Views (8)</b>`, [
			bullet(`Newly created cards now appear immediately in Kanban and Board views, including inline collections and when "show more objects" is active. Thanks to @${link('https://community.anytype.io/t/30574', 'bodo_freutlin')}!`),
			bullet(`Grid views – Queries, Types, Collections, and inline queries – now show a horizontal scrollbar for content that is wider than the window. Thanks to @${link('https://community.anytype.io/t/30943', 'Astro-L')}!`),
			bullet(`Creating an object from a property field now keeps the title you typed.`),
			bullet(`Pasting text into a new record's name field no longer closes the field. Thanks to @${link('https://community.anytype.io/t/30344', 'Hexara')}!`),
			bullet(`Clicking in and out of property fields in grid view now behaves correctly.`),
			bullet(`Bookmarks now appear in links and in the graph.`),
			bullet(`Widget settings are now remembered.`),
			bullet(`New objects in a sorted Collection or Query now land in the right place right away, instead of getting stuck at the bottom.`),
		]),

		toggle(`<b>Sync & Files (2)</b>`, [
			bullet(`Sync recovers faster when you switch networks or wake your device from sleep, and local syncing is more stable.`),
			bullet(`Files that could get stuck on "Syncing" now resolve, and a rare upload freeze has been fixed.`),
		]),

		toggle(`<b>Navigation & Window Management (5)</b>`, [
			bullet(`Switching spaces no longer briefly opens the wrong object from the previous space.`),
			bullet(`The tab name now updates right away when you switch channels, instead of waiting until you open an object.`),
			bullet(`Dragging an object into a new side column now works on Linux. Thanks to @${link('https://community.anytype.io/t/30401', 'firegerbil')}!`),
			bullet(`The sidebar no longer hides a panel immediately after you open it.`),
			bullet(`Jumping to a page with the ${hl(`${cmd}+K`)} switcher no longer leaves it displayed at the wrong width. Thanks to @${link('https://github.com/anyproto/anytype-ts/pull/2306', 'psalmsdove')}!`),
		]),

		toggle(`<b>Miscellaneous (4)</b>`, [
			bullet(`Toast buttons no longer show a dark background box in dark mode.`),
			bullet(`A trailing space at the end of your login phrase no longer prevents you from logging in. Thanks to @${link('https://github.com/anyproto/anytype-ts/pull/2268', 'jmpnop')}!`),
			bullet(`Various security hardening improvements.`),
			bullet(`The ${hl('Space')} bar (and occasionally other keys) could stop working across the whole app until you restarted it – fixed.`),
		]),
	];
};
