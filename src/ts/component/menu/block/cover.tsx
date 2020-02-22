import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuBlockCover extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<div>
			</div>
		);
	};
	
};

export default MenuBlockCover;