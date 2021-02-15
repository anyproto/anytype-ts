import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainRelation as Header } from 'ts/component';
import { I, DataUtil, Util } from 'ts/lib';
import { dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainRelation extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

	};

	render () {
		const { match } = this.props;
		const { objectTypes } = dbStore;

		let relations = [];
		objectTypes.map((it: I.ObjectType) => { relations = relations.concat(it.relations); });

		const relation = relations.find((it: I.Relation) => { return it.relationKey == match.params.id; });

		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={{ ...relation, layout: I.ObjectLayout.Relation }} />
						</div>
						<div className="side right">
							<div className="title">{relation.name}</div>
							<div className="descr">A person with whom one has a bond of mutual affection</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
};

export default PageMainRelation;