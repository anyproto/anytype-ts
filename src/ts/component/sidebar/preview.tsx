import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Title, Label, Checkbox, Icon } from 'Component';
import { I, S, U, J, Relation, translate } from 'Lib';

const SidebarLayoutPreview = observer(class SidebarLayoutPreview extends React.Component<I.SidebarPageComponent> {

	node: any = null;
	refPreview = null;
	frame = 0;
	object: any = {
		recommendedLayout: I.ObjectLayout.Page,
		layoutAlign: I.BlockHAlign.Left,
		layoutWidth: 0,
		layoutFormat: 'page',
		defaultView: I.ViewType.Grid,
	};

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.getWidth = this.getWidth.bind(this);
	};

	render () {
		const { recommendedLayout, layoutAlign, layoutFormat, defaultView } = this.object;
		const featured = this.getFeatured();
		const withDescription = featured.map(it => it.relationKey).includes('description');
		const filtered = featured.filter(it => it.relationKey != 'description');
		const isTask = U.Object.isTaskLayout(recommendedLayout);
		const isNote = U.Object.isNoteLayout(recommendedLayout);
		const isList = layoutFormat == 'list';

		const cn = [
			'layoutPreview',
			`layoutAlign${I.BlockHAlign[layoutAlign]}`,
			`defaultView${I.ViewType[defaultView]}`,
			U.Data.layoutClass('', recommendedLayout),
			U.Common.toCamelCase(`layoutFormat-${layoutFormat}`),
		];

		return (
			<div ref={ref => this.node = ref} className="layoutPreviewWrapper">
				<div ref={ref => this.refPreview = ref} className={cn.join(' ')}>
					<div className="layoutHeader">
						{isNote ? '' : (
							<div className="titleWrapper">
								{!isTask ? <div key={`sidebar-preview-icon-${layoutFormat}`} className="icon" /> : <Checkbox readonly={true} value={false} />}
								<Title text={this.object.name ? `${translate('commonNew')} ${this.object.name}` : translate('defaultNameType')} />
							</div>
						)}

						{withDescription ? <Label text={'Description'} className="description" /> : ''}

						<div className="featured">
							{filtered.map((item, idx) => <Label text={item.name} key={idx} />)}
						</div>
					</div>

					{isList ? (
						<div className="listHeader">
							<div className="left">{this.insertEmtpyNodes('view', 3)}</div>

							<div className="right">
								{[ 'search', 'filter', 'sort', 'settings' ].map((cn, i) => (
									<Icon key={i} className={cn} />
								))}
								<div className="buttonPlug" />
							</div>
						</div>
					) : ''}

					{this.renderLayout()}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.resize();

		$(window).off('resize.sidebarPreview').on('resize.sidebarPreview', () => this.resize());
	};

	componentDidUpdate (): void {
		this.resize();	
	};

	componentWillUnmount (): void {
		$(window).off('resize.sidebarPreview');
	};

	update (object: any) {
		this.object = object;
		this.forceUpdate();
	};

	show (v: boolean) {
		$(this.node).toggleClass('show', v);
	};

	getWidth () {
		const { layoutWidth, layoutFormat } = this.object;

		let mw = this.getNodeWidth();
		let width = 0;

		if (layoutFormat == 'list') {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			width = Math.max(size, Math.min(mw, size + (mw - size) * layoutWidth));
		};

		return Math.max(300, width);
	};

	renderLayout () {
		const { layoutFormat, defaultView } = this.object;

		let content = null;

		if (layoutFormat == 'page') {
			content = this.insertEmtpyNodes('line', 5);
		} else {
			switch (Number(defaultView)) {
				case I.ViewType.Board: {
					content = (
						<React.Fragment>
							<div className="group">
								<div className="headerPlug" />
								{this.insertEmtpyNodes('item', 1)}
							</div>

							<div className="group">
								<div className="headerPlug" />
								{this.insertEmtpyNodes('item', 3)}
							</div>

							<div className="group">
								<div className="headerPlug" />
								{this.insertEmtpyNodes('item', 2)}
							</div>
						</React.Fragment>
					);
					break;
				};

				case I.ViewType.Calendar: {
					content = this.insertEmtpyNodes('day', 28, { height: this.getWidth() / 7 });
					break;
				};

				default: {
					content = this.insertEmtpyNodes('line', 5);
					break;
				};
			};
		};

		return <div key={`layout-${layoutFormat}-${defaultView}`} className="layout">{content}</div>;
	};

	getFeatured () {
		return Relation.getArrayValue(this.object.recommendedFeaturedRelations).map(key => S.Record.getRelationById(key)).filter(it => it);
	};

	insertEmtpyNodes (className, count, style?: any) {
		return Array(count).fill(null).map((el, i) => <div style={style || {}} className={className} key={i} />);
	};

	getNodeWidth (): number {
		const { isPopup } = this.props;
		const container = U.Common.getPageContainer(isPopup);

		let width = container.width();
		if (isPopup) {
			width -= J.Size.sidebar.right;
		} else {
			const refSidebar = S.Common.getRef('sidebarRight');
			width += $(refSidebar?.node).width();
		};
		return width;
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			$(this.node).css({ width: this.getNodeWidth() });
			$(this.refPreview).css({ width: this.getWidth() });
		});
	};

});

export default SidebarLayoutPreview;
