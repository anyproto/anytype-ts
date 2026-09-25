import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SettingsSpaceDeletionAudit from './deletionAudit';

const meta: Meta<typeof SettingsSpaceDeletionAudit> = {
	title: 'Page/Main/Settings/Space/DeletionAudit',
	component: SettingsSpaceDeletionAudit,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
	},
};

export { meta as default };
type Story = StoryObj<typeof meta>;

// The page loads its own data through C.ObjectDeletionAudit, so these stories differ only
// in what the backend is standing by to return. The states worth eyeballing:
//
//   Default   — both kinds in one list: named uninstalled rows next to nameless deleted ones
//   Degraded  — deletions from before tombstone preservation: id chip, ghost icon, dashes
//   Uninstalled — types and properties only, every row named and badged reversible
//   Empty     — nothing removed from the space yet
//
// Backed by a live middleware; without one they all render the loader.

export const Default: Story = {
	args: {
		isPopup: false,
	},
};

export const Degraded: Story = {
	args: {
		isPopup: false,
	},
};

export const Uninstalled: Story = {
	args: {
		isPopup: false,
	},
};

export const Empty: Story = {
	args: {
		isPopup: false,
	},
};
