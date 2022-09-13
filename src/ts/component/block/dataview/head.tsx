import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Button } from 'Component';
import { I, C, keyboard, Dataview } from 'Lib';
import { menuStore, blockStore } from 'Store';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

interface Props extends I.ViewComponent {
};

const Constant = require('json/constant.json');

const Head = observer(class Head extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	menuContext: any = null;
	composition: boolean = false;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onSource = this.onSource.bind(this);
		this.onView = this.onView.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onManager = this.onManager.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { rootId, block, readonly, getView, onRecordAdd } = this.props;
		const sources = block.content.sources || [];
		const length = sources.length;
		const view = getView();
		const allowedObject = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);

		let icon = null;
		let onClick = null;

		if (!readonly) {
			if (!length) {
				onClick = this.onSelect;
				icon = <Icon className="plus" />;
			} else {
				onClick = this.onSource;
				icon = (
					<React.Fragment>
						<Icon className="set" />
						{length}
					</React.Fragment>
				);
			};

			icon = <div id="head-source-select" className="iconWrap" onClick={onClick}>{icon}</div>;
		};

		return (
			<div className="dataviewHead">
				<div className="sides">
					<div className="side left">
						<div id="title" className="title">
							<div 
								className="value" 
								contentEditable="true" 
								suppressContentEditableWarning={true}
								onFocus={this.onFocus}
								onBlur={this.onBlur}
								onKeyDown={this.onKeyDown}
								onKeyUp={this.onKeyUp}
								onCompositionStart={this.onCompositionStart}
								onCompositionEnd={this.onCompositionEnd}
							>
							</div>
							<div id="placeholder" className="placeholder">New set</div>
						</div>

						{icon}
						
						<div id="head-view-select" className="select" onClick={this.onView}>
							<div className="name">{view.name}</div>
							<Icon className="arrow dark" />
						</div>
					</div>
					<div className="side right">
						<Icon id="head-customize" className="manager" tooltip="Customize" onClick={this.onManager} />
						{!readonly && allowedObject ? <Button color="orange" icon="plus-small" className="c28" tooltip="New object" text="New" onClick={(e: any) => { onRecordAdd(e, -1); }} /> : ''}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	onView (e: any) {
		const { rootId, block, readonly, getData, getView } = this.props;
		const view = getView();

		menuStore.open('dataviewViewList', { 
			element: `#block-${block.id} #head-view-select`,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				readonly: readonly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: observable.box(view),
			},
		});
	};

	onSelect () {
		const { block } = this.props;
		const options: any[] = [
			{ id: 'new', name: 'Create new source', arrow: true },
			{ id: 'existing', name: 'Link to source of another set', arrow: true }
		];
		
		menuStore.open('select', { 
			element: `#block-${block.id} #head-source-select`,
			width: 256,
			horizontal: I.MenuDirection.Center,
			subIds: Constant.menuIds.dataviewHead,
			onOpen: (context: any) => {
				this.menuContext = context;
			},
			data: {
				options: options,
				onOver: this.onOver,
			},
		});
	};

	onOver (e: any, item: any) {
		const { rootId, block } = this.props;

		let menuId = '';
		let menuParam = {
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			className: 'big single',
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				isBig: true,
				rootId: rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				rebind: this.menuContext.ref.rebind,
			}
		};

		switch (item.id) {
			case 'new':
				menuId = 'dataviewSource';
				break;

			case 'existing':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: Constant.relationKey.type, condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					],
					keys: Constant.defaultRelationKeys.concat([ 'setOf' ]),
					onSelect: (item: any) => {
						C.BlockDataviewSetSource(rootId, block.id, item.setOf);
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			if (menuStore.isOpen(menuId)) {
				menuStore.open(menuId, param);
			} else {
				menuStore.closeAll(Constant.menuIds.dataviewHead, () => {
					menuStore.open(menuId, menuParam);
				});
			};
		};
	};

	onSource (e: any) {
		const { rootId, block, readonly } = this.props;

		if (readonly) {
			return;
		};

		menuStore.closeAll(null, () => { 
			menuStore.open('dataviewSource', {
				element: `#block-${block.id} #head-source-select`,
				className: 'big single',
				horizontal: I.MenuDirection.Center,
				data: {
					rootId: rootId,
					blockId: block.id,
				}
			}); 
		});
	};

	onManager (e: any) {
		const { rootId, block, readonly, getData, getView } = this.props;
		const view = getView();

		const param: any = { 
			element: `#block-${block.id} #head-customize`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			noFlipY: true,
			getTabs: () => Dataview.getMenuTabs(rootId, block.id, view.id),
			data: {
				readonly: readonly,
				rootId: rootId,
				blockId: block.id, 
				getData: getData,
				getView: getView,
				view: observable.box(view),
			},
		};

		menuStore.open('dataviewRelationList', param);
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		keyboard.setFocus(false);
	};

	onCompositionStart (e: any) {
		this.composition = true;
		window.clearTimeout(this.timeout);
	};

	onCompositionEnd (e: any) {
		this.composition = false;
	};

	onKeyDown (e: any) {
		this.placeholderCheck();
	};

	onKeyUp (e: any) {
		if (this.composition) {
			return;
		};

		this.placeholderCheck();

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	getValue (): string {
		if (!this._isMounted) {
			return '';
		};

		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#title');

		return value.length ? String(value.get(0).innerText || '') : '';
	};

	placeholderCheck () {
		const value = this.getValue();
		value ? this.placeholderHide() : this.placeholderShow();
	};

	placeholderHide () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').hide();
	};
	
	placeholderShow () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').show();
	};

	save () {
		//DataUtil.blockSetText(rootId, 'title', this.getValue(id), [], true);
	};

});

export default Head;