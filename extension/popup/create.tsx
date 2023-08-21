import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Input, Button, Icon, Select, Loader, Error } from 'Component';
import { I, C, UtilData, UtilCommon, UtilObject } from 'Lib';
import { dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

import Util from '../lib/util';

interface State {
	error: string;
	isLoading: boolean;
};

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	spaceId = '';
	typeId = '';
	refName: any = null;
	refSpace: any = null;
	refType: any = null;
	state = {
		isLoading: false,
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onSpaceChange = this.onSpaceChange.bind(this);
		this.onTypeChange = this.onTypeChange.bind(this);
	};

	render () {
		const { isLoading, error } = this.state;

		return (
			<div className="page pageCreate">
				{isLoading ? <Loader type="loader" /> : ''}

				<form onSubmit={this.onSubmit}>
					<div className="rows">
						<div className="row">
							<Label text="Title" />
							<Input ref={ref => this.refName = ref} />
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
						<Button color="pink" className="c32" text="Save" type="input" subType="submit" onClick={this.onSubmit} />
					</div>

					<Error text={error} />
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
				{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
			],
		});
	};

	getOptions (subId: string) {
		return dbStore.getRecords(subId, '').map(id => {
			let object = detailStore.get(subId, id);
			if (object._empty_) {
				return null;
			};

			let { name } = object;

			if (object.iconEmoji) {
				object = null;
			};

			return { id, name, object };
		}).filter(it => it);
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

		Util.getCurrentTab(tab => {
			if (!tab) {
				return;
			};

			const details = {
				type: this.typeId,
				source: tab.url,
				name: this.refName.getValue(),
			};

			this.setState({ isLoading: true, error: '' });

			C.ObjectCreateBookmark(details, (message: any) => {
				this.setState({ isLoading: false });

				if (message.error.code) {
					this.setState({ error: message.error.description });
				} else {
					UtilCommon.route('/success', {});
				};
			});
		});
	};

});

export default Create;