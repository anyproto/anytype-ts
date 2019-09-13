import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Title, Label, Error, Input, Button } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { Dispatcher } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	auth?: any;
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
		const authStore = this.props.auth;
		
        return (
			<Frame>
				<Title text="Welcome to Anytype!" />
				<Label text="Enter your invitation code" />
				<Error text={error} />
				
				Code: {authStore.code}
				
				<form onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => this.codeRef = ref} value={authStore.code} />
					<Button text="Confirm" type="input" className="orange" />
				</form>
			</Frame>
		);
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const authStore = this.props.auth;
		const code: string = this.codeRef.getValue();
		
		Dispatcher.cmd({ entity: 'auth', op: 'code', data: code });
		//this.props.history.push('/auth/notice');
	};

};

export default PageAuthCode;