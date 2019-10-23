import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { MenuMain, Block, Smile } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	blockStore?: any;
};

@inject('blockStore')
@observer
class PageMainEdit extends React.Component<Props, {}> {
	
	state = {
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { blockStore, match } = this.props;
		const { blocks } = blockStore;
		
		return (
			<div>
				<MenuMain />
				<div className="wrapper">
					<div className="editor">
						<div className="blocks">
							<div className="title">
								<Smile icon=":family:" />
								Contacts
							</div>
							{blocks.map((item: I.Block, i: number) => ( 
								<Block key={item.header.id} {...item} />
							))}
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { blockStore } = this.props;
		
		let c = '';
		setInterval(() => {
			c += ' test content';
			
			let marks = [];
			for (let i = 0; i < 5; ++i) {
				let r = Util.rand(0, c.length - 1);
				marks.push({
					range: { from: r, to: r + 10 },
					type: Util.rand(0, 4)
				});
			};
			
			blockStore.blockUpdate({ 
				header: { id: String(Util.rand(2, 100)), type: 3, name: '', icon: '' },
				content: {
					text: c,
					style: 0,
					marks: marks,
					toggleable: false,
					markerType: 0,
					checkable: false,
					checked: false,
				}
			});
		}, 100);
	};
	
};

export default PageMainEdit;