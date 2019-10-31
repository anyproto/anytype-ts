import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { MenuMain, Block, Smile, HeaderMainEdit as Header } from 'ts/component';
import { I, Util } from 'ts/lib'; 
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	blockStore?: any;
};

const $ = require('jquery');

@inject('commonStore')
@inject('blockStore')
@observer
class PageMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { commonStore, blockStore, match } = this.props;
		const { tree } = blockStore;
		
		let n = 0;
		
		return (
			<div>
				<Header {...this.props} />
				<MenuMain />
				<div className="wrapper">
					<div className="editor">
						<div className="title">
							<Smile id="main-icon" canEdit={true} size={24} icon=":family:" className={'c48 ' + (commonStore.menuIsOpen('smile') ? 'active' : '')} />
							Contacts
						</div>
						<div className="blocks">
							{tree.map((item: I.Block, i: number) => { 
								if (item.header.type == I.BlockType.Text) {
									if (item.content.marker == I.MarkerType.Number) {
										n++;
									} else {
										n = 0;
									};
								};
								
								return <Block key={item.header.id} {...item} number={n} />
							})}
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	wrapBlockTree (rootId: string, list: I.Block[]) {
		let ret: any = [];
		for (let item of list) {
			if (!item.header.id || (rootId != item.header.parentId)) {
				continue;
			};
			if (ret.find((el: any) => { return el.header.id == item.header.id })) {
				continue;
			};
			
			item.children = this.wrapBlockTree(item.header.id, list);
			ret.push(item);
		};
		return ret;
	};
	
	componentDidMount () {
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
					marker: 1,
					checkable: false,
					checked: false,
				}
			});
		}, 100);
		*/
	};
	
	componentDidUpdate () {
	};
	
};

export default PageMainEdit;