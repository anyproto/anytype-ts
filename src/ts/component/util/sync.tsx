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
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, className } = this.props;
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
				onClick={this.onClick} 
				onMouseEnter={this.onMouseEnter} 
				onMouseLeave={this.onMouseLeave}
			>
				<Icon className={UtilData.threadColor(status)} />
				<div className="name">{translate(`threadStatus${status}`)}</div>
			</div>
		);
	};

	onClick (e: any) {
		const { onClick } = this.props;
		const status = this.getStatus();

		if (status == I.ThreadStatus.Incompatible) {
			UtilCommon.onErrorUpdate();
		} else
		if (onClick) {
			onClick(e);
		};
	};

	onMouseEnter () {
		const node = $(this.node);
		const status = this.getStatus();

		if (status) {
			Preview.tooltipShow({ text: translate(`threadStatus${status}Tooltip`), element: node, typeY: I.MenuDirection.Bottom });
		};
	};
	
	onMouseLeave () {
		Preview.tooltipHide(false);
	};

	getStatus () {
		const { rootId } = this.props;
		const thread = authStore.threadGet(rootId);
		const { summary } = thread;

		if (!summary) {
			return I.ThreadStatus.Unknown;
		};

		return (thread.summary || {}).status || I.ThreadStatus.Unknown;
	};
	
});

export default Sync;