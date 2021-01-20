import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Title, Label, IconObject, HeaderMainObjectType as Header } from 'ts/component';
import { I, C, DataUtil, translate } from 'ts/lib';
import { commonStore, blockStore, dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainObjectType extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

	};

	render () {
		const { objectTypes } = dbStore;
		
		

		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					
				</div>
			</div>
		);
	};
	
};

export default PageMainObjectType;