import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import arrayMove from 'array-move';
import { getRange, setRange } from 'selection-ranges';
import { Label, Input, Button, Icon, Select, Loader, Error, DragBox, Tag, Textarea } from 'Component';
import { I, C, UtilCommon, UtilData, Relation, keyboard } from 'Lib';
import { dbStore, detailStore, commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';
import Util from '../lib/util';

interface State {
	error: string;
	isLoading: boolean;
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

	state = {
		isLoading: false,
		error: '',
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
		this.onBlur = this.onBlur.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.focus = this.focus.bind(this);
	};

	render () {
		const { isLoading, error } = this.state;
		const { workspace } = commonStore;
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
									data: { maxHeight: 120 }
								}}
							/>
						</div>

						<div className="row">
							<Label text="Save as" />
							<Select 
								id="select-type" 
								ref={ref => this.refType = ref}
								readonly={workspace ? true : false}
								value="" 
								options={[]}
								onChange={this.onTypeChange}
								menuParam={{
									horizontal: I.MenuDirection.Center,
									data: { maxHeight: 120 }
								}}
							/>
						</div>

						<div className="row">
							<Label text="Tag" />

							<div className="box cell isEditing c-select" onClick={this.focus}>
								<div id="select-tag" className="value cellContent c-select">
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
														className={Relation.selectClassName(I.RelationType.Tag)}
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
											onBlur={this.onBlur}
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

						<div className="row">
							<Label text="Comment" />
							<Textarea ref={ref => this.refComment = ref} placeholder="Add text" />
						</div>
					</div>

					{/*
					<div className="item add">
						<Icon className="plus" />
						Add relation
					</div>
					*/}

					<div className="buttons">
						<Button color="pink" className="c32" text="Save" type="input" subType="submit" onClick={this.onSubmit} />
					</div>

					<Error text={error} />
				</form>
			</div>
		);
	};

	componentDidMount(): void {
		this.init();
	};

	componentDidUpdate(): void {
		this.init();
	};

	init () {
		const spaces = this.getSpaces();
		const types = this.getTypes();

		if (this.refSpace && spaces.length) {
			this.refSpace.setOptions(spaces);
			this.refSpace.setValue(commonStore.workspace || spaces[0].id);
		};

		if (this.refType && types.length) {
			this.refType.setOptions(types);
			this.refType.setValue(this.details.type || types[0].id);
		};
	};

	getObjects (subId: string) {
		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id));
	};

	getSpaces () {
		return this.getObjects(Constant.subId.space).map(it => this.mapper(it)).filter(it => it);
	};

	getTypes () {
		return this.getObjects(Constant.subId.type).map(it => this.mapper(it)).filter(it => this.filter(it));
	};

	mapper (it: any) {
		return it._empty_ ? null : { ...it, object: (!it.iconEmoji ? it : null) };
	};

	filter (it: any) {
		return it && !it.isHidden && !it.isArchived && !it.isDeleted;
	};

	onTypeChange (id: string): void {
		this.details.type = id;
		this.forceUpdate();
	};

	onSpaceChange (id: string): void {
		commonStore.workspaceSet(id);
		UtilData.createsSubscriptions(() => this.forceUpdate());
	};

	getTagsValue () {
		return this.details.tag.map(id => detailStore.get(Constant.subId.option, id)).filter(it => it && !it._empty_);
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
			
			const value = this.getValue();
			value.existing.pop();
			this.setValue(value.existing);
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
		menuStore.updateData('dataviewOptionList', { filter: this.getValue().new });

		this.placeholderCheck();
		this.resize();
		this.scrollToBottom();
	};

	onInput () {
		this.placeholderCheck();
	};

	onFocus () {
		const relation = dbStore.getRelationByKey('tag');

		menuStore.open('dataviewOptionList', {
			element: '#select-tag',
			horizontal: I.MenuDirection.Center,
			commonFilter: true,
			noFlipY: true,
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

	onBlur () {
	};

	placeholderCheck () {
		const node = $(this.node);
		const value = this.getValue();
		const list = node.find('#list');
		const placeholder = node.find('#placeholder');

		if (value.existing.length) {
			list.show();
		} else {
			list.hide();
		};

		if (value.new || value.existing.length) {
			placeholder.hide();
		} else {
			placeholder.show();
		};
	};

	getValue () {
		const node = $(this.node);
		const list = node.find('#list');
		const items = list.find('.itemWrap');
		const entry = node.find('#entry');
		const existing: any[] = [];

		items.each((i: number, item: any) => {
			item = $(item);
			existing.push(item.data('id'));
		});

		return {
			existing,
			new: (entry.length ? String(entry.text() || '').trim() : ''),
		};
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

		Util.getCurrentTab(tab => {
			if (!tab) {
				return;
			};

			this.isCreating = true;

			const details = Object.assign({
				source: tab.url,
				name: this.refName?.getValue(),
			}, this.details);

			this.setState({ isLoading: true, error: '' });

			C.ObjectCreateBookmark(details, (message: any) => {
				this.setState({ isLoading: false });

				if (message.error.code) {
					this.setState({ error: message.error.description });
				} else {
					UtilCommon.route('/success', {});
				};

				this.isCreating = false;
			});
		});
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