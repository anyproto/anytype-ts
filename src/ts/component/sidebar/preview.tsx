import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Title, Label, Checkbox, Icon, IconObject, EmptyNodes, LayoutPlug } from 'Component';
import { I, S, U, J, Relation, translate, sidebar, keyboard } from 'Lib';

const SidebarLayoutPreview = observer(class SidebarLayoutPreview extends React.Component<I.SidebarPageComponent> {

	node: any = null;
	refPreview = null;
	frame = 0;
	timeout = 0;
	object: any = {
		recommendedLayout: I.ObjectLayout.Page,
		layoutAlign: I.BlockHAlign.Left,
		layoutWidth: 0,
		layoutFormat: I.LayoutFormat.Page,
		defaultViewType: I.ViewType.List,
	};

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.getWidth = this.getWidth.bind(this);
		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { name, pluralName, recommendedLayout, layoutAlign, layoutFormat, headerRelationsLayout } = this.object;
		const viewType = this.getViewType();
		const featured = this.getFeatured();
		const withDescription = featured.map(it => it.relationKey).includes('description');
		const filtered = featured.filter(it => it.relationKey != 'description');
		const isTask = U.Object.isTaskLayout(recommendedLayout);
		const isHuman = U.Object.isInHumanLayouts(recommendedLayout);
		const isNote = U.Object.isNoteLayout(recommendedLayout);
		const isList = layoutFormat == I.LayoutFormat.List;
		const isFile = U.Object.isInFileLayouts(recommendedLayout);

		const cn = [
			'layoutPreview',
			`align${layoutAlign}`,
			`defaultView${I.ViewType[viewType]}`,
			U.Data.layoutClass('', recommendedLayout),
			U.Common.toCamelCase(`layoutFormat-${I.LayoutFormat[layoutFormat]}`),
			`featuredRelationLayout${I.FeaturedRelationLayout[headerRelationsLayout]}`,
		];

		if (isFile) {
			cn.push('isFile');
		};

		let icon = null;
		if (!isFile) {
			if (isTask) {
				icon = <Checkbox readonly={true} value={false} />;
			} else
			if (isHuman) {
				icon = <IconObject object={{ name, layout: recommendedLayout }} size={96} />;
			} else {
				icon = <Icon key={`sidebar-preview-icon-${layoutFormat}`} />;
			};
		};

		return (
			<div ref={ref => this.node = ref} className="layoutPreviewWrapper">
				<div ref={ref => this.refPreview = ref} className={cn.join(' ')}>
					<div className="layoutHeader">
						{!isNote ? (
							<div className="titleWrapper">
								{icon}
								<Title text={name || translate('defaultNamePage')} />
							</div>
						) : ''}

						{withDescription ? <Label text={'Description'} className="description" /> : ''}

						<div className="featured">
							{filtered.map((item, idx) => {
								if (headerRelationsLayout == I.FeaturedRelationLayout.Column) {
									let content: any = null;
									if (item.relationKey == 'type') {
										content = name || translate('defaultNamePage');
									} else {
										content = <EmptyNodes className="item" count={1} />;
									};

									return (
										<dl key={idx} className="featuredColumnItem">
											<dt><Label text={item.name} /></dt>
											<dd>{content}</dd>
										</dl>
									);
								};

								return (
									<div key={idx} className="featuredItem">
										<Label text={item.name} />
										<div className="bullet" />
									</div>
								);
							})}
						</div>
					</div>

					{isFile ? <div className="filePreview" /> : ''}

					{isList ? (
						<div className="listHeader">
							<div className="left">
								<EmptyNodes className="view" count={3} />
							</div>

							<div className="right">
								{[ 'search', 'filter', 'sort', 'settings' ].map((cn, i) => (
									<Icon key={i} className={cn} />
								))}
								<div className="buttonPlug" />
							</div>
						</div>
					) : ''}

					<LayoutPlug
						layoutFormat={layoutFormat}
						recommendedLayout={recommendedLayout}
						recommendedFileRelations={this.object.recommendedFileRelations}
						viewType={this.object.defaultViewType}
						layoutWidth={this.object.layoutWidth}
						isPopup={this.props.isPopup}
					/>
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

	onClose () {
		sidebar.rightPanelToggle(true, this.props.isPopup);
	};

	update (object: any) {
		this.object = object;
		this.forceUpdate();
	};

	show (v: boolean) {
		this.resize();

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const node = $(this.node);

			node.removeClass('in out');
			v ? node.addClass('in') : node.addClass('out');
			node.toggleClass('show', v);
		}, 40);
	};

	getWidth () {
		const { layoutWidth, layoutFormat } = this.object;

		let { width: mw } = this.getNodeSize();
		let width = 0;

		if (layoutFormat == I.LayoutFormat.List) {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			width = Math.max(size, Math.min(mw, size + (mw - size) * layoutWidth));
		};

		return Math.max(300, width);
	};

	getFeatured () {
		return Relation.getArrayValue(this.object.recommendedFeaturedRelations).map(key => S.Record.getRelationById(key)).filter(it => it);
	};

	getViewType () {
		return Number(this.object.defaultViewType) || I.ViewType.Grid;
	};

	getNodeSize (): { width: number; height: number } {
		const container = U.Common.getPageFlexContainer(this.props.isPopup);

		return {
			width: container.width() - J.Size.sidebar.right - 9,
			height: container.height(),
		};
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};

		this.frame = raf(() => {
			$(this.node).css(this.getNodeSize());
			$(this.refPreview).css({ width: this.getWidth() });
		});
	};

});

export default SidebarLayoutPreview;
