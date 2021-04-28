import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, focus } from 'ts/lib';
import { Cell } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore, dbStore } from 'ts/store';

interface Props extends I.BlockComponent {
	iconSize?: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const PREFIX = 'blockFeatured';

@observer
class BlockFeatured extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	cellRefs: Map<string, any> = new Map();

	public static defaultProps = {
		iconSize: 24,
	};

	constructor (props: any) {
		super(props);
		
		this.onFocus = this.onFocus.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { rootId, block, iconSize, isPopup } = this.props;
		const object = blockStore.getDetails(rootId, rootId);
		const featured = (object[Constant.relationKey.featured] || []).filter((it: any) => {
			return (it != Constant.relationKey.description) && object[it];
		});

		return (
			<div className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} tabIndex={0}>
				{featured.map((relationKey: any, i: any) => {
					const id = DataUtil.cellId(PREFIX, relationKey, 0);
					return (
						<React.Fragment key={i}>
							{i > 0 ? <div className="bullet" /> : ''}
							<span id={id}>
								<Cell 
									ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
									rootId={rootId}
									storeId={rootId}
									block={block}
									relationKey={relationKey}
									getRecord={() => { return object; }}
									viewType={I.ViewType.Grid}
									index={0}
									scrollContainer={Util.getEditorScrollContainer(isPopup ? 'popup' : 'page')}
									pageContainer={Util.getEditorPageContainer(isPopup ? 'popup' : 'page')}
									iconSize={iconSize}
									readOnly={false}
									isInline={true}
									idPrefix={PREFIX}
									onCellChange={this.onCellChange}
									onMouseEnter={(e: any) => { this.onMouseEnter(e, relationKey); }}
									onMouseLeave={this.onMouseLeave}
								/>
							</span>
						</React.Fragment>
					);
				})}
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

	onCellClick (e: any, relationKey: string, index: number) {
		const { rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (!relation || relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId(PREFIX, relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any) {
		const { rootId } = this.props;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);
		const details = [ 
			{ key: relationKey, value: DataUtil.formatRelationValue(relation, value) },
		];
		C.BlockSetDetails(rootId, details);
	};

	onMouseEnter (e: any, relationKey: string) {
		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const cell = $('#' + DataUtil.cellId(PREFIX, relationKey, 0));
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		Util.tooltipShow(relation.name, cell, I.MenuDirection.Top);
	};

	onMouseLeave (e: any) {
		Util.tooltipHide(false);
	};
	
};

export default BlockFeatured;