import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Deleted, ListObject, Button, Label, Loader, HeadSimple } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, keyboard, sidebar } from 'Lib';
import { eachDayOfInterval, isEqual, format, fromUnixTime } from 'date-fns';

const SUB_ID = 'dateListObject';

const PageMainDate = observer(forwardRef<{}, I.PageComponent>((props, ref: any) => {

	const { space, config } = S.Common;
	const { isPopup } = props;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ relations, setRelations ] = useState([]);
	const match = keyboard.getMatch(isPopup);
	const [ relationKey, setRelationKey ] = useState(match.params.relationKey);
	const rootId = keyboard.getRootId(isPopup);
	const object = S.Detail.get(rootId, rootId, []);
	const headerRef = useRef(null);
	const headRef = useRef(null);
	const listRef = useRef(null);
	const idRef = useRef(null);
	const relation = S.Record.getRelationByKey(relationKey);
	const dayName = [];

	if (!object._empty_) {
		const dayString = U.Date.dayString(object.timestamp);

		if (dayString) {
			dayName.push(dayString);
		};

		dayName.push(U.Date.date('l', object.timestamp));
	};

	const open = () => {
		if (idRef.current == rootId) {
			return;
		};

		close();
		setIsLoading(true);

		idRef.current = rootId;

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			setIsLoading(false);

			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
			if (object.isDeleted) {
				return;
			};

			sidebar.rightPanelSetState(isPopup, { rootId });
			headerRef.current.forceUpdate();
			headRef.current.forceUpdate();

			loadCategory();
		});
	};

	const close = () => {
		const id = idRef.current;

		if (!id) {
			return;
		};

		const close = !isPopup || (rootId == id);

		if (close) {
			Action.pageClose(id, true);
		};
	};

	const loadCategory = () => {
		setIsLoading(true);

        C.RelationListWithValue(space, rootId, (message: any) => {
			setIsLoading(false);

            const relations = (message.relations || []).map(it => S.Record.getRelationByKey(it.relationKey)).filter(it => {
				if (!it) {
					return false;
				};

                if ([ J.Relation.key.mention ].includes(it.relationKey)) {
                    return true;
                };

                if ([ 'links', 'backlinks' ].includes(it.relationKey)) {
                    return false;
                };

                return config.debug.hidden ? true : !it.isHidden;
            });

            relations.sort((c1, c2) => {
                const isMention1 = c1.relationKey == J.Relation.key.mention;
                const isMention2 = c2.relationKey == J.Relation.key.mention;

                if (isMention1 && !isMention2) return -1;
                if (!isMention1 && isMention2) return 1;
                return 0;
            });

			setRelations(relations);

			if (relations.length) {
				if (!relationKey || !relations.find(it => it.relationKey == relationKey)) {
					setRelationKey(relations[0].relationKey);
				} else {
					reload();
				};
			} else {
				reload();
			};
        });
    };

	const onCategoryClick = (relationKey: string) => {
		setRelationKey(relationKey);
		analytics.event('SwitchRelationDate', { relationKey });
	};

	const reload = () => {
		listRef.current?.getData(1);
	};

	const getFilters = (start: number, end: number): I.Filter[] => {
		if (!relationKey) {
			return [];
		};

		return [

			{
				relationKey,
				condition: I.FilterCondition.GreaterOrEqual,
				value: start,
				quickOption: I.FilterQuickOption.ExactDate,
				format: I.RelationType.Date,
			},
			{
				relationKey,
				condition: I.FilterCondition.LessOrEqual,
				value: end,
				quickOption: I.FilterQuickOption.ExactDate,
				format: I.RelationType.Date,
			}
		];
	};

	const getDotMap = (start: number, end: number, callBack: (res: Map<string, boolean>) => void): void => {
		const res = new Map();

		if (!relationKey) {
			callBack(res);
			return;
		};

		U.Data.search({
			filters: getFilters(start, end),
			keys: [ relationKey ],
		}, (message: any) => {
			eachDayOfInterval({
				start: fromUnixTime(start),
				end: fromUnixTime(end)
			}).forEach(date => {
				if (message.records.find(rec => isEqual(date, fromUnixTime(rec[relationKey]).setHours(0, 0, 0, 0)))) {
					res.set(format(date, 'dd-MM-yyyy'), true);
				};
			});

			callBack(res);
		});
	};

	let content = null;
	let inner = null;

	if (isLoading || object._empty_) {
		inner = <Loader id="loader" />;
	} else
	if (!relations.length || !relation) {
		inner = (
			<div className="emptyContainer">
				<Label text={translate('pageMainDateEmptyText')} />
			</div>
		);
	} else {
		const columns: any[] = [
			{ relationKey: 'type', name: translate('commonObjectType'), isObject: true },
			{ relationKey: 'creator', name: translate('relationCreator'), isObject: true },
		];

		const keys = relations.map(it => it.relationKey);
		const filters: I.Filter[] = [];

		if (relation.format == I.RelationType.Object) {
			filters.push({ relationKey, condition: I.FilterCondition.In, value: [ object.id ] });
		} else {
			filters.push({ relationKey, condition: I.FilterCondition.Equal, value: object.timestamp, format: I.RelationType.Date });
		};

		if ([ 'createdDate' ].includes(relationKey)) {
			filters.push({ relationKey: 'origin', condition: I.FilterCondition.NotEqual, value: I.ObjectOrigin.Builtin });
			keys.push('origin');
		};

		if ([ 'lastModifiedDate' ].includes(relationKey)) {
			filters.push({ relationKey: 'createdDate', condition: I.FilterCondition.NotEqual, value: { type: 'valueFromRelation', relationKey: 'lastModifiedDate' } });
		};

		inner = (
			<>
				<div className="categories">
					{relations.map(item => {
						const isMention = item.relationKey == J.Relation.key.mention;
						const icon = isMention ? 'mention' : '';

						return (
							<Button
								id={`category-${item.relationKey}`}
								key={item.relationKey}
								active={relationKey == item.relationKey}
								color="blank"
								className="c36"
								onClick={() => onCategoryClick(item.relationKey)}
								icon={icon}
								text={item.name}
							/>
						);
					})}
				</div>

				<ListObject
					ref={listRef}
					{...props}
					spaceId={space}
					subId={SUB_ID}
					rootId={rootId}
					columns={columns}
					filters={filters}
					route={analytics.route.screenDate}
					relationKeys={keys}
				/>
			</>
		);
	};

	if (object.isDeleted) {
		content = <Deleted {...props} />;
	} else {
		content = (
			<div>
				<Header
					{...props}
					component="mainChat"
					ref={headerRef}
					rootId={rootId}
				/>

				<div className="blocks wrapper">
					<div className="dayName">
						{dayName.map((item, i) => <div key={i}>{item}</div>)}
					</div>
					<HeadSimple
						{...props}
						noIcon={true}
						ref={headRef}
						rootId={rootId}
						readonly={true}
						relationKey={relationKey}
						getDotMap={getDotMap}
					/>

					{inner}
				</div>

				<Footer component="mainObject" {...props} />
			</div>
		);
	};

	useEffect(() => {
		return () => close();
	}, []);

	useEffect(() => {
		open();
		reload();	
	});

	return content;

}));

export default PageMainDate;