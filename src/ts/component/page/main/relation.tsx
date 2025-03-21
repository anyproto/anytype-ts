import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, ListObject, Deleted, Icon, HeadSimple } from 'Component';
import { I, C, S, U, Action, translate, analytics, sidebar, keyboard } from 'Lib';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
};

const PageMainRelation = observer(class PageMainRelation extends React.Component<I.PageComponent, State> {

	id = '';
	refHeader: any = null;
	refHead: any = null;
	refListType: any = null;
	refListObject: any = null;

	state = {
		isDeleted: false,
		isLoading: false
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const rootId = this.getRootId();
		const object = this.getObject();
		const subIdType = S.Record.getSubId(rootId, 'type');
		const totalType = S.Record.getMeta(subIdType, '').total;
		const subIdObject = S.Record.getSubId(rootId, 'object');
		const totalObject = S.Record.getMeta(subIdObject, '').total;
		const columnsObject: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: v => U.Date.dateWithFormat(S.Common.dateFormat, v),
			},
			{ relationKey: object.relationKey, name: object.name, isCell: true }
		];

		const filtersType: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
			{ relationKey: 'recommendedRelations', condition: I.FilterCondition.In, value: [ rootId ] },
		];

		return (
			<div>
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

					{!object._empty_ ? (
						<>
							<div className="section set">
								<div className="title">
									<div className="side left">
										{U.Common.plural(totalType, translate('pluralObjectType'))}
										<span className="cnt">{totalType}</span>
									</div>
								</div>

								<div className="content">
									<ListObject 
										ref={ref => this.refListType = ref}
										{...this.props}
										spaceId={object.spaceId}
										subId={subIdType} 
										rootId={rootId} 
										columns={[]} 
										filters={filtersType} 
										route={analytics.route.screenRelation}
									/>
								</div>
							</div>

							{object.isInstalled ? (
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
						</>
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

});

export default PageMainRelation;