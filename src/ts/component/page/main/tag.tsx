import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';
import { Header, Footer } from 'Component';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainTag = observer(class PageMainTag extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	refHeader: any = null;

	state = {
		isLoading: false,
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
	};

	render () {
		const rootId = this.getRootId();

		return (
			<div ref={node => this.node = node}>
				<Header
					{...this.props}
					component="mainObject"
					ref={ref => this.refHeader = ref}
					rootId={rootId}
				/>

				<div id="bodyWrapper" className="wrapper">
					<div className="editorWrapper">
						TAG

					</div>
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
});

export default PageMainTag;
