import type { Meta, StoryObj } from '@storybook/react';
import { withPopup } from '../../../../.storybook/decorators';
import text from 'json/text.json';
import ApiKeyEditor from './apiKeyEditor';

const spaces = Array.from({ length: 100 }, (_, i) => ({ id: `space-${i + 1}`, name: `Space ${String(i + 1).padStart(3, '0')}` }));
const app = { hash: 'preview', apiKey: 'preview-key', name: 'Notes integration', scope: 1, createdAt: 1780000000, expireAt: 0, isActive: false };

const meta: Meta<typeof ApiKeyEditor> = {
	title: 'Form/ApiKeyEditor',
	component: ApiKeyEditor,
	decorators: [ withPopup('ApiCreate') ],
	args: {
		spaces,
		t: key => text[key] || key,
		formatDate: timestamp => new Date(timestamp * 1000).toLocaleDateString(),
		onCreate: (_, callback) => callback({ key: 'anytype_preview_key_for_storybook_only', error: { code: 0 } }),
		onUpdate: (_, __, callback) => callback({ error: { code: 0 } }),
		onCopy: () => {},
		onClose: () => {},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Create: Story = {};
export const Edit: Story = { args: { app: { ...app, grant: { spaceIds: [ 'space-1', 'space-5' ], allSpaces: false, perm: 0 } } } };
export const Legacy: Story = { args: { app } };
export const AllSpaces: Story = { args: { app: { ...app, grant: { spaceIds: [], allSpaces: true, perm: 1 } } } };
export const NoSpaces: Story = { args: { spaces: [] } };
export const UnavailableSpaces: Story = { args: { app: { ...app, grant: { spaceIds: [ 'space-1', 'space-5' ], allSpaces: false, perm: 0 } }, spaces: [ spaces[0] ] } };
