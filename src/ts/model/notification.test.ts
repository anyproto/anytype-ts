import { describe, it, expect, beforeAll } from 'vitest';
import * as I from 'Interface';

const translations: any = {
	commonError: 'Error',
	notificationImportSuccessTitle: 'Import complete!',
	notificationImportSuccessText: 'You can find the imported objects in the selected channel.',
	notificationImportSuccessIssuesText: 'Your files were imported with %s %s. See the report for details.',
	notificationImportErrorText6: 'The import was canceled by the user.',
	pluralIssue: 'issue|issues',
};

beforeAll(() => {
	(globalThis as any).translate = (key: string) => translations[key] || key;

	(globalThis as any).U = {
		String: {
			shorten: (s: string, n: number) => String(s || '').substring(0, n),
			toCamelCase: (str: string) => {
				return String(str || '').replace(/[_-\s]([a-zA-Z])/g, (_: any, char: string) => char.toUpperCase()).replace(/^[A-Z]/, (char: string) => char.toLowerCase());
			},
			sprintf: (format: string, ...args: any[]) => {
				let i = 0;
				return String(format || '').replace(/%[sd]/g, () => String(args[i++]));
			},
		},
		Common: {
			enumKey: (e: any, v: any) => Object.keys(e).find(k => e[k] == v) || '',
			plural: (cnt: number, words: string) => {
				const [ single, plural ] = String(words || '').split('|');
				return cnt == 1 ? single : (plural || single);
			},
		},
	};

	(globalThis as any).J = {
		Error: {
			Code: {
				Import: [ 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17 ],
			},
		},
	};
});

const make = async (payload: any) => {
	const Notification = (await import('./notification')).default;

	return new Notification({
		id: '1',
		type: I.NotificationType.Import,
		status: I.NotificationStatus.Created,
		createTime: 0,
		isLocal: false,
		payload,
	});
};

describe('Notification.fillContent (Import)', () => {

	it('clean success keeps the default title and text', async () => {
		const n = await make({ errorCode: 0, issuesCount: 0, reportObjectId: '' });

		expect(n.title).toBe(translations.notificationImportSuccessTitle);
		expect(n.text).toBe(translations.notificationImportSuccessText);
	});

	it('success with issues reports the count with plural', async () => {
		const n = await make({ errorCode: 0, issuesCount: 3, reportObjectId: 'reportId' });

		expect(n.title).toBe(translations.notificationImportSuccessTitle);
		expect(n.text).toBe('Your files were imported with 3 issues. See the report for details.');
	});

	it('success with a single issue uses the singular form', async () => {
		const n = await make({ errorCode: 0, issuesCount: 1, reportObjectId: 'reportId' });

		expect(n.text).toBe('Your files were imported with 1 issue. See the report for details.');
	});

	it('known error code wins over issuesCount', async () => {
		const n = await make({ errorCode: 6, issuesCount: 5, reportObjectId: 'reportId' });

		expect(n.title).toBe(translations.commonError);
		expect(n.text).toBe(translations.notificationImportErrorText6);
	});

	it('v1 payload without the new fields behaves like clean success', async () => {
		const n = await make({ errorCode: 0 });

		expect(n.title).toBe(translations.notificationImportSuccessTitle);
		expect(n.text).toBe(translations.notificationImportSuccessText);
	});

});
