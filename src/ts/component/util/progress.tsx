import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Label } from 'ts/component';
import { Util, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {}

const $ = require('jquery');

const Progress = observer(class Progress extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { progress } = commonStore;
		const { status, current, total, isUnlocked, canCancel } = progress || {};

		if (!status) {
			return null;
		};
		
		const text = Util.sprintf(status, current, total);
		const cn = [ 'progress', (isUnlocked ? 'isUnlocked' : '') ];
		
		return (
			<div className={cn.join(' ')}>
				<div className="inner">
					<Label text={text} />
					{canCancel ? <Icon className="close" onClick={this.onCancel} /> : ''}
					<div className="bar">
						<div className="fill" style={{width: (Math.ceil(current / total * 100)) + '%'}} />
					</div>
				</div>
			</div>
		);
	};
	
	componentDidUpdate () {
		const { progress } = commonStore;
		if (!progress) {
			return;
		};

		const { current, total } = progress;
		const node = $(ReactDOM.findDOMNode(this));
		
		node.removeClass('hide');
		
		if (total && (current >= total)) {
			node.addClass('hide');
			setTimeout(() => { commonStore.progressClear(); }, 200);
		};
	};
	
	onCancel (e: any) {
		const { progress } = commonStore;
		const { id } = progress;
		
		C.ProcessCancel(id);
	};
	
});

export default Progress;