import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, ObjectName, IconObject } from 'Component';
import { I, C, S, Relation, translate } from 'Lib';

const SidebarSectionTypeConflict = observer(class SidebarSectionTypeConflict extends React.Component<I.SidebarSectionComponent> {
	conflictIds: string[] = [];

	constructor (props: I.SidebarSectionComponent) {
		super(props);
	};

    render () {
		const items = this.getItems();

        return (
			<div className="wrap">
				<div className="titleWrap">
					<Title text={translate('sidebarRelationLocal')} />
				</div>

				<div className="items">
					{items.map((item, i) => (
						<div key={i} className="item">
							<div className="side left">
								<IconObject object={item} />
								<ObjectName object={item} />
							</div>
							<div className="side right">
								<Icon className="more" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
    };

	componentDidMount () {
		this.load();
	};

	getItems () {
		return Relation.getArrayValue(this.conflictIds).map(key => S.Record.getRelationById(key)).filter(it => it && !Relation.isSystem(it.relationKey));
	};

	load () {
		const { space } = S.Common;
		const { rootId } = this.props;

		C.ObjectTypeListConflictingRelations(rootId, space, (message) => {
			if (!message.error.code) {
				this.conflictIds = message.conflictRelationIds;
				this.forceUpdate();
			};
		});
	};
});

export default SidebarSectionTypeConflict;
