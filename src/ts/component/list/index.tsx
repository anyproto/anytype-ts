import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconUser, Smile } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I, Util} from 'ts/lib';

interface Props {
	documentStore?: any;
	onAdd?(e: any): void;
};

const $ = require('jquery');
const raf = require('raf');
const Constant: any = require('json/constant.json');

@inject('documentStore')
@observer
class ListIndex extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	scrollY: number = 0;
	
	render () {
		const { documentStore, onAdd } = this.props;
		const { documents } = documentStore;
		const length = documents.length;
		
		const Item = SortableElement((item: any) => {
			return (
				<div className="item" >
					<Smile icon={item.icon} size={24} />
					<div className="name">{item.name}</div>
				</div>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => {
			return (
				<div className="item add" onClick={onAdd}>
					<Icon />
				</div>
			);
		});
		
		const List = SortableContainer((item: any) => {
			return (
				<div id="documents"> 
					{item.list.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
					<ItemAdd index={length + 1} disabled={true} />
				</div>
			);
		});
		
		return (
			<List axis="xy" list={documents} helperContainer={() => { return $('#documents').get(0); }} />
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		
		$(window).unbind('scroll.list').on('scroll.list', () => { this.scroll(); });
	};
	
	componentDidUpdate () {
		this.resize();
		window.scrollTo(0, this.scrollY);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	scroll () {
		this.scrollY = $(window).scrollTop();
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};
		
		let size = Constant.index.document;
		let win = $(window);
		let wh = win.height();
		let ww = win.width();
		let node = $(ReactDOM.findDOMNode(this));
		let body = $('#body');
		let cnt = Math.floor((ww -  size.margin * 2) / (size.width + size.margin));
		let width = cnt * (size.width + size.margin);
			
		body.css({ width: width - size.margin });
		node.css({  
			width: width,
			marginTop: wh - 130 - (size.height * 2 + size.margin * 2)
		});
	};
	
};

export default ListIndex;