import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Button, IconObject, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { translate, DataUtil, Util } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { C } from '../../../lib';

interface Props extends RouteComponentProps<any> {}
interface State {}

const PageAuthShare = observer(class PageAuthShare extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);
	};

	render () {
		return (
			<div>
			</div>
		);
	};

	componentDidMount () {
		const { history, location } = this.props;
		history.push('/auth/setup/share' + location.search);
	};

});

export default PageAuthShare;