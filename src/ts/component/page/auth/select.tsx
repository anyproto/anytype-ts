import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

const $ = require('jquery');

interface Props extends RouteComponentProps<any> {};
interface State {};

class PageAuthSelect extends React.Component<Props, State> {

	constructor (props: any) {
        super(props);

		this.onRegister = this.onRegister.bind(this);
		this.onLogin = this.onLogin.bind(this);
	};
	
	render () {
        return (
			<div>
				<div className="cover c3" />
				<Header />
				<Footer />
				
				<div className="frame">
					<Title text="Organize everything" />
					<Label text="With Anytype you can write notes and documents, manage tasks, share files and save important content from the web." />
								
					<div className="buttons">
						<Button text="Login" type="input" className="orange" onClick={this.onLogin} />
						<Button text="Sign up" type="input" className="grey" onClick={this.onRegister} />
					</div>
				</div>
			</div>
		);
    };

	onRegister (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/code');
	};
	
	onLogin (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/login');
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		let frame = node.find('.frame');
		
		frame.css({ marginTop: -frame.outerHeight() / 2 });
	};

};

export default PageAuthSelect;