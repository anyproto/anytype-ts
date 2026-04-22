import { Block, Helpers } from './common';

export default (h: Helpers): Block[] => {
	const { hl, icon, title, h1, h2, h4, text, callout, bullet, img, link, toggle } = h;
	return [
		icon('💬'),

		title(`Space Multi-Chats & Navigation`),
		h4(`<span>Release 0.51.0</span><span>November 24, 2025</span>`),
		text(''),
		text('Chats now live as native Objects in your Spaces, so you can spin up topic-based threads and link them directly to your work. Navigation across channels is now lighter and more consistent.'),
		text(''),

		callout(`Starting with the next release, we’ll be ending support for <b>macOS Big Sur</b>. This change follows Electron’s decision to ${link('https://www.electronjs.org/blog/electron-38-0', 'drop Big Sur support')}.`, '🏔️'),
		text(``),

		h1(`Multi-Chats in your Space`),
		text('Space Channels now hold more than one conversation at a time. Start topic-specific chats right where your work happens – discussions now live alongside your notes, tasks, and documentation as part of your knowledge graph.'),
		img(`51/1.png`),
		text(``),

		text(`<b>Chat as an Object Type</b>`),
		text(`Chats are now native Objects in your Space. You can organize them into different views, assign tags to group related conversations, include them in Collections or Queries, and @-mention them from any Object for cross-referencing. As a system Type, Chat doesn’t support templates or layout changes.`),
		img(`51/2.png`),
		text(``),

		text(`<b>Widget Behaviour</b>`),
		text(`The Chats Type Widget works like any other widget: you can pin it to your Sidebar, adjust its appearance by choosing how many chats to show, and pin individual chats for quicker access. `),
		text(`Unlike other Widgets, pinned chats display counters and mention indicators directly in the Sidebar. A temporary <i>Unread</i> section also appears automatically when new messages arrive, listing chats with unread content.`),
		img(`51/3.png`),
		text(``),

		text(`<b>Per-Chat Notifications</b>`),
		text(`Right-click any Chat Object, or use the three-dots menu inside a chat window to open preferences and choose <i>Enable all</i>, <i>Mentions only</i>, or <i>Disable all</i>.`),
		img(`51/4.png`),
		text(``),

		h1(`Updated Navigation`),
		text('We’ve reworked the navigation layout for a more consistent way to move through your Channels.'),
		text(``),

		text(`<b>Unified Sidebar</b>`),
		text(`Both Space and Chat Channels now share a consistent left-side navigation. You can resize or collapse the Widget Sidebar to fit your workflow.`),
		img(`51/5.png`),
		text(``),

		text(`<b>Recently Opened</b>`),
		text(`Look for the <b>clock icon</b> at the top of your Widget Sidebar to open the history of recently viewed Objects.`),
		img(`51/6.png`),
		text(``),

		text(`<b>Recently Edited</b>`),
		text(`In order to provide quick access to Objects you or your team have recently created or updated, we’ve introduced a new Recently Edited section. Support for personalizing the Widget Sidebar, such as hiding section you don’t need, is coming soon.`),
		img(`51/7.png`),
		text(``),

		text(`<b>Objects Widget</b>`),
		text(`The Objects section, which brings together all objects of a given Type, has been reworked into a single, unified view for more compact organization. Only Types with existing objects are shown – when you create a new object of a Type, it automatically appears in the section.`),
		img(`51/8.png`),
		text(``),

		text(`<b>Compact Vault Layout</b>`),
		text(`The Vault now takes up less space, leaving more room for your work. Choose between a simple list or a view with message previews in your Settings, and swipe it away when you need more focus.`),
		text(`We’re already working on a future iteration that will support an icon-only Vault view for an even more minimal navigation experience.`),
		img(`51/9.png`),
		text(``),

		text(`<b>Channel Context Menu</b>`),
		text(`The Context Menu has been updated and now surfaces key actions when the Vault is hidden. Alongside Channel Settings, it includes Pin and Mute options, Copy an Invite Link, and – importantly – access to the <b>Bin</b>.`),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Manual Sorting in Queries</b>`),
		text(`You can now manually reorder Objects in Queries. The chosen order persists per View, giving you more control over how your lists are organized.`),
		text(``),

		text(`<b>ExcaliDraw</b>`),
		text(`Added support for embedding the Excalidraw editor as a block – finally bringing quick diagramming into your notes and documents.`),
		text(``),

		text(`<b>Smart Typing</b>`),
		text(`Added support for more symbol patterns – for example, typing ${hl('!=')} now converts to ${hl('≠')} and ${hl('~=')} to ${hl('≈')}, alongside existing arrows, comparison, and operator shortcuts. Thanks to @${link('https://github.com/anyproto/anytype-ts/issues/1110', 'larsb24')} for the contribution!`),
		text(``),

		text(`<b>Send Message Preference</b>`),
		text(`Choose your preferred way to send messages: ${hl('Enter')} or ${hl('Cmd + Enter')}.`),
		text(``),

		text(`<b>Copy Message with Formatting</b>`),
		text(`Keep text styles intact when copying Chat messages.`),
		text(``),

		text(`<b>Zoom in the Image in Preview Window</b>`),
		text(`You can now zoom into images in the preview window for a closer look.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Queries & Views</b>`, [
			bullet(`Gallery cards with covers no longer "jump" briefly when opening Queries in Gallery layout. Thanks to @${link('https://community.anytype.io/t/29270', 'VisualNotes')}!`),
			bullet(`In Kanban/Gallery cover settings, hovering "None" now shows the correct hover state. Thanks to @${link('https://community.anytype.io/t/29148', 'Exodes')}!`),
			bullet(`Calendar view in Queries set from a Date property now places objects according to that property.`),
			bullet(`Property headers in Grid view remain visible while scrolling large results in Query. Thanks to @${link('https://community.anytype.io/t/28928', 'Chrispy163')}!`),
			bullet(`Kanban sorting updates automatically when adding a new Object.`),
			bullet(`Fixed an error when selecting or creating a Status property option in Query.`),
			bullet(`Fixed misalignment of Inline Query background color with cards in Gallery view. Thanks to @${link('https://community.anytype.io/t/28798', 'zma17')}!`),
			bullet(`Creating an Object in Kanban view within a Query grouped by a property now correctly assigns that property to the new Object.`),
			bullet(`Creating a Task in Kanban view within Inline Query no longer spawns duplicate entries. Thanks to @${link('https://community.anytype.io/t/28786', 'juhis')}!`),
			bullet(`Property menus within Query views remain fully visible when the right sidebar is open. Thanks to @${link('https://community.anytype.io/t/28945', 'krst')}!`),
			bullet(`"Select source" menu in Inline Query opens at the correct position.`),
		]),

		toggle(`<b>Vault & Widget Sidebar</b>`, [
			bullet(`The last Channel in the Vault is no longer hidden by the gradient. Thanks to @${link('https://community.anytype.io/t/28787', 'Shampra')}!`),
			bullet(`Widget no longer changes height when switching to Kanban/Calendar layout from Compact/List.`),
			bullet(`Kanban view in Object Type widgets now loads correctly after reload. Thanks to @${link('https://community.anytype.io/t/29040', 'siousu')}!`),
			bullet(`Widgets set to "Same as in object view" keep their state when switching Spaces. Thanks to @${link('https://community.anytype.io/t/29332', 'dzlg')}!`),
		]),

		toggle(`<b>Editor & Blocks</b>`, [
			bullet(`${hl('Ctrl+X')} no longer moves the cursor to the previous block. Thanks to @${link('https://community.anytype.io/t/23170', 'Anani')}!`),
			bullet(`Adding "New Property" block from the slash menu inserts the block reliably.`),
			bullet(`Hovering "Add File" or "Add Link to Object" in the slash menu shows the correct sub-menu.`),
			bullet(`Code blocks: single ${hl('$')}, quotes, brackets, and backticks place the caret correctly and ${hl('[')} now auto-closes.`),
			bullet(`Korean IME input in code blocks preserves all composed characters. Thanks to @${link('https://community.anytype.io/t/28680', 'geesecross')}!`),
			bullet(`Two-column layouts (text/image): hover no longer triggers unnecessary scrollbars or column shifts. Thanks to @${link('https://community.anytype.io/t/28889', 'VisualNotes')}!`),
			bullet(`Simple Table color picker shows the true active background color. Thanks to @${link('https://community.anytype.io/t/28856', 'Code-Jack')}!`),
			bullet(`Selecting a row in a Simple Table no longer blanks the screen. Thanks to @${link('https://community.anytype.io/t/29222', 'Shampra')}!`),
			bullet(`Fixed a performance issue where documents with complex inline LaTeX caused the app to freeze.`),
		]),

		toggle(`<b>Chat & Messaging</b>`, [
			bullet(`Pasting styled text in Chat no longer shifts the surrounding text style or caret position.`),
			bullet(`Mentions after long messages with a preceding line-break open the mention menu reliably.`),
			bullet(`Mentions no longer jump when toggling Show more/Show less in Chat.`),
			bullet(`Opening oversized files from a shared Space message no longer throws an error.`),
			bullet(`"Add reaction" option is hidden when a message already has the maximum number of emoji.`),
			bullet(`Fixed the width limitation for attachments in messages.`),
		]),

		toggle(`<b>Table of Contents</b>`, [
			bullet(`The control is now hidden when its sidebar is open to avoid displaying a duplicate ToC. Thanks to @${link('https://community.anytype.io/t/double-display-of-table-of-contents/29074', 'VisualNotes')}!`),
			bullet(`ToC control icons in a modal window render at the correct horizontal position. Thanks to @${link('https://community.anytype.io/t/29124', 'VisualNotes')}!`),
			bullet(`ToC sidebar’s close button works correctly. Thanks to @${link('https://community.anytype.io/t/29120', 'VisualNotes')}!`),
			bullet(`ToC control icons repositions correctly when window width changes after closing a popup.`),
		]),

		toggle(`<b>Modal Window Mode</b>`, [
			bullet(`Context menu in a modal window opens next to the Editor. Thanks to @${link('https://community.anytype.io/t/29234', 'VisualNotes')}!`),
			bullet(`Editor reliability restored after reopening an Object in a modal window: cut/paste/delete text continue to work as expected. Thanks to @${link('https://community.anytype.io/t/29280', 'VisualNotes')}!`),
			bullet(`Local search in a modal window now correctly scrolls to the first match within an Object. Thanks to @${link('https://community.anytype.io/t/28075', 'Code-Jack')}!`),
			bullet(`App window can be dragged while an Object is open in a modal. Thanks to @${link('https://community.anytype.io/t/29053', 'Sean-lee')}!`),
			bullet(`Kanban view opened in a modal window no longer shows "Untitled" Objects. Thanks to @${link('https://community.anytype.io/t/28935', 'siousu')}!`),
			bullet(`Content under a modal window expands correctly when resizing.`),
		]),

		toggle(`<b>Create & Edit Type</b>`, [
			bullet(`Creating a new Type no longer shows an incorrect placeholder text.`),
			bullet(`Edit Type sidebar opens the correct type context after closing and opening another Object in a modal window.`),
			bullet(`Changing an Object’s layout (e.g., from Profile to Action) in Edit Type applies correctly.`),
			bullet(`Editing the plural name in Edit Type no longer moves the cursor back to the singular field. Thanks to @${link('https://community.anytype.io/t/29214', 'VisualNotes')}!`),
			bullet(`Opening the Template’s menu works as expected.`),
		]),

		toggle(`<b>PDF Export</b>`, [
			bullet(`Fixed an issue where PDF export got stuck in preview mode after a file write error. Thanks to @${link('https://community.anytype.io/t/28737', 'Hexara')}!`),
			bullet(`Printing/exporting pages with embedded PDFs now scales/centers the PDF block correctly. Thanks to @${link('https://community.anytype.io/t/28561', 'Loriand')}!`),
			bullet(`Export to PDF includes all pages and removes stray scrollbar imagery. Thanks to @${link('https://community.anytype.io/t/28941', 'epdaei')}!`),
		]),

		toggle(`<b>Navigation & Window Management</b>`, [
			bullet(`Fixed navigation for a specific Type page so ${hl('Back')}/${hl('Forward')} work consistently. Thanks to @${link('https://community.anytype.io/t/28859', 'Hexara')}!`),
			bullet(`Dragging to open the Property panel no longer results in an empty state.`),
			bullet(`Right sidebar preserves its height when the app window is resized.`),
			bullet(`"Show/Hide Menu Bar" shortcut on Windows now toggles this option in App Settings consistently.`),
		]),

		toggle(`<b>Search</b>`, [
			bullet(`Deleting an Object immediately removes it from Global Search results.`),
			bullet(`When creating a new Object from a Widget’s Search (New), it immediately appears in results.`),
		]),

		toggle(`<b>Permissions & Access</b>`, [
			bullet(`Clicking between "Editor" and "Remove" no longer triggers "Viewer" when changing Members Access.`),
			bullet(`"Join by invite link" field focuses correctly on pasted text.`),
			bullet(`Join requests are hidden for non-owners of a Channel.`),
		]),

		toggle(`<b>Miscellaneous</b>`, [
			bullet(`Windows app icon is now crisp and correctly sized in Start menu and Taskbar. Thanks to @${link('https://community.anytype.io/t/29138', 'j17')}!`),
			bullet(`Links to deleted Bookmarks are marked as "Deleted" upon returning to the page that contained them. Thanks to @${link('https://community.anytype.io/t/28932', 'cicko')}!`),
		]),
	];
};
