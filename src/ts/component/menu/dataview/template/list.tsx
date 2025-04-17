import * as React from 'react';
import $ from 'jquery';
import { Icon, PreviewObject, EmptySearch } from 'Component';
import { I, C, S, U, J, translate, keyboard, sidebar } from 'Lib';
import { observer } from 'mobx-react';

const TEMPLATE_WIDTH = 224;

const MenuTemplateList = observer(class MenuTemplateList extends React.Component<I.Menu> {

	state = {
		loading: false
	};

	node: any = null;
	n = 0;

	constructor (props: I.Menu) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onMore = this.onMore.bind(this);
		this.setCurrent = this.setCurrent.bind(this);
		this.getTemplateId = this.getTemplateId.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param, setHover } = this.props;
		const { data } = param;
		const { activeId } = data;
		const previewSize = data.previewSize || I.PreviewSize.Small;
		const templateId = this.getTemplateId();
		const items = this.getItems();
		const canWrite = U.Space.canMyParticipantWrite();

		const ItemAdd = () => (
			<div className="previewObject small">
				<div className="border" />
				<Icon className="add" />
			</div>
		);

		const Item = (item: any) => {
			const cn = [ 'item' ];
			const onMore = canWrite ? e => this.onMore(e, item) : null;

			let content = null;
			if (item.id == J.Constant.templateId.new) {
				content = <ItemAdd {...item} />;
			} else {
				content = (
					<PreviewObject
						rootId={item.id}
						size={previewSize}
						onMore={onMore}
						onContextMenu={onMore}
					/>
				);
			};

			if ((item.id == activeId) && activeId) {
				cn.push('active');
			};
			if ((item.id == templateId) && templateId) {
				cn.push('isDefault');
			};

			return (
				<div 
					id={`item-${item.id}`} 
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={() => setHover(item)}
					onMouseLeave={() => setHover(null)}
				>
					{content}
				</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				{items.length ? (
					<div className="items">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				) : <EmptySearch className="noItems" text={translate('blockDataviewNoTemplates')} />}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.props.position();
		this.load();
	};

	componentDidUpdate (): void {
		this.props.position();
		this.setCurrent();
	};

	componentWillUnmount () {
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		const { setHover, onKeyDown } = this.props;
		const items = this.getItems();

		let ret = false;

		keyboard.shortcut('arrowup, arrowleft, arrowdown, arrowright', e, (pressed: string) => {
			e.preventDefault();

			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? -1 : 1;

			this.n += dir;

			if (this.n < 0) {
				this.n = items.length - 1;
			};

			if (this.n > items.length - 1) {
				this.n = 0;
			};

			setHover(items[this.n], true);
			ret = true;
		});

		if (!ret) {
			onKeyDown(e);
		};
	};

	setCurrent () {
		const { param } = this.props;
		const { data } = param;
		const { templateId } = data;
		const items = this.getItems();

		this.n = items.findIndex(it => it.id == templateId);
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;

		const filters: I.Filter[] = [
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.Equal, value: J.Constant.typeKey.template },
			{ relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: typeId },
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];
		const keys = J.Relation.default.concat([ 'targetObjectType' ]);

		U.Data.searchSubscribe({
			subId: this.getSubId(),
			filters,
			sorts,
			keys,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, this.setCurrent);
	};

	getSubId () {
		return [ this.props.getId(), 'data' ].join('-');
	};

	getTemplateId () {
		const { param } = this.props;
		const { data } = param;
		const { getView, templateId } = data;

		let ret = '';
		let view = null;

		if (getView) {
			view = getView();
			if (view) {
				ret = view.defaultTemplateId;
			};
		};

		return ret || templateId || '';
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { noAdd, typeId } = data;
		const items = S.Record.getRecords(this.getSubId());
		const isAllowed = U.Object.isAllowedTemplate(typeId);

		if (!noAdd && isAllowed) {
			items.push({ id: J.Constant.templateId.new });
		};

		return items;
	};

	onMore (e: any, template: any) {
		const { id, param, getId } = this.props;
		const { data } = param;
		const { onSetDefault, route, typeId, getView } = data;
		const item = U.Common.objectCopy(template);
		const node = $(`#item-${item.id}`);
		const templateId = this.getTemplateId();

		e.preventDefault();
		e.stopPropagation();

		if (!item.targetObjectType) {
			item.targetObjectType = typeId;
		};

		if (S.Menu.isOpen('dataviewTemplateContext', item.id)) {
			S.Menu.close('dataviewTemplateContext');
			return;
		};

		S.Menu.closeAll(J.Menu.dataviewTemplate, () => {
			S.Menu.open('dataviewTemplateContext', {
				menuKey: item.id,
				element: `#${getId()} #item-more-${item.id}`,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				subIds: J.Menu.dataviewTemplate,
				onOpen: () => node.addClass('active'),
				onClose: () => node.removeClass('active'),
				rebind: this.rebind,
				parentId: id,
				data: {
					template: item,
					isView: !!getView,
					typeId,
					templateId,
					route,
					onDuplicate: object => U.Object.openConfig(object, {}),
					onSetDefault,
				}
			});
		});
	};

	onClick (e: any, template: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect, typeId } = data;
		const item = U.Common.objectCopy(template);

		if (!item.targetObjectType) {
			item.targetObjectType = typeId;
		};

		if (item.id != J.Constant.templateId.new) {
			data.templateId = item.id;
		};

		if (onSelect) {
			onSelect(item);
		};
	};

	beforePosition () {
		const { param, getId } = this.props;
		const { data } = param;
		const { fromBanner } = data;

		if (!fromBanner) {
			return;
		};

		const obj = $(`#${getId()}`);
		const list = obj.find('.items');
		const items = this.getItems();
		const length = items.length;
		const isPopup = keyboard.isPopup();
		const container = U.Common.getPageContainer(isPopup);
		const ww = container.width();

		let columns = Math.max(1, Math.floor(ww / TEMPLATE_WIDTH));
		if (columns > length) {
			columns = length;
		};

		list.css({ 'grid-template-columns': `repeat(${columns}, 1fr)` });
	};

});

export default MenuTemplateList;
