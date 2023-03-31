import * as React from 'react';
import { Frame, Title, Label, Button, Loader } from 'Component';
import { C, I, ObjectUtil, translate } from 'Lib';
import { observer } from 'mobx-react';

const PageAuthUsecase = observer(class PageAuthUsecase extends React.Component<I.PageComponent, object> {
    loading: boolean = false;

    constructor (props: I.PageComponent) {
        super(props);

        this.onClick = this.onClick.bind(this);
    };

    render () {
        const cases: any[] = [
            { img: 'img/usecase/plug.png', id: 1 },
            { img: 'img/usecase/plug.png', id: 2 },
            { img: 'img/usecase/plug.png', id: 3 }
        ];

        const Case = (el) => (
            <div className="case" onClick={(e) => this.onClick(e, el.id)}>
                <Title className="caseTitle" text={translate(`authUsecaseCase${el.id}Title`)} />
                <Label className="caseLabel" text={translate(`authUsecaseCase${el.id}Label`)} />
                <img src={el.img} />
            </div>
        );

        return (
            <div>

                <Frame>
                    <Title className="frameTitle" text={translate('authUsecaseTitle')} />
                    <Label className="frameLabel" text={translate('authUsecaseLabel')} />

                    <div className="usecaseList">
                        {cases.map((el, i) => (
                            <Case key={i} {...el} />
                        ))}
                    </div>

                    <div className="buttons">
                        <Button className="c28 outlined" text={translate('authUsecaseSkip')} onClick={(e) => this.onClick(e, 0)} />
                    </div>
                    {!this.loading ? (
                        <div className="loaderWrapper"><Loader /></div>
                    ) : ''}
                </Frame>
            </div>
        );
    };

    onClick (e: any, id: number) {
        e.preventDefault();

        if (this.loading) {
            return;
        };

        this.loading = true;

        C.ObjectImportUseCase(id, (message) => {
            console.log('[UseCase] ', message);
            ObjectUtil.openHome('route');
        });
    };

});

export default PageAuthUsecase;