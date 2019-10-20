import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BlockDb, Smile, HeaderMainFolder as Header } from 'ts/component';
import { dispatcher, I } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	blockStore?: any;
};

@inject('blockStore')
@observer
class PageMainFolder extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { blockStore, match } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.id == match.params.id; });
		const blockDb: I.BlockDb = {
			id: '',
			name: '',
			icon: '',
			view: '1',
			views: [
				{ id: '1', name: 'All', type: I.ViewType.Grid },
				{ id: '2', name: 'Team', type: I.ViewType.Grid },
				{ id: '3', name: 'Friends', type: I.ViewType.Grid }
			],
			properties: [
				{ id: '1', name: 'Id', type: I.PropertyType.Number },
				{ id: '2', name: 'Name', type: I.PropertyType.Title },
				{ id: '3', name: 'E-mail', type: I.PropertyType.Text },
			],
			data: [
				{ '1': '1', '2': 'Anton Pronkin', '3': 'pronkin@gmail.com' },
				{ '1': '2', '2': 'Roman Khafizianov', '3': 'khafizianov@gmail.com' },
				{ '1': '3', '2': 'Zhanna Sharipova', '3': 'sharipova@gmail.com' },
				{ '1': '4', '2': 'Anton Barulenkov', '3': 'barulenkov@gmail.com' },
				{ '1': '5', '2': 'Kirill', '3': 'kirill@gmail.com' },
			]
		};
		
		return (
			<div>
				<Header {...this.props} />
				
				<div className="wrapper">
					<div className="title">
						<Smile className="c48" icon={block.icon} size={24} />
						{block.name}
					</div>
					
					<div className="blocks">
						<BlockDb {...blockDb} />
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { match } = this.props;
		
		dispatcher.call('blockOpen', { id: match.params.id }, (errorCode: any, message: any) => {
		});	
	};
	
};

export default PageMainFolder;