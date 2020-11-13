import * as React from 'react';
import { I, DataUtil, translate } from 'ts/lib';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	id?: string;
	className?: string;
	onClick: (e: any) => void;
};

@observer
class Sync extends React.Component<Props, {}> {

	public static defaultProps = {
		className: '',
	};

	render () {
		const { id, className, onClick } = this.props;
		const { threadSummary } = authStore;

		if (!threadSummary) {
			return null;
		};

		const { status } = threadSummary;
		
		return (
			<div id={id} className={[ 'sync', className ].join(' ')} onClick={onClick}>
				<div className={[ 'bullet', DataUtil.threadColor(status) ].join(' ')} />
				{translate('syncStatus' + status)}
			</div>
		);
	};
	
};

export default Sync;