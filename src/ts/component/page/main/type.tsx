import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainEdit as Header } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import { blockStore, dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {
	isPopup?: boolean;
};

const BLOCK_ID = 'dataview';

@observer
class PageMainType extends React.Component<Props, {}> {

	id: string = '';
	refHeader: any = null;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { match, isPopup } = this.props;
		const rootId = match.params.id;
		const object = blockStore.getDetails(rootId, rootId);
		const block = blockStore.getLeaf(rootId, BLOCK_ID) || {};
		const meta = dbStore.getMeta(rootId, block.id);
		const data = dbStore.getData(rootId, block.id);
		const relations = dbStore.getRelations(rootId, rootId).filter((it: any) => { return !it.isHidden; }).sort(DataUtil.sortByName);

		const Relation = (item: any) => (
			<div className="item">
				<div className="clickable">
					<Icon className={[ 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
					<div className="name">{item.name}</div>
				</div>
				<div className="value">Empty</div>
			</div>
		);

		const Row = (item: any) => {
			const author = blockStore.getDetails(rootId, item.creator);
			return (
				<tr className="row">
					<td className="cell">
						<div className="cellContent">
							<IconObject object={item} />
							<div className="name">{item.name}</div>
						</div>
					</td>
					<td className="cell">
						<div className="cellContent">{Util.date(DataUtil.dateFormat(I.DateFormat.MonthAbbrBeforeDay), item.lastModifiedDate)}</div>
					</td>
					<td className="cell">
						<div className="cellContent">
							<IconObject object={author} />
							<div className="name">{author.name}</div>
						</div>
					</td>
				</tr>
			);
		};

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} isPopup={isPopup} />
				<div className="wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={object} />
						</div>
						<div className="side right">
							<div className="title">{object.name}</div>
							<div className="descr">{object.description}</div>
						</div>
					</div>
					
					<div className="section note">
						<div className="title">Notes</div>
						<div className="content">People often distinguish between an acquaintance and a friend, holding that the former should be used primarily to refer to someone with whom one is not especially close. Many of the earliest uses of acquaintance were in fact in reference to a person with whom one was very close, but the word is now generally reserved for those who are known only slightly.</div>
					</div>

					<div className="section relation">
						<div className="title">Recommended relations</div>
						<div className="content">
							{relations.map((item: any, i: number) => (
								<Relation key={i} {...item} />
							))}
						</div>
					</div>

					<div className="section set">
						<div className="title">Set of objects</div>
						<div className="content">
							<table>
								<thead>
									<tr className="row">
										<th className="cellHead">
											<div className="name">Name</div>
										</th>
										<th className="cellHead">
											<div className="name">Updated</div>
										</th>
										<th className="cellHead">
											<div className="name">Owner</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{data.map((item: any, i: number) => (
										<Row key={i} {...item} />
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	open () {
		const { match } = this.props;
		const rootId = match.params.id;

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;

		C.BlockOpen(rootId, (message: any) => {
			this.forceUpdate();
			this.refHeader.forceUpdate();
		});
	};
	
};

export default PageMainType;