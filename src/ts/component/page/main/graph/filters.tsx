import * as React from 'react';
import { I } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {
};

const GraphFilters = observer(class PreviewObject extends React.Component<Props, {}> {
	
	state = {
	};
	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
	};
	
	render () {
		return (
			<div className="panelFilters" />
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getItems () {
		return [];
	};

});

export default GraphFilters;