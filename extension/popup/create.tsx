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
		const spaceOptions = [
			{ id: '1', name: '1' },
			{ id: '2', name: '2' },
			{ id: '3', name: '3' },
		];

		const typeOptions = [
			{ id: '1', name: '1' },
			{ id: '2', name: '2' },
			{ id: '3', name: '3' },
		];

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
							<Select 
								id="select-space" 
								value="1" 
								options={spaceOptions} 
								menuParam={{
									horizontal: I.MenuDirection.Center,
									vertical: I.MenuDirection.Center,
								}}
							/>
						</div>

						<div className="row">
							<Label text="Save as" />
							<Select 
								id="select-type" 
								value="1" 
								options={typeOptions} 
								menuParam={{
									horizontal: I.MenuDirection.Center,
									vertical: I.MenuDirection.Center,
								}}
							/>
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