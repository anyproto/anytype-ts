import * as React from 'react';
import { Cell, Icon } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { detailStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Relation {
	rootId: string;
	block: I.Block;
	isFeatured: boolean;
	classNameWrap?: string;
	readonly?: boolean;
	canEdit?: boolean;
	canFav?: boolean;
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
		const { rootId, block, relationKey, canEdit, canFav, readonly, format, name, isHidden, isFeatured, classNameWrap, onEdit, onRef, onFav, onCellClick, onCellChange, optionCommand } = this.props;

		const id = DataUtil.cellId(PREFIX, relationKey, '0');
		const fcn = [ 'fav' ];
		const tooltip = isFeatured ? 'Remove from featured relations' : 'Add to featured relations';
		const cn = [ 'item', 'sides' ];

		if (isHidden) {
			cn.push('isHidden');
		};
		if (canFav) {
			cn.push('canFav');
		};
		if (isFeatured) {
			fcn.push('active');
		};

		return (
			<div className={cn.join(' ')}>
				<div 
					id={`item-${relationKey}`} 
					className={[ 'info', (canEdit ? 'canEdit' : '') ].join(' ')} 
					onClick={(e: any) => { onEdit(e, relationKey); }}
				>
					{readonly ? <Icon className="lock" /> : ''}
					{name}
				</div>
				<div
					id={id} 
					className={[ 'cell', DataUtil.relationClass(format), (!readonly ? 'canEdit' : '') ].join(' ')} 
					onClick={(e: any) => { onCellClick(e, relationKey, 0); }}
				>
					<Cell 
						ref={(ref: any) => { onRef(id, ref); }} 
						rootId={rootId}
						storeId={rootId}
						block={block}
						relationKey={relationKey}
						getRecord={() => { return detailStore.get(rootId, rootId, [ relationKey ]); }}
						viewType={I.ViewType.Grid}
						index={0}
						idPrefix={PREFIX}
						menuClassName="fromBlock"
						menuClassNameWrap={classNameWrap}
						scrollContainer={Util.getScrollContainer('menuBlockRelationView')}
						pageContainer={Util.getPageContainer('menuBlockRelationView')}
						readonly={readonly}
						onCellChange={onCellChange}
						optionCommand={optionCommand}
					/>
					<Icon className={fcn.join(' ')} onClick={(e: any) => { onFav(e, relationKey); }} tooltip={tooltip} />
				</div>
			</div>
		);
    };

};

export default MenuItemRelationView;