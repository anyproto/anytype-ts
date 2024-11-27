import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Checkbox, Icon } from 'Component';
import { I, S, U, translate } from 'Lib';

const SIDEBAR_WIDTH = 348;

const SidebarLayoutPreview = observer(class SidebarLayoutPreview extends React.Component<I.SidebarPageComponent> {

	node: any = null;
	object: any = {
		featuredRelations: [],
		recommendedLayout: I.ObjectLayout.Page,
		layoutAlign: I.BlockHAlign.Left,
		layoutWidth: 0,
		layoutFormat: 'page'
	};

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.getWidth = this.getWidth.bind(this);
	};

	render () {
		const { featuredRelations, recommendedLayout, layoutAlign, layoutFormat } = this.object;
		const featuredList = this.object.featuredRelations.filter(it => it != 'description');
		const withDescription = featuredRelations.includes('description');
		const cn = [
			'layoutPreview',
			U.Data.layoutClass('', recommendedLayout),
			`layoutAlign${I.BlockHAlign[layoutAlign]}`,
			U.Common.toCamelCase(`layoutFormat-${layoutFormat}`),
		];
		const isTask = U.Object.isTaskLayout(recommendedLayout);
		const isNote = U.Object.isNoteLayout(recommendedLayout);
		const isList = layoutFormat == 'list';

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
							{featuredList.map((el, idx) => {
								const relation = S.Record.getRelationByKey(el);

								return <Label text={relation?.name} key={idx} />;
							})}
						</div>
					</div>

					{isList ? (
						<div className="listHeader">
							<div className="left">
								<div className="view" />
								<div className="view" />
								<div className="view" />
							</div>
							<div className="right">
								<Icon className="search" />
								<Icon className="filter" />
								<Icon className="sort" />
								<Icon className="settings" />
								<div className="buttonPlug" />
							</div>
						</div>
					) : ''}

					<div className="layout">
						<div className="line" />
						<div className="line" />
						<div className="line" />
						<div className="line" />
						<div className="line" />
					</div>
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

});

export default SidebarLayoutPreview;
