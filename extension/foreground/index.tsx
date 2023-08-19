import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import Extension from 'json/estension.json';

class Index extends React.Component<RouteComponentProps> {

	render () {
		const prefix = Extension.clipper.prefix;

		return (
			<div className={`${prefix}-page ${prefix}-pageIndex`}>
			</div>
		);
	};

};

export default Index;