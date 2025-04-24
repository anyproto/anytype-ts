import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, ListObject, Deleted, Icon, HeadSimple, IconObject, ObjectName } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, sidebar, keyboard, Relation } from 'Lib';
import { observable } from 'mobx';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
};

const PageMainRelation = observer(class PageMainRelation extends React.Component<I.PageComponent, State> {

	id = '';
	refHeader: any = null;
	refHead: any = null;
	refListObject: any = null;

	state = {
		isDeleted: false,
		isLoading: false
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onMore = this.onMore.bind(this);
		this.onOptionAdd = this.onOptionAdd.bind(this);
		this.onOptionRemove = this.onOptionRemove.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const rootId = this.getRootId();
		const object = this.getObject();
		const { relationFormat, isReadonlyRelation } = object;
		const subIdObject = S.Record.getSubId(rootId, 'object');
		const totalObject = S.Record.getMeta(subIdObject, '').total;
		const columnsObject: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: v => U.Date.dateWithFormat(S.Common.dateFormat, v),
			},
			{ relationKey: object.relationKey, name: object.name, isCell: true }
		];

		let options = null;
		let optionsLabel = '';
		let canAdd = false;

		switch (relationFormat) {
			case I.RelationType.Object: {
				const types = (object?.objectTypes.map(it => S.Record.getTypeById(it)) || []).filter(it => it);

				canAdd = true;
				optionsLabel = U.Common.plural(10, translate('pluralObjectType'));
				options = types.map((type) => {
					return (
						<div key={type.id} className="item">
							<IconObject object={type} />
							<ObjectName object={type} />

							{!isReadonlyRelation ? <Icon onClick={e => this.onOptionRemove(e, type)} className="remove" /> : ''}
						</div>
					);
				});
				break;
			};

			case I.RelationType.Date: {
				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				break;
			};
		};

		return (
			<div id="pageRelation">
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				{isLoading ? <Loader id="loader" /> : ''}

				<div className="blocks wrapper">
					<HeadSimple 
						{...this.props} 
						ref={ref => this.refHead = ref} 
						placeholder={translate('defaultNameRelation')} 
						rootId={rootId}
					/>

					<div className="relationData">
						<dl>
							<dt>{translate('pageMainRelationPropertyType')}</dt>
							<dd>{translate(`relationName${relationFormat}`)}</dd>
						</dl>

						{options ? (
							<dl className="options">
								<dt>{optionsLabel}</dt>
								<dd>
									{options}
									{canAdd && !isReadonlyRelation ? <Icon className="add" onClick={this.onOptionAdd} /> : ''}
								</dd>
							</dl>
						) : ''}
					</div>

					{!object._empty_ && object.isInstalled ? (
						<div className="section set">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalObject, translate('pluralObject'))}
									<span className="cnt">{totalObject}</span>
								</div>

								<div className="side right">
									<Icon
										id="button-create"
										className="more withBackground"
										onClick={this.onMore}
									/>
								</div>
							</div>

							<div className="content">
								<ListObject
									ref={ref => this.refListObject = ref}
									{...this.props}
									sources={[ rootId ]}
									spaceId={object.spaceId}
									subId={subIdObject}
									rootId={rootId}
									columns={columnsObject}
									route={analytics.route.screenRelation}
								/>
							</div>
						</div>
					) : ''}
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	componentWillUnmount () {
		this.close();
	};

	open () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true });
		
		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			sidebar.rightPanelSetState(isPopup, { rootId });
			this.setState({ isLoading: false });

			analytics.event('ScreenRelation', { relationKey: object.relationKey });
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup } = this.props;
		const close = !isPopup || (this.getRootId() == this.id);

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	getRootId () {
		return keyboard.getRootId(this.props.isPopup);
	};

	getObject () {
		const rootId = this.getRootId();
		return S.Detail.get(rootId, rootId);
	};

	onSetAdd () {
		const object = this.getObject();

		C.ObjectCreateSet([ object.id ], { name: object.name + ' set' }, '', S.Common.space, (message: any) => {
			if (!message.error.code) {
				U.Object.openConfig(message.details);
			};
		});
	};

	onMore () {
		const options = [
			{ id: 'set', name: translate('pageMainTypeNewSetOfObjects') }
		];

		S.Menu.open('select', { 
			element: `#button-create`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'set':
							this.onSetAdd();
							break;
					};
				},
			},
		});
	};

	onOptionAdd () {
		const object = this.getObject();
		const { relationFormat, objectTypes } = object;

		switch (relationFormat) {
			case I.RelationType.Object: {
				S.Menu.closeAll([], () => {
					S.Menu.open('dataviewObjectList', {
						element: `#pageRelation .relationData .options .add`,
						className: 'single',
						vertical: I.MenuDirection.Bottom,
						horizontal: I.MenuDirection.Center,
						offsetY: 8,
						data: {
							canEdit: true,
							rootId: this.getRootId(),
							relation: observable.box(object),
							value: objectTypes,
							filters: [
								{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
								{ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
							],
							onChange: (value: any, callBack?: () => void) => {
								const details = [ { key: 'relationFormatObjectTypes', value: value } ];

								C.ObjectListSetDetails([ object.id ], details);
								S.Menu.closeAll();
							},
						}
					})
				});

				break;
			};
		};
	};

	onOptionRemove (e, item) {
		const object = this.getObject();
		const { relationFormat, objectTypes } = object;

		switch (relationFormat) {
			case I.RelationType.Object: {
				const details = [ { key: 'relationFormatObjectTypes', value: Relation.getArrayValue(objectTypes.filter(it => it != item.id)) } ];
				C.ObjectListSetDetails([ object.id ], details);
				break;
			};
		};
	};

});

export default PageMainRelation;
