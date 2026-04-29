import { Block, Helpers } from './common';

export default (h: Helpers): Block[] => {
	const { hl, icon, title, h2, h4, text, bullet, link, toggle } = h;
	return [
		icon('🎄'),

		title(`Smoother Edges`),
		h4(`<span>Release 0.53.0</span>`),
		text(''),
		text('We’re wrapping up the year with one more release 🎁 '),
		text('Without big sparkles, but with a lot of shine: plenty of fixes, smoother interactions and a bunch of quality-of-life improvements.'),
		text('Huge thanks for all your support this year! For the reports, screenshots, suggestions and questions. You’ve basically been on watch 24/7, and it genuinely helps us catch the details we’d otherwise miss. '),
		text('Happy holidays, everyone! We’ll be back soon with more.'),
		text(''),

		h2(`Membership Update`),
		text('The Membership screen was updated, and you can now purchase <b>group memberships</b> by adding as many seats as you need: everyone in the group gets the selected membership level and can create shared Channels with the updated Editors limit. You can also purchase the <b>Remote Storage add-on</b> with the <b>Ultra</b> membership level.'),
		text('To purchase or manage your membership, the app will redirect you to the new billing page.'),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Updated Remote Storage Screen</b>`),
		text(`Remote Storage settings now adapt to your role: owners see storage usage against their limit and can review <i>all files</i> in the Channel, while members see only the files they uploaded.`),
		text(``),

		text(`<b>Delete Type with Related Objects</b>`),
		text(`Deleting a Type now includes a confirmation step that shows which Objects are using that Type. You can choose to move those Objects to Bin at the same time.`),
		text(``),

		text(`<b>Widget Sections Management</b>`),
		text(`<b>Customize Sidebar</b> was renamed to <b>Manage Sections</b> and now opens in a centered pop-up from the Channel context menu. The three-dot menus for <b>Pinned </b>and<b> Recently edited</b> were also updated with a <b>Hide section</b> option.`),
		text(``),

		text(`<b>Bin as a Widget</b>`),
		text(`Bin is now available as a Widget, with its own three-dot menu. You can also rearrange or hide it via <b>Manage Sections</b>.`),
		text(``),

		text(`<b>Create Chats from Slash Menu</b>`),
		text(`Chats are now available in the Editor’s ${hl('/')} menu, so you can create them inline while working on a Page.`),
		text(``),

		text(`<b>Create Channel from Compact Vault</b>`),
		text(`A ${hl('+')} button was added to the Vault’s stripe view, making it easier to create new Spaces and Chats without expanding the sidebar.`),
		text(``),

		text(`<b>Help and Gallery in Compact Vault</b>`),
		text(`When the Vault is set to stripe view, hover over your profile icon to reveal quick access to the Help menu and Gallery.`),
		text(``),

		text(`<b>Compact Vault Shows Only Unread Counter</b>`),
		text(`In the Vault’s strip view, Space and Chat icons now show only the unread counter, with the mention indicator hidden to keep the layout clean.`),
		text(``),

		text(`<b>Message Sending Status in Vault Preview</b>`),
		text(`Chats in the Vault now show when your latest message is still sending, so you can instantly see which conversations are waiting to sync.`),
		text(``),

		text(`<b>Counts for Search Results in Views</b>`),
		text(`When you use local search in a View, the count now reflects the number of visible results. Thanks to @${link('https://community.anytype.io/t/29634', 'Code-Jack')}!`),
		text(``),

		text(`<b>Property Editing in Grid View</b>`),
		text(`When editing a property in Grid view, clicking outside now closes the dropdown first instead of immediately switching to the next field.`),
		text(``),

		text(`<b>Horizontal Scrollbar in Grid and Kanban</b>`),
		text(`Grid and Kanban views now show a sticky horizontal scrollbar, so you can scroll sideways even when you’re not at the bottom of a Query or Collection, especially helpful if you don’t use a touchpad.`),
		text(``),

		text(`<b>Copy and Paste Added to Text Menu</b>`),
		text(`<b>Copy</b>, <b>Cut</b> and <b>Paste</b> actions are now available from the Editor’s text block menu.`),
		text(``),

		text(`<b>Auto-Link When Pasting URLs</b>`),
		text(`When text is selected, pasting a URL with ${hl('Cmd+V')}<b> </b>/ ${hl('Ctrl+V')} now automatically turns it into a link in both the Block Editor and Chat Input, without showing the paste options menu.`),
		text(``),

		text(`<b>Improved Bullet Indentation</b>`),
		text(`When you decrease indentation for bullet points, items now stay aligned and keep their order.`),
		text(``),

		text(`<b>Updated Table Shortcut</b>`),
		text(`The ${hl('Shift+Space')} shortcut no longer opens table cell/row options by default. To restore this function, you can assign a shortcut for <b>Table cell options</b> in Shortcut settings. Thanks to @${link('https://community.anytype.io/t/28965', 'krst')}!`),
		text(``),

		text(`<b>Filter out Types in Graph</b>`),
		text(`In <b>Filter by Types</b>, you can now hide all existing Types using a dedicated toggle. Thanks to @${link('https://community.anytype.io/t/29690', 'Code-Jack')}!`),
		text(``),

		text(`<b>Custom CSS and Dark Mode Styling Refined</b>`),
		text(`We adjusted how theme styles are applied in dark mode to make custom CSS and theme tweaks easier to maintain. Thanks to @${link('https://community.anytype.io/t/29459', 'GrubSlant')}!`),
		text(``),

		text(`<b>Text Formatting Menu Position</b>`),
		text(`The text formatting menu now adjusts if the Sidebar opens, avoiding overlap with Widgets. Thanks to @${link('https://community.anytype.io/t/29666', 'Code-Jack')}!`),
		text(``),

		text(`<b>Update Pop-up Is Now Movable</b>`),
		text(`The “Update in progress” pop-up no longer blocks interactive parts of the app – you can drag it aside while an update is running. Thanks to @${link('https://community.anytype.io/t/29635', 'TiedaoXianren')}!`),
		text(``),

		text(`<b>More Tooltips on Hover</b>`),
		text(`Added tooltips to a few previously unlabeled icons and controls, including Sync status, the profile icon in the Vault, and several buttons in chat. Thanks @${link('https://community.anytype.io/t/29682', 'Code-Jack')} for reporting!`),
		text(``),

		text(`<b>Consistent Actions on Object Type</b>`),
		text(`Object Type pages now show the same actions – like Pin and the three-dot menu – whether opened from Settings or Widgets.`),
		text(``),

		text(`<b>Search Auto-Focus for Icons and Covers</b>`),
		text(`When you open <b>Add Icon</b> or <b>Add Cover</b> (Unsplash/Library), the search field is now focused automatically so you can start typing to filter right away.`),
		text(``),

		text(`<b>Remember Last Download Location</b>`),
		text(`Anytype now remembers where you last saved a file and opens the same folder next time you download or export.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Chat & Messaging</b>`, [
			bullet(`Pressing ${hl('Tab')} in chat no longer makes the cursor disappear by dropping focus from the input. Thanks to @${link('https://community.anytype.io/t/29556', 'Code-Jack')}!`),
			bullet(`A copied link for a specific message now leads to the correct message in chat. Thanks to @${link('https://community.anytype.io/t/29560', 'Code-Jack')}!`),
			bullet(`Double-clicking a word in chat now behaves like text selection, instead of triggering Reply. Thanks to @${link('https://community.anytype.io/t/29677', 'e1sordo')}!`),
			bullet(`Direct Channels now reflect the updated participant name correctly. Thanks to @${link('https://community.anytype.io/t/29604', 'e1sordo')}!`),
			bullet(`Chat bubbles with text and multiple images now resize smoothly and no longer overlap the Sidebar.`),
			bullet(`Space notifications now handle long names to include the Chat Object name.`),
			bullet(`Pasting multiple links in chat no longer causes formatting side effects.`),
			bullet(`Link styling in chat now underlines the full link consistently.`),
		]),

		toggle(`<b>Editor & Blocks</b>`, [
			bullet(`Accepting an autocorrect suggestion no longer converts inline LaTeX into plain text. Thanks to @${link('https://community.anytype.io/t/23979', 'dzlg')}!`),
			bullet(`${hl('Unlink')} no longer strips inline LaTeX formatting or shifts inline text styles in the block. Thanks to @${link('https://community.anytype.io/t/29562', 'geesecross')}!`),
			bullet(`Selecting text inside long code blocks now remains precise while dragging. Thanks to @${link('https://community.anytype.io/t/27659', 'szc188')}!`),
			bullet(`Empty toggles now accept the cursor with a single click. Thanks to @${link('https://community.anytype.io/t/29454', 'Code-Jack')}!`),
			bullet(`The Editor no longer flickers when you paste content or click into the empty space at the bottom of long pages. Thanks to @${link('https://community.anytype.io/t/24462', 'Facility6384')}!`),
			bullet(`HTML entities are now kept as plain text, instead of being automatically converted into characters. Thanks to @${link('https://community.anytype.io/t/29237', 'GrubSlant')}!`),
			bullet(`Local search (${hl('Ctrl/Cmd+F')}) lets you click a highlighted result to jump to it and continue editing, without dismissing search. Thanks to @${link('https://community.anytype.io/t/13152', 'sooyoung')}!`),
			bullet(`Hyperlinks inside square brackets no longer disappear after searching for that bracketed text.`),
		]),

		toggle(`<b>Keyboard & Shortcuts</b>`, [
			bullet(`Pressing ${hl('Esc')} now closes a media preview before exiting full-screen mode. Thanks to @${link('https://community.anytype.io/t/29675', 'e1sordo')}!`),
			bullet(`Pressing ${hl('Esc')} to close an Object opened from View search results now only closes the modal and keeps the search results intact. Thanks to @${link('https://community.anytype.io/t/29687', 'Code-Jack')}!`),
			bullet(`Cutting content with ${hl('Ctrl+X')} in a long page no longer causes the view to jump back toward the top. Thanks to @${link('https://community.anytype.io/t/29646', 'Code-Jack')}!`),
		]),

		toggle(`<b>UI & Rendering</b>`, [
			bullet(`Collections/Queries without an icon now keep proper top padding. Thanks to @${link('https://community.anytype.io/t/29640', 'LionLobes')}!`),
			bullet(`Multiple open windows no longer show a loading bubble. Thanks to @${link('https://community.anytype.io/t/29614', 'C.c')}!`),
			bullet(`Clicking or dragging in the Vault header no longer causes long pages to scroll upward.`),
			bullet(`The keyboard shortcut hint on Channel hover is now visible when the name is long.`),
			bullet(`The loading Channel placeholder in the Vault now keeps a correct size.`),
			bullet(`Reloading the app in dark mode no longer flashes a white screen.`),
		]),

		toggle(`<b>Edit Type</b>`, [
			bullet(`Changes to Property order/sections in the <b>Edit Type</b> persist after the app refresh. Thanks to @${link('https://community.anytype.io/t/29464', 'raph')}!`),
			bullet(`The <b>Edit Type</b> settings panel now closes automatically when you switch to a different Channel or open another Object.`),
		]),

		toggle(`<b>Objects & Views</b>`, [
			bullet(`Creating an Object with Basic/Action/Profile layout now displays the <b>Untitled</b> placeholder.`),
			bullet(`In manually sorted Queries/Collections, dragged objects now drop exactly on the indicated insertion line. Thanks to @${link('https://community.anytype.io/t/29462', 'Bass-T')}!`),
		]),

		toggle(`<b>Navigation</b>`, [
			bullet(`After reloading, the ${hl('Back')} button no longer navigates back to the Entering Vault screen. Thanks to @${link('https://community.anytype.io/t/29583', 'geesecross')}!`),
			bullet(`Switching between Objects no longer causes the opened Object to flicker.`),
			bullet(`Opening Objects in a new window (${hl('Ctrl+Shift+N')} / ${hl('Ctrl+Click')}) works consistently. Thanks to @${link('https://community.anytype.io/t/29000', 'Ronsox')}!`),
		]),
	];
};
