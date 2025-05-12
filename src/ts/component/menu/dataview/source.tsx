import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, IconObject, Label } from 'Component';
import { I, C, S, U, Relation, analytics, keyboard, translate } from 'Lib';

const MenuSource = observer(class MenuSource extends React.Component<I.Menu> {
	
	n = -1;

	constructor (props: I.Menu) {
		super(props);
		
		this.save = this.save.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const items = this.getItems();
		
		const Item = (item: any) => {
			if (item.isSection) {
				return <Label className="item isSection" text={item.text || ''} />;
			};

			const canDelete = ![ 'type', 'relation' ].includes(item.id);

			let icon = null;
			if (item.customIcon) {
				icon = <div className="iconWrapper"><Icon className={item.customIcon} /></div>;
			} else {
				icon = <IconObject size={40} object={item} />;
			};

			return (
				<form id={'item-' + item.itemId} className={[ 'item' ].join(' ')} onMouseEnter={e => this.onOver(e, item)}>
					{icon}
					<div className="txt" onClick={e => this.onClick(e, item)}>
						<div className="name">{item.name}</div>
						<div className="value">{item.value}</div>
					</div>
					<div className="buttons">
						{canDelete ? <Icon className="delete" onClick={e => this.onRemove(e, item)} /> : ''}
					</div>
				</form>
			);
		};
		
		return (
			<div className="items">
				<div className="scrollWrap">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}

					{!items.length ? (
						<div className="item empty">
							<div className="inner">{translate('menuDataviewSourceSelectOneOrMoreSources')}</div>
						</div>
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onRemove (e: any, item: any) {
		if (item) {
			this.save(this.getValueIds().filter(it => it != item.id));
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { readonly } = data;
		const value = this.getValue();

		if ((![ 'type', 'relation' ].includes(item.itemId)) || readonly) {
			return;
		};

		const menuParam = {
			element: `#${getId()} #item-${item.itemId}`,
			offsetX: getSize().width,
			offsetY: -56,
			data: {},
		};

		let menuId = '';

		switch (item.itemId) {
			case 'type': {
				menuId = 'typeSuggest';
				menuParam.data = {
					canAdd: true,
					onClick: (item: any) => {
						this.save([ item.id ]);

						analytics.event('SetSelectQuery', { type: 'type' });
						close();
					}
				};
				break;
			};

			case 'relation': {
				menuId = 'relationSuggest';
				menuParam.data = {
					menuIdEdit: 'blockRelationEdit',
					skipCreate: true,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						this.save([ relation.id ]);

						if (!value.length) {
							analytics.event('SetSelectQuery', { type: 'relation' });
						};

						close();
					}
				};
				break;
			};
		};

		S.Menu.open(menuId, menuParam);
	};

	save (value: string[], callBack?: () => void) {
		const { param } = this.props;
		const { data } = param;
		const { objectId, blockId } = data;

		C.ObjectSetSource(objectId, value, () => {
			if (callBack) {
				callBack();
			};

			this.forceUpdate();
		});
	};

	getValue () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, objectId } = data;

		return [].
			concat(Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type)).
			concat(Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Relation));
	};

	getValueIds () {
		return this.getValue().map(it => it.id);
	};

	getItems () {
		const value = this.getValue();

		let items = [];

		if (!value.length) {
			items = [
				{
					isSection: true,
					text: translate('menuDataviewSourceEmptySourceLabel'),
				},
				{
					id: 'type',
					itemId: 'type',
					name: translate('commonObjectType'),
					customIcon: 'puzzle',
					relationFormat: I.RelationType.Object,
					layout: I.ObjectLayout.Relation,
					value: translate('commonNone'),
				},
				{
					id: 'relation',
					itemId: 'relation',
					name: translate('blockNameRelation'),
					relationFormat: I.RelationType.Relations,
					layout: I.ObjectLayout.Relation,
					value: translate('commonNone'),
				},
			];
		} else {
			value.forEach(it => {
				if (U.Object.isTypeLayout(it.layout)) {
					items.push({
						...it,
						itemId: 'type',
						name: translate('commonObjectType'),
						value: U.Object.name(it),
					});
				} else {
					items.push({ ...it, itemId: it.id, value: translate('commonAll') });
				};
			});
		};
		return items;
	};

});

export default MenuSource;
