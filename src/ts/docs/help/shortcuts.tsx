import { I } from 'ts/lib';

export default [
	{ type: I.BlockType.IconPage, icon: '⌨️' },
	{ type: I.BlockType.Title, text: 'Keyboard Shortcuts' },
	
	{ style: I.TextStyle.Header1, text: 'Application' },

	{ style: I.TextStyle.Header3, text: 'Basic keys' },
	{ style: I.TextStyle.Bulleted, text: 'Use <b>Cmd</b> & <b>Option</b> in MacOS and <b>Ctrl</b> & <b>Alt</b> in Windows or Linux.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + N</b> to create new page on a dashboard.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + O</b> to open navigation pane.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + S</b> to open search pane.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + P</b> to print the page.' },

	{ style: I.TextStyle.Header3, text: 'Navigation' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd + [</b> or <b>Alt + ←</b> to go back in history.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd + ]</b> or <b>Alt + →</b> to go forward in history.' },

	{ style: I.TextStyle.Header1, text: 'Editor' },
	{ style: I.TextStyle.Header2, text: 'Page' },
	{ style: I.TextStyle.Header3, text: 'Menu' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>/</b> to activate add block menu. You can use up & arrow keys to move in menu. Forward & backward to get into & close sub menu. Use filter and start writing the block name to chose the right one without a mouse.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + /</b> to initialise turn into menu.' },

	{ style: I.TextStyle.Header3, text: 'Basic blocks' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Enter</b> to create new block.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Backspace</b> or <b>Delete</b> to delete selected blocks.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Tab</b> to create nested block. If you want to make it on the same level as a parent block press <b>Shift + Tab</b>. In other words to indent & un-indent use <b>Tab</b> or <b>Shift + Tab</b>.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Shift + Enter</b> to create a line break within a block of text.' },

	{ style: I.TextStyle.Header3, text: 'Lists' },
	{ style: I.TextStyle.Bulleted, text: 'When you working with lists pressing <b>Enter</b> on the end of the line will create a new element of the list if. If you want to end the list simply press <b>Enter</b> on empty block list — it will convert list to text block.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Backspace</b> or <b>Delete</b> to merge element with the one above.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Tab</b> & <b>Shift + Tab</b> to create nested lists and move it right and left.' },

	{ style: I.TextStyle.Header3, text: 'Actions' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + C</b> to copy selected block/blocks or text part.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + V</b> to paste data outside Anytype, block/blocks or text part.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + X</b> to cut selected block/blocks or text part.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + ↑</b> to move to the start of the page, Press <b>Cmd</b> or <b>Ctrl + ↓</b> to move to the end of the page.' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + A</b> to select all text in the block, twice all the blocks in page' },
	{ style: I.TextStyle.Bulleted, text: 'Press <b>Cmd</b> or <b>Ctrl + D</b> to duplicate selected block/blocks  or text part.' },
	{ style: I.TextStyle.Bulleted, text: 'Hold down <b>Shift + ↑ </b> or <b> ↓</b> to expand your selection up or down. ' },
	{ style: I.TextStyle.Bulleted, text: 'Use <b>Cmd + Option + Click</b> or <b>Ctrl + Alt + Click</b> to select or de-select an entire block.' },

	{ style: I.TextStyle.Header3, text: 'Style' },
	{ style: I.TextStyle.Bulleted, text: 'With text selected, press <b>Cmd</b> or <b>Ctrl + B</b> to make the <b>text bold</b>.' },
	{ style: I.TextStyle.Bulleted, text: 'With text selected, press <b>Cmd</b> or <b>Ctrl + I</b> to <i>italicize text</i>.' },
	{ style: I.TextStyle.Bulleted, text: 'With text selected, press <b>Cmd</b> or <b>Ctrl + Shift + S</b> for <s>strikethrough</s>.' },
	{ style: I.TextStyle.Bulleted, text: 'With text selected, press <b>Cmd</b> or <b>Ctrl + L</b> to add a link. You can also paste a URL over selected text to turn it into a link using <b>Cmd</b> or <b>Ctrl + V</b>.' },
	{ style: I.TextStyle.Bulleted, text: 'With text selected, press <b>Cmd</b> or <b>Ctrl + K</b> for inline code.' },

	{ style: I.TextStyle.Header2, text: 'Markdown' },
	{ text: 'At the beginning of any new line or existing block of content, try to type any of these options:' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>*</b>, <b>-</b>, or <b>+</b> followed by <b>space</b> to create a bulleted list.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>[]</b> to create a to-do checkbox.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>1.</b> followed by <b>space</b> to create a numbered list.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>#</b> followed by <b>space</b> to create an H1 heading.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>##</b> followed by <b>space</b> to create an H2 sub-heading.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>###</b> followed by <b>space</b> to create an H3 sub-heading.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>">"</b> followed by <b>space</b> to create a toggle list.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>"</b> followed by <b>space</b> to create a quote block.' },
	{ style: I.TextStyle.Bulleted, text: 'Type <b>```</b> followed by <b>space</b> to create a code block.' },

	{ style: I.TextStyle.Header2, text: 'Commands' },
	{ style: I.TextStyle.Bulleted, text: 'Write command <b>/image</b> will bring up the <b>Option</b> or <b>Alt</b> to upload an image.' },
	{ style: I.TextStyle.Bulleted, text: 'Write command <b>/video</b> lets you upload a video file.' },
	{ style: I.TextStyle.Bulleted, text: 'Write command <b>/file</b> lets you upload any file from your computer.' },
	{ style: I.TextStyle.Bulleted, text: 'Write command <b>/code</b> creates a code block where you can write a snippet of code.' },
];
