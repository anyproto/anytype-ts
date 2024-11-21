import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Deleted, ListObject, Button, Icon } from 'Component';
import { I, M, C, S, U, J, Action, keyboard, translate } from 'Lib';
import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
	relations: Item[];
	selectedRelation: string;
};

interface Item {
	relationKey: string;
	counter: number;
}

const SUB_ID = 'dateListObject';

const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refList: any = null;
	refCalIcon: any = null;
	refControls: any = null;
	loading = false;
	timeout = 0;

	state:State = {
		isLoading: false,
		isDeleted: false,
		relations: [],
		selectedRelation: 'createdDate',
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		const { space } = S.Common;
		const { isLoading, isDeleted, relations, selectedRelation } = this.state;
		const rootId = this.getRootId();
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, ['timestamp']);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const creatorRelation = S.Record.getRelationByKey('creator');
		const columns: any[] = [

			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
			{ 
				relationKey: creatorRelation.relationKey, name: creatorRelation.name, isObject: true,
			},
		];
		// TODO: dark theme
		const filters: I.Filter[] = 
		[
			selectedRelation === 'mentions' ? {
				relationKey: 'mentions',
				condition: I.FilterCondition.In,
				value: object.id,
			} : {
				relationKey: selectedRelation,
				condition: I.FilterCondition.Equal,
				value: object.timestamp,
				format: I.RelationType.Date
			},
		];

		let content = null;

		if (isLoading) {
			content = <Loader id="loader" />;
		} else {
			const calendarMenu = <><Icon className="arrow left"/><Icon className="arrow right"/><Icon ref={ref => this.refCalIcon = ref} className="calendar" onClick={this.onCalendar}/></>;

			content = (
				<div className="blocks wrapper">
						<Controls ref={ref => this.refControls = ref} key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
						<HeadSimple 
							{...this.props} 
							noIcon={true}
							ref={ref => this.refHead = ref} 
							placeholder={''} 
							rootId={rootId} 
							readonly={this.isReadonly()}
							rightSideEnd={calendarMenu}
						/>

						<div className="categories">
							{/* TODO: remove sort when relations are returned in the order corresponding to UI design */}
							{relations.filter(r => r.relationKey !== 'links').sort((a,b) => a.relationKey === 'mentions' ? -1 : 1).flatMap((item, index) => {
								const relation = S.Record.getRelationByKey(item.relationKey);
								return ([<Button
									active={selectedRelation === item.relationKey}
									key={relation.relationKey}
									type="button"
									color="blank"
									className="category" 
									onClick={() => {
										this.setState({ selectedRelation: item.relationKey }, () => {
											this.refList?.getData(1);
										});
									}}
									content={index === 0 && <div className="mentionsSign">@</div>}
									text={index === 0 ? translate('relationMentions') : relation.name}
									/>, index === 0 && <span className="separator" key="separator"></span>]
								);
							})}
						</div>
						<div className="dateList">
							<ListObject 
								ref={ref => this.refList = ref}
								{...this.props}
								spaceId={space}
								subId={SUB_ID} 
								rootId={rootId}
								columns={columns}
								filters={filters}
							/>
						</div>
					</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<div id="bodyWrapper" className="wrapper">
					<div className={[ 'editorWrapper', check.className ].join(' ')}>
						{content}
					</div>
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	onCalendar = () => {
		const node = $(this.refCalIcon.node);
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, ['timestamp']);

		S.Menu.open('dataviewCalendar', {
			element: node,
			horizontal: I.MenuDirection.Center,
			data: {
				// rebind: this.rebind,
				value: object.timestamp,
				canEdit: true,
				onChange: (value: number) => {
					C.ObjectDateByTimestamp(U.Router.getRouteSpaceId(), value, (message: any) => {
						U.Object.openAuto(message.details);
					});
				},
			},
		});
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

	loadCategory() {
		const { space } = S.Common;
		const rootId = this.getRootId();

		const object = S.Detail.get(rootId, rootId);

		console.log(object);

		C.RelationListWithValue(space, object.id, (message: any) => {
			this.setState({ relations: message.relations });
		});
	}

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
	};
});

export default PageMainDate;
