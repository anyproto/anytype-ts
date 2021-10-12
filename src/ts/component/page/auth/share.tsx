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
		const { cover } = commonStore;
		const { history } = this.props;

		return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<IconObject size={64} object={{ iconEmoji: '🔗' }} />
					<Title text="Adding document" />
					<Label text="Some text" />
					<Button text="Ok" onClick={() => { history.push('/main/index'); }} />
				</Frame>
			</div>
		);
	};

	componentDidMount () {
		const { history, location } = this.props;
		const param = Util.searchParam(location.search);

		C.ObjectAddWithObjectId(param.id, param.payload, () => {
		});
	};

});

export default PageAuthShare;