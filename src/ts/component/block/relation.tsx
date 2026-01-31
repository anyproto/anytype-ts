import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { Cell, Icon } from 'Component';
import { I, C, S, U, J, focus, analytics, Relation, keyboard, translate } from 'Lib';

const BlockRelation = observer(forwardRef<{}, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, isPopup, passParam, onKeyDown, onKeyUp } = props;
	const relationKey = block.content.key;
	const idPrefix = `blockRelationCell${block.id}`;
	const cellRef = useRef(null);
	const id = Relation.cellId(idPrefix, relationKey, rootId);
	const cn = [ 'wrap', 'focusable', `c${block.id}` ];
	const cmd = keyboard.cmdKey();
	const relation = S.Record.getRelationByKey(relationKey);
	const allowedValue = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]) && relation && !relation.isReadonlyValue;
	const isDeleted = !relation;

	if (isDeleted) {
		cn.push('isDeleted');
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;

		keyboard.shortcut(`undo, redo, ${cmd}+v, ${cmd}+x`, e, () => {
			ret = true;
		});

		if (!ret && onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		};
	};
	
	const onKeyUpHandler = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const onFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};

	const onMenu = (e: any) => {
		if (readonly) {
			return;
		};

		S.Menu.open('relationSuggest', { 
			element: `#block-${block.id}`,
			offsetX: J.Size.blockMenu,
			data: {
				rootId,
				blockId: block.id,
				filter: '',
				menuIdEdit: 'blockRelationEdit',
				ref: 'block',
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					C.ObjectRelationAdd(rootId, [ relation.relationKey ], (message: any) => {
						if (message.error.code) {
							return;
						};

						C.BlockRelationSetKey(rootId, block.id, relation.relationKey, () => { 
							S.Menu.close('relationSuggest'); 
						});

						if (onChange) {
							onChange(message);
						};
					});
				},
			}
		});
	};

	const onCellChange = (id: string, relationKey: string, value: any, callBack?: (message: any) => void) => {
		const relation = S.Record.getRelationByKey(relationKey);
		const object = S.Detail.get(rootId, rootId);
		
		C.ObjectListSetDetails([ rootId ], [ { key: relationKey, value: Relation.formatValue(relation, value, true) } ], callBack);

		if ((undefined !== object[relationKey]) && !U.Common.compareJSON(object[relationKey], value)) {
			analytics.changeRelationValue(relation, value, { type: 'block', id: 'Single' });
		};
	};

	const onCellClick = (e: any) => {
		if (passParam && passParam.onCellClick) {
			passParam.onCellClick(e);
			return;
		};

		cellRef.current?.onClick(e);
		focus.set(block.id, { from: 0, to: 0 });
	};

	let content = null;

	if (isDeleted) {
		content = (
			<div className="sides">
				<div className={[ 'info', 'noValue', (!readonly ? 'canEdit' : '') ].join(' ')} onClick={onMenu}>
					{relation ? (
						<>
							<Icon className="ghost" />
							{translate('commonDeletedRelation')}
						</>
					) : translate('menuBlockAddNewRelation')} 
				</div>
			</div>
		);
	} else {
		content = (
			<div className="sides">
				<div className="info">
					<div className="name">{relation.name}</div>
				</div>
				<div 
					id={id} 
					className={[ 'cell', Relation.className(relation.format), (!readonly && allowedValue ? 'canEdit' : '') ].join(' ')} 
					onClick={onCellClick}
				>
					<Cell 
						ref={cellRef}
						rootId={rootId}
						subId={rootId}
						block={block}
						relationKey={relation.relationKey}
						getRecord={() => S.Detail.get(rootId, rootId, [ relation.relationKey ], true)}
						viewType={I.ViewType.Grid}
						readonly={readonly || !allowedValue}
						idPrefix={idPrefix}
						onCellChange={onCellChange}
						pageContainer={U.Common.getCellContainer(isPopup ? 'popup' : 'page')}
						menuParam={{ 
							className: 'fromBlockRelation', 
							classNameWrap: 'fromBlock',
						}}
					/>
				</div>
			</div>
		);
	};

	return (
		<div className={cn.join(' ')} tabIndex={0} onKeyDown={onKeyDownHandler} onKeyUp={onKeyUpHandler} onFocus={onFocus}>
			{content}
		</div>
	);

}));

export default BlockRelation;