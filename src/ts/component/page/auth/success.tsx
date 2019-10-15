import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
};
interface State {};

@inject('commonStore')
@observer
class PageAuthSuccess extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { commonStore, match } = this.props;
		const { cover } = commonStore;
		
		return (
			<div>
				<Cover num={cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile className="c64" icon=":tada:" size={36} />
					<Title text="Congratulations!" />
					<Label text="You've created your first profile! It is stored on your device and nobody will know about it until you share it!" />
					<Button className="orange" text="Let's start!" onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

	onSubmit (e: any) {
		this.props.history.push('/main/index');
	};

};

export default PageAuthSuccess;