import * as React from 'react';
import { I } from 'ts/lib';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	className?: string;
};

@observer
class Sync extends React.Component<Props, {}> {

	render () {
		const { className } = this.props;
		const { cafe } = authStore;
		
		let cn = [ 'sync' ];
		if (className) {
			cn.push(className);
		};
		let text = '';
		let color = '';

		switch (cafe.status) {
			case I.SyncStatus.Unknown:
				text = 'Unknown';
				break;

			case I.SyncStatus.Offline:
				text = 'Offline';
				color = 'red';
				break;

			case I.SyncStatus.Syncing:
				text = 'Syncyng...';
				color = 'orange';
				break;

			case I.SyncStatus.Synced:
				text = 'Synced';
				color = 'green';
				break;

			case I.SyncStatus.Failed:
				text = 'Failed';
				color = 'red';
				break;
		};

		return (
			<div className={cn.join(' ')}>
				<div className={[ 'bullet', color ].join(' ')} />
				{text}
			</div>
		);
	};
	
};

export default Sync;