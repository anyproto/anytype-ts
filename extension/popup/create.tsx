import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import arrayMove from 'array-move';
import { getRange, setRange } from 'selection-ranges';
import { Label, Input, Button, Select, Loader, Error, DragBox, Tag, Icon } from 'Component';
import { I, C, UtilCommon, UtilData, Relation, keyboard, UtilObject, UtilRouter, Storage, UtilSpace } from 'Lib';
import { dbStore, detailStore, commonStore, menuStore, extensionStore } from 'Store';
const Constant = require('json/constant.json');
import Util from '../lib/util';

interface State {
	error: string;
	isLoading: boolean;
	withContent: boolean;
};

const MAX_LENGTH = 320;

const Create = observer(class Create extends React.Component<I.PageComponent, State> {

	details: any = {
		type: '',
		tag: [],
	};

	node: any = null;
	refName: any = null;
	refSpace: any = null;
	refType: any = null;
	refComment: any = null;
	isCreating = false;
	url = '';

	state = {
		error: '',
		isLoading: false,
		withContent: true,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onSpaceChange = this.onSpaceChange.bind(this);
		this.onTypeChange = this.onTypeChange.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
		this.focus = this.focus.bind(this);
	};

	render () {
		const { error, isLoading, withContent } = this.state;
		const { space } = commonStore;
		const tags = this.getTagsValue();

		return (
			<div 
				ref={ref => this.node = ref} 
				className="page pageCreate"
			>
				{isLoading ? <Loader type="loader" /> : ''}

				<form onSubmit={this.onSubmit}>
					<div className="rows">
						<div className="row">
							<Label text="Title" />
							<Input ref={ref => this.refName = ref} />
						</div>

						<div className="row">
							<Label text="Space" />
							<Select 
								id="select-space" 
								ref={ref => this.refSpace = ref}
								value="" 
								options={[]}
								onChange={this.onSpaceChange}
								menuParam={{
									horizontal: I.MenuDirection.Center,
									data: { maxHeight: 180 }
								}}
							/>
						</div>

						<div className="row">
							<Label text="Save as" />
							<Select 
								id="select-type" 
								ref={ref => this.refType = ref}
								readonly={!space}
								value="" 
								options={[]}
								onChange={this.onTypeChange}
								menuParam={{
									horizontal: I.MenuDirection.Center,
									data: { maxHeight: 180 }
								}}
							/>
						</div>

						<div className="row withContent" onClick={this.onCheckbox}>
							<Icon className={[ 'checkbox', (withContent ? 'active' : '') ].join(' ')} />
							<Label text="Add page content" />
						</div>

						<div className="row">
							<Label text="Tag" />

							<div id="select-tag" className="box cell isEditing c-select" onClick={this.focus}>
								<div className="value cellContent c-select">
									<span id="list">
										<DragBox onDragEnd={this.onDragEnd}>
											{tags.map((item: any, i: number) => (
												<span 
													key={i}
													id={`item-${item.id}`}
													className="itemWrap isDraggable"
													draggable={true}
													{...UtilCommon.dataProps({ id: item.id, index: i })}
												>
													<Tag 
														key={item.id}
														text={item.name}
														color={item.color}
														canEdit={true} 
														className={Relation.selectClassName(I.RelationType.MultiSelect)}
														onRemove={() => this.onValueRemove(item.id)}
													/>
												</span>
											))}
										</DragBox>
									</span>
									
									<span className="entryWrap">
										<span 
											id="entry" 
											contentEditable={true}
											suppressContentEditableWarning={true} 
											onFocus={this.onFocus}
											onInput={this.onInput}
											onKeyDown={this.onKeyDown}
											onKeyUp={this.onKeyUp}
										>
											{'\n'}
										</span>
										<div id="placeholder" className="placeholder">Type...</div>
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="buttonsWrapper">
						<Button color="pink" className="c32" text="Save" type="input" subType="submit" onClick={this.onSubmit} />
					</div>

					<Error text={error} />
				</form>
			</div>
		);
	};

	componentDidMount(): void {
		UtilData.createSubscriptions(() => {
			this.initSpace();
			this.initName();
			this.initType();

			this.setState({ withContent: Boolean(Storage.get('withContent')) });
		});
	};

	componentDidUpdate(): void {
		this.initType();
		this.placeholderCheck();
	};

	initSpace () {
		const spaces = this.getSpaces();

		if (!this.refSpace || !spaces.length) {
			return;
		};

		let check = null;
		let spaceId = commonStore.space || Storage.get('lastSpaceId');

		if (!spaceId) {
			spaceId = spaces.find(it => it.isPersonal)?.id;
		};
		if (spaceId) {
			check = spaces.find(it => it.id == spaceId);
		};

		if (!spaceId || !check) {
			spaceId = spaces[0].id;
		};

		this.refSpace.setOptions(spaces);
		this.refSpace.setValue(spaceId);
		this.onSpaceChange(spaceId);
	};

	initType () {
		const options = this.getTypes().map(it => ({ ...it, id: it.uniqueKey }));

		if (!this.refType || !options.length) {
			return;
		};

		this.details.type = this.details.type || Constant.typeKey.bookmark;
		this.refType.setOptions(options);
		this.refType.setValue(this.details.type);
	};

	initName () {
		if (!this.refName) {
			return;
		};

		Util.getCurrentTab(tab => {
			if (!tab) {
				return;
			};

			this.refName.setValue(tab.title);
			this.refName.focus();

			this.url = tab.url;
		});
	};

	getObjects (subId: string) {
		return dbStore.getRecords(subId);
	};

	getSpaces () {
		return UtilSpace.getList()
			.filter(it => it && UtilSpace.canMyParticipantWrite(it.targetSpaceId))
			.map(it => ({ ...it, id: it.targetSpaceId, object: it }));
	};

	getTypes () {
		const layouts = UtilObject.getPageLayouts();
		return this.getObjects(Constant.subId.type).
			map(Util.optionMapper).
			filter(this.filter).
			filter(it => layouts.includes(it.recommendedLayout) && (it.spaceId == commonStore.space)).
			sort(UtilData.sortByName);
	};

	filter (it: any) {
		return it && !it.isHidden && !it.isArchived && !it.isDeleted;
	};

	onTypeChange (id: string): void {
		this.details.type = id;
		this.forceUpdate();
	};

	onSpaceChange (id: string): void {
		commonStore.spaceSet(id);
		UtilData.createSubscriptions(() => this.forceUpdate());

		Storage.set('lastSpaceId', id);
	};

	getTagsValue () {
		return dbStore.getRecordIds(Constant.subId.option, '').
			filter(id => this.details.tag.includes(id)).
			map(id => detailStore.get(Constant.subId.option, id)).
			filter(it => it && !it._empty_);
	};

	clear () {
		const node = $(this.node);
		node.find('#entry').text(' ');

		this.focus();
	};

	focus () {
		const node = $(this.node);
		const entry = node.find('#entry');
		
		if (entry.length) {
			window.setTimeout(() => {
				entry.focus();
				setRange(entry.get(0), { start: 0, end: 0 });

				this.scrollToBottom();
			});
		};
	};

	onValueRemove (id: string) {
		this.setValue(this.details.tag.filter(it => it != id));
	};

	onDragEnd (oldIndex: number, newIndex: number) {
		this.setValue(arrayMove(this.details.tag, oldIndex, newIndex));
	};

	onKeyDown (e: any) {
		const node = $(this.node);
		const entry = node.find('#entry');

		keyboard.shortcut('backspace', e, (pressed: string) => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();
			
			this.details.tag.pop();
			this.setValue(this.details.tag);
		});

		this.placeholderCheck();
		this.scrollToBottom();
	};

	onKeyPress (e: any) {
		const node = $(this.node);
		const entry = node.find('#entry');

		if (entry.length && (entry.text().length >= MAX_LENGTH)) {
			e.preventDefault();
		};
	};

	onKeyUp (e: any) {
		menuStore.updateData('dataviewOptionList', { filter: this.getValue() });

		this.placeholderCheck();
		this.resize();
		this.scrollToBottom();
	};

	onInput () {
		this.placeholderCheck();
	};

	onFocus () {
		const relation = dbStore.getRelationByKey('tag');
		const element = '#select-tag';

		menuStore.open('dataviewOptionList', {
			element,
			horizontal: I.MenuDirection.Center,
			commonFilter: true,
			onOpen: () => {
				window.setTimeout(() => $(element).addClass('isFocused'));
			},
			onClose: () => $(element).removeClass('isFocused'),
			data: {
				canAdd: true,
				filter: '',
				value: this.details.tag,
				maxCount: relation.maxCount,
				noFilter: true,
				relation: observable.box(relation),
				maxHeight: 120,
				onChange: (value: string[]) => {
					this.setValue(value);
				}
			}
		});
	};

	placeholderCheck () {
		const node = $(this.node);
		const value = this.getValue();
		const list = node.find('#list');
		const placeholder = node.find('#placeholder');
		const length = this.details.tag.length;

		length ? list.show() : list.hide();
		value || length ? placeholder.hide() : placeholder.show();
	};

	getValue (): string {
		const node = $(this.node);
		const entry = node.find('#entry');

		return entry.length ? String(entry.text() || '').trim() : '';
	};

	setValue (value: string[]) {
		const relation = dbStore.getRelationByKey('tag');
		
		value = UtilCommon.arrayUnique(value);

		const length = value.length;
		if (relation.maxCount && (length > relation.maxCount)) {
			value = value.slice(length - relation.maxCount, length);
		};

		this.details.tag = value;
		this.clear();
		this.forceUpdate();
	};

	onSubmit (e: any) {
		e.preventDefault();

		if (this.isCreating) {
			return;
		};

		const { withContent } = this.state;

		this.isCreating = true;
		this.setState({ isLoading: true, error: '' });

		const details = Object.assign({ name: this.refName?.getValue(), origin: I.ObjectOrigin.Webclipper }, this.details);
		const type = details.type;

		delete(details.type);

		C.ObjectCreateFromUrl(details, commonStore.space, type, this.url, withContent, (message: any) => {
			this.setState({ isLoading: false });

			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			const object = message.details;

			extensionStore.createdObject = object;
			UtilRouter.go('/success', {});

			this.isCreating = false;
		});
	};

	onCheckbox () {
		const { withContent } = this.state;

		Storage.set('withContent', !withContent);
		this.setState({ withContent: !withContent });
	};

	scrollToBottom () {
		const node = $(this.node);
		const content: any = node.find('.cellContent');

		content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
	};

	resize () {
		$(window).trigger('resize.menuDataviewOptionList');
	};

});

export default Create;