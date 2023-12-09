import * as React from 'react';
import { observer } from 'mobx-react';
import { Button, Input } from 'Component';
import { I, C } from 'Lib';
import { extensionStore } from 'Store';

interface State {
	error: string;
};

const Challenge = observer(class Challenge extends React.Component<I.PageComponent, State> {

	ref: any = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		return (
			<form className="page pageChallenge" onSubmit={this.onSubmit}>
				<Input ref={ref => this.ref = ref} />
				<Button type="input" color="pink" text="Ok" />
			</form>
		);
	};

	onSubmit (e: any) {
		e.preventDefault();

		C.AccountLocalLinkSolveChallenge(extensionStore.challengeId, this.ref?.getValue(), (message: any) => {
			console.log(message);
		});
	};

});

export default Challenge;