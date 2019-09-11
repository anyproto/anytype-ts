import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Error, Input, Button } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { AuthStore } from 'ts/store';

const $ = require('jquery');

interface Props extends RouteComponentProps<any> {
	auth?: AuthStore;
};

interface State {
	error: string;
};

@inject('auth')
@observer
class PageAuthCode extends React.Component<Props, State> {

	codeRef: any;
	state = {
		error: ''
	};
	
	constructor (props: any) {
        super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { error } = this.state;
		const authStore = this.props.auth as AuthStore;
		
        return (
			<div id="frame" className="frame">
				<Title text="Welcome to Anytype!" />
				<Label text="Enter your invitation code" />
				<Error text={error} />
						
				<form onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => this.codeRef = ref} value={authStore.code} />
					<Button text="Confirm" type="input" className="orange" />
				</form>
			</div>
		);
    };

	onSubmit (e: any) {
		e.preventDefault();
		
		const authStore = this.props.auth as AuthStore;
		const code: string = this.codeRef.getValue();
		
		authStore.setCode(code);
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		node.css({ marginTop: -node.outerHeight() / 2 });
	};

};

export default PageAuthCode;