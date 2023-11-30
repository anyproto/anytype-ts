import { I, UtilCommon } from 'Lib';

const DOMAINS: any  = {};
DOMAINS[I.EmbedProcessor.Youtube] = [ 'youtube.com', 'youtu.be' ];
DOMAINS[I.EmbedProcessor.Vimeo] = [ 'vimeo.com' ];

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

	getGoogleMapsHtml (content: string): string {
		return `<iframe src="${content}" width="640" height="360" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
	};

	getProcessorByUrl (url: string): I.EmbedProcessor {
		let p = null;
		for (let i in DOMAINS) {
			const reg = new RegExp(DOMAINS[i].join('|'), 'gi');
			if (url.match(reg)) {
				p = Number(i);
				break;
			};
		};
		return p;
	};

	getParsedUrl (url: string): string {
		const processor = this.getProcessorByUrl(url);

		switch (processor) {
			case I.EmbedProcessor.Youtube: {
				url = url.replace(/\/watch\/?\??/, '/embed/');
				url = url.replace('v=', '');
				break;
			};

			case I.EmbedProcessor.Vimeo: {
				const a = new URL(url);
				url = `https://player.vimeo.com/video${a.pathname}`;
				break;
			};
		};

		return url;
	};

};

export default new UtilEmbed();
