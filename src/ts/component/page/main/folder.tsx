import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { UnitDb, Smile, HeaderMainFolder as Header } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	documentStore?: any;
};

interface State {
};

@inject('documentStore')
@observer
class PageMainFolder extends React.Component<Props, State> {
	
	state = {
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { documentStore, match } = this.props;
		const { documents } = documentStore;
		const document = documents.find((item: I.DocumentInterface) => { return item.id == match.params.id; });
		
		return (
			<div>
				<Header />
				
				<div className="wrapper">
					<div className="title">
						<Smile className="c48" icon={document.icon} size={24} />
						{document.name}
					</div>
					
					<UnitDb />
				</div>
			</div>
		);
	};
	
};

export default PageMainFolder;