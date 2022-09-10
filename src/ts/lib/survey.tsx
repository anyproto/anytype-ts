import { C, I, Storage, Util, analytics, Renderer, translate } from 'Lib';
import { popupStore, authStore, dbStore } from 'Store';

const Surveys = require('json/survey.json');

class Survey {

    check (type: I.SurveyType) {
        switch (type) {
            case I.SurveyType.Register:
                this.checkRegister();
                break;

            case I.SurveyType.Pmf:
                this.checkPmf();
                break;

            case I.SurveyType.Object:
                this.checkObject();
                break;

            case I.SurveyType.Delete:
                this.checkDelete();
                break;
        }
    };

    show (type: I.SurveyType) {
        const prefix = Util.toCamelCase('survey-' + type);

        analytics.event(prefix + 'Show');

        popupStore.open('confirm', {
            onClose: () => {
                this.onSkip(type);
            },
            data: {
                title: translate(prefix + 'Title'),
                text: translate(prefix + 'Text'),
                textConfirm: translate(prefix + 'Confirm'),
                textCancel: translate(prefix + 'Cancel'),
                canConfirm: true,
                canCancel: true,
                onConfirm: () => {
                    this.onConfirm(type);
                },
                onCancel: () => {
                    this.onSkip(type);
                }
            }
        });
    };

    onConfirm (type: I.SurveyType) {
        const { account } = authStore;
        const survey = Surveys[type];
        const prefix = Util.toCamelCase('survey-' + type);

        Renderer.send('urlOpen', Util.sprintf(survey.url, account.id));
        analytics.event(prefix + 'Open');

        switch (type) {
            case I.SurveyType.Register:
                Storage.set('survey', { surveyRegisterComplete: 1 });
                break;

            case I.SurveyType.Pmf:
                Storage.set('survey', { lastPmfSurveyTime: Util.time() });
                break;

            case I.SurveyType.Object:
                Storage.set('survey', { surveyObjectComplete: 1 });
                break;

            case I.SurveyType.Delete:
                Storage.set('survey', { surveyDeleteComplete: 1 });
                break;

        };
    };

    onSkip (type: I.SurveyType) {
        const prefix = Util.toCamelCase('survey-' + type);

        analytics.event(prefix + 'Skip');

        switch (type) {
            case I.SurveyType.Register:
                Storage.set('survey', { surveyRegisterComplete: 1 });
                break;

            case I.SurveyType.Pmf:
                Storage.set('survey', { lastPmfSurveyCanceled: 1 });
                Storage.set('survey', { lastPmfSurveyTime: Util.time() });
                break;

            case I.SurveyType.Object:
                Storage.set('survey', { surveyObjectComplete: 1 });
                break;

            case I.SurveyType.Delete:
                Storage.set('survey', { surveyDeleteComplete: 1 });
                break;

        };
    };

    checkPmf () {
        const surveyStorage = Storage.get('survey') || {};
        const lastTime = Number(Storage.get('lastSurveyTime')) || Number(surveyStorage.lastPmfSurveyTime) || 0;
        const lastCanceled = Number(Storage.get('lastSurveyCanceled')) || Number(surveyStorage.lastPmfSurveyCanceled) || 0;
        const askPmf = Number(surveyStorage.askSurvey) || 0;
        const days = lastTime ? 90 : 30;
        const surveyTime = (lastTime <= Util.time() - 86400 * days);

        if (askPmf && !popupStore.isOpen() && !lastCanceled && surveyTime) {
            this.show(I.SurveyType.Pmf);
        };
    };

    checkRegister () {
        const timeRegister = Number(Storage.get('timeRegister')) || 0;
        const surveyStorage = Storage.get('survey') || {};
        const isComplete = surveyStorage.surveyRegisterComplete || 0;
        const surveyTime = timeRegister && Util.time() - 86400 * 7 - timeRegister > 0;

        if (!isComplete && surveyTime && !popupStore.isOpen()) {
            this.show(I.SurveyType.Register);
        };
    };

    checkDelete () {
        const surveyStorage = Storage.get('survey') || {};
        const isComplete = Number(surveyStorage.surveyDeleteComplete) || 0;

        if (!isComplete) {
            this.show(I.SurveyType.Delete);
        };
    };

    checkObject () {
        const timeRegister = Number(Storage.get('timeRegister')) || 0;
        const surveyStorage = Storage.get('survey') || {};
        const isComplete = Number(surveyStorage.surveyObjectComplete) || 0;

        if (!isComplete && timeRegister) {
            const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
            const filters: I.Filter[] = [
                { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types },
                { operator: I.FilterOperator.And, relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: timeRegister + 30 },
            ];

            C.ObjectSearch(filters, [], [], '', 0, 50, (message: any) => {
                if (message.error.code) {
                    return;
                };

                if (message.records.length >= 50) {
                    this.show(I.SurveyType.Object);
                };
            });
        };
    };

}

export default new Survey();