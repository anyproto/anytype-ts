import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Notification from './index';
import { withNotification } from '../../../../.storybook/decorators';
import { ExportReport, ExportReport_Status, ExportReport_Issue_Severity } from 'Proto/pkg/lib/pb/model/protos/export_report';
import * as I from 'Interface';

const noop = () => {};

const meta: Meta<typeof Notification> = {
	title: 'Notification/Item',
	component: Notification,
	tags: ['autodocs'],
	decorators: [ withNotification ],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

export const ExportSuccess: Story = {
	args: {
		item: {
			id: 'notification-export-success',
			type: I.NotificationType.Export,
			status: I.NotificationStatus.Created,
			createTime: 0,
			isLocal: true,
			title: 'Export completed',
			text: 'You can find the exported objects in the folder you selected.',
			payload: { errorCode: 0, path: '/exports', report: ExportReport.fromPartial({ succeed: 124 }) },
		},
		style: { position: 'relative', left: 0, top: 0 },
		resize: noop,
	},
};

export const ExportWarningsOnly: Story = {
	args: {
		...ExportSuccess.args,
		item: {
			...ExportSuccess.args.item,
			id: 'notification-export-warnings',
			payload: {
				errorCode: 0,
				path: '/exports',
				report: ExportReport.fromPartial({
					status: ExportReport_Status.PARTIAL,
					succeed: 124,
					issues: [ { severity: ExportReport_Issue_Severity.WARNING, code: 'unresolved_target', message: 'A referenced object could not be resolved.' } ],
				}),
			},
		},
	},
};

export const Import: Story = {
	args: {
		item: {
			id: 'notif-1',
			type: 'import',
			status: 'completed',
			title: 'Import Complete',
			text: 'Successfully imported 12 objects from Notion',
			payload: { importType: 0, spaceId: '', errorCode: 0 },
		},
		style: {},
		resize: noop,
	},
};

export const Gallery: Story = {
	args: {
		item: {
			id: 'notif-2',
			type: 'gallery',
			status: 'completed',
			title: 'Experience Installed',
			text: 'CRM template has been added to your space',
			payload: { spaceId: '', name: 'CRM' },
		},
		style: {},
		resize: noop,
	},
};
