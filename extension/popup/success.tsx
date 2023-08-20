import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Frame } from 'Component';
import { I, UtilCommon } from 'Lib';

interface State {
	error: string;
};

const Success = observer(class Success extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		return (
			<div className="page pageSuccess">
				<Frame>
					<Label className="bold" text={UtilCommon.sprintf('"%s" is saved!', 'Wiki-Capybara')} />
					<Label text="The quick brown fox jumps over the lazy dog" />

					<div className="buttons">
						<Button color="blank" className="c32" text="Open in app" onClick={this.onOpen} />
					</div>
				</Frame>
			</div>
		);
	};

	onOpen () {
	};

});

export default Success;