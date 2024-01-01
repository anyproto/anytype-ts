import { I, UtilCommon } from 'Lib';
import Constant from 'json/constant.json';

const DOMAINS: any  = {};
DOMAINS[I.EmbedProcessor.Youtube] = [ 'youtube.com', 'youtu.be' ];
DOMAINS[I.EmbedProcessor.Vimeo] = [ 'vimeo.com' ];
DOMAINS[I.EmbedProcessor.GoogleMaps] = [ 'google.[^\/]+/maps' ];
DOMAINS[I.EmbedProcessor.Miro] = [ 'miro.com' ];
DOMAINS[I.EmbedProcessor.Figma] = [ 'figma.com' ];
DOMAINS[I.EmbedProcessor.OpenStreetMap] = [ 'openstreetmap.org\/\#map' ];
DOMAINS[I.EmbedProcessor.Telegram] = [ 't.me' ];

const IFRAME_PARAM = 'frameborder="0" scrolling="no" allowfullscreen';

class UtilEmbed {

	getHtml (processor: I.EmbedProcessor, content: any): string {
		const fn = UtilCommon.toCamelCase(`get-${I.EmbedProcessor[processor]}-html`)
		return this[fn] ? this[fn](content) : '';
	};

	getYoutubeHtml (content: string): string {
		return `<iframe src="${content}"  ${IFRAME_PARAM} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>`;
	};

	getVimeoHtml (content: string): string {
		return `<iframe src="${content}"  ${IFRAME_PARAM} allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
	};

	getGoogleMapsHtml (content: string): string {
		return `<iframe src="${content}" ${IFRAME_PARAM} loading="lazy"></iframe>`;
	};

	getMiroHtml (content: string): string {
		return `<iframe src="${content}" ${IFRAME_PARAM} allow="fullscreen; clipboard-read; clipboard-write"></iframe>`;
	};

	getFigmaHtml (content: string): string {
		return `<iframe src="${content}" ${IFRAME_PARAM}></iframe>`;
	};

	getOpenStreetMapHtml (content: string): string {
		return `<iframe src="${content}" ${IFRAME_PARAM}></iframe>`;
	};

	getTelegramHtml (content: string): string {
		const post = content.replace(/^https:\/\/t.me\//, '');
		return `<script async src="https://telegram.org/js/telegram-widget.js?22" data-telegram-post="${post}" data-width="100%"></script>`;
	};

	getGithubGistHtml (content: string): string {
		return `<script src="${content}.js"></script>`;
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
				url = `https://www.youtube.com/embed/${this.getYoutubeId(url)}`;
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

					delete(search.center);

					endpoint = 'place';
				};

				url = `https://www.google.com/maps/embed/v1/${endpoint}?${new URLSearchParams(search).toString()}`;
				break;
			};

			case I.EmbedProcessor.Miro: {
				const a = url.split('?');
				if (a.length) {
					url = a[0].replace(/\/board\/?\??/, '/live-embed/');
				};
				break;
			};

			case I.EmbedProcessor.Figma: {
				url = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
				break;
			};

			case I.EmbedProcessor.OpenStreetMap: {
				const coords = url.match(/#map=([-0-9\.\/]+)/);

				if (coords && coords.length) {
					const [ zoom, lat, lon ] = coords[1].split('/');
					url = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent([ lon, lat, lon, lat ].join(','))}&amp;layer=mapnik`;
				};
				break;
			};

		};

		return url;
	};

	getYoutubeId (url: string): string {
		const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
		return (m && m[2].length) ? m[2] : '';
	};

	getEnvironmentContent (processor: I.EmbedProcessor): { html: string; libs: string[]} {
		const libs = [];

		let html = '';
		switch (processor) {
			case I.EmbedProcessor.Chart: {
				html = `<canvas id="chart"></canvas>`;
				libs.push('https://cdn.jsdelivr.net/npm/chart.js');
				break;
			};

			case I.EmbedProcessor.Twitter: {
				libs.push('https://platform.twitter.com/widgets.js');
				break;
			};

			case I.EmbedProcessor.Reddit: {
				libs.push('https://embed.reddit.com/widgets.js');
				break;
			};

			case I.EmbedProcessor.Instagram: {
				libs.push('https://www.instagram.com/embed.js');
				break;
			};
		};

		return { 
			html, 
			libs, 
		};
	};

	getLang (processor: I.EmbedProcessor) {
		switch (processor) {
			default: return 'html';
			case I.EmbedProcessor.Latex: return 'latex';
			case I.EmbedProcessor.Mermaid: return 'yaml';
			case I.EmbedProcessor.Chart: return 'js';
		};
	};

	allowSameOrigin (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Youtube, 
			I.EmbedProcessor.Vimeo, 
			I.EmbedProcessor.Soundcloud, 
			I.EmbedProcessor.GoogleMaps, 
			I.EmbedProcessor.Miro, 
			I.EmbedProcessor.Figma,
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.Telegram,
		].includes(p);
	};

	allowPresentation (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Youtube, 
			I.EmbedProcessor.Vimeo,
		].includes(p);
	};

	allowEmbedUrl (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Youtube, 
			I.EmbedProcessor.Vimeo, 
			I.EmbedProcessor.GoogleMaps, 
			I.EmbedProcessor.Miro, 
			I.EmbedProcessor.Figma,
			I.EmbedProcessor.OpenStreetMap,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.GithubGist,
		].includes(p);
	};

	allowJs (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Chart,
		].includes(p);
	};

	allowPopup (p: I.EmbedProcessor) {
		return [].includes(p);
	};

	allowBlockResize (p: I.EmbedProcessor) {
		return ![ I.EmbedProcessor.Latex, I.EmbedProcessor.Mermaid, I.EmbedProcessor.Chart ].includes(p);
	};

	allowIframeResize (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Facebook,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.GithubGist,
		].includes(p);
	};

	allowScroll (p: I.EmbedProcessor) {
		return ![ 
			I.EmbedProcessor.Latex,
		].includes(p);
	};

	allowAutoRender (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Latex,
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Facebook,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.GithubGist,
		].includes(p);
	};

	insertBeforeLoad (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Instagram,
		].includes(p);
	};

	useRootHeight (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.GithubGist,
		].includes(p);
	};

};

export default new UtilEmbed();
