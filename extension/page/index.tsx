import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Constant from 'json/constant.json';

class Index extends React.Component<RouteComponentProps> {

	render () {
		const prefix = Constant.extension.clipper.prefix;

		return (
			<div className={`${prefix}-page ${prefix}-pageIndex`}>
			</div>
		);
	};

};

export default Index;