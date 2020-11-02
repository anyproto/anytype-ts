import * as React from 'react';
import { I, Util } from 'ts/lib';
import { Icon, Input } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuOptionEdit extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		
		return (
			<div>
				<div className="wrap">
					<Input value={value} placeHolder="Option name"  />
				</div>
				<div className="item">
					<Icon className="remove" />
					<div className="name">Delete option</div>
				</div>
			</div>
		);
	};
	
};

export default MenuOptionEdit;