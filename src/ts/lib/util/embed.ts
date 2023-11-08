import { I, UtilCommon } from 'Lib';

class UtilEmbed {

	getHtml (processor: I.EmbedProcessor, content: any): string {
		const fn = UtilCommon.toCamelCase(`get-${I.EmbedProcessor[processor]}-html`)
		return this[fn] ? this[fn](content) : '';
	};

	getYoutubeHtml (content: string): string {
		return `<iframe width="560" height="315" src="${content}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
	};

	getVimeoHtml (content: string): string {
		return `<iframe src="${content}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
	};

};

export default new UtilEmbed();