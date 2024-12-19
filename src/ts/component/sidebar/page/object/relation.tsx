import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button } from 'Component';
import { I, S, C, sidebar, translate } from 'Lib';

import Section from 'Component/sidebar/section';

const TRACE = 'sidebarObjectRelation';

const SidebarPageObjectRelation = observer(class SidebarPageObjectRelation extends React.Component<I.SidebarPageComponent> {
	
	sectionRefs: Map<string, any> = new Map();
	id = '';

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onSetUp = this.onSetUp.bind(this);
	};

    render () {
		const rootId = this.getRootId();
		const object = this.getObject();
		const relations = this.getRelations();

        return (
			<React.Fragment>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarTypeRelation')} />
					</div>

					<div className="side right">
						<Button color="blank" text={translate('sidebarObjectRelationSetUp')} className="simple" onClick={this.onSetUp} />
					</div>
				</div>

				<div className="body customScrollbar">
					{relations.map((item, i) => (
						<Section 
							{...this.props} 
							ref={ref => this.sectionRefs.set(item.id, ref)}
							key={item.id} 
							component="object/relation"
							rootId={rootId}
							object={object}
							item={item} 
							onChange={update => {}}
						/>
					))}
				</div>
			</React.Fragment>
		);
	};

	componentDidMount (): void {
		this.load();
	};

	componentDidUpdate (): void {
		this.load();
	};

	load () {
		const { space } = S.Common;
		const { rootId } = this.props;

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		C.ObjectShow(rootId, TRACE, space, () => this.forceUpdate());
	};

	getRootId () {
		return [ this.props.rootId, TRACE ].join('-');
	};

	getObject () {
		return S.Detail.get(this.getRootId(), this.props.rootId);
	};

	getRelations () {
		const object = this.getObject();

		return S.Record.getObjectRelations(this.getRootId(), object.type);
	};

	onSetUp () {
		const object = this.getObject();

		sidebar.rightPanelSwitch('type', { rootId: object.type });
	};

});

export default SidebarPageObjectRelation;
