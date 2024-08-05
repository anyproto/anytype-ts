import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, U, J, translate } from 'Lib';
import { Icon } from 'Component';
import Item from './item';

const WidgetViewGallery = observer(class WidgetViewGallery extends React.Component<I.WidgetViewComponent> {

	_isMounted = false;
	node = null;
	page = 0;
	maxPages = 0;

	constructor (props: I.WidgetViewComponent) {
		super(props);

		this.maxPages = this.getMaxPages();

		this.onAll = this.onAll.bind(this);
	};

	render (): React.ReactNode {
		const { block, subId, getView } = this.props;
		const view = getView();
		const items = this.getItems();

		return (
			<div ref={ref => this.node = ref} className="body">
				<div id="wrap" className="wrap">
					<div id="items" className="items">
						{items.map(item => {
							let content = null;
							if (item.id == 'blank') {
								content = (
									<div key={`widget-${block.id}-item-${item.id}`} className="item blank" onClick={this.onAll}>
										{item.name}
									</div>
								);
							} else {
								content = (
									<Item 
										{...this.props}
										key={`widget-${block.id}-item-${item.id}`} 
										subId={subId}
										id={item.id} 
										hideIcon={view.hideIcon}
									/>
								);
							};
							return content;
						})}
					</div>
				</div>
				<div id="arrow-left" className="arrowWrap left" onClick={() => this.onArrow(-1)}>
					<Icon />
				</div>
				<div id="arrow-right" className="arrowWrap right" onClick={() => this.onArrow(1)}>
					<Icon />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		const { block } = this.props;

		this.resize();
		this.checkArrows();

		$(window).off(`sidebarResize.${block.id}`).on(`sidebarResize.${block.id}`, () => this.resize());
	};

	componentDidUpdate () {
		this.maxPages = this.getMaxPages();	

		if (this.page > this.maxPages) {
			this.page = this.maxPages;
			this.setPage(false);
		};

		this.resize();
		this.checkArrows();
	};

	componentWillUnmount(): void {
		this._isMounted = false;
	};

	getItems () {
		const { getRecordIds, subId } = this.props;
		const items = [].concat(getRecordIds().map(id => S.Detail.get(subId, id, J.Relation.sidebar)));

		items.push({ id: 'blank', name: translate('widgetShowAll') });

		return items;
	};

	getMaxPages () {
		return Math.ceil(this.getItems().length / 2) - 1;
	};

	onArrow (dir: number) {
		this.page += dir;
		this.page = Math.max(0, this.page);
		this.page = Math.min(this.page, this.maxPages);

		this.setPage(true);
		this.checkArrows();
	};

	checkArrows () {
		const node = $(this.node);
		const arrowLeft = node.find('#arrow-left');
		const arrowRight = node.find('#arrow-right');

		this.page > 0 ? arrowLeft.show() : arrowLeft.hide();
		this.page < this.maxPages ? arrowRight.show() : arrowRight.hide();
	};

	setPage (animate: boolean) {
		const node = $(this.node);
		const itemObj = node.find('#items');
		const width = itemObj.outerWidth();

		animate ? itemObj.addClass('anim') : itemObj.removeClass('anim');
		itemObj.css({ transform: `translate3d(${-this.page * (width + 8)}px, 0px, 0px)` });
	};

	onAll (e: any) {
		const { getObject, parent } = this.props;
		const object = getObject();

		U.Object.openEvent(e, { ...object, _routeParam_: { viewId: parent.content.viewId } });
	};

	onOpen () {
		this.resize();
	};

	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			const node = $(this.node);
			const itemObj = node.find('#items');
			const items = node.find('.item');
			const width = (itemObj.outerWidth() - 8) / 2;

			items.css({ width });
			this.setPage(false);
		});
	};

});

export default WidgetViewGallery;