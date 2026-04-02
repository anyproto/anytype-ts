import { vi } from 'vitest';

// Mock window globals for browser/Electron environment
if (typeof globalThis.window === 'undefined') {
	(globalThis as any).window = {};
};

(globalThis as any).window.Electron = {};
(globalThis as any).window.AnytypeGlobalConfig = {};
(globalThis as any).window.getSelection = () => ({});


// Mock raf
vi.mock('raf', () => ({
	default: (cb: any) => setTimeout(cb, 0),
}));

// Mock selection-ranges
vi.mock('selection-ranges', () => ({
	setRange: () => {},
	getRange: () => ({}),
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
	default: { sanitize: (s: string) => s },
}));

// Mock blueimp-load-image
vi.mock('blueimp-load-image', () => ({
	default: { parseMetaData: () => {} },
}));

// Mock libphonenumber-js
vi.mock('libphonenumber-js', () => ({
	default: () => null,
}));

// Mock slugify
vi.mock('@sindresorhus/slugify', () => ({
	default: (s: string) => s.toLowerCase().replace(/\s+/g, '-'),
}));

// Mock the Lib barrel export to avoid pulling in protobuf/gRPC/stores
vi.mock('Lib', () => {
	const I = {
		MarkType: {
			Strike: 0, Code: 1, Italic: 2, Bold: 3, Underline: 4, Link: 5,
			Color: 6, BgColor: 7, Mention: 8, Emoji: 9, Object: 10, Latex: 11,
			Change: 100, Highlight: 101, Search: 102,
			0: 'Strike', 1: 'Code', 2: 'Italic', 3: 'Bold', 4: 'Underline', 5: 'Link',
			6: 'Color', 7: 'BgColor', 8: 'Mention', 9: 'Emoji', 10: 'Object', 11: 'Latex',
			100: 'Change', 101: 'Highlight', 102: 'Search',
		},
		MarkOverlap: {
			Equal: 0, Outer: 1, Inner: 2, InnerLeft: 3, InnerRight: 4,
			Left: 5, Right: 6, Before: 7, After: 8,
		},
		DateFormat: {
			MonthAbbrBeforeDay: 0, MonthAbbrAfterDay: 1, Short: 2, ShortUS: 3,
			ISO: 4, Long: 5, Nordic: 6, European: 7, Default: 8,
		},
		TimeFormat: { H12: 0, H24: 1 },
		ObjectLayout: {
			Page: 0, Human: 1, Task: 2, Set: 3, Type: 4, Relation: 5, File: 6,
			Dashboard: 7, Image: 8, Note: 9, Space: 10, Bookmark: 11, OptionList: 12,
			Option: 13, Collection: 14, Audio: 15, Video: 16, Date: 17, SpaceView: 18,
			Participant: 19, Pdf: 20, ChatOld: 21, Chat: 22, Discussion: 27,
			Empty: 100, Navigation: 101, Graph: 102, History: 103, Archive: 104,
			Block: 105, Settings: 106,
		},
		CommentTargetType: { Object: 0, Block: 1 },
		BlockType: {
			Empty: '', Page: 'page', Dataview: 'dataview', Layout: 'layout', Text: 'text',
			File: 'file', Bookmark: 'bookmark', IconPage: 'iconPage', IconUser: 'iconUser',
			Div: 'div', Link: 'link', Cover: 'cover', Relation: 'relation', Featured: 'featured',
			Embed: 'latex', Table: 'table', TableColumn: 'tableColumn', TableRow: 'tableRow',
			TableOfContents: 'tableOfContents', Widget: 'widget', Chat: 'chat',
		},
		BlockHAlign: { Left: 0, Center: 1, Right: 2, Justify: 3 },
		BlockVAlign: { Top: 0, Middle: 1, Bottom: 2 },
		TextStyle: {
			Paragraph: 0, Header1: 1, Header2: 2, Header3: 3, Header4: 4,
			Quote: 5, Code: 6, Title: 7, Checkbox: 8, Bulleted: 9,
			Numbered: 10, Toggle: 11, Description: 12, Callout: 13,
			ToggleHeader1: 14, ToggleHeader2: 15, ToggleHeader3: 16,
		},
		FileType: { None: 0, File: 1, Image: 2, Video: 3, Audio: 4, Pdf: 5 },
		FileStyle: { Auto: 0, Link: 1, Embed: 2 },
		FileState: { Empty: 0, Uploading: 1, Done: 2, Error: 3 },
		LayoutStyle: { Row: 0, Column: 1, Div: 2, Header: 3, TableRows: 4, TableColumns: 5 },
		WidgetLayout: { Link: 0, Tree: 1, List: 2, Compact: 3 },
		CardSize: { Small: 0, Medium: 1, Large: 2 },
		ListSize: { Compact: 0, Full: 1 },
		ViewType: { Grid: 0, List: 1, Gallery: 2, Board: 3, Calendar: 4, Graph: 5, Timeline: 6 },
		SortType: { Asc: 0, Desc: 1, Custom: 2 },
		DivStyle: { Line: 0, Dot: 1 },
		WidgetSection: { Pin: 0, Favorite: 1 },
		LinkIconSize: { None: 0, Small: 1, Medium: 2 },
		LinkCardStyle: { Text: 0, Card: 1, Inline: 2 },
		LinkDescription: { None: 0, Added: 1, Content: 2 },
		BookmarkState: { Empty: 0, Fetching: 1, Done: 2, Error: 3 },
		EmbedAlign: { Left: 0, Center: 1, Right: 2 },
		FilterOperator: { None: 0, Or: 1, And: 2 },
		FilterCondition: { None: 0, Equal: 1, NotEqual: 2, Greater: 3, Less: 4 },
		FilterQuickOption: { ExactDate: 0, Yesterday: 1, Today: 2, Tomorrow: 3 },
		EmptyType: { None: 0, Start: 1, End: 2 },
		RelationType: {
			LongText: 0, ShortText: 1, Number: 2, Select: 3, Date: 4, File: 5,
			Checkbox: 6, Url: 7, Email: 8, Phone: 9, MultiSelect: 11, Object: 100,
			0: 'LongText', 1: 'ShortText', 2: 'Number', 3: 'Select', 4: 'Date',
			5: 'File', 6: 'Checkbox', 7: 'Url', 8: 'Email', 9: 'Phone', 11: 'MultiSelect', 100: 'Object',
		},
		EmbedProcessor: {
			Latex: 0, Mermaid: 1, Chart: 2, Youtube: 3, Vimeo: 4, Soundcloud: 5,
			GoogleMaps: 6, Miro: 7, Figma: 8, Twitter: 9, OpenStreetMap: 10,
			Reddit: 11, Facebook: 12, Instagram: 13, Telegram: 14, GithubGist: 15,
			Codepen: 16, Bilibili: 17, Excalidraw: 18, Kroki: 19, Graphviz: 20,
			Sketchfab: 21, Image: 22, Drawio: 23, Spotify: 24, Bandcamp: 25, AppleMusic: 26,
			3: 'Youtube', 4: 'Vimeo', 6: 'GoogleMaps', 7: 'Miro', 8: 'Figma',
			10: 'OpenStreetMap', 14: 'Telegram', 15: 'GithubGist', 16: 'Codepen',
			17: 'Bilibili', 19: 'Kroki', 21: 'Sketchfab', 23: 'Drawio',
			24: 'Spotify', 25: 'Bandcamp', 26: 'AppleMusic',
		},
	};

	const translate = (key: string) => key;

	const U: any = {
		String: {
			regexEscape: (v: string) => String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
			sprintf: (...args: any[]) => {
				// minimal sprintf for %d
				const format = args[0];
				let i = 1;
				return format.replace(/%d/g, () => args[i++]);
			},
			toCamelCase: (str: string) => {
				if (!str) return '';
				return String(str || '').replace(/[_-\s]([a-zA-Z])/g, (_: any, char: string) => char.toUpperCase()).replace(/^[A-Z]/, (char: string) => char.toLowerCase());
			},
			shortMask: (s: string, n1: number, n2?: number) => {
				s = String(s || '');
				n2 = Number(n2) || n1;
				const l = s.length;
				if (l <= n1 + n2 + 3) return s;
				return s.substring(0, n1) + '...' + s.substring(l - n2);
			},
			matchUrl: () => '',
			matchEmail: () => '',
			matchDomain: () => '',
			matchPath: () => '',
			matchPhone: () => '',
			urlFix: (url: string) => url,
			fromHtmlSpecialChars: (s: string) => s,
			insert: (haystack: string, needle: string, start: number, end: number) => {
				haystack = String(haystack || '');
				return haystack.substring(0, start) + needle + haystack.substring(end);
			},
			cut: (haystack: string, start: number, end: number) => {
				return String(haystack || '').substring(0, start) + haystack.substring(end);
			},
		},
		Common: {
			objectCopy: (o: any) => JSON.parse(JSON.stringify(o ?? {})),
			objectLength: (o: any) => {
				o = o || {};
				return Object.prototype.hasOwnProperty.call(o, 'length') ? o.length : Object.keys(o).length;
			},
			hasProperty: (o: any, p: string) => Object.prototype.hasOwnProperty.call(o || {}, p),
			mapToArray: (list: any[], field: string) => {
				const map: any = {};
				for (const item of (list || [])) {
					map[item[field]] = map[item[field]] || [];
					map[item[field]].push(item);
				};
				return map;
			},
			unmap: (map: any) => {
				return Object.values(map).flat();
			},
			getKeyByValue: (o: any, v: any) => Object.keys(o || {}).find((k: string) => o[k] === v),
			formatNumber: (v: number) => String(v),
			arrayUnique: (a: any[]) => a.length >= 2 ? [...new Set(a)] : a,
			objectCompare: (o1: any, o2: any): boolean => {
				o1 = o1 || {};
				o2 = o2 || {};
				const k1 = Object.keys(o1).sort();
				const k2 = Object.keys(o2).sort();
				if (k1.length !== k2.length) return false;
				for (let i = 0; i < k1.length; i++) {
					if (k1[i] !== k2[i]) return false;
					const v1 = o1[k1[i]];
					const v2 = o2[k2[i]];
					if ((typeof v1 === 'object') && (typeof v2 === 'object')) {
						if (!U.Common.objectCompare(v1, v2)) return false;
					} else
					if (v1 !== v2) return false;
				};
				return true;
			},
			compareJSON: (o1: any, o2: any): boolean => JSON.stringify(o1) === JSON.stringify(o2),
			safeDecodeUri: (s: any) => {
				try { return decodeURIComponent(String(s || '')); } catch { return String(s || ''); }
			},
			searchParam: (search: string) => {
				const params: any = {};
				if (!search) return params;
				search.split('&').forEach(pair => {
					const [key, value] = pair.split('=');
					if (key) params[key] = value || '';
				});
				return params;
			},
			getElectron: () => ({}),
		},
		Date: {
			date: (format: string, timestamp: number) => {
				const d = new Date(timestamp * 1000);
				const pad = (n: number) => String(n).padStart(2, '0');
				return format.replace(/[a-zA-Z]/g, (s: string) => {
					switch (s) {
						case 'j': return String(d.getDate());
						case 'd': return pad(d.getDate());
						case 'n': return String(d.getMonth() + 1);
						case 'm': return pad(d.getMonth() + 1);
						case 'Y': return String(d.getFullYear());
						case 'H': return pad(d.getHours());
						case 'i': return pad(d.getMinutes());
						case 's': return pad(d.getSeconds());
						default: return s;
					}
				});
			},
		},
		Embed: {
			getProcessorByUrl: () => null,
		},
		Router: {
			getParam: (route: string) => {
				const parts = route.split('/');
				return { page: parts[0], action: parts[1], id: parts[2] };
			},
		},
	};

	const J = {
		Constant: {
			day: 86400,
			monthDays: { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 },
			fileExtension: {
				image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'heic', 'heif'],
				video: ['mp4', 'm4v', 'mov'],
				audio: ['mp3', 'm4a', 'flac', 'ogg', 'wav'],
				pdf: ['pdf'],
			},
			googleMaps: '',
		},
	};

	const S = {
		Common: {
			firstDay: 1,
			getThemePath: () => '',
		},
	};

	const Mark = {
		getTags: () => ({}),
	};

	const Relation = {
		getStringValue: (v: any) => String(v || ''),
	};

	const M = {
		ViewRelation: class { constructor(props: any) { Object.assign(this, props); } },
		Filter: class { constructor(props: any) { Object.assign(this, props); } },
		Sort: class { constructor(props: any) { Object.assign(this, props); } },
	};

	return { I, U, J, S, M, translate, Mark, Relation };
});

// Mock Component/selection/target (imported by common.ts)
vi.mock('Component/selection/target', () => ({
	default: {},
}));

// Mock json/text.json
vi.mock('json/text.json', () => ({
	default: {},
}));

// Mock dist/lib/ protobuf paths
vi.mock('Proto/pb/protos/commands', () => ({}));
vi.mock('Proto/pb/protos/events', () => ({}));
vi.mock('Proto/google/protobuf/struct', () => ({}));
vi.mock('dist/lib/json/locale.json', () => ({ default: {} }));
