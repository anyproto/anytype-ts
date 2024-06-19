import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S } from 'Lib';

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
		const { icon, name, error } = this.getStatus();
		const cn = [ 'sync' ];

		if (className) {
			cn.push(className);
		};
		if (error) {
			cn.push(`error${I.SyncStatusError[error]}`);
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
		const { status, network, error } = S.Auth.syncStatus;

		let icon = '';
		let name = '';

		if (network == I.SyncStatusNetwork.LocalOnly) {
			icon = String(I.SyncStatusSpace.Offline).toLowerCase()
		} else {
			icon = I.SyncStatusSpace[status].toLowerCase()
		};

		return { icon, name, error };
	};

});

export default Sync;