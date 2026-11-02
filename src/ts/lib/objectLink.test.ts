import { describe, it, expect } from 'vitest';
import { getObjectLink } from './objectLink';

describe('getObjectLink', () => {

	it('should keep the fields of app object links', () => {
		expect(getObjectLink('anytype://object?objectId=1&spaceId=2')).toBe('anytype://object?objectId=1&spaceId=2');
		expect(getObjectLink('anytype://object/?objectId=1&spaceId=2&messageId=3')).toBe('anytype://object?objectId=1&spaceId=2&messageId=3');
		expect(getObjectLink('anytype://object?objectId=a%26b')).toBe('anytype://object?objectId=a%26b');
	});

	it('should rebuild web object links as app object links', () => {
		expect(getObjectLink('https://object.any.coop/1?spaceId=2')).toBe('anytype://object?objectId=1&spaceId=2');
		expect(getObjectLink('https://object.any.coop/1?spaceId=2&messageId=3')).toBe('anytype://object?objectId=1&spaceId=2&messageId=3');
	});

	it('should drop every other parameter, so none can pick another route', () => {
		expect(getObjectLink('anytype://object?objectId=1&spaceId=2&page=main&action=oneToOne')).toBe('anytype://object?objectId=1&spaceId=2');
		expect(getObjectLink('anytype://object?objectId=1&ci%2564=3')).toBe('anytype://object?objectId=1');
	});

	it('should take the first of repeated parameters', () => {
		expect(getObjectLink('anytype://object?objectId=1&objectId=2&spaceId=3&spaceId=4')).toBe('anytype://object?objectId=1&spaceId=3');
	});

	it('should refuse invites', () => {
		expect(getObjectLink('anytype://object?objectId=1&cid=2&key=3')).toBe('');
		expect(getObjectLink('https://object.any.coop/1?spaceId=2&inviteId=3#4')).toBe('');
		expect(getObjectLink('https://object.any.coop/1?spaceId=2#4')).toBe('');
	});

	it('should refuse other routes, links without an object and other urls', () => {
		expect(getObjectLink('anytype://hi/?id=1&key=2')).toBe('');
		expect(getObjectLink('anytype://invite/?cid=1&key=2')).toBe('');
		expect(getObjectLink('anytype://main/settings')).toBe('');
		expect(getObjectLink('anytype://object?spaceId=2')).toBe('');
		expect(getObjectLink('https://hi.any.coop/1#2')).toBe('');
		expect(getObjectLink('https://example.com/?objectId=1')).toBe('');
		expect(getObjectLink('not a url')).toBe('');
	});

});
