import * as React from 'react';
import { Icon, Input, Cell } from 'ts/component';
import { I, C, DataUtil, Util, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore, dbStore } from 'ts/store';

interface Props extends I.BlockComponent {};

const Constant = require('json/constant.json');

@observer
class BlockRelation extends React.Component<Props, {}> {

	refInput: any = null;
	refCell: any = null;

	constructor (props: any) {
		super(props);

		this.onMenu = this.onMenu.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
	};

	render (): any {
		const { rootId, block, readOnly } = this.props;
		const { content } = block;
		const { key } = content;
		const details = blockStore.getDetails(rootId, rootId);
		const relations = dbStore.getRelations(rootId, rootId);
		const relation = relations.find((it: any) => { return it.relationKey == key; });
		const isNew = (block.fields || {}).isNew;
		const placeHolder = isNew ? 'New relation' : 'Relation';
		const idPrefix = 'blockRelationCell';
		const id = DataUtil.cellId(idPrefix, key, '0');

		return (
			<div className="wrap">
				{!relation ? 
				(
					<div className="sides">
						<div className="info">
							<Icon className="relation default" />
							<Input 
								id={'relation-type-' + block.id} 
								ref={(ref: any) => { this.refInput = ref; }} 
								placeHolder={placeHolder} 
								onClick={this.onMenu} 
								onKeyUp={this.onKeyUp} 
							/>
						</div>
					</div>
				) : 
				(
					<div className="sides">
						<div className="info">
							<Icon className={'relation c-' + DataUtil.relationClass(relation.format)} />
							<div className="name">{relation.name}</div>
						</div>
						<div 
							id={id} 
							className={[ 'cell', 'c-' + DataUtil.relationClass(relation.format), 'canEdit' ].join(' ')} 
							onClick={this.onCellClick}
						>
							<Cell 
								ref={(ref: any) => { this.refCell = ref; }}
								rootId={rootId}
								storeId={rootId}
								block={block}
								relationKey={relation.relationKey}
								getRecord={() => { return details; }}
								viewType={I.ViewType.Grid}
								readOnly={readOnly}
								index={0}
								idPrefix={idPrefix}
								menuClassName="fromBlock"
								onCellChange={this.onCellChange}
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	onKeyUp (e: any) {
		const { block } = this.props;
		const isNew = (block.fields || {}).isNew;
		const menuId = isNew ? 'select' : 'blockRelationList';

		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == menuId; });

		if (menu) {
			if (isNew) {
				menu.param.data.options = this.getItems();
			} else {
				menu.param.data.filter = this.refInput.getValue();
			};
			commonStore.menuUpdate(menuId, menu.param);
		};
	};

	onMenu (e: any) {
		const { rootId, block, readOnly } = this.props;
		const isNew = (block.fields || {}).isNew;
		const menuId = isNew ? 'select' : 'blockRelationList';

		let param: any = {
			element: '#block-' + block.id,
			offsetX: Constant.size.blockMenu,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {}
		};

		if (isNew) {
			param = Object.assign(param, { width: 320 });
			param.data = Object.assign(param.data, {
				options: this.getItems(),
				onSelect: (event: any, item: any) => {
					if (item.id == 'add') {
						window.setTimeout(() => { this.onMenuAdd(); }, Constant.delay.menu);
					} else {
						C.BlockRelationSetKey(rootId, block.id, item.id);
					};
				}
			});
		} else {
			param.data = Object.assign(param.data, {
				relationKey: '',
				readOnly: true,
				rootId: rootId,
				filter: this.refInput.getValue(),
				onSelect: (item: any) => {
					C.BlockRelationSetKey(rootId, block.id, item.relationKey);
				}
			});
		};

		commonStore.menuOpen(menuId, param);
	};

	onMenuAdd () {
		const { rootId, block, readOnly } = this.props;

		commonStore.menuOpen('blockRelationEdit', { 
			element: '#block-' + block.id,
			type: I.MenuType.Vertical,
			offsetX: Constant.size.blockMenu,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				relationKey: '',
				readOnly: readOnly,
				rootId: rootId,
				blockId: block.id, 
			},
		});
	};

	onCellChange (id: string, key: string, value: any) {
		const { rootId } = this.props;

		C.BlockSetDetails(rootId, [ 
			{ key: key, value: value },
		]);
	};

	onCellClick (e: any) {
		const { block } = this.props;

		if (this.refCell) {
			this.refCell.onClick(e);
		};

		focus.set(block.id, { from: 0, to: 0 });
	};

	getItems () {
		const { rootId } = this.props;
		const filter = new RegExp(Util.filterFix(this.refInput.getValue()), 'gi');
		const relations = dbStore.getRelations(rootId, rootId);
		
		let options: any[] = [];
		for (let relation of relations) {
			if (relation.isHidden) {
				continue;
			};
			options.push({
				id: relation.relationKey,
				icon: 'relation c-' + DataUtil.relationClass(relation.format),
				name: relation.name,
			});
		};

		if (filter) {
			options = options.filter((it: any) => {
				return it.name.match(filter);
			});
		};

		options.unshift({ id: 'add', icon: 'add', name: 'Add new' });
		return options;
	};

};

export default BlockRelation;