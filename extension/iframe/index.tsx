import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const Index = observer(class Index extends React.Component<I.PageComponent> {

	render () {
		return (
			<div className="page pageIndex" />
		);
	};

});

export default Index;