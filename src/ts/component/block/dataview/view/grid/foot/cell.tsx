import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import * as I from 'Interface';


interface Props extends I.ViewComponent, I.ViewRelation {
	rootId?: string;
	block?: I.Block;
};

interface Ref {
	calculate: () => void;
};

const FootCell = forwardRef<Ref, Props>((props, ref) => {

	const { rootId, block, relationKey, getView } = props;
	const [ result, setResult ] = useState<any>(null);
	const nodeRef = useRef(null);
	const menuContextRef = useRef(null);
	const relation = S.Record.getRelationByKey(relationKey);

	useEffect(() => calculate());

	useImperativeHandle(ref, () => ({
		calculate,
	}));

	if (!relation) {
		return <div />;
	};

	const view = getView();
	const viewRelation = view?.getRelation(relationKey);
	const cn = [ 'cellFoot', `align${viewRelation?.align}` ];
	const formulaType = viewRelation?.formulaType || I.FormulaType.None;
	const option: any = Relation.formulaByType(relationKey, relation.format).find(it => it.id == String(formulaType)) || {};
	const name = option.short || option.name || '';
	const subId = [ rootId, block.id, 'total' ].join('-');
	const records = S.Record.getRecords(subId, [ relationKey ], true);

	records.forEach(record => {
		const value = record[relationKey];
	});

	const calculate = () => {
		if (!view) {
			return;
		};

		const newResult = Dataview.getFormulaResult(subId, viewRelation);

		if (newResult !== result) {
			setResult(newResult);
		};
	};

	const onSelect = (e: any) => {
		const id = Relation.cellId('foot', relationKey, '');
		const options = U.Menu.getFormulaSections(relationKey);

		if (formulaType == I.FormulaType.None) {
			return;
		};

		S.Menu.closeAll([], () => {
			S.Menu.open('select', {
				element: `#${id}`,
				horizontal: I.MenuDirection.Center,
				onOpen,
				subIds: [ 'select2' ],
				data: {
					options,
					noScroll: true, 
					noVirtualisation: true,
					onOver,
					onSelect: (e: any, item: any) => onChange(item.id),
				}
			});
		});

		Preview.tooltipHide();
	};

	const onOpen = (context: any) => {
		const object = S.Detail.get(rootId, rootId, []);

		menuContextRef.current = context;
		window.setTimeout(() => onMouseEnter(), 10);

		analytics.event('ClickGridFormula', { format: relation.format, objectType: object.type });
	};

	const onOver = (e: any, item: any) => {
		if (!menuContextRef.current) {
			return;
		};

		if (!item.arrow) {
			S.Menu.closeAll([ 'select2' ]);
			return;
		};

		const options = Relation.formulaByType(relationKey, relation.format).filter(it => it.section == item.id);

		S.Menu.closeAll([ 'select2' ], () => {
			const ctx = menuContextRef.current;
			if (!ctx) {
				return;
			};

			S.Menu.open('select2', {
				component: 'select',
				element: `#${ctx.getId()} #item-${U.Common.esc(item.id)}`,
				offsetX: ctx.getSize().width,
				vertical: I.MenuDirection.Center,
				isSub: true,
				rebind: ctx.ref?.rebind,
				parentId: ctx.props.id,
				data: {
					rootId,
					options,
					onSelect: (e: any, item: any) => {
						onChange(item.id);
						menuContextRef.current?.close();
					},
				}
			});
		});
	};

	const onChange = (id: string) => {
		const item = view.getRelation(relationKey);
		const object = S.Detail.get(rootId, rootId, []);

		C.BlockDataviewViewRelationReplace(rootId, block.id, view.id, item.relationKey, { 
			...item, 
			formulaType: Number(id) || 0,
		});

		analytics.event('ChangeGridFormula', { type: id, format: relation.format, objectType: object.type });
	};

	const onMouseEnter = () => {
		if (keyboard.isDragging) {
			return;
		};

		if (formulaType == I.FormulaType.None) {
			return;
		};

		const node = nodeRef.current;

		U.Dom.addClass(node, 'hover');

		if ((result === null) || S.Menu.isOpen()) {
			return;
		};

		const t = Preview.tooltipCaption(name, result);
		if (t) {
			Preview.tooltipShow({ text: t, element: nodeRef.current, typeY: I.MenuDirection.Top });
		};
	};

	const onMouseLeave = () => {
		U.Dom.removeClass(nodeRef.current, 'hover');
		Preview.tooltipHide();
	};

	return (
		<div 
			ref={nodeRef}
			id={Relation.cellId('foot', relationKey, '')} 
			className={cn.join(' ')}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div className="cellContent" onClick={onSelect}>
				<div className="flex">
					{formulaType != I.FormulaType.None ? (
						<div className="result">
							<span className="name">{name}</span>
							<span className="value">{result}</span>
						</div>
					) : ''}
				</div>
			</div>
		</div>
	);

});

export default FootCell;