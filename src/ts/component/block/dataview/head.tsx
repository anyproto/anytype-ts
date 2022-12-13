import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { Icon, IconObject } from 'Component';
import { I, C, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {};

const Head = observer(class Head extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	menuContext: any = null;
	composition: boolean = false;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
		this.onIconSelect = this.onIconSelect.bind(this);
		this.onIconUpload = this.onIconUpload.bind(this);
		this.onFullscreen = this.onFullscreen.bind(this);
	};

	render () {
		const { rootId, block, readonly, getSources, className } = this.props;
		const { targetObjectId } = block.content;
		const object = detailStore.get(rootId, targetObjectId);
		const sources = getSources();
		const cn = [ 'dataviewHead' ];

		if (className) {
			cn.push(className);
		};

		return (
			<div className={cn.join(' ')}>
				<div className="side left">
					<IconObject id={`icon-set-${block.id}`} object={object} size={18} canEdit={!readonly} onSelect={this.onIconSelect} onUpload={this.onIconUpload} />
					
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
						/>
						<div id="placeholder" className="placeholder">New set</div>
					</div>

					<div id="head-source-select" className="iconWrap" onClick={this.onSelect}>
						<Icon className="set" />
						{sources.length}
					</div>
				</div>
				<div className="side right">
					<div className="iconWrap" onClick={this.onFullscreen}>
						<Icon className="expand" />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.setValue();
	};

	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
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
		const { targetObjectId } = block.content;

		let menuId = '';
		let menuParam = {
			menuKey: item.id,
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			className: 'big single',
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				isBig: true,
				rootId,
				blockId: 'dataview',
				blockIds: [ block.id ],
				rebind: this.menuContext.ref.rebind,
			}
		};

		switch (item.id) {
			case 'new':
				menuId = 'dataviewSource';
				menuParam.data = Object.assign(menuParam.data, {
					objectId: targetObjectId,
				});
				break;

			case 'existing':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
					],
					keys: Constant.defaultRelationKeys.concat([ 'setOf' ]),
					onSelect: (item: any) => {
						C.BlockDataviewSetSource(targetObjectId, 'dataview', item.setOf);
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.dataviewHead, () => {
				menuStore.open(menuId, menuParam);
			});
		};
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

	setValue () {
		if (!this._isMounted) {
			return;
		};

		const { rootId, block } = this.props;
		const { targetObjectId } = block.content;
		const node = $(ReactDOM.findDOMNode(this));
		const item = node.find('#title');

		if (!targetObjectId) {
			return;
		};

		const object = detailStore.get(rootId, targetObjectId);
		const { name } = object;

		if (!name || (name == DataUtil.defaultName('page')) || (name == DataUtil.defaultName('set'))) {
			return;
		};

		item.text(object.name);
		this.placeholderCheck();
	};

	getValue () {
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
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (!targetObjectId) {
			return;
		};

		DataUtil.blockSetText(targetObjectId, 'title', this.getValue(), [], true);
	};

	onIconSelect (icon: string) {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (!targetObjectId) {
			return;
		};

		ObjectUtil.setIcon(targetObjectId, icon, '');
	};

	onIconUpload (hash: string) {
		const { block } = this.props;
		const { targetObjectId } = block.content;

		if (!targetObjectId) {
			return;
		};

		ObjectUtil.setIcon(targetObjectId, '', hash);
	};

	onFullscreen () {
		const { rootId, block } = this.props;

		ObjectUtil.openPopup({ layout: I.ObjectLayout.Block, id: rootId, _routeParam_: { blockId: block.id } });
	};

});

export default Head;