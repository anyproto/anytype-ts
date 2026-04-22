import { Block, Helpers } from './common';

export default (h: Helpers): Block[] => {
	const { hl, icon, title, h2, h4, text, bullet, img, link, toggle } = h;
	return [
		icon('🎯'),

		title(`Focus & Flow`),
		h4(`<span>Release 0.54.0</span>`),
		text(''),
		text('This release brings several highly requested additions. Tabs let you work with multiple objects in the same window, Filters have been redesigned with cleaner controls and more advanced logic, and you can now search through chats to find past messages.'),
		text('Also included are toggled headings, dynamic filter values, channel ownership transfer, and a range of refinements across the app.'),
		text(''),

		h2(`Tabs`),
		text(`One of the most requested features is here. You can now open multiple Objects side by side in a tab bar, just like in a browser. Open any Object in a new tab from the context menu, with ${hl('Cmd+Click')} / ${hl('Ctrl+Click')}, or from Widgets.`),
		text(`Choose between two modes in Settings > Preferences: <b>Contextual</b>, where the tab bar appears only when you have more than one tab open, or <b>Always visible</b>.`),
		text(`Drag tabs to reorder them, pin important tabs to keep them in place, drag a tab out to open it in a new window, and return to your open tabs when you relaunch the app.`),
		img('54/1.png'),
		text(``),

		h2(`New Filters and Sorts`),
		text(`Filters and Sorts in Queries and Collections got a fresh look. Active filters now appear in a dedicated bar above your View, showing the property name, condition, and value at a glance. Sort indicators sit alongside filters, so you always know how your data is organized.`),
		text(`Adding new filters is faster with the ${hl('+')} button, and clearing everything takes just one click.`),
		img('54/2.png'),
		text(``),

		h2(`Advanced Filters`),
		text(`Filters now support complex logic. You can combine multiple conditions using AND / OR, and group related rules together to build precise queries – like finding all tasks that are either high priority or due this week.`),
		text(`Add an advanced filter from the filter menu and define your conditions in the dedicated bar.`),
		img('54/3.png'),
		text(``),

		h2(`Chat Messages Search`),
		text(`You can now search through your messages with ${hl('Cmd+F')} / ${hl('Ctrl+F')} or from Search icon. Results appear in a dropdown sorted by date, with navigation arrows to move through matches one by one.`),
		text(``),

		h2(`Transfer Channel Ownership`),
		text(`Channel ownership can now be transferred to another member. This allows Channels to be handed over as roles change, without recreating them or losing history.`),
		text(`After the transfer, you become an Editor, and the new owner takes full control – including the ability to transfer ownership again.`),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Dynamic Filter Values</b>`),
		text(`Filters now support dynamic values such as <b>Current User</b> and <b>This Object</b>. For example, a Tasks view can be filtered by <i>Assignee = Current User</i>, so each member sees their own tasks. Inline Queries and Collections can use <i>This Object</i> in the Object-related properties, to automatically scope results to the object they belong to.`),
		img('54/4.png'),
		text(``),

		text(`<b>Toggled Headings</b>`),
		text(`Title, Heading and Subheading can now be collapsible toggles. Create them from the ${hl('/')} menu or with Markdown shortcuts (${hl('#>')}, ${hl('##>')}, ${hl('###>')}). You can also create a toggle with ${hl('>')} + ${hl('Space')} and then use your heading markdown shortcut (${hl('#')}, ${hl('##')}, ${hl('###')}) to convert it into a toggled heading.`),
		text(`Multiple toggle headings can be opened or closed at once, and converting a regular heading to a toggle automatically captures everything beneath it as children.`),
		img('54/5.png'),
		text(``),

		text(`<b>Spell Checking in Chat</b>`),
		text(`Chat messages now support spell checking with the same red underline and suggestions you already get in the Editor. It uses your existing language settings – no extra setup needed.`),
		text(``),

		text(`<b>Updated Sync Status</b>`),
		text(`Sync status moved to the widget panel header with a refreshed look: a new globe icon shows your network name, a device counter shows connected peers, and a red dot appears in the sidebar when there's a notice to review.`),
		text(``),

		text(`<b>Automatic File Download</b>`),
		text(`Files in shared Spaces are now downloaded automatically, so you no longer need to manually fetch each one.`),
		text(``),

		text(`<b>Paste Link Menu Redesign</b>`),
		text(`The paste link menu now shows clearer options: <b>Bookmark</b>, <b>URL</b>, <b>Embed</b> (for YouTube, Miro, etc.), and a new <b>Object</b> option for Anytype links – letting you insert an Object card directly from a copied link.`),
		text(``),

		text(`<b>File Block Default Style</b>`),
		text(`A new setting in <b>Editor Personalization</b> lets you choose whether files added to the Editor are shown as embedded previews or compact links by default.`),
		text(``),

		text(`<b>Click to Edit Title in Grid</b>`),
		text(`A new toggle in <b>Preferences</b> lets you choose whether clicking a title in Grid view enters edit mode (new default) or opens the Object directly (legacy behavior).`),
		text(``),

		text(`<b>Template Name Pre-fill</b>`),
		text(`Templates now include a setting that lets you choose whether new objects inherit the template name. You can find it in the Template editor header and switch between <b>Pre-fill name</b> and <b>Empty name</b>.`),
		text(``),

		text(`<b>Toggle Sidebar and Widgets Together</b>`),
		text(`You can now assign a keyboard shortcut to toggle both the Sidebar and Widget panel at the same time. This lets you quickly switch to a more focused view of the current object.`),
		text(``),

		text(`<b>Full-Text Search in Collections</b>`),
		text(`Searching inside a Collection now matches Object content, not just titles.`),
		text(``),

		text(`<b>Grid Layout as Default</b>`),
		text(`New Queries and Collections now use Grid layout by default, making properties immediately visible and easier to discover.`),
		text(``),

		text(`<b>Jump to Message in Chat</b>`),
		text(`Click a quoted reply to jump to the original message. The scroll-down button then takes you back to the reply first, then to the bottom. Thanks to @${link('https://community.anytype.io/t/chats-add-jump-to-message-functionality/29433', 'boots')}!`),
		text(``),

		text(`<b>Fullscreen Image Preview</b>`),
		text(`Click anywhere outside the image to exit fullscreen preview. Double-click the image to zoom in.`),
		text(``),

		text(`<b>Windows System Menu via Alt</b>`),
		text(`On Windows, pressing ${hl('Alt')} now opens the system menu, making it accessible for keyboard-only users.`),
		text(``),

		text(`<b>URL Properties in Header</b>`),
		text(`URL properties placed in the header section can now be opened directly with a click.`),
		text(``),

		text(`<b>Quick Create from Type Widget</b>`),
		text(`Hover over a Type in the sidebar widget to reveal a ${hl('+')} button for creating a new Object of that Type instantly.`),
		text(``),

		text(`<b>Clipboard in Title and Description</b>`),
		text(`Copy, Cut and Paste actions are now available in the right-click menu for title and description blocks.`),
		text(``),

		text(`<b>Keyboard Shortcut Panel Focus</b>`),
		text(`Opening the Keyboard Shortcut panel with ${hl('Ctrl+Space')} now places focus directly in the search field. Thanks to @${link('https://community.anytype.io/t/keyboard-shortcut-panel-should-focus-on-the-text-input-when-opened/29797', 'EricNoteTaker')}!`),
		text(``),

		text(`<b>Table Column Widths in PDF Export</b>`),
		text(`Exporting a page to PDF now preserves custom table column widths. Thanks to @${link('https://community.anytype.io/t/26568', 'William Bruneau')}!`),
		text(``),

		text(`<b>Property Option Sorting</b>`),
		text(`Property options can now be reordered via drag-and-drop even when there are only a few of them.`),
		text(``),

		text(`<b>Copy/Paste with Spellcheck Menu</b>`),
		text(`Copy and paste shortcuts now work correctly on Windows when the spellcheck context menu is open.`),
		text(``),

		text(`<b>Colored Text Reset in Chat</b>`),
		text(`Colored text pasted from the Editor into Chat is now reset to the default color to keep messages clean.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Chat & Messaging</b>`, [
			bullet(`Vault counters no longer appear for deleted Chat objects.`),
			bullet(`The emoji reaction popup in Chat no longer closes itself immediately.`),
			bullet(`Images pasted from clipboard now show a preview in Chat, just like uploaded files.`),
			bullet(`Dragging DWG, PSD and TIFF files into Chat no longer causes an error.`),
			bullet(`Muted Chats no longer show a blue unread badge – the indicator is now grey so you can tell at a glance which conversations actually need attention. Thanks to @${link('https://community.anytype.io/t/29588', 'Shampra')}!`),
			bullet(`The unread message counter in the Vault now updates in real time as you read through a Chat.`),
		]),

		toggle(`<b>Editor & Blocks</b>`, [
			bullet(`Pressing ${hl('Enter')} in a code block now creates a new line on the first press. Thanks to @${link('https://community.anytype.io/t/29828', 'personnotman')}!`),
			bullet(`Switching between RTL and LTR text no longer deletes the first character.`),
			bullet(`Copy-pasting a Callout block now duplicates all lines, not just the first. Thanks to @${link('https://community.anytype.io/t/29723', 'Code-Jack')}!`),
			bullet(`Mermaid <b>architecture-beta</b> diagrams now render correctly.`),
			bullet(`File links with spaces in the path now work as expected. Thanks to @${link('https://community.anytype.io/t/29787', 'George A Kastanes')}!`),
			bullet(`The Editor no longer makes small jumps while typing near the bottom of a modal. Thanks to @${link('https://community.anytype.io/t/29810', 'Code-Jack')}!`),
			bullet(`Deleted blocks are now shown correctly in Version History. Thanks to @${link('https://community.anytype.io/t/29727', 'cicko')}!`),
			bullet(`"Move to" now preserves the original order of selected blocks. Thanks to @${link('https://community.anytype.io/t/29827', 'pomp')}!`),
			bullet(`Replacing a link on selected text now updates the link preview immediately.`),
			bullet(`RTL and LTR text alignment no longer gets mixed up when switching between objects. Thanks to @${link('https://community.anytype.io/t/29599', 'Daniel Zolfaghari')}!`),
			bullet(`Pressing ${hl('Enter')} above a collapsed Toggle block no longer moves nested content out of it. Thanks to @${link('https://community.anytype.io/t/29451', 'crediblesauce')}!`),
			bullet(`${hl('Shift+Click')} selection now works correctly in large Pages. Thanks to @${link('https://community.anytype.io/t/29437', 'Code-Jack')}!`),
			bullet(`Blocks now correctly switch from RTL back to LTR when you delete RTL text and start typing in a left-to-right language. Thanks to @${link('https://community.anytype.io/t/28873', 'Hexara')}!`),
			bullet(`The cursor now correctly moves to the left side when switching from an RTL to an LTR language.`),
			bullet(`Selection is no longer inverted in very large Pages. Thanks to @${link('https://community.anytype.io/t/28035', 'Code-Jack')}!`),
			bullet(`${hl('Shift+Click')} now correctly limits the selection after using Select All. Thanks to @${link('https://community.anytype.io/t/28072', 'Code-Jack')}!`),
			bullet(`Undo now works correctly in large code blocks after using a heading shortcut. Thanks to @${link('https://community.anytype.io/t/27660', 'szc188')}!`),
			bullet(`The ${hl('Enter')} key now works inside code blocks while the ${hl('Cmd+F')} / ${hl('Ctrl+F')} search bar is open. Thanks to @${link('https://community.anytype.io/t/27661', 'szc188')}!`),
			bullet(`Closing the in-page search bar inside a Toggle block no longer loses the cursor position. Thanks to @${link('https://community.anytype.io/t/26118', 'Code-Jack')}!`),
			bullet(`Right-click context menu now reliably appears when selecting multiple blocks on Windows. Thanks to @${link('https://community.anytype.io/t/20108', 'Code-Jack')}!`),
		]),

		toggle(`<b>Keyboard & Shortcuts</b>`, [
			bullet(`Zoom in/out now works with ${hl('+')} and ${hl('-')} keys on the numeric keypad. Thanks to @${link('https://community.anytype.io/t/29845', 'Code-Jack')}!`),
			bullet(`${hl('Ctrl+F')} in the Bin now opens the built-in filter instead of the editor search menu.`),
			bullet(`Keyboard shortcuts no longer insert a character after drag-and-dropping a block.`),
			bullet(`Buttons at the top of the Shortcuts popup are now fully clickable.`),
			bullet(`SecureEventInput is now properly released when input fields lose focus, restoring compatibility with third-party input methods on macOS.`),
			bullet(`Shortcut recording no longer inserts Cyrillic characters when a non-Latin keyboard layout is active.`),
			bullet(`${hl('Page Up')} and ${hl('Page Down')} keys now scroll through the entire document, and ${hl('Alt+Up')} / ${hl('Alt+Down')} (${hl('Ctrl+Up')} / ${hl('Ctrl+Down')} on Windows) hop the cursor between blocks. Thanks to @${link('https://community.anytype.io/t/navigation-to-the-beginning-or-end-of-the-content-does-not-work/27737', 'mig2k')} & @${link('https://community.anytype.io/t/editor-navigation-allow-jumping-page-up-down-with-the-corresponding-keyboard-keys/29629', 'Code-Jack')}!`),
		]),

		toggle(`<b>UI & Rendering</b>`, [
			bullet(`Content is no longer visible behind the "Creating new type" screen in small windows.`),
			bullet(`Long Any ID / unique name no longer overflows the Membership screen layout.`),
			bullet(`The sync status deletion confirmation popup now appears above the sync status window.`),
			bullet(`Action icons in the object header now look consistent across light and dark modes.`),
			bullet(`The Vault sidebar no longer reopens when you resize the window.`),
			bullet(`Pressing ${hl('Esc')} on the "This is your Key" screen no longer puts the app in a broken state.`),
			bullet(`Rendering issues on certain Linux distributions (e.g. Zorin OS) have been resolved.`),
			bullet(`PIN input no longer registers two digits at once on a single key press.`),
			bullet(`The header bar on Gnome/Fedora now follows the system theme correctly. Thanks to @${link('https://community.anytype.io/t/28858', 'rakko')}!`),
			bullet(`Window scaling on Fedora with Gnome no longer causes jerky or delayed behavior. Thanks to @${link('https://community.anytype.io/t/27712', 'jpcshka')}!`),
			bullet(`The layout no longer breaks when navigating back through Version History.`),
			bullet(`Screen flickering when moving the mouse has been fixed.`),
		]),

		toggle(`<b>Objects & Views</b>`, [
			bullet(`Dragging an object between views now correctly applies the target view's filters.`),
			bullet(`Property columns in Grid view no longer break position after horizontal scrolling.`),
			bullet(`Editing a Type now opens the existing type instead of creating a new one.`),
			bullet(`Grid layout now updates correctly when you change zoom level.`),
			bullet(`The "Move to Bin" option no longer appears for files owned by other members.`),
			bullet(`Deleting a Type no longer shows a false warning about objects using it when there are none. Thanks to @${link('https://community.anytype.io/t/29819', 'flypenguin')}!`),
			bullet(`Creating a new object in the Notes type now consistently navigates to the newly created note. Thanks to @${link('https://community.anytype.io/t/29514', 'Hexara')}!`),
			bullet(`Pressing ${hl('Enter')} while editing a Select or Multi-select option no longer changes the option's color. Thanks to @${link('https://community.anytype.io/t/28776', 'Hexara')}!`),
			bullet(`Drag-and-drop scrolling in long option lists now works correctly.`),
			bullet(`The "New" badge no longer persists after creating and naming a new Type.`),
			bullet(`The Object Picker now shows results in the correct order when converting text to a linked object. Thanks to @${link('https://community.anytype.io/t/23589', 'Khang')}!`),
		]),

		toggle(`<b>Navigation</b>`, [
			bullet(`The Channel Sidebar no longer opens empty when switching Channels with ${hl('Ctrl+Tab')}.`),
			bullet(`Objects that were never opened no longer appear in the "Last opened objects" menu.`),
			bullet(`The second window now works correctly after waking from suspend. Thanks to @${link('https://community.anytype.io/t/29753', 'krst')}!`),
			bullet(`Anytype now asks for the pin code on launch after a Windows reboot. Thanks to @${link('https://community.anytype.io/t/28638', 'stef47')}!`),
			bullet(`The pin code setting no longer deactivates itself after a system restart. Thanks to @${link('https://community.anytype.io/t/27996', 'stef47')}!`),
			bullet(`Deep links now open the correct object when launching Anytype on Windows.`),
		]),
	];
};
