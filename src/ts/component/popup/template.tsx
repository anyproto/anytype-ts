import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, ObjectPreviewBlock, Loader, Title, Label, ListTemplate } from 'ts/component';
import { I, C, keyboard } from 'ts/lib';

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

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { items, loading } = this.state;

		if (loading) {
			return <Loader />;
		};

		return (
			<div className="wrapper">
				<div className="head">
					<Title text="Choose a template" />
					<Label text="Type “Friend” has 3 templates, use ←→ to switch and ENTER to choose" />
				</div>

				<ListTemplate 
					ref={(ref: any) => { this.ref = ref; }}
					items={items}
					offsetX={-128}
					onMouseEnter={this.onMouseEnter}
					onMouseLeave={this.onMouseLeave}
					onClick={this.onClick} 
				/>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.load();

		window.setTimeout(() => {
			this.rebind();
		}, Constant.delay.popup + 100);
	};

	componentDidUpdate () {
		this.setActive();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
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
		C.ObjectSearch(filters, sorts, '', 0, 0, (message: any) => {
			this.setState({ loading: false, items: message.records });
		});
	};

	onKeyUp (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { items } = this.state;

		keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
			const dir = pressed == 'arrowleft' ? -1 : 1;
			this.ref.n += dir;

			if (this.ref.n < 0) {
				this.ref.n = items.length - 1;
			};
			if (this.ref.n > items.length - 1) {
				this.ref.n = 0;
			};

			this.ref.page = Math.floor(this.ref.n / 2);
			this.ref.onArrow(0);
			this.setActive();
		});

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			this.onClick(e, items[this.n]);
		});
	};

	onMouseEnter (e: any, item: any) {
		this.n = this.state.items.findIndex((it: any) => { return it.id == item.id; });
		this.setActive();
	};

	onMouseLeave (e: any, item: any) {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');
	};

	setActive () {
		const { items } = this.state;
		const item = items[this.n];
		if (!item) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');
		node.find('#item-' + item.id).addClass('hover');
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
