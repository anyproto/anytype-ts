import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Util } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};

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