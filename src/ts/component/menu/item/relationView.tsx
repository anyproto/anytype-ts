import * as React from 'react';
import { Cell, Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';

interface Props extends I.Relation {
	rootId: string;
	block: I.Block;
	isFeatured: boolean;
	onEdit(e: any, relationKey: string): void;
	onRef(id: string, ref: any): void;
	onFav(e: any, item: any): void;
	onCellClick(e: any, relationKey: string, index: number): void;
	onCellChange(id: string, relationKey: string, value: any, callBack?: (message: any) => void): void;
	optionCommand(code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void): void;
};

const PREFIX = 'menuBlockRelationView';

class MenuItemRelationView extends React.Component<Props, {}> {

	render () {
		const { rootId, block, relationKey, format, name, isHidden, isFeatured, onEdit, onRef, onFav, onCellClick, onCellChange, optionCommand } = this.props;

		const id = DataUtil.cellId(PREFIX, relationKey, '0');
		const fcn = [ 'fav', (isFeatured ? 'active' : '') ];
		const tooltip = isFeatured ? 'Remove from featured relations' : 'Add to featured relations';

		return (
			<div className={[ 'item', 'sides', (isHidden ? 'isHidden' : '') ].join(' ')}>
				<div id={`item-${relationKey}`} className="info" onClick={(e: any) => { onEdit(e, relationKey); }}>
					<div className="name">{name}</div>
				</div>
				<div
					id={id} 
					className={[ 'cell', DataUtil.relationClass(format), 'canEdit' ].join(' ')} 
					onClick={(e: any) => { onCellClick(e, relationKey, 0); }}
				>
					<Cell 
						ref={(ref: any) => { onRef(id, ref); }} 
						rootId={rootId}
						storeId={rootId}
						block={block}
						relationKey={relationKey}
						getRecord={() => { return blockStore.getDetails(rootId, rootId); }}
						viewType={I.ViewType.Grid}
						index={0}
						idPrefix={PREFIX}
						menuClassName="fromBlock"
						scrollContainer={Util.getEditorScrollContainer('menuBlockRelationView')}
						pageContainer={Util.getEditorPageContainer('menuBlockRelationView')}
						readOnly={false}
						onCellChange={onCellChange}
						optionCommand={optionCommand}
					/>
				</div>
				<Icon className={fcn.join(' ')} onClick={(e: any) => { onFav(e, relationKey); }} tooltip={tooltip} />
			</div>
		);
    };

};

export default MenuItemRelationView;