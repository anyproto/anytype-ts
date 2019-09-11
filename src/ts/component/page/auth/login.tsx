import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Label, Error, TextArea, Button } from 'ts/component.tsx';

const $ = require('jquery');

interface Props {
	history: any;
};

interface State {
	error: string;
};

class PageAuthLogin extends React.Component<Props, State> {

	phraseRef: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
        super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<div className="cover c1" />
				<div id="frame" className="frame">
					<Title text="Sign in with your keychain" />
					<Label text="Type your keychain phrase or private key" />
					<Error text={error} />
							
					<TextArea ref={(ref: any) => this.phraseRef = ref} placeHolder="12 words separated by space" />
					<div className="buttons">
						<Button text="Sign in" className="orange" onClick={this.onSubmit} />
						<Button text="Back" className="grey" onClick={this.onCancel} />
					</div>
				</div>
			</div>
		);
    };

	onSubmit (e: any) {
		e.preventDefault();
		this.props.history.push('/main/index');
	};
	
	onCancel (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/select');		
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		let frame = node.find('#frame');
		
		frame.css({ marginTop: -frame.outerHeight() / 2 });
	};

};

export default PageAuthLogin;