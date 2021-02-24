import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainType as Header } from 'ts/component';
import { I, DataUtil, Util } from 'ts/lib';
import { dbStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainType extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

	};

	render () {
		const { match } = this.props;
		const objectType = dbStore.getObjectType(match.params.id);
		const relations = Util.objectCopy(objectType.relations);

		relations.sort(DataUtil.sortByName);

		const Relation = (item: any) => (
			<div className="item">
				<div className="clickable">
					<Icon className={[ 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
					<div className="name">{item.name}</div>
				</div>
				<div className="value">Empty</div>
			</div>
		);

		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					<div className="head">
						<div className="side left">
							<IconObject size={96} object={objectType} />
						</div>
						<div className="side right">
							<div className="title">{objectType.name}</div>
							<div className="descr">{objectType.description}</div>
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
									<tr className="row">
										<td className="cell">
											<div className="cellContent">
												<IconObject object={{ ...objectType, layout: I.ObjectLayout.ObjectType }} />
												<div className="name">Joseph Wolf</div>
											</div>
										</td>
										<td className="cell">
											<div className="cellContent">Apr 11, 2020</div>
										</td>
										<td className="cell">
											<div className="cellContent">
												<IconObject object={{ ...objectType, layout: I.ObjectLayout.ObjectType }} />
												<div className="name">Joseph Wolf</div>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
};

export default PageMainType;