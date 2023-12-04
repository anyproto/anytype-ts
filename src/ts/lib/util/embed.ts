import { I, UtilCommon } from 'Lib';

const DOMAINS: any  = {};
DOMAINS[I.EmbedProcessor.Youtube] = [ 'youtube.com', 'youtu.be' ];
DOMAINS[I.EmbedProcessor.Vimeo] = [ 'vimeo.com' ];
DOMAINS[I.EmbedProcessor.GoogleMaps] = [ 'google.com' ];
DOMAINS[I.EmbedProcessor.Miro] = [ 'miro.com' ];
DOMAINS[I.EmbedProcessor.Miro] = [ 'figma.com' ];

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

	getMiroHtml (content: string): string {
		return `<iframe src="${content}" width="640" height="360" frameborder="0" scrolling="no" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen></iframe>`;
	};

	getFigmaHtml (content: string): string {
		return `<iframe src="${content}" width="640" height="360" allowfullscreen></iframe>`;
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

			case I.EmbedProcessor.GoogleMaps: {
				const coords = /\@([0-9\.\,\-a-zA-Z]*)/.exec(url);

				if (coords && coords[1]) {
					const latlng = coords[1].split(',');
					const zoom = parseFloat(latlng[2].replace('z', ''));
					const zoomParam = 591657550.500000 / Math.pow(2, zoom);

					url = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${zoomParam}!2d${latlng[1]}!3d${latlng[0]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1486486434098`;
				};
				break;
			};

			case I.EmbedProcessor.Miro: {
				url = url.split('?')[0];
				url = url.replace(/\/board\/?\??/, '/live-embed/');
			};

			case I.EmbedProcessor.Figma: {
				url = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
			};
		};

		return url;
	};

};

export default new UtilEmbed();
