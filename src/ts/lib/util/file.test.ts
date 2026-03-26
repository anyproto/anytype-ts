import { describe, it, expect } from 'vitest';
import UtilFile from './file';
import * as I from 'Interface';

describe('UtilFile', () => {

	describe('name', () => {
		it('should return name with extension appended', () => {
			expect(UtilFile.name({ name: 'document', fileExt: 'pdf' })).toBe('document.pdf');
		});

		it('should not duplicate extension if already present', () => {
			expect(UtilFile.name({ name: 'document.pdf', fileExt: 'pdf' })).toBe('document.pdf');
		});

		it('should return just the name if no extension', () => {
			expect(UtilFile.name({ name: 'document', fileExt: '' })).toBe('document');
		});

		it('should handle empty name', () => {
			expect(UtilFile.name({ name: '', fileExt: 'pdf' })).toBe('.pdf');
		});

		it('should handle null object', () => {
			expect(UtilFile.name(null)).toBe('');
		});
	});

	describe('layoutByMime', () => {
		it('should return Image layout for image mime', () => {
			expect(UtilFile.layoutByMime('image/png')).toBe(I.ObjectLayout.Image);
			expect(UtilFile.layoutByMime('image/jpeg')).toBe(I.ObjectLayout.Image);
		});

		it('should return Video layout for video mime', () => {
			expect(UtilFile.layoutByMime('video/mp4')).toBe(I.ObjectLayout.Video);
		});

		it('should return Audio layout for audio mime', () => {
			expect(UtilFile.layoutByMime('audio/mpeg')).toBe(I.ObjectLayout.Audio);
		});

		it('should return File layout for unknown mime', () => {
			expect(UtilFile.layoutByMime('application/pdf')).toBe(I.ObjectLayout.File);
		});

		it('should return File layout for empty mime', () => {
			expect(UtilFile.layoutByMime('')).toBe(I.ObjectLayout.File);
		});
	});

	describe('date', () => {
		it('should return an ISO date string', () => {
			const result = UtilFile.date();

			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}$/);
		});

		it('should not contain colons', () => {
			expect(UtilFile.date()).not.toContain(':');
		});
	});

	describe('icon', () => {
		it('should return "image" for image mime types', () => {
			expect(UtilFile.icon({ mime: 'image/png' })).toBe('image');
			expect(UtilFile.icon({ mime: 'image/jpeg' })).toBe('image');
		});

		it('should return "video" for video mime types', () => {
			expect(UtilFile.icon({ mime: 'video/mp4' })).toBe('video');
		});

		it('should return "audio" for audio mime types', () => {
			expect(UtilFile.icon({ mime: 'audio/mpeg' })).toBe('audio');
		});

		it('should return "text" for text mime types', () => {
			expect(UtilFile.icon({ mime: 'text/plain' })).toBe('text');
		});

		it('should return "pdf" for pdf mime type', () => {
			expect(UtilFile.icon({ mime: 'application/pdf' })).toBe('pdf');
		});

		it('should return "archive" for zip mime type', () => {
			expect(UtilFile.icon({ mime: 'application/zip' })).toBe('archive');
		});

		it('should detect by file extension for text files', () => {
			expect(UtilFile.icon({ name: 'file.json' })).toBe('text');
			expect(UtilFile.icon({ name: 'file.md' })).toBe('text');
			expect(UtilFile.icon({ name: 'file.csv' })).toBe('text');
		});

		it('should detect by file extension for archive files', () => {
			expect(UtilFile.icon({ name: 'file.zip' })).toBe('archive');
			expect(UtilFile.icon({ name: 'file.tar' })).toBe('archive');
		});

		it('should detect by file extension for table files', () => {
			expect(UtilFile.icon({ name: 'file.xls' })).toBe('table');
			expect(UtilFile.icon({ name: 'file.xlsx' })).toBe('table');
		});

		it('should detect by file extension for presentation files', () => {
			expect(UtilFile.icon({ name: 'file.ppt' })).toBe('presentation');
			expect(UtilFile.icon({ name: 'file.key' })).toBe('presentation');
		});

		it('should detect by fileExt for video', () => {
			expect(UtilFile.icon({ fileExt: 'm4v' })).toBe('video');
		});

		it('should return "other" for unknown types', () => {
			expect(UtilFile.icon({ name: 'file.xyz' })).toBe('other');
		});

		it('should return "other" for empty object', () => {
			expect(UtilFile.icon({})).toBe('other');
		});
	});

});
