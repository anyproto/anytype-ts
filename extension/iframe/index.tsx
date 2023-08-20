import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);
	};

	render () {
		return (
			<div className={`page pageIndex`}>
			</div>
		);
	};


});

export default Index;