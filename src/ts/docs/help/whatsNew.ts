import { I, J, U, keyboard } from 'Lib';

export default () => {

	const version = U.Common.getElectron().version?.app;
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const shift = keyboard.shiftSymbol();
	const hl = (t: string) => `<span class="highlight">${t}</span>`;
	const block = (style: I.TextStyle, text: string, align?: I.BlockHAlign, icon?: string) => ({ style, text, align, icon });
	const title = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Title, t, align);
	const h1 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header1, t, align);
	const h2 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header2, t, align);
	const h3 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header3, t, align);
	const text = (t: string) => block(I.TextStyle.Paragraph, t);
	const callout = (t: string, icon: string) => block(I.TextStyle.Callout, t, I.BlockHAlign.Left, icon);
	const bullet = (t: string) => block(I.TextStyle.Bulleted, t);
	const caption = (t: string) => block(I.TextStyle.Paragraph, `<i>${t}</i>`, I.BlockHAlign.Center);
	const div = () => ({ type: I.BlockType.Div, style: I.DivStyle.Dot });
	const video = (src: string, c?: string) => text(`<video src="${J.Url.cdn}/img/help/${src}?v=${version}" loop autoplay class="full ${c || ''}" />`);
	const img = (src: string, c?: string) => text(`<img src="${J.Url.cdn}/img/help/${src}?v=${version}" class="full ${c || ''}" />`);
	const link = (url: string, t: string) => `<a href="${url}">${t}</a>`;

	return [
		{ type: I.BlockType.IconPage, icon: '👋' },
		//{ type: I.BlockType.IconPage, icon: '🎄' },

		title(`Desktop 0.47.4 Released!`),
		text(''),
		text('At Anytype, we’re committed to true user ownership of data. As a local first software, your information stays with you, independent and accessible for the long term. We want to bring our community a strong sense of reassurance, which is why we’ve made our Markdown support more robust: so your notes and ideas can go wherever you need, now and far into the future.'),
		text(''),

		h2(`Markdown Export: Properties and Types`),
		text(`Exporting your data to Markdown now includes properties and types. This ensures your ${hl('.md')} backups are more complete and your information remains organized, without losing important context. Since Markdown is the most widely supported format across software, it’s a reliable way to keep your data portable and under your control.`),
		text(''),

		h2(`Markdown Import: Smoother Transitions`),
		text('Markdown import also supports properties and types, improving the way you bring your data back into Anytype. This update includes support for <b>importing properties from Obsidian</b> and simplifies moving your notes and projects from applications like Evernote, Bear and others, with less need for manual setup.'),
		text(''),
		text('This is a new iteration and it’s not the last. Your feedback guides us, please let us know what works and what’s missing. More improvements are on the way!'),

		text(''),

		div(),
		// --------------------------------------------//

		title(`Desktop 0.47.0 Released!`),
		text(''),
		text('This update brings a range of improvements across the app, from visual refinements to quality of life updates, all designed to make your experience smoother and more consistent. In the meantime, we’re continuing our ongoing work to support data ownership, easier backups and long-term resilience.'),
		text(''),

		h2(`Highlights`),

		h3(`Import Improvements`),
		text(`Obsidian import supports ${hl('[[double bracket]]')} links, allowing internal links to be correctly converted to object links in Anytype. The ${hl('[[')} shortcut is also supported inside Anytype for linking between objects.`),
		img(`47/1.png`, 'c70'),
		text(``),


		h3(`Sidebar Design Refresh`),
		text(`We’ve refreshed the Sidebar with several design and usability improvements:`),
		bullet(`The <b>${hl('New')} button</b> for creating objects has a new design`),
		bullet(`<b>Favorites</b> have been renamed to <b>Pinned</b>, with a new icon and updated empty state`),
		bullet(`<b>Help menu ${hl('?')}</b> has been moved to the bottom of the sidebar`),
		bullet(`The <b>Bottom bar</b> now has a transparent gradient for a smoother visual transition`),
		img(`47/2.png`, 'c70'),
		text(``),

		h3('<b>Type Links in Graph</b>'),
		text('New setting to connect Types to Objects has been added to the Graph.'),
		img(`47/5.png`, 'c70'),
		text(''),

		h2(`Quality of Life Improvements`),
		text(''),

		text('<b>Quick Access to Templates</b>'),
		text(`You can now manage templates directly from the Edit Type menu, accessible from every object.`),
		img(`47/3.png`, 'c70'),
		text(''),

		text('<b>Header Properties Column View</b>'),
		text('Added column view for the properties displayed in the object header, which you can switch to from the line view when editing a Type layout.'),
		img(`47/4.png`, 'c70'),
		text(''),

		text('<b>Bookmark Paste Menu</b>'),
		text(`Creating a new object with the Bookmark type now instantly opens the ${hl('Paste link')} menu.`),
		img(`47/6.png`, 'c40'),
		text(''),

		text('<b>Add to Pinned</b>'),
		text(`The new ${hl('Add to Pinned')} button in the navigation bar lets you quickly save objects to the Pinned widget (formerly Favorites).`),
		img(`47/7.png`, 'c40'),
		text(''),

		text('<b>Draw.io Embeds</b>'),
		text(`Draw.io diagrams are now supported in embed blocks. Big thanks to @${link('https://github.com/anyproto/anytype-ts/pull/1399', 'Shampra')} for the contribution!`),
		text(''),

		text('<b>Improved Sorting Logic</b>'),
		text('Ascending sort now places empty values at the end by default.'),
		text(''),

		text('<b>Type Page Default View</b>'),
		text('The Type page was updated to use List view by default.'),
		text(''),

		text('<b>Calendar Drag and Drop</b>'),
		text('You can now drag and drop objects in the Calendar when using a custom date property.'),
		text(''),

		text('<b>New Shortcuts</b>'),
		text('Added new shortcuts to create Widgets, open Space settings, Pin / Unpin objects, open Bin and more.'),
		text(''),

		text('<b>Access Pop-up Update</b>'),
		text('Updated the "No access to this space" pop-up with clearer messaging and a new icon.'),
		text(''),

		text('<b>Space Name and Description Limits</b>'),
		text('Set character limits for Space name (50) and description (200).'),
		text(''),

		h2(`Bug Fixes`),
		bullet(`Addressed an issue where using Raycast snippets in empty object titles on macOS added an unintended new line. Thanks to @${link('https://community.anytype.io/t/raycast-snippet-issue-in-object-titles-macos/27209', 'Simon Lanz')}!`),
		bullet(`Fixed a bug where using a reassigned CapsLock key caused selected blocks to be deleted instead of copied. Thanks to @${link('https://community.anytype.io/t/cant-copy-blocks-with-reasigned-capslock/26603', 'pytat0')}!`),
		bullet(`Fixed a macOS issue where the Finder window didn’t close automatically after uploading a Space profile image. Thanks to @${link('https://community.anytype.io/t/uploading-image-to-space-profile/23537', 'Khang')}!`),
		bullet(`Fixed an issue where text selection in the Editor would break when autoscroll was triggered, causing the start and end points to shift unexpectedly. Thanks to @${link('https://community.anytype.io/t/marking-a-text-area-with-the-mouse-autoscroll-causes-problem/18769', 'Code-Jack')}!`),
		bullet(`Text selection now works correctly in formatted blocks: highlighting part of a bold, italic or underlined string no longer selects the entire block. Thanks again to @${link('https://community.anytype.io/t/formatted-substring-marking-with-the-mouse-does-always-select-the-whole-block/24586', 'Code-Jack')}!`),
		bullet(`Fixed a visual glitch where a horizontal line briefly appeared at the top of Queries and Collections when switching from another page. Thanks to @${link('https://community.anytype.io/t/weird-horizontal-line-glitch-on-top-of-sets-and-collections/24852', 'Divinity')}!`),
		bullet(`The text cursor no longer disappears when clicking on or near emphasized text (such as underlined or italic) from a block in the Editor. Thanks to @${link('https://community.anytype.io/t/cursor-disappears-when-clicking-into-blocks-on-emphasis-text/26381', 'zewwo')}!`),
		bullet(`Newly added properties now appear in the menu when selecting which properties to display in a view on the Type page. Thanks to @${link('https://community.anytype.io/t/added-properties-dont-show-up-in-built-in-object-list-of-type/27606', 'r0the')}!`),
		bullet(`Locked objects fully prevent all changes to Properties. Thanks to @${link('https://community.anytype.io/t/its-possible-to-change-properties-of-an-object-on-a-locked-page/27909', 'VisualNotes')}!`),
		bullet(`Fixed a bug where the Description field was incorrectly shown in the header. Thanks to @${link('https://community.anytype.io/t/description-stuck-in-header/28007', 'sandyeggo')}!`),
		bullet(`Fixed an issue where the "Name" property was missing in Queries created via widgets. Thanks to @${link('https://community.anytype.io/t/name-property-not-seen-in-sets-created-through-widgets/27656', 'HarshaRaj')} & @${link('https://community.anytype.io/t/name-property-not-displayed-in-grid-and-gallery-views-in-old-spaces/27949', 'BadWorld')}!`),
		bullet(`Improved performance when switching between Grid and Gallery views with a large number of objects in the Query. Transitions are now smoother and more responsive. Thanks for the detailed report @${link('https://community.anytype.io/t/15-seconds-lag-while-switching-from-a-giant-grid-view-to-a-small-gallery-view/28017', 'Code-Jack')}!`),

		bullet(`Clearing date properties works correctly when using bulk edit in Grid view. Thanks to @${link('https://community.anytype.io/t/date-relations-cant-be-cleared-when-doing-a-bulk-edit-of-the-relation-in-a-grid-view/27432', 'garyp')}!`),
		bullet(`Search now works correctly in Queries that were previously Sets before the new structure migration. Thanks to @${link('https://community.anytype.io/t/search-broken-for-queries/27467', 'stendekoniko')}!`),
		bullet(`Changing bullets to checkboxes now correctly applies to all selected items, including multi-level lists. Thanks to @${link('https://community.anytype.io/t/changing-bullets-to-checkboxes-in-bulk-doesnt-change-whole-selection/27825', 'spiffytech')}!`),
		bullet(`Resolved an issue where some Queries could appear reset. Thanks to @${link('https://community.anytype.io/t/some-queries-are-reset-after-updating-to-0-46-21-beta/27845', 'boots')}!`),
		bullet(`Resolved an issue where some Templates were not displayed for certain Types. Thanks again to @${link('https://community.anytype.io/t/loss-of-templates-after-updating-to-0-46-21-beta/27843', 'boots')}!`),
		bullet(`Fixed a bug where some objects could appear without a title and showed as "Untitled".`),

		bullet(`Vertical videos maintain their correct orientation when resized.`),
		bullet(`Opening a Property in the settings no longer causes the title bar to flicker when the window is narrow.`),
		bullet(`Fixed an issue where switching Spaces after unlocking the app with a PIN code didn’t work on the first attempt.`),
		bullet(`Fixed drag-and-drop behavior for Properties in the ${hl('Edit Type')} menu within the modal window.`),
		bullet(`Fixed an issue where the Name column in a Query could shift when rearranging other columns in the modal window.`),
		bullet(`Lock icon is no longer shown on Types for users with Viewer access.`),
		bullet(`Profile icons now display with the correct background in Widgets.`),
		bullet(`Objects permanently deleted via the sync menu now close automatically.`),
		bullet(`Switching to the backlinks in Global Search no longer causes the selection to reset while navigating results with the keyboard.`),
		bullet(`Navigation back works correctly after clicking a link to an object in the Editor.`),
		bullet(`Switching to Kanban in view Settings no longer causes layout issues in the Settings menu.`),
		bullet(`Long titles from Notes are now correctly displayed in the top navigation bar.`),
		bullet(`Fixed an issue where Select and Multi-select property searches didn’t work on locked pages.`),

		text(''),

		div(),
		// --------------------------------------------//

		title(`Desktop 0.46.6 Released!`),
		text(''),
		text('This release marks an exciting and long-awaited moment in Anytype’s evolution: the <b>first iteration of our Local API</b> is here! It opens up powerful new possibilities for an ecosystem of plugins, automations and third-party integrations.'),
		text('Alongside this launch, we’re polishing the new structure around Types, delivering performance fixes and enhancing workflows with an upgraded Raycast extension.'),
		text(''),

		h2(`Anytype Local API (Developer Preview)`),
		text(''),
		text('Our API is now available and directly included with the desktop app, running entirely on localhost. It operates fully offline, meaning you can build and use integrations without any cloud dependencies - even while flying!'),
		text('This initial release targets developers, and we’re eager to see what the community creates with it!'),
		text(''),

		h3(`Key Highlights`),
		bullet(`<b>Secure Authentication</b>: Authenticate once via a 4-digit challenge in the desktop app, generating an API key. This key acts as a bearer token to authenticate subsequent requests. Additionally, API keys can be managed and generated directly through the desktop client's settings, making it easy to share keys with third-party integrations.`),
		bullet(`<b>Comprehensive Documentation</b>: The OpenAPI specification and full documentation are available on our new ${link('https://developers.anytype.io/', 'Developer Portal')}.`),
		bullet(`<b>Robust API Capabilities</b>: Endpoints offer core Anytype functionality: creating objects, editing, querying and much more.`),
		bullet(`<b>Growing Developer Ecosystem</b>: Early SDKs and community-driven tools are already underway: Python and Go clients, MCP server and Raycast extension.`),
		text(''),

		callout(`<b>Important Security Notice</b>: By providing an API key or using extensions, you grant limited access to your Anytype vault, enabling operations such as editing or deleting objects. Ensure you <b>use only trusted extensions</b>.`, '⚠️'),
		text(''),

		h2(`Raycast Extension Updates`),
		text(''),
		text('As a companion to our Local API, we’ve just shipped great improvements for our Raycast extension.'),
		text('Here’s what’s new:'),
		bullet(`<b>Quickly create</b> new spaces, objects, types, properties, or tags with the shortcut ${hl('CMD+N')} while browsing your spaces.`),
		bullet(`<b>Easily edit</b> your selected items (spaces, objects, types, properties or tags) using ${hl('CMD+E')}.`),
		bullet(`<b>Conveniently add objects</b> to lists either through the new ${hl('Add object to list')} command or directly from the context menu ${hl('CMD+K')}.`),
		img(`46.x/1.jpg`, 'c70'),
		text(''),

		h2(`Quality of Life Improvements`),
		text(''),

		text('<b>Extra safety step for deleting</b>'),
		text('To help prevent accidental deletions, space removal now includes an added confirmation layer.'),
		text(''),

		text('<b>Improved date interactions in widgets</b>'),
		text('Added an expand icon and helpful hover cues in calendar widgets to make date menus more discoverable.'),
		text(''),


		text('<b>Optimized widget behaviour</b>'),
		text('Widgets are now preserved when switching between spaces, and adding new objects works more smoothly.'),
		text(''),


		text('<b>Adjusted property picker in Query menu</b>'),
		text('Minor UX improvements for a more intuitive setup.'),
		text(''),

		h2(`Bug Fixes`),
		bullet(`Fixed an issue where some objects were not being indexed by the full-text search engine.`),
		bullet(`Resolved a bug causing type objects to not persist after app restart.`),
		bullet(`Fixed text deletion in the Description field.`),
		bullet(`Fixed misplaced volume bar. Thanks for flagging it, @${link('https://community.anytype.io/t/volume-bar-is-misplaced/27771/1', 'Shoyo')}!`),
		bullet(`Typing in Date fields works as expected (<i>no more 31.12.1969 issues!</i>). Thanks for the heads-up, @${link('https://community.anytype.io/t/can-t-manually-type-in-a-date/27724', 'natanyberry')}!`),
		bullet(`Icons now appear correctly in Queries.`),
		bullet(`Kanban views display correctly in widgets.`),
		bullet(`Fixed cursor jumping to the beginning of the line in the type creation panel.`),
		bullet(`Fixed objects displaying in Kanban when opened in modal window.`),
		bullet(`Improved drag-and-drop and block insertion behaviour in column layouts. Thanks for reporting, @${link('https://community.anytype.io/t/two-bugs-with-content-in-columns-on-a-page-solved/27337', 'VisualNotes')}!`),
		bullet(`Fixed incorrect pop-up link positioning in text.`),
		bullet(`Improved performance when renaming images in Gallery view. Thanks to @${link('https://community.anytype.io/t/its-a-pain-to-rename-pictures-in-the-gallery-view-if-you-have-lots-of-objects-loaded/24461', 'Code-Jack')}!`),
		bullet(`Fixed issue preventing blocks from being moved into the end position of a toggle. Yet another great catch from @${link('https://community.anytype.io/t/toggles-impossible-to-move-a-block-from-outside-into-the-toggle-at-the-end-position/27715', 'Code-Jack')}!`),
		bullet(`Unable to delete bullet points – resolved.`),
		bullet(`Multi-line selection is no longer replaced by the key-name (e.g. ${hl('PageDown')}).`),
		bullet(`Opening Preferences from a modal window no longer causes a blank screen. Thanks for catching it, @${link('https://community.anytype.io/t/modal-open-open-preferences-all-blank/27801', 'krst')}!`),
		bullet(`Fixed severe scroll jump when switching views in inline Queries.`),
		bullet(`Empty names no longer appear when the singular form of a Type name is unset.`),
		bullet(`Fixed issue preventing properties from being placed at the first or last position within a section in the panel.`),
		text(''),

		div(),
		// --------------------------------------------//

		title(`Desktop 0.46.0 Released!`),
		text(''),
		text('Hi dear Anytypers!'),
		text(`We're thrilled to announce a major update and introduce a fundamental shift in Anytype's core organizing structure. We\'re streamlining our user experience by eliminating the current behavior and bringing a clearer, more intuitive way to use <b>Types</b>.`),
		text('The new Anytype reimagine Types. Now, you can define layouts and properties within a Type and all associated objects will automatically inherit these settings.'),
		text('Along with this transformation, we’ve included many new improvements and bug fixes.'),
		text(`Add objects to lists using the new "Add object to list" command, or from the context menu.`),

		h2(`Meet the new Anytype`),
		text(``),

		bullet(`<b>Relations</b> are now called <b>Properties</b>.`),
		bullet(`<b>Sets</b> are now called <b>Queries</b>.`),
		bullet(`<b>Types</b> are now the primary structure of objects, determining all attached properties.`),
		bullet(`<b>Properties</b> that were previously set at the object level are now defined by Type, including both featured properties, such as backlinks or tags, and specific ones, such as date or source.`),
		bullet(`<b>Templates</b> will now focus only on the content of objects, primarily organizing blocks. Adding blocks, setting a cover or assigning an icon are now key aspects of creating a template. Properties are managed separately at the Type level. Changing a property at the Type level will affect all objects of that Type.`),
		bullet(`<b>Layout</b> of an object is also defined by its Type. For example, all Task objects will follow the same layout, and you won’t be able to customize them individually. If you need a different layout with a center header position or increased width, you should create a new Type.`),
		video(`46/1.mp4`),
		text(``),

		h3(`Queries for Types`),
		text(`Each Type page now comes with a built-in inline Query, making it easier to access and organize related objects.`),
		text(``),

		h3(`Templates for Queries and Collections`),
		text(`You can save and reuse your configurations, including view settings, applied filters, cover and icon. Just like with regular objects, select ${hl('Use as Template')} from the three-dots menu or add templates via the Query or Collection Type page.`),
		text(``),

		h3(`Right Sidebar and Set Up Menu`),
		text(`The <b>Properties</b> icon lets you view, add and remove values to the properties of a specific object. `),
		text(`The ${hl('Edit type')} button allows you to manage the properties of its Type. From there you can add, remove and organize them into different sections:`),
		bullet(`<b>Header</b> properties appear in the header part of every object of that Type.`),
		bullet(`<b>Sidebar</b> properties are the ones you choose to show in the Properties panel.`),
		bullet(`<b>Hidden</b> properties live under the ${hl('Show more')} button.`),
		bullet(`<b>Local</b> properties: After updating to the new version or when changing an object’s Type, some properties (formerly relations) might not match the new Type’s predefined structure. Properties that were once unique to individual objects will now appear as local properties. You can either unify them by adding them to the Type or create a new Type, if you need.`),
		text(``),
		text(``),

		h2(`Quality of Life Improvements`),
		text(``),

		h3(`New Icons for Types`),
		text(`Custom icons can now be assigned at the Type level, making it easier to identify whether you are working with Types or Objects. You can now choose from a dedicated collection of hundreds of fresh icons for a consistent and structured look.`),
		img(`46/2.png`, 'c70'),
		text(``),

		h3(`Type Widgets`),
		text(`You can now add widgets based on object Types, making it easier to organize and display relevant content. We’ve also introduced <b>Automatic Widget</b> creation to help users seamlessly discover and adopt widgets, creating a more personalized and intuitive workspace.`),
		bullet(`When you create the first object of a Type, a dedicated widget is automatically added to your sidebar. This widget displays all objects of that Type within the space, giving you quick access without any extra setup.`),
		bullet(`<b>Automatic Widgets are optional</b> – you can remove any widget at any time via ${hl('Edit')} button or by right-clicking. Once removed, they won’t reappear unless manually added. Automatic widget creation can also be disabled in Settings.`),
		img(`46/3.png`, 'c70'),
		text(``),

		h3(`Settings Update`),
		text(`Both General and Space Settings have been updated to a full-page layout instead of a pop-up, with sections now located in the left sidebar. `),
		text(`As part of this update, Types and Properties now live in your Space Settings, bringing everything related to your space configuration into one place.`),
		img(`46/4.png`, 'c70'),
		text(``),

		h3(`Custom Shortcuts`),
		text(`We've expanded the number of actions available for keyboard shortcuts, giving you more capabilities than ever before. Most shortcuts are customizable, and certain actions support two different key combinations for more flexibility.`),
		img(`46/5.png`, 'c70'),
		text(``),

		h3(`Raycast Extension Updates`),
		text(`We've introduced several enhancements based on your requests and feedback, plus Anytype for Raycast is now an <b>AI&nbsp;Extension</b> – search through spaces and objects using natural language or create new ones just by instructing ${hl('@anytype')}.`),
		bullet(`<b>Improved Pinning & Navigation</b>: Pin objects, types, members and spaces for quicker access. Objects of a certain Type now appear below their templates for better organization.`),
		bullet(`<b>Better Collection Management</b>: Create objects directly within collections and browse collection items with ease.`),
		bullet(`<b>Customization & Visibility</b>: Choose ${hl('Open Object in Anytype')} as the default action, show custom properties in the Detail sidebar, toggle metadata in object details and apply templates when creating new objects.`),
		img(`46/6.png`, 'c50'),

		h3(`Choose your Week Start Day`),
		text(`You can now choose whether your week starts on Sunday or Monday. Head to your updated settings to make the switch in the date picker.`),
		text(``),

		h3(`All Objects as a System Widget`),
		text(`The All Objects section is now available as a system widget that can be added or removed from the sidebar. While core functionality like sorting and search remains the same, Types and Properties are now managed from your Space Settings.`),
		text(``),

		h3(`Use [[ to Link in Editor`),
		text(`The editor now supports the ${hl('[[')} syntax for linking. This Markdown pattern works similarly to ${hl('@mention')}, allowing you to reference other objects.`),
		text(``),

		h3(`HTTPS Links for Objects`),
		text(`You can now copy an HTTPS link for any object via the three-dots menu by selecting ${hl('Copy Link')}. Users without the Anytype app can click on these links to download the app and access the object after installation. When opened inside the App, these links directly open the object without any redirection.`),
		text(``),

		h3(`Web Publishing Updates`),
		text(`We continue to refine and optimize the rendering process and have also improved support for layouts including alignment, width and featured properties to align with the new Primitives structure.`),
		text(``),

		h3(`Alert when Switching to the Release Channel`),
		text(`To prevent confusion when switching the release channel, an alert has been added. This alert clarifies that changing the release channel will store data in a separate sub-directory, which may cause unsynced files or objects to become inaccessible.`),
		text(``),

		h3(`Drag-to-Select on Graph Page`),
		text(`Added a drag-to-select feature to the graph page, making it easier to select multiple items at once. Now you can grab and move a bunch of objects with just a simple drag. Many thanks for the contribution to @${link('https://github.com/anyproto/anytype-ts/pull/1211', 'ShirayukiRin')}!`),
		text(``),

		h3(`Type Filters in Graph`),
		text(`In addition to existing clustering by Type, you can now filter the Graph to display only selected object Types – helping you focus on exactly what you need.`),
		text(``),

		h3(`fa-IR Language`),
		text(`Added support for Persian (fa-IR) language as part of our right-to-left language expansion.`),
		text(``),
		text(``),

		h2(`Bug fixes`),
		bullet(`Multiple open windows no longer revert to the login screen or display a black screen after the device resumes from suspension. Thanks to @${link('https://community.anytype.io/t/black-screen-multiple-windows-after-suspend/25878', 'krst')} & @${link('https://community.anytype.io/t/some-windows-returned-to-login-screen/20865', 'C.c')}!`),
		bullet(`Default Object Type remains set. This issue was detected again and resolved after fixing the initialization problem. Thanks for the heads-up, @${link('https://community.anytype.io/t/default-object-type-keeps-changing-to-page/25748', 'zma17')}!`),
		bullet(`Fixed an issue where the cursor keys could stop working after editing templates in Sets.`),
		bullet(`The pop-up menu when adding a widget closes correctly.`),
		bullet(`Fixed the Grid’s sum function to prevent unnecessary decimal places from appearing in calculations. Thanks for the feedback, @${link('https://community.anytype.io/t/calculating-a-sum-shows-one-zero-too-much/26363', 'Code-Jack')}!`),
		bullet(`Fixed an issue where checking a checkbox would remove LaTeX formatting within the block. Thanks, @${link('https://community.anytype.io/t/inline-latex-breaks-when-placed-in-a-checkbox-that-is-then-checked/26610', 'personnotman')}!`),
		bullet(`Inline LaTeX now correctly renders ${hl('$\\mathbb R$')}, which previously did not display while other letters worked. Double thanks, @${link('https://community.anytype.io/t/inline-latex-mathbb-r-doesnt-work/26781', 'personnotman')}!`),
		bullet(`The ${hl('Show menu bar')} setting works correctly. Thanks, @${link('https://community.anytype.io/t/settings-show-menu-bar-works-incorrectly/25475', 'AndCycle')}!`),
		bullet(`${hl(`${'&#8984;'} + W`)} now correctly closes only the active window on Mac. Thanks, @${link('https://community.anytype.io/t/command-w-closes-the-app-instead-of-the-active-window-mac/23099', 'Kite')}!`),
		bullet(`Files added to Favorites are properly displayed in the widget.`),
		bullet(`Embed Kroki Graphs now scale correctly, preventing them from being cut off. Thanks, @${link('https://community.anytype.io/t/kroki-graphs-cutoff-instead-of-scaled/26875', 'bartl')}!`),
		bullet(`The ${hl('Create new Object')} button in the list view widget for Kanban boards is now working correctly. Thanks, @${link('https://community.anytype.io/t/button-create-new-object-in-list-view-widget-for-kanban-boards-stopped-working-in-anytype-desktop-0-45/26916', 'Self-Perfection')}!`),
		bullet(`The nested long table, when moved inside a column, now displays correctly.`),
		bullet(`Fixed the ${hl('Back to Dashboard')} button on deleted Objects.`),
		bullet(`Fixed hyperlinks in PDF export.`),
		bullet(`Embedded links in Bookmarks are now parsed and rendered correctly when an Object is exported to PDF.`),
		bullet(`The Audio Player timeline is now resized properly in exported PDF.`),
		bullet(`Tables in multiple-column layouts align properly in resized windows without overlapping adjacent columns. Thanks to @${link('https://community.anytype.io/t/issue-with-the-table-in-resized-window/19901', 'cpobharat')}!`),
		bullet(`All Objects panel now remembers the last scroll position when reopened. Thanks, @${link('https://community.anytype.io/t/all-objects-doesnt-remember-the-last-scroll-position/24548', 'Code-Jack')}!`),
		bullet(`Corrected forward navigation in All Objects to be consistently clickable.`),
		bullet(`Horizontal scrolling in All Objects tabs works consistently with external mice.`),
		bullet(`All Objects correctly display the selected tab when opened.`),
		bullet(`Fixed filters in Graph, ensuring Objects with bi-directional links or relations are displayed correctly when the corresponding ${hl('Show on Graph')} option is enabled. Thanks for catching this, @${link('https://community.anytype.io/t/show-relations-filter-from-the-graph-doesnt-work-properly/25196', 'HoneycombGlasses')}!`),
		bullet(`Moving a block out of the Anytype window no longer causes the view to scroll upwards.`),
		bullet(`The ${hl('Create Object')} button in the widget now correctly links the newly created object to the target one.`),
		bullet(`Relations are not displayed anymore after they have been moved to the Bin in the relations panel. Thanks for contributing, @${link('https://github.com/anyproto/anytype-ts/pull/1206', 'ShirayukiRin')}!`),
		bullet(`The Drag-to-Select box has been improved to ensure it displays correctly in sets and collections. Additionally, it now appears when selecting a single block in the editor. Thanks again, @${link('https://github.com/anyproto/anytype-ts/pull/1221', 'ShirayukiRin')}!`),
		bullet(`Fixed incorrect input direction switching on Armenian keyboard.`),
		bullet(`Deleted objects are correctly displayed in the Bin. Thanks, @${link('https://community.anytype.io/t/deleted-objects-are-not-displayed-in-the-bin/27083', 'boots')}!`),
		bullet(`The last active Space opens when launching the App and after refresh. Thanks for flagging this, @${link('https://community.anytype.io/t/last-used-space-is-not-the-space-shown-at-application-startup-when-there-are-multiple-instances-of-anytype/27097', 'C.c')}!`),
		bullet(`Exporting to PDF now consistently reflects the current color scheme in dark mode. If you need an object to be exported as a standard PDF document with a white background while dark mode is enabled, you can use the Printing option instead. Appreciate your report, @${link('https://community.anytype.io/t/exporting-to-pdf-in-dark-mode-creates-different-and-unexpected-results/26235', 'DennisG')}!`),
		bullet(`The calendar selection menu no longer moves when switching months. Thanks to @${link('https://community.anytype.io/t/calendar-selection-menu-moves-when-changing-months/26982', 'Magiccheese1')}!`),

		div(),
		// --------------------------------------------//

		title(`Desktop 0.45.0 Released!`),
		text('Hello Anytypers! We’re excited to share a major update you’ve been eagerly awaiting. Version 0.45.0 introduces Web Publishing, a Raycast extension, RTL support, and a host of quality-of-life improvements — all inspired by your requests and feedback. Thank you for helping us shape Anytype into a friendlier, more powerful tool for everyone.'),
		text(''),

		h2(`Highlights`),
		h3(`Web Publishing`),
		text(`You can now publish Objects as static web pages (HTTPS links) on your personal subdomain if you have *any name. These pages are uploaded to our servers as unencrypted HTML files.`),
		text(`This is an early version — mobile optimization, linked Objects, and blocks like Sets and Collections aren’t supported yet. Multi-page publishing and other enhancements are on the way, and we’d love your feedback to guide these improvements.`),
		img(`45/2.png`),
		text(``),

		h3(`Redesigned Space Panel & Navigation`),
		text(`We’ve relocated the navigation controls to the Space Panel for a smoother experience. You can now navigate back and forth, search for Objects, and create new ones from a familiar place.`),
		text(`Pro tip: if your sidebar is hidden, press ${hl(`${cmd} + S`)} to open Global Search or ${hl(`${cmd} + N`)} to create a new Object.`),
		img(`45/1.png`),
		text(``),

		h3(`Raycast Extension (macOS)`),
		text(`Our long-awaited API is beginning to take shape! The first step is Raycast integration, allowing you to create, read, and delete Spaces, Objects, and Types, as well as search across them, all from Raycast on macOS.`),
		text(`While this initial version focuses on a basic set of features, we’re laying the groundwork for an open API that will eventually support bulk import and export, NoCode tools, and more integrations. We’re excited to see what you’ll build!`),
		text(`${link('https://www.raycast.com/any/anytype', 'Install the Raycast Extension here')}`),
		img(`45/3.png`),
		text(``),

		h3(`RTL Support`),
		text(`We’re happy to introduce right-to-left language support! This first iteration might need some extra polish, so your feedback is invaluable. Let us know what works and what needs a bit more attention.`),
		video(`45/4.mp4`),
		text(``),

		h2(`Quality-of-Life`),
		text(``),
		h3(`Add Existing Objects to a Collection`),
		text(`We’ve added an option to add existing Objects into a Collection. Look for it in the updated arrow menu alongside other content settings.`),
		img(`45/5.png`, `c50`),
		text(``),

		h3(`Horizontal Alignment in Grid Layout`),
		text(`Columns in the Grid layout can now be aligned left, center, or right.`),
		img(`45/6.png`, `c60`),
		text(``),

		h3(`Simplified Widget Settings Menu`),
		bullet(`Appearance options are now limited to changing the widget’s view (Compact List, List, View, Link).`),
		bullet(`The "Number of Objects" setting has moved to its own section.`),
		img(`45/7.png`, `c40`),
		text(``),

		h3(`Clickable Links in Kroki Diagrams`),
		text(`Kroki embed blocks now support links within diagrams. Thanks to @${link('https://community.anytype.io/t/kroki-links-are-not-usable/25543', 'siousu')} for the suggestion!`),
		text(``),

		h3(`Improved Dark Mode Text Selection`),
		text(`We tweaked the selection color for better visibility. Shout-out to @${link('https://community.anytype.io/t/selected-text-background-color-on-a-given-object-heavily-dependent-on-monitor-settings/25509', 'kermit_frog')} for flagging this!`),
		text(``),

		h3(`Inline Set Header Resize Adjustments`),
		text(`Inline Set headers now adapt when resizing to keep controls from overlapping neighboring blocks.`),
		text(``),

		h3(`Better Image Pasting on macOS Safari`),
		text(`Images copied from Safari will now paste into the object editor as files instead of URLs.`),
		text(``),

		h3(`Standardized QR Code Appearance`),
		text(`All QR codes in Anytype now follow a consistent style.`),
		text(``),

		h3(`Improved LaTeX Support`),
		text(`Inline LaTeX is now rendered in the Table of Contents block and in link blocks, including titles and descriptions. Thanks to @${link('https://community.anytype.io/t/inline-latex-not-applied-in-table-of-contents/24056', 'mewald')}!`),
		text(``),

		h2(`Bug Fixes`),
		bullet(`Making changes to Kanban in the Version History is now disabled. Thanks, @${link('https://community.anytype.io/t/making-changes-to-kanban-in-version-history-breaks-all-versions/26141', 'HeavensRegent')}!`),
		bullet(`Resolved an issue that could cause the App to freeze.`),
		bullet(`Dragging headers in the Grid to rearrange columns no longer highlights the text of other headers. Thanks, @${link('https://community.anytype.io/t/moving-column-headers-in-the-grid-to-swap-columns-selects-all-headers/26100', 'Code-Jack')}!`),
		bullet(`Fixed keyboard navigation in the Command menu. Thanks, @${link('https://community.anytype.io/t/adding-a-link-cursor-jumps-too-deep-in-the-selection-box/25763', 'Code-Jack')}!`),
		bullet(`Bin Search works correctly, without causing Objects to be filtered out.`),
		bullet(`Relations containing angle brackets (e.g., ${hl('&lt;abc&gt;')}) are saved correctly. Thanks, @${link('https://community.anytype.io/t/angle-brackets-in-relation-will-disappear-when-clicking-it/25534', 'CoolGuy')}!`),
		bullet(`Input to Date type relations works correctly. Thanks, @${link('https://community.anytype.io/t/date-entry-not-working/26112', 'flypenguin')}!`),
		bullet(`Removed the option to paste YouTube channel links as Embed. Thanks, @${link('https://community.anytype.io/t/pasting-a-link-to-an-yt-channel-paste-as-embed-shouldnt-appear/26297', 'Code-Jack')}!`),
		bullet(`Fixed an issue where pasting with all blocks selected in the object editor would wipe out content without pasting from the clipboard. Thanks, @${link('https://community.anytype.io/t/pasting-when-all-blocks-in-the-object-editor-are-selected-will-wipe-out-everything-but-will-not-paste-whats-in-the-clipboard/25040', 'sky1')}!`),
		bullet(`Copy-pasting relations between Objects using ${hl(`${cmd} + C`)} and ${hl(`${cmd} + V`)} works correctly. Thanks, @${link('https://community.anytype.io/t/fail-to-paste-relations-from-one-object-to-another-by-ctrl-c-v/25809', 'RichardZ')}!`),
		bullet(`Improved behavior of the Command menu when using non-English language with IME. Thanks, @${link('https://community.anytype.io/t/slash-menu-doesnt-always-appear/21879', 'C.c')} and @${link('https://community.anytype.io/t/multiple-functions-not-working-after-inputted-or-using-cangjie/25364', 'Lipiesu')}!`),
		bullet(`Filter and Search functions now work correctly with non-English IMEs. Thanks, @${link('https://community.anytype.io/t/any-filter-or-search-function-doesnt-work-with-non-english-ime-on-mac/21496', 'vennetong')}!`),
		bullet(`Resolved an issue with Tag creation when typing non-English characters. Thanks, @${link('https://community.anytype.io/t/unable-to-create-chinese-tag-at-pinned-tag-relation/23800', 'crimx')}!`),
		bullet(`${hl('Text')} option in the Relation Type menu is highlighted when the cursor is hovered over. Thanks, @${link('https://community.anytype.io/t/text-option-does-not-highlight-when-making-a-new-relation/26051', 'PianoMacPower')}!`),
		bullet(`Toggle Block works correctly when pressing Enter to insert new lines. Thanks, @${link('https://community.anytype.io/t/a-toggle-block-throws-me-out-if-i-try-to-insert-two-new-lines-between-existing-lines/26032', 'Code-Jack')}!`),
		bullet(`Template Type is no longer displayed in the right-click menu under the ${hl('Change type')} option.`),
		bullet(`Fixed PDF export for Simple Tables. Thanks, @${link('https://community.anytype.io/t/simple-tables-look-wrong-when-using-pdf-export/25630', 'BIG艺术家')}!`),
		bullet(`Fixed an error that occurred when switching from Flow to an Object. Thanks, @${link('https://community.anytype.io/t/switching-to-flow-open-a-note-i-was-in-with-cmd-k-i-get-an-errorne/24955', 'krst')}!`),
		bullet(`The order of Space icons remains properly arranged. Thanks, @${link('https://community.anytype.io/t/order-of-spaces-in-the-sidebar-suddenly-rearranged/24114', 'siousu')}!`),
		bullet(`Hovering over "Move to" in the right-click menu no longer causes the page to scroll up.`),
		bullet(`Duplicating a locked relation no longer causes a popup in the corner.`),
		bullet(`Fixed the Filter menu in Sets.`),
		bullet(`Fixed an issue where ${hl(`${cmd} + A`)} and ${hl(`${cmd} + V`)} in an overlay affected the underlying Object. Thanks, @${link('https://community.anytype.io/t/overlay-cmd-a-cmd-v-also-pastes-in-the-object-underneath/25864', 'krst')}!`),
		bullet(`Date window in the Command menu no longer freezes when the cursor is moved away.`),
		bullet(`Fixed keyboard up navigation in the Command menu.`),
		bullet(`Fixed the behavior of the Enter key when creating a new Vault.`),
		bullet(`Adjusted the layout of Types to display the dates without cropping.`),
		bullet(`Default Object Type remains set. Thanks, @${link('https://community.anytype.io/t/default-object-type-keeps-changing-to-page/25748', 'zma17')}!`),
		bullet(`Fixed an issue with fast-clicking on inline object links. Thanks, @${link('https://community.anytype.io/t/fast-click-on-inline-object-link-does-not-work-on-macos/23818', 'aytigra')}!`),
		bullet(`Fixed an issue that could prevent title input in newly created Objects. Thanks, @${link('https://community.anytype.io/t/cannot-type-title-in-newly-created-object/22494', 'reachar')}!`),
		bullet(`Webclipper's authorisation process has been reworked to eliminate issues with pop-ups.`),
		bullet(`The selection rectangle now correctly toggles off when selecting text.`),

		div(),
		// --------------------------------------------//

		h1(`Desktop 0.44.0 Released!`),
		text(`Before we say goodbye to the year, we're happy to share this final update packed with some nice improvements. In addition to bug fixes and reliability/performance enhancements, we would like to introduce two long-anticipated features. We hope you enjoy this update and wish you a joyful holiday season!`),
		text(``),

		h2(`Highlights`),

		h3(`Date as an Object`),
		text(`You can now open any date as a separate object to view the entire context related to that date, including mentions (@date), automatically created dates and custom date relations. Dates are accessible from relations, layouts, graph, calendar view and more.`),
		text(`In addition, there are new Date and Time settings, and @date supports relative date formats such as @today or @tomorrow.`),
		img(`44/1.png`),
		text(``),

		h3(`Simple Formulas`),
		text(`The long-requested functionality is now available for Sets and Collections. You can count objects in the Grid view and perform simple math and aggregation functions with all types of relations.`),
		img(`44/2.png`),
		text(``),

		h2(`Quality-of-Life`),
		bullet(`Files and markups from the HTML and bookmarks are no longer created as objects when you place them in the app. This enhances the functionality of the Web Clipper and clipboard, resulting in a cleaner app without unnecessary file clutter.`),
		bullet(`The Entry space can now be deleted if it’s no longer needed or if you prefer to use only shared spaces. You can export and import it into any other spaces (better to use the any-block format).`),
		bullet(`Deeplinks to Objects include an invitation to the shared space when using the ${hl('Copy Link')} option, making collaboration and access more seamless.`),
		bullet(`Added the ability to import data during the creation of a second space, simplifying the setup process.`),
		bullet(`The Audio Player has been slightly restyled, with a background with a subtle shadow, slightly repositioned controls and updated icons.`),
		bullet(`Some colour updates for both light and dark modes.`),
		bullet(`The ${hl('Add Relation')} option has been removed from the File layout.`),
		bullet(`Added an option to enable or disable custom CSS. Thanks, @${link('https://community.anytype.io/t/custom-css-in-anytype-directly/24498', 'Shampra')}!`),
		text(``),

		h2(`Bug Fixes`),
		bullet(`Resolved an issue where the Link option in the widget settings menu could not be selected.`),
		bullet(`Fixed an issue in global search where the cursor would jump from its position when entering or deleting text, particularly after switching apps. Thanks, @${link('https://community.anytype.io/t/cursor-jumping-in-global-search/25012', 'dzlg')}!`),
		bullet(`Re-fixed an issue where local links with "$" in their path would cause the super link text to appear in some source text.`),
		bullet(`Search queries retain entered symbols, resolving an issue with missing characters.`),
		bullet(`Search results remain consistent when reopening the search panel.`),
		bullet(`Mermaid diagrams remain visible simultaneously. Thanks, @${link('https://community.anytype.io/t/only-one-mermaid-diagram-at-the-time-0-43-21-beta/25619', 'langtind')}!`),
		bullet(`The checkbox ticks as expected when attempting to delete a Vault.`),
		bullet(`The Brazilian currency symbols (R$) are displayed correctly. Thanks, @${link('https://community.anytype.io/t/bug-when-inserting-reference-to-values-in-brl-reais/24380', 'perereco')}!`),
		bullet(`Inline LaTeX with multiple standalone backslash commands now renders correctly. Thanks, @${link('https://community.anytype.io/t/inline-latex-for-multiple-standalone-backslash-commands-not-rendering/25537', 'zewwo')}!`),
		bullet(`Applying formatting via keyboard shortcuts affects all selected text across multiple levels of indentation. Thanks, @${link('https://community.anytype.io/t/formatting-shortcuts-only-apply-to-the-top-indent-level/24745', 'ferdzso')}!`),
		bullet(`The ${hl('Local Only')} tooltip in Network Mode is now clearly visible when the operating system is set to dark mode. Thanks, @${link('https://community.anytype.io/t/tooltip-local-only-in-network-mode-barely-visible-when-the-os-is-in-dark-mode/25317', 'krst')}!`),
		bullet(`${hl(`${cmd} + A`)} in an overlay now selects only the content within the overlay, without affecting the object underneath. Thanks, @${link('https://community.anytype.io/t/ctrl-cmd-a-in-an-overlay-also-selects-in-the-object-underneath/23642', 'krst')}!`),
		bullet(`${hl('Click')} handlers in Mermaid embed blocks open external links in a browser. Unfortunately, internal resource links within Anytype can't be fixed as they're purified by Mermaid. Thanks, @${link('https://community.anytype.io/t/mermaid-embed-block-mermaid-click-not-working-as-expected/24948', 'francodgstn')}!`),
		bullet(`Converting multiple blocks using shortcuts works correctly. Thanks, @${link('https://community.anytype.io/t/converting-multiple-blocks-with-shortcuts-not-working-anymore/25523', 'siousu')}!`),
		bullet(`Fixed an issue where element outlines would become visible. Thanks, @${link('https://community.anytype.io/t/outlines-visible-when-zooming-in-and-out/25500', 'zma17')}!`),
		bullet(`The right-click menu is correctly updated after an object or type is removed from the All Objects. Thanks, @${link('https://community.anytype.io/t/after-deleting-one-type-under-all-objects-the-right-click-menu-does-not-refresh-its-content-correctly/25295', 'Facility6384')} and @${link('https://community.anytype.io/t/after-deleting-one-type-under-all-objects-the-right-click-menu-does-not-refresh-its-content-correctly/25295', 'endlessblink')}!`),
		bullet(`Frequently clicking on the ${hl('Get My Key')} button does not result in an error.`),
		bullet(`Long space names no longer overlap with the sidebar button.`),
		bullet(`Links starting with tel: are not prepended with https:// anymore. Thanks, @${link('https://community.anytype.io/t/tel-urls-work-incorrectly-on-desktop/25178', 'fieldnote')}!`),
		bullet(`Formatting text as monospace using backticks ${hl('\`\`')} is applied without shifting the formatting of subsequent words in a paragraph. Thanks, @${link('https://community.anytype.io/t/monospace-formatting-with-backticks-shifts-following-formatting-left/24584', 'yuritem')}!`),
		bullet(`Reordering views in Sets and Collections is consistent and the drop-down list remains open after reordering for additional adjustments.`),
		bullet(`Resolved a crash caused by an ENOENT error.`),
		bullet(`The search icon in Sets and Collections displays correctly.`),
		bullet(`Fixed an issue where an Object name might not be saved when entering it for a new Object in a Set.`),
		bullet(`Fixed unexpected behaviour of the context menu when it could follow the mouse cursor and lose the context of the element it refers to. Thanks, @${link('https://community.anytype.io/t/actions-popup-follows-mouse-and-loses-context-to-element/25705', 'krst')}!`),
		text(``),

		callout(`Please be reminded that we no longer support macOS Catalina.`, '⚠️'),

		div(),
		// --------------------------------------------//

		h1(`Desktop 0.43.7 Released!`),
		callout(`This follow-up update to the previous release brings improved performance and a few additional enhancements.`, '📃'),
		text(''),

		h2(`Changelog `),
		bullet(`Improved stabilization and overall app performance.`),
		bullet(`Added support for Chinese language search.`),
		bullet(`Headers in Sets and Collections are now fixed at the top when scrolling in Grid view.`),
		bullet(`Added an ${hl('Open as Object')} action for images and videos opened in fullscreen.`),
		bullet(`Typing text with multiple selected blocks now deletes them and starts a new text block.`),
		bullet(`Implemented a new progress bars system.`),
		bullet(`Fixed an issue where pressing Enter or arrow keys didn’t create a new block below callouts. Thanks, @${link('https://community.anytype.io/t/24175', 'Daria_Sweet97')}!`),
		text(''),

		div(),
		// --------------------------------------------//

		h1(`Desktop 0.43.0 Released!`),
		callout(`A big thank you to our amazing Community for the valuable suggestions and reports that continue to help us along the way!`, '💌'),

		h2(`Highlights on this release`),
		text(`In this update, we've focused on important technical improvements. Although the major changes are under the hood, they lay the groundwork for future features and enhancements. Alongside this fundamental work, we have also made a number of smaller upgrades and fixes - let's dive in.`),

		h3(`Improved Full-Text Search Speed`),
		text(`We’ve upgraded our search functionality with a new library to improve speed, particularly for large spaces. Users with extensive spaces will experience faster search.`),

		h3(`Enhanced Any-Store for Faster Performance`),
		text(`We have implemented a new local database to enhance performance significantly. Users with large spaces will enjoy faster loading times and smoother interactions throughout the app.`),

		h3(`All Objects`),
		text(`Our <b>improved navigation</b> makes it much easier to browse through all your content. Now, you can search across all your Objects, Sets & Collections, and Media & Files in one place, with options to sort by Date or Name. Additionally, the simplified Library and the Bin also live in the new widget.`),
		video('43/1.mp4'),
		text(``),

		h3(`More Views & Widgets`),
		text(`..have been updated to improve visual usability.`),
		bullet(`<b>Gallery</b> has a fresh appearance for widgets.`),
		bullet(`<b>Kanban</b> supports displaying page covers on cards in a layout.`),
		video('43/2.mp4'),
		text(``),

		h2(`Quality-of-Life`),
		bullet(`Pressing Enter inside empty list and toggle blocks behaves as ${shift} + Tab for that block: moves up a level. Thanks, @${link('https://community.anytype.io/t/move-indented-bullet-points-to-the-left-using-enter-key/12082', 'purplekiwi')} & @${link('https://community.anytype.io/t/move-indented-bullet-points-to-the-left-using-enter-key/12082', 'Shampra')}!`),
		bullet(`Updated batch relation editing to allow adding new options and removing existing ones: now, when editing tags/objects/files the values are added or deleted instead of replacing with a new value. Thanks, @${link('https://community.anytype.io/t/option-to-append-tags-instead-of-replacing-them-when-using-batch-editing-with-multi-select-relations/21362', 'Shampra')}!`),
		bullet(`Created relations in batch editing are now automatically added to the Set or Collection view.`),
		bullet(`Updated icons for multiple file formats, including generic files, images, videos and more.`),
		bullet(`Updated icons for relation formats: select, multi-select, date, checkbox, and email.`),
		bullet(`Color of toggle icon is based on a block text color.`),
		bullet(`Updated layout of the File object type.`),
		bullet(`Added the option to paste text without its original formatting. Thanks, @${link('https://community.anytype.io/t/paste-text-without-its-formatting/8810', 'Shampra')}!`),
		bullet(`Spellcheck language is based on the language selected in your preferences by default.`),
		bullet(`Added an option to save search results to a new or existing collection via the right-click menu in a search query.`),
		bullet(`Added the ability to create an object in the Calendar Set or Collection View, similar to the Calendar Widget.`),
		bullet(`Kanban cards now support cover previews. Thanks, @${link('https://community.anytype.io/t/display-cover-or-image-content-in-kanban-view/9018', 'Elias')}!`),
		bullet(`Relation cells in read-only Spaces or read-only objects now provide the ability to read the full value of that relation cell.`),
		bullet(`Warning switch to ${hl('Local Only')} network: we've added a notification and additional confirmation before selection.`),
		bullet(`Potentially harmful URLs have a warning before opening them.`),
		bullet(`Create new objects in Sets faster by using ${hl(`${shift} + Enter`)}. Thanks, @${link('https://community.anytype.io/t/paste-text-without-its-formatting/8810', 'Pretzel')}!`),
		bullet(`Added an ability to multi-edit the Done relation.`),
		bullet(`Added tooltips to the Calendar view that display the full name of an object when the cursor is briefly hovered over it. Thanks, @${link('https://community.anytype.io/t/tooltip-on-calendar/24086', 'MrDaisyBates')}!`),
		bullet(`Updated the plus icon and block menu icon.`),
		bullet(`When changing the format of a block from a list to text, the background color and styles are now cleared when pressing ${hl('Enter')}.`),
		bullet(`Updated menu button on the Template type.`),
		bullet(`Disabled the ability to change an object type to Template.`),
		bullet(`Default Space icons now display the first letter of the Space name.`),
		bullet(`Dark mode colors have been updated.`),
		bullet(`Improved Code snippet readability when nested within a Callout block.`),
		bullet(`Removed the three dots from the drag and drop handle for a cleaner interface.`),
		bullet(`Added restrictions to prevent Templates from being created in multiple unintended locations.`),
		text(``),

		h2(`Performance`),
		bullet(`Calendar has been greatly optimized (& is no longer freezable). Thanks, @${link('https://community.anytype.io/t/calendar-view-freezes/12323/5', 'C.c')}! `),
		bullet(`Databases for different spaces have been separated to improve overall application performance.`),
		text(``),

		h2(`Bug Fixes`),
		bullet(`Pin Code is now numeric for newly created PINs, allowing only number input. Thanks, @${link('https://community.anytype.io/t/pin-code-should-be-numeric/20435', 'isllll')}!`),
		bullet(`Fixed an issue where pasting a Pin Code was not working.`),
		bullet(`Non-Latin characters in PDF files are now displayed correctly. Thanks, @${link('https://community.anytype.io/t/korean-characters-dont-appear-in-pdf/22446', 'BloomJieun')}!`),
		bullet(`PDF blocks added on Mobile platforms now display correctly on Desktop after sync. Thanks, @${link('https://community.anytype.io/t/pdf-block-added-on-mobile-doesnt-display-properly-on-desktop/23187', 'BCSharp')}!`),
		bullet(`Set Widget is synced with objects in the list and has a default View option when the type is changed.`),	
		bullet(`Creating an object relation works correctly.`),
		bullet(`Updated menu actions for Sets and Collections moved to Bin.`),
		bullet(`Fixed the invalid key error that occurred when entering the phrase from the keyboard during the login.`),
		bullet(`Selecting ${hl('Last Opened Object')} as the Homepage now correctly opens to the last accessed object. Thanks, @${link('https://community.anytype.io/t/homepage-last-opened-object-does-not-work/22079', 'stendekoniko')}!`),
		bullet(`Text highlighting does not change when an object is locked. Thanks, @${link('https://community.anytype.io/t/empty-space-highlighting-lost-on-locked-pages/22592', 'Terit')}!`),
		bullet(`A right-click on an object in Calendar View now correctly opens the context menu instead of opening the object. Thanks, @${link('https://community.anytype.io/t/a-right-click-on-an-object-in-calendar-view-opens-it/23225', 'Code-Jack')}!`),
		bullet(`Individual orphan nodes are farther from larger clusters of objects on the Graph. Thanks, @${link('https://community.anytype.io/t/individual-orphan-note-not-distanced-from-other-nodes/10934', 'C.c')}!`),
		bullet(`Fixed unexpected behavior where clicking on a Link could redirect to a Homepage. Thanks, @${link('https://community.anytype.io/t/strange-bug-when-clicking-links-get-forwarded-to-welcome-page/16444', 'kellertuer')}!`),
		bullet(`Color of numbered and bulleted lists changes according to the color of a block. Thanks, @${link('https://community.anytype.io/t/strange-bug-when-clicking-links-get-forwarded-to-welcome-page/16444', 'dzlg')}!`),
		bullet(`Resolved the issue causing a black screen when opening Anytype on Linux. Thanks, @${link('https://community.anytype.io/t/black-screen-when-open-anytype-on-linux/23333', 'Jefferson')}!`),
		bullet(`Text changes no longer disappear when the slash menu is open.`),
		bullet(`Locked objects are now fully protected from being accidentally modified in Sets and Collections.`),
		bullet(`Fixed an issue where local links with ${hl('$')} in their path would cause the super link text to appear in some source text. Thanks, @${link('https://community.anytype.io/t/if-a-local-link-has-in-its-path-the-super-link-text-would-show-in-some-source-text/23262', '4thHydro')}!`),
		bullet(`Thumbnails in the image library are now displayed correctly. Thanks, @${link('https://community.anytype.io/t/incorrect-image-display-in-library-tab-when-changing-page-icon/23379', 'a44')}!`),
		bullet(`Adjusted buttons in the link editor pop-up window in German localization. Thanks, @${link('https://community.anytype.io/t/ui-issue-with-bookmark-popup-when-the-buttons-are-too-big-long/23464', 'VisualNotes')}!`),
		bullet(`Fixed an issue preventing the creation of types that end with accented characters, such as ${hl('à')}.`),
		bullet(`Restored the ability to move blocks between objects by dragging them to the sidebar. Thanks, @${link('https://community.anytype.io/t/latest-update-broke-ability-to-drag-blocks-to-the-sidebar/23525', 'Andris')}!`),
		bullet(`Inserting a toggle no longer causes scrolling to the top of a page. Thanks, @${link('https://community.anytype.io/t/copy-pasting-a-non-empty-toggle-makes-anytype-jump-to-the-top/13373', 'SwiftyChicken')}!`),
		bullet(`Links following inline LaTeX in a line are now placed correctly. Thanks, @${link('https://community.anytype.io/t/links-behaving-wierd-with-inline-latex/23549', 'eloitor')}!`),
		bullet(`The count of selected objects works correctly.`),
		bullet(`When editing multiple objects in a Type view from the Library, relations are displayed according to the list in a Type. Thanks, @${link('https://community.anytype.io/t/type-multiple-objects-selected-edit-relations-bug/23540', 'bee6000')}!`),
		bullet(`Fixed an issue that could cause square brackets to appear in an Object's title when modifying its content or supported relations. Thanks, @${link('https://community.anytype.io/t/18916', 'C.c')}!`),
		bullet(`Drop-down menu with [Editor / Viewer / Remove member] options has been removed for a Space owner.`),
		bullet(`Mermaid diagram now switches a color style according to the color mode of the App.`),
		bullet(`Multiple file selection on import is fixed.`),
		bullet(`When adding an object relation to Set, the selection popup correctly closes instantly.`),
		bullet(`Fixed an issue on Linux where the menu visibility toggle was not working correctly through the window menu.`),
		text(``),

		h2(`Platform Updates`),
		bullet(`Starting with the next release, we will <b>no longer support MacOS Catalina (10.15)</b>. This decision comes as Apple has officially dropped support for this version, and maintaining compatibility requires significant development effort on our end. We understand this change may affect some users, but it's a necessary step to ensure smoother updates.`),

		div(),
		// --------------------------------------------//

		h1(`Anytype 0.42.3 Hotfix Released!`),
		text(`We're releasing this hotfix just three days after the 0.42.0 update to address important feedback from our community and better align with user expectations. This patch bundles all the features of 0.42.0 (see previous notes) along with UI improvements, primarily the sidebar display settings, and several bug fixes. Thank you for your swift feedback and continued support!`),
		text(''),
		text(`Here's what's new in this hotfix:`),
		text(''),

		h2(`Quality-of-Life 🌿 `, I.BlockHAlign.Center),
		bullet(`Added display options for Vault Sidebar to ${hl('Settings → Personalization tab')}.`),
		bullet(`Moved settings from the Appearance tab to the Personalization tab for consistency; renamed the Appearance tab to Color Mode.`),
		bullet(`Improved sidebar animation and delay. Thanks, @${link('https://community.anytype.io/t/23066', 'code-jack')}!`),
		text(''),															  

		h2(`Bug Fixes 🪲`, I.BlockHAlign.Center),															  
		bullet(`Fixed an issue with the default auto-hide sidebar behavior. Previous logic caused problems for users with auto-hide enabled in fixed mode. The setting is now updated, so please reconfigure your auto-hide/show preferences.`),
		bullet(`Corrected the positioning of the sidebar toggle icon and header on Windows and Linux.`),
		bullet(`Cleared saved search state in Global Search when the clear button is used.`),
		bullet(`Fixed a bug preventing ${hl('0')} values from appearing in Number relations. Thanks, @${link('https://community.anytype.io/t/23048', 'mattred1')}!`),															  
		bullet(`Resolved an issue with markdown parsing that caused inline links to add ${hl('…')} at the end. Thanks, @${link('https://community.anytype.io/t/23083', 'ferdzso')}!`),
		bullet(`Fixed a middleware problem with macOS 11 builds. Thanks, @${link('https://community.anytype.io/t/23068', '_martin')}!`),															  
		bullet(`Fixed an issue with URL previews not displaying correctly on mouse hover. Thanks, @${link('https://community.anytype.io/t/23079', 'candidchronicles')}!`),															  
		bullet(`Fixed issue with PDFs exporting black background in dark mode. Thanks, @${link('https://community.anytype.io/t/23133', '2PJs')}!`),
		bullet(`Fixed numbers remaining when switching from a numbered list to a bulleted list. Thanks, @${link('https://community.anytype.io/t/23114', 'elias')}!`),
		
		text(''),
		text(`Thanks again for your patience and feedback as we work to improve Anytype 🫶`),	

		div(),
		// --------------------------------------------//

		title(`Anytype Desktop 0.42.0 Released!`),
		text(`This release brings a redesigned sidebar, brand-new widgets, and the highly anticipated inline LaTeX feature, along with numerous quality-of-life improvements and bug fixes for an even smoother Anytype experience. Don’t miss our new sync status indicator—it’s like having a little tech guru keeping you informed! Enjoy exploring the updates 🏄‍♀️`),
		text(''),

		h2(`Highlights 💫`, I.BlockHAlign.Center),
		text(''),

		h3(`Redesigned Sidebar 🌐`),
		text(`Our sleek new sidebar makes hopping between Spaces a breeze. Think of it as your personal GPS for easier navigation.`),
		img(`42/1.png`),
		caption(`Simply click to hide the entire sidebar, or right-click the icon for additional options.`),
		text(''),

		h3(`New Widgets 🧩`),
		text(`We're bringing you Widgets that are more flexible than a yoga master. Now, you can display Widgets in three new layouts: Calendar, Kanban, and Gallery.`),
		img(`42/2.png`),
		text(''),

		h3(`New Sync Status Indicator 🧘`),
		text(`Now, you'll get more informative updates for Objects and files. Look out for these handy indicators when there's no network connection or sync. `),
		img(`42/3.png`),
		text(''),

		h3(`Inline LaTeX 🧑‍🔬`),
		text(`We’re absolutely geeked to finally deliver ${link('https://community.anytype.io/t/2315', 'this long-awaited feature to the community')}! You can now easily add mathematical notation right into your text, making it possible to include complex equations and formulas. Thanks everyone who voted for it! `),
		video(`42/4.mp4`),
		text(''),

		h2(`Quality-of-Life 🪷 `, I.BlockHAlign.Center),
		bullet(`Menu item was added to Object settings for faster "add to Collection" workflow.`),
		bullet(`Sharing Anytype with others got simpler—just grab the link from the help menu and share away (Desktop only).`),
		bullet(`Navigate Tables using only arrow keys to enter, jump cells &amp; exit to the next block. Thanks, @Code-Jack!`),
		bullet(`Added an option to copy the URL from bookmark blocks. Thanks, @maxitg!`),
		bullet(`Reduced mouse action needed after creating a new page in Collections. Thanks, @Code-Jack!`),
		bullet(`"Turn into Object" adapts to default Templates now. Thanks, @${link('https://community.anytype.io/t/turn-into-object-did-not-adapt-to-default-template/21983', 'LSK')}!`),
		bullet(`Added option to disable preview on graph view. Thanks, @${link('https://community.anytype.io/t/21898', 'iamWing')}!`),
		bullet(`Typed text after a linked object no longer becomes part of the link and can be unlinked. Thanks, @${link('https://community.anytype.io/t/8075', 'floseq')}!`),
		bullet(`Select all ${hl(`${cmd} + A`)} twice now excludes the title. Thanks, @${link('https://community.anytype.io/t/ctrl-a-behaviour-inconsistent-unpredictable/7612', 'qualquertipo')}!`),
		bullet(`You can now use crypto (BTC, ETH, USDT, USDC, BNB, Dai, etc.) to pay for memberships.`),
		bullet(`Added a menu for selecting filter/sorting options after clicking "New Sort/Filter".`),
		bullet(`Clicking the "Join" button on the Pricing page will now open the app to purchase the subscription if it’s installed, or take you to the download page if it’s not.`),
		bullet(`Search panel now reopens with previously entered text and selected objects in "Related to" mode.`),
		text(''),
		
		h3(`Technical Update 🛠️`),
		bullet(`Electron updated to 31.0.0`),
		text(''),

		h2(`Bug Fixes 🦂`, I.BlockHAlign.Center),	
		bullet(`Number relations with values less than 1 million are now evenly spaced. Thanks, @${link('https://community.anytype.io/t/7497', 'matylda')}!`),
		bullet(`Mermaid diagrams now display correctly with dark mode backgrounds. Thanks, @${link('https://community.anytype.io/t/20228', 'BoxOfWood')}!`),
		bullet(`Top menu no longer shows up below the cover in sets when using the modal window. Thanks, ${link('https://community.anytype.io/t/22009', 'Elias')}!`),
		bullet(`Fixed a problem with carriage when adding tags or objects to corresponding relations. Thanks, @${link('https://community.anytype.io/t/10219', 'dzlg')}!`),
		bullet(`Relations with number type can now have a value of 0. Thanks, @${link('https://community.anytype.io/t/cant-store-0-s-in-a-number-type-relation/3583', 'gcsapo')}!`),
		bullet(`Widget pop-ups at the bottom of the sidebar are no longer hidden by the app border. Thanks, @${link('https://community.anytype.io/t/19954', 'Tamalika')}!`),
		bullet(`Deleted media files now appear as non-existent when embedded in an object. Thanks, @${link('https://community.anytype.io/t/deleted-files-are-not-shown-as-deleted/11208', 'Balcion')}!`),
		bullet(`First sentence of an Object no longer appears on title bar when the app is locked. Thanks, @${link('https://community.anytype.io/t/21551', 'NoteMyBrain')}`),
		bullet(`Search pane now displays correctly on smaller screen sizes. Thanks, @${link('https://community.anytype.io/t/22130', 'C.c.')}!`),
		bullet(`Search in Relation options now shows results even if options were scrolled.`),
		bullet(`Checkbox sorting in Set has been restored. Thanks, @${link('https://community.anytype.io/t/22266', 'effreyh')}!`),
		bullet(`The Query of the set now updates correctly in the pop-up.`),
		bullet(`Fixed issue with using library images for type Icons. Thanks, @${link('https://community.anytype.io/t/22297', 'Self-Perfection')}!`),
		bullet(`Keyboard cursor no longer disappears after cutting a whole line (block). Thanks, @${link('https://community.anytype.io/t/20781', 'SirCaptain')}!`),
		bullet(`Clarified the prompt for image uploads when no images are present.`),
		bullet(`Made sizes dropdown menu consistent throughout UI.`),
		bullet(`Fixed manual reordering of favorites in the widget. Thanks, @elias`),
		bullet(`Fixed issue where cursor couldn't break out of box when using text-style inline code. Thanks, @${link('https://community.anytype.io/t/8944', 'Xonline')}!`),
		bullet(`Fixed Markdown behavior for underscores and dashes. Thanks, @${link('https://community.anytype.io/t/17152', 'katcher')}!`),
		
		div(),
		// --------------------------------------------//

		h1(`Release 0.41.0 - Spring Update 🌸 Batch Editing V1`),
		text(`You didn't think we'd let Spring slip by before sneaking in a release, did you?`),
		text(`This request has been a long-time coming, so it brings us great pleasure to present V1 of Batch Relation Editing!`),
		text(`Wave goodbye to the days of tediously managing objects one by one. This new function allows you to add Tags and Relations to many Objects at a time, making it much quicker to organize your content and tidy-up your graph.`),

		h2(`🌿 Quality-of-Life Improvements:`),
		bullet(`<b>Improved Global Search:</b> Highlights results, shows more total results, searches by text relations, blocks, tags, and statuses, and allows searching links & backlinks.`),
		video(`40.5/3.mp4`),
		bullet(`<b>Batch Relation Editing:</b> Easily manage Tags & Relations across multiple objects 📋`),
		video(`40.5/1.mp4`),
		bullet(`<b>Reuse Files:</b> Incorporate existing files within file blocks in the editor 📂 `),
		video(`40.5/2.mp4`),
		bullet(`<b>Keyboard shortcut:</b> ${hl(`${cmd} + Enter`)} checks and unchecks checkboxes ✅ Thanks, @${link('https://github.com/anyproto/anytype-ts/pull/709', 'mikailcf')}!`),
		bullet(`<b>Text Justification:</b> New option to justify text in blocks for better formatting 📄`),
		img('40.5/4.png'),
		bullet(`<b>Enhanced Graph Settings:</b> Distinct settings for global and local graphs in Sets/Collections ⚙️ Thanks, @${link('https://community.anytype.io/t/graph-view-with-space-local-graph-clashes/20599', 'Donatas')}`),
		bullet(`<b>Drag'n'Drop Widgets:</b> Improved widget headers and linked widgets for easier organization 🖱️ Thanks, @${link('https://community.anytype.io/t/drag-drop-not-working-for-sidebar-widgets-with-link-appearance/20195', 'siouso')}`),
		bullet(`<b>Link Block:</b> Default link style has been changed to Card. Personalize this behaviour in Settings 🔗`),
		img('40.5/5.png'),
		bullet(`<b>Version History: </b> Now available in Sets & Collections with a new design that groups changes by Space members and edit time, and highlights changes in the Object 📝🔄`),
		
		bullet(`<b>Gallery View Adjustment:</b> Better visual experience with fewer cards in inline set columns 🎨 Thanks, @${link('https://community.anytype.io/t/change-dynamically-the-width-of-gallery-items-when-on-2col-layout/15623', 'Eban')}`),
		bullet(`<b>Library:</b> now has options to sort 📚`),
		img('40.5/6.png'),

		h2(`🛠️ Technical Updates:`),
		bullet(`Electron updated to ${link('https://releases.electronjs.org/releases/stable', '30.1.0')}`),
		bullet(`<b>Membership System:</b> All email domains now supported 📧 Thanks, @Afonso!`),
		bullet(`<b>App Updates:</b> Now works even without logging in ⬆️`),

		h2(`🐞 Bug Fixes:`),
		bullet(`<b>Slash Menu:</b> Now shows only after a space character to prevent saving issues ✨ Thanks, @${link('https://community.anytype.io/t/dont-show-the-slash-menu-if-there-is-a-character-or-nunber-direct-before-the-cursor/20500', 'code-jack')}`),
		bullet(`<b>Task Checkbox:</b> Fixed the issue of checkbox deleting object names in sets ✅`),
		bullet(`<b>Editor:</b> Fixed a bug that was breaking the editor when object was opened from history or by deeplink 🌐`),
		bullet(`<b>URL Relation Bug:</b> Resolved the issue with opening Windows Explorer when the URL is blank 🖥️ Thanks, @${link('https://community.anytype.io/t/pasting-a-url-in-url-relation-within-a-collection-press-enter-opens-this-pc-on-windows/11197', 'hexara')}`),
		bullet(`<b>Emoji Markdown:</b> Fixed markdown sequence issues with text blocks starting with an emoji 😃 Thanks, @${link('https://community.anytype.io/t/13159', 'pavloUA')}`),
		bullet(`<b>System Relations:</b> System relations can now be unlinked from Types 🔗 Thanks, @${link('https://community.anytype.io/t/16517', 'filip')}`),
		bullet(`<b>${shift} + Click:</b> Proper functionality for shift+click on Link/Bookmark blocks 🔍 Thanks, @${link('https://community.anytype.io/t/20194', 'siousu')}`),
		bullet(`<b>White Flash Issue:</b> Fixed the white flash when returning to the main screen from login/signup 💡`),
		bullet(`<b>Settings Modal:</b> Now properly adjusts to window height 🖥️`),
		bullet(`<b>Deeplink Routing:</b> Correct redirection after PIN check 🔒 Thanks, @${link('https://community.anytype.io/t/gallerys-open-in-app-button-failed-to-trigger-while-when-the-app-is-closed/12968', 'JorgeE')}`),
		bullet(`<b>Delete Link:</b> Fixed the delete link in the space context menu and local-only mode ❌`),

		text(``),
		text(`Enjoy and keep an eye out for our next release featuring another banger: 💥Tags as Objects 🏷️`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.40.0 - Welcome to Local-First Sharing & Collaboration`),
		text(`Folks, this is the one we’ve been waiting for. This release, in which creating trusted networks with your friends, family and communities in Anytype becomes a reality, is the culmination of nearly five years of R&D.`),
		text(`What does this mean for you? Now you can share what matters, with those you care about, knowing that everything you share is encrypted and owned by you. Not anytype, nor anybody else can peek inside or deny your access.`),
		text(`From today onward, we warmly welcome you to begin testing out shared spaces, starting with the small things: idea boards, shopping lists, projects, and wikis. As you’re testing, please kindly note that this is v1 of multiplayer, representing the first step towards full-fledged collaborative experiences. We’ll be enriching this experience with more features in the coming months, so your feedback is, as always, warmly welcomed.`), 
		text(`If you need inspiration, you can always check the ${link('https://gallery.any.coop/Collaboration', 'Multiplayer Experiences')} newly added to the Experience Gallery - for communities, neighbors, families, teams, and digital creators.`),
		text(`We can’t wait to see what you’ll create, and look forward to this new, networked era of Anytype.`),

		h2(`💎 Highlights of this Release:`),

		h3(`Multiplayer! Sharing! Collaboration! is LIVE!`),
		video(`40/1.mp4`),
		text(`To experience local-first collaboration for yourself, first ${hl('create a new space')} using the space navigation menu. In the Space Settings menu, you’ll see the option to ${hl('Share Space')}. By clicking here, you can generate an invite link for the Space, which can be sent to anyone.`),
		text(`Once they click the link and request to join your Space, you’ll receive a notification prompting you to add this person as an Editor, Viewer, or to reject the request entirely. Editors have edit access to all objects within the Space, while Viewers have read-only access to all objects within the space.`),
		text(`As a Space owner, it is possible to share up to three Spaces at this time. You can manage the roles of guests you have invited to your Space, or remove them altogether. Guests who have been removed from a space will receive a notification that they have been removed from the Space, and will see an option to export the contents of the Space.`),

		h3(`Memberships`),
		video(`40/2.mp4`),
		text(`For those of you who’ve inquired how to support Anytype’s development and growth, we’re pleased to share that the time has come! Memberships in the Anytype network are now live. You can check your Membership status at any time by clicking on the new ${hl('Memberships')} tab in your Profile Settings.`),
		text(`If you joined Anytype prior to this release, you should be auto-updated to the ‘Beta Users’ Plan, which includes your previous storage limits plus all benefits of the Explorer Plan.`),
		text(`If you would like to upgrade your membership, select your desired plan and follow the on-screen instructions to submit the Name you would like to purchase on the Anytype network. Then, complete the transaction in Stripe. Once your payment has been confirmed, your membership plan will update in the app.`),

		h3(`Custom Storage Location`),
		text(`When creating a vault, it’s now possible to select the storage location on your hard drive. If your vault has already been created, you can also change the location and retrieve the data from the network. To do so, first logout, then tap the settings wheel on the black login screen.`),
		text(`Please be cautious when using local-only mode, as your data can only be transferred to a second device via peer-to-peer (P2P) connection.`),

		h2(`⚡ Quality-of-Life Improvements:`),

		h3(`Updated Preferences Options in Profile Menu`),
		video(`40/3.mp4`),
		text(`With this release, we also introduce greater customization over UX patterns. When clicking on your Profile > Preferences, you’ll see new options for personalizing your account including Quick Capture Menu display settings, default Link Appearance settings, and whether Objects open in Full-Screen view.`),

		h3(`${hl('Graph')} Added as Layout View to Sets & Collections`),
		video(`40/5.mp4`),
		text(`For those of you who’ve longed for more precise graph filters, this release brings us one step closer. As a new layout option in Sets & Collections, you’ll now see an option for ${hl('Graph')}. By selecting it, you’ll be able to visualize filtered view of your graph which contains objects that match your Set or Collection criteria. This would allow you to use your graph to view for instance, all objects with Priority: High, or all objects with Type: Book.`),

		h3(`Files & Media Relation Formats added to Set Filter Menu`),
		video(`40/4.mp4`),
		text(`When filtering Sets that use File and Media relations, the Set filter menu now includes options to filter according to relations with type: File and Media.`),

		h3(`Design Improvements in Widgets`),
		text(`Border radiuses on widget select and hover menus have been adjusted for better visual consistency.`),

		h3(`System Tray & Menu Settings Renamed on Windows & Linux`),
		text(`For better consistency with OS naming conventions, ${hl('System Menu')} has been renamed to ${hl('Menu Bar')}, and ${hl('Menu Bar')} has been renamed to ${hl('System Tray')} on Windows and Linux versions`),

		h3(`Use Uploaded Images as Object Icons`),
		text(`You can now set an object icon by reusing an image that has already been uploaded to the space.`),

		h2(`💻 Tech:`),
		bullet(`Electron has been updated to 29.1.6`),
		bullet(`Debug logs for Middleware were split into different flags`),

		h2(`🐛 Bug Fixes:`),
		bullet(`Brave Browser automatic pairing issue resolved in Web-clipper. Thanks, ${link('https://community.anytype.io/t/web-clipper-not-pairing-automatically/17214', 'anicholslcsw')}!`),
		bullet(`Maximum relation menu height corrected so set filters are no longer cut off. Thanks, ${link('https://community.anytype.io/t/filter-in-set-view-dont-show-all-available-relations/18504', 'Henri')}!`),
		bullet(`Experience Gallery links now open Experience page, rather than list of experiences`),
		bullet(`Inline Kanban sets no longer overlap with editor content. Thanks, ${link('https://community.anytype.io/t/inline-set-kanban-view-bleeds-over-pre-existing-text/17485', 'zma17')}!`),
		bullet(`Clipboard paste for large amount of content has been greatly optimized`),
		bullet(`Rendering of ${hl('\\newline')}, ${hl('\\sqrt')}, ${hl('\\vec')} in LaTex now fixed to display correctly. Thanks, ${link('https://community.anytype.io/t/in-latex-or-newline-does-nothing-in-display-mode-newlineindisplaymode/11820', 'BioLinua')}!`),
		bullet(`When creating link blocks or inline links, first item in Link selection menu no longer being skipped on when using downward arrow key. Thanks, ${link('https://community.anytype.io/t/add-link-menu-first-item-is-always-skipped-keyboard-navigation/18815', 'siousu')}!`),
		bullet(`Source relation now opens correctly from featured relations`),
		bullet(`Relation filter in Graph fixed to display Objects connected by Relation only. Thanks, ${link('https://community.anytype.io/t/graph-doesnt-show-all-objects-connected-by-relation/18920', 'Code-Jack')}!`),
		bullet(`Text select with keyboard command now includes last character in selection. Thanks, ${link('https://community.anytype.io/t/selecting-text-with-the-arrow-keys-last-typed-character-is-missed-in-the-selection/18507', 'Code-Jack')}!`),
		bullet(`Contents inside closed toggles now being selected when copying or moving. Thanks, ${link('https://community.anytype.io/t/contents-not-selected-inside-collapsed-toggle-blocks-when-copying-or-moving/18857', 'yuriy144')}!`),
		bullet(`Content can now be dragged and dropped into empty toggles`),
		bullet(`Link and bookmark cards no longer resizing when leaving and returning to an object. Thanks, ${link('https://community.anytype.io/t/link-preview-as-card-with-page-cover-in-columns-dont-keep-larger-size-after-leaving-the-object/16642', 'nathan.connor')}!`),
		bullet(`Inline set & collection titles no longer being cut-off. Thanks, ${link('https://community.anytype.io/t/collections-title-gets-cut-out-after-a-few-characters/16190', 'Lixz')}!`),
		bullet(`Cursor no longer jumping when using backspace in lines that contain inline @mentions. Thanks, ${link('https://community.anytype.io/t/using-backspace-on-a-line-with-multiple-links-is-causing-issues/19135', 'tomshreds')}!`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.39.0 - Webclipper, Files as Objects and Experience Gallery Galore!`),
		text(`Midwinter greetings, Anytypers! As we chug along towards multiplayer, we’re excited to bring you another release packed with some long-anticipated features. We hope you’ll enjoy this update and as always, look forward to hearing your feedback!`),

		h2(`💎 Highlights of this Release:`),

		h3(`Webclipper`),
		video('39/1.mp4'),
		text(`The wait is over - we’re so relieved to bring you v1 of the Anytype webclipper. For those of you using Chrome browsers, you’ll be able to install the Anytype web clipper using ${link(J.Url.webclipper, 'this link')}.`),
		text(`Once installed, you have two options to save content from the web:`),
		bullet(`Click the web clipper extension icon in your toolbar to save web pages as new objects in Anytype.`),
		bullet(`Select a text snippet, right click, and add the text to any previously-created object in your space.`),

		h3(`Files as Objects`),
		video('39/2.mp4'),
		text(`A huge update for your Anytype files: you can now rename and add relations to your files, making it much easier to sort and manage your images, videos, PDFs, and other files. In addition, you can link files to objects by using the @ mention or Link-to commands from your object editor.`),

		h3(`In-app Experience Gallery`),
		video('39/3.mp4'),
		text(`To make browsing and installing experiences easier, the Experience Gallery has now been added to Anytype. Open your spaces navigation tab, tap ‘Gallery’, and install the experience of your choice.`),

		h2(`⚡ Quality-of-Life Improvements:`),

		h3(`${hl(`Export`)} Option Added to Right-click Menu for Sets/Collections`),
		text(`For easier batch exporting, the right-click menu in sets and collections now includes the ${hl(`Export`)} option. When clicking ${hl(`Export`)}, a popup will appear asking you to define your export settings.`),

		h3(`Right-click Menu added to Objects in Library`),
		video('39/4.mp4'),
		text(`When opening types or relations from your library, you can now multi-select the objects from the list and right-click to batch edit object type, delete, export, or add to favorites. You can also select individual objects and create widgets from them.`),

		h3(`Widgets for Recently Opened / Recently Edited Objects Now Grouped by Date`),
		video('39/5.mp4'),
		text(`When opening your widgets for Recently Opened or Recently Edited Objects, you can now see which Objects fall under Today, Yesterday, Past 7 days, and Older.`),

		h3(`Kroki, Sketchfab, and Github Gist Embeds Can be Created by Pasting Links`),
		text(`No need to create an embed block first - you can simply paste the links in your object editor and see the option to paste as embed.`),

		h3(`${hl(`Import Type`)} Relation has been Added`),
		text(`Objects which have been installed or imported, such as use cases or export files, will now come with relation: Import Type indicating the imported format, which can be Any-block, Markdown, or other.`),

		h3(`Corner Radiuses for Selected Blocks have been Updated`),
		text(`For better visual consistency, corner radiuses for blocks in the editor have been updated.`),

		h3(`Graph and Flow Added to Global Search`),
		text(`You can now use the global search menu to navigate to your Graph and Flow tabs.`),

		h3(`Czech, Lithuanian, and Korean Added to Interface Languages`),
		text(`Thanks to everyone who’s contributed to these three new translations, we now have 22 languages available on Desktop!`),

		h2(`💻 Tech:`),
		bullet(`Electron updated to 0.28.2`),

		h2(`🐛 Bug Fixes:`),
		bullet(`Change Object Type menu no longer includes current object type. Thanks, ${link('https://community.anytype.io/t/current-object-type-should-not-be-in-the-list-when-changing-to-other-type/8063/5', 'sambouwer')}!`),
		bullet(`Title block spacing remains consistent no matter how many blocks are in the object. Thanks, ${link('https://community.anytype.io/t/title-line-spacing-gets-squished-with-more-than-39-blocks/12850', 'SpaceLemon')}!`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.38.0 - 2024: Fresh Beginnings`),
		text(`Refusing to succumb to the post-holiday blues, we’re kicking off the new year with a desktop-only release to address the valuable feedback we received after our latest update. This time around, we’ve also conducted an extensive cleanup to tackle longstanding bugs, ensuring a smoother experience for all users. Thanks to everyone who’s given feedback, reported bugs, and contributed to our ${link('https://github.com/anyproto', 'codebase')} and ${link('https://gallery.any.coop/', 'Experience Gallery')}!`),

		h2(`💎 Highlights of this Release:`),

		h3(`Quick Capture Updates`),
		img('38/1.png'),
		text(`Having introduced a new quick capture menu in our previous release, we've now added additional refinements to help you customize it to your workflows. By right-clicking your most-used object types in your quick capture menu, you now have the option to 'pin' them in the order you prefer. You can also change your default object type or directly delete objects from this menu.`),

		h3(`More! And More! And More Embeds!`),
		video('38/2.mp4'),
		text(`We heard you loud & clear, more embeds are desired! With this release you’ll now have access to the following embed blocks:`),
		bullet(`Twitter posts`),
		bullet(`Facebook posts`),
		bullet(`Telegram messages`),
		bullet(`Figma public documents`),
		bullet(`OpenStreetMap`),
		bullet(`Github gist`),
		bullet(`Graphviz diagrams`),
		bullet(`CodePen`),
		bullet(`Sketchfab models. Thanks, @${link('https://github.com/LavaCxx', 'LavaCxx')}!`),
		bullet(`Kroki diagrams. Thanks, @${link('https://github.com/LavaCxx', 'LavaCxx')}!`),
		bullet(`Bilibili videos. Thanks, @${link('https://github.com/LavaCxx', 'LavaCxx')}!`),

		h2(`⚡ Quality-of-Life Improvements:`),

		h3(`New Experiences in Gallery`),
		text(`We’d like to thank our first ANY Experience contributors, @Hexara7777 and @ChristianHaake for submitting five new experiences to the gallery! Between Zen systems, PARA systems and meeting notes, we’re so excited to have your help enriching the Experiences in the Gallery. `),

		h3(`Added resize functionality to PDF and Embed Blocks`),
		video('38/3.mp4'),
		text(`Embed and PDF blocks can now be resized, similarly to image blocks.`),

		h3(`UX Improvements for Featured Relations`),
		img(`38/4.png`),
		text(`To help you better make use of your featured relations, empty-state featured relations now display the relation name so you know what they refer to. Clicking the relation will open the relation selection dropdown - either in the object’s relations panel or directly in the editor.s`),

		h3(`System Notifications are Displayed when Window is Not in Focus`),
		text(`System notifications will display even when the Anytype window is not in focus.`),

		h3(`MacOS Icon Shows Badge for Unread Notifications`),
		text(`For Mac users, a notification badge with the number of unread notifications will be displayed above the Anytype icon in your tray.`),

		h3(`Minimum Zoom Value Updated on Graph`),
		text(`It’s now possible to zoom out and visualize your entire graph.`),

		h2(`💻 Tech:`),
		bullet(`Electron updated to 28.1.3`),
		bullet(`Tar.gz added as target for Linux builds`),

		h2(`🐛 Bug Fixes:`),

		h3(`Sidebar:`),
		bullet(`Auto show/hide of sidebar now works properly. Thanks, ${link('https://community.anytype.io/t/prolonged-sidebar-persistence/9543', 'andre')}!`),
		bullet(`${hl(`Ctrl + \\`)} now properly toggles the sidebar open and closed. Thanks, ${link('https://community.anytype.io/t/commands-for-toggling-sidebar-dont-work/9661', 'andre')}!`),
		bullet(`Sidebar width is now fixed after using keyboard shortcuts ${hl(`Ctrl + .`)} or ${hl(`Ctrl + \\`)}. Thanks, ${link('https://community.anytype.io/t/sidebar-width-resets-to-default-after-using-ctrl-or/11900', 'Hexara')}!`),
		bullet(`Floating sidebar no longer disappears after resizing window. Thanks, ${link('https://community.anytype.io/t/resizing-the-window-makes-the-non-fixed-side-bar-disappear/9442', 'SwiftyChicken')}!`),
		bullet(`To prevent glitches, sidebar resizing logic when sidebar is collapsed has been updated.`),
		bullet(`Sidebar is now always present when launching the app.`),
		bullet(`Tree widgets with linked collections can now be expanded to view contents of collection.`),

		h3(`Sets & Relations:`),
		bullet(`Combo box is no longer cut off at right edge of window in Set: Grid View. Thanks, ${link('https://community.anytype.io/t/minor-grid-view-layout-bug-combo-box-cut-off-at-window-border/12868', 'halr9000')}!`),
		bullet(`Right-clicking on tags in sets no longer opens object action menu. Thanks, ${link('https://community.anytype.io/t/a-right-click-on-a-tag-in-a-table-view-set-or-collection-goof/12759', 'Code-Jack')}!`),
		bullet(`Kanban sets with five or more tags no longer causes a vertical scrollbar to appear. Thanks, ${link('https://community.anytype.io/t/kanban-set-makes-useless-vertical-scrollbar/9807', 'sir-coffee')}!`),
		bullet(`Date & Time relations now properly sync with Daylight Savings Time in system settings. Thanks, ${link('https://community.anytype.io/t/due-dates-and-time-doesnt-apply-day-light-saving-timezones/9919', 'Hexara')}!`),
		bullet(`Years 0-99 are now supported in Date relations.Thanks, ${link('https://community.anytype.io/t/year-0-to-99-are-not-supported-in-any-date-relations/4957', 'BlablaTalker')}!`),
		bullet(`Relations combo box no longer hidden in Grid View for the last object of a large set. Thanks, ${link('https://community.anytype.io/t/relations-options-hide-the-editing-input-box/12622', 'Hexara')}!`),
		bullet(`When adding a new relation, system relations are now grouped in their own section at the bottom of the Relation Select Menu.`),
		bullet(`Options in tag and status relations are now sorted alphabetically.`),
		bullet(`Tooltip for new object button now shows object type which will be created.`),
		bullet(`Mandarin input for text relations now working properly.`),
		bullet(`In the layout menu for Calendar view, ${hl(`Group relation`)} option has been changed to ${hl(`Date relation`)} for better clarity.`),

		h3(`Tables:`),
		bullet(`Cell background color can now be changed. Thanks, ${link('https://community.anytype.io/t/randomly-unable-to-change-table-cells-background-color/11536', 'Hexara')}!`),
		bullet(`Double scrollbar no longer appearing when when opening the three-dots menu to edit the row/column. Thanks, ${link('https://community.anytype.io/t/table-menu-slider-positioning/12073', 'WentAFK')}!`),
		bullet(`Incorrect cell menu is no longer showing after last column is removed.`),

		h3(`Editor:`),
		bullet(`Deleted text no longer reappears after block is deleted. Thanks, ${link('https://community.anytype.io/t/deleted-text-reappears-when-block-is-deleted/12233', 'aero')}!`),
		bullet(`Clicking the local file path link now opens the correct path. Thanks, ${link('https://community.anytype.io/t/clicking-on-a-local-file-path-link-only-opens-the-file-explorer-without-opening-the-path/12772', '4thHydro')}!`),
		bullet(`Windows file path explorer now recognizes names with spaces. Thanks, ${link('https://community.anytype.io/t/windows-file-explorer-path-is-not-recognized-as-a-link-when-there-are-spaces-in-it/12771', '4thHydro')}!`),
		bullet(`Default text color now works properly when selecting multicolored text strings. Thanks, ${link('https://community.anytype.io/t/default-font-color-does-not-remove-text-colors-consistently/9530', 'Romi')}!`),
		bullet(`Orange plus sign no longer disappears after making modifications to blocks. Thanks, ${link('https://community.anytype.io/t/plus-sign-disappears/11101', 'Laurent_P')}!`),
		bullet(`Typing <obj> no longer gets deleted from the editor. Thanks, ${link('https://community.anytype.io/t/typing-obj-gets-removed-immediately/12116', 'Evan')}!`),
		bullet(`Imported PDFs are no longer rendering in lower quality. Thanks, ${link('https://community.anytype.io/t/imported-pdf-is-shown-in-lower-quality/8600/23', 'Flip')}!`),
		bullet(`DnD in modal windows now correctly identifying cursor position. Thanks, ${link('https://community.anytype.io/t/drag-drop-in-modal-window-messed-up/11659', 'LoyalOrange503')}!`),

		h3(`Spellcheck:`),
		bullet(`Accepting spellcheck solution no longer changes text formatting. Thanks, ${link('https://community.anytype.io/t/accepting-spellcheck-solution-messes-with-formatting/11119', 'SorryCantThinkOfANam')}!`),
		bullet(`Accepting spellcheck solution no longer text color in previous letters. Thanks, ${link('https://community.anytype.io/t/spell-check-conflicts-with-text-color/8847', 'jannis')}!`),
		bullet(`Accepting spellcheck solution no longer adds letters before and after @ mentions. Thanks, ${link('https://community.anytype.io/t/strange-behavior-for-inline-mentions-while-using-the-spell-check-feature/10220', 'dzlg')}!`),
		bullet(`Spellcheck now working properly for text relations. Thanks, ${link('https://community.anytype.io/t/spell-check-feature-doesnt-work-in-text-type-relations/10230', 'dzlg')}!`),

		h3(`Graph:`),
		bullet(`Unlinked objects toggle now properly reflects unlinked objects when it is the only toggle selected. Thanks, ${link('https://community.anytype.io/t/graph-view-incorrect-behavior/9521', 'Balcion')}!`),
		bullet(`Updated logic for filtering links, relations, and unlinked objects.`),

		h3(`Other:`),
		bullet(`Deleting bookmark on second open page no longer redirects to previous open page. Thanks, ${link('https://community.anytype.io/t/bookmarks-pagination/10782', 'Sergiu')}!`),
		bullet(`Keyboard command inputs now work in English as well regardless of interface language. Thanks, ${link('https://community.anytype.io/t/commands-are-written-only-in-the-selected-language/10546', 'Foxel')}!`),
		bullet(`When creating links to other objects, object selection is now visually indicated in select menu. Thanks, ${link('https://community.anytype.io/t/object-selection-is-not-visually-indicated-for-link-to-object/12511', 'Flip')}!`),
		bullet(`Unexpected Javascript errors no longer occurring. Thanks, ${link('https://community.anytype.io/t/a-javascript-error-occurred-in-the-main-process/13271', 'Ssussdriad')}!`),
		bullet(`Clicking on title bar of object window no longer minimizes/maximizes Anytype window. Thanks, ${link('https://community.anytype.io/t/double-clicking-unexpected-behavior/8879', 'Raphal')}!`),
		bullet(`Space menu now displays spaces in the correct order when spaces are added from another device.`),
		bullet(`The bug that was preventing auto-update by timer has been fixed.`),

		div(),
		// --------------------------------------------//

		h1(`Patch 0.37.2`),

		h2(`⚡ Quality-of-Life Improvements:`),

		bullet(`Restrictions to add templates to Note type have been removed.`),

		h2(`🐛 Bug Fixes:`),

		bullet(`Fixed a bug that caused inline sets to be blank on creation.`),
		bullet(`${hl('file://')} scheme is now properly working for links. Thanks, ${link('https://community.anytype.io/t/12820', 'Filip')}!`),
		bullet(`Fixed a bug preventing renaming inline sets or collections. Thanks, ${link('https://community.anytype.io/t/cannot-rename-an-inline-set-or-collection/12796', 'Shampra')}!`),
		bullet(`Emoji popup is no longer scrollable. Thanks, ${link('https://community.anytype.io/t/emoji-pop-up-become-scrollable-0-36-24-beta-and-later/12793', 'PavloUA')}!`),

		h2(`💻 Tech:`),
		bullet(`Inter font has been updated to version 4.0. Thanks, ${link('https://github.com/Linerly', 'Linerly')}!`),
		bullet(`Katex has been updated to 0.16.9 to fix crash when entering special symbols. Thanks, ${link('https://community.anytype.io/t/uncaught-katex-error-when-pasting-special-symbols-in-latex-block/12164', 'Jannis')}!`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.37.0 - A Winter Wonderland of Fresh Features ☃️`),
		text(`Happy festive season, Anytypers! We’re excited to be bidding 2023 farewell with another huge release that addresses some long standing community requests, gives you greater control over your data management, and unlocks the possibility to share your pre-created templates and use cases with other Anytypers. Let’s jump in!`),

		h2(`💎 Highlights of this Release:`),

		h3(`Introducing: The ANY Experience Gallery`),
		img('37/1.png'),
		text(`For all of you who’ve longingly admired the various setups others have shared in our ${link('https://community.anytype.io/c/gallery/27/none', 'community showcase')}, or for those of you who’ve created incredible setups of your own that you’ve wished to share, the wait is over.`),
		text(`Introducing: The ANY Experience gallery, a marketplace of use cases, templates, and setups where any member of our community can upload their own experience, or import an experience created by others. To browse the gallery, ${link('https://gallery.any.coop/', 'click here')} (we’ve kickstarted the process with a few experiences of our own). If you’d like to contribute your own experience to the gallery, you can follow the instructions ${link('https://github.com/orgs/anyproto/discussions/123', 'here')}.`),

		h3(`Embed Blocks`),
		video('37/2.mp4'),
		text(`Now live! Simply type /embed in the editor to pull up a menu of currently supported embeds. These include: Mermaid diagrams, Youtube videos, Miro boards, Google Maps, and several more.`),

		h3(`Backlinks MVP`),
		img('37/3.png'),
		text(`Another highly-requested feature we’re thrilled to deliver with this release, is the first iteration of backlinks. Backlinks and forward links have been implemented as relations, and can be found in the relations panel of any object. `),
		text(`By default, if an object already has backlinks, the backlinks will be displayed as a featured relation, indicating the number of backlinks and - when clicked the linked objects. If an object has no backlinks, the relation will not be featured, but can be located in your relations panel.`),

		h3(`Configurable Self-hosting & Local-Only Mode`),
		video('37/4.mp4'),
		text(`The final feature in the highlight reel of this release is configurable settings for self-hosting and local-only mode for your data. To change your sync settings, log out of your account and tap the settings wheel in the top right of the window. There, you’ll see options to choose Self-hosting or Local-only.`),

		h2(`⚡ Quality-of-Life Improvements:`),

		h3(`New Object Creation Menu`),
		img('37/5.png'),
		text(`When right-clicking the plus-button from the navigation menu, you’ll be presented with a menu of standard types, plus your most recently-used Types. In this way, we hope to reduce the number of clicks needed to create objects of a specific type, especially for those of you who love custom object types.`),

		h3(`Object Creation from Widget`),
		img('37/6.png'),
		text(`When hovering over any widget in your sidebar, you’ll see a new plus button next to the widget settings button. By pressing it, you can add any new object to the target widget.`),

		h3(`Local Graph Mode`),
		img('37/7.png'),
		text(`When selecting an object in the graph, you’ll have an option in the graph settings menu to toggle on ${hl('Local Graph')}, which will display only the selected object and its linked objects, rather than your entire graph.`),

		h3(`Widgets can now be created from object 3-dots menu`),
		video('37/8.mp4'),
		text(`Any object can now be transformed into a widget simply by clicking the three-dots menu and selecting the first option: Create Widget.`),

		h3(`Settings pages added to global search`),
		text(`You can now use the global search to navigate to your account settings pages, such as Preferences, Appearance, Recovery Phrase, and Data Management. `),

		h3(`Search now includes content inside closed toggles`),
		text(`When using the ${hl(`Ctrl + F`)} command in the editor, the search will now include content inside of closed toggles. If your search term is found inside the closed toggle, the toggle will open.`),

		h3(`Japanese Language Added to Interface Options`),
		text(`Hooray! Japanese is now part of the growing pool of interface languages available on Desktop. `),

		h3(`Updated Emoji Library`),
		text(`The emoji library has been updated to include additional emojis.`),

		h2(`💻 Tech:`),
		bullet(`Fixed application icons in Linux builds. Thanks, ${link('https://github.com/D-Brox', 'D-Brox')}!`),
		bullet(`Closed possible XSS attack vectors in block content. Thanks, ${link('https://github.com/dragosrotaru', 'dragosrotaru')}!`),

		h2(`🐛 Bug Fixes:`),
		bullet(`Calendar view now properly loads objects outside of current month. Thanks, ${link('https://community.anytype.io/t/objects-only-appear-in-their-months/12401', 'edion86')}!`),
		bullet(`Emojis & Mentions can now be easily deleted with backspace. Thanks, ${link('https://community.anytype.io/t/deleting-and-typing-with-emojis-via-ctrl-e-takes-awhile/2710', 'whereisj9')}!`),
		bullet(`Space key can now be used properly in @mention searches. Thanks, ${link('https://community.anytype.io/t/allow-using-spaces-in-object-name-during-linking-with/8373', 'dzshch')}!`),
		bullet(`Hovers for filter menu options are now working correctly for set & collection filters. Thanks, ${link('https://community.anytype.io/t/part-of-filter-doesnt-open-when-hover/11658', 'PavloUA')}!`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.36.0 - When a little more space is all you need...`),
		text(`Buckle up, Anytypers - November's release is a power lineup of features designed to level up your space game. It's so big in fact, that it <b><i><u>requires you to install the updated version on all devices with Anytype installed before you begin using it</u></i></b>, because backwards compatibility is not guaranteed between versions. Kindly remember to take this step before playing with the new feature set, and as always - we hope you enjoy!`),
		text(link('https://download.anytype.io', 'Download latest platform versions here.')),

		h2(`💎 Highlights of this Release:`),

		h3(`Multi-Spaces are Here!`),
		video('36/1.mp4'),
		text(`Spaces were first introduced in June of this year as a container for your graph of objects. From today's release onwards, you'll be able to level up your space game by creating separate spaces, each with their own graph of objects, widget sidebar, and eventually - privacy settings.`),
		text(`Simply click your profile picture to create new spaces, or navigate between existing ones. Use the space management menu at the top of your sidebar to customize your space settings or delete your space. For now, your account is limited to 10 spaces.`),

		h3(`Calendar View for Sets & Collections`),
		video('36/3.mp4'),
		text(`You asked, we listened - the most popular feature request from our forums is now live! Calendar view has been added as a new view option to sets and collections. To display objects in your calendar, you must select a Date relation to group your objects such as: Creation Date, Due Date, or any custom date relation.`),

		h2(`⚡ Quality-of-Life Improvements:`),

		h3(`Widget Creation via Drag n' Drop`),
		video('36/4.mp4'),
		text(`As a quick solution for creating new widgets, you can now drag & drop linked and mentioned objects from your editor, or objects displayed in sets and collections, directly into the sidebar. `),

		h3(`New Template Picker in Object Creation Flow`),
		img('36/5.png'),
		text(`Upon creating any new object, you'll no longer see a popup window to prompt template selection. Rather, your default template will be applied. If you wish to change it, you can use the template picker on the top of the editor, which will disappear once you begin adding content to the body of the object.`),

		h3(`Search function added to Sets & Collections`),
		text(`Using the new search button in sets and collections (the magnifying glass next to the filter menu), you can now search for objects whose names match your search terms.`),

		h3(`Updated Default Template Selection Flow for Sets & Collections`),
		img('36/6.png'),
		text(`The selection menu for default templates according to set & collection views has been moved from the view settings menu. To select your default template, click the down caret arrow next to the ‘New' button and choose the template you'd like to apply to the view using the three-dots menu.`),

		h3(`Onboarding Updates`),
		text(`We've simplified the sequencing, copy, and text explainers for the new-user onboarding flow.`),

		h3(`Import Improvements`),
		text(`We've made several important improvements to the Notion import via API, including: import of tags, database views, custom icons, and video and audio files.`),

		h2(`💻 Tech:`),

		text(`Electron updated to 0.25.0`),

		h2(`🐛 Bug Fixes:`),

		bullet(`Value in the last cell of a row no longer disappears when using right arrow key. Thanks, ${link('https://community.anytype.io/t/value-in-last-cell-of-a-row-goes-missing-when-using-right-arrow/10468', 'sambouwer')}!`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.35.0 - Fresh Updates for September`),
		text(`This month's release addresses a slew of bugs and polishes targeted at the editor, template, and import experiences, which we hope will bring greater ease to your workflows. Our next big release featuring multi-spaces is coming soon, so stay tuned for some big announcements in October!`),

		h2(`💎 Highlights of this Release:`),

		h3(`Create &amp; Edit Templates from Sets &amp; Collections`),
		video(`35/1-templates.mp4`),
		text(`Finally, template creation on-the-fly is here! From today's release onward, you no longer need to visit the Library to create and edit your templates. Using the ‘Show templates' button in any Set or Collection, you can open, edit, and create new templates for immediate use.`),

		h3(`Updates to Notion Import`),
		text(`Thanks to your feedback, we've fixed many bugs discovered during the import process. We've also updated the import instructions and error messages to make it more clear how to troubleshoot in case something goes wrong.`),

		h2(`⚡ Quality-of-Life Improvements:`),

		h3(`Read-only &amp; Restore-from-Bin Enabled for Deleted Objects`),
		video(`35/2-restore.mp4`),
		text(`You can now open the content of deleted objects in read-only mode. Once opened, you'll see a banner that allows you to restore the object, without needing to visit the Bin to do so. `),

		h3(`Edit Object Icons in Mentioned &amp; Linked Objects`),
		text(`It's now possible to edit the icons of Objects which are referenced via links or mentions in your editor, including checking or unchecking tasks.`),

		h3(`Link to Website is Now First Option When Adding Links to Text Blocks`),
		img(`35/3-menu.png`),
		text(`To simplify the process of adding web links to text blocks, inputting a URL as a text block link will bring Link to Website to the top of the menu. Thanks, ${link(`https://community.anytype.io/t/change-the-layout-of-link-in-font-settings/9757`, `gdbb`)}!`),

		h3(`Logout Button Added to Profile Settings Sidebar`),
		text(`The profile logout button has been moved to your profile settings sidebar, which means it'll be visible no matter which page of your profile settings you're currently using.`),

		h3(`New Onboarding Use Case Added`),
		text(`Strategic Writing has been added as a use case to the onboarding selection, focusing on collecting, developing, and thoughtfully presenting written ideas in Anytype.`),

		h3(`Redesign of Set Control Menus`),
		img(`35/4-set.png`),
		text(`We've updated the design of the View settings menu with options for renaming the view and selecting the default template for the set. In addition, current settings can be previewed from the menu including layout, applied filters, and applied sorts.`),

		h3(`Default Object Type Now Selectable in Collections &amp; Sets-by-Relation`),
		text(`Previously, each new Object created in Collections &amp; Sets-by-Relation required Type selection before proceeding. To make Object creation speedier, you can now define the default Object type for each view in your Collection or Set-by-Relation. `),

		h3(`Vietnamese, Brazilian Portuguese, and Polish added to Desktop Interface`),
		text(`Thanks to the help of our community, our pool of interface languages has grown again! Say hello to Anytype Desktop in 🇻🇳Vietnamese, 🇧🇷Brazilian Portuguese, and 🇵🇱Polish.`),

		h3(`Checkbox Design &amp; Hover State Unified in All Parts of App`),
		text(`For greater visual consistency, the icon design for checked and unchecked Objects which use Layout: Action has been standardized across the app.`),

		h3(`Sets Added Back to Type Select Menu when Using Plus Button`),
		text(`Knowing how frequently our community uses Sets, we've restored Set as a fixed menu option when creating a new Object from the plus-button.`),

		h3(`Added Ability to Copy Blocks from Version History`),
		text(`In the case you want to use content from previous Object versions without restoring the version itself, you can now copy-paste blocks from previous versions to your current object.`),

		h3(`Protobuf Import Renamed to Any-Block; Now Supports Export-Import of JSON Files`),
		text(`In your Space Import and Export menus, the Protobuf option has been replaced with Any-Block, which also supports JSON files. This export option will become the foundation for sharing templates and use cases between Anytype community members—more news to come soon!`),

		h3(`Removed View Selector for Widgets where Source has Single View`),
		text(`For Sets &amp; Collections that have just a single view, their corresponding widget no longer shows a view selector menu.`),

		h3(`Position of Toast Notifications Adjusted`),
		text(`To remove conflicts with the navigation panel, toast notifications now appear at the top of your Anytype window.`),

		h2(`🐛 Bug Fixes:`),

		bullet(`Search palette now correctly displays recently edited objects. Thanks, ${link(`https://community.anytype.io/t/search-palette-doesnt-show-most-recent-objects/9992`, `C.c`)}!`),
		bullet(`Caret position no longer jumps when using the editor. Thanks, ${link(`https://community.anytype.io/t/cursor-jumping-back-while-typing-still-a-problem/10562/3`, `stujo7`)}!`),
		bullet(`When selecting objects as relation value, sort is now applied according to descending values. Thanks, ${link(`https://community.anytype.io/t/inconsistent-sorting-on-macos-vs-ios/10716`, `Hoador`)}!`),
		bullet(`Several layout problems in print version`),
		bullet(`View controllers for Sets &amp; Collections now remain visible regardless of window size. Thanks, ${link(`https://community.anytype.io/t/set-view-controllers-inaccessible-on-certain-screen-width/10301`, `raph`)}!`),
		bullet(`Note snippets are no longer parsing HTML from code blocks. Thanks, ${link(`https://community.anytype.io/t/10589`, `CodeMacLife`)}!`),
		bullet(`Copy and deleting relations before they are created is no longer enabled in Objects, Sets &amp; Collections`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.34.0 - Anytype Goes Global 🌍`),

		text(`We're keeping fresh this summer with some sweeping updates which include our first push of localized interfaces and lots of polishing work on templates.`),
		text(`Big thanks to everyone who's helped to make Anytype more wonderful this month by ${link(`https://crowdin.com/project/anytype-desktop`, `translating the interface to your native language`)}, ${link(`https://github.com/anyproto`, `making pull requests`)}, ${link(`https://community.anytype.io/c/bug-reports/7/none`, `reporting bugs`)}, and spreading the word. We see and appreciate you!`),

		h2(`💎 Highlights of this Release:`),

		h3(`Introduction of Localized Interfaces`),
		img('34/1.png', 'screen'),
		text(`With the help of our linguistically gifted community, we're thrilled to bring you the very first iteration of a localized interface. Anytype desktop is now available in 14 languages! To change your interface language, jump to Settings > Preferences and select the language of your choosing.`),
		text(`Please note that all translations from the English language are community-contributed. If you notice any errors, you're free to submit your corrections ${link(`https://community.anytype.io/t/localization-launch/10269/13`, `using this platform`)}. Any updates will be shipped in the successive release.`),
		text(`Don't see your language? Feel free to ${link(`https://github.com/orgs/anyproto/discussions/45`, `start contributing your own translations`)}!`),

		h3(`Introduction of Blank Templates &amp; Default Template Selection`),

		text(`If you ever wished you could bypass automatic template application when creating objects, a "blank" template has now been added to all types, with the exception of Type: Note. This blank template cannot be deleted or modified in any way.`),
		img('34/2.png', 'screen'),
		text(`Meanwhile, it's now possible to choose a default template for each type. From the types page, click the newly-added three-dots menu for the template, and click on the menu option ${hl(`Set as default`)}.`),
		img('34/3.png', 'screen'),
		text(`This template will now be applied each time you create an object from sets or collections, though you can customize the template according to each set view. When creating objects from the ${hl(`+`)} button or ${hl(`/`)} command menu, you will still be presented with a panel of templates to choose from.`),

		h2(`⚡ Quality-of-Life Improvements:`),
		bullet(`<b>Template titles applied by default</b><br/>Template titles are now applied to new objects created with that template. This paves the way for future updates, such as adding automated titles to templates.`),
		bullet(`<b>Batch updating of object type now possible from Set &amp; Collection</b><br/>
				If you select several objects of the same type, you'll see a new menu option to ${hl(`Change type`)}, which we hope will reduce the need to update types object-by-object.`),
		bullet(`<b>Widgets now available for recently edited & recently opened objects</b><br/>
				${img(`34/4.png`, `screen`)}<br/>
				Depending on whether you prefer to define your recent objects according to recently modified or opened date, you can now choose the corresponding widget. Please note that recently opened widgets are device-specific and therefore will not sync across your devices due to the decentralized nature of the application.`),
		bullet(`<b>Newly created set & collection views now copy settings from currently open view</b><br/>
				Each time you create a new view in your sets or collections, your current view settings - including filters & sorts - will be automatically copied to the new view`),
		bullet(`<b>Block menu control element visible on hover</b><br />
				No need to re-create your widgets - any changes you make to your sets will be instantly reflected in the corresponding set widget`),
		bullet(`<b>Scroll in LaTeX blocks replaced with wrap</b><br/>
				No need for endless back and forth; content in your LaTeX blocks will now wrap automatically for better readability.`),

		h2(`🛠️ Tech & Performance:`),
		bullet(`<b>RPM build is back</b><br />For our Linux lovers, the RPM package manager is now back; you can download RPM builds from our download page.`),

		h2(`🐛 Bug Fixes:`),
		bullet(`Status/tag relation menus no longer opening editing interface on hover`),
		bullet(`Cursor no longer dropping when adding link-in-text using keyboard shortcut`),
		bullet(`Unreadable font color in dark mode for Notion imports has been fixed. Thanks, ${link(`https://community.anytype.io/t/dark-mode-font-color-hard-to-read/8445`, `kunthawat`)}!`),
		bullet(`Numbered lists no longer reset from 40 onward. Thanks, ${link(`https://community.anytype.io/t/numbered-list-resets-after-40-items/10300`, `Rebo`)}!`),
		bullet(`Relations added to objects after set creation are now showing in column view when toggled on. Thanks, ${link(`https://community.anytype.io/t/attributes-weird-behavior/9862`, `saifeldeen`)}!`),
		bullet(`Text context menu is now opening properly for all selected blocks`),
		bullet(`Text relations no longer reverted to previous state in sets after being edited inside the object. Thanks, ${link(`https://community.anytype.io/t/url-source-relation-is-reset-or-set-to-previous-content-when-clicking-url-source-cell-in-set-grid-view/9484`, `xpdmk`)}!`),
		bullet(`KaTeX has been updated to the latest version, permitting LaTeX blocks to render chemical equations. Thanks, ${link(`https://community.anytype.io/t/latex-not-rendering-ce/10326`, `jannis`)}!`),
		bullet(`It is no longer possible to to double-press ${hl(`Enter`)} in paste menu. Thanks, ${link(`https://community.anytype.io/t/pasting-a-link-and-pressing-enter-repeatedly-results-in-pasting-the-link-twice/9453`, `sergiu`)}!`),
		bullet(`Horizontal scrollbar in code blocks no longer appear in PDF exports or print versions. Thanks, ${link(`https://community.anytype.io/t/double-scrollbar-on-pdf-export-for-code-blocks-with-scrollbar/9864`, `jannis`)}!`),

		div(),
		// --------------------------------------------//

		/*
		h2(`Release 0.33.0 - Enter the Void 😶‍🌫️`),

		text(`After an enormous pre-beta launch, we're following up this month with an update to inject some magic into our onboarding experience.`),
		text(`Before we get to the good stuff: this is our last release before we officially launch our public beta(!). On July 19, we'll be opening our repositories and celebrating this occasion with a 24-hour AMA on <a href="https://www.producthunt.com/products/anytype">Product Hunt</a>.`),
		text(`We'd absolutely love for you to join our launch by following us on <a href="https://www.producthunt.com/products/anytype">Product Hunt</a>, bringing us your juicy questions and comments with you on launch day, and maybe even telling a friend.`),
		text(`And now, without further ado:`),

		h2(`💎 Highlights of this Release:`),

		bullet(`<b>Redesigned onboarding &amp; login experience</b>`),

		video(`33/onboarding.mp4`),
		text(`We're calling this one feature, but it's really a whole series of features and designs wrapped into one experience that comprises everything from installation to login.`),
		text(`During the onboarding experience, new users are situated within the "Void" to understand where their space will be created.`),
		text(`From there, users receive supplemental education on the importance of protecting and backing up their keys. Finally, users are able to visualize their identity and personal space as two distinct entities.`),
		text(`Although this flow is primarily designed for new users, existing account holders will also get to join in on some of the fun. You'll notice when logging in or out of your account, that your key window got a colorful new design and that the void concept has been introduced uniformly in all accounts.`),

		h2(`⚡ Quality-of-Life Improvements:`),

		bullet(`<b>Account & Space Settings Menu Updates</b>`),
		text(`We've re-arranged some of the elements in your account and space settings menu to work more intuitively - namely, import and export menus have moved from your account to your space settings.`),
		text(`We've also added a description field to your account settings, which is reflected in your profile object as Relation: Description.`),

		bullet(`<b>Views in Set widgets are now correctly updated when something is changed in source set</b>`),
		text(`No need to re-create your widgets - any changes you make to your sets will be instantly reflected in the corresponding set widget.`),

		h2(`🛠️ Tech & Performance:`),

		bullet(`<b>Windows build now signed with certificate</b>`),
		text(`Say goodbye to Windows Defender alerts - our security certificate has now been signed`),

		h2(`🐛 Bug Fixes:`),

		bullet(`<b>"Last opened" homepage setting now working correctly</b>`),
		bullet(`<b>Image popups no longer flickering when resizing windows.</b> Thanks, ${link('https://community.anytype.io/t/image-popup-flickering-around-when-resizing-window/9580', 'jannis')}!`),
		bullet(`<b>Right-clicking on file no longer opens object.</b> Thanks, ${link('https://community.anytype.io/t/right-click-on-file-opens-its-object-page/9496', 'person')}!`),
		bullet(`<b>Right-clicking on object from sidebar no longer opens object.</b> Thanks, ${link('https://community.anytype.io/t/sidebar-right-click-bug/9605', 'isle9')}!`),
		bullet(`<b>It's now possible to copy text from block when block menu is open.</b> Thanks, ${link('https://community.anytype.io/t/use-blocks-tab-to-copy-and-paste/9003', 'sooyoung')}!`),
		bullet(`<b>Caret position no longer jumps on alt + delete</b>`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.32.0: Welcome to the Space Jam 🌌`),
		text(`Well folks, this is the release. THE release which integrates our Anysync protocol, introduces spaces to the anyverse, and opens the path towards multiplayer mode and the browser-like experience we wish to introduce. We are incredibly thankful to all @nightlytypes and new beta users who bravely tested multiple migrations and pre-release versions to help us roll out a polished product to the rest of our community.`),
		text(`More than 300 bugs, polishes, and features were merged into this one update, so we won't detail each and every one of them. Instead, in this month's What's New edition, we'll be focusing on the main changes you'll notice once you've installed the new app, and describing each in greater detail.`),

		h2(`Introduction of Private Spaces`),
		video(`32/1-spaces.mp4`),
		text(`Upon opening this version you'll notice a new addition to your account: that of ${hl(`Space`)}. Your space can be customized in terms of name, icon, and homepage, which you'll find by clicking on the settings wheel on the ${hl(`Space`)} button.`),
		text(`Your space homepage is the main page you'll see, each time you open Anytype. You can select any object or your graph as your space homepage. Clicking on the space widget in the top position of your sidebar will open your space settings. To return to your home page from anywhere in the app, you can use shortcut: ${hl(`${alt} + H`)}`),

		h2(`Integration of Anysync protocol`),
		text(`While it won't be visible from the interface, this release brings the integration of our new Anysync protocol, a work which has been years in the making. For us, arriving here means showing the world that a local-first, p2p synced protocol with an E2E encrypted product built on top, is possible. We hope you'll find the syncing of your accounts between devices a smoother experience than before, and rest easy knowing that your data is absolutely yours.`),

		h2(`Introduction of Widgets`),
		video(`32/2-widgets.mp4`),
		text(`Over the past months, we've thought long and hard about how to improve the navigation experience towards a more flexible approach. Enter: widgets, modular units which can be added or removed from your sidebar. Widgets allow you to quickly navigate to your objects and visualize the other objects they are linked to.`),
		text(`When creating widgets, keep in mind that a widget "source" can be any object which you've previously added to your graph, or a dynamic list of your "recent", "favorite", or "sets" objects - tabs which were available in the previous tab of your homescreen.`),
		text(`Widgets of any kind can be displayed as a link; meanwhile, widgets pointing to singular objects created with the editor can be displayed with "tree" appearance. Widgets pointing to sets, collections, recents, or favorites, can be displayed as a simple or compact list with all target objects inside.`),

		h2(`New navigation bar`),
		video(`32/3-navbar.mp4`),
		text(`Many commands which were previously dispersed throughout the interface have now been condensed into one navigation bar, which is your home base for managing and moving about your anytype. The navigation bar will remain visible no matter where you are in the app, putting your graph, global search, and profile settings within easier reach.`),

		h2(`Collections`),
		video(`32/4-collections.mp4`),
		text(`With this update you'll also discover Collections, which work less like a filter (Sets) and more like a folder. Any object in your graph can be manually added to a collection, either by using the + New buttons in the collection itself, or by selection ‘Link to' from the target object's 3-dots menu.`),
		text(`Similarly with sets, you can visualize your collections based on four different views, and you can also sort & filter your collections based on object relations. Unlike sets however, adding an object to a given collection creates a new link in your graph.`),
		text(`To get you started on your Collections journey, you'll now see the option to turn any set into a collection of objects, as well as the menu option to create a collection when you hit the ‘plus' button. `),

		h2(`Protobuf Export & Import`),
		img(`32/export.png`, 'screen'),
		text(`In case you would like to transfer objects between anytype accounts, protobuf export is now available on the object and account level. When sharing the object with another anytype user, simply share the exported file - which the other user can import directly as an object in their account. Separately, if for any reason you need to create a new account and wish to preserve all objects in your account, you can also make an export of all your objects by navigating to your Profile settings > Export.`),

		div(),
		// --------------------------------------------//

		h1(`Release 0.31.0: Inline Sets are Here 😍`),
		text(`Throughout the past months, our team has been researching &amp; designing solutions to our community's needs to manage several objects at once.`),
		text(`As the first in a series of projects addressing this topic, we're happy to bring you inline sets, which will allow more flexible interaction between sets & objects, allowing you to freely embed the former within the latter. If February is about surprising your loved ones, consider this feature our early Valentine's gift to you 💖`),

		h2(`💎 Highlights of this Release`),

		bullet(`<b>Inline Sets</b><br/>We've added a new block type - inline set. You can create an inline set using commands ${hl(`/inline`)} or ${hl(`/&lt;viewtype&gt;`)} to select gallery, grid, etc.<br/><br/>Once created, select an existing set as a source, or create a new one. Any changes you make to the inline set query, icon, or name will be synced with the source set. Meanwhile, views will not synced, but copied, which means you can tweak views to your current needs without worrying that your source set will be impacted.`),
		video(`31/1-inline-set.mp4`),

		bullet(`<b>Library Redesign</b><br/>Your control panel for managing types &amp; relations got a facelift in 0.31.0. Descriptions have been removed and buttons have been updated for a lighter, cleaner look &amp; feel.`),
		img(`31/2-library.png`, 'full screen'),

		h2(`⚡ Quality-of-Life Improvements`),

		bullet(`<b>Notion Import via API</b><br/>Here by popular demand: importing your files directly from Notion to Anytype! The new integration preserves relationships between parent-child pages as links between imported Objects. Follow the instructions from the ${hl(`Settings &gt; Import &gt; Notion &gt; Learn more`)} section to set up your integration token and start importing your files to your space.`),
		img(`31/6-import.png`, 'full screen'),

		bullet(`<b>Graph redesign</b><br/>We've re-worked the graph to include Object previews-on-hover, Icons as nodes, and directional arrows. We will continue to expand our graph functionality in the coming few releases, so stay tuned for further updates.`),
		img(`31/3-graph.png`, 'full screen'),

		bullet(`<b>Gallery view Playback</b><br/>Sets of audio & video files now permit playback from gallery view. Using Page cover in set by Video for example, will make cards playable as well.`),
		video(`31/5-set-playback.mp4`),

		bullet(`<b>Profile added to Settings</b><br/>You can now edit your profile name & picture from your account settings. Any changes made there will be immediately synced with your Profile object.`),
		img(`31/4-profile.png`, 'half screen'),

		bullet(`<b>Upgrades to key panel</b><br/>Buttons in the "Recovery Phrase" panel of your Settings menu now show "Hide" or "Show", depending on whether the phrase is blurred or not. Thanks, ${link('https://community.anytype.io/t/8029', 'sambouwer')}!`),

		h2(`💻 Tech &amp; Performance`),
		bullet(`Electron upgraded to 22.0.0`),
		bullet(`Node update to 16.17.1`),
		bullet(`Lots &amp; lots of code refactoring in preparation for opening our repositories`),
		bullet(`We've changed the way we store view changes in sets (atomically instead of whole view model), to optimize for performance in sets &amp; objects containing inline sets.`),

		h2(`🐛 Bug Fixes`),
		bullet(`The "Views" dropdown menu in sets is now working properly. Thanks, ${link('https://community.anytype.io/t/7945', 'isle9')}!`),
		bullet(`Editing text relations is now working properly. Thanks, ${link('https://community.anytype.io/t/7793', 'dzlg')}!`),
		bullet(`The views list in sets is no longer collapsing when sidebar is open`),
		bullet(`Object icons in the @mention menu are now displaying correctly`),
		bullet(`Divider blocks can now (again) be created by using three dashes. Thanks, ${link('https://community.anytype.io/t/8109', 'philoup')}!`),
		bullet(`Object counter is now working properly when deleting from Bin. Thanks, ${link('https://community.anytype.io/t/8073', 'sambouwer')}!`),
		bullet(`Objects containing ellipses and ranges are now working properly in the @mention menu`),
		bullet(`Lines are no longer deleted when using spellcheck. Thanks, ${link('https://community.anytype.io/t/8104', 'f0ca')}!`),
		bullet(`Center & Right align for LaTeX blocks is now working properly. Thanks, ${link('https://community.anytype.io/t/7725', 'uz4a8')}!`),

		div(),
		// --------------------------------------------//

		h1(`2023: Ready, Set... Declutter 😎`),
		text(`Welcome to the first release of the new year! After some major refactoring work in the last quarter of 2022, we're pleased to deliver an update that we hope will allow you to clear the clutter from your account and start the new year with a clean, productive slate.`),

		h2(`💎 Highlights of this Release`),
		bullet(`<b>Type &amp; Relation Deletion &amp; Modification</b><br/>We've heard you loud &amp; clear - starting with this update, it's now possible to remove &amp; modify both pre-installed and custom-made Types &amp; Relations from the Library. Any modifications will be reflected in Objects which have already used these Types &amp; Relations.`),
		video('type-deletion.mp4'),
		bullet(`<b>Introduction of Marketplace</b><br/>In case you're wondering where all of those pre-installed Types &amp; Relations have gone, they're now conveniently stored in the Marketplace for both existing &amp; new users to install to your account (and eventually add your own). Access the Marketplace from the new &quot;Marketplace&quot; tab in the Library.`),
		img('marketplace.png', 'full screen'),
		bullet(`<b>Set by Relation</b><br/>Sets are no longer just limited to Types! You can now create Sets by filtering for Objects which share a certain Relation. Quick hack for anyone who wants an overview of all Objects in their account: Create a Set by Relation: Creation Date, and... ta-da!`),
		video('set-relation.mp4'),
		bullet(`<b>Everything as an Object</b><br/>...seriously, everything. Types &amp; Relations are now their own Objects, meaning that it's possible to create Relations and Sets of Types and…Relations. While you may already start experimenting with these features in the Library by opening each Type/Relation individually, this update also unblocks other highly-requested features such as grouping and tuning relation values.`),

		h2(`⚡ Quality-of-Life Improvements`),
		bullet(`<b>Multi-select, delete &amp; link from Graph</b><br/>Say goodbye to rogue Objects hanging around in your graph! It's now possible to right-click on Objects in the Graph to open a menu of operations, including Delete &amp; Link. Hit ${hl(`${shift} + Click`)} to multi-select and bulk-manage these Objects.`),
		bullet(`<b>Link-to Feature</b><br/>You now have an easy way to link Objects with each other, which doesn't require editor blocks. Use the &quot;Link to&quot; option in the Object 3-dots menu or in Graph to create direct links and quicker association between Objects.`),
		img('link-to.png', 'full screen'),
		bullet(`<b>Type creation on-the-fly (Desktop-only)</b><br/>It's now possible to create or install new Types in Editor without needing to visit the Library. Whether creating an Object for the first time or changing its Type, use the dropdown to turn your Objects into whatever's top of mind.`),
		img('type-creation.png', 'half screen'),
		bullet(`<b>Kanban groups syncing cross-device</b><br/>Groups in Kanban are now correctly updating when changed from another device. Furthermore, if you add or delete any tags your Kanban will receive real-time updates!`),
		bullet(`<b>Block navigation via arrow keys</b><br/>Speed through document editing and review by jumping between blocks using your left and right arrow keys.`),
		bullet(`<b>Copy button next to Anytype version</b><br/>Bug reports just got that much easier - now, you can copy the version in one click by opening the Anytype → About Anytype window from the application menu.`),
		img('copy-version.png', 'half screen'),
		bullet(`<b>Download button for image blocks</b><br/>Any image block in your editor now shows a download icon on hover, in case you would like to download and save images previously added to your Objects.`),
		img('image-download.png', 'half screen'),
		bullet(`<b>Design update: Link &amp; Bookmark Blocks</b><br/>Link &amp; bookmark blocks for URLs pasted from the web got a little facelift with this update - expect to see a small difference in font weights &amp; favicons.`),
		bullet(`<b>Design update: Read-only Relations in Sets (Grid View)</b><br/>Relations which cannot be updated (for instance &quot;Created by&quot; or &quot;Creation Date&quot;) now have a lock icon displayed to indicate that they cannot be edited.`),
		bullet(`<b>Toast notifications</b><br/>For greater clarity on actions you've taken in Anytype, we've introduced toast notifications for certain operations such as linking between Objects or installing new Types and Relations.`),
		img('toast.png', 'half screen'),
		bullet(`<b>Link blocks in text mode previews</b><br/>It's now possible to further customize how linked Objects in text mode appear in your editor. Click the orange handle next to the link block and choose Preview to play around with Description, Type, and/or Content in your Object preview.`),

		h2(`🐛 Bug Fixes`),
		bullet(`&quot;Edit URL Link&quot; modal window no longer jumps to top left corner. Thanks, ${link('https://community.anytype.io/t/modal-for-edit-link-locates-at-the-top-left-corner/7820', '@gdbb')}!`),
		bullet(`&quot;Create new Tag&quot; option now disappears once a Tag has been selected from dropdown. Thanks, ${link('https://community.anytype.io/t/minor-bug-when-adding-tags-by-typing-partial-string-then-clicking-on-desired-tag/5748', '@sambouwer!')}`),
		bullet(`Copy/paste in relation editing component is now working`),
		bullet(`Drag'n'drop in Kanban is now updating to the correct position in the group`),
		bullet(`${hl(`${cmd} + Return`)} to navigate to homescreen now works correctly. Thanks, ${link('https://community.anytype.io/t/command-return-to-go-to-home-screen-doesnt-work/7592', '@dzlg')}!`),
		bullet(`Hitting ${hl(`Tab`)} from a simple table cell no longer skips a column. Thanks, ${link('https://community.anytype.io/t/simple-table-new-columns-not-respected-by-tab/7533', '@Flip')}!`),
		bullet(`Time selector now handles timezones properly. Thanks, ${link('https://community.anytype.io/t/time-selector-handles-timezone-improperly/7589', '@u74a8')}!`),
		bullet(`App updates are no longer possible when pin-code is locked. Thanks, ${link('https://community.anytype.io/t/anytype-can-update-before-entering-pin-code/7283', '@sambouwer')}!`),
		bullet(`New selection marquee no longer draws in corner on click. Thanks, ${link('https://community.anytype.io/t/new-selection-marquee-draws-in-corner-on-click/7610', '@Erindale')}!`),
		bullet(`Closing Anytype on Mac while in fullscreen mode no longer causes an error. Thanks, ${link('https://community.anytype.io/t/closing-anytype-in-full-screen-causes-an-error/7650', '@ShukantP')}!`),
		bullet(`Menu no longer closes when clicking/hovering on &quot;Select Relation Type&quot; while creating new Relations. Thanks, ${link('https://community.anytype.io/t/clicking-on-select-relation-type-closes-the-menu/7571', '@kerbless')}!`),
		bullet(`Search is no longer accessible from the tray menu when pin-code is locked. Thanks, ${link('https://community.anytype.io/t/you-can-access-objects-while-app-is-locked/7867', '@sambouwer')}!`),
		bullet(`LaTeX blocks now close correctly when clicking on another LaTeX block. Thanks, ${link('https://community.anytype.io/t/latex-block-closing-issue/7398', '@Karthik')}!`),
		bullet(`Forward navigation button is now working properly. Thanks, ${link('https://community.anytype.io/t/forward-button-is-always-gray/7797', '@gdbb')}!`),
		bullet(`Global search hotkey is now working correctly when search results are in focus. Thanks, ${link('https://community.anytype.io/t/global-search-hotkey-not-working-when-search-results-are-in-focus/7554', '@Flip')}!`),
		bullet(`Using the keyboard to create an Object, then typing without clicking somewhere no longer edits the title of the parent Object. Thanks, ${link('https://community.anytype.io/t/creating-task-and-typing-changes-title-of-parent-object/7688', '@Flip!')}`),
		bullet(`Search menu is now working correctly when coming back from another app using ${hl(`${cmd} + Tab`)}. Thanks, ${link('https://community.anytype.io/t/search-box-not-functioning-as-expected/7506', '@dzlg')}!`),
		bullet(`Dividing grey line between columns no longer disappears on hover. Thanks, ${link('https://community.anytype.io/t/grey-line-disappearing-between-columns/7750', '@nikm07')}!`),
		bullet(`Search bar now works when navigation window is open. Thanks, ${link('https://community.anytype.io/t/unable-to-input-in-the-search-box-in-the-navigation-window/7748', '@dzlg')}!`),
		bullet(`Side mouse button now allows navigation in Settings window. Thanks, ${link('https://community.anytype.io/t/the-settings-window-cannot-be-operated-with-the-mouse-side-button/6556', '@Poto')}!`),
		bullet(`Exact date filters in Sets are now working properly`),
		bullet(`Header no longer disappears when scrolling while an Object is opened in modal view. Thanks, ${link('https://community.anytype.io/t/stick-the-operation-bar-when-scroll-down-the-page/7643/1', '@gdbb')}!`),
		bullet(`Using the Del key to merge content between blocks now works consistently. Thanks, ${link('https://community.anytype.io/t/using-del-to-merge-blocks-only-works-once/7670', '@Flip')}!`),

		div(),
		// --------------------------------------------//

		h1(`September: Preparation and Polish 💅`),

		text(`Throughout September, our backend and platform teams have been occupied with refactoring relations aka the &quot;Relations as an Object&quot; project. This effort, though not visible in this month's release, is essential to unblocking long-awaited features such as Relations deletion/modification and in-line Sets (we promise, it's coming!).`),
		text(`Meanwhile, the improvements and bug fixes in this release are primarily geared towards editor polishing and responses to your feedback from our last release. Thanks to everyone who's tested new features, created bug reports, and let us know your concerns.`),

		h2(`💎 Highlights of this Release`),
		text(`We know that a clean interface is essential to productivity for many of you. In this release, we simplified our Type selection interface from + button Object creation flow to reduce friction in quickly capturing your thoughts &amp; ideas. Keyboard arrows or ${hl(`${cmd} + 1-4`)} will allow you to quickly navigate between the Types or jump directly to the search menu for your Types.`),

		h2(`⚡ Quality-of-Life Improvements`),
		bullet(`Relations now updating automatically using drag &amp; drop between columns from Kanban view`),
		video('kanban-dnd.mp4'),
		bullet(`Selection frame when selecting block is now visible`),
		img('selection.png', 'full screen'),
		bullet(`When scrolling content of page opened inside popups, menus positions are now correctly updated`),
		bullet(`Added page overscrolling for better readability, so content now ends in the middle of the screen rather than the bottom`),
		bullet(`Added multilingual spellcheck support`),
		img('multi-lang.png', 'half screen'),
		bullet(`Updated in-page search design to include number of matching results and scrolling`),
		img('search.png', 'half screen'),
		bullet(`Updated toggle block design so toggles are default open when applying block style changes`),
		bullet(`Added possibility to open new windows from search interface when pressing ${hl(`${cmd} + Enter`)}`),
		bullet(`Simplified type-selection interface from + button Object creation flow to reduce friction in quick capture of thoughts &amp; ideas`),
		video('type-selection.mp4'),
		bullet(`Export settings are now saved from one export to another`),
		bullet(`In-app survey and logic was re-worked to reduce frequency and increase relevance towards new users, veteran users, and exiting users`),
		bullet(`New windows now open by default with a slight position shift so your windows aren't stacked on top of each other`),
		bullet(`File names created from the web are now more pretty`),
		bullet(`Added table support when exporting to markdown`),
		bullet(`Added document name to window title for better navigation between open windows`),
		bullet(`Removed automatic sidebar-hiding when window is too small`),

		h2(`💻 Tech`),
		bullet(`Electron was updated to 20.1.1`),

		h2(`🐛 Bug Fixes`),
		
		bullet(`Set column width is now working again. Thanks, ${link('https://community.anytype.io/t/i-cant-adjust-the-width-of-the-graph/7327/5', '@Konstantin')}`),
		bullet(`Bug that was causing two relations in one direction to overlay in graph view. Thanks, ${link('https://community.anytype.io/t/superimposing-the-text-of-two-relationship-names/7329', '@Konstantin')}`),
		bullet(`Block focus loss after block link creation. Thanks, ${link('https://community.anytype.io/t/all-blocks-should-get-focus-after-creation/5776', '@sambouwer')}`),
		bullet(`Top toolbar button was missing in fullscreen mode. Thanks, ${link('https://community.anytype.io/t/top-toolbar-button-missing-in-full-screen-mode-in-ubuntu', '@Aleph1')}`),
		bullet(`Date selector was setting incorrect dates. Thanks, ${link('https://community.anytype.io/t/names-of-days-on-date-picker-incorrect-off-by-one-day/7289', '@dannyg')}`),
		bullet(`Shortcuts to duplicate and delete blocks are now working. Thanks, ${link('https://community.anytype.io/t/shortcuts-dont-work-when-block-menu-is-open/4480', '@david')}`),
		bullet(`Ability to open new windows with ${hl(`${cmd} + Click`)} is now restored in all cases`),
		bullet(`Zoom-in window action hotkey was updated to ${hl(`${cmd} + =`)} to work correctly on Windows. Thanks, ${link('https://community.anytype.io/t/after-update-0-28-0-it-is-not-possible-to-enlarge-text-by-ctrl-also-contains-suggestions/7341/4', '@akta')}`),
		bullet(`Relation creation flow for Relation-type: Object was not working after the previous release. Thanks, ${link('https://community.anytype.io/t/object-relation-is-broken-after-the-0-28-update/7381', '@dzlg')}`),
		bullet(`Pasting images from clipboard is now working again`),
		bullet(`Emojis are now correctly pasted when copied from outside of Anytype`),
		bullet(`Underline paste support`),
		bullet(`Link blocks are now correctly removed when using ${hl(`${cmd} + X`)} command`),
		bullet(`Updated: Markdown is now being parsed automatically on paste`),
		bullet(`Export with ${hl(`Include Files`)} flag toggled on, no longer creates files directory`),
		bullet(`Removed: An ability to create new page title blocks in certain situations`),

		div(),
		// --------------------------------------------//

		h1(`Your Workflows Just Got a Major Upgrade!`),
		text(`Hey, Anytypers!`),
		text(`We just couldn't let August go by without another monster release. Hold on tight, 'cause this one's packed with updates that we hope will make your workflows all the more enjoyable`),

		text(`Here's what you can look forward to with this release:`),

		h2(`💎 Highlights of this Release`),

		text(`Kanban: Task management just got way easier with Kanban views for Sets. In this first iteration, you can group your Objects according to Relations: Status, Tag, or Checkbox. Dragging Objects between columns will automatically update the Relations`),
		video('kanban.mp4'),
		text(`Multi-window display: By simply holding ${hl(`${cmd}`)} and clicking on any Object in your workspace, you can now open it in a new window. Even better, drag and drop blocks between windows for some seriously efficient workflows`),
		img('multi-window.png', 'full'),
		text(`Spellcheck: Your dreams of typo-free note taking just came true. Choose your input language by heading to ${hl(`Settings > Personalization > Spellcheck language`)} and - depending on your typing accuracy - get ready to see some corrections`),
		img('spellcheck.png', 'full'),

		h2(`🚀 Quality-of-life Improvements:`),
		bullet(`Previously-uploaded images now saved in Image Library: When selecting Object covers you can now choose from a library of any images you have uploaded to your workspace`),
		bullet(`Delete block shortcut added: Simply press Backspace with your block menu open (orange three-dots menu), and you'll delete the whole block`),
		bullet(`Copy Recovery Phrase button added to Settings: To reduce the number of lost keys, we introduced buttons in our Recovery Phrase and Logout screens to show and automatically copy your phrase`),
		bullet(`'What's New' window optimization: For faster performance, the 'Whats New' window was optimized and now shows the previous three releases. Older releases can be viewed by clicking the ${hl(`Older Releases`)} button at the bottom of the window`),
		bullet(`Settings keyboard navigation introduced: Navigate back in Settings using keystrokes ${hl(`${cmd} + \[`)} or ${hl(`Alt + arrow left`)}`),
		bullet(`Emoji group icons introduced: Search for emojis more quickly using the group icons at the bottom of the emoji picker`),
		bullet(`Emoji skin tones added: Right-click emojis from the picker to change the skin tone`),
		bullet(`Zoom-in/Zoom-out now possible: Not just for Object view, but any open window. ${hl(`${cmd} +`)} for zoom-in, ${hl(`${cmd} -`)} for zoom-out and ${hl(`${cmd}+0`)} to restore zoom`),
		bullet(`View creation process in Sets has been updated to include 'Duplicate' and 'Remove' views`),
		bullet(`Context menu when pasting URLs updated: A more user-friendly context menu includes options to ${hl(`Create bookmark`)}, ${hl(`Paste as Link`)}, or ${hl(`Paste as Text`)}`),
		bullet(`Button to create new Objects from Set view has an updated design clearer workflows`),
		bullet(`Bookmark Objects are now fully editable: Open bookmarks option to reload bookmark from source was moved in Object menu`),
		bullet(`Linking to bookmark Objects now creates Bookmark blocks rather than Link blocks`),
		bullet(`Application size is now 250MB less when unpacked`),
		bullet(`Image preview modal window has been re-introduced`),
		bullet(`History tab on dashboard and sidebar is now changed to 'Recent' and sorts Objects by last modified (rather than last opened) date`),
		bullet(`Pin-code prompt window now correctly restores focus when application window is focused`),
		bullet(`Shortcut added for underline markup: ${hl(`${cmd} + U`)}`),
		bullet(`Dragging blocks with pressed ${hl(`Alt`)} now duplicates them on drop`),

		h2(`🔐 Security`),
		bullet(`Electron part of the app was completely re-written, resulting in huge security improvements and Electron was updated to 20.0.2 from 19.0.7`),
		bullet(`Libp2p upgrade`),

		h2(`🐛 Bug Fixes`),
		bullet(`Objects can no longer be glimpsed before entering pin-code`),
		bullet(`Block links are now opening correctly from modal window`),
		bullet(`Removed: Onboarding video popup was causing application crashes for new users`),
		bullet(`Removed: Update progress bar from print version of Objects`),
		bullet(`Bug that was preventing ${hl(`${shift} + Space`)} combination from working`),
		bullet(`Removed: Temporary files that were saved in .tmp folder inside application data, when pasting media or exporting files in external applications`),
		bullet(`Number-of-days filter in Sets no longer prevents value removal`),
		bullet(`Simple tables within columns are now being resized correctly`),
		bullet(`Tab key while editing simple tables is no longer causing the cursor to jump two cells`),

		div(),
		// --------------------------------------------//

		h1(`Happy August, Anytypers!`),
		text(`Over the past weeks our team has been busy with both process and product updates. From now on, you can expect a cross-platform release every four weeks.`),
		text(`We'll continue publishing Desktop release notes here; meanwhile, you'll be able to find the full release notes for every platform in the News &amp; Announcements section of our Community Forums.`),
		text(`Without further ado, here's what we've cooked up for you in this release:`),

		h2(`💎 Highlights of this Release`),
		text(`Simple tables are here! As one of our most popular feature requests, we're so excited to introduce simple tables across all platforms. From the editor, simply type ${hl(`/table`)} and customize the number of cells, column widths, and background colors to your liking. You can use shortcut ${hl(`/table{x}-{y}`)} to create table with ${hl(`X`)} rows and ${hl(`Y`)} columns as well.`),
		video('table.mp4'),
		text(`Bookmarks as Objects: To help keep track of links you've bookmarked around the web, you can now create Sets with Type: Bookmark, so you can view and sort them all in one place. Say goodbye to lost links forever!`),
		img('bookmark.png', 'full'),
		text(`New ${hl(`Getting Started`)} Objects (New Users only): Upon registration, new users will see an updated ${hl(`Get Started`)} page and ${hl(`Advanced`)} page, with concise explanations of core concepts and a set of bookmarked demo videos for typical use cases.`),
		text(`For everyone else who's interested in honing your Anytype superpowers, check out our demo videos and let us know what other kind of content or use cases you'd like to see!`),

		h2(`🚀 Features &amp; Enhancements`),
		bullet(`Text underline: The underline option is here. Underline away, friends!`),
		bullet(`Callout blocks: By using ${hl(`/callout`)} in our editor, you can now create Callout Blocks as a way to highlight specific bits of information, like this:`),
		img('callout.png', 'full'),

		h2(`⚡ Quality-of-Life Improvements`),
		bullet(`Text letter spacings were corrected for improved readability`),
		bullet(`Link styles have been updated and the double squircle icons next to text links have been removed`),
		bullet(`Code blocks now have a ${hl(`copy`)} button in the interface`),
		bullet(`Sidebar and editor got a technical update, and now work a bit faster`),
		bullet(`Key and QR code are now not only blurred, but replaced with a substitute for security purposes`),
		bullet(`The preload screen has a new Anytype icon and logo`),
		bullet(`Mentions and link menus were modified`),
		bullet(`Dates everywhere in the app were changed to work in local timezones, including filters in Sets`),
		bullet(`Menus like mention or search (which load a list of Objects) now load page-by-page, for performance optimization`),
		bullet(`Author was removed from featured Relations by default`),

		h2(`🐛 Bug Fixes`),
		bullet(`Fixed a bug that was causing Anytype to crash during startup with a Javascript error`),
		bullet(`Fixed a bug that was allowing the Type selection interface to reappear after the Type had been selected`),
		bullet(`Fixed a bug that was allowing pasting in locked Pages`),
		bullet(`Fixed a bug that was preventing Object restoration from Version History`),
		bullet(`Fixed a bug which prevented horizontal scroll in unwrapped code blocks`),
		bullet(`Alphabetical sort of Types in the Library has been corrected`),
		bullet(`Removed circular references in the sidebar`),
		bullet(`Dragging blocks to the sidebar is now working for normal Objects`),
		bullet(`Fixed ability to change source in Sets after creation`),
		bullet(`Fixed a scroll problem when navigating Objects with ${hl(`${cmd}+Arrow up/down`)}`),
		bullet(`Removed the ability to copy/paste the title of a page as a title block`),

		div(),
		// --------------------------------------------//

		h1(`13 June 2022 Desktop`),

		h2(`Highlights of this release include:`),
		bullet(`Users can now permanently delete their Anytype account, including objects stored on the backup node 🗑️`),
		bullet(`Relative values for date filters 📅`),
		bullet(`A shiny new app icon! 💅🏻`),

		h2(`Features`),
		bullet(`Permanently erase your Anytype account, key, and objects stored on the backup node. This is irreversible, and we cannot help you recover your data. You will have 30 days to change your mind.`),
		bullet(`Highlight block now changes style to paragraph when pressing backspace in empty block, like lists`),
		bullet(`Objects in ${hl(`move to menu`)} are now being sorted by last edited date`),
		bullet(`Ability to drag-and-drop blocks directly to the sidebar`),
		bullet(`Date filters in Sets received support for relative values`),
		bullet(`Show featured relation star by default in the relations panel`),
		bullet(`An updated app icon`),

		h2(`Bugs`),
		bullet(`Drop into columns was reworked and now works more consistently`),
		bullet(`Sets sometimes were resizing incorrectly when making changes`),
		bullet(`Chinese input methods when editing title or description in pages like Object Type or Set was fixed`),
		bullet(`Incorrect search order of options when searching for some languages in code block`),
		bullet(`Inability to delete selected blocks that have nested children`),

		div(),
		// --------------------------------------------//

		h2(`27 April 2022 Desktop`),
		text(`Hello everyone! After a short Easter break, we're back with some exciting updates.`),
		text(`This version of Anytype doubles-down on productivity, making it easier for you to work with multiple objects at once. 🔑 Key to this update is the ability to now delete several objects from a Set. You can learn more about how this works below. 👇`),

		h2(`Multi-select in Sets`),
		{ text: `We've brought multi-object selection to Sets! You can now perform bulk actions such as ${hl(`Duplicate`)}, ${hl(`Add to Favorites`)}, or ${hl(`Move to Bin`)}. Previously, it was challenging to work with several objects within a Set; now, you can manage them all with a single click.` },
		text(`It also works with the keyboard. Selecting with ${shift} and then pressing Delete will move them all to the Bin.`),

		h2(`Ludicrous-mode for Relations`),
		text(`Organizing, filtering, and focusing on certain objects just became faster with our new Relations menu.`),
		text(`By clicking the column name in Grid View, you can now directly sort and filter your objects according to the chosen relation. Moreover, with the new menu you can create and insert relations anywhere within a Set, allowing for greater flexibility.`),
		video('relation-menu.mp4'),
		text(`We hope these improvements unlock many new and novel use-cases for Anytype, and help our power-users all the more powerful. 🦸`),

		h2(`Other notable improvements`),
		bullet(`Anytype's dark and light mode can now sync with your OS. Check it out by navigating to Settings → Appearance → System.`),
		bullet(`New link appearance. Links have been re-designed with more balance between text content and images.`),
		bullet(`Sort your Sets by A - Z in the sidebar. Thanks, ${link('https://community.anytype.io/t/sidebar-sort-options/4999', 'hysci')}`),
		bullet(`We've added an onboarding video for first-time users, check it out in our ${link('https://doc.anytype.io/d/', 'docs')}.`),
		bullet(`Library now works in modal view. You can write a poem and change the template simultaneously.`),
		bullet(`Blocks will now be highlighted after drag'n'drop, allowing you to keep better track of content that's been moved.`),
		bullet(`We restructured our keyboard shortcuts pane for clarity.`),

		h2(`Bugs`),
		bullet(`App failed to add new options to status relation. Thanks, ${link('https://community.anytype.io/t/cant-define-options-for-status-type-relations/5857', 'Ragnen and Cernel1337')}`),
		bullet(`Applying background colour to existing text resulted in duplicated letters. Thank you, ${link('https://community.anytype.io/t/applying-background-color-to-existing-text-results-in-duplicated-letters/5047', 'dddmggg')}`),
		bullet(`Selected blocks had blurred text and icons`),
		bullet(`Choosing a random emoji closed the menu instantly`),
		bullet(`Long relation names broke the layout of Relation page`),

		div(),
		// --------------------------------------------//

		h1(`13 April 2022 Desktop`),
		h2(`An (un)splash of colour`),
		text(`Spring has sprung for the Anyteam, and it's only natural to want a fresh coat of paint on our objects. This update comes packed with fixes for many bugs first reported by our intrepid alpha testers. `),
		text(`We've also added some serious quality-of-life updates, allowing you to further customize your objects with the whole Unsplash library, faster ways to work with tags, and share individual objects as markdown files.`),
		text(`Thanks for your continued support and feedback. We could not build Anytype without you.`),

		h2(`New features`),

		h3(`Unsplash`),
		text(`A huge Unsplash library is now available for setting into cover images. You can take popular or search particular just inside Anytype. Thank you, wemiprog for the ${link('https://community.anytype.io/t/image-cover-normal-support-for-online-library-like-unsplash/990', 'suggestion')}.`),

		h3(`Rework of tag and object relation interfaces`),
		text(`You can now create and search values inside the cell. It's much faster than the previously used filter. Thanks, flip, it works as you ${link('https://community.anytype.io/t/improve-process-of-adding-editing-removing-tags/1578', 'proposed')}.`),

		h3(`Single object export`),
		{ text: `Certain objects' export is now available. For objects with many links, you can check ${hl(`include linked objects`)} and get them all into a Zip archive. This feature is accessible in the object's menu. All .md files have readable names, export respects list indentations, and has LaTeX links. Thank you, Dr_Clairvoyant for ${link('https://community.anytype.io/t/export-one-single-file-to-different-formats/4041', 'your proposal')}, roncz, and hilawi for the ${link('https://community.anytype.io/t/readable-file-names-when-exporting/1378/4!', 'reports')}.` },

		h3(`Other notable improvements and fixes`),
		bullet(`Major restructuring of the Settings menu. It now has panels for your account and data, personalization, and appearance. You can also set on / off to a new option ${hl(`automatically hide and show sidebar`)}.`),
		bullet(`${hl(`Object`)} relation type is now the first option in ${hl(`create from scratch`)} menu.`),

		h2(`Bugs`),
		bullet(`App did not allow some users to create new objects. Thanks for your help, alzibaba.`),
		bullet(`Search pop-up location glitch. The search pop-up lost its position after moving and scrolling on the page. Thanks, ${link('https://community.anytype.io/t/search-popup-location-glitch/4976', 'kEbZeCK')}.`),
		bullet(`HTML tags were activating in search results. Thank you, ${link('https://community.anytype.io/t/html-tags-are-supported-in-search/4986', 'Evan')}.`),
		bullet(`The sidebar resizing indicator appeared even when the Sidebar is hidden. Thanks, ${link('https://community.anytype.io/t/sidebar-resizing-indicator-appears-when-the-sidebar-is-collapsed/4983', 'Ayne Hancer')}.`),
		bullet(`Sidebar shadow remained visible when collapsed. Other thanks go to ${link('https://community.anytype.io/t/sidebar-shadow-remains-visible-when-collapsed/5003', 'Ayne Hancer')}.`),
		bullet(`Selecting some words in the emoji icon filter also selected the object title. Thank you, ${link('https://community.anytype.io/t/icon-search-selection-selects-the-object-title/5007', 'floseq')}.`),
		bullet(`Pressing the Delete key in the first position of a block just "combined" blocks. It should delete the first char of the block. Thanks, ${link('https://community.anytype.io/t/pressing-del-key-in-first-position-of-block-is-combining-blocks/5019', 'kEbZeCK')}.`),
		bullet(`Sometimes, automatically, ${hl(`hide and show`)} sidebar logic would get stuck on showing. It now works with more reliable logic.`),
		bullet(`Sidebar with 100% width content. When the object content has 100% width and using the sidebar, the content is temporarily set to another width after closing the sidebar. Thanks, ${link('https://community.anytype.io/t/sidebar-with-100-width-content/4980', 'kEbZeCK')}.`),
		bullet(`I would appreciate it if the sidebar's hover animations could be consistent with similar animations throughout Anytype. We also think so! Thank you, ${link('https://community.anytype.io/t/sidebar-consistent-hover-animations/5023', 'Sahilstudio')}.`),
		bullet(`App will show more concrete errors if something goes wrong during adding the invite code.`),
		bullet(`Applying background colour to existing text results in duplicated letters. When you use a backslash command to change the background colour of a line of text containing an object reference, the first letter of the object's name is duplicated. Thank you, ${link('https://community.anytype.io/t/applying-background-color-to-existing-text-results-in-duplicated-letters/5047', 'dddmggg')}.`),
		bullet(`Cannot access menu when creating relation. On the relations page, when adding a new relation and the page is long, the menu runs off the screen, and I am unable to select "create". Thank you, ${link('https://community.anytype.io/t/cannot-access-menu-when-creating-relation/4852', 'dddmggg')}.`),
		bullet(`Files dragged over Anytype result in endless scroll. When a file is dragged over Anytype (specifically one of the program's edges) but not let go, Anytype begins scrolling. Thanks, ${link('https://community.anytype.io/t/files-dragged-over-anytype-result-in-endless-scroll', 'sahilstudio')}.`),
		bullet(`Clipboard. The insertion of blocks with style (checkbox, number, etc) did not work properly if one block was already selected.`),

		div(),
		// --------------------------------------------//

		h1(`23 February 2022 Desktop`),
		h2(`Sidebar, finally`),
		text(`Our #1 feature request since the beginning of the alpha program is here.`),
		text(`The tree-view sidebar shows outbound links and relations for each object, complementing the bi-directional navigation pane. It includes new icons to help you distinguish between Sets and regular objects, with toggles when deeper navigation is available. It can be fixed to the side or automatically hidden for distraction-free writing. The sidebar has the same sections (Sets, Favourites, Drafts etc.) as Home.`),
		text(`Here are some handy features that you might like:`),

		bullet(`You can resize the width of the sidebar.`),
		bullet(`Right-click on an object will trigger the action menu: favourite, duplicate, move to the bin.`),
		bullet(`You can move your sidebar to the right side of your screen by clicking and dragging it across.`),
		bullet(`You can disable auto-hide and show mode for sidebar in ${hl(`Settings`)} → ${hl(`Other`)}`),

		text(`This is our very first sidebar, but there's more to come! We are going to release new improved Sidebar versions soon!`),

		h2(`Search`),
		text(`The first rule of search is showing relevant results, and it's becoming an essential feature for many of you who have hundreds of objects inside. We've implemented many changes and updates, which we hope will radically improve your search experience.`),
		bullet(`Better matches. You can make one spelling mistake in the Title and zero in the object's blocks. Before, we had two and one, respectively, which resulted in messy and irrelevant results. As an example, we showed ${hl(`Space`)} for search for a ${hl(`Page`)}.`),
		bullet(`It will work by crossing results. Before we summed up the results and searching for ${hl(`word abracadabra`)} returned ${hl(`word`)} matches.`),
		bullet(`Search with a partially written title will always show a match. The ${hl(`In`)} will show ${hl(`The Infernal Device`)}. Thanks, ${link('https://community.anytype.io/t/global-search-does-find-content-only-when-word-is-nearly-fully-typed/1610/4', 'kEbZeCK')}`),
		bullet(`You can also find objects with prepositions, definite articles like ${hl(`the`)}, ${hl(`in`)}, ${hl(`me`)}, ${hl(`our`)}... etc., in the Title. Anytype will ignore matches in the blocks.`),
		bullet(`Better indexing for Notes object-type. The document's first line is treated like the Title of another type.`),
		bullet(`Deleted objects are no longer in the search index. They were breaking results.`),
		bullet(`You can find modified objects' content immediately. Before, it could take a minute to re-index, and they weren't present in search results.`),
		bullet(`${hl(`C#`)} programming language and A*  search algorithm also can be found. The search was ignoring such symbols before. Thanks for finding this, ${link('https://community.anytype.io/t/certain-pages-are-impossible-to-search-for-or-link-to/1352', 'triangles')} 🕵️`),

		h2(`New features`),
		bullet(`Anytype will instantly apply changes on iOS or Android for opened Set, Sidebar, and Home Tabs. There is no need to re-open them to see new objects; they will load on the fly.`),
		bullet(`We changed the interface for the object's cover. It now has a new tab to drop an image and will stop adding images randomly.`),
		bullet(`Table of contents block. Write ${hl(`/tc`)} to add generated links to all headers in the object.`),
		bullet(`Locked pages. You can lock your objects to prevent accidental editing and enable read-only mode for all devices.`),
		bullet(`Right-click on the row in Set will show the actions menu. Just like the sidebar!`),

		h2(`Other notable improvements and fixes`),
		bullet(`Set changed 'Object type' back from 'Task' to my type (self-created type) after restarting the app. And the Views for that Set were gone then. Thanks, ${link('https://community.anytype.io/t/set-changes-object-type-back-after-restart', 'turquiseblue')}`),
		bullet(`Formatting issues could happen when pasting text into the Title of Toggle. Thanks, ${link('https://community.anytype.io/d/1007-formatting-issues-when-pasting-text-into-title-of-toggle/1', 'sahilstudio')}`),
		bullet(`Low-Resolution Taskbar Icon in Windows. Thanks, ${link('https://community.anytype.io/d/762-low-resolution-taskbar-icon/1', 'Pretzel')}`),
		bullet(`One more fix for Anytype re-opening after getting into the system tray in Windows. Closing the app may didn't end the process. Thanks, ${link('https://community.anytype.io/t/after-closing-anytype-not-open-again/4204 and sambouwer https://community.anytype.io/t/closing-the-app-only-hides-the-foreground-app/2889/6', 'asterixix')}`),
		bullet(`Drag-n-drop. The nested structure cannot be moved just under a nested structure. There was a possibility to drop in under, but not inside.`),
		bullet(`Drag-n-drop. Drop into the block with nested block into the first place resulted with positioning latest.`),
		bullet(`Adding / as a symbol in text with URL link moved it further.`),
		bullet(`Changing the width of object layout could lead to inconsistent block's image resize`),
		bullet(`The Changelog window showed up before an update. Thanks, ${link('https://community.anytype.io/t/changelog-pops-up-before-update-but-not-after', 'kEbZeCK')}`),
		bullet(`Pop-up window to select a cover stayed on the screen even after navigation to another page/object. Thanks, ${link('https://community.anytype.io/t/cover-selection-stays-on-screen/4373', 'edwin')}`),
		bullet(`Pressing ${hl(`${cmd}+Z`)} after changing object type could lead it not to revert.`),
		bullet(`The description block in the featured relations section will only come if set in Template.`),
		bullet(`Print missed part of the text coming under page brakes.`),
		bullet(`The slash command completion sometimes sorts (and therefore completes when pressing enter) types that only contain the searched word in a description over types that have the searched word as their Title. Thanks, ${link('https://community.anytype.io/t/slash-command-completion-in-wrong-order', 'minion')}`),
		bullet(`LaTeX jumped back to the start if you typed a command correctly. Thanks, ${link('https://community.anytype.io/t/latex-jumps-back-to-the-start-if-you-type-a-command-correctly', 'Skyler')}`),
		bullet(`Loading spinner for new profile picture was misaligned. Thanks, ${link('https://community.anytype.io/t/loading-spinner-for-new-profile-picture-misaligned', 'Sam')}`),
		bullet(`If you type ${hl(`\\`)} and press Enter, the carriage jumps to the beginning of the LaTeX Block. Thanks, ${link('https://community.anytype.io/t/isnt-recognized-as-a-symbol-and-pressing-enter', 'nopapi')}`),
		bullet(`The ${hl(`\\`)} command in LaTeX makes a newline. This command wasn't included in the LaTeX autocomplete menu. Thanks, ${link('https://community.anytype.io/t/double-backslash-command-missing-from-latex-autocomplete', 'Skyler')}`),
		bullet(`After creating a new block and using ${hl(`${cmd}+${shift}+Arrow`)} to move it, the text just typed could become deleted. Thanks, ${link('https://community.anytype.io/t/moving-a-newly-created-block-deletes-text/4642', 'QuantumJump')}`),
		bullet(`When hitting ${hl(`Ctrl+Alt+O`)} to open Graph view on Windows with a UK keyboard, with a textbox selected, Anytype typed a ó key. Thanks, ${link('https://community.anytype.io/t/opening-graph-view-types-o/4627', 'QuantumJump')}`),
		bullet(`Sometimes two blocks weren't separated. Thanks, ${link('https://community.anytype.io/t/blocks-merge-together-bug', 'XxxBalCion')}`),
		bullet(`${hl(`${cmd}+Click`)} on the empty part of the Link to object block open it instead of selecting.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 19 January, 2022`),
		h2(`Enhancements`),
		bullet(`Cache DNS requests on the application level. We decided to implement caching on our side because not all OS (like Linux Ubuntu for example) provide for such a thing. Thanks, ${link('https://community.anytype.io/t/excessive-network-activity-dns-requests/3374/13', '_flo, kEbZeCK')}`),
		bullet(`--> conversion to arrow → now works in description and title. Thanks, ${link('https://community.anytype.io/t/conversion-to-arrow-doesnt-work-in-description', 'kEbZeCK')}`),
		bullet(`Double dash -- now converts to a long dash`),
		bullet(`Relation number is now separated with spaces by SI/ISO 31-0 standard`),
		h2(`Bugs`),
		bullet(`Images and files got broken and stopped showing in some cases. Thanks, ${link('https://community.anytype.io/t/images-got-broken-relation-value-lost', 'mkoechli, Tanzeel098, JGsource, GooRusa, lynxlove, edwards')}, ${link('https://community.anytype.io/t/failed-to-load-pdf-file/4173', 'sebro, tempapy')}`),
		bullet(`All orphaned objects were rendered too close to an opened object in Graph. Now they are next to the left`),
		bullet(`Backspace deleted all letters in spelling Chinese characters. Thanks, ${link('https://community.anytype.io/t/backspace-will-delete-all-letters-in-spelling-chinese-characters', 'simon shi')}`),
		bullet(`After creating a non-text type block, pressing Enter didn't create a new empty block below`),
		bullet(`LaTeX command autofill inserted the wrong command. Thanks, ${link('https://community.anytype.io/t/latex-command-autofill-inserts-the-wrong-command', 'Skyler')}`),
		bullet(`The autocomplete box sometimes appeared behind the popup box of the note. Thanks, ${link('https://community.anytype.io/t/inline-link-autocomplete-shows-behind-the-pop-up-page-on-empty-lines', 'utau0324')}`),
		bullet(`Windows. After closing Anytype, it could not be opened again. Thanks, ${link('https://community.anytype.io/t/failed-to-load-pdf-file/4173', 'sebro')}`),
		bullet(`The cell height could change and the document could "jump" after opening new PDF pages in embed mode`),
		bullet(`When embedded, a PDF file could cause significant lag in Anytype's UI and incorrectly render. Thanks, ${link('https://community.anytype.io/t/when-embedded-a-pdf-file-from-goodnotes-5-causes-significant-lag-in-anytypes-ui-and-is-incorrectly-rendered', 'edwards')}`),
		bullet(`After setting the date, you needed to re-enter the cell and see the updated value`),
		bullet(`Ctrl+A in the search bar resulted in selecting all in the background. Thanks, ${link('https://community.anytype.io/t/ctrl-a-in-search-bar-results-in-select-all-in-background', 'kEbZeCK')}`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 13 January, 2021`),
		h2(`Happy New Year`),
		text(`In 2022 we will open Anytype to even more users, allowing everyone to experience our new metaphor for computing. This milestone is, in no small part, thanks to your incredible feedback. Thank you for a tremendous 2021, and we look forward to building Anytype with you in 2022.`),

		h2(`Tooltips`),
		text(`We've added some simple tooltips in the UI to help new users get started with Anytype, allowing for a more effortless onboarding experience. Click <img class="icon" src="./img/icon/help.svg" /> → "Show Hints" to go through onboarding at any time.`),

		h2(`Features`),
		bullet(`You can limit relation Object to certain object types. Create new relation from scratch -> Choose “Object” -> Select types from the list. Thanks, ${link('https://community.anytype.io/t/specify-which-objects-to-display-and-make-selectable-for-a-given-relation/1622', '@daanl, @qualquertipo')} and ${link('https://community.anytype.io/t/ability-to-limit-the-scope-of-a-relation/1553', '@lynxlove')}`),
		bullet(`Anytype now runs natively on Apple Silicon, providing better performance to our users with M1 processors. You'll need to download and install the app from scratch from ${link('https://download.anytype.io/', 'download.anytype.io')} to start your 🔥🔥🔥Anytype experience.`),
		bullet(`You can now embed PDF files and see their content right on the canvas. You can write /PDF or open file block menu -> Appearance -> “Show as embed."`),
		bullet(`The new "Get Started" object appears for new users in Favourites by default.`),

		h2(`Bugs`),
		bullet(`Sometimes clicking from one view to another, the UI was cycling between the two views forever.`),
		bullet(`Improvements in object creating which sometimes took too much time`),
		bullet(`Export to markdown did not include files. Thanks, ${link('https://community.anytype.io/t/export-didnot-contatin-image-and-object-type/4000', '@hasenrain')}`),
		bullet(`When pressing close (x), the window went into the system tray instead of quitting. Thanks, ${link('https://community.anytype.io/t/minimize-to-system-tray/1383', '@Fantail')}`),
		bullet(`Tag relation in a Set doesn't update the name from tag sets.`),
		bullet(`Layout issues when no results are found in the search bar. Thanks, ${link('https://community.anytype.io/t/missing-spacing-when-no-results-in-search/3908', '@kEbZeCK')}`),
		bullet(`When using a relation with the relation type Status, the default colour of objects was invisible in dark mode. Thanks, ${link('https://community.anytype.io/t/default-color-on-statuses-in-dark-mode/4033', '@Cernel1337')}`),
		bullet(`When a page is open, and the cursor is in-line, opening the search modal and pressing enter to select a search result, a line break is inserted on the canvas. Thanks, ${link('https://community.anytype.io/t/selecting-search-result-inserts-new-line-in-currently-open-object/4051', '@kEbZeCK')}`),
		bullet(`While you open the object as a modal, the object's content behind the modal is selectable and removable. Thanks, ${link('https://community.anytype.io/t/typed-text-after-pasted-link-non-bookmark-becomes-part-of-link/4078', '@sebro')}`),
		bullet(`The text typed after pasted a link became part of the link. Thanks, ${link('https://community.anytype.io/t/typed-text-after-pasted-link-non-bookmark-becomes-part-of-link/4078', '@Corbin')}`),
		bullet(`If there is no navigation history inside the modal view, you can close it by pressing "back"`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 15 December, 2021`),
		text(`Happy holidays to everyone in our alpha program`),
		text(`We've had 17 incredible months of feedback from our brilliant community. You've voted more than 7,000 times on bugs and feature requests, and we are so happy to be building Anytype with you.`),
		text(`Thank you for being part of the alpha program. We can't wait to build 2022 with you.`),

		h2(`Features`),
		bullet(`You can now remove local media files from your current device. They can be downloaded again from the backup node or another device. `),
		bullet(`To remove local media files, you can select Clear cache in Settings → Other settings. `),
		bullet(`You can now drag and drop relations from the relations panel into the canvas. `),

		h2(`Performance`),
		bullet(`We fixed a few seconds delay when pressing Enter or Backspace inside text blocks. ${link('https://community.anytype.io/d/334-delay-to-start-a-new-block-after-hitting-enter/1', 'Thanks, HLucas, vincer, wemiprog, lynxlove, JGsource')}`),
		bullet(`Optimisations to reduce the wait from starting Anytype to reaching the home screen.  ${link('https://community.anytype.io/t/anytype-taking-2-5-minutes-to-get-past-the-logging-in-screen/2859', 'Thanks, lynxlove, Srinath')}`),

		h2(`Enhancements`),
		bullet(`New users will be shown their key during their first session. ⚠️⚠️⚠️ Please write it down. Please keep it safe.`),
		bullet(`Change the view to non-popup when the window's width is smaller than the width of the pop-up. <a herf="https://community.anytype.io/d/969-default-to-non-popup-view-when-windows-width-is-popuppages-width/1">Thanks, triangles</a>`),
		bullet(`The ${hl(`Done`)} relation will be added to new Sets views by default. `),
		bullet(`${hl(`СTRL / CMD + N`)} now creates a new object inside a Set.`),
		bullet(`${hl(`Going back`)} in history now works within the object in a modal view. `),

		h2(`Bugs`),
		bullet(`Closing and re-opening the app could end with an error. ${link('https://community.anytype.io/t/closing-the-app-only-hides-the-foreground-app', 'Thanks, lynxlove')}`),
		bullet(`The carriage would sometimes not follow the user from one text block to another on the canvas.`),
		bullet(`The relation object would not update as the information changed.`),
		bullet(`${hl(`Ctrl+X`)} would sometimes discard changes instead of cutting the selected content. ${link('https://community.anytype.io/t/ctrl-x-discards-editing/2276', ' Thanks, thiago_nascimentodf')}`),
		bullet(`Home screen wallpaper would return to default after logging out.`),
		bullet(`When you clicked on a Status, Tag, File, Object relation value twice times, the focus would remain. `),
		bullet(`After a URL has been inserted into the URL relation, the content couldn't be selected. ${link('https://community.anytype.io/t/can-t-select-url-relation-with-mouse-keyboard-after-url-has-been-added', 'Thanks, Sharky')}`),
		bullet(`Column position change in dark mode remained with the default styles. `),
		bullet(`Formatting in code blocks was enabled.  ${hl(`a * b * (c + d)`)} became: ${hl(`a b (c + d)`)}. ${link('https://community.anytype.io/t/formatting-in-code-block-should-be-disabled', 'Thanks, nelatmani')}`),
		bullet(`Multi-select checkbox overlapped object title`),
		bullet(`Multiple selection states got cleared after using Tab search in Home. ${link('https://community.anytype.io/t/search-clears-after-selecting-in-history-tab', 'Thanks, kEbZeCK')}`),
		bullet(`Selection of a text while pressing down in a big text block might not be displayed. ${link('https://community.anytype.io/t/copy-ui-issue/1634', 'Thanks, Srinath')}`),
		bullet(`When an inline link was clicked, it could open multiple times. ${link('https://community.anytype.io/d/943-clicking-inline-links-opening-multiple-times/1', 'Thanks, kEbZeCK')}`),
		bullet(`The first time you select a date in the calendar, it could not be stored in the value. ${link('https://community.anytype.io/t/must-input-date-twice-in-a-relation-for-it-to-register', 'Thanks, Klemet')}`),
		bullet(`Clicking the checkbox of an object from within a Set, didn't work.  ${link(' https://community.anytype.io/t/clicking-the-checkbox-of-an-object-from-within-a-set-doesnt-work', 'Thanks, CrossDrain')}`),
		bullet(`Set's View creation and management flow was optimised. `),
		bullet(`Searching inside the object didn't find matches in the  ${hl(`link to the object`)} block`),
		bullet(`There was no ability to open Home from the navigation. `),
		bullet(`In filters, a crash might occur after changing the relation ${hl(`Done`)} to ${hl(`Date`)} hen it's been checked.`),
		bullet(`When creating a new ${hl(`Tag`)} or ${hl(`Status`)} value,value, a new one hasn't been added by hitting ${hl(`Enter`)}.`),
		bullet(`The application might not start due to an error "An attempt was made to access a socket in a way forbidden by its access permissions". ${link('https://community.anytype.io/t/startup-exception', 'Thanks, Patrick Mhiau')}`),
		bullet(`An entire paragraph could be accidentally selected when using the keyboard. ${link('https://community.anytype.io/d/1175-better-text-selection-using-keyboard-accidentally-selecting-full-paragraph/1', 'Thanks, qualquertipo')}`),
		bullet(`Line spacing could be different for the first heading compared to the other headers. ${link('https://community.anytype.io/t/weird-line-space-behavior-with-titles', 'Thanks, Liam8lu')}`),

		div(),

		h1(`Updates for 17 November, 2021`),

		h2(`Enhancements`),
		bullet(`You can use ${hl(`${shift}`)} to select a range of items on Dashboard tabs. Thanks, sahilstudio`),
		bullet(`Refactoring of the transition area in submenus. Menus with submenus should become more responsive.`),

		h2(`Bugs`),
		bullet(`A newly created template and relations belonging to a type could no longer be opened and edited. Thanks, Sharky`),
		bullet(`Object state might stop updating after re-opening from graph view. Thanks, WhereisJ9`),
		bullet(`Dark mode — Discoloured three dots menu background for file relation values. Thanks, sahilstudio`),
		bullet(`${hl(`${shift} + Enter`)} to create a line break doesn't work. Thanks, Tim-Luca`),
		bullet(`Clear Search in Graph View on sidepanel close. Thanks, lynxlove`),
		bullet(`Sometimes PDF may not be rendered in the preview`),
		bullet(`App crashes when sync status is clicked in pages showing the status as Preparing. Thanks, lynxlove`),
		bullet(`Writing an exponential number to a number cell does not work`),
		bullet(`The time in Date relation is always transformed to 12.00`),
		bullet(`When you click on a cell with a date and the selected date format is mm.dd.yyyy, it switches to dd.mm.yyyy in edit mode`),
		bullet(`In the position close to the bottom of the screen, the preview links may not be shown`),
		bullet(`When you close a cell of the URL type by clicking under the cell in Set, the drop-down menu does not close`),
		bullet(`The relation list in the Set jumps up when clicking on the switcher.`),
		bullet(`In the types menu for the empty object, there was no returning to the top of the list after pressing down on the last element`),
		bullet(`The carriage shows at the beginning of a line in a Date relation with a non-empty value`),
		bullet(`Text set into relation with format Number gets set as zero`),
		bullet(`Deleted objects are no longer shown in navigation. Thanks, michaellw`),
		bullet(`Sorting of Object relation prevented relation from further editing`),

		div(),
		// --------------------------------------------//

		h1(`Deletion. Note type. Darkmode`),

		h2(`Deletion`),
		text(`Say hello to our most incredible innovation since object creation: object deletion. Anytype now supports the permanent deleting of objects! 🥳 🗑♻️. Moving objects to the bin will remove them from navigation. From the bin, you can choose to select, delete, and restore your objects. <b>This action is irrevocable, so please be careful.</b> `),
		img('delete.png', 'full'),
		text(`At present, only objects created inside Anytype can be deleted. Other files like media, and those that come with Anytype (types, relations) will be supported in future releases.`),

		h2(`New defaults`),
		text(`Speed and convenience are central to this update. Drafts have been replaced with a new default type, ${hl(`the Note`)}. Designed to capture thoughts quickly. You can now choose any type of object as your default type in Settings. An update we hope will provide you with even more customization and workflow options.`),
		img('note.png', 'full'),

		h2(`Sets creation`),
		text(`You can now create a Set from the dashboard, using the bottom-left + button, or even in-line using the ${hl(`/`)} menu. From there, you can choose which type of object your new Set is for. For example, viewing your current projects, or building a reading list of books.`),
		video('set-creation.mp4'),

		h2(`Darkmode`),
		text(`Just in-time for winter, our long-awaited dark mode is here. This feature has graced our devices (and eyes) in recent years, and has really become a way of life for some. Night owls rejoice! To enable dark mode, simply open the Settings pane, navigate to other settings → theme → and choose Dark.`),
		img('dark-mode.png', 'full'),

		h2(`Fresh docs`),
		text(`We've launched a brand ${link('https://doc.anytype.io/d/', 'new hub')} for Anytype docs. You can find it in the ${hl(`+`)} menu and in the ${hl(`?`)} icon at the bottom-right of your screen. This is our first draft, and we look forward to your feedback!`),

		h2(`Text with link to an object`),
		text(`There was a way to add an arbitrary URL link to a text selection. But now you can make a link to any Anytype object this way. Just select the part of the text, click link icon and choose! Thank you, Oshyan, ${link('https://community.anytype.io/t/link-to-object-from-text-selection/1051', 'for your proposal')}!`),

		h2(`Enhancements`),
		bullet(`PDF now renders in Anytype. if you open this file type as an object. Use block's menu in the editor and just click on a file in sets. Thanks, Gabi and Florencia for your feedback!`),
		bullet(`You can now also open and create a set through the type in featured relations`),
		bullet(`You will have Page, Note, Set, and Task at the top of the type selection. They are the most used types, so they will become more accessible.`),
		bullet(`You can change views position in sets (finally!)`),
		bullet(`Anytype now shows object's preview when hovering the link and mention`),
		bullet(`We've added brand new gradient wallpapers, that look very solid! `),
		bullet(`Full-text search now works for pre-build objects`),
		bullet(`You can now open URL by clicking with ${shift} being held. Thanks, ${link('https://community.anytype.io/d/1059-option-to-make-url-relations-easier-to-click-through-to/1', 'qualquertipo')}`),
		bullet(`Search box height is now adaptive fitting results with no extra space below`),
		bullet(`Relation's name in Graph mode is now always readable in the normal direction. Thanks, ${link('https://community.anytype.io/d/1085-relations-name-in-graph-mode-should-always-be-readable-in-the-normal-direction/1', 'michaellw')}`),
		bullet(`Make sidebar less wide in Graph View. Thanks, ${link('https://community.anytype.io/d/1102-sidebar-less-fullscreen-in-graph-view/1', 'lynxlove')}`),
		bullet(`Better graph search highlight. Thanks, ${link('https://community.anytype.io/d/1087-better-graph-search-highlight/1', 'lynxlove')}`),

		h2(`Bugs`),
		bullet(`Anytype rarely failed to create set. Thanks, ${link('https://community.anytype.io/t/fails-to-create-a-project-sets/2199', 'Srinath, turquiseblue, vanntile, Eban')}.`),
		bullet(`Changing the set filter from "is done" to something else resulted in a crash. Thanks, ${link('https://community.anytype.io/d/991-changing-set-filter-from-is-done-to-something-else-results-in-crash/1', 'sahilstudio')}`),
		bullet(`Clipboard stops working while working with blocks.`),
		bullet(`Copy and cut from the title was not getting the right content.  `),
		bullet(`Pasting a link to create a bookmark crashes Anytype. Thanks, ${link('https://community.anytype.io/d/1129-pasting-a-link-to-create-bookmark-crashes-anytype/1', 'Tanzeel098')}`),
		bullet(`The date relation filter wasn't working with time. The last added object may be ordered not as predicted.`),
		bullet(`Some of the emojis with numbers weren't displaying cross-device. Thanks, ${link('https://community.anytype.io/d/323-0-9-number-emojis-as-page-icons-do-not-sync-properly/1', 'faraaz')}`),
		bullet(`Words/Sentences were getting duplicated or missing when selecting it with ${hl(`${cmd} + A`)} and pressing ${hl(`Enter`)} on created objects. Thanks, ${link('https://community.anytype.io/d/957-weird-behaviour-when-selecting-a-text-and-pressing-enter/1', 'Sedulous')}`),
		bullet(`Having two filters with the same relation changes the first condition to "All". Thanks, ${link('https://community.anytype.io/d/621-filters-reset-when-multiple-filtering-rules-are-added/1', 'quietwalker')}`),
		bullet(`LaTeX: When the carriage moved from the end of the list to the beginning or from the beginning to the end of the list, the focus on the element disappeared`),
		bullet(`In history mode, there was a possibility to change featured relations.`),
		bullet(`Cards linked objects had a residual overlay when empty. Thanks, ${link('https://community.anytype.io/d/967-cards-linked-objects-have-a-residual-overlay-when-empty/1', 'AyneHancer')}`),
		bullet(`Enabling Show Icon in Grid View cropped the Page Name. Thanks, ${link('https://community.anytype.io/d/1137-enabling-show-icon-in-grid-view-crops-the-page-name/1', 'lynxlove')}`),
		bullet(`The gallery view sometimes cut the last relation value.`),
		bullet(`Image viewer showed scrollbar. Thanks, ${link('https://community.anytype.io/d/1072-image-viewer-showing-scrollbar/1', 'kEbZeCK')}`),
		bullet(`When you pressed Enter to open a page using the navigation pane Anytype was inserting line breaks. Thanks, ${link('https://community.anytype.io/t/using-the-navigation-pane-inserts-unwanted-line-breaks', 'Tim-Luca')}`),
		bullet(`An image added to the file relation could break the work of the file list in the relay.`),
		bullet(`There was an inconsistent movement for nested blocks using ${hl(`${cmd} + ${shift} Up/Down`)}. Thanks, ${link('https://community.anytype.io/d/889-inconsistent-movement-for-nested-blocks-using-ctrlshift-updown/1', 'qualquertipo')}`),
		bullet(`When creating a new object from a Set, edit its name. If the cursor was moved, the revised text was also moved in the direction of the cursor. Thanks, ${link('https://community.anytype.io/d/1136-ui-glitch-when-adding-a-new-object-from-a-set/1', 'lynxlove')}`),
		bullet(`Relation Numbers could store non-numerical symbols.`),
		bullet(`When switched the month in the calendar in the Date relation, the date could be reset to 1970-01-01`),
		bullet(`Sometimes relation focus could stay on a previously selected cell in Set.`),
		bullet(`Selection could freeze when was working with nested blocks. Thanks, ${link('https://community.anytype.io/d/894-selection-bugs-inaround-nested-blocks/1', 'qualquertipo')}`),
		bullet(`Fundamentals showed after login and not only after registration.`),
		bullet(`Shortcuts view opened while working with an object in a modal window closed the object.`),
		bullet(`Hints weren't centred relative to the object to which they were displayed.`),
		bullet(`Sometimes when the custom type was opened, the templates weren't showing.`),
		bullet(`App crashed after clicking ${hl(`Cancel`)} in the Navigation pane. Thanks, ${link('https://community.anytype.io/d/1186-crash-after-clicking-cancel-in-navigation-pane/1', 'HaosGames')}`),
		bullet(`Changes have been made to relation name could not update everywhere it was used.`),
		bullet(`When pressed ctrl / it with now carriage inside block app selected all the content text, but weren't working for further actions. Thanks, ${link('https://community.anytype.io/d/944-ctrl-selects-every-text-visually/1', 'Srinath')}`),
		bullet(`Link preview could be stuck on the screen. Thanks, ${link('https://community.anytype.io/d/852-link-preview-stuck-on-screen/1', 'jimkleiber')}`),
		bullet(`Template preview could also be stuck.`),
		bullet(`The search wasn't working in the graph. Thanks, ${link('https://community.anytype.io/d/1091-search-function-in-graph-view-is-not-working/1', 'Tanzeel098')}`),
		bullet(`Background default colour swatch showed as black (should be white). Thanks, ${link('https://community.anytype.io/d/871-background-default-color-swatch-shows-as-black-should-be-white/1', 'qualquertipo')}`),
		bullet(`A lot of minor UI fixes while working with relation value in Set`),
		bullet(`Bookmark Preview got cropped on Higher Layout Widths. Thanks, ${link('https://community.anytype.io/d/1118-bookmark-preview-gets-cropped-on-higher-layout-widths/1', 'lynxlove')}`),
		bullet(`No extra space was added to the template formula. So switching the LaTeX Template formula multiple times resulted in a syntax error. Thanks, ${link('https://community.anytype.io/d/1101-switching-the-latex-template-formula-multiple-times-results-in-syntax-error/1', 'lynxlove')}`),
		bullet(`Objects created from Set weren't focusing the text cursor on their name. Thanks, ${link('https://community.anytype.io/d/955-objects-created-form-set-should-focus-the-text-cursor-on-their-name/1', 'Kite')}`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 09 October, 2021`),
		h2(`Graph Mode`),
		text(`Displays a graph representation of the Links and Relations between your objects. Now you can see the power of Anytype relations, with connections showing how each object relates to another! The more links and relations an object has, the more extensive its "network".  Especially useful both for the most referenced objects, and for hubs or content maps with many links to other objects.`),
		text(`You can hover over each object to highlight its connections. Clicking on it will show additional information and options in a side panel.`),
		text(`To pan around the canvas, drag the background.`),
		text(`You can zoom in and out using a touchpad zoom function or by scrolling with a mouse wheel.`),
		text(`Use the search function at the bottom of the panel to the right if you want to find a particular object. Matching objects will be highlighted in the network view.`),
		text(`To access the Graph Mode, look for the ${img('./img/icon/graph.svg', 'icon')} icon in the top-left corner from any opened object or just press ${hl(`⌘ + Option + O / Ctrl + Alt + O`)}.`),
		text(`What does your graph look like? Share it in the community!`),
		img('graph.png', 'full'),

		h2(`LaTeX block`),
		text(`LaTeX is here! Have you been frustrated trying to work with LaTeX functions in other tools? With Anytype, you don't have to worry about errors ever again thanks to a real-time preview and example functions in the editor. You can write code and view the formula output at the same time. Now fully enjoy your studies using Anytype for your Math and Chemistry class notes!`),
		img('latex.png', 'full'),

		h2(`List &amp; Gallery views`),
		text(`Meet the new and highly-requested Views for Sets! To create a new view, click the <img src="./img/icon/plus.svg" class="icon" /> icon at the top-left of your Set (next to "All"), give it a name in the field at the top of the pop-up, then select the type of view you want (currently Grid, Gallery, or List, with more coming soon). After you create it, you can change options for the View by using the Customize View icon at the top-right of your set.`),
		text(`For Gallery views, the card image can be shown from the Attachment Relation or the object's cover image. You can set this in Customize View, and the selected image source will appear at the top of each gallery card. `),
		text(`You can also «right mouse» click on the view name to open options faster. `),
		img('gallery.png', 'full'),

		h2(`Enhancements`),
		bullet(`Tabs: We did some research and rearranged the tabs in Home in order of popularity. The Inbox tab was removed and will come back reimagined later. Recent tab is now called History and no longer contains archived objects.`),
		bullet(`Export to Print now separates blocks between pages without cropping them in the middle. Thanks, ${link('https://community.anytype.io/d/627-print-a-page-not-in-full-screen-create-buggy-pdfs/1', 'quietwalker')}`),
		bullet(`Update System: The update progress bar will only be shown if you manually request an update. At the same time, the progress bar no longer blocks the application functions. Automatic updates now happen in the background. If a new version is available, you will be prompted to apply it. So Anytype won't restart automatically at an inconvenient moment.`),

		h2(`Bug fixes`),
		bullet(`Application may crash after re-login`),
		bullet(`Audio block content upload may show an infinite loading spinner`),
		bullet(`Search on the page doesn't work in a modal view`),
		bullet(`After changing the size of the image block it becomes selected and can't be un-selected`),
		bullet(`Code snippet: Pressing ${shift} + Enter creates a new code line instead of the new text block.`),
		bullet(`The value at the width scale may not reset after using undo-redo`),
		bullet(`Pressing ESC with an open full-screen image closes the modal in which it was opened`),
		bullet(link('https://community.anytype.io/d/961-linked-page-title-gets-removed-on-appearance-change/1', 'Linked Page Title gets removed on appearance change')),
		bullet(link('https://community.anytype.io/d/1009-align-option-for-cards-does-not-use-the-full-layout-width/1', `The text alignment option, when applied to a card, does not consider the entire layout's width until the view is refreshed`)),

		div(),
		// --------------------------------------------//

		h1(`Updates for 16 September, 2021`),

		h2(`Types, Sets, and Relations are now available!`),
		text(`This upgrade has been in testing all summer. Thank you, everyone, for joining the onboarding calls, for sharing your feedback and your creations. Because of your help, we can now deliver this upgrade to everyone in the alpha program.`),

		h2(`Major features:`),
		bullet(`New types of objects and the power to connect them with relations.`),
		bullet(`Layouts help you save time on repetitive tasks, customize your objects with featured relations and reusable templates.`),
		bullet(`Finally, you can now work with multiple objects using Sets.`),
		text(`Take a look at the ${hl(`“Fundamentals”`)} page to help you get started. There are also helpful tips and tricks to get the most out of this substantial new update.`),

		h2(`New features:`),
		h3(`Play that funky music, Anytype`),
		text(`You can now upload your favorite music with formats: ${hl(`.wav`)}, ${hl(`.mp3`)}, ${hl(`.ogg`)}, ${hl(`.m4a`)} and ${hl(`.flac`)} into a new media block. Audio files are available on canvas and as objects inside Anytype, which you can collect into sets.`),
		img('audioblock.png', 'full'),

		h3(`Custom views for links and bookmarks`),
		text(`You can change the appearance of cards to make them yours. Links and cards can now show cover images, different icon sizes, and descriptions under the text.`),
		img('link-object.png', 'full'),

		h3(`Open attached files in Anytype`),
		text(`You can now open the attached files directly in Anytype instead of having to download them. So now you don't need to download files and then find them in the file system. They open just from Anytype! Thanks, ${link('https://community.anytype.io/d/51-open-attached-files-directly-instead-of-downloading-them', 'bzimor, reuseman')}`),

		h3(`@Today is the day!`),
		text(`Enhance your Daily notes with handy date shortcuts! Anytype will create an object with a relative date automatically. Write it the way you like: ${hl(`@now`)}, ${hl(`@today`)}, ${hl(`@yesterday`)}, ${hl(`@three days ago`)}, ${hl(`@last month`)}, ${hl(`@one year from now`)}, ${hl(`@sunday`)}, ${hl(`@next January`)}, ${hl(`@last February`)}, ${hl(`@December 25th`)}, ${hl(`@01.10.21`)}, ${hl(`@2016-05-12`)}. So handy with backlinks! Thanks, ${link('https://community.anytype.io/d/770-timedate-shortcuts-eg-now-today-date-etc', 'levifig')}`),

		h2(`Fixes`),
		bullet(`The key is visible without any password authentication. Thanks, shizoxlife`),
		bullet(`Navigating back and forth between objects is unreliable. Thanks, ${link('https://community.anytype.io/d/643-forward-and-back-buttons-stop-working', 'irdinamaztura &amp; abheek')}`),
		bullet(`Carriage returns to the top of the screen whenever I select something in the quick editor. Thanks, ${link('https://community.anytype.io/d/851-selection-jumps-to-top-in-popup-mode/1', 'bluatruli')}`),
		bullet(`Anytype (Human) version history breaks app login, triggers an infinite loop. Thanks, ${link('https://community.anytype.io/d/805-version-history-of-anytype-page-breaks-the-app/1', 'selimsandal')}`),
		bullet(`The shortcut for page history is not working. Thanks, ${link('https://community.anytype.io/d/603-page-history-shortcut-not-working/1', 'lynxlove')}`),
		bullet(`Rendering on some geometries causes a flicker of UI elements. Thanks, ${link('https://community.anytype.io/d/760-rendering-on-some-geometries-causing-flicker-of-ui-elements/1', 'jotamudo')}`),
		bullet(`Search box “not found” text formatting. Thanks, ${link('https://community.anytype.io/d/705-search-box-not-found-text-formatting/1', 'kEbZeCK')}`),
		bullet(`Pasting URL into title triggers menu`),
		bullet(`The carriage in the Number relation shifts to the beginning of the line when the cell reopens.`),
		bullet(`UI focus disappears in the list of statuses and tags.`),

		h2(`Enhancements`),
		bullet(`New shortcut for Shortcuts - ${hl(`Ctrl + Space`)}. Thanks, ${link('https://community.anytype.io/d/602-shortcut-for-shortcuts/1', 'lynxlove')}`),
		bullet(`Changing text color: remember last used color or background and add shortcut - ${hl(`${cmd} + ${shift} + C`)} or ${hl(`${cmd} + ${shift} + H`)}. Thanks, ${link('https://community.anytype.io/d/546-changing-text-color-remember-last-used-color-and-adding-shortcut/1', 'abstractgeek')}`),
		bullet(`Favorite &amp; unfavorite. You can't add an object to favorites multiple times anymore. Thanks, ${link('https://community.anytype.io/d/568-possible-to-mark-an-object-as-favorite-multiple-times/1', 'Isak')}`),
		bullet(`Ability to clear the "Recent" list on the dashboard. Thanks, ${link('https://community.anytype.io/d/646-ability-to-clear-the-recent-list/1', 'ste')}`),
		bullet(`Link to object — first result not highlighted visually. Thanks, ${link('https://community.anytype.io/d/696-link-to-object-first-result-not-visually-chosen/1', 'kEbZeCK')}`),
		bullet(`An issue with dashes in the page title when creating a new page using ${hl(`@`)}. Thanks, ${link('https://community.anytype.io/d/324-issue-with-dash-in-page-name-when-new-page-created-using-at/1', 'bskinner')}`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 31 August, 2021`),
		h2(`Enhancements`),
		bullet(`Sets can have custom icon &amp; cover and might have their own relations as other objects.`),
		bullet(`Anytype starts updating mentions after an object's name change from this release. We will introduce this enhancement for Android in the next release.`),
		bullet(`Inbox now stores a list of draft objects, sorted by editing date.`),
		bullet(`Support for plain text in a code snippet. Thanks, ${link('https://community.anytype.io/d/317-support-for-plain-text-in-a-code-snippet/1', 'maxitg')}.`),
		bullet(`Add link creation via Markdown Syntax. Just write this anywhere in text block with format [text](link). Thanks, ${link('https://community.anytype.io/d/709-add-link-creation-via-markdown-syntax/1', 'alsmnn')}.`),
		bullet(`We've added fast community feature request / bug report link instead of Typeform &amp; link to knowledge base.`),

		h2(`Bugs we've fixed`),
		bullet(`Page restored from archive tab is still visible in archive tab. Thanks, ${link('https://community.anytype.io/d/536-page-restored-from-archive-tab-is-still-visible-in-archive-tab', 'Tanzeel098, lynxlove, gis, Aljosha Leusmann')}.`),
		bullet(`Delay to start a new block after hitting “enter”. Thanks, ${link('https://community.anytype.io/d/334-delay-to-start-a-new-block-after-hitting-enter/1', 'HLucas')}.`),
		bullet(`Sometimes updates of names on home stop arriving after opening and changing on the second device.`),
		bullet(`Instable download crashes application. Thanks, ${link('https://community.anytype.io/d/654-instable-download-crashes-application/1', 'wemiprog')}.`),
		bullet(`Greek letter “ώ” displays incorrectly. Thanks, ${link('https://community.anytype.io/d/826-visual-greek-letter-w-is-displayed-incorrectly/1', 'CrossDrain')}.`),
		bullet(`Pasting text with / and @ at the end launched menus.`),
		bullet(`The embedded text disappears from the toggle if you press enter in the open toggle.`),
		bullet(`The arrow down key stops working from 21st toggle in a row. Thanks, SHIZOXLIFE.`),
		bullet(`Menu with all tag / status options closes when chose and select one.`),
		bullet(`Changed option of the tag / status relation become updated in other places with a delay.`),
		bullet(`When you delete a relation from Set you might still have empty column in other views.`),
		bullet(`Adding date from next month drops the value to December of 2020. Thanks, ${link('https://community.anytype.io/d/629-date-picker-defaulting-to-dec-2020-when-picking-certain-dates/1', 'Corsecharter')}.`),
		bullet(`The year in the date was changed incorrectly if there was already a value been set.`),
		bullet(`Unexpected behavior may happen when clicking at the right side of object's name in Set. Thanks, ${link('https://community.anytype.io/d/655-unexpected-behavior-when-clicking-input-fields/1', 'nizos')}.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 10 August, 2021`),
		text(`Some features are being tested by a smaller group while we verify their stability, and so may not be available to everyone. If you want to try Types before they were released for everyone: ${link('https://community.anytype.io/d/604-onboarding-for-the-new-anytype/2', 'click here for more info')}.`),
		h2(`Fixes &amp; tech`),
		bullet(`Fix of higher memory consumption. Thanks, ${link('https://community.anytype.io/d/619-anytype-swallows-ram', 'Srinath, lucasmmarino')}.`),
		bullet(`Column width snap to now has more positions: 0.25, 0.5, 0.75 Thanks for starting a discussion, ${link('https://community.anytype.io/d/340-column-width-snap-to', 'jmsinnz')}. Analyzing the previous rows is a rather resource-intensive in terms of performance.`),
		bullet(`Cursor jumped back when pasting text. Thanks, ${link('https://community.anytype.io/d/276-cursor-jumps-back-when-pasting-text', 'bgray')}.`),
		bullet(`Object titles &amp; descriptions could be truncated. Thanks, ${link('https://community.anytype.io/d/428-object-titles-descriptions-truncated', 'irdinamaztura, Kite, quietwalker, Inkqb, Tanzeel098, roncz, lynxlove, trellick')}.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 27 June, 2021`),

		text(`Several small bugfixes`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 22 July, 2021`),
		text(`You can expect longer sign in up to several minutes. It is related to data structure optimisations that app needs to migrate on.`),

		h2(`New features &amp; enhancements`),
		bullet(`Mouse button ${hl(`forward`)} / ${hl(`backward`)} now works for navigation. Thanks, ${link('https://community.anytype.io/d/21-mouse-button-forwardbackward-navigation', 'Oshyan')}.`),

		h2(`Design &amp; UX`),
		bullet(`You can now restore from Archive tab via three dots menu`),
		bullet(`2 new abstract covers related to the upcoming major relase`),

		h2(`Fixes &amp; tech`),
		bullet(`Item movement by ${hl(`${cmd} + ${shift} + Up/Down`)} would delete its content when not "saved". Thanks, Sven`),
		bullet(`Hyperlink pop up window persisted across pages. Thanks, ${link('https://community.anytype.io/d/341-hyperlink-pop-up-window-persists-across-pages/1', 'jmsinnz')}.`),
		bullet(`New Checkbox was created pre-checked if the one above was checked. Thanks, ${link('https://community.anytype.io/d/311-new-checkbox-pre-checked/1', 'bskinner')}.`),
		bullet(`When you dragged pictures into a toggle, it resized to the width of the toggle. Thanks, ${link('https://community.anytype.io/d/461-when-you-drag-pictures-into-a-toggle-it-resizes-to-the-width-of-the-toggle/1', 'Inkqb')}.`),
		bullet(`When first setting up Anytype using a key to log in, pressing ${hl(`Enter`)} didn't submit the input. Thanks, ${link('https://community.anytype.io/d/498-enter-key-should-submit-seed-phrase/1', 'gil')}.`),
		bullet(`Numeration could start from 1 in different circumstances. Thanks, ${link('https://community.anytype.io/d/450-changing-long-text-into-nummerous-list-bug/1', 'XxxBalCion')}.`),
		bullet(`"Type text or / for commands" was visible on desktop overlapping the newly added text from Android. Thanks, ${link('https://community.anytype.io/d/420-help-text-overlap-bug/1', 'abiak')}.`),
		bullet(`Background color wasn't exporting when printing. Thanks, ${link('https://community.anytype.io/d/368-background-colour-not-exported-when-printing/1', 'firmicutes')}.`),
		bullet(`Pressing ${hl(`Backspace`)} after using inline markdown at the beginning of the block now reverts block style to text. Thanks, ${link('https://community.anytype.io/d/401-text-to-bullet-list-and-back/1', 'wemiprog')}.`),
		bullet(`Inline markdown work optimisations. Computation speed was low for big blocks and carriage jumped futher after using a markdown symbol.`),
		bullet(`After writing «turn into object» after / there was no such option`),
		bullet(`Dashboard's search value remained in filter after closing the search box. Thanks, ${link('https://community.anytype.io/d/408-remove-search-filter-when-search-box-closes/1', 'ichimga')}.`),
		bullet(`Clicking inside the dashboard's search box closed the search box. Thanks, ${link('https://community.anytype.io/d/407-clicking-inside-the-search-box-closes-the-search-box/1', 'ichimga')}.`),
		bullet(`Import from Notion crash «failed to unescape destination». Thanks, Jin Kolesnikov`),
		bullet(`${hl(`Cancel`)} when choosing a cover saved it. Thanks, ${link('https://community.anytype.io/d/424-cancel-when-choosing-a-cover-saves-it/1', 'irdinamaztura')}.`),
		bullet(`Replacing an inline code block injects the rendered HTML into your page text. Thanks, ${link('https://community.anytype.io/d/454-replacing-an-inline-code-block-injects-the-rendered-html-into-your-page-text/1', 'triangles')}.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 21 June, 2021`),
		text(`The big style train keeps on rolling! This latest version features our redesigned dashboard with tabs and inline object filtering.`),
		text(`It also includes features for better keyboard support and fixes for issues relating to sync and page editing. Thanks to our alpha testers for all your bug reports &amp; feature requests. We hope you enjoy this latest build of Anytype and we look forward to your feedback on the new dashboard.`),
		
		h2(`New features &amp; enhancements`),
		text(`We've polished writing experience to make it smooth around the edges.`),
		bullet(`Support for ${hl(`Inline`)} code and formatting when typing with the keyboard. Also we've add, ${hl(`** or __`)} - bold, ${hl(`* or _`)} - italic ${hl(`~~`)} - strike. Thanks, ${link('https://community.anytype.io/d/273-support-for-inline-code/1', 'Michael')}!`),
		bullet(`You can use shortcuts to create arrows ${hl(`->`)} = ${hl(`→`)}, <span class="highlight"><-</span> = ${hl(`←`)}, ${hl(`-->`)} = ${hl(`⟶`)}, <span class="highlight"><--</span> = ${hl(`⟵`)}, <span class="highlight"><--></span> = ${hl(`⟷`)}.`),
		bullet(`Sometimes you could end up without a cursor on the page, e.g. after removing a block, and break the keyboard flow. Now you can just press ${hl(`Enter`)} or press up and arrow keys and continue no matter what happened.`),
		bullet(`You can now manage toggle with the keyboard. Pressing → at the end of the block will open it. When pressing ${hl(`Tab`)} to create a sub-block of a toggle, the toggle block will now expand to show the new block. The same will happen after dropping content into a closed toggle. Thanks, Rai, ${link('https://community.anytype.io/d/390-automatically-open-toggle-block-after-another-toggle-is-indented-inside', 'Kite')}!`),
		
		h2(`Fixes &amp; tech`),
		bullet(`Archiving a page on the desktop would not remove the pages from Android. Thanks, ${link('https://community.anytype.io/d/333-pages-going-missing-after-archiving-and-sync-between-desktop-and-android', 'Nbaumann, pace8, Foltik')}`),
		bullet(`Windows Navigation pane and app bar was broken for Windows. If Anytype was resized for a screen (Desktop or external monitor), and you disconnect that screen, Anytype does jump to the remaining screen but is wrongly displayed. Hence you cannot access the minimize or close buttons of the top right corner anymore. Thanks, Hatch Hemp Crisp, ${link('https://community.anytype.io/d/351-taskbar-disappears-after-minimizing-and-maximizing', 'div3xi')}, <a href = "https://community.anytype.io/d/363-cant-minimize-the-anytype-window">Tanzeel098</a>, floseq`),
		bullet(`After adding new Bookmark or Media placeholder keeped selected and not actionable`),
		bullet(`After pressing the Delete button with the page opened without carriage inside it could close and open the dashboard. Now we just ignore that.`),
		bullet(`Every page created in the dashboard was automatically added to favorites. Thanks, ${link('https://community.anytype.io/d/387-every-block-created-is-automatically-added-to-dashboard/1', 'Tanzeel098')}`),
		bullet(`One page could be added to favorites multiple times. Thanks, ${link('https://community.anytype.io/d/347-add-to-dashboard-function-adds-the-same-page-to-dashboard-leading-duplicates/1', 'Bzimor')}`),
		bullet(`Export on macOS - Error when unpacking ${hl(`.zip`)} archive. ${hl(`Error 63 File name too long.`)}. Thanks, ${link('https://community.anytype.io/d/360-export-on-macos-error-when-unpacking-zip-archive/1', 'gis')}`),
		bullet(`Automatically focus the first result in the slash menu. Thanks,${link('https://community.anytype.io/d/373-automatically-focus-first-result-in-slash-menu/1', 'Foltik')}`),
		bullet(`Page should be in the first place When I type ${hl(`/page`)}. Thanks, ${link('https://community.anytype.io/d/306-page-should-be-in-the-first-place/1', 'KeepOnce')}`),
		bullet(`Enter the page by clicking the non text area of the page. Thanks, ${link('https://community.anytype.io/d/307-enter-the-page-by-clicking-the-non-text-area-of-the-page/1', 'KeepOnce')}`),
		bullet(`Bold text indicator does not work properly. Thanks, ${link('https://community.anytype.io/d/274-bold-text-indicator-does-not-work-properly/1', 'BGray')}`),
		bullet(`The ${hl(`Move To`)} option can lose data. Thanks, ${link('https://community.anytype.io/d/327-move-to-option-can-loose-data/1', 'jayenicks')}`),
		bullet(`Anytype crashes everytime I try to import my Notion workspace. Oussama, Jin, you can try again one more time`),
		bullet(`We have removed the link to the closed Telegram group from the app. Please sign up using the links in your email. `),

		div(),
		// --------------------------------------------//

		h1(`Updates for 08 June, 2021`),

		text(`Say hello to the new slash menu!`),
		h2(`New features &amp; enhancements`),
		bullet(`New slash: a boost for content creation. You can now write ${hl(`/`)} anywhere to change style, make action or create a new block. Simply enter some text to filter your results. The new Style section works with text styles in the current block. The Turn-into action creates objects from the blocks and no longer works with styles.`),
		bullet(`Every new divider or media block gets selected after creation, so you can continue using the keyboard by pressing enter, up and arrow. Thanks to all who mentioned keyboard experience before in feedback and for writing posts like ${link('https://community.anytype.io/d/308-creating-dividers-removes-cursor', `Ben's`)}.`),
		bullet(`Give feedback now works through the new form with ability to add media.`),
		bullet(`New ${hl(`Description`)} block. Anytype's first relation. Description is a simple block that contains a short description, and can be used in databases for context extension, filtering, sorting and many more in the future. Please ${link('https://community.anytype.io/d/343-description-block-what-you-think-about-it', 'tell us')} what you think!`),
		bullet(`Entering pin code now open the last opened page, not dashboard.`),
		h2(`Design &amp; UX`),
		bullet(`Tray icons now have fast options to create ${hl(`New Object`)}, ${hl(`Search Object`)}, ${hl(`Import`)}, ${hl(`Export`)}, ${hl(`Quit`)} and more.`),
		bullet(`Optimised application bar. It shows navigation options constantly. And also refreshed style for macOS Mojave`),
		h2(`Network`),
		bullet(`Sync now works under restricted networks through special circuit relay logic ${link('https://docs.libp2p.io/concepts/circuit-relay/ ', 'This new concept')}  helps to connect devices between VPN, cellular, WiFi with NAT, and many more. This means fast syncing in more cases. We will continue to improve sync across all network topologies, including LANs.`),
		bullet(`Our core library (libp2p) was updated on the backup server. Now if two devices open a TCP connection to each other at the same time using the same set of ports, they'll end up with a single TCP connection. Previously, libp2p would treat this as an error and disconnect. The server update itself doesn't fix this, so you need to install the latest version on your device and bring the syncing consistency back! Thanks to Chris, Martin, Samuel, 3000, Sinesh, Danijel, Alex, Nodoby, Volodymyr, Sven and Oshyan for  ${link('https://community.anytype.io/d/231-desktop-app-is-not-syncing/20', 'conversation')} and sharing diagnostics files.`),
		bullet(`Pages could disappear on the dashboard. We fixed the bug with the syncing mechanism logic. Thanks, ${link('https://community.anytype.io/d/333-pages-going-missing-after-archiving-and-sync-between-desktop-and-android/1', 'Martin')}, Vincer`),
		h2(`Fixes &amp; tech`),
		bullet(`Possibility to dive into a search result by pressing the enter key. Thanks, Björn, ${link('https://community.anytype.io/d/322-desktop-linux-being-able-to-enter-page-from-search-using-enter-keyy', 'Erwin')}`),
		bullet(`Pasting content into the existing code block could turn it to the text.`),
		bullet(`Sub-menu remained open after closing the main menu in the dashboard. `),
		bullet(`When creating several pages on one could lead to wrong link positioning. New page could be linked with previously created.`),
		bullet(`Actions icon disappears when you move the page. Thanks, ${link('https://community.anytype.io/d/279-actions-icon-disappears-when-you-move-the-page/1', 'BGray')}`),
		bullet(`Pasting an image could lead to stuck in "Processing...". Thanks, ${link('https://community.anytype.io/d/296-pasting-an-image-leads-to-stuck-in-processing/1', 'Clouedoc')}, ${link('https://community.anytype.io/d/337-page-disappearedmissing-and-pasting-picture-from-clipboard-crash', 'Vincer')}`),
		bullet(`The clickable path in the backup section of the Status page didn't actually open the File Explorer. Thanks, Céderic`),
		bullet(`When I have the toggle list closed, and I press enter to create a new one, it creates a nested toggle list instead of creating one in the same hierarchy. Thanks, Ary`),
		bullet(`When I try to create a linked page by typing in ${hl(`/link`)}, the text ${hl(`/link`)} remains on that line while the linked page I selected is made available in the next line. Thanks, ${link('https://community.anytype.io/d/325-shortcut-text-link-remains-after-creating-linked-page', 'Mathew')}`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 19 April, 2021`),

		h2(`Hotfixes`),
		bullet(`Exclude archived items in search. ${link('https://community.anytype.io/d/288-option-to-exclude-archived-items-in-search/1', 'Community thread')}`),
		bullet(`Set back the file icon after uploading a file. ${link('https://community.anytype.io/d/286-file-icon-is-missing-after-upload-a-file/1', 'Thread')}`),
		bullet(`Fix the duplicating title in the profile page. ${link('https://community.anytype.io/d/277-duplicate-title-in-profile-page/1', 'Thread')}`),
		bullet(`Search box and page resize slider fix in Windows. ${link('https://community.anytype.io/d/278-search-box-is-out-of-page/1', 'Thread about search')}, ${link('https://community.anytype.io/d/283-resize-sliderline-where-small/1', 'resize')}`),
		bullet(`Search bar description inconsistency fix. ${link('https://community.anytype.io/d/289-search-bar-description-inconsistency/1', 'Thread')}`),
		bullet(`After trying to drag a bookmark, the application window became inoperational`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 16 April, 2021`),

		text(`Hold onto your desks, this is a big one!`),
		text(`Previous updates focused on the unseen: bugs, sync, speed, and reliability. Those were difficult and necessary updates. It's important Anytype's foundation supports multiple object types and rich data views. With this release, however, you'll begin to see some of the visual changes we're putting in place for our next major release. We want Anytype to be a delightful experience for its users, and we hope you enjoy this sneak peek at what's coming.`),

		h2(`New Features`),
		bullet(`We've spruced up Anytype with a refreshed design. We hope you'll enjoy larger icons and more object descriptions.`),
		bullet(`A new search pane, featuring full-text search that can find matches inside your objects &amp; pages.`),
		bullet(`Markdown <b>export</b> Located in Settings, you can now export your Anytype pages into markdown.`),
		bullet(`Greater page customisation options. Users can now change page alignment, and make changes to overall page size. This can be found in the menu while editing a page on the top-right of Anytype.`),
		bullet(`You can now add/remove pages to/from the dashboard. Simply click the menu from any page.`),
		bullet(`It can be tough to login to the mobile app with a mnemonic phrase, so you can do that with a QR code. Your unique QR code is found under Settings > Key.`),
		text(''),
		text(`${hl(`Please don't share your key or your QR code with anyone.`)}`),

		h2(`Enhancements`),
		bullet(`Men-oeuvres. Menus will now flip vertically/horizontally when they run out of space.`),
		bullet(`Saved you a click. Sub-menus will now open on mouseover.`),
		bullet(`Link-to and move to functions are now available through the search pane.`),

		h2(`Bug fixes`),
		bullet(`Backspace or delete would sometimes open the previous page instead of deleting blocks.`),
		bullet(`Sometimes, when you typed title text, an errant letter may chase after the carriage. Not anymore. Thread: ${link('https://community.anytype.io/d/157-cursor-occasionally-jumps-back-when-typing', 'https://community.anytype.io/d/157-cursor-occasionally-jumps-back-when-typing')}`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 18 March, 2021`),
		h3(`Sync enhancements`),
		text(`This release is all about reliability and sync speed.`),
		text(`Readers beware, these are some hardcore technical release notes:`),
		bullet(`Multi-stream simultaneous connections should be fixed, as a result of our updating to the latest ${hl(`libp2p`)} libraries.`),
		bullet(`We've updated the request rate for adaptive changes. They are now based on persistent sync statuses, and this has reduced the polling rate of inactive devices. This helps us keep any further complexities that may arise from polling at bay.`),
		bullet(`Anytype is now efficient at checking an object's information is in sync between any two nodes, by using heads/address edges. This feature also helps reduce communication overhead between synced and inactive peers.`),
		bullet(`Address edge computation implemented. This includes a deterministic digest of all peer addresses involved in the object's creation and changes.`),
		bullet(`${hl(`Object diagnostics`)} are now in the system menu. This tool will help us diagnose sync issues. It generates a file, which you can share with the team using the feedback tool. The result is confidential.`),
		bullet(`Many minor fixes and improvements. Thank you so much for the data on Telegram and the ${link('https://community.anytype.io/d/231-desktop-app-is-not-syncing', 'Desktop app is not syncing')} thread.`),
		text(''),
		text(''),
		text(`I'm sure it feels like we've been saying this forever, but we really are very close to our databases update. It will feature a refreshed design, rapid semantic search, move-to &amp; linking optimisations, and much more.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 26 January, 2021`),
		h2(`No connection → Synced`),
		text(`This is a patch that fixes the backup node connection status. The sync mechanism itself worked well and all of your data was backed up successfully in January.`),
		text(`We release fewer features as we're going to release a big update in February, so stay tuned!`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 8 December, 2020`),

		text(`Happy holidays from the Anytypers!`),
		text(`As we near the end of 2020, we want to say thanks for all your support this year.`),
		text(`There are many reasons to be optimistic about 2021. For us, we're looking forward to databases, templates, and a discussion about how objects work together.`),
		text(`This is a major Anytype update with sync status, security improvements, and bug fixes. Overall, we think this release should provide you a much-improved experience.`),

		h3(`Sync statuses:`),
		bullet(`On the top-right corner of Anytype, you can find the sync status summary of every page.`),
		bullet(`You can now dive into the details by clicking on the status and see the interaction with the backup node and other devices you use.`),
		bullet(`For each device, you will see when the last direct (P2P) synchronization took place. Since we live in a distributed world, data can be transferred directly from the device or through a backup node if it was connected this way. `),
		bullet(`The dashboard pages and links to pages have received special states also to help you better understand the sync status.`),
		text(`${hl(`Updates requested`)} status calculation starts to work from this release.`),

		h3(`Further Enhancements:`),
		bullet(`Your mnemonic passphrase is now stored in your system's keychain.`),
		bullet(`We disabled the noise security protocol and enabled the latest TLS, rewrote initial sync logic, and now we have more successful connections between devices. This means new objects will sync faster. `),
		text(`We're currently working on another major update which should increase the sync success rate even more.`),

		h3(`Bug fixes:`),
		bullet(`We fixed a bug that prevented some users from mentioning their pages. Thanks, Mukanzi!`),
		bullet(`We've fixed the Anytype icon and hover state on Windows. Thanks, Ichimga!`),
		bullet(`Page top-rights icons clips over rendered above the scroll bar in modal views in narrow resolutions. Thanks, BGray!`),
		bullet(`The <span class="highlight"><</span> or ${hl(`>`)} symbols don't disappear anymore. Thanks, George!`),
		bullet(`The URL doesn't paste in the URL dialog window if you try to create a link in a text by ${hl(`Cmd + K`)} and ${hl(`Cmd + V`)} combination. Thanks, Hayk!`),
		bullet(`Holding left click and scrolling at the same time was laggy. Thanks again, Hayk!`),
		bullet(`After pasting the URL link the menu could drop the carriage to the beginning of the block and paste it there.`),
		bullet(`Carriage drops to the beginning of the line after setting the markup color.`),
		bullet(`Dividers have lost the “turn into” option.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 20 November, 2020`),

		text(`New encryption. We now using AES with stream encryption with CFB mode. Old encryption could increase the RAM consumption to 13,46 GB with 4GB file and could even crash Anytype. Now it takes less than 100 megabytes with any size of the file. For the best performance, you need to be up-to-date in each Desktop app and use the latest Android version. It starts to work with the new files added to Anytype, so, please, re-upload big files.`),

		h3(`Enhancements:`),
		bullet(`Turn into now can turn page links into mentions with other text styles.`),
		bullet(`We now show the loading object state for pages that downloading from the remote node.`),

		h3(`Bug fixes:`),
		bullet(`${hl(`${shift} + Enter`)} doesn't create a new line within a block. Thanks, Poochy!`),
		bullet(`Markup menu remains open when click outside the editor container. Thanks, BGray!`),
		bullet(`The text disappears if you type and press the system button back after typing and open the page again. Thanks, BGray!`),
		bullet(`Markup menu remains open when click outside the editor container. Thanks, BGray!`),
		bullet(`Clipboard. Dismiss after pasting an URL gets pasted as plain text not as URL. Thanks, Luuk!`),
		bullet(`Clipboard. Columns cut and copy part of the text block doesn't work properly.`),
		bullet(`Mention. Several creation and deletion attempts can break the style range.`),
		bullet(`Selection with shift pressed. If there is a carriage inside the block and you press shift and click on another block, the first block should also become selected. `),
		bullet(`Selection with shift should work from bottom to top and select all blocks between. If users starting to click in another direction the selection should always extend.`),
		bullet(`The search window doesn't match with the search pane frame.`),
		bullet(`Undo / Redo can return events with wrong order.`),
		bullet(`You cannot open the page from the dashboard if you click in the icon zone.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 30 October, 2020`),
		text(`This is a technical minor release with bug fixes and minor enchancements.`),

		h3(`Enhancements:`),
		bullet(`The page icon is now moving with the title, so you can make a page with a centered layout.`),
		img('centered.png', 'full'),
		bullet(`We moved page cover controls position in a more convenient place.`),
		bullet(`Mentions now have the ability to break into a new line.`),
		bullet(`We have enabled dropping blocks into the page.`),
		bullet(`App usage survey pop-up was tuned not to show for new users.`),

		h3(`Bug fixes:`),
		bullet(`Functions like move to, duplicate, delete, and align didn't work in block's turn into menu.`),
		bullet(`The search on the page did not highlight the found data in the text where the styles were added.`),
		bullet(`In-page search position is now fixed to the top.`),
		bullet(`In-page search had no possibility to find special characters.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 08 October, 2020`),
		text(`We're taking another step towards our beta today, with the launch of our ${link('https://community.anytype.io/', 'community forum')}. It will be a valuable resource for features, feedback and support. We hope it will also a place for you to do what you do best: discuss the future of the web and building your very own digital brain. Your invite code should wait you in mailbox, if nothing there please write us ${link('mailto:hello@anytype.io', 'hello@anytype.io')}.`),

		h3(`Enhancements:`),
		bullet(`The title can be aligned, has color and background now.`),

		h3(`Bug fixes. Not anymore:`),
		bullet(`Document structure can brake in some cases and prevent the page from opening.`),
		bullet(`Clipboard. Can't copy and paste part of the text block in Anytype.`),
		bullet(`Clipboard. Highlighted, checkbox, toggle, and header type blocks with content become text type if you paste the text into them.`),
		bullet(`Clipboard. Copying block from one column to another place leads to layout brake.`),
		bullet(`Drag and drop. Moving blocks with complex structures can't be done in some cases.`),
		bullet(`Links without URL schema can't be opened in some cases.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 05 October, 2020`),
		text(`This is one for the history books. With Anytype 0.16, users can now travel through time to recover previous versions of their pages. Use ${hl(`History`)} on the page's menu in the top-right corner.`),

		h3(`Enhancements:`),
		bullet(`New page inside another one will open in modal view. All other pages can be opened this way with ${hl(`${shift} + Click`)}.`),
		bullet(`Menu bar icons now alternate between light and dark.`),
		bullet(`You can @mention new page just by pressing enter after writing a name.`),
		bullet(`We've made the main logo clickable and display search as it works on other pages.`),
		bullet(`We've changed header icons set a bit.`),
		bullet(`The document building algorithm was improved.`),
		bullet(`Pressing ${hl(`CMD/CTRL + S`)} will now focus on the search bar, making it even easier for you to find what you're looking for.`),

		h3(`Bug fixes:`),
		bullet(`Sometimes speedy typists would type so quickly, Anytype wouldn't delete their text. That bug has been fixed with this build, so you can take it back to 88.`),
		bullet(`Changing the text colour in-block will no longer return the carriage to the beginning of the text string.`),
		bullet(`When selecting a block with nested blocks, those nested blocks will now also be selected.`),
		bullet(`Users with email addresses on newer TLDs reported issues when trying to submit feedback. We've updated our email address validation.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 23 September, 2020`),

		text(`Thank you to our incredible alpha testers for helping us build Anytype. In this latest build, we've introduced a short — 1 minute — survey. Your feedback is appreciated, and helps make our product better! `),

		h3(`Enhancements:`),
		bullet(`Enhanced syncing time and page retriving speed up to 100%.`),
		bullet(`${hl(`Create new page`)} from @mention will create it in-line with written name without opening.`),
		bullet(`Block's drag-n-drop now work faster, dropping areas was tuned for better usage.`),
		bullet(`Emoji's and searching lists rendering were boosted.`),
		bullet(`Our updater has been… <i>sigh</i> updated. Download checks will take place in the background, and you will have the option to update now or later.`),
		bullet(`Typing ${hl(`/todo`)} will now create a to-do list!`),
		bullet(`Windows: Close, Restore and Minimise buttons are now more responsive. `),
		bullet(`Search results can now be selected using the keyboard's up/down arrows and the tab key.`),
		bullet(`The Highlighted block can have right align now.`),

		h3(`Bug fixes:`),
		bullet(`Windows: ${hl(`Alt + F4`)} will now correctly close the application.`),
		bullet(`Windows: Entire blocks, when selected, can now be removed using the ${hl(`Delete`)} key.`),
		bullet(`Speedy typists noticed the sheer speed of their speedy keys could cause the @mention menu to break, sometimes leading to data loss. This has now been fixed. Feel free to take that typing past 88… wpm.`),
		bullet(`Irregularities and inconsistencies with both selecting and deselecting text inside blocks have been found and fixed.`),
		bullet(`A bug where pressing ${hl(`CTRL + S`)} to access search caused the menu to flicker has been fixed.`),
		bullet(`Unruly carriages no longer return to the start of the block when using @mentions.`),
		bullet(`Emoji used for pages are now rendering correctly after being synced across devices.`),
		bullet(`After the recovery from the backup server, some images couldn't be loaded. Fixed.`),
		bullet(`Links are not hiding from the dashboard if are too many.`),
		bullet(`Fast login-logout could lead app to crash. Fixed.`),
		bullet(`Dashboard has now been removed from search.`),
		bullet(`We have removed a bug which allowed users to create a PIN shorter than 6 characters.`),
		bullet(`A bug which allowed users to access the search menu from the PIN entry screen has been squashed.`),
		text(`When using ${hl(`CMD/CTRL + L`)} for links, the dialog will now open below each time it was used.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 28 August, 2020`),

		h3(`We are happy to introduce <b>Anytype for Linux!</b>`),
		text(`To run the application in Linux OS check out the ${link('https://discourse.appimage.org/t/how-to-run-an-appimage/80', '"How to run AppImage instruction"')}. New versions of Anytype will come with separate ${hl(`.AppImage`)} files automatically. For updates, you just need to use a new one. Later we will add an app in Snap.`),
		text(`The following platforms are verified to be able to run the Anytype:`),
		bullet(`Ubuntu 12.04 and newer`),
		bullet(`Fedora 21`),
		bullet(`Debian 8`),

		h3(`New features:`),
		bullet(`The Windows menu bar was redesigned to take up less space and look better.`),
		bullet(`We added new keyboard shortcuts and a new page for faster memorizing and usage. Now you can use the keyboard to get into the home screen, delete text to the left, and much more!`),
		bullet(`You can search text in-page with ${hl(`CMD/CTRL + F`)} and via page menu.`),
		bullet(`Manual check for software updates now has a window with status.`),
		bullet(`Our feedback section now has templates for different situations.`),
		bullet(`Enhanced syncing for pinned files and finding peers.`),

		h3(`Bug fixes:`),
		bullet(`An inability to delete nested paragraphs.`),
		bullet(`No in-app images in Linux and Windows version.`),
		bullet(`When setting the cursor from the last block to the top the page could scroll down.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 14 August, 2020`),

		text(`This release brings several improvements to cross-device syncing and reduces the amount of disk space needed. This version comes with a new data format for your pages, and is a huge step towards further collaboration features in the future.<br>`),
		text(`Right now, however, it means your page history will use <b>much</b> less space, changes that you made in one device will come to another <b>online without having to refresh</b>.`),

		h3(`🔔 What's changed?`),
		bullet(`You can now paste images from the clipboard into Anytype blocks.`),
		bullet(`We've added a progress bar for users who import from Notion. <br>So now you can track the progress`),
		bullet(`Copying lists with nested items now pastes in the correct structure. `),
		bullet(`Fixed ability to copy and paste the whole block. `),
		bullet(`A bug that allowed users to bypass the PIN screen through the Help button <br> has been fixed.`),
		bullet(`When using markup — bold, italics, etc — made with multiple blocks selected, it now can be reversed by using the same shortcut.`),
		bullet(`We've fixed a bug that changed the markup of text after a mention is inserted.`),
		bullet(`One user noticed an issue with the feedback submission process, <br>which we have now fixed. `),
		bullet(`Drag-and-drop with nested blocks has been improved. Users should no longer encounter disappearing blocks.`),
		bullet(`Finally, for any users wondering why the carriage was disappearing in an empty block, it has been found and safely returned!`),
		bullet(`Updating to the latest version of the Anytype alpha should go smoothly, without several restarts as we have fixed an issue causing the old app not to close during the update process.`),
		bullet(`Links restrictions. Ability to set a link or move on the page itself removed.  <br>Home option removed from linking on pages. Archived pages removed from navigation, search, and mentions. `),

		h3(`🐁 ≠ ⌨️ Less mouse, less distractions.`),
		text(`You can use the navigation pane with keyboard keys:`),
		bullet(`Easily switch pages with the arrow keys.`),
		bullet(`${hl(`←`)} and ${hl(`→`)} arrow transfers the selection to links, ${hl(`↑`)} and ${hl(`↓`)} arrows transitions between the same level, and ${hl(`Enter`)} is confirmation.`),
		bullet(`${hl(`Tab`)} &amp; ${hl(`${shift}`)} + ${hl(`Tab`)} can also be used to select objects. This is similar to the browser's selection of elements.`),
		bullet(`${hl(`↑`)} and ${hl(`↓`)} arrows, ${hl(`Tab`)} &amp; ${hl(`${shift}`)} + ${hl(`Tab`)} nnow transition your selection between options in the search menu without needing any additional filtration.`),

		h3(`🙏🏻 Acknowledgements`),

		text(`Anytype releases wouldn't be possible without a multitude of people, and our thanks go out to all of our brilliant alpha users and bug reporters.`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 24 July, 2020`),
		text(`Fixed syncing between devices. You finally can transfer data to another computer with the same mnemonic phrase. It's a simple implementation, so it can still lead to modification loss in case of concurrent changes in the same document.`),
		text(`To maximize the probability of successful synchronization we recommend updating both devices to this version.`),

		h3(`Small features were implemented:`),
		bullet(`You can use shortcuts to go back and forward. To open the previous page from your history use ${hl(`CMD + [`)} for macOS or ${hl(`Alt + ←`)} for Windows. ${hl(`CMD + ]`)} for macOS or ${hl(`Alt + →`)} for Windows for another direction.`),
		bullet(`${hl(`CMD + /`)} now works with multiple blocks.`),
		bullet(`Powertool ${hl(`/`)} and mention ${hl(`@`)} menu auto-close when you continue typing with no results.`),
		bullet('Type <span class="bgColor bgColor-grey textColor textColor-red nw">```</span> to add a new code block.'),
		bullet(`We made dashboard style update and new geometric wallpapers.`),
		bullet(`Pin code verification was added in case you want to change or turn it off.`),
		bullet(`App saves its size and position on exit. App window now has a minimum width.`),
		
		h3(`Sneaky bugs were fixed:`),
		bullet(`Redo ${hl(`CMD + ${shift} + Z`)} is working properly now.`),
		bullet(`Fixed shortcut for turn-into menu. It was launching with ${hl(`?`)}, ${hl(`,`)} in some keyboards.`),
		bullet(`Splitting and merging blocks could lead to an unwanted state with disappearing symbols when typing fast. This problem was solved.`),
		bullet(`Menu. Filtering. When using search the first element gets selected by default now.`),
		bullet(`The carriage could be moved to the new block after it was positioned it the title without a glitch.`),
		bullet(`Pincode input saving all the symbols when typing fast.`),
		bullet(`Image. The bigger picture view was fixed.`),
		bullet(`Creating a new block (pressing ${hl(`Enter`)}) lead to page jump when the page has been scrolled down. Now it's ok!`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 15 July, 2020`),
		h3(`Windows support is now (finally) available!`),
		text(`Also we have a list of fixed bugs and features &amp; improvements implemented:`),
		bullet(`Chinese symbols input issues. Tested on Pinyin and Cangjie. For now, we use space and enter as symbol insertion, later we would implement numbers.`),
		bullet(`German keyboard shortcuts issue is now fixed. Try ${hl(`CMD + /`)} (${hl(`CMD + ${shift} + 7`)}) one more time.`),
		bullet(`Phantom lists fixed: "Working with a list could lead to some elements disappearing when working with indentation".`),
		bullet(`You can finally use tab in the code block.`),
		bullet(`Code blocks now support even more languages!`),
		bullet(`"Can't close a modal window on outside-click when 2 modals are open." Fixed.`),
		bullet(`We've tuned the behaviour of update requests.`),
		bullet(`Split-merge text blocks in the editor. The carriage now set between the merged blocks.`),
		bullet(`Updates to the What's New page.`),
		bullet(`Copying and pasting text from external sources has been fixed.`),
		bullet(`"Setting some kind of markup leads to whole block deletion." Not anymore!`),
		bullet(`Fixed first-element highlighting in the menus.`),
		bullet(`${hl(`CTRL + N`)} and ${hl(`CTRL + P`)} shortcuts now available to work with lines in macOS.`),
		bullet(`Import from Notion now supports larger amounts of data.`),
		bullet(`Turn Into, Align, and Color now works on multiple levels of indentation.`),
		bullet(`macOS app closing into the Dock by default.`),
		text(`... and many other small improvements! `),

		div(),
		// --------------------------------------------//

		h1(`Updates for 10 June, 2020`),
		text(`We value your time and develop a great timesaver for you — now you can transfer data from other sources into Anytype!`),
		text(`Open settings in the dashboard or use ${hl(`File → Import`)} in the System menu and try. You can import all your data from Notion with the same structure for now, later we will develop more sources.`),
		img('import.png', 'full'),
		text(`A friendly reminder. Without any imports, you can save note from another app or an article from Wikipedia, and store it forever on your computer. Just copy it there and paste into Anytype. <i>Voila!<i>`),
		text(`Please, write us what you think and what source you want to import in&nbsp;Anytype!`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 29 May, 2020`),
		h3(`Mention`),
		text(`Now Anytype allows you to refer to any page right in your content.`),
		text(`Simply insert the ${hl(`@`)} sign and start typing the name of a page you want to refer to.`),
		text(`You can mention any page anywhere and it will build a relationship between pages. All&nbsp;mentions will be shown in the navigation panel. It's just a more convenient way to connect any pages inside Anytype. Hope you enjoy it and we look forward to your suggestions on how we could make it better.`),
		text(`<img src="mention.gif" class="full mention">`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 6 May, 2020`),
		h3(`Meet the new navigation`),
		text(`All the knowledge we have in our brains organized associatively, not hierarchically. Our&nbsp;brain, in a way, is interconnected wiki. We have multiple connections between ideas or thoughts in our brains - it's the way we navigate through our memories.`),
		text(`We introduce bi-directional links that allow you to connect ideas freely; you can reuse objects and create any information structure you desire.</br>`),
		text(`Now you can use a three-line icon <span class="icon nav"></span> on the top left of the application or press ${hl(`CMD + O`)} to see bi-directional links between pages and navigate through them.`),
		text(`You can press ${hl(`CMD + S`)} and search the right page by name or information in the&nbsp;first&nbsp;paragrapgh.`),
		{},
		text(`<b>Now you can stop segmenting and limiting the way you connect your thoughts — just link the pages and flesh everything out more naturally.</b>`),

		div(),
		// --------------------------------------------//

		h1(`Updates for 03 March, 2020`),
		h3(`Introducing Anytype`),
		text(`We upgraded the design and backed it up with cutting edge technologies to make your experience safe, secure, and convenient.`),
		text(`${hl(`This version of Anytype is suitable for personal usage only`)}. In the next versions we'll add collaborative functionality.`),

		h3(`Available features`),
		bullet(`Editor with different kinds of blocks you need to work with notes, ideas, collections, knowledge bases, receipts, diaries, to-do lists, travel plans;`),
		bullet(`Media content. Organize your space with playable videos, photos, and web bookmarks;`),
		bullet(`Drag and drop everything in Anytype. Move blocks and create columns. Create pages from your desktop folders. Copy &amp; paste content from other resources;`),
		bullet(`Page styling. Cover the page with a picture, use emoji or custom image to enhance appearance;`),
		bullet(`Dashboard. Add your favorite documents, sort them, and archive to reach them in&nbsp;a&nbsp;second.`),
		text(''),
		text(`<b>Create a new home for your information — private and free</b>.`),
		text(''),
		text(`Thank you for building a new web together, writing us a review, reporting a bug, or making a feature request, moving all of us forward. 🙏`),
		text(`Don't forget to <span class="textColor textColor-red">save your seed phrase</span>  to save access to all your private data. All&nbsp;the&nbsp;new features will appear in automatic updates.`)
		*/
	];
};
