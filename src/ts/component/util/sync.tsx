import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
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
		const { id, className, rootId, onClick } = this.props;
		const { account } = authStore;
		const thread = authStore.threadGet(rootId);
		//const disabled = account?.status?.type != I.AccountStatusType.Active;
		//const status = disabled ? I.ThreadStatus.Disabled : ((thread.summary || {}).status || I.ThreadStatus.Unknown);
		const status = (thread.summary || {}).status || I.ThreadStatus.Unknown;
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
				<div className={[ 'bullet', DataUtil.threadColor(status) ].join(' ')} />
				{translate('syncStatus' + status)}
			</div>
		);
	};

	onMouseEnter () {
		const { rootId } = this.props;
		const node = $(this.node);
		const thread = authStore.threadGet(rootId);
		const { summary } = thread;

		if (summary) {
			Preview.tooltipShow({ text: translate('tooltip' + summary.status), element: node, typeY: I.MenuDirection.Bottom });
		};
	};
	
	onMouseLeave () {
		Preview.tooltipHide(false);
	};
	
});

export default Sync;