import { forwardRef, useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { arrayMove } from '@dnd-kit/sortable';
import { getRange, setRange } from 'selection-ranges';
import { Label, Input, Button, Select, Loader, Error, DragBox, Tag, Icon, IconObject } from 'Component';
import { I, C, S, U, J, Relation, keyboard, Storage } from 'Lib';
import Util from '../lib/util';

const Create = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const nodeRef = useRef<any>(null);
	const nameRef = useRef<Input>(null);
	const descriptionRef = useRef<Input>(null);
	const entryRef = useRef<any>(null);
	const spaceRef = useRef<Select>(null);
	const typeRef = useRef<Select>(null);
	const isCreatingRef = useRef(false);
	const urlRef = useRef('');
	const detailsRef = useRef({
		type: '',
		collection: '',
		tag: [],
	});

	const [ error, setError ] = useState('');
	const [ isLoading, setIsLoading ] = useState(false);
	const [ withContent, setWithContent ] = useState(Boolean(Storage.get('withContent')));
	const [ collection, setCollection ] = useState<any>(null);
	const [ dummy, setDummy ] = useState(0);
	const { space } = S.Common;

	const initSpace = () => {
		const spaces = getSpaces();

		if (!spaces.length) {
			return;
		};

		let spaceId = S.Common.space || Storage.get('lastSpaceId');

		if (!spaceId) {
			spaceId = spaces[0].id;
		};

		spaceRef.current?.setOptions(spaces);
		spaceRef.current?.setValue(spaceId);

		onSpaceChange(spaceId);
	};

	const initType = () => {
		const options = getTypes().map(it => ({ ...it, id: it.uniqueKey }));

		if (!options.length) {
			return;
		};

		detailsRef.current.type = detailsRef.current.type ||  J.Constant.typeKey.bookmark;

		typeRef.current?.setOptions(options);
		typeRef.current?.setValue(detailsRef.current.type);
	};

	const initCollection = () => {
		const { collection } = detailsRef.current;
		if (!collection) {
			return;
		};

		U.Object.getById(collection, {}, object => setCollection(object));
	};

	const initName = () => {
		Util.getCurrentTab(tab => {
			if (!tab) {
				return;
			};

			nameRef.current?.setValue(tab.title);
			nameRef.current?.focus();

			urlRef.current = tab.url;
		});
	};

	const getObjects = (subId: string) => {
		return S.Record.getRecords(subId);
	};

	const getSpaces = () => {
		return U.Space.getList()
			.filter(it => it && U.Space.canMyParticipantWrite(it.targetSpaceId))
			.map(it => ({ ...it, id: it.targetSpaceId, object: it }));
	};

	const getTypes = () => {
		const layouts = U.Object.getPageLayouts();
		return getObjects(J.Constant.subId.type).
			map(Util.optionMapper).
			filter(filter).
			filter(it => layouts.includes(it.recommendedLayout) && (it.spaceId == S.Common.space) && (it.uniqueKey != J.Constant.typeKey.template)).
			sort(U.Data.sortByName);
	};

	const filter = (it: any) => {
		return it && !it.isHidden && !it.isArchived && !it.isDeleted;
	};

	const onTypeChange = (id: string): void => {
		detailsRef.current.type = id;
		setDummy(dummy + 1);
	};

	const onCollection = (): void => {
		const collectionType = S.Record.getCollectionType();

		S.Menu.open('searchObject', {
			className: 'single',
			element: '#select-collection',
			data: {
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: I.ObjectLayout.Collection },
					{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
					{ relationKey: 'isReadonly', condition: I.FilterCondition.NotEqual, value: true },
				],
				onSelect: (el: any) => {
					setCollection(el);
				},
				canAdd: true,
				addParam: {
					name: 'Create new Collection',
					nameWithFilter: 'Create new Collection "%s"',
					onClick: (details: any) => {
						C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, message => {
							if (message.error.code) {
								setError(message.error.description);
								return;
							};

							setCollection(message.details);
						});
					},
				},
			}
		});
	};

	const onSpaceChange = (id: string): void => {
		S.Common.spaceSet(id);
		U.Subscription.createAll(() => setDummy(dummy + 1));

		Storage.set('lastSpaceId', id);
	};

	const getTagsValue = () => {
		return S.Record.getRecordIds(J.Constant.subId.option, '').
			filter(id => (detailsRef.current.tag as string[]).includes(id)).
			map(id => S.Detail.get(J.Constant.subId.option, id)).
			filter(it => it && !it._empty_);
	};

	const clear = () => {
		$(entryRef.current).text(' ');
		focus();
	};

	const focus = () => {
		const entry = $(entryRef.current);
		
		if (entry.length) {
			window.setTimeout(() => {
				entry.focus();
				setRange(entry.get(0), { start: 0, end: 0 });

				scrollToBottom();
			});
		};
	};

	const onValueRemove = (id: string) => {
		setValue(detailsRef.current.tag.filter(it => it != id));
	};

	const onDragEnd = (oldIndex: number, newIndex: number) => {
		setValue(arrayMove(detailsRef.current.tag, oldIndex, newIndex));
	};

	const onKeyDown = (e: any) => {
		const entry = $(entryRef.current);

		keyboard.shortcut('backspace', e, (pressed: string) => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();
			
			detailsRef.current.tag.pop();
			setValue(detailsRef.current.tag);
		});

		placeholderCheck();
		scrollToBottom();
	};

	const onKeyUp = (e: any) => {
		S.Menu.updateData('dataviewOptionList', { filter: getValue() });

		placeholderCheck();
		resize();
		scrollToBottom();
	};

	const onInput = () => {
		placeholderCheck();
	};

	const onFocus = () => {
		const relation = S.Record.getRelationByKey('tag');
		const element = '#select-tag';

		S.Menu.open('dataviewOptionList', {
			element,
			horizontal: I.MenuDirection.Center,
			commonFilter: true,
			onOpen: () => {
				window.setTimeout(() => $(element).addClass('isFocused'));
			},
			onClose: () => $(element).removeClass('isFocused'),
			data: {
				canAdd: true,
				canEdit: true,
				filter: '',
				value: detailsRef.current.tag,
				maxCount: relation.maxCount,
				noFilter: true,
				relation: observable.box(relation),
				maxHeight: 120,
				onChange: (value: string[]) => {
					setValue(value);
				}
			}
		});
	};

	const placeholderCheck = () => {
		const node = $(nodeRef.current);
		const value = getValue();
		const list = node.find('#list');
		const placeholder = node.find('#placeholder');
		const length = detailsRef.current.tag.length;

		length ? list.show() : list.hide();
		value || length ? placeholder.hide() : placeholder.show();
	};

	const getValue = (): string => {
		const entry = $(entryRef.current);
		return entry.length ? String(entry.text() || '').trim() : '';
	};

	const setValue = (value: string[]) => {
		const relation = S.Record.getRelationByKey('tag');
		
		value = U.Common.arrayUnique(value);

		const length = value.length;
		if (relation.maxCount && (length > relation.maxCount)) {
			value = value.slice(length - relation.maxCount, length);
		};

		detailsRef.current.tag = value;
		clear();
		setDummy(dummy + 1);
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		if (isCreatingRef.current) {
			return;
		};

		isCreatingRef.current = true;
		setIsLoading(true);
		setError('');

		const details: any = Object.assign({ 
			name: nameRef.current?.getValue(), 
			description: descriptionRef.current?.getValue(),
			origin: I.ObjectOrigin.Webclipper,
		}, detailsRef.current);
		const type = S.Record.getTypeByKey(details.type);

		delete(details.type);

		C.ObjectCreateFromUrl(details, S.Common.space, type?.uniqueKey, urlRef.current, withContent, type?.defaultTemplateId, (message: any) => {
			isCreatingRef.current = false;

			setIsLoading(false);

			if (message.error.code) {
				setError(message.error.description);
				return;
			};

			const object = message.details;

			if (collection) {
				C.ObjectCollectionAdd(collection.id, [ object.id ], () => {
					setCollection(null);
				});
			};

			S.Extension.createdObject = object;
			U.Router.go('/success', {});
		});
	};

	const onCheckbox = () => {
		Storage.set('withContent', !withContent);
		setWithContent(!withContent);
	};

	const scrollToBottom = () => {
		const node = $(nodeRef.current as any);
		const content: any = node.find('.cellContent');

		content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
	};

	const resize = () => {
		$(window).trigger('resize.menuDataviewOptionList');
	};

	const tags = getTagsValue();

	useEffect(() => {
		U.Subscription.createAll(() => {
			initSpace();
			initName();
			initType();
			initCollection();
		});
	}, []);

	useEffect(() => {
		initType();
		initCollection();
		placeholderCheck();
	});

	return (
		<div 
			ref={nodeRef} 
			className="page pageCreate"
		>
			{isLoading ? <Loader type={I.LoaderType.Loader} /> : ''}

			<form onSubmit={onSubmit}>
				<div className="rows">
					<div className="row">
						<Label text="Title" />
						<Input ref={nameRef} />
					</div>

					<div className="row">
						<Label text="Description" />
						<Input ref={descriptionRef} />
					</div>

					<div className="row">
						<Label text="Space" />
						<Select 
							id="select-space" 
							ref={spaceRef}
							value="" 
							options={[]}
							onChange={onSpaceChange}
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
							ref={typeRef}
							readonly={!space}
							value="" 
							options={[]}
							onChange={onTypeChange}
							menuParam={{
								horizontal: I.MenuDirection.Center,
								data: { maxHeight: 180 }
							}}
						/>
					</div>

					<div className="row withContent" onClick={onCheckbox}>
						<Icon className={[ 'checkbox', (withContent ? 'active' : '') ].join(' ')} />
						<Label text="Add page content" />
					</div>

					<div className="row">
						<Label text="Link to Collection" />
						<div id="select-collection" className="select" onMouseDown={onCollection}>
							<div className="item">
								{collection ? <IconObject object={collection} iconSize={16} /> : ''}
								<div className="name">{collection ? collection.name : 'Select Object'}</div>
							</div>
							<Icon className="arrow light" />
						</div>
					</div>

					<div className="row">
						<Label text="Tag" />

						<div id="select-tag" className="box cell isEditing c-select" onClick={focus}>
							<div className="value cellContent c-select">
								<span id="list">
									<DragBox onDragEnd={onDragEnd}>
										{tags.map((item: any, i: number) => (
											<span 
												key={i}
												id={`item-${item.id}`}
												className="itemWrap isDraggable"
												draggable={true}
												{...U.Common.dataProps({ id: item.id, index: i })}
											>
												<Tag 
													key={item.id}
													text={item.name}
													color={item.color}
													canEdit={true} 
													className={Relation.selectClassName(I.RelationType.MultiSelect)}
													onRemove={() => onValueRemove(item.id)}
												/>
											</span>
										))}
									</DragBox>
								</span>
								
								<span className="entryWrap">
									<span 
										id="entry" 
										ref={entryRef}
										contentEditable={true}
										suppressContentEditableWarning={true} 
										onFocus={onFocus}
										onInput={onInput}
										onKeyDown={onKeyDown}
										onKeyUp={onKeyUp}
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
					<Button color="pink" className="c32" text="Save" type="input" subType="submit" onClick={onSubmit} />
				</div>

				<Error text={error} />
			</form>
		</div>
	);

}));

export default Create;