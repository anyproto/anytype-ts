import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Constant from 'json/constant';
import UtilString from 'Lib/util/string';
import Storage from 'Lib/storage';

vi.mock('Lib/focus', () => ({ focus: {} }));
import Action from './action';

beforeEach(() => {
	vi.stubGlobal('J', { Constant });
	vi.stubGlobal('U', { String: UtilString, Common: { getRouteFromUrl: () => '' } });
	vi.stubGlobal('S', { Popup: { open: vi.fn() } });
	vi.stubGlobal('Renderer', { send: vi.fn() });
	vi.stubGlobal('translate', (key: string) => key);
	vi.spyOn(Storage, 'get').mockReturnValue(false);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

// The user once ticked "don't ask again" for external links
const remembered = () => vi.mocked(Storage.get).mockImplementation((key: string) => key == 'openUrl');

const expectConfirmWithoutRemember = (url: string) => {
	Action.openUrl(url);

	expect(Renderer.send).not.toHaveBeenCalled();
	expect(S.Popup.open).toHaveBeenCalledWith('confirm', { data: expect.objectContaining({ storageKey: '' }) });
};

describe('Action.openUrl', () => {
	it('opens web links directly', () => {
		Action.openUrl('https://anytype.io');
		expect(Renderer.send).toHaveBeenCalledWith('openUrl', 'https://anytype.io');
	});

	it('opens other schemes directly once the user chose not to be asked', () => {
		remembered();
		Action.openUrl('zoommtg://zoom.us/join');
		expect(Renderer.send).toHaveBeenCalledWith('openUrl', 'zoommtg://zoom.us/join');
	});

	it('always confirms local files, even when the user chose not to be asked', () => {
		remembered();
		expectConfirmWithoutRemember('file:///C:/Users/me/Downloads/setup.exe');
	});

	it('always confirms Windows drive paths', () => {
		remembered();
		expectConfirmWithoutRemember('C:\\Users\\me\\Downloads\\setup.exe');
	});

	it('always confirms network shares and OS handlers', () => {
		remembered();
		expectConfirmWithoutRemember('smb://host/share/setup.exe');

		vi.mocked(S.Popup.open).mockClear();
		expectConfirmWithoutRemember('ms-word:ofe|u|https://example.com/doc.docm');
	});

	describe('confirmation text', () => {
		const confirmText = (url: string): string => {
			vi.stubGlobal('translate', () => '%s');
			Action.openUrl(url);

			return vi.mocked(S.Popup.open).mock.calls[0][1].data.text;
		};

		it('shows the target as text, never as markup', () => {
			const text = confirmText('zoommtg:<a class="path" href="C:\\setup.exe">x</a>');

			expect(text).not.toContain('<a');
			expect(text).toContain('&lt;a class="path"');
		});

		it('keeps the file name at the end of a long target visible', () => {
			const text = confirmText(`file:///C:/${'a/'.repeat(100)}setup.exe`);

			expect(text.startsWith('file:///C:/')).toBe(true);
			expect(text.endsWith('/setup.exe')).toBe(true);
		});
	});
});
