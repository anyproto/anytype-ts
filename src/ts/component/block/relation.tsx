import * as React from 'react';
import { Icon, Input } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, blockStore, dbStore } from 'ts/store';

interface Props extends I.BlockComponent {};

@observer
class BlockRelation extends React.Component<Props, {}> {

	ref: any = null;

	constructor (props: any) {
		super(props);

		this.onMenu = this.onMenu.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render (): any {
		const { rootId, block, readOnly } = this.props;
		const { content } = block;
		const { key } = content;
		const details = blockStore.getDetails(rootId, rootId);

		return (
			<div className="wrap">
				{!key ? 
				(
					<React.Fragment>
						<Icon className="relation" />
						<Input id={'relation-type-' + block.id} ref={(ref: any) => { this.ref = ref; }} placeHolder="New relation" onClick={this.onMenu} onKeyUp={this.onKeyUp} />
					</React.Fragment>
				) : 
				(
					<React.Fragment>
						
					</React.Fragment>
				)}
			</div>
		);
	};

	onKeyUp (e: any) {
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == 'select'; });

		menu.param.data.options = this.getItems();
		commonStore.menuUpdate('select', menu.param);
	};

	onMenu (e: any) {
		const { rootId, block } = this.props;
		const options = this.getItems();

		commonStore.menuOpen('select', {
			element: '#relation-type-' + block.id,
			offsetX: 0,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				options: options,
				onSelect: (event: any, item: any) => {
					C.BlockRelationSetKey(rootId, block.id, item.id);
				}
			}
		});
	};

	getItems () {
		const { rootId } = this.props;
		const filter = new RegExp(Util.filterFix(this.ref.getValue()), 'gi');
		const relations = dbStore.getRelations(rootId);
		
		let options: any[] = [];
		for (let relation of relations) {
			if (relation.isHidden) {
				continue;
			};
			options.push({
				id: relation.key,
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