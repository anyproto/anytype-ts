import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, Preview, DataUtil, translate } from 'Lib';
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

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, className, onClick } = this.props;
		const status = this.getStatus();
		const cn = [ 'sync' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div 
				ref={node => this.node = node}
				id={id} 
				className={cn.join(' ')} 
				onClick={onClick} 
				onMouseEnter={this.onMouseEnter} 
				onMouseLeave={this.onMouseLeave}
			>
				<Icon className={DataUtil.threadColor(status)} />
				{translate(`syncStatus${status}`)}
			</div>
		);
	};

	onMouseEnter () {
		const node = $(this.node);
		const status = this.getStatus();

		if (status) {
			Preview.tooltipShow({ text: translate(`tooltip${status}`), element: node, typeY: I.MenuDirection.Bottom });
		};
	};
	
	onMouseLeave () {
		Preview.tooltipHide(false);
	};

	getStatus () {
		const { rootId } = this.props;
		const { account } = authStore;
		const thread = authStore.threadGet(rootId);
		const { summary } = thread;

		if (!summary) {
			return I.ThreadStatus.Unknown;
		};

		const disabled = account?.status?.type != I.AccountStatusType.Active;
		return disabled ? I.ThreadStatus.Disabled : ((summary || {}).status || I.ThreadStatus.Unknown);
	};
	
});

export default Sync;