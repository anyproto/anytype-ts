import * as React from 'react';
import { Title, Label, Error, Input, Button } from 'ts/component.tsx';

interface Props {
	history: any;
};

interface State {
	error: string;
};

class PageAuthCode extends React.Component<Props, State> {
    
	state = {
		error: ''
	};

	render () {
		const { error } = this.state;
		
        return (
			<div className="frame">
				<Title text="Welcome to Anytype!" />
				<Label text="Enter your invitation code" />
				<Error text={error} />
				
				<form onSubmit={this.onSubmitCode}>
					<Input ref="code" />
					<Button text="Confirm" type="input" className="orange" />
				</form>
			</div>
		);
    };

	onSubmitCode (e: any) {
		e.preventDefault();
	};

};

export default PageAuthCode;