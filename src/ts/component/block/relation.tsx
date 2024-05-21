import * as React from 'react';
import { Cell, Icon } from 'Component';
import { I, C, UtilCommon, focus, analytics, Relation, keyboard, translate } from 'Lib';
import { observer } from 'mobx-react';
import { menuStore, detailStore, dbStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const BlockRelation = observer(class BlockRelation extends React.Component<I.BlockComponent> {

	refCell: any = null;

	constructor (props: I.BlockComponent) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
	};

	render (): any {
		const { rootId, block, readonly, isPopup } = this.props;
		const relationKey = block.content.key;
		const idPrefix = 'blockRelationCell' + block.id;
		const id = Relation.cellId(idPrefix, relationKey, rootId);
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		let relation = dbStore.getRelationByKey(relationKey);
		if (!relation) {
			relation = dbStore.getRelations().find(it => it.relationKey == relationKey);
		};

		const allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]) && relation && !relation.isReadonlyValue;
		const isDeleted = !relation;

		if (isDeleted) {
			cn.push('isDeleted');
		};

		let content = null;

		if (isDeleted) {
			content = (
				<div className="sides">
					<div className={[ 'info', 'noValue', (!readonly ? 'canEdit' : '') ].join(' ')} onClick={this.onMenu}>
						{relation ? (
							<React.Fragment>
								<Icon className="ghost" />
								{translate('commonDeletedRelation')}
							</React.Fragment>
						) : 'New relation'} 
					</div>
				</div>
			);
		} else {
			content = (
				<div className="sides">
					<div className="info">
						{!allowedValue ? <Icon className="lock" /> : ''}
						<div className="name">{relation.name}</div>
					</div>
					<div 
						id={id} 
						className={[ 'cell', Relation.className(relation.format), (!readonly && allowedValue ? 'canEdit' : '') ].join(' ')} 
						onClick={this.onCellClick}
					>
						<Cell 
							ref={ref => this.refCell = ref}
							rootId={rootId}
							subId={rootId}
							block={block}
							relationKey={relation.relationKey}
							getRecord={() => detailStore.get(rootId, rootId, [ relation.relationKey ], true)}
							viewType={I.ViewType.Grid}
							readonly={readonly || !allowedValue}
							idPrefix={idPrefix}
							menuClassName="fromBlock"
							onCellChange={this.onCellChange}
							pageContainer={UtilCommon.getCellContainer(isPopup ? 'popup' : 'page')}
						/>
					</div>
				</div>
			);
		};

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{content}
			</div>
		);
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;
		const cmd = keyboard.cmdKey();

		let ret = false;

		keyboard.shortcut(`${cmd}+z, ${cmd}+shift+z, ${cmd}+y, ${cmd}+v, ${cmd}+x`, e, () => {
			ret = true;
		});

		if (!ret && onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onFocus () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
	};

	onMenu (e: any) {
		const { rootId, block, readonly } = this.props;

		if (readonly) {
			return;
		};

		menuStore.open('relationSuggest', { 
			element: `#block-${block.id}`,
			offsetX: Constant.size.blockMenu,
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
							menuStore.close('relationSuggest'); 
						});

						if (onChange) {
							onChange(message);
						};
					});
				},
			}
		});
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { rootId } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);
		
		C.ObjectListSetDetails([ rootId ], [ { key: relationKey, value: Relation.formatValue(relation, value, true) } ], callBack);

		let key = Relation.checkRelationValue(relation, value) ? 'ChangeRelationValue' : 'DeleteRelationValue';	
		if (relationKey == 'name') {
			key = 'SetObjectTitle';
		};

		analytics.event(key, { type: 'block' });
	};

	onCellClick (e: any) {
		if (this.refCell) {
			this.refCell.onClick(e);
		};

		focus.set(this.props.block.id, { from: 0, to: 0 });
	};

});

export default BlockRelation;