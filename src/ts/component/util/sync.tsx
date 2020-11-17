import * as React from 'react';
import { I, DataUtil, translate } from 'ts/lib';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	id?: string;
	className?: string;
	rootId: string;
	onClick: (e: any) => void;
};

@observer
class Sync extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { id, className, rootId, onClick } = this.props;
		const thread = authStore.threadGet(rootId);
		const { summary } = thread;

		if (!summary) {
			return null;
		};

		return (
			<div id={id} className={[ 'sync', className ].join(' ')} onClick={onClick}>
				<div className={[ 'bullet', DataUtil.threadColor(summary.status) ].join(' ')} />
				{translate('syncStatus' + summary.status)}
			</div>
		);
	};
	
};

export default Sync;