import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);
	};

	render () {
		const prefix = Constant.extension.clipper.prefix;

		return (
			<div className={`${prefix}-page ${prefix}-pageIndex`}>
			</div>
		);
	};


});

export default Index;