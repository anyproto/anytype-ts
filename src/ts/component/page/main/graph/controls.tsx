import * as React from 'react';
import { Filter, MenuItemVertical, Icon } from 'ts/component';
import { observer } from 'mobx-react';

interface Props {
    data: any;
    onFilterChange: (v: string) => void;
    onSwitch: (id: string, v: string) => void;
};

const GraphControls = observer(class GraphControls extends React.Component<Props, {}> {

    refFilter: any = null;

	render () {
        const { data, onSwitch, onFilterChange } = this.props;
		const itemsAppearance: any[] = [
			{ id: 'labels', icon: 'label', name: 'Labels' },
			{ id: 'links', icon: 'link', name: 'Links' },
			{ id: 'relations', icon: 'relation', name: 'Relations' },
			{ id: 'orphans', icon: 'orphan', name: 'Orphans' },
		];

		return (
			<div>
                <div className="sections">
                    <div className="section">
                        <div className="name">Appearance</div>
                        {itemsAppearance.map((item: any, i: number) => (
                            <MenuItemVertical 
                                key={i}
                                {...item}
                                withSwitch={true}
                                switchValue={data[item.id]}
                                onSwitch={(e: any, v: any) => { onSwitch(item.id, v); }}
                            />
                        ))}
                    </div>
                </div>

                <div className="bottom">
                    <Icon className="search" />
                    <Filter ref={(ref: any) => { this.refFilter = ref; }} placeholder="Search for an object" onChange={onFilterChange} />
                </div>
			</div>
		);
	};

    componentDidMount () {
       this.focus();
    };

    onClose () {
        this.refFilter.setValue('');
    };

    focus () {
		window.setTimeout(() => { 
			if (this.refFilter) {
				this.refFilter.focus(); 
			};
		}, 15);
	};

});

export default GraphControls;