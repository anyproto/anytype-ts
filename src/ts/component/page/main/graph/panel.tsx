import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, Util } from 'Lib';
import Preview from './preview';

interface Props extends I.PageComponent {
    isPopup?: boolean;
    data: any;
	onContextMenu?: (id: string, param: any) => void;
    togglePanel: (v: boolean) => void;
};

interface State {
    view: I.GraphView;
    rootId: string;
};

const GraphPanel = observer(class Graph extends React.Component<Props, State> {

    state = {
        view: I.GraphView.Controls,
        rootId: '',
    };
    ref: any = null;

	constructor (props: any) {
		super(props);

        this.setState = this.setState.bind(this);
        this.onClose = this.onClose.bind(this);
	};

	render () {
		const { view, rootId } = this.state;

        let content = null;

        switch (view) {
            case I.GraphView.Preview:
                content = <Preview ref={(ref: any) => { this.ref = ref; }} {...this.props} rootId={rootId} onClose={this.onClose} />;
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

    onTab (view: I.GraphView) {
        this.setState({ view });
    };

    onClose () {
        this.props.togglePanel(false);

        if (this.ref && this.ref.onClose) {
            this.ref.onClose();
        };
    };

    resize () {
        const node = $(ReactDOM.findDOMNode(this));
		const container = Util.getPageContainer(this.props.isPopup);
		const header = container.find('#header');
		const tabs = node.find('.tabs');
		const hh = header.height();

		tabs.css({ lineHeight: hh + 'px' });
    };

});

export default GraphPanel;