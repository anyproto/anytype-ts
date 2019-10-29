import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { MenuMain, Block, Smile, HeaderMainEdit as Header } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	blockStore?: any;
};

@inject('commonStore')
@inject('blockStore')
@observer
class PageMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { commonStore, blockStore, match } = this.props;
		const { blocks } = blockStore;
		
		return (
			<div>
				<Header {...this.props} />
				<MenuMain />
				<div className="wrapper">
					<div className="editor">
						<div className="blocks">
							<div className="title">
								<Smile id="main-icon" canEdit={true} size={24} icon=":family:" className={'c48 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} />
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
		
		/*
		setInterval(() => {
			let c = '';
			let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			let l = chars.length;
			for (let i = 0; i < Util.rand(500, 3000); ++i) {
				c += chars.charAt(Math.floor(Math.random() * l));
			};
			
			let marks = [];
			for (let i = 0; i < 20; ++i) {
				let r = Util.rand(0, c.length - 1);
				marks.push({
					range: { from: r, to: r + 10 },
					type: Util.rand(0, 4)
				});
			};
			
			blockStore.blockUpdate({ 
				header: { id: String(Util.rand(2, 1000)), type: 3, name: '', icon: '' },
				content: {
					text: c,
					style: Util.rand(0, 5),
					marks: marks,
					toggleable: false,
					marker: 0,
					checkable: false,
					checked: false,
				}
			});
		}, 100);
		*/
	};
	
};

export default PageMainEdit;