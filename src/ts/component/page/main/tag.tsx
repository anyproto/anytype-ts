import * as React from 'react';
import { observer } from 'mobx-react';
import { Action, C, I, S, translate, U } from 'Lib';
import { Header, Footer } from 'Component';
import HeadSimple from 'ts/component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainTag = observer(class PageMainTag extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;

	state = {
		isLoading: false,
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
	};

	render () {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, [ 'relationOptionColor' ]);

		console.log('TAG DETAILS: ', object)

		return (
			<div ref={node => this.node = node}>
				<Header
					{...this.props}
					component="mainObject"
					ref={ref => this.refHeader = ref}
					rootId={rootId}
				/>

				<div className="blocks wrapper">
					<HeadSimple
						{...this.props}
						ref={ref => this.refHead = ref}
						placeholder={translate('defaultNameTag')}
						rootId={rootId}
					/>
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true});

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			this.setState({ isLoading: false });
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;

		let close = true;
		if (isPopup && (match.params.id == this.id)) {
			close = false;
		};

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};
});

export default PageMainTag;
