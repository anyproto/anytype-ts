import * as I from 'Interface';

export const createHelpers = () => {
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
	const h4 = (t: string, align?: I.BlockHAlign) => block(I.TextStyle.Header4, t, align);
	const text = (t: string) => block(I.TextStyle.Paragraph, t);
	const callout = (t: string, icon: string) => block(I.TextStyle.Callout, t, I.BlockHAlign.Left, icon);
	const bullet = (t: string) => block(I.TextStyle.Bulleted, t);
	const caption = (t: string) => block(I.TextStyle.Paragraph, `<i>${t}</i>`, I.BlockHAlign.Center);
	const div = () => ({ type: I.BlockType.Div, style: I.DivStyle.Dot });
	const video = (src: string, c?: string) => text(`<video src="${J.Url.cdn}/img/help/${src}?v=${version}" loop autoplay class="full ${c || ''}" />`);
	const img = (src: string, c?: string) => text(`<img src="${J.Url.cdn}/img/help/${src}?v=${version}" class="full ${c || ''}" />`);
	const link = (url: string, t: string) => `<a href="${url}">${t}</a>`;
	return { cmd, alt, shift, hl, block, title, h1, h2, h3, h4, text, callout, bullet, caption, div, video, img, link };
};

export type Helpers = ReturnType<typeof createHelpers>;
