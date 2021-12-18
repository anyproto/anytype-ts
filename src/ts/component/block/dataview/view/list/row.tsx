import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell } from 'ts/component';
import { dbStore } from 'ts/store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const $ = require('jquery');

const Row = observer(class Row extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { rootId, block, index, getView, onCellClick, onRef, style } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const idPrefix = 'dataviewCell';
		const { hideIcon } = view;
		const subId = dbStore.getSubId(rootId, block.id);

		return (
			<div className="row" style={style}>
				{relations.map((relation: any, i: number) => {
					const id = DataUtil.cellId(idPrefix, relation.relationKey, index);
					return (
						<Cell 
							key={'list-cell-' + relation.relationKey}
							elementId={id}
							ref={(ref: any) => { onRef(ref, id); }} 
							{...this.props}
							subId={subId}
							relationKey={relation.relationKey}
							viewType={I.ViewType.List}
							idPrefix={idPrefix}
							onClick={(e: any) => { onCellClick(e, relation.relationKey, index); }}
							index={index}
							isInline={true}
							showTooltip={true}
							arrayLimit={2}
						/>
					);
				})}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const first = node.find('.cellContent:not(.isEmpty)').first();

		node.find('.cellContent').removeClass('first');
		if (first.length) {
			first.addClass('first');
		};
	};

});

export default Row;