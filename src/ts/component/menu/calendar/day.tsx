import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, J, keyboard, translate } from 'Lib';

const MenuCalendarDay = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, getId, position, setActive, onKeyDown } = props;
	const { data } = param;
	const { y, m, d, hideIcon, className, fromWidget, relationKey, load, onCreate, readonly } = data;
	const timestamp = U.Date.timestamp(y, m, d);
	const cn = [ 'wrap' ];
	const menuId = getId();
	const subId = [ getId(), data.subId ].join('-');
	const n = useRef(0);

	let label = d;
	let size = 16;

	if (fromWidget) {
		label = `${U.Date.date('l, M j', timestamp)}`;
		size = 18;
	};

	if (className) {
		cn.push(className);
	};

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'add') {
			onCreate?.(e);
		} else {
			U.Object.openConfig(e, item);
		};
	};

	const getItems = () => {
		const items = S.Record.getRecords(subId, [ relationKey ]);
		const current = [ d, m, y ].join('-');
		const ret = items.filter(it => U.Date.date('j-n-Y', it[relationKey]) == current);
		const relation = S.Record.getRelationByKey(relationKey);

		if (!readonly && relation && !relation.isReadonlyValue && onCreate) {
			ret.push({ id: 'add', icon: 'plus', name: translate('commonCreateNewObject') });
		};

		return ret;
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
				onMouseDown={e => onClick(e, item)}
				onMouseEnter={e => onMouseEnter(e, item)}
			>
				{icon}
				<ObjectName object={item} withPlural={true} />
			</div>
		);
	};

	const items = getItems();

	useEffect(() => {
		rebind();

		if (load) {
			load(subId, J.Constant.limit.menuRecords);
		};

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		position();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<div className={cn.join(' ')}>
			<div className="head" onClick={() => U.Object.openDateByTimestamp(relationKey, timestamp, 'config')}>
				{fromWidget ? (
					<div className="sides">
						<div className="side left">{label}</div>
						<div className="side right">
							<Icon className="expand withBackground" tooltipParam={{ text: translate('commonOpenObject') }} />
						</div>
					</div>
				) : (
					<div className="number">
						{label}
					</div>
				)}
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

}));

export default MenuCalendarDay;