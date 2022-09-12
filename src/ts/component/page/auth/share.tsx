import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, Util } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageComponent {};

const PageAuthShare = observer(class PageAuthShare extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<div />
		);
	};

	componentDidMount () {
		const { location } = this.props;
		Util.route('/auth/setup/share' + location.search);
	};

});

export default PageAuthShare;