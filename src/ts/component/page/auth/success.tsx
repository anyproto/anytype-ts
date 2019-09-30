import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

interface Props extends RouteComponentProps<any> {};
interface State {};

class PageAuthSuccess extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile icon=":tada:" size={36} />
					<Title text="Congratulations!" />
					<Label text="You've created your first profile! It is stored on your device and nobody will know about it until you share it!" />
					<Button className="orange" text="Let's start!" onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

	onSubmit (e: any) {
		e.preventDefault();
		this.props.history.push('/main/index');
	};

};

export default PageAuthSuccess;