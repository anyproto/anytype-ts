import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { withBlock } from '../../../../../.storybook/decorators';
import { StatusGroup } from './status';
import { ChatStatusJournal, decodeStatus } from 'Lib/chatStatus/model';
import { ChatStatus } from 'Store/chatStatus';

const scope = { accountId: 'storybook', spaceId: 'status-demo', chatId: 'tool-activity' };

const ToolActivityExample = observer(() => {
	const journal = useRef<ChatStatusJournal>();
	const view = ChatStatus.get(scope);
	const apply = () => view.apply(structuredClone(journal.current.delta(true)));
	const publish = (data: object, text: string) => {
		journal.current.status('demo-agent', decodeStatus(JSON.stringify({ text, data })), Date.now());
		apply();
	};
	const reset = () => {
		journal.current = new ChatStatusJournal(scope);
		publish({ tool_call_id: 'call_123', tool_name: 'web_search', status: 'in_progress', query: 'tickets berlin amsterdam' }, 'Searching documents');
		publish({ tool_call_id: 'call_124', tool_name: 'read_document', status: 'complete', document: 'train-options.pdf', result: { pages: 4 } }, 'Read the timetable');
		publish({ tool_call_id: 'call_125', tool_name: 'fetch_page', status: 'error', result: { error: 'The request timed out' } }, 'Could not load the operator page');
	};
	useEffect(() => { reset(); return () => ChatStatus.clear(scope.accountId); }, []);
	return <div style={{ maxWidth: 720 }}>
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
			<button type="button" onClick={() => publish({ tool_call_id: 'call_123', status: 'complete' }, 'Found 3 matching documents')}>Complete search</button>
			<button type="button" onClick={() => publish({ tool_call_id: 'call_123', result: { matches: 3 } }, 'Found 3 matching documents')}>Add result</button>
			<button type="button" onClick={reset}>Reset example</button>
		</div>
		{Array.from(view.groups.keys()).map(groupId => <StatusGroup key={groupId} scope={scope} groupId={groupId} now={Date.now()}
			onDisclosure={(_scope, kind, id, expanded) => { journal.current.expand(kind, id, expanded); apply(); }} />)}
	</div>;
});

const meta: Meta<typeof ToolActivityExample> = {
	title: 'Block/Chat/Tool activity',
	component: ToolActivityExample,
	decorators: [ withBlock('blockChat') ],
};

export default meta;
type Story = StoryObj<typeof meta>;
export const LifecycleAndResults: Story = {};
