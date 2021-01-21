import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Input, IconObject, HeaderMainObjectType as Header } from 'ts/component';
import { I, C, DataUtil, translate } from 'ts/lib';
import { commonStore, blockStore, dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainObjectType extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

	};

	render () {
		const { match } = this.props;
		const { objectTypes } = dbStore;
		const objectType = objectTypes.find((it: I.ObjectType) => { return DataUtil.schemaField(it.url) == match.params.id; });
		
		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={{ ...objectType, layout: I.ObjectLayout.ObjectType }} />
						</div>
						<div className="side right">
							<div className="title">{objectType.name}</div>
							<div className="descr">{objectType.description}</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
};

export default PageMainObjectType;