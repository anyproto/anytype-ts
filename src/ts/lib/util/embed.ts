import { I, UtilCommon } from 'Lib';
import Constant from 'json/constant.json';

const DOMAINS: any  = {};
DOMAINS[I.EmbedProcessor.Youtube] = [ 'youtube.com', 'youtu.be' ];
DOMAINS[I.EmbedProcessor.Vimeo] = [ 'vimeo.com' ];
DOMAINS[I.EmbedProcessor.GoogleMaps] = [ 'google.com' ];
DOMAINS[I.EmbedProcessor.Miro] = [ 'miro.com' ];

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
				const place = url.match(/place\/([^\/]+)/);
				const param = url.match(/\/@([^\/\?]+)/);
				const search: any = {
					key: Constant.embed.googleMaps.key,
				};

				let endpoint = '';

				if (param && param[1]) {
					const [ lat, lon, zoom ] = param[1].split(',');

					search.center = [ lat, lon ].join(',');
					search.zoom = parseInt(zoom);

					endpoint = 'view';
				};

				if (place && place[1]) {
					search.q = place[1];
					endpoint = 'place';
				};

				url = `https://www.google.com/maps/embed/v1/${endpoint}?${new URLSearchParams(search).toString()}`;
				break;
			};

			case I.EmbedProcessor.Miro: {
				url = url.split('?')[0];
				url = url.replace(/\/board\/?\??/, '/live-embed/');
			};
		};

		return url;
	};

};

export default new UtilEmbed();
