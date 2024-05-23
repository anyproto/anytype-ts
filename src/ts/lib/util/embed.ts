import { I, UtilCommon } from 'Lib';
const Constant = require('json/constant.json');

const DOMAINS: any = {};
DOMAINS[I.EmbedProcessor.Youtube] = [ 'youtube.com', 'youtu.be' ];
DOMAINS[I.EmbedProcessor.Vimeo] = [ 'vimeo.com' ];
DOMAINS[I.EmbedProcessor.GoogleMaps] = [ 'google.[^\/]+/maps' ];
DOMAINS[I.EmbedProcessor.Miro] = [ 'miro.com' ];
DOMAINS[I.EmbedProcessor.Figma] = [ 'figma.com' ];
DOMAINS[I.EmbedProcessor.OpenStreetMap] = [ 'openstreetmap.org\/\#map' ];
DOMAINS[I.EmbedProcessor.Telegram] = [ 't.me' ];
DOMAINS[I.EmbedProcessor.Codepen] = [ 'codepen.io' ];
DOMAINS[I.EmbedProcessor.Bilibili] = [ 'bilibili.com', 'b23.tv'];
DOMAINS[I.EmbedProcessor.Kroki] = [ 'kroki.io' ];
DOMAINS[I.EmbedProcessor.GithubGist] = [ 'gist.github.com' ];
DOMAINS[I.EmbedProcessor.Sketchfab] = [ 'sketchfab.com' ];

const IFRAME_PARAM = 'frameborder="0" scrolling="no" allowfullscreen';

class UtilEmbed {

	getHtml (processor: I.EmbedProcessor, content: any): string {
		const fn = UtilCommon.toCamelCase(`get-${I.EmbedProcessor[processor]}-html`);
		return this[fn] ? this[fn](content) : content;
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

	getGithubGistHtml (content: string): string {
		return `<script src="${content}.js"></script>`;
	};

	getCodepenHtml (content: string): string {
		let p = [];

		try {
			const a = new URL(content);

			p = a.pathname.split('/');
		} catch (e) { /**/ };
		
		if (!p.length) {
			return '';
		};

		return `<p class="codepen" data-height="300" data-default-tab="html,result" data-slug-hash="${p[3]}" data-user="${p[1]}"></p>`;
	};

	getBilibiliHtml (content: string): string {
		return `<iframe src="${content}" ${IFRAME_PARAM}></iframe>`;
	};

	getKrokiHtml (content: string): string {
		return `<img src="${content}" />`;
	};

	getSketchfabHtml (content: string): string {
		return `<iframe src="${content}" ${IFRAME_PARAM}></iframe>`;
	};

	getProcessorByUrl (url: string): I.EmbedProcessor {
		let p = null;
		for (const i in DOMAINS) {
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
				url = `https://www.youtube.com/embed/${this.getYoutubePath(url)}`;
				break;
			};

			case I.EmbedProcessor.Vimeo: {
				try {
					const a = new URL(url);
					url = `https://player.vimeo.com/video${a.pathname}`;
				} catch (e) { /**/ };
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

			case I.EmbedProcessor.Bilibili: {
				let pathname = '';
				let searchParam: any = null;

				try {
					const a = new URL(url);

					pathname = a.pathname;
					searchParam = a.searchParams;
				} catch (e) { /**/ };

				if (!pathname) {
					break;
				};

				const a = pathname.split('/');
				if (a.length < 3) {
					return;
				};

				const bvid = pathname.split('/')[2];
				const [ p = 1, t = 0 ] = [ searchParam.get('p'), searchParam.get('t') ];

				if (bvid) {
					url = `https://player.bilibili.com/player.html?bvid=${bvid}&p=${p}&t=${t}&high_quality=1&autoplay=0`;
				};
				break;
			};

			case I.EmbedProcessor.Sketchfab: {
				const a = url.split('/');
				if (!a.length) {
					break;
				};

				const name = String(a[a.length - 1] || '').split('-');
				if (!name.length) {
					break;
				};

				const id = name[name.length - 1];
				if (!id) {
					break;
				};

				url = `https://sketchfab.com/models/${id}/embed`;
				break;
			};

			case I.EmbedProcessor.GithubGist: {
				const a = url.split('#');
				if (!a.length) {
					break;
				};

				url = a[0];
				break;
			};

		};

		return url;
	};

	getYoutubePath (url: string): string {
		const shortsReg = /\/shorts\//;

		if (shortsReg.test(url)) {
			url = url.replace(shortsReg, '/watch?v=');
		};

		const pm = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
		const tm = url.match(/(\?t=|&t=)(\d+)/);

		if (!pm || !pm[2].length) {
			return '';
		};

		return pm[2] + ((tm && tm[2].length) ? `?start=${tm[2]}` : '');
	};

	getLang (processor: I.EmbedProcessor) {
		switch (processor) {
			default: return 'html';
			case I.EmbedProcessor.Latex: return 'latex';
			case I.EmbedProcessor.Mermaid: return 'yaml';
			case I.EmbedProcessor.Chart: return 'js';
			case I.EmbedProcessor.Kroki:
			case I.EmbedProcessor.Graphviz: return 'dot';
		};
	};

	getKrokiOptions () {
		return [
			{ id: 'blockdiag', name: 'BlockDiag' },
			{ id: 'bpmn', name: 'BPMN' },
			{ id: 'bytefield', name: 'Bytefield' },
			{ id: 'seqdiag', name: 'SeqDiag' },
			{ id: 'actdiag', name: 'ActDiag' },
			{ id: 'nwdiag', name: 'NwDiag' },
			{ id: 'packetdiag', name: 'PacketDiag' },
			{ id: 'rackdiag', name: 'RackDiag' },
			{ id: 'c4plantuml', name: 'C4 with PlantUML' },
			{ id: 'd2', name: 'D2' },
			{ id: 'dbml', name: 'DBML' },
			{ id: 'ditaa', name: 'Ditaa' },
			{ id: 'erd', name: 'Erd' },
			{ id: 'excalidraw', name: 'Excalidraw' },
			{ id: 'graphviz', name: 'GraphViz' },
			{ id: 'mermaid', name: 'Mermaid' },
			{ id: 'nomnoml', name: 'Nomnoml' },
			{ id: 'pikchr', name: 'Pikchr' },
			{ id: 'plantuml', name: 'PlantUML' },
			{ id: 'structurizr', name: 'Structurizr' },
			{ id: 'svgbob', name: 'Svgbob' },
			{ id: 'symbolator', name: 'Symbolator' },
			{ id: 'tikz', name: 'TikZ' },
			{ id: 'umlet', name: 'UMlet' },
			{ id: 'vega', name: 'Vega' },
			{ id: 'vegalite', name: 'Vega-Lite' },
			{ id: 'wavedrom', name: 'WaveDrom' },
			{ id: 'wireviz', name: 'WireViz' },
		];
	};

	getKrokiType (s: string): string {
		const options = this.getKrokiOptions();

		for (const option of options) {
			if (s.match(new RegExp(`^${option.id}`))) {
				return option.id;
			};
		};

		return '';
	};

	// Allow to use presentation mode in iframe sandbox
	allowPresentation (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Youtube, 
			I.EmbedProcessor.Vimeo,
			I.EmbedProcessor.Bilibili
		].includes(p);
	};

	// Allow url embedding
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
			I.EmbedProcessor.Codepen,
			I.EmbedProcessor.Bilibili,
			I.EmbedProcessor.Kroki,
			I.EmbedProcessor.Sketchfab,
		].includes(p);
	};

	// Pass block data as js code
	allowJs (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Chart,
		].includes(p);
	};

	// Allow to use popup mode in iframe sandbox
	allowPopup (p: I.EmbedProcessor) {
		return [ I.EmbedProcessor.Bilibili ].includes(p);
	};

	// Allow block resizing
	allowBlockResize (p: I.EmbedProcessor) {
		return ![ 
			I.EmbedProcessor.Latex, 
		].includes(p);
	};

	// Use iframe height instead of fixed aspect ratio
	allowIframeResize (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Facebook,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.GithubGist,
			I.EmbedProcessor.Codepen,
			I.EmbedProcessor.Kroki,
			I.EmbedProcessor.Chart,
		].includes(p);
	};

	// Render blocks on mount
	allowAutoRender (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Latex,
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Facebook,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.GithubGist,
			I.EmbedProcessor.Codepen,
			I.EmbedProcessor.Bilibili,
			I.EmbedProcessor.Graphviz,
			I.EmbedProcessor.Kroki,
		].includes(p);
	};

	// Insert html content before loading libs
	insertBeforeLoad (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Reddit,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.Codepen,
		].includes(p);
	};

	// Use root height instead of iframe scroll height
	useRootHeight (p: I.EmbedProcessor) {
		return [ 
			I.EmbedProcessor.Twitter,
			I.EmbedProcessor.Telegram,
			I.EmbedProcessor.Instagram,
			I.EmbedProcessor.GithubGist,
			I.EmbedProcessor.Codepen,
			I.EmbedProcessor.Kroki,
			I.EmbedProcessor.Chart,
		].includes(p);
	};

};

export default new UtilEmbed();
