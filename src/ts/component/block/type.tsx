import * as React from 'react';
import { IconObject, Filter } from 'ts/component';
import { I, C, Util } from 'ts/lib';
import { dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};
interface State {
	filter: string;
};

@observer
class BlockType extends React.Component<Props, State> {

	ref: any = null;
	state = {
		filter: '',
	};

	constructor (props: any) {
		super(props);
		
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render (): any {
		const { filter } = this.state;

		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page);
		if (filter) {
			const reg = new RegExp(Util.filterFix(filter), 'gi');

			types = types.filter((it: any) => {
				let ret = false;
				if (it.name && it.name.match(reg)) {
					ret = true;
					it._sortWeight_ = 100;
				} else 
				if (it.description && it.description.match(reg)) {
					ret = true;
					it._sortWeight_ = 10;
				};
				return ret; 
			});

			types.sort((c1: any, c2: any) => {
				if (c1._sortWeight_ > c2._sortWeight_) return -1;
				if (c1._sortWeight_ < c2._sortWeight_) return 1;
				return 0;
			});
		};

		const Item = (item: any) => {
			return (
				<div className="item" onClick={(e: any) => { this.onClick(e, item); }}>
					<IconObject size={48} iconSize={32} object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
					<div className="info">
						<div className="txt">
							<div className="name">{item.name}</div>
							<div className="descr">{item.description}</div>
						</div>
						<div className="line" />
					</div>
				</div>
			);
		};
		
		return (
			<div>
				<Filter ref={(ref: any) => { this.ref = ref; }} placeHolderFocus="Filter types..." onChange={this.onFilterChange} />

				{types.map((item: any) => (
					<Item key={item.id} {...item} />
				))}
			</div>
		);
	};

	onClick (e: any, item: any) {
		const { rootId } = this.props;

		C.BlockObjectTypeSet(rootId, item.id);
	};

	onFilterChange (e: any) {
		this.setState({ filter: this.ref.getValue() });
	};
	
};

export default BlockType;