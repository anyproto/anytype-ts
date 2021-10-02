import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Controls from './controls';
import Preview from './preview';

interface Props {
    data: any;
    onFilterChange: (v: string) => void;
    onSwitch: (id: string, v: string) => void;
};

interface State {
    view: I.GraphView;
    data: any
};

const GraphPanel = observer(class Graph extends React.Component<Props, State> {

    state = {
        view: I.GraphView.Controls,
        data: {} as any,
    };

	constructor (props: any) {
		super(props);

	};

	render () {
		const { view, data } = this.state;

        let content = null;

        switch (view) {
            default:
            case I.GraphView.Controls:
                content = <Controls {...this.props} />;
                break;

            case I.GraphView.Preview:
                content = <Preview {...this.props} rootId={data.id} />;
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

    setView (view: I.GraphView, data: any) {
        this.setState({ view, data });
    };

});

export default GraphPanel;