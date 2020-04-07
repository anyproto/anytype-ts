import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Label } from 'ts/component';
import { Util, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {};

const $ = require('jquery');

@observer
class Progress extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { progress } = commonStore;
		const { status, current, total, isUnlocked, canCancel } = progress;
		
		if (!status) {
			return null;
		};
		
		const text = Util.sprintf(status, current, total);
		const cn = [ 'progress', (isUnlocked ? 'isUnlocked' : '') ];
		
		return (
			<div className={cn.join(' ')}>
				<div className="inner">
					<div className="label">
						{text}
						{canCancel ? <div className="btn" onClick={this.onCancel}>Cancel</div> : ''}
					</div>
					<div className="bar" style={{width: (Math.ceil(current / total * 100)) + '%'}} />
				</div>
			</div>
		);
	};
	
	componentDidUpdate () {
		const { progress } = commonStore;
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
	
};

export default Progress;