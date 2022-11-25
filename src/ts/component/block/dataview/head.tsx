import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Button } from 'Component';
import { I, C, keyboard, Dataview } from 'Lib';
import { menuStore, blockStore } from 'Store';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
};


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
	};

	render () {
		const { rootId, block, readonly, getView, onRecordAdd, className } = this.props;
		const sources = block.content.sources || [];
		const view = getView();
		const allowedObject = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const cn = [ 'dataviewHead' ];

		if (className) {
			cn.push(className);
		};
		
		return (
			<div className={cn.join(' ')}>
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
		);
	};

	componentDidMount () {
		this._isMounted = true;
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
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
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