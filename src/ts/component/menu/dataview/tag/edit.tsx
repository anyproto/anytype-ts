import * as React from 'react';
import { I, Util } from 'ts/lib';
import { Icon, Input } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

@inject('commonStore')
@observer
class MenuTagEdit extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
	};

	render () {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { value } = data;
		
		return (
			<div>
				<div className="wrap">
					<Input value={value} placeHolder="Option name"  />
				</div>
				<div className="item">
					<Icon className="trash" />
					<div className="name">Delete option</div>
				</div>
			</div>
		);
	};
	
};

export default MenuTagEdit;