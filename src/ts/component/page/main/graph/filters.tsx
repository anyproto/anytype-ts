import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
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
			<div className="panelFilters">
			</div>
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

});

export default GraphFilters;