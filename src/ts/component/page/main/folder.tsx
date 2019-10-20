import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BlockDb, Smile, HeaderMainFolder as Header } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	blockStore?: any;
};

interface State {
};

@inject('blockStore')
@observer
class PageMainFolder extends React.Component<Props, State> {
	
	state = {
	};

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
	
};

export default PageMainFolder;