import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Loader, Title, Label, ListTemplate } from 'ts/component';
import { I, C, focus, Action } from 'ts/lib';
import { dbStore } from 'ts/store';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	items: any[];
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

class PopupTemplate extends React.Component<Props, State> {

	_isMounted: boolean = false;
	page: number = 0;
	n: number = 0;
	ref: any = null;

	state = {
		items: [],
		loading: false,
	};

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { items, loading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;
		const type = dbStore.getObjectType(typeId);

		if (loading) {
			return <Loader />;
		};

		return (
			<div className="wrapper">
				<div className="head">
					<Title text="Choose a template" />
					<Label text={`Type “${type.name}” has ${items.length} templates, use ←→ to switch and ENTER to choose`} />
				</div>

				<ListTemplate 
					ref={(ref: any) => { this.ref = ref; }}
					items={items}
					offsetX={-128}
					onClick={this.onClick} 
				/>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.load();
		focus.clear(true);

		window.setTimeout(() => {
			this.rebind();
		}, Constant.delay.popup + 100);
	};

	componentDidUpdate () {
		if (this.ref) {
			this.ref.setActive();
		};
	};

	componentWillUnmount () {
		const { items } = this.state;

		this._isMounted = false;
		this.unbind();

		for (let item of items) {
			Action.pageClose(item.id, false);
		};
	};

	unbind () {
		$(window).unbind('keyup.popupTemplate');
	};

	rebind () {
		this.unbind();
		$(window).on('keyup.popupTemplate', (e: any) => { this.onKeyUp(e); });
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.template },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: typeId },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		];

		this.setState({ loading: true });
		C.ObjectSearch(filters, sorts, [ 'id', 'templateIsBundled' ], '', 0, 0, (message: any) => {
			this.setState({ loading: false, items: message.records });
		});
	};

	onKeyUp (e: any) {
		e.preventDefault();
		e.stopPropagation();

		if (this.ref) {
			this.ref.onKeyUp(e);
		};
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		close();
		window.setTimeout(() => {
			if (onSelect) {
				onSelect(item.id);
			};
		}, Constant.delay.popup);
	};

};

export default PopupTemplate;
