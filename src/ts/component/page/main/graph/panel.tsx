import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { RouteComponentProps } from 'react-router';

import Controls from './controls';
import Preview from './preview';

interface Props extends RouteComponentProps<any> {
    isPopup?: boolean;
    data: any;
    onFilterChange: (v: string) => void;
    onSwitch: (id: string, v: string) => void;
    togglePanel: (v: boolean) => void;
};

interface State {
    view: I.GraphView;
    rootId: string;
};

const $ = require('jquery');
const Tabs = [
    { id: I.GraphView.Controls, name: 'View' },
    //{ id: I.GraphView.Filter, name: 'Filters' },
];

const GraphPanel = observer(class Graph extends React.Component<Props, State> {

    state = {
        view: I.GraphView.Controls,
        rootId: '',
    };

	constructor (props: any) {
		super(props);

        this.setState = this.setState.bind(this);
        this.onCancel = this.onCancel.bind(this);
	};

	render () {
		const { view, rootId } = this.state;

        let content = null;
        let tabs = (
            <div className="tabs">
                {Tabs.map((item: any, i: number) => (
                    <div 
                        key={i} 
                        className={[ 'tab', (item.id == view ? 'active' : '') ].join(' ')} 
                        onClick={() => { this.onTab(item.id); }}
                    >
                        {item.name}
                    </div>
                ))}

                <Icon className="close" onClick={this.onCancel} />
            </div>
        );

        switch (view) {
            default:
            case I.GraphView.Controls:
                content = <Controls {...this.props} />;
                break;

            case I.GraphView.Preview:
                tabs = null;
                content = <Preview {...this.props} rootId={rootId} onCancel={this.onCancel} />;
                break;
            
            case I.GraphView.Filter:
                break;
        };

		return (
			<div id="panel">
                {tabs}
                {content}
			</div>
		);
	};

    componentDidMount () {
        this.resize();
    };

    componentDidUpdate () {
        this.resize();
    };

    onTab (view: I.GraphView) {
        this.setState({ view });
    };

    onCancel () {
        this.props.togglePanel(false);
        this.onTab(I.GraphView.Controls);
    };

    resize () {
        const { isPopup } = this.props;
        const node = $(ReactDOM.findDOMNode(this));
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page.isFull');
		const header = obj.find('#header');
		const tabs = node.find('.tabs');
		const hh = header.height();

		tabs.css({ lineHeight: hh + 'px' });
    };

});

export default GraphPanel;