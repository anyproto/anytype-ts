import { describe, it, expect } from 'vitest';
import UtilEmbed from './embed';
import * as I from 'Interface';

describe('UtilEmbed', () => {

	describe('getProcessorByUrl', () => {
		it('should detect YouTube URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(I.EmbedProcessor.Youtube);
			expect(UtilEmbed.getProcessorByUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(I.EmbedProcessor.Youtube);
		});

		it('should reject YouTube channel URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.youtube.com/@channel')).toBeNull();
		});

		it('should reject YouTube hashtag URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.youtube.com/hashtag/music')).toBeNull();
		});

		it('should detect Vimeo URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://vimeo.com/123456789')).toBe(I.EmbedProcessor.Vimeo);
		});

		it('should detect Miro URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://miro.com/app/board/abc123')).toBe(I.EmbedProcessor.Miro);
		});

		it('should detect Figma URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.figma.com/file/abc123')).toBe(I.EmbedProcessor.Figma);
		});

		it('should detect Spotify URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://open.spotify.com/track/123')).toBe(I.EmbedProcessor.Spotify);
		});

		it('should detect GitHub Gist URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://gist.github.com/user/abc123')).toBe(I.EmbedProcessor.GithubGist);
		});

		it('should detect Codepen URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://codepen.io/user/pen/abc123')).toBe(I.EmbedProcessor.Codepen);
		});

		it('should detect Bilibili video URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.bilibili.com/video/BV1xx411c7mD')).toBe(I.EmbedProcessor.Bilibili);
		});

		it('should reject non-video Bilibili URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.bilibili.com/anime/timeline')).toBeNull();
		});

		it('should detect Sketchfab URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://sketchfab.com/3d-models/test-abc123')).toBe(I.EmbedProcessor.Sketchfab);
		});

		it('should detect Apple Music URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://music.apple.com/us/album/something')).toBe(I.EmbedProcessor.AppleMusic);
		});

		it('should return null for unknown URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://example.com')).toBeNull();
		});
	});

	describe('getYoutubePath', () => {
		it('should extract video ID from standard URL', () => {
			expect(UtilEmbed.getYoutubePath('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		});

		it('should extract video ID from short URL', () => {
			expect(UtilEmbed.getYoutubePath('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		});

		it('should extract video ID from embed URL', () => {
			expect(UtilEmbed.getYoutubePath('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		});

		it('should include start time parameter', () => {
			expect(UtilEmbed.getYoutubePath('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')).toBe('dQw4w9WgXcQ?start=120');
		});

		it('should handle shorts URLs', () => {
			const result = UtilEmbed.getYoutubePath('https://www.youtube.com/shorts/dQw4w9WgXcQ');

			expect(result).toBe('dQw4w9WgXcQ');
		});

		it('should return empty string for invalid URL', () => {
			expect(UtilEmbed.getYoutubePath('https://example.com')).toBe('');
		});
	});

	describe('getHtml', () => {
		it('should return iframe for Vimeo', () => {
			const html = UtilEmbed.getVimeoHtml('https://player.vimeo.com/video/123');

			expect(html).toContain('<iframe');
			expect(html).toContain('https://player.vimeo.com/video/123');
		});

		it('should return iframe for Google Maps', () => {
			const html = UtilEmbed.getGoogleMapsHtml('https://maps.google.com/embed');

			expect(html).toContain('<iframe');
		});

		it('should return img tag for Image processor', () => {
			const html = UtilEmbed.getImageHtml('https://example.com/image.png');

			expect(html).toContain('<img');
			expect(html).toContain('https://example.com/image.png');
		});
	});

	describe('getLang', () => {
		it('should return latex for Latex processor', () => {
			expect(UtilEmbed.getLang(I.EmbedProcessor.Latex)).toBe('latex');
		});

		it('should return yaml for Mermaid processor', () => {
			expect(UtilEmbed.getLang(I.EmbedProcessor.Mermaid)).toBe('yaml');
		});

		it('should return html as default', () => {
			expect(UtilEmbed.getLang(I.EmbedProcessor.Youtube)).toBe('html');
		});
	});

	describe('allowPresentation', () => {
		it('should allow for YouTube', () => {
			expect(UtilEmbed.allowPresentation(I.EmbedProcessor.Youtube)).toBe(true);
		});

		it('should not allow for Latex', () => {
			expect(UtilEmbed.allowPresentation(I.EmbedProcessor.Latex)).toBe(false);
		});
	});

	describe('allowEmbedUrl', () => {
		it('should allow for YouTube', () => {
			expect(UtilEmbed.allowEmbedUrl(I.EmbedProcessor.Youtube)).toBe(true);
		});

		it('should allow for Figma', () => {
			expect(UtilEmbed.allowEmbedUrl(I.EmbedProcessor.Figma)).toBe(true);
		});

		it('should not allow for Latex', () => {
			expect(UtilEmbed.allowEmbedUrl(I.EmbedProcessor.Latex)).toBe(false);
		});
	});

	describe('getKrokiOptions', () => {
		it('should return array of kroki diagram types', () => {
			const options = UtilEmbed.getKrokiOptions();

			expect(Array.isArray(options)).toBe(true);
			expect(options.length).toBeGreaterThan(0);
			expect(options[0]).toHaveProperty('id');
			expect(options[0]).toHaveProperty('name');
		});

		it('should include mermaid and graphviz', () => {
			const options = UtilEmbed.getKrokiOptions();
			const ids = options.map(o => o.id);

			expect(ids).toContain('mermaid');
			expect(ids).toContain('graphviz');
		});
	});

	describe('getKrokiType', () => {
		it('should match diagram type from string', () => {
			expect(UtilEmbed.getKrokiType('graphviz')).toBe('graphviz');
			expect(UtilEmbed.getKrokiType('mermaid')).toBe('mermaid');
		});

		it('should return empty string for unknown type', () => {
			expect(UtilEmbed.getKrokiType('unknown')).toBe('');
		});
	});

	describe('allowBlockResize', () => {
		it('should return true for most processors', () => {
			expect(UtilEmbed.allowBlockResize(I.EmbedProcessor.Youtube)).toBe(true);
			expect(UtilEmbed.allowBlockResize(I.EmbedProcessor.Mermaid)).toBe(true);
		});

		it('should return false for Latex', () => {
			expect(UtilEmbed.allowBlockResize(I.EmbedProcessor.Latex)).toBe(false);
		});
	});

	describe('allowAutoRender', () => {
		it('should return true for Latex', () => {
			expect(UtilEmbed.allowAutoRender(I.EmbedProcessor.Latex)).toBe(true);
		});

		it('should return true for Twitter', () => {
			expect(UtilEmbed.allowAutoRender(I.EmbedProcessor.Twitter)).toBe(true);
		});

		it('should return false for YouTube', () => {
			expect(UtilEmbed.allowAutoRender(I.EmbedProcessor.Youtube)).toBe(false);
		});
	});

	describe('allowIframeResize', () => {
		it('should return true for Twitter', () => {
			expect(UtilEmbed.allowIframeResize(I.EmbedProcessor.Twitter)).toBe(true);
		});

		it('should return true for Spotify', () => {
			expect(UtilEmbed.allowIframeResize(I.EmbedProcessor.Spotify)).toBe(true);
		});

		it('should return false for YouTube', () => {
			expect(UtilEmbed.allowIframeResize(I.EmbedProcessor.Youtube)).toBe(false);
		});
	});

	describe('allowJs', () => {
		it('should return true for Chart', () => {
			expect(UtilEmbed.allowJs(I.EmbedProcessor.Chart)).toBe(true);
		});

		it('should return false for others', () => {
			expect(UtilEmbed.allowJs(I.EmbedProcessor.Youtube)).toBe(false);
		});
	});

	describe('insertBeforeLoad', () => {
		it('should return true for Twitter', () => {
			expect(UtilEmbed.insertBeforeLoad(I.EmbedProcessor.Twitter)).toBe(true);
		});

		it('should return false for YouTube', () => {
			expect(UtilEmbed.insertBeforeLoad(I.EmbedProcessor.Youtube)).toBe(false);
		});
	});

	describe('useRootHeight', () => {
		it('should return true for Telegram', () => {
			expect(UtilEmbed.useRootHeight(I.EmbedProcessor.Telegram)).toBe(true);
		});

		it('should return true for Spotify', () => {
			expect(UtilEmbed.useRootHeight(I.EmbedProcessor.Spotify)).toBe(true);
		});

		it('should return false for YouTube', () => {
			expect(UtilEmbed.useRootHeight(I.EmbedProcessor.Youtube)).toBe(false);
		});
	});

	describe('allowEmptyContent', () => {
		it('should return true for Excalidraw', () => {
			expect(UtilEmbed.allowEmptyContent(I.EmbedProcessor.Excalidraw)).toBe(true);
		});

		it('should return false for others', () => {
			expect(UtilEmbed.allowEmptyContent(I.EmbedProcessor.Youtube)).toBe(false);
		});
	});

	describe('getProcessorByUrl additional', () => {
		it('should detect Bandcamp URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://artist.bandcamp.com/track/song')).toBe(I.EmbedProcessor.Bandcamp);
		});

		it('should detect Telegram URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://t.me/channel/123')).toBe(I.EmbedProcessor.Telegram);
		});

		it('should detect Drawio URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://viewer.diagrams.net/?edit=abc')).toBe(I.EmbedProcessor.Drawio);
		});

		it('should detect youtube-nocookie URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(I.EmbedProcessor.Youtube);
		});

		it('should detect Kroki URLs', () => {
			expect(UtilEmbed.getProcessorByUrl('https://kroki.io/graphviz/svg/abc')).toBe(I.EmbedProcessor.Kroki);
		});
	});

	describe('getHtml additional', () => {
		it('should return script tag for GithubGist', () => {
			const html = UtilEmbed.getGithubGistHtml('https://gist.github.com/user/abc');

			expect(html).toContain('<script');
			expect(html).toContain('.js');
		});

		it('should return iframe for Spotify', () => {
			const html = UtilEmbed.getSpotifyHtml('https://open.spotify.com/embed/track/123');

			expect(html).toContain('<iframe');
			expect(html).toContain('autoplay');
		});

		it('should handle Drawio SVG content', () => {
			const html = UtilEmbed.getDrawioHtml('<svg>test</svg>');

			expect(html).toBe('<svg>test</svg>');
		});

		it('should handle Drawio URL content', () => {
			const html = UtilEmbed.getDrawioHtml('https://viewer.diagrams.net/?edit=abc');

			expect(html).toContain('<iframe');
		});
	});

});
