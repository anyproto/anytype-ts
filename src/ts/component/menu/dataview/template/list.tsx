import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical, PreviewObject } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, Action, UtilData } from 'Lib';
import { dbStore } from 'Store';
import Constant from 'json/constant.json';

class MenuTemplateList extends React.Component<I.Menu> {

	state = {
		isLoading: false,
	};

	n = -1;
	items: any = [];

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const items = this.getItems();

		return (
			<div>
				{this.items.map((item: any, i: number) => (
					<PreviewObject
						key={i}
						rootId={item.id}
						onClick={e => this.onClick(e, item)}
					/>
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.load(true);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { newTemplateId } = data;

		const fixed: any[] = [ { id: Constant.templateId.blank, name: translate('commonBlank') } ];
		const bottom: any[] = [ { id: newTemplateId, name: translate('blockDataviewNewTemplate'), icon: 'plus' } ];

		return !this.items.length ? fixed.concat(bottom) : fixed.concat(this.items).concat(bottom);
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { typeId, defaultTemplateId, newTemplateId } = data;
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.template },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		const dataMapper = it => ({
			...it,
			typeId,
			withMore: (it.id != newTemplateId),
			caption: (it.id == defaultTemplateId) ? translate('commonDefault') : '',
			isDefault: (it.id == defaultTemplateId),
			isBlank: (it.id == Constant.templateId.blank),
		});

		if (clear) {
			this.setState({ loading: true });
		};

		UtilData.search({
			filters,
			sorts,
			limit: Constant.limit.menuRecords,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat((message.records || []).map((it: any) => {
				it.name = String(it.name || UtilObject.defaultName('Page'));
				return it;
			}));

			this.items = this.items.map(dataMapper);

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	onClick (e: any, item: any) {
		console.log('CLICK!')
	};

	onMouseEnter (e: any, item: any) {
		this.onOver(e, item);
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onOver } = data;

		if (!keyboard.isMouseDisabled) {
			// this.props.setActive(item, false);
		};

		if (onOver) {
			// onOver();
		};
	};

};

export default MenuTemplateList;
