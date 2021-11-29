import * as React from 'react';
import { Cell } from 'ts/component';
import { I, C, DataUtil, Util, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, detailStore, dbStore, blockStore } from 'ts/store';

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
		this.optionCommand = this.optionCommand.bind(this);
	};

	render (): any {
		const { rootId, block, readonly, isPopup } = this.props;
		const { content } = block;
		const { key } = content;
		const relation = dbStore.getRelation(rootId, rootId, key);
		const idPrefix = 'blockRelationCell' + block.id;
		const id = DataUtil.cellId(idPrefix, key, '0');
		const allowedValue = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]) && relation && !relation.isReadonlyValue;

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
							{relation.name}
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
								storeId={rootId}
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
								pageContainer={Util.getPageContainer(isPopup ? 'popup' : 'page')}
								optionCommand={this.optionCommand}
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
			onKeyDown(e, '', [], { from: 0, to: 0 });
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
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
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationAdd(rootId, relation, (message: any) => {
						if (message.error.code) {
							return;
						};

						C.BlockRelationSetKey(rootId, block.id, message.relation.relationKey, () => { 
							menuStore.close('relationSuggest'); 
						});
					});
				},
			}
		});
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: DataUtil.formatRelationValue(relation, value, true) },
		];
		C.BlockSetDetails(rootId, details, callBack);
	};

	onCellClick (e: any) {
		const { block, readonly } = this.props;

		if (readonly) {
			return;
		};

		if (this.refCell) {
			this.refCell.onClick(e);
		};

		focus.set(block.id, { from: 0, to: 0 });
	};

	optionCommand (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void) {
		switch (code) {
			case 'add':
				C.ObjectRelationOptionAdd(rootId, relationKey, option, callBack);
				break;

			case 'update':
				C.ObjectRelationOptionUpdate(rootId, relationKey, option, callBack);
				break;

			case 'delete':
				C.ObjectRelationOptionDelete(rootId, relationKey, option.id, callBack);
				break;
		};
	};

});

export default BlockRelation;