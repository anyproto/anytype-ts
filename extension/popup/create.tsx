import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Input, Button, Icon, Select } from 'Component';
import { I } from 'Lib';

interface State {
	error: string;
};

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		return (
			<div className="page pageCreate">
				<form onSubmit={this.onSubmit}>
					<div className="rows">
						<div className="row">
							<Label text="Title" />
							<Input />
						</div>

						<div className="row">
							<Label text="Space" />
							<Select id="select-space" value="" options={[]} />
						</div>

						<div className="row">
							<Label text="Save as" />
							<Select id="select-type" value="" options={[]} />
						</div>
					</div>

					<div className="item add">
						<Icon className="plus" />
						Add relation
					</div>

					<div className="buttons">
						<Button color="pink" className="c32" text="Save" type="input" subType="submit" />
					</div>
				</form>
			</div>
		);
	};

	onSubmit (e: any) {
		e.preventDefault();
	};

});

export default Create;