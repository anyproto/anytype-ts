import * as React from 'react';
import { I, Util } from 'Lib';

class PageAuthShare extends React.Component<I.PageComponent> {

	render () {
		return (
			<div />
		);
	};

	componentDidMount () {
		const { location } = this.props;
		Util.route('/auth/setup/share' + location.search);
	};

};

export default PageAuthShare;