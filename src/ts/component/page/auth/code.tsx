import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Label, Error, Input, Button } from 'ts/component.tsx';

const $ = require('jquery');

interface Props {
	history: any;
};

interface State {
	error: string;
};

class PageAuthCode extends React.Component<Props, State> {

	codeRef: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
        super(props);

		this.onSubmitCode = this.onSubmitCode.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div className="frame">
				<Title text="Welcome to Anytype!" />
				<Label text="Enter your invitation code" />
				<Error text={error} />
				
				<form onSubmit={this.onSubmitCode}>
					<Input ref={(ref: any) => this.codeRef = ref} />
					<Button text="Confirm" type="input" className="orange" />
				</form>
			</div>
		);
    };

	onSubmitCode (e: any) {
		e.preventDefault();
		
		let code: string = this.codeRef.getValue();
		
		console.log('code', code);
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ marginTop: -node.outerHeight() / 2 });
	};

};

export default PageAuthCode;