import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Input, Button, Icon, Select } from 'Component';
import { I, UtilData, UtilCommon } from 'Lib';
import { dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	spaceId = '';
	typeId = '';
	refSpace: any = null;
	refType: any = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onSpaceChange = this.onSpaceChange.bind(this);
		this.onTypeChange = this.onTypeChange.bind(this);
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
							<Select 
								id="select-space" 
								ref={ref => this.refSpace = ref}
								value={this.spaceId} 
								options={this.getOptions(Constant.subId.space)}
								onChange={this.onSpaceChange}
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
								ref={ref => this.refType = ref}
								value={this.typeId} 
								options={this.getOptions(Constant.subId.type)}
								onChange={this.onTypeChange}
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

	componentDidMount(): void {
		this.loadSpaces();
		this.loadTypes();
	};

	componentDidUpdate (): void {
		const spaces = this.getOptions(Constant.subId.space);
		const types = this.getOptions(Constant.subId.type);

		if (this.refSpace && spaces.length) {
			this.refSpace.setOptions(spaces);
			this.refSpace.setValue(this.spaceId || spaces[0].id);
		};

		if (this.refType && types.length) {
			this.refType.setOptions(types);
			this.refType.setValue(this.typeId || types[0].id);
		};
	};

	loadSpaces () {
		UtilData.searchSubscribe({
			subId: Constant.subId.space,
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.space },
			],
			ignoreWorkspace: true,
		});
	};

	loadTypes () {
		UtilData.searchSubscribe({
			subId: Constant.subId.type,
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.type },
			],
		});
	};

	getOptions (subId: string) {
		return dbStore.getRecords(subId, '').map(id => {
			const object = detailStore.get(subId, id);
			return { id, name: object.name, object };
		});
	};

	onTypeChange (id: string): void {
		this.typeId = id;
		this.forceUpdate();
	};

	onSpaceChange (id: string): void {
		this.spaceId = id;
		this.forceUpdate();
	};

	onSubmit (e: any) {
		e.preventDefault();

		UtilCommon.route('/success', {});
	};

});

export default Create;