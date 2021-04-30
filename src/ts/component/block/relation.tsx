import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, Cell } from 'ts/component';
import { I, C, DataUtil, Util, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, blockStore, dbStore } from 'ts/store';

interface Props extends I.BlockComponent {};

const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class BlockRelation extends React.Component<Props, {}> {

	refInput: any = null;
	refCell: any = null;

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onMenu = this.onMenu.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.optionCommand = this.optionCommand.bind(this);
	};

	render (): any {
		const { rootId, block, readOnly, isPopup } = this.props;
		const { content } = block;
		const { key } = content;
		const relation = dbStore.getRelation(rootId, rootId, key);
		const idPrefix = 'blockRelationCell' + block.id;
		const id = DataUtil.cellId(idPrefix, key, '0');

		return (
			<div className="wrap">
				{!relation ? 
				(
					<div className="sides">
						<div className="info noValue">
							<Input 
								id="input"
								ref={(ref: any) => { this.refInput = ref; }} 
								placeHolder="Create a new relation"
								onFocus={this.onFocus}
								onBlur={this.onBlur}
								onClick={this.onMenu} 
								onKeyUp={this.onKeyUp} 
							/>
						</div>
					</div>
				) : 
				(
					<div className="sides">
						<div className="info">
							<div className="name">{relation.name}</div>
						</div>
						<div 
							id={id} 
							className={[ 'cell', DataUtil.relationClass(relation.format), 'canEdit' ].join(' ')} 
							onClick={this.onCellClick}
						>
							<Cell 
								ref={(ref: any) => { this.refCell = ref; }}
								rootId={rootId}
								storeId={rootId}
								block={block}
								relationKey={relation.relationKey}
								getRecord={() => { return blockStore.getDetails(rootId, rootId); }}
								viewType={I.ViewType.Grid}
								readOnly={readOnly}
								index={0}
								idPrefix={idPrefix}
								menuClassName="fromBlock"
								onCellChange={this.onCellChange}
								scrollContainer={Util.getEditorScrollContainer(isPopup ? 'popup' : 'page')}
								pageContainer={Util.getEditorPageContainer(isPopup ? 'popup' : 'page')}
								optionCommand={this.optionCommand}
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	onKeyUp (e: any) {
		menuStore.updateData('blockRelationList', { filter: this.refInput.getValue() });
	};

	onFocus () {
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		input.attr({ placeHolder: 'Relation search' });
	};

	onBlur () {
		const node = $(ReactDOM.findDOMNode(this));
		const input = node.find('#input');

		input.attr({ placeHolder: 'Create a new relation' });
	};

	onMenu (e: any) {
		const { rootId, block } = this.props;

		menuStore.open('blockRelationList', {
			element: '#block-' + block.id,
			offsetX: Constant.size.blockMenu,
			offsetY: 4,
			data: {
				relationKey: '',
				rootId: rootId,
				blockId: block.id,
				filter: this.refInput.getValue(),
				onSelect: (item: any) => {
					C.BlockRelationSetKey(rootId, block.id, item.relationKey);
				}
			}
		});
	};

	onCellChange (id: string, relationKey: string, value: any) {
		const { rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: DataUtil.formatRelationValue(relation, value) },
		];
		C.BlockSetDetails(rootId, details);
	};

	onCellClick (e: any) {
		const { block } = this.props;

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

};

export default BlockRelation;