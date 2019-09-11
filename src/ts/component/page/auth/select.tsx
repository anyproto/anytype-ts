import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Error, Input, Button } from 'ts/component';

const $ = require('jquery');

interface Props extends RouteComponentProps<any> {
};

interface State {
	error: string;
};

class PageAuthSelect extends React.Component<Props, State> {

	codeRef: any;

	state = {
		error: ''
	};
	
	constructor (props: any) {
        super(props);

		this.onRegister = this.onRegister.bind(this);
		this.onLogin = this.onLogin.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
        return (
			<div>
				<div className="cover c1" />
				<div id="frame" className="frame">
					<Title text="Organize everything" />
					<Label text="With Anytype you can write notes and documents, manage tasks, share files and save important content from the web." />
							
					<div className="buttons">
						<Button text="Get your ID" type="input" className="orange" onClick={this.onRegister} />
						<Button text="Sign in" type="input" className="grey" onClick={this.onLogin} />
					</div>
				</div>
			</div>
		);
    };

	onRegister (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/register');
	};
	
	onLogin (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/login');
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		let frame = node.find('#frame');
		
		frame.css({ marginTop: -frame.outerHeight() / 2 });
	};

};

export default PageAuthSelect;