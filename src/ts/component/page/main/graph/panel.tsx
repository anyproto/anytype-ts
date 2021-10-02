import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { RouteComponentProps } from 'react-router';

import Controls from './controls';
import Preview from './preview';

interface Props extends RouteComponentProps<any> {
    isPopup?: boolean;
    data: any;
    onFilterChange: (v: string) => void;
    onSwitch: (id: string, v: string) => void;
};

interface State {
    view: I.GraphView;
    rootId: string;
};

const $ = require('jquery');

const GraphPanel = observer(class Graph extends React.Component<Props, State> {

    state = {
        view: I.GraphView.Controls,
        rootId: '',
    };

	constructor (props: any) {
		super(props);

        this.setState = this.setState.bind(this);
	};

	render () {
		const { view, rootId } = this.state;

        let content = null;

        switch (view) {
            default:
            case I.GraphView.Controls:
                content = <Controls {...this.props} />;
                break;

            case I.GraphView.Preview:
                content = <Preview {...this.props} rootId={rootId} setState={this.setState} />;
                break;
            
            case I.GraphView.Filters:
                break;
        };

		return (
			<div id="panel">
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

    resize () {
        const { isPopup } = this.props;
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page');
		const header = obj.find('#header');
		const tabs = obj.find('.tabs');
		const hh = header.height();

		tabs.css({ lineHeight: hh + 'px' });
    };

});

export default GraphPanel;