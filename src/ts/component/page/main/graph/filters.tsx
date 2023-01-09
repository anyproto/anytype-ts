import * as React from 'react';
import { I } from 'Lib';
import { observer } from 'mobx-react';

const GraphFilters = observer(class PreviewObject extends React.Component<I.PageComponent> {
	
	_isMounted: boolean = false;

	render () {
		return (
			<div className="panelFilters" />
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	getItems () {
		return [];
	};

});

export default GraphFilters;