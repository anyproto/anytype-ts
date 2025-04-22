import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, keyboard, translate } from 'Lib';

const MenuCalendarDay = observer(class MenuCalendarDay extends React.Component<I.Menu> {
	
	n = 0;

	render () {
		const { param, getId } = this.props;
		const { data } = param;
		const { y, m, d, hideIcon, className, fromWidget, relationKey } = data;
		const timestamp = U.Date.timestamp(y, m, d);
		const items = this.getItems();
		const cn = [ 'wrap' ];
		const menuId = getId();
		
		let label = d;
		let size = 16;

		if (fromWidget) {
			label = `${U.Date.date('l, M j', timestamp)}`;
			size = 18;
		};

		if (className) {
			cn.push(className);
		};

		const Item = (item) => {
			const canEdit = !item.isReadonly && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);

			let icon = null;
			if (item.icon) {
				icon = <Icon className={item.icon} />;
			} else 
			if (!hideIcon) {
				icon = (
					<IconObject 
						id={[ menuId, item.id, 'icon' ].join('-')}
						object={item} 
						size={16} 
						canEdit={canEdit}
					/>
				);
			};

			return (
				<div 
					id={`item-${item.id}`}
					className="item" 
					onMouseDown={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)}
				>
					{icon}
					<ObjectName object={item} withPlural={true} />
				</div>
			);
		};

		return (
			<div className={cn.join(' ')}>
				<div className="number" onClick={() => U.Object.openDateByTimestamp(relationKey, timestamp, 'config')}>
					<div className="inner">{label}</div>
				</div>
				<div className="items">
					{!items.length ? (
						<div className="item empty">{translate('menuDataviewObjectListEmptySearch')}</div>
					) : (
						<>
							{items.map((item, i) => (
								<Item key={i} {...item} />
							))}
						</>
					)}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount() {
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

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onCreate } = data;

		if (item.id == 'add') {
			if (onCreate) {
				onCreate();
			};
		} else {
			U.Object.openConfig(item);
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, d, m, y, relationKey, readonly, onCreate } = data;
		const items = S.Record.getRecords(S.Record.getSubId(rootId, blockId), [ relationKey ]);
		const current = [ d, m, y ].join('-');
		const ret = items.filter(it => U.Date.date('j-n-Y', it[relationKey]) == current);
		const relation = S.Record.getRelationByKey(relationKey);

		if (!readonly && relation && !relation.isReadonlyValue && onCreate) {
			ret.push({ id: 'add', icon: 'plus', name: translate('commonCreateNewObject') });
		};

		return ret;
	};

});

export default MenuCalendarDay;