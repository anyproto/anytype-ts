import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Title, Label, Checkbox, Icon, IconObject } from 'Component';
import { I, S, U, J, Relation, translate, sidebar } from 'Lib';

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
		defaultViewType: I.ViewType.Grid,
	};

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.getWidth = this.getWidth.bind(this);
		this.onClose = this.onClose.bind(this);
	};

	render () {
		const { name, pluralName, recommendedLayout, layoutAlign, layoutFormat } = this.object;
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
			`layoutAlign${I.BlockHAlign[layoutAlign]}`,
			`defaultView${I.ViewType[viewType]}`,
			U.Data.layoutClass('', recommendedLayout),
			U.Common.toCamelCase(`layoutFormat-${I.LayoutFormat[layoutFormat]}`),
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
							{filtered.map((item, idx) => (
								<div key={idx} className="featuredItem">
									<Label text={item.name} />
									<div className="bullet" />
								</div>
							))}
						</div>
					</div>

					{isFile ? <div className="filePreview" /> : ''}

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

	onClose () {
		sidebar.rightPanelToggle(false, true, this.props.isPopup);
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

		let mw = this.getNodeWidth();
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

	renderLayout () {
		const { layoutFormat, recommendedLayout } = this.object;
		const viewType = this.getViewType();

		let content = null;

		if (U.Object.isInFileLayouts(recommendedLayout)) {
			const fileRelations = Relation.getArrayValue(this.object.recommendedFileRelations).map(id => S.Record.getRelationById(id)).filter(it => it);

			content = (
				<div className="fileInfo">
					<Title text={translate('commonFileInfo')} />

					{fileRelations.map((relation, idx) => (
						<dl key={idx}>
							<dt>{relation.name}</dt>
							<dd />
						</dl>
					))}
				</div>
			);
		} else
		if (layoutFormat == I.LayoutFormat.Page) {
			content = this.insertEmtpyNodes('line', 5);
		} else {
			switch (Number(viewType)) {
				case I.ViewType.Board: {
					content = (
						<>
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
						</>
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

		return <div key={`layout-${I.LayoutFormat[layoutFormat]}-${viewType}`} className="layout">{content}</div>;
	};

	getFeatured () {
		return Relation.getArrayValue(this.object.recommendedFeaturedRelations).map(key => S.Record.getRelationById(key)).filter(it => it);
	};

	insertEmtpyNodes (className, count, style?: any) {
		return Array(count).fill(null).map((el, i) => <div style={style || {}} className={className} key={i} />);
	};

	getViewType () {
		return Number(this.object.defaultViewType) || I.ViewType.Grid;
	};

	getNodeWidth (): number {
		const { isPopup } = this.props;
		const container = U.Common.getPageFlexContainer(isPopup);
		const vw = sidebar.getVaultWidth();

		return container.width() - J.Size.sidebar.right - vw;
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
