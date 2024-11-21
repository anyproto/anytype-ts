import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Deleted, ListObject, Button, Icon } from 'Component';
import { I, C, S, U, Action, translate } from 'Lib';
import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
	relations: any[];
	selectedRelation: string;
};

const SUB_ID = 'dateListObject';

const PageMainDate = observer(class PageMainDate extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refList: any = null;
	refCalIcon: any = null;
	loading = false;
	timeout = 0;

	state:State = {
		isLoading: false,
		isDeleted: false,
		relations: [],
		selectedRelation: 'mentions',
	};

	constructor (props: I.PageComponent) {
		super(props);
		
	};

	render () {
		const { space } = S.Common;
		const { isLoading, isDeleted, relations, selectedRelation } = this.state;
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, ['timestamp']);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const creatorRelation = S.Record.getRelationByKey('creator');
		const columns: any[] = [
			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
			{ relationKey: creatorRelation.relationKey, name: creatorRelation.name, isObject: true },
		];

		const filters: I.Filter[] = [];

		if (selectedRelation === 'mentions') {
			filters.push({ relationKey: 'mentions', condition: I.FilterCondition.In, value: [ object.id ] });
		} else {
			filters.push({ relationKey: selectedRelation, condition: I.FilterCondition.Equal, value: object.timestamp, format: I.RelationType.Date });
		};

		let content = null;

		if (isLoading) {
			content = <Loader id="loader" />;
		} else {
			const calendarMenu = (
				<React.Fragment>
					<Icon className="arrow left withBackground" onClick={() => this.changeDate(-1)} />
					<Icon className="arrow right withBackground" onClick={() => this.changeDate(1)}/>
					<Icon id="calendar-icon" className="calendar withBackground" onClick={this.onCalendar} />
				</React.Fragment>
			);

			content = (
				<div className="blocks wrapper">
					<HeadSimple 
						{...this.props} 
						noIcon={true}
						ref={ref => this.refHead = ref} 
						rootId={rootId} 
						readonly={true}
						rightSideEnd={calendarMenu}
					/>

					<div className="categories">
						{relations.map((item) => {
							const relation = S.Record.getRelationByKey(item.relationKey);
							const isMention = item.relationKey == 'mentions';
							const icon = isMention ? 'mention' : '';
							const separator = isMention ? <div className="separator" /> : '';
							return (
								<React.Fragment key={item.relationKey}>
									<Button
										id={`category-${item.relationKey}`}
										active={selectedRelation === item.relationKey}
										color="blank"
										className="c36"
										onClick={() => {
											this.setState({ selectedRelation: item.relationKey }, () => {
												this.refList?.getData(1);
											});
										}}
										icon={icon}
										text={relation.name}
									/>
									{separator}
								</React.Fragment>
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
				<Header 
					{...this.props} 
					component="mainChat" 
					ref={ref => this.refHeader = ref} 
					rootId={object.chatId} 
				/>

				{content}

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	onCalendar = () => {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, ['timestamp']);

		S.Menu.open('dataviewCalendar', {
			element: '#calendar-icon',
			horizontal: I.MenuDirection.Center,
			data: {
				value: object.timestamp,
				canEdit: true,
				canClear: false,
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
	};

	componentDidUpdate () {
		this.open();
		this.checkDeleted();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
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

			this.setState({ isLoading: false });
			this.loadCategory();
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
        const { space, config } = S.Common;
        const rootId = this.getRootId();

        C.RelationListWithValue(space, rootId, (message: any) => {
            const relations = (message.relations || []).map(it => S.Record.getRelationByKey(it.relationKey)).filter(it => {
                if ([ 'mentions' ].includes(it.relationKey)) {
                    return true;
                };

                if ([ 'links', 'backlinks' ].includes(it.relationKey)) {
                    return false;
                };

                return config.debug.hidden ? true : !it.isHidden;
            });

            relations.sort((c1, c2) => {
                const isMention1 = c1.relationKey == 'mentions';
                const isMention2 = c2.relationKey == 'mentions';

                if (isMention1 && !isMention2) return -1;
                if (!isMention1 && isMention2) return 1;
                return 0;
            });

            this.setState({ relations });
        });
    }

	changeDate = (dir: number) => {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId, ['timestamp']);
		C.ObjectDateByTimestamp(U.Router.getRouteSpaceId(), object.timestamp + dir * 24 * 60 * 60, (message: any) => {
			U.Object.openAuto(message.details);
		});
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainDate;
