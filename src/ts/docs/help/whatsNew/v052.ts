import { Block, Helpers } from './common';

export default (h: Helpers): Block[] => {
	const { icon, title, h1, h2, h4, text, bullet, video, img, link, toggle } = h;
	return [
		icon('💬'),

		title(`Talk One-on-One`),
		h4(`<span>Release 0.52.0</span><span>December 8, 2025</span>`),
		text(''),
		text('Direct Channels are here – the missing piece of the chatting puzzle. You can now communicate with someone directly. As simple as that.'),
		text('And because we never ship just one thing, this release comes packed with usability upgrades across the app.'),
		img(`52/1.png`),
		text(''),

		h1(`Direct Channels`),
		text('Sometimes you just need to talk to one person. Privately.'),
		text('Direct Channel is a one-on-one connection between two members, where both participants have equal access: no admin, no hierarchy. Just a place for quick check-ins, sharing an object, or whispering memes in the middle of a project. It’s simple, it’s lightweight, and it just works.'),
		img(`52/2.png`),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		text(`<b>Vault Stripe View</b>`),
		text(`The Vault now supports a more compact, icon-only mode. Drag the edge of the Vault area to adjust its width: once it becomes narrow enough, the view switches to an icon-only layout, giving you more room for your content.`),
		img(`52/3.png`),
		text(``),

		text(`<b>Manage Widget Sections</b>`),
		text(`Find "Customize Sidebar" in the Channel context menu or hover over the three-dots menus next to Widget sections. From there, you can reorder & hide the <i>Pinned</i>, <i>Recently edited</i>, and <i>Objects</i> sections. `),
		text(`For <i>Recently edited</i>, you can also choose whether it shows changes made by any member or only by you.`),
		text(``),

		text(`<b>Dragging Objects Between Views</b>`),
		text(`You can now drag an Object between views inside the same Query or Collection. When you drop it into another view, its properties update to match that view’s filters, just like when you create a new Object directly in that view. `),
		text(``),

		text(`<b>Magnetic Stops for Resizing Images</b>`),
		text(`Resizing multiple images on a page is now easier and more precise. When you resize images, the width handle snaps to visual "magnetic" stops so you can quickly align them to the same size.`),
		text(``),

		text(`<b>Copy Images to Clipboard</b>`),
		text(`You can now copy images directly from blocks in the Editor, or from the Object menu when media is opened in full screen.`),
		text(``),

		text(`<b>Bandcamp Integration</b>`),
		text(`Added support for embedding the Bandcamp player as a block in the Editor. Many thanks to @${link('https://github.com/anyproto/anytype-ts/pull/1757', 'imrehg')} for the contribution!`),
		text(``),

		text(`<b>Apple Music Integration</b>`),
		text(`Added support for embedding the Apple Music player as a block in the Editor. Many thanks to @${link('https://github.com/anyproto/anytype-ts/pull/1791', 'jhoffi')} for the contribution!`),
		text(``),

		text(`<b>Delete/Leave Space from Vault</b>`),
		text(`The "Delete Space" and "Leave Space" actions are now available directly from the Vault context menu. Right-click a Space or Chat icon to access them.`),
		text(``),

		h2(`Bug Fixes`),
		text(``),

		toggle(`<b>Chat & Messaging</b>`, [
			bullet(`Opening an object from chat now follows the "Open objects in fullscreen" account setting.`),
			bullet(`After opening a file from a chat link, both the mouse back button and the UI back control reliably return to the chat.`),
			bullet(`Selecting text inside an attached object in a chat no longer opens an object unintentionally.`),
			bullet(`Clicking "Play" in a video preview automatically starts the video upon opening in full screen.`),
			bullet(`Wide images keep their layout when editing a message.`),
		]),

		toggle(`<b>Editor & Blocks</b>`, [
			bullet(`Adding a new line above or below an embed block no longer causes the embed to flicker or the page to jump. Thanks to @${link('https://community.anytype.io/t/29052', 'Cephalo')}!`),
			bullet(`Inserting Unicode or emoji separators between links no longer appends an extra letter to the following link. Thanks to @${link('https://community.anytype.io/t/28863', 'cicko')}!`),
		]),


		toggle(`<b>Widget Sidebar</b>`, [
			bullet(`Newly created Types and their Objects now appear immediately in the Objects Widget without requiring an app restart. Thanks to @${link('https://community.anytype.io/t/29519', 'Hexara')}!`),
			bullet(`Fixed a visual bug where Widget header buttons could blink during animations.`),
		]),


		toggle(`<b>Objects & Views</b>`, [
			bullet(`In zoomed-out Graph views, Object hover popups now appear directly at the cursor and no longer get stuck at the left edge of the screen. Thanks to @${link('https://community.anytype.io/t/29388', 'Code-Jack')}!`),
			bullet(`Fixed an issue where opening a Collection from Graph in a modal and expanding it to full window could remove the New button and break view layout switching. Thanks to @${link('https://community.anytype.io/t/29417', 'Code-Jack')}!`),
			bullet(`Mentioned-object previews now close as soon as the cursor leaves the mention’s actual bounds. Thanks to @${link('https://community.anytype.io/t/29378', 'sandyeggo')}!`),
			bullet(`Fixed inconsistent drag-and-drop behaviour in Kanban.`),
		]),


		toggle(`<b>Miscellaneous</b>`, [
			bullet(`Editing a Type correctly displays and pre-fills the current Type name and title.`),
			bullet(`The Published Date column on My Sites now fully displays long date formats without truncation.`),
			bullet(`Clicking a Space invite link when you’re already a member now jumps straight into that Space.`),
		]),
	];
};
