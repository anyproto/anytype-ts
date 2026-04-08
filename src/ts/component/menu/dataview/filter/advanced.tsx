import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { MenuItemVertical } from 'Component';
import Group from 'Component/block/dataview/filters/group';
import * as I from 'Interface';

const MenuFilterAdvanced = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, onKeyDown, setActive, position } = props;
	const { data } = param;
	const { rootId, blockId, getView, loadData, isInline, getTarget, readonly } = data;
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

	const rebind = () => {
		const obj = U.Dom.select('.content', U.Dom.get(getId()));

		if (obj) {
			obj.onclick = () => S.Menu.closeAll(J.Menu.cell);
		};

		unbind();
		U.Dom.addEvent(window, 'keydown', onKeyDown);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDown);
	};

	const getAdvancedFilter = () => {
		const view = getView();
		if (!view) {
			return null;
		};

		const filters = Dataview.getFilteredFilters(view.filters);
		return filters.find(it => Dataview.isAdvancedFilter(it));
	};

	const onDelete = () => {
		const view = getView();
		const filter = getAdvancedFilter();

		if (!view || !filter) {
			return;
		};

		const object = getTarget();
		const rel = S.Record.getRelationByKey(filter.relationKey);

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ filter.id ], () => {
			loadData(view.id, 0);
		});

		S.Menu.close('dataviewFilterAdvanced');

		analytics.event('RemoveFilter', {
			objectType: object.type,
			relationKey: filter.relationKey, 
			format: rel?.format,
			embedType: analytics.embedType(isInline)
		});
	};

	const filter = getAdvancedFilter();

	useEffect(() => {
		rebind();

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.cell);
		};
	}, []);

	useEffect(() => {
		position();
		setActive();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => [],
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
	}), []);

	if (!filter) {
		return (
			<div ref={nodeRef} className="wrap">
				<div className="items">
					<div className="item empty">
						<div className="inner">{translate('menuDataviewFilterListEmpty')}</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div ref={nodeRef} className="wrap">
			<Group
				rootId={rootId}
				blockId={blockId}
				filter={filter}
				depth={0}
				getView={getView}
				getTarget={getTarget}
				isInline={isInline}
				loadData={loadData}
				readonly={isReadonly}
				onDelete={onDelete}
				position={position}
			/>
			<div className="bottom">
				<MenuItemVertical id="delete" name={translate('menuDataviewFilterDeleteFilter')} iconParam={{ name: 'menu/action/remove' }} onClick={onDelete} />
			</div>
		</div>
	);

});

export default MenuFilterAdvanced;
