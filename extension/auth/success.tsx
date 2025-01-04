import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface State {
	error: string;
};

const Success = observer(class Success extends React.Component<I.PageComponent, State> {

	render () {
		return (
			<div className="page pageSuccess">
				<div className="title">Successfully authorized!</div>
			</div>
		);
	};

});

export default Success;