import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil } from 'ts/lib';
import { IconObject, Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

interface Props {
};

interface State {
	loading: boolean;
};

const raf = require('raf');
const $ = require('jquery');
const Constant = require('json/constant.json');

const Sidebar = observer(class Sidebar extends React.Component<Props, State> {

	state = {
		loading: false,
	};
	data: any = {
		nodes: [],
		edges: [],
	};

	render () {
		const { loading } = this.state;
        const tree = this.getTree();

        let depth = 0;

        const Item = (item: any) => {
			let style: any = {};
            let name: any = item.name || DataUtil.defaultName('page');
			let length = item.children.length;

			if (!item.name && (item.layout == I.ObjectLayout.Note)) {
				name = <div className="empty">Empty</div>;
			};
            
            if (item.depth == 0) {
                style.paddingLeft = 14;
                style.paddingRight = 14;
            } else {
                style.paddingLeft = item.depth * 26;
                style.paddingRight = 14;
            };

            return (
                <div id={`item-${item.id}-${item.depth}`} className={[ 'item', 'depth' + item.depth ].join(' ')}>
                    <div className="flex" style={style} onClick={(e: any) => { DataUtil.objectOpenPopup(item); }}>
                        <IconObject object={...item} />
                        <div className="name">{name}</div>
						{length ? <Icon className="arrow" onClick={(e: any) => { this.toggle(e, item); }} /> : ''}
                    </div>

					{length ? (
						<div id={`children-${item.id}-${item.depth}`} className="children">
							{item.children.map((child: any, i: number) => (
								<Item key={child.id + '-' + item.depth} {...child} depth={item.depth + 1} />
							))}
						</div>
					) : ''}
                </div>
            );
        };

		return (
            <div className="sidebar">
                {tree.map((item: any, i: number) => (
                    <Item key={item.id + '-' + depth} {...item} depth={depth} />
                ))}
            </div>
		);
	};

	componentDidMount () {
		this.load();
	};

	load () {
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ 
				operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, 
				value: [ 
					Constant.typeId.relation,
					Constant.typeId.type,
					Constant.typeId.template,
					Constant.typeId.file,
					Constant.typeId.image,
					Constant.typeId.video,
					Constant.typeId.audio,
				] 
			},
			{ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, 
				value: [
					'_anytype_profile',
					blockStore.profile,
				] 
			},
		];

		this.setState({ loading: true });

		C.ObjectGraph(filters, 0, [], (message: any) => {
			if (message.error.code) {
				return;
			};

			this.data.edges = message.edges.filter(d => { return d.source !== d.target; });
			this.data.nodes = message.nodes;

			this.setState({ loading: false });
		});
	};

	toggle (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`#item-${item.id}-${item.depth}`);
		const children = el.find(`#children-${item.id}-${item.depth}`);

		console.log(children);

		let height = 0;

		if (el.hasClass('active')) {
			el.removeClass('active');
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			raf(() => {
				children.css({ height: 0 });
			});
		} else {
			el.addClass('active');

			children.css({ overflow: 'visible', height: 'auto' });

			height = children.height();
			children.css({ overflow: 'hidden', height: 0 });
			raf(() => {
				children.css({ height: height });

				window.setTimeout(() => {
					children.css({ overflow: 'visible', height: 'auto' });
				}, 200);
			});
		};
	};

    getTree () {
        let edges = this.data.edges.map((edge: any) => {
            edge.target = this.data.nodes.find((node: any) => { return node.id == edge.target; });
            return edge;
        });
		edges = edges.filter((edge: any) => { return edge.type == I.EdgeType.Link; });

        let nodes = this.data.nodes.map((node: any) => {
            node.children = edges.filter((edge: any) => {
                return edge.source == node.id;
            }).map((edge: any) => { 
                return edge.target;
            });
            return node;
        });
        return nodes;
    };

});

export default Sidebar;