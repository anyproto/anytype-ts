import * as React from 'react';
import { Label } from 'ts/component';
import { Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};

@inject('commonStore')
@observer
class Progress extends React.Component<Props, {}> {
	
	render () {
		const { commonStore } = this.props;
		const { progress } = commonStore;
		
		if (!progress) {
			return null;
		};
		
		const { status, current, total } = progress;
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
	
};

export default Progress;