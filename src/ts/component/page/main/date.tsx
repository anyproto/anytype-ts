import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Deleted, ListObject } from 'Component';
import { I, C, S, U, J, Action, keyboard, translate } from 'Lib';
import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
	relations: Item[];
};

interface Item {
	relationKey: string;
	counter: number;
};

const SUB_ID = 'listObject';

const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refList: any = null;
	refControls: any = null;
	loading = false;
	timeout = 0;

	state = {
		isLoading: false,
		isDeleted: false,
		relations: [],
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		const { space } = S.Common;
		const { isLoading, isDeleted, relations } = this.state;
		const rootId = this.getRootId();
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, [ 'timestamp' ]);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		console.log(object);

		const columns: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: v => U.Date.dateWithFormat(I.DateFormat.MonthAbbrBeforeDay, v),
			},
			//{ relationKey: object.relationKey, name: object.name, isCell: true }
		];

		// TODO: get relationKey from state or use first one from relations
		const filters: I.Filter[] = [
			{ 
				relationKey: 'dueDate', 
				condition: I.FilterCondition.Equal, 
				value: object.timestamp, 
				format: I.RelationType.Date 
			},
		];

		let content = null;

		if (isLoading) {
			content = <Loader id="loader" />;
		} else {
			const object = S.Detail.get(rootId, rootId, [ 'layout' ], true);
			const isCollection = U.Object.isCollectionLayout(object.layout);
			const placeholder = isCollection ? translate('defaultNameCollection') : translate('defaultNameSet');

			content = (
				<div className="blocks wrapper">
					<Controls ref={ref => this.refControls = ref} key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
					<HeadSimple 
						{...this.props} 
						ref={ref => this.refHead = ref} 
						placeholder={placeholder} 
						rootId={rootId} 
						readonly={this.isReadonly()}
					/>

					<div className="categories">
						{relations.map(item => {
							const relation = S.Record.getRelationByKey(item.relationKey);

							return (
								<div key={item.relationKey} className="category">
									{relation.name}
								</div>
							);
						})}
					</div>

					<div className="list">
						<ListObject 
							ref={ref => this.refList = ref}
							{...this.props} 
							spaceId={space}
							subId={SUB_ID} 
							rootId={rootId} 
							filters={filters}
							columns={columns} 
						/>
					</div>
				</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				<div id="bodyWrapper" className="wrapper">
					<div className={[ 'editorWrapper', check.className ].join(' ')}>
						{content}
					</div>
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
		this.rebind();
	};

	componentDidUpdate () {
		this.open();
		this.resize();
		this.checkDeleted();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
		this.unbind();
	};

	unbind () {
	};

	rebind () {
		this.unbind();
	};

	checkDeleted () {
		const { isDeleted } = this.state;
		if (isDeleted) {
			return;
		};

		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, []);

		if (object.isDeleted) {
			this.setState({ isDeleted: true });
		};
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isDeleted: false, isLoading: true });

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
			this.refControls?.forceUpdate();

			this.setState({ isLoading: false });
			this.loadCategory();
			this.resize();
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

	loadCategory () {
		const { space } = S.Common;
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);

		console.log(object);

		C.RelationListWithValue(space, object.id, (message: any) => {
			this.setState({ relations: message.relations });
		});
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	isReadonly () {
		const rootId = this.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);

		if (root && root.isLocked()) {
			return true;			
		};

		return !U.Space.canMyParticipantWrite();
	};

	resize () {
		const { isLoading } = this.state;
		const { isPopup } = this.props;

		if (!this._isMounted || isLoading) {
			return;
		};

		raf(() => {
			const win = $(window);
			const container = U.Common.getPageContainer(isPopup);

			container.css({ minHeight: isPopup ? '' : win.height() });
		});
	};

});

export default PageMainDate;