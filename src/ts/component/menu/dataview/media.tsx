import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuDataviewMedia extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
        const items = [
            { name: '1.png' },
            { name: '2.png' },
            { name: '3.png' },
        ];

        const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

        const Item = SortableElement((item: any) => (
            <div className="item">
                <Handle />
                <div className="name">{item.name}</div>
            </div>
        ));

        const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} index={i} />
					))}
				</div>
			);
		});

		return (
			<div className="items">
                <List 
                    axis="y" 
                    lockAxis="y"
                    lockToContainerEdges={true}
                    transitionDuration={150}
                    distance={10}
                    onSortEnd={this.onSortEnd}
                    useDragHandle={true}
                    helperClass="isDragging"
                    helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
                />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
    };
    
    onSortEnd (result: any) {

    };

};

export default MenuDataviewMedia;