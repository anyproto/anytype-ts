import { describe, it, expect } from 'vitest';
import UtilString from './string';

describe('UtilString', () => {

	describe('sprintf', () => {
		it('should format %s strings', () => {
			expect(UtilString.sprintf('Hello %s', 'world')).toBe('Hello world');
		});

		it('should format %d integers', () => {
			expect(UtilString.sprintf('%d items', 42)).toBe('42 items');
		});

		it('should format %f floats', () => {
			expect(UtilString.sprintf('%0.2f', 3.14159)).toBe('3.14');
		});

		it('should handle %% escape', () => {
			expect(UtilString.sprintf('100%%')).toBe('100%');
		});

		it('should handle multiple arguments', () => {
			expect(UtilString.sprintf('%s has %d items', 'list', 5)).toBe('list has 5 items');
		});

		it('should pad with zeros', () => {
			expect(UtilString.sprintf('%03d', 7)).toBe('007');
		});

		it('should handle hex format', () => {
			expect(UtilString.sprintf('%x', 255)).toBe('ff');
			expect(UtilString.sprintf('%X', 255)).toBe('FF');
		});
	});

	describe('toCamelCase', () => {
		it('should convert underscore-separated to camelCase', () => {
			expect(UtilString.toCamelCase('hello_world')).toBe('helloWorld');
		});

		it('should convert hyphen-separated to camelCase', () => {
			expect(UtilString.toCamelCase('hello-world')).toBe('helloWorld');
		});

		it('should convert space-separated to camelCase', () => {
			expect(UtilString.toCamelCase('hello world')).toBe('helloWorld');
		});

		it('should lowercase first character if uppercase', () => {
			expect(UtilString.toCamelCase('HelloWorld')).toBe('helloWorld');
		});

		it('should return empty string for falsy input', () => {
			expect(UtilString.toCamelCase('')).toBe('');
			expect(UtilString.toCamelCase(null as any)).toBe('');
		});

		it('should handle multiple separators', () => {
			expect(UtilString.toCamelCase('get-youtube-html')).toBe('getYoutubeHtml');
		});
	});

	describe('toUpperCamelCase', () => {
		it('should convert to UpperCamelCase', () => {
			expect(UtilString.toUpperCamelCase('hello_world')).toBe('HelloWorld');
		});

		it('should return empty string for falsy input', () => {
			expect(UtilString.toUpperCamelCase('')).toBe('');
		});
	});

	describe('fromCamelCase', () => {
		it('should convert camelCase to delimited string', () => {
			expect(UtilString.fromCamelCase('helloWorld', '-')).toBe('hello-world');
			expect(UtilString.fromCamelCase('helloWorld', '_')).toBe('hello_world');
		});

		it('should return empty string for falsy input', () => {
			expect(UtilString.fromCamelCase('', '-')).toBe('');
		});
	});

	describe('ucFirst', () => {
		it('should capitalize first letter and lowercase rest', () => {
			expect(UtilString.ucFirst('hello')).toBe('Hello');
			expect(UtilString.ucFirst('HELLO')).toBe('Hello');
		});

		it('should return empty string for falsy input', () => {
			expect(UtilString.ucFirst('')).toBe('');
		});
	});

	describe('cut', () => {
		it('should remove characters between start and end', () => {
			expect(UtilString.cut('abcdef', 2, 4)).toBe('abef');
		});

		it('should handle cutting from start', () => {
			expect(UtilString.cut('abcdef', 0, 3)).toBe('def');
		});
	});

	describe('insert', () => {
		it('should insert string at position', () => {
			expect(UtilString.insert('abef', 'cd', 2, 2)).toBe('abcdef');
		});

		it('should replace range with new string', () => {
			expect(UtilString.insert('abcdef', 'XY', 2, 4)).toBe('abXYef');
		});
	});

	describe('shorten', () => {
		it('should shorten long strings with ellipsis', () => {
			expect(UtilString.shorten('a very long string here', 10)).toBe('a very lon…');
		});

		it('should not shorten strings within limit', () => {
			expect(UtilString.shorten('short', 10)).toBe('short');
		});

		it('should use default length of 16', () => {
			expect(UtilString.shorten('this is a very long string')).toBe('this is a very l…');
		});

		it('should omit ellipsis when noEnding is true', () => {
			expect(UtilString.shorten('a very long string', 10, true)).toBe('a very lon');
		});
	});

	describe('shortMask', () => {
		it('should mask the middle of a string', () => {
			expect(UtilString.shortMask('abcdefghijklmnop', 3)).toBe('abc...nop');
		});

		it('should return original if too short to mask', () => {
			expect(UtilString.shortMask('abcdefg', 3)).toBe('abcdefg');
		});

		it('should support different n1 and n2', () => {
			expect(UtilString.shortMask('abcdefghijklmnop', 3, 6)).toBe('abc...klmnop');
		});
	});

	describe('regexEscape', () => {
		it('should escape regex special characters', () => {
			expect(UtilString.regexEscape('hello.world')).toBe('hello\\.world');
			expect(UtilString.regexEscape('a+b*c')).toBe('a\\+b\\*c');
			expect(UtilString.regexEscape('(test)')).toBe('\\(test\\)');
		});

		it('should handle empty string', () => {
			expect(UtilString.regexEscape('')).toBe('');
		});
	});

	describe('matchUrl', () => {
		it('should match valid URLs', () => {
			expect(UtilString.matchUrl('https://example.com')).toBe('https://example.com');
			expect(UtilString.matchUrl('http://example.com/path')).toBe('http://example.com/path');
		});

		it('should return empty string for invalid URLs', () => {
			expect(UtilString.matchUrl('')).toBe('');
		});

		it('should match URLs with ports', () => {
			expect(UtilString.matchUrl('http://localhost:8080')).toBe('http://localhost:8080');
		});

		it('should not match scheme-less prose with an unapproved TLD', () => {
			expect(UtilString.matchUrl('hey.how')).toBe('');
			expect(UtilString.matchUrl('Mr.Smith')).toBe('');
			expect(UtilString.matchUrl('readme.md')).toBe('');
		});

		it('should match scheme-less domains with an approved TLD', () => {
			expect(UtilString.matchUrl('example.com')).toBe('example.com');
			expect(UtilString.matchUrl('sub.example.io')).toBe('sub.example.io');
		});

		it('should match any TLD when an explicit scheme is present', () => {
			expect(UtilString.matchUrl('https://hey.how')).toBe('https://hey.how');
		});

		it('should still match IP hosts', () => {
			expect(UtilString.matchUrl('192.168.1.1')).toBe('192.168.1.1');
		});
	});

	describe('matchEmail', () => {
		it('should match valid emails', () => {
			expect(UtilString.matchEmail('test@example.com')).toBe('test@example.com');
		});

		it('should return empty string for invalid emails', () => {
			expect(UtilString.matchEmail('notanemail')).toBe('');
			expect(UtilString.matchEmail('')).toBe('');
			expect(UtilString.matchEmail('ab')).toBe('');
		});
	});

	describe('matchDomain', () => {
		it('should match valid domains', () => {
			expect(UtilString.matchDomain('example.com')).toBe('example.com');
			expect(UtilString.matchDomain('sub.example.com')).toBe('sub.example.com');
		});

		it('should match domains with multi-part country-code TLDs', () => {
			expect(UtilString.matchDomain('example.co.uk')).toBe('example.co.uk');
		});

		it('should reject prose that looks like a domain but has an unapproved TLD', () => {
			expect(UtilString.matchDomain('hey.how')).toBe('');
			expect(UtilString.matchDomain('test.code')).toBe('');
			expect(UtilString.matchDomain('node.go')).toBe('');
		});

		it('should return empty string for invalid input', () => {
			expect(UtilString.matchDomain('')).toBe('');
		});
	});

	describe('stripTags', () => {
		it('should remove HTML tags', () => {
			expect(UtilString.stripTags('<b>bold</b>')).toBe('bold');
			expect(UtilString.stripTags('<p>hello <a href="#">world</a></p>')).toBe('hello world');
		});

		it('should handle strings without tags', () => {
			expect(UtilString.stripTags('no tags here')).toBe('no tags here');
		});
	});

	describe('htmlSpecialChars', () => {
		it('should escape HTML special characters', () => {
			expect(UtilString.htmlSpecialChars('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
			expect(UtilString.htmlSpecialChars('a & b')).toBe('a &amp; b');
		});
	});

	describe('fromHtmlSpecialChars', () => {
		it('should unescape HTML entities', () => {
			expect(UtilString.fromHtmlSpecialChars('&lt;b&gt;')).toBe('<b>');
			expect(UtilString.fromHtmlSpecialChars('a &amp; b')).toBe('a & b');
		});
	});

	describe('normalizeLineEndings', () => {
		it('should normalize \\r\\n to \\n', () => {
			expect(UtilString.normalizeLineEndings('hello\r\nworld')).toBe('hello\nworld');
		});

		it('should keep \\n as \\n', () => {
			expect(UtilString.normalizeLineEndings('hello\nworld')).toBe('hello\nworld');
		});
	});

	describe('checkRtl', () => {
		it('should return true for RTL text', () => {
			expect(UtilString.checkRtl('שלום')).toBe(true);
			expect(UtilString.checkRtl('مرحبا')).toBe(true);
		});

		it('should return false for LTR text', () => {
			expect(UtilString.checkRtl('hello')).toBe(false);
		});
	});

	describe('lexString', () => {
		it('should increment last character', () => {
			expect(UtilString.lexString('a')).toBe('b');
			expect(UtilString.lexString('A')).toBe('B');
			expect(UtilString.lexString('0')).toBe('1');
		});

		it('should carry over when reaching end of alphabet', () => {
			expect(UtilString.lexString('z')).toBe('00');
		});

		it('should handle multi-character strings', () => {
			expect(UtilString.lexString('ab')).toBe('ac');
		});
	});

	describe('urlScheme', () => {
		it('should extract scheme from URL', () => {
			expect(UtilString.urlScheme('https://example.com')).toBe('https');
			expect(UtilString.urlScheme('http://example.com')).toBe('http');
			expect(UtilString.urlScheme('ftp://files.example.com')).toBe('ftp');
		});

		it('should return empty string for invalid URL', () => {
			expect(UtilString.urlScheme('not a url')).toBe('');
		});
	});

	describe('urlFix', () => {
		it('should prepend https:// to bare domains', () => {
			expect(UtilString.urlFix('example.com')).toBe('https://example.com');
		});

		it('should not modify URLs with existing scheme', () => {
			expect(UtilString.urlFix('https://example.com')).toBe('https://example.com');
		});

		it('should return empty string for empty input', () => {
			expect(UtilString.urlFix('')).toBe('');
		});

		it('should return empty string for overly long URLs', () => {
			expect(UtilString.urlFix('a'.repeat(2049))).toBe('');
		});
	});

	describe('lbBr', () => {
		it('should replace line breaks with br tags', () => {
			expect(UtilString.lbBr('hello\nworld')).toBe('hello<br/>world');
		});
	});

});
