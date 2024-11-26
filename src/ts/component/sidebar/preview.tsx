import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Button, Checkbox } from 'Component';
import { I, S, C, U, Relation, translate, sidebar } from 'Lib';

import Section from 'Component/sidebar/section';

const SIDEBAR_WIDTH = 348;

const SidebarLayoutPreview = observer(class SidebarLayoutPreview extends React.Component<I.SidebarPageComponent> {

	node: any = null;
	object: any = {
		featuredRelations: [],
		recommendedLayout: I.ObjectLayout.Page,
		layoutAlign: I.BlockHAlign.Left,
		layoutWidth: 0,
	};

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.getWidth = this.getWidth.bind(this);
	};

	render () {
		const { featuredRelations, recommendedLayout, layoutAlign, layoutWidth } = this.object;
		const featuredList = this.object.featuredRelations.filter(it => it != 'description');
		const withDescription = featuredRelations.indexOf('description') > -1;
		const cn = [ 'layoutPreview', `layout${I.ObjectLayout[recommendedLayout]}`, `layoutAlign${I.BlockHAlign[layoutAlign]}` ];
		const isTask = recommendedLayout == I.ObjectLayout.Task;
		const isNote = recommendedLayout == I.ObjectLayout.Note;

		console.log('OBJECT: ', this.object)

		return (
			<div ref={ref => this.node = ref} className="layoutPreviewWrapper">
				<div className={cn.join(' ')} style={{ width: this.getWidth()}}>
					<div className="layoutHeader">
						{isNote ? '' : (
							<div className="titleWrapper">
								{!isTask ? <div className="icon" /> : <Checkbox readonly={true} value={false} />}
								<Title text={`${translate('commonNew')} ${this.object.name || translate('defaultNamePage')}`} />
							</div>
						)}

						{ withDescription ? <Label text={'Description'} className="description" /> : '' }

						<div className="featured">
							{featuredList.map((el, idx) => {
								const relation = S.Record.getRelationByKey(el);

								return <Label text={relation?.name} key={idx} />;
							})}
						</div>
					</div>

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
		const isList = this.object.isList;

		console.log('W: ', this.object.layoutWidth)

		let w = this.object.layoutWidth;
		let mw = ww - SIDEBAR_WIDTH;
		let width = 0;

		console.log('MW: ', mw)

		if (isList) {
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
