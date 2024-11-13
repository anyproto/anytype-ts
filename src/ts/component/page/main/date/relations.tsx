import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Button, Filter } from 'Component';
import { C, I, S, U, M, analytics, Relation, keyboard, translate, Dataview, sidebar, J } from 'Lib';
import { RelationListWithValue } from 'Lib/api/response';
import type { RelationWithCounter } from 'Lib/api/response';
import { useEffect } from 'react';
// import HeadSimple from 'Component/page/elements/head/simple';


export interface RelationsSelectorProps {
	rootId?: string;
	relationId?: I.Block;
	className?: string;
};

// type RelationsSelectorState = ReturnType<typeof RelationListWithValue>;
// const RelationsSelector: RelationsSelectorComponent = observer(class Controls extends React.Component<RelationsSelectorProps, RelationsSelectorState> {
	
// 	_isMounted = false;
// 	node: any = null;
// 	refFilter = null;
// 	refHead = null;

// 	constructor(props: RelationsSelectorProps) {
	// 		super(props);
	// 		this.state = {
		// 			relations: [],
		// 		};
		// 	};
		
		// 	componentDidMount() {
			// 		this._isMounted = true;
			// 		C.RelationListWithValue(U.Router.getRouteSpaceId(), this.props.rootId, (message: any) => { });
			// 		// C.RelationListWithValue(U.Router.getRouteSpaceId(), rootId, (message: any) => {
				// 		// 	const { error } = message;
				// 		// 	if (error) {
					// 		// 		return;
					// 		// 	};
					// 		// 	const object = S.Detail.get(this.props.rootId, U.Router.getRouteSpaceId());
					// 		// 	console.log('Object:', object);
					// 		// 	const { countersList, relationskeysList } = message;
					// 		// 	const relationKeyWithCounterList = relationskeysList.map((relationKey: string, ndx: number) => {
						// 		// 		return {
							// 		// 			relationKey,
							// 		// 			counter: countersList[ndx],
							// 		// 		};
							// 		// 	});
							// 		// 	console.log('RelationKeyWithCounterList:', relationKeyWithCounterList);
							// 		// 	this.setState({ relationKeyWithCounterList: message.relationKeyWithCounterList });
							// 		// });
							// 	};
							
							// });
							

const RelationButton = SortableElement(({ relation, rootId }) => {
	const elementId = `date-relation-item-${relation.id}`;
	return (
		<div
			id={elementId}
			className={'dateRelationButton ' + (relation.id == rootId ? 'active' : '')}
			onClick={() => console.log(relation)}
		>
			{relation.name || translate('defaultNamePage')}
		</div>
	);
});

const RelationsContainer = SortableContainer(({ relations, rootId }: { relations: RelationWithCounter[], rootId: string }) => (
	<div id="relations" className="relations">
		{relations.map((relation, i: number) => (
			<RelationButton key={relation.relationkey} relation={relation} index={i} rootId={rootId} />
		))}
	</div>
));

const RelationsSelector: React.FC<RelationsSelectorProps> = (props: RelationsSelectorProps) => {

	const [relations, setRelations] = React.useState<RelationWithCounter[]>([]);

	const { rootId, className } = props;

	const cn: string[] = ['dateRelations'];
	if (className) {
		cn.push(className);
	};

	useEffect(() => {
		C.RelationListWithValue(U.Router.getRouteSpaceId(), rootId, (message: any) => {
			const { error } = message;
			if (error) {
				return;
			};
			const object = S.Detail.get(rootId, U.Router.getRouteSpaceId());
			console.log('Object:', object);
			const { countersList, relationskeysList } = message;
			const relationKeyWithCounterList = relationskeysList.map((relationKey: string, ndx: number) => {
				return {
					relationkey: relationKey,
					counter: countersList[ndx],
				};
			});
			console.log('RelationKeyWithCounterList:', relationKeyWithCounterList);
			setRelations(relationKeyWithCounterList);
		});
	}, [rootId]);

	return (
		<RelationsContainer
			relations={relations}
			rootId={rootId}
			axis="x"
			lockAxis="x"
			lockToContainerEdges={true}
			transitionDuration={150}
			distance={10}
			helperClass="isDragging"
		/>
	);
};

export default RelationsSelector;
