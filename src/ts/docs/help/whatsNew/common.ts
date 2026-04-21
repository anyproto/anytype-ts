import * as I from 'Interface';

export type Block =
	| { style: I.TextStyle; text: string; align?: I.BlockHAlign; icon?: string; items?: Block[] }
	| { type: I.BlockType; style?: I.DivStyle; icon?: string };

export type Helpers = {
	cmd: string;
	alt: string;
	shift: string;
	hl: (t: string) => string;
	block: (style: I.TextStyle, text: string, align?: I.BlockHAlign, icon?: string) => Block;
	title: (t: string, align?: I.BlockHAlign) => Block;
	h1: (t: string, align?: I.BlockHAlign) => Block;
	h2: (t: string, align?: I.BlockHAlign) => Block;
	h3: (t: string, align?: I.BlockHAlign) => Block;
	h4: (t: string, align?: I.BlockHAlign) => Block;
	text: (t: string) => Block;
	callout: (t: string, icon: string) => Block;
	bullet: (t: string) => Block;
	caption: (t: string) => Block;
	div: () => Block;
	icon: (emoji: string) => Block;
	toggle: (title: string, items: Block[]) => Block;
	video: (src: string, c?: string) => Block;
	img: (src: string, c?: string) => Block;
	link: (url: string, t: string) => string;
};

export const createHelpers = (): Helpers => {
	const version = U.Common.getElectron().version?.app;
	const cmd = keyboard.cmdSymbol();
	const alt = keyboard.altSymbol();
	const shift = keyboard.shiftSymbol();
	const hl = (t: string) => `<span class="highlight">${t}</span>`;
	const block = (style: I.TextStyle, text: string, align?: I.BlockHAlign, icon?: string): Block => ({ style, text, align, icon });
	const title = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Title, t, align);
	const h1 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header1, t, align);
	const h2 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header2, t, align);
	const h3 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header3, t, align);
	const h4 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header4, t, align);
	const text = (t: string) => block(I.TextStyle.Paragraph, t);
	const callout = (t: string, icon: string) => block(I.TextStyle.Callout, t, I.BlockHAlign.Left, icon);
	const bullet = (t: string) => block(I.TextStyle.Bulleted, t);
	const caption = (t: string) => block(I.TextStyle.Paragraph, `<i>${t}</i>`, I.BlockHAlign.Center);
	const div = (): Block => ({ type: I.BlockType.Div, style: I.DivStyle.Dot });
	const icon = (emoji: string): Block => ({ type: I.BlockType.IconPage, icon: emoji });
	const toggle = (title: string, items: Block[]): Block => ({ style: I.TextStyle.Toggle, text: title, items });
	const video = (src: string, c?: string) => text(`<video src="${J.Url.cdn}/img/help/${src}?v=${version}" loop autoplay class="full ${c || ''}" />`);
	const img = (src: string, c?: string) => text(`<img src="${J.Url.cdn}/img/help/${src}?v=${version}" class="full ${c || ''}" />`);
	const link = (url: string, t: string) => `<a href="${url}">${t}</a>`;
	return { cmd, alt, shift, hl, block, title, h1, h2, h3, h4, text, callout, bullet, caption, div, icon, toggle, video, img, link };
};
