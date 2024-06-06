import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, Preview, UtilData, translate, UtilCommon } from 'Lib';
import { authStore } from 'Store';

interface Props {
	id?: string;
	className?: string;
	rootId: string;
	onClick: (e: any) => void;
};

const Sync = observer(class Sync extends React.Component<Props> {

	public static defaultProps = {
		className: '',
	};

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { id, className } = this.props;
		const { icon, name } = this.getStatus();
		const cn = [ 'sync' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				onClick={this.onClick}
			>
				<Icon className={icon} />
				{name ? <div className="name">{name}</div> : ''}
			</div>
		);
	};

	onClick (e: any) {
		const { onClick } = this.props;

		if (onClick) {
			onClick(e);
		};
	};

	getStatus (): any {
		const syncData = authStore.syncData;
		const { status, network, error } = syncData;

		let icon: string;
		let name = '';

		if (network == I.SyncStatusNetwork.LocalOnly) {
			icon = String(I.SyncStatusStatus.Offline).toLowerCase()
		} else {
			icon = I.SyncStatusStatus[status].toLowerCase()
		}

		if ((status == I.SyncStatusStatus.Error) && error) {
			name = translate(`syncButtonNameError${error}`);
		} else
		if (status == I.SyncStatusStatus.Offline) {
			name = translate(`syncButtonNameOffline`);
		};

		return { icon, name };
	};

});

export default Sync;
