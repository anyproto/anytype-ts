import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, S, C, U, Relation, translate, sidebar } from 'Lib';

import Section from 'Component/sidebar/section';

const SidebarLayoutPreview = observer(class SidebarLayoutPreview extends React.Component<I.SidebarPageComponent> {

	node: any = null;
	object: any = {
		name: 'Untitled',
		featuredRelations: [],
	};

	constructor (props: I.SidebarPageComponent) {
		super(props);
	};

	render () {
		const { name, featuredRelations } = this.object;
		const featuredList = featuredRelations.filter(it => it != 'description');
		const withDescription = featuredRelations.indexOf('description') > -1;

		return (
			<div ref={ref => this.node = ref} className="layoutPreviewWrapper">
				<div className="layoutPreview">
					<div className="layoutHeader">
						<div className="icon" />

						<Title text={name} />

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

});

export default SidebarLayoutPreview;
