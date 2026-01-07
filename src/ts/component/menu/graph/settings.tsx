import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, J, U, keyboard, translate, analytics } from 'Lib';
import { MenuItemVertical, DragHorizontal } from 'Component';

const MenuGraphSettings = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, onKeyDown, setActive, getId, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { storageKey } = data;
	const { graphDepth } = J.Constant.limit;
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const menuContext = useRef(null);
	const [ dummy, setDummy ] = useState(0);

	const snaps = [];

	for (let i = 1; i <= graphDepth; i++) {
		snaps.push(i / graphDepth);
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
			setActive(item);
			onOver(e, item);
		};
	};

	const onOver = (e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.graphSettings);
			return;
		};

		const options = getTypeOptions();
		const width = getSize().width;

		let menuId = '';

		const menuParam: any = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			vertical: I.MenuDirection.Center,
			isSub: true,
			width,
			offsetX: width,
			className,
			classNameWrap,
			onOpen: context => menuContext.current = context,
			rebind,
			parentId: id,
			data: {
				...data,
			},
		};

		switch (item.id) {
			case 'types': {
				menuId = 'select';

				menuParam.data = Object.assign(menuParam.data, {
					options,
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.graphSettings, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onDragMove = (id: string, v: number) => {
		const node = $(nodeRef.current);
		const value = node.find(`#value-${id}`);

		if (id == 'depth') {
			v = getDepth(v);
		};

		value.text(v);	
	};

	const onDragEnd = (id: string, v: number) => {
		const values = getValues();

		if (id == 'depth') {
			values[id] = getDepth(v);
		} else {
			values[id] = v;
		};

		analytics.event('GraphSettings', { id, count: values[id] });
		save(values);
	};

	const getTypeOptions = () => {
		const layouts = U.Object.getGraphSkipLayouts();
		const values = getValues();
		const onSwitch = (id: string, v: boolean) => {
			if (v) {
				values.filterTypes = values.filterTypes.filter(it => it != id);
			} else {
				values.filterTypes.push(id);
			};

			save(values);
			menuContext.current?.getChildRef()?.updateOptions(getTypeOptions());
		};

		return S.Record.getTypes().
			filter(it => !layouts.includes(it.recommendedLayout) && ![ J.Constant.typeKey.template ].includes(it.uniqueKey)).
			map(it => ({ 
				...it,
				object: it, 
				withSwitch: true,
				switchValue: !values.filterTypes.includes(it.id),
				onSwitch: (e, v: boolean) => onSwitch(it.id, v),
			}));
	};

	const onSwitch = (id: string) => {
		const values = getValues();
		values[id] = !values[id];
		save(values);

		analytics.event('GraphSettings', { id });

		if (id == 'typeEdges') {
			$(window).trigger('updateGraphData');
		};
	};

	const save = (values: I.GraphSettings) => {
		S.Common.graphSet(storageKey, values);
		setDummy(dummy + 1);
	};

	const getDepth = (v: number) => {
		return Math.max(1, Math.floor(v * J.Constant.limit.graphDepth));
	};

	const getKey = () => {
		return String(props.param.data.storageKey);
	};

	const getValues = () => {
		const ret: any = S.Common.getGraph(getKey());

		ret.filterTypes = ret.filterTypes || [];

		return ret;
	};

	const getSections = (): any[] => {
		const { config } = S.Common;
		const { param } = props;
		const { data } = param;
		const { allowLocal } = data;
		const values = getValues();

		let sections: any[] = [
			{ 
				name: translate('commonAppearance'), children: [
					{ id: 'label', name: translate('menuGraphSettingsTitles') },
					{ id: 'marker', name: translate('menuGraphSettingsArrows') },
					{ id: 'icon', name: translate('menuGraphSettingsIcons') },
					{ id: 'preview', name: translate('menuGraphSettingsPreview') },
					{ id: 'cluster', name: translate('menuGraphSettingsCluster') },
				] 
			},
			{ 
				name: translate('menuGraphSettingsShowOnGraph'), children: [
					{ id: 'link', name: translate('menuGraphSettingsLinks') },
					{ id: 'relation', name: translate('menuGraphSettingsRelations') },
					{ id: 'orphan', name: translate('menuGraphSettingsUnlinkedObjects') },
					{ id: 'typeEdges', name: translate('menuGraphSettingsTypeEdges') },
				] 
			},
		];

		if (allowLocal) {
			const children: any[] = [ 
				{ id: 'local', name: translate('menuGraphSettingsLocal') },
			];

			if (values.local) {
				children.push({ id: 'depth', name: translate('menuGraphSettingsDepth'), withDrag: true });
			};

			sections.push({ children });
		};

		sections.push({ 
			children: [
				{ id: 'types', name: translate('menuGraphSettingsTypes'), arrow: true },
			]
		});

		sections = sections.map(s => {
			s.children = s.children.filter(it => it).map(c => {
				if (!c.arrow) {
					c.withSwitch = true;
					c.switchValue = values[c.id];
					c.onSwitch = () => onSwitch(c.id);
				};
				return c;
			});
			return s;
		});

		return sections;
	};

	const getItems = () => {
		let items = [];
		for (const section of sections) {
			if (section.name) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};

		return items;
	};

	const values = getValues();
	const sections = getSections();

	const Item = (item: any) => {
		if (item.withDrag) {
			return (
				<div id={`item-${item.id}`} className="item withDrag">
					<div className="flex">
						<div className="name">{item.name}</div>
						<div id={`value-${item.id}`} className="value">{values[item.id]}</div>
					</div>
					<div className="drag">
						<DragHorizontal 
							value={values[item.id] / graphDepth} 
							snaps={snaps}
							strictSnap={true}
							onMove={(e: any, v: number) => onDragMove(item.id, v)}
							onEnd={(e: any, v: number) => onDragEnd(item.id, v)} 
						/>
					</div>
				</div>
			);
		} else {
			return (
				<MenuItemVertical 
					{...item} 
					onMouseEnter={e => onMouseEnter(e, item)} 
					onClick={e => onSwitch(item.id)} 
				/>
			);
		};
	};

	const Section = (item: any) => (
		<div className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((item: any, i: number) => <Item key={i} {...item} />)}
			</div>
		</div>
	);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		setActive();
	});

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onOver,
	}), []);

	return (
		<div ref={nodeRef}>
			{sections.map((item: any, i: number) => (
				<Section key={i} {...item} />
			))}
		</div>
	);

}));

export default MenuGraphSettings;