import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ObjectPreviewBlock, Icon } from 'ts/component';

interface Props {
	items: any[];
	offsetX: number;
	canAdd?: boolean;
	onMouseEnter?: (e: any, item: any) => void;
	onMouseLeave?: (e: any, item: any) => void;
	onClick?: (e: any, item: any) => void;
	onAdd?: (e: any) => void;
};

const $ = require('jquery');

class ListTemplate extends React.Component<Props, {}> {

	public static defaultProps = {
		offsetX: 0,
		items: [],
		canAdd: false,
	};
	
	page: number = 0;

	render () {
		const { items, canAdd, onAdd } = this.props;
		const isFirst = this.page == 0;
		const isLast = this.page == this.getMaxPage();

		const Item = (item: any) => (
			<div 
				id={'item-' + item.id} 
				className="item" 
				onMouseEnter={(e: any) => { this.onMouseEnter(e, item) ; }} 
				onMouseLeave={(e: any) => { this.onMouseLeave(e, item); }}
				onClick={(e: any) => { this.onClick(e, item); }} 
			>
				<ObjectPreviewBlock rootId={item.id} />
				<div className="name">{item.templateName || `Template ${item.index + 1}`}</div>
			</div>
		);

		const ItemAdd = () => (
			<div className="item add" onClick={onAdd}>
				<Icon className="plus" />
			</div>
		);

		return (
			<div className="listTemplate">
				<div className="wrap">
					<div id="scroll" className="scroll">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} index={i} />
						))}
						{canAdd ? <ItemAdd /> : ''}
					</div>
				</div>

				<Icon id="arrowLeft" className={[ 'arrow', 'left', (isFirst ? 'dn' : '') ].join(' ')} onClick={() => { this.onArrow(-1); }} />
				<Icon id="arrowRight" className={[ 'arrow', 'right', (isLast ? 'dn' : '') ].join(' ')} onClick={() => { this.onArrow(1); }} />	
			</div>
		);
	};

	getMaxPage () {
		return Math.ceil(this.props.items.length / 2) - 1;
	};

	onMouseEnter (e: any, item: any) {
		const { onMouseEnter } = this.props;
		if (onMouseEnter) {
			onMouseEnter(e, item);
		};
	};

	onMouseLeave (e: any, item: any) {
		const { onMouseLeave } = this.props;
		if (onMouseLeave) {
			onMouseLeave(e, item);
		};
	};

	onClick (e: any, item: any) {
		const { onClick } = this.props;
		if (onClick) {
			onClick(e, item);
		};
	};

	onArrow (dir: number) {
		const { offsetX } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('#scroll');
		const arrowLeft = node.find('#arrowLeft');
		const arrowRight = node.find('#arrowRight');
		const w = node.width();
		const max = this.getMaxPage();

		this.page += dir;
		this.page = Math.min(max, Math.max(0, this.page));

		arrowLeft.removeClass('dn');
		arrowRight.removeClass('dn');

		if (this.page == 0) {
			arrowLeft.addClass('dn');
		};
		if (this.page == max) {
			arrowRight.addClass('dn');
		};

		let x = -this.page * (w + 16 + offsetX);

		scroll.css({ transform: `translate3d(${x}px,0px,0px` });
	};
	
};

export default ListTemplate;