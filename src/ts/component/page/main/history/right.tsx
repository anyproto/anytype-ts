import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Button } from 'Component';
import { I, C, S, U, translate, analytics, dispatcher, sidebar } from 'Lib';

interface Props {
	rootId: string;
	isPopup?: boolean;
	renderDiff: (previousId: string, events: any[]) => void;
	setVersion: (version: I.HistoryVersion) => void;
	setLoading: (v: boolean) => void;
};

interface Ref {
	getNode: () => any;
};

const LIMIT_RECORDS = 1000;
const LIMIT_AUTHORS = 5;

const HistoryRight = observer(forwardRef<Ref, Props>((props, ref) => {

	const [ versions, setVersions ] = useState<I.HistoryVersion[]>([]);
	const [ version, setVersion ] = useState<I.HistoryVersion>(null);
	const [ isLoading, setIsLoading ] = useState(false);
	const { rootId, isPopup, renderDiff } = props;
	const { timeFormat, showRelativeDates } = S.Common;
	const nodeRef = useRef(null);
	const scrollRef = useRef(null);
	const togglesRef = useRef<string[]>([]);
	const lastIdRef = useRef('');
	const topRef = useRef(0);
	const originalLayoutRef = useRef<I.ObjectLayout>(null);
	const year = U.Date.date('Y', U.Date.now());
	const canWrite = U.Space.canMyParticipantWrite();
	const data = sidebar.getData(I.SidebarPanel.Right, isPopup);
	const cn = [];

	const showButtons = (): boolean => {
		if (!version || !versions.length) {
			return false;
		};

		return version.id != versions[0].id;
	};

	if (!data.isClosed) {
		cn.push('withSidebar');
	};

	if (showButtons()) {
		cn.push('withButtons');
	};

	const onClose = () => {
		const object = S.Detail.get(rootId, rootId, []);
		
		U.Object.openAuto({ ...object, layout: originalLayoutRef.current ?? object.layout });
	};

	const onRestore = (e: any) => {
		e.persist();

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const object = S.Detail.get(rootId, rootId, []);

		if (!version) {
			return;
		};

		C.HistorySetVersion(rootId, version.id, () => {
			U.Object.openEvent(e, object);
			analytics.event('RestoreFromHistory');
		});
	};

	const init = () => {
		const node = $(nodeRef.current);
		const groups = groupData();
		const unwrapped = unwrapGroups('', groups);

		node.find('.active').removeClass('active');
		togglesRef.current.forEach(id => initToggle(id, unwrapped));

		if (version) {
			initToggle(version.id, unwrapped);
			node.find(`#item-${version.id}`).addClass('active');
		};

		$(scrollRef.current).scrollTop(topRef.current);
	};

	const initToggle = (id: string, list: any[]) => {
		const version = list.find(it => it.id == id);
		if (!version) {
			return;
		};

		const node = $(nodeRef.current);
		const groupId = getGroupId(version.time);
		const hash = sha1(groupId);
		const section = node.find(`#section-${hash}`);

		section.addClass('isExpanded');
		section.find('.items').show();

		const parent = list.find(it => it.id == version.parentId);
		if (!parent) {
			return;
		};

		let children = null; 
		let groupItem = null;

		if (version.isTimeGroup) {
			groupItem = node.find(`#item-${id}`);
			children = node.find(`#children-${id}`);
		} else {
			groupItem = node.find(`#item-${parent.id}`);
			children = node.find(`#children-${parent.id}`);
		};

		if (children && children.length) {
			children.show();
		};

		if (groupItem && groupItem.length) {
			groupItem.addClass('isExpanded');
		};
	};

	const toggleSection = (e: any, id: string, hash: string) => {
		e.stopPropagation();

		const section = $(nodeRef.current).find(`#section-${hash}`);

		toggleChildren(id, section, section.find('.items'));
	};

	const onArrow = (e: any, id: string) => {
		e.stopPropagation();

		const node = $(nodeRef.current);

		toggleChildren(id, node.find(`#item-${id}`), node.find(`#children-${id}`));
	};

	const toggleChildren = (id: string, item: any, children: any) => {
		const isActive = item.hasClass('isExpanded');

		let height = 0;
		if (isActive) {
			item.removeClass('isExpanded');

			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			window.setTimeout(() => children.css({ height: 0 }), 15);
			window.setTimeout(() => children.hide(), 215);

			togglesRef.current = togglesRef.current.filter(it => it != id);
		} else {
			item.addClass('isExpanded');

			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			window.setTimeout(() => children.css({ height: height }), 15);
			window.setTimeout(() => children.css({ overflow: 'visible', height: 'auto' }), 215);

			togglesRef.current.push(id);
		};
	};

	const loadList = (id: string) => {
		const object = S.Detail.get(rootId, rootId);

		// Store original layout on initial load before any version overwrites it
		if (!id && (originalLayoutRef.current === null)) {
			originalLayoutRef.current = object.layout;
		};

		if (isLoading || (lastIdRef.current && (id == lastIdRef.current))) {
			return;
		};

		setIsLoading(true);
		lastIdRef.current = id;

		C.HistoryGetVersions(rootId, id, LIMIT_RECORDS, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				U.Object.openRoute({ id: rootId, layout: object.layout });
				return;
			};

			const list = U.Common.arrayUniqueObjects(versions.concat(message.versions || []), 'id');

			setVersions(list);

			if (!id && list.length) {
				loadVersion(list[0].id);
			};

			checkScroll();
		});
	};

	const loadVersion = (id: string) => {
		C.HistoryShowVersion(rootId, id, (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code)) {
				return;
			};

			if (!message.error.code) {
				dispatcher.onObjectView(rootId, '', message.objectView, false);
				setVersion(message.version);
				props.setVersion(message.version);
			};

			$(window).trigger('resize');
			analytics.event('ScreenHistoryVersion');
		});
	};

	const loadDiff = (id: string) => {
		const previousId = getPreviousVersionId(id);

		C.HistoryDiffVersions(rootId, S.Common.space, id, previousId, (message: any) => {
			const { events } = message;

			C.HistoryShowVersion(rootId, previousId, (message: any) => {
				if (!message.error.code) {
					dispatcher.onObjectView(rootId, previousId, message.objectView, false);
				};

				renderDiff(previousId, events);
				S.Common.diffSet(events);
			});
		});
	};

	const onScroll = () => {
		const scroll = $(scrollRef.current);
		const height = scroll.get(0).scrollHeight;

		topRef.current = scroll.scrollTop();

		if (topRef.current >= height - scroll.height() - 12) {
			loadMore();
		};
	};

	const checkScroll = () => {
		const node = $(nodeRef.current);
		const wrap = $(scrollRef.current);
		const scroll = node.find('.scroll');

		if (scroll.height() < wrap.height()) {
			loadMore();
		};
	};

	const loadMore = () => {
		if (!versions.length) {
			return;
		};

		const id = versions[versions.length - 1].id;

		if (id != lastIdRef.current) {
			loadList(id);
		};
	};

	const getPreviousVersionId = (id: string): string => {
		if (!versions.length) {
			return '';
		};

		const idx = versions.findIndex(it => it.id == id);

		if (idx >= (versions.length - 1)) {
			return '';
		};

		const prev = versions[idx + 1];
		return prev ? prev.id : '';
	};
	
	const groupData = () => {
		const groups: any[] = [];
		const groupByAuthor = [];
		const timeFormat = 'd.m.Y H';

		let id = '';

		for (let i = 0; i < versions.length; i++) {
			const version = versions[i] as any;
			const prev = versions[i - 1];
			const cid = getGroupId(version.time);

			let add = true;

			if (prev) {
				const pid = getGroupId(prev.time);

				if ((cid == pid) && (version.authorId == prev.authorId)) {
					const item = groupByAuthor.find(it => it.id == id);
					if (item) {
						item.list = (item.list || []).concat(version);
						add = false;
					};
				};
			};

			if (add) {
				groupByAuthor.push({ ...version, list: [] });
				id = version.id;
			};
		};

		for (const version of groupByAuthor) {
			const list = version.list || [];
			const out = [];

			for (let i = 0; i < list.length; i++) {
				const current = list[i] as any;
				const timeGroupId = U.Date.date(timeFormat, current.time);
				const group = out.find(it => it.timeGroupId == timeGroupId);

				if (group) {
					group.list.push(current);
				} else {
					out.push({ timeGroupId, ...current, list: [], isTimeGroup: true });
				};
			};

			version.list = out;
		};

		for (const version of groupByAuthor) {
			const id = getGroupId(version.time);
			const group = groups.find(it => it.id == id);

			if (group) {
				group.list.push(version);
			} else {
				groups.push({ id, list: [ version ], time: version.time, hash: sha1(id), isSection: true });
			};
		};

		return groups;
	};

	const unwrapGroups = (parentId: string, groups: any[]) => {
		let out = [];

		for (const group of groups) {
			const list = group.list;

			out.push({ ...group, parentId });
			if (list && (list.length > 0)) {
				out = out.concat(unwrapGroups(group.id, list));
			};

			delete(group.list);
		};

		return out;
	};

	const getGroupId = (time: number) => {
		return U.Date.date('M d, Y', time);
	};

	const groups = groupData();

	const Section = (item: any) => {
		const y = U.Date.date('Y', item.time);
		const format = y == year ? 'M d' : 'M d, Y';
		const day = showRelativeDates ? U.Date.dayString(item.time) : null;
		const date = day ? day : U.Date.date(format, item.time);
		const authors = U.Common.arrayUnique(item.list.map(it => it.authorId)).slice(0, LIMIT_AUTHORS);

		return (
			<div id={`section-${item.hash}`} className="section">
				<div className="head" onClick={e => toggleSection(e, item.id, item.hash)}>
					<div className="date">{date}</div>
					<div className="authors">
						{authors.map((id: string, i: number) => (
							<IconObject 
								key={id} 
								object={U.Space.getParticipant(id)} 
								size={18} 
								style={{ zIndex: (LIMIT_AUTHORS - i) }} 
							/>
						))}
					</div>
					<Icon className="arrow" />
				</div>
				<div className="items">
					{item.list.map((item: any, i: number) => (
						<Item key={item.id} {...item} />
					))}
				</div>
			</div>
		);
	};

	const Child = (item: any) => {
		const withChildren = item.list && item.list.length;

		let icon = null;
		if (withChildren) {
			icon = <Icon className="arrow" onClick={e => onArrow(e, item.id)} />;
		} else {
			icon = <Icon className="blank" />;
		};

		return (
			<div id={`item-${item.id}`} className="child">
				<div className="info" onClick={e => loadVersion(item.id)}>
					{icon}
					<div className="date">{U.Date.timeWithFormat(timeFormat, item.time, true)}</div>
				</div>

				{withChildren ? (
					<div id={`children-${item.id}`} className="children">
						{item.list.map((child: any, i: number) => <Child key={`${item.id}-${child.id}`} {...child} />)}
					</div>
				) : ''}
			</div>
		);
	};

	const Item = (item: any) => {
		const withChildren = item.list && item.list.length;
		const author = U.Space.getParticipant(item.authorId);

		return (
			<div 
				id={`item-${item.id}`} 
				className="item" 
			>
				<div className="info" onClick={e => loadVersion(item.id)}>
					<div className="date">{U.Date.timeWithFormat(timeFormat, item.time)}</div>

					{author ? (
						<div className="author">
							<IconObject object={author} size={16} />
							<ObjectName object={author} />
						</div>
					) : ''}
				</div>

				{withChildren ? (
					<div id={`children-${item.id}`} className="children">
						{item.list.map((child: any, i: number) => <Child key={`${item.id}-${child.id}`} {...child} />)}
					</div>
				) : ''}
			</div>
		);
	};

	useEffect(() => {
		loadList('');
	}, []);

	useEffect(() => {
		init();
	});

	useEffect(() => {
		if (version) {
			loadDiff(version.id);
		};
	}, [ version ]);

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
	}));

	return (
		<div 
			ref={nodeRef} 
			id="historySideRight" 
			className={cn.join(' ')}
		>
			<div className="head">
				<div className="name">{translate('commonVersionHistory')}</div>
				<Icon className="close withBackground" onClick={onClose} />
			</div>

			<div 
				ref={scrollRef} 
				className="scrollWrap" 
				onScroll={onScroll}
			>
				<div className="scroll">
					{groups.map((item: any, i: number) => <Section key={i} {...item} />)}
				</div>
			</div>

			{showButtons() ? (
				<div className="buttons">
					<Button text={translate('commonCancel')} onClick={onClose} />
					<Button text={translate('pageMainHistoryRestore')} className={!canWrite ? 'disabled' : ''} onClick={onRestore} />
				</div>
			) : ''}
		</div>
	);

}));

export default HistoryRight;