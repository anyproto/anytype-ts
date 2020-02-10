import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Label } from 'ts/component';
import { Util } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {};

const $ = require('jquery');

@observer
class Progress extends React.Component<Props, {}> {
	
	render () {
		const { progress } = commonStore;
		const { status, current, total } = progress;
		
		if (!status) {
			return null;
		};
		
		const text = Util.sprintf(status, current, total);
		
		return (
			<div className="progress">
				<div className="inner">
					<Label text={text} />
					<div className="bar" style={{width: (Math.ceil(current / total * 100)) + '%'}} />
				</div>
			</div>
		);
	};
	
	componentDidUpdate () {
		const { progress } = commonStore;
		const { status, current, total } = progress;
		const node = $(ReactDOM.findDOMNode(this));
		
		node.removeClass('hide');
		
		if (total && (current >= total)) {
			node.addClass('hide');
			setTimeout(() => { commonStore.progressClear(); }, 200);
		};
	};
	
};

export default Progress;