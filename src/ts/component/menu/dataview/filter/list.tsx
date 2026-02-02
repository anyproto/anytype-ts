import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, J, analytics, translate } from 'Lib';
import { MenuItemVertical } from 'Component';
import Group from 'Component/block/dataview/filters/group';

const MenuFilterList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, getSize, onKeyDown, setActive } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, getView, loadData, isInline, getTarget, readonly } = data;
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

	const rebind = () => {
		const obj = $(`#${getId()} .content`);

		obj.off('click').on('click', () => S.Menu.closeAll(J.Menu.cell));

		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getAdvancedFilter = () => {
		const view = getView();

		if (!view) {
			return null;
		};

		return view.filters.find((f: I.Filter) => [ I.FilterOperator.And, I.FilterOperator.Or ].includes(f.operator)) || null;
	};

	const onDelete = () => {
		const view = getView();
		const filter = getAdvancedFilter();

		if (!view || !filter) {
			return;
		};

		const object = getTarget();

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ filter.id ], () => {
			loadData(view.id, 0);
		});

		S.Menu.close('dataviewFilterList');

		analytics.event('RemoveFilter', {
			objectType: object.type,
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
			/>
			<div className="bottom">
				<MenuItemVertical id="delete" name={translate('menuDataviewFilterDeleteFilter')} icon="remove" onClick={onDelete} />
			</div>
		</div>
	);

}));

export default MenuFilterList;
