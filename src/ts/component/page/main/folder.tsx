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
		const document = documents.find((item: I.Document) => { return item.id == match.params.id; });
		const unitDb: I.UnitDb = {
			views: [
				{ id: '1', name: 'All' },
				{ id: '2', name: 'Team' },
				{ id: '3', name: 'Friends' }
			],
			properties: [
				{ id: '1', name: 'Id' },
				{ id: '2', name: 'Name' },
				{ id: '3', name: 'E-mail' },
			],
			data: [
				{ id: '1', name: 'Anton Pronkin' },
				{ id: '2', name: 'Roman Khafizianov' },
				{ id: '3', name: 'Zhanna Sharipova' },
				{ id: '4', name: 'Anton Barulenkov' },
				{ id: '5', name: 'Kirill' },
			]
		};
		
		return (
			<div>
				<Header />
				
				<div className="wrapper">
					<div className="title">
						<Smile className="c48" icon={document.icon} size={24} />
						{document.name}
					</div>
					
					<UnitDb {...unitDb} />
				</div>
			</div>
		);
	};
	
};

export default PageMainFolder;