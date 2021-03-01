import * as React from 'react';
import { I, focus } from 'ts/lib';
import { IconObject } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore, dbStore } from 'ts/store';

interface Props extends I.BlockComponent {
	iconSize?: number;
};

@observer
class BlockFeatured extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	public static defaultProps = {
		iconSize: 24,
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render () {
		const { rootId, block, iconSize } = this.props;
		const { id, content } = block;
		const cn = [ 'focusable', 'c' + id ];
		const object = blockStore.getDetails(rootId, rootId);
		const type = dbStore.getObjectType(object.type);
		const creator = blockStore.getDetails(rootId, object.creator);
		const featured = [];

		if (type) {
			featured.push({ ...type, layout: I.ObjectLayout.ObjectType });
		};
		if (!creator._objectEmpty_) {
			featured.push(creator);
		};

		const Element = (item: any) => (
			<div className="element">
				<IconObject size={iconSize} object={item} />
				{item.name}
			</div>
		);

		return (
			<div className={cn.join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{featured.map((item: any, i: any) => (
					<span key={i}>
						{i > 0 ? <div className="bullet" /> : ''}
						<Element {...item} />
					</span>
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
	
	onKeyDown (e: any) {
		this.props.onKeyDown(e, '', [], { from: 0, to: 0 });
	};
	
	onKeyUp (e: any) {
		this.props.onKeyUp(e, '', [], { from: 0, to: 0 });
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
};

export default BlockFeatured;