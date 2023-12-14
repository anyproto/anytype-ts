import * as React from 'react';
import { observer } from 'mobx-react';
import { Button, Input, Error } from 'Component';
import { I, C, Storage, UtilRouter } from 'Lib';
import { extensionStore } from 'Store';
import Util from '../lib/util';

interface State {
	error: string;
};

const Challenge = observer(class Challenge extends React.Component<I.PageComponent, State> {

	ref: any = null;
	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { error } = this.state;

		return (
			<form className="page pageChallenge" onSubmit={this.onSubmit}>
				<Input ref={ref => this.ref = ref} placeholder="Challenge" />

				<div className="buttons">
					<Button type="input" color="pink" className="c32" text="Authorize" />
				</div>

				<Error text={error} />
			</form>
		);
	};

	onSubmit (e: any) {
		e.preventDefault();

		C.AccountLocalLinkSolveChallenge(extensionStore.challengeId, this.ref?.getValue().trim(), (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			Storage.set('appKey', message.appKey);
			Util.authorize(message.appKey, () => UtilRouter.go('/create', {}));
		});
	};

});

export default Challenge;