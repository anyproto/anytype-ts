import * as React from 'react';
import { I, DataUtil, focus } from 'ts/lib';
import { IconObject, Cell } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore, dbStore } from 'ts/store';

interface Props extends I.BlockComponent {
	iconSize?: number;
};

const Constant = require('json/constant.json');

@observer
class BlockFeatured extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	public static defaultProps = {
		iconSize: 24,
	};

	constructor (props: any) {
		super(props);
		
		this.onFocus = this.onFocus.bind(this);
	};

	render () {
		const { rootId, block, iconSize } = this.props;
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];
		const object = blockStore.getDetails(rootId, rootId);
		const type = dbStore.getObjectType(object.type);
		const creator = blockStore.getDetails(rootId, object.creator);
		const featured = Constant.featuredRelations.concat(object.featuredRelations).filter((it: any) => {
			return object[it];
		});

		/*
		const featured = [];

		if (type) {
			featured.push({ ...type, layout: I.ObjectLayout.ObjectType });
		};
		if (!creator._objectEmpty_) {
			featured.push(creator);
		};

		const Element = (item: any) => (
			<div className="element" onClick={(e: any) => { DataUtil.objectOpenEvent(e, item); }}>
				<IconObject size={iconSize} object={item} />
				{item.name}
			</div>
		);
		*/

		return (
			<div className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} tabIndex={0}>
				{featured.map((relationKey: any, i: any) => (
					<React.Fragment key={i}>
						{i > 0 ? <div className="bullet" /> : ''}
						<Cell 
							rootId={rootId}
							storeId={rootId}
							block={block}
							relationKey={relationKey}
							getRecord={() => { return object; }}
							viewType={I.ViewType.Grid}
							index={0}
							scrollContainer=""
							pageContainer=""
							readOnly={true}
							isInline={true}
						/>
					</React.Fragment>
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
};

export default BlockFeatured;