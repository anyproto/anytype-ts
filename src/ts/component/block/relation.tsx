import * as React from 'react';
import { Cell, Icon } from 'Component';
import { I, C, DataUtil, Util, focus, analytics, Relation } from 'Lib';
import { observer } from 'mobx-react';
import { menuStore, detailStore, dbStore, blockStore } from 'Store';

interface Props extends I.BlockComponent {}

const Constant = require('json/constant.json');
const $ = require('jquery');

const BlockRelation = observer(class BlockRelation extends React.Component<Props, {}> {

	refCell: any = null;

	constructor (props: any) {
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
		const { content } = block;
		const { key } = content;
		const relation = dbStore.getRelationByKey(key);
		const idPrefix = 'blockRelationCell' + block.id;
		const id = Relation.cellId(idPrefix, key, '0');
		const allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]) && relation && !relation.isReadonlyValue;

		return (
			<div className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{!relation ? 
				(
					<div className="sides">
						<div className={[ 'info', 'noValue', (!readonly ? 'canEdit' : '') ].join(' ')} onClick={this.onMenu}>New relation</div>
					</div>
				) : 
				(
					<div className="sides">
						<div className="info">
							{!allowedValue ? <Icon className="lock" /> : ''}
							<div className="name">{relation.name}</div>
						</div>
						<div 
							id={id} 
							className={[ 'cell', DataUtil.relationClass(relation.format), (!readonly && allowedValue ? 'canEdit' : '') ].join(' ')} 
							onClick={this.onCellClick}
						>
							<Cell 
								ref={(ref: any) => { this.refCell = ref; }}
								rootId={rootId}
								subId={rootId}
								block={block}
								relationKey={relation.relationKey}
								getRecord={() => { return detailStore.get(rootId, rootId, [ relation.relationKey ], true); }}
								viewType={I.ViewType.Grid}
								readonly={readonly || !allowedValue}
								index={0}
								idPrefix={idPrefix}
								menuClassName="fromBlock"
								onCellChange={this.onCellChange}
								bodyContainer={Util.getBodyContainer(isPopup ? 'popup' : 'page')}
								pageContainer={Util.getCellContainer(isPopup ? 'popup' : 'page')}
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
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
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
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
				rootId: rootId,
				blockId: block.id,
				filter: '',
				menuIdEdit: 'blockRelationEdit',
				skipIds: [],
				ref: 'block',
				addCommand: (rootId: string, blockId: string, relationId: string) => {
					const relation = dbStore.getRelationById(relationId);

					C.ObjectRelationAdd(rootId, [ relationId ], (message: any) => {
						if (!message.error.code) {
							C.BlockRelationSetKey(rootId, block.id, relation.relationKey, () => { 
								menuStore.close('relationSuggest'); 
							});
						};
					});
				},
			}
		});
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { rootId } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);
		const details = [ 
			{ key: relationKey, value: Relation.formatValue(relation, value, true) },
		];
		C.ObjectSetDetails(rootId, details, callBack);

		const key = Relation.checkRelationValue(relation, value) ? 'ChangeRelationValue' : 'DeleteRelationValue';	
		analytics.event(key, { type: 'block' });
	};

	onCellClick (e: any) {
		const { block } = this.props;

		if (this.refCell) {
			this.refCell.onClick(e);
		};

		focus.set(block.id, { from: 0, to: 0 });
	};

});

export default BlockRelation;