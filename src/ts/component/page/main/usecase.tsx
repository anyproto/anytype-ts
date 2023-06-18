import * as React from 'react';
import $ from 'jquery';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button, Loader } from 'Component';
import { C, I, translate, analytics, UtilData, Storage } from 'Lib';
import { authStore, blockStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	isLoading: boolean;
};

const PageMainUsecase = observer(class PageMainUsecase extends React.Component<I.PageComponent, State> {

	state = {
		isLoading: false
	};

    constructor (props: I.PageComponent) {
        super(props);

        this.onClick = this.onClick.bind(this);
    };

    render () {
		const { isLoading } = this.state;
		const items = this.getItems();

        const Case = (item: any) => (
            <div className="item" onClick={e => this.onClick(e, item.id)}>
				<div className="head">
                	<Title text={translate(`authUsecaseCase${item.id}Title`)} />
                	<Label text={translate(`authUsecaseCase${item.id}Label`)} />
				</div>
                <div className="picture">
					<img src={item.img} />
				</div>
            </div>
        );

        return (
            <div className="usecaseWrapper">
                <div className="fadeInOverlay" />

                <Frame>
					{isLoading ? <Loader /> : ''}

                    <Title text={translate('authUsecaseTitle')} />
                    <Label text={translate('authUsecaseLabel')} />

                    <div className="list">
                        {items.map((item: any, i: number) => (
                            <Case key={i} {...item} />
                        ))}
                    </div>

                    <div className="buttons">
                        <Button color="blank" className="c36" text={translate('authUsecaseSkip')} onClick={e => this.onClick(e, I.Usecase.None)} />
                    </div>
                </Frame>
            </div>
        );
    };

	getItems () {
 		return _.shuffle([
			{ id: I.Usecase.Personal, img: 'img/usecase/personal-projects.png' },
			{ id: I.Usecase.Notes, img: 'img/usecase/notes-or-diary.png' },
			{ id: I.Usecase.Knowledge, img: 'img/usecase/knowledge-base.png' },
        ]);
	}

    onClick (e: any, id: number) {
        e.preventDefault();

		const { isLoading } = this.state;

        if (isLoading) {
            return;
        };

        this.setState({ isLoading: true });

        C.ObjectImportUseCase(id, () => {
            $('.usecaseWrapper').css({ 'opacity': 0 });

			analytics.event('SelectUsecase', { type: id });

			window.setTimeout(() => {
				commonStore.redirectSet('/main/graph');

				UtilData.onAuth(authStore.account, () => {
					const blocks = blockStore.getBlocks(blockStore.widgets, it => it.isLink() && (it.content.targetBlockId == Constant.widgetId.recent));
					if (blocks.length) {
						Storage.setToggle('widget', blocks[0].parentId, true);
					};

					this.setState({ isLoading: false });
				});
			}, 600);
        });
    };

});

export default PageMainUsecase;