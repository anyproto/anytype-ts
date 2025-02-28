import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import { observer } from 'mobx-react';
import { Icon, IconObject, ObjectName, Button } from 'Component';
import { I, C, S, U, translate, analytics, dispatcher } from 'Lib';

interface Props {
	rootId: string;
	isPopup?: boolean;
	renderDiff: (previousId: string, events: any[]) => void;
	setVersion: (version: I.HistoryVersion) => void;
	setLoading: (v: boolean) => void;
};

interface State {
	versions: I.HistoryVersion[];
	version: I.HistoryVersion;
	isLoading: boolean;
};

const LIMIT_RECORDS = 1000;
const LIMIT_AUTHORS = 5;

const HistoryRight = observer(class HistoryRight extends React.Component<Props, State> {

	node = null;
	refScroll = null;
	state = {
		versions: [] as I.HistoryVersion[],
		version: null,
		isLoading: false,
	};
	top = 0;
	lastId = '';
	toggles = [];

	constructor (props: Props) {
		super(props);

		this.onRestore = this.onRestore.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const groups = this.groupData();
		const year = U.Date.date('Y', U.Date.now());
		const canWrite = U.Space.canMyParticipantWrite();
		const showButtons = this.showButtons();
		const showSidebar = S.Common.getShowSidebarRight(isPopup);
		const cn = [];

		if (showSidebar) {
			cn.push('withSidebar');
		};

		if (showButtons) {
			cn.push('withButtons');
		};

		const Section = (item: any) => {
			const y = U.Date.date('Y', item.time);
			const format = y == year ? 'M d' : 'M d, Y';
			const day = U.Date.dayString(item.time);
			const date = day ? day : U.Date.date(format, item.time);
			const authors = U.Common.arrayUnique(item.list.map(it => it.authorId)).slice(0, LIMIT_AUTHORS);

			return (
				<div id={`section-${item.hash}`} className="section">
					<div className="head" onClick={e => this.toggleSection(e, item.id, item.hash)}>
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
				icon = <Icon className="arrow" onClick={e => this.onArrow(e, item.id)} />;
			} else {
				icon = <Icon className="blank" />;
			};

			return (
				<div id={`item-${item.id}`} className="child">
					<div className="info" onClick={e => this.loadVersion(item.id)}>
						{icon}
						<div className="date">{U.Date.date('g:i A', item.time)}</div>
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
					<div className="info" onClick={e => this.loadVersion(item.id)}>
						<div className="date">{U.Date.date('g:i A', item.time)}</div>

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
		
		return (
			<div 
				ref={ref => this.node = ref} 
				id="historySideRight" 
				className={cn.join(' ')}
			>
				<div className="head">
					<div className="name">{translate('commonVersionHistory')}</div>
					<Icon className="close withBackground" onClick={this.onClose} />
				</div>

				<div 
					ref={ref => this.refScroll = ref} 
					className="scrollWrap" 
					onScroll={this.onScroll}
				>
					<div className="scroll">
						{groups.map((item: any, i: number) => <Section key={i} {...item} />)}
					</div>
				</div>

				{showButtons ? (
					<div className="buttons">
						<Button text={translate('commonCancel')} onClick={this.onClose} />
						<Button text={translate('pageMainHistoryRestore')} className={!canWrite ? 'disabled' : ''} onClick={this.onRestore} />
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		this.loadList('');
	};

	componentDidUpdate () {
		this.init();
	};

	componentWillUnmount(): void {
		this.toggles = [];
	};
	
	onClose () {
		const { rootId } = this.props;

		U.Object.openAuto(S.Detail.get(rootId, rootId, []));
	};

	onRestore (e: any) {
		e.persist();

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const { version } = this.state;
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, []);

		if (!version) {
			return;
		};

		C.HistorySetVersion(rootId, version.id, () => {
			U.Object.openEvent(e, object);
			analytics.event('RestoreFromHistory');
		});
	};

	init () {
		const { version } = this.state;
		const node = $(this.node);
		const groups = this.groupData();
		const unwrapped = this.unwrapGroups('', groups);

		node.find('.active').removeClass('active');
		this.toggles.forEach(id => this.initToggle(id, unwrapped));

		if (version) {
			this.initToggle(version.id, unwrapped);
			node.find(`#item-${version.id}`).addClass('active');
		};

		$(this.refScroll).scrollTop(this.top);
	};

	initToggle (id: string, list: any[]) {
		const version = list.find(it => it.id == id);
		if (!version) {
			return;
		};

		const node = $(this.node);
		const groupId = this.getGroupId(version.time);
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

	toggleSection (e: any, id: string, hash: string) {
		e.stopPropagation();

		const section = $(this.node).find(`#section-${hash}`);

		this.toggleChildren(id, section, section.find('.items'));
	};

	onArrow (e: any, id: string) {
		e.stopPropagation();

		const node = $(this.node);

		this.toggleChildren(id, node.find(`#item-${id}`), node.find(`#children-${id}`));
	};

	toggleChildren (id: string, item: any, children: any) {
		const isActive = item.hasClass('isExpanded');

		let height = 0;
		if (isActive) {
			item.removeClass('isExpanded');

			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			window.setTimeout(() => children.css({ height: 0 }), 15);
			window.setTimeout(() => children.hide(), 215);

			this.toggles = this.toggles.filter(it => it != id);
		} else {
			item.addClass('isExpanded');

			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			window.setTimeout(() => children.css({ height: height }), 15);
			window.setTimeout(() => children.css({ overflow: 'visible', height: 'auto' }), 215);

			this.toggles.push(id);
		};
	};

	loadList (lastId: string) { 
		const { versions, version, isLoading } = this.state;
		const { rootId, setLoading } = this.props;
		const object = S.Detail.get(rootId, rootId);
		
		if (isLoading || (this.lastId && (lastId == this.lastId))) {
			return;
		};

		this.setState({ isLoading: true });
		this.lastId = lastId;

		setLoading(true);

		C.HistoryGetVersions(rootId, lastId, LIMIT_RECORDS, (message: any) => {
			this.setState({ isLoading: false });
			setLoading(false);

			if (message.error.code) {
				U.Object.openRoute({ id: rootId, layout: object.layout });
				return;
			};

			const list = U.Common.arrayUniqueObjects(versions.concat(message.versions || []), 'id');

			this.setState({ versions: list });

			if (!lastId && list.length) {
				this.loadVersion(list[0].id);
			};

			this.checkScroll();
		});
	};

	loadVersion (id: string) {
		const { rootId, setVersion } = this.props;

		C.HistoryShowVersion(rootId, id, (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			if (!message.error.code) {
				dispatcher.onObjectView(rootId, '', message.objectView);
				setVersion(message.version);
			};

			this.setState({ version: message.version }, () => this.loadDiff(id));

			$(window).trigger('resize');
			analytics.event('ScreenHistoryVersion');
		});
	};

	loadDiff (id: string) {
		const { rootId, renderDiff } = this.props;
		const previousId = this.getPreviousVersionId(id);

		C.HistoryDiffVersions(rootId, S.Common.space, id, previousId, (message: any) => {
			const { events } = message;

			C.HistoryShowVersion(rootId, previousId, (message: any) => {
				if (!message.error.code) {
					dispatcher.onObjectView(rootId, previousId, message.objectView);
				};

				renderDiff(previousId, events);
				S.Common.diffSet(events);
			});
		});
	};

	onScroll () {
		const scroll = $(this.refScroll);
		const height = scroll.get(0).scrollHeight;

		this.top = scroll.scrollTop();

		if (this.top >= height - scroll.height() - 12) {
			this.loadMore();
		};
	};

	checkScroll () {
		const node = $(this.node);
		const wrap = $(this.refScroll);
		const scroll = node.find('.scroll');

		if (scroll.height() < wrap.height()) {
			this.loadMore();
		};
	};

	loadMore () {
		const { versions } = this.state;
		const lastId = versions[versions.length - 1].id;

		if (this.lastId != lastId) {
			this.loadList(lastId);
		};
	};

	getPreviousVersionId (id: string): string {
		const { versions } = this.state;

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
	
	groupData () {
		const groups: any[] = [];
		const groupByAuthor = [];
		const versions = this.state.versions || [];
		const timeFormat = 'd.m.Y H';

		let id = '';

		for (let i = 0; i < versions.length; i++) {
			const version = versions[i] as any;
			const prev = versions[i - 1];
			const cid = this.getGroupId(version.time);

			let add = true;

			if (prev) {
				const pid = this.getGroupId(prev.time);

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
			const id = this.getGroupId(version.time);
			const group = groups.find(it => it.id == id);

			if (group) {
				group.list.push(version);
			} else {
				groups.push({ id, list: [ version ], time: version.time, hash: sha1(id), isSection: true });
			};
		};

		return groups;
	};

	unwrapGroups (parentId: string, groups: any[]) {
		let out = [];

		for (const group of groups) {
			const list = group.list;

			out.push({ ...group, parentId });
			if (list && (list.length > 0)) {
				out = out.concat(this.unwrapGroups(group.id, list));
			};

			delete(group.list);
		};

		return out;
	};

	getGroupId (time: number) {
		return U.Date.date('M d, Y', time);
	};

	showButtons (): boolean {
		const { version, versions } = this.state;

		if (!version || !versions.length) {
			return false;
		};

		return version.id != versions[0].id;
	};

});

export default HistoryRight;
