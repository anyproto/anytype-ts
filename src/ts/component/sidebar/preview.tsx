import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Checkbox, Icon } from 'Component';
import { I, S, U, Relation, translate } from 'Lib';

const SIDEBAR_WIDTH = 348;

const SidebarLayoutPreview = observer(class SidebarLayoutPreview extends React.Component<I.SidebarPageComponent> {

	node: any = null;
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
				<div className={cn.join(' ')} style={{ width: this.getWidth()}}>
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
		this.show(true);
	};

	update (object: any) {
		this.object = object;
		this.forceUpdate();
	};

	show (v: boolean) {
		$(this.node).toggleClass('show', v);
	};

	getWidth () {
		const { ww } = U.Common.getWindowDimensions();

		let w = this.object.layoutWidth;
		let mw = ww - SIDEBAR_WIDTH;
		let width = 0;

		if (this.object.layoutFormat == 'list') {
			width = mw - 192;
		} else {
			const size = mw * 0.6;

			mw -= 96;
			w = (mw - size) * w;
			width = Math.max(size, Math.min(mw, size + w));
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

});

export default SidebarLayoutPreview;
