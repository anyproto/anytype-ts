import { C, I, Storage, Util, analytics, Renderer, translate } from 'Lib';
import { popupStore, authStore, dbStore } from 'Store';

const Surveys = require('json/survey.json');

class Survey {

    show (type: string) {
        const survey = Surveys[type];
        const prefix = 'survey' + survey.key;

        analytics.event(survey.key + 'SurveyShow');

        popupStore.open('confirm', {
            onClose: () => {
                this.onSkip(type);
            },
            data: {
                title: translate(prefix + 'Title'),
                text: translate(prefix + 'Text'),
                textConfirm: translate(prefix + 'TextConfirm'),
                textCancel: translate(prefix + 'TextCancel'),
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

    onConfirm (type) {
        const { account } = authStore;
        const survey = Surveys[type];

        Renderer.send('urlOpen', Util.sprintf(survey.url, account.id));
        analytics.event(survey.key + 'SurveyOpen');

        switch (type) {
            case 'pmf':
                Storage.set('lastPMFSurveyTime', Util.time());
                break;

            case 'new':
                Storage.set('newUserSurveyComplete', 1);
                break;

            case 'deletion':
                Storage.set('deletionSurveyComplete', 1);
                break;

            case 'fiftyObjects':
                Storage.set('fiftyObjectsSurveyComplete', 1);
                break;

        };
    };

    onSkip (type) {
        const survey = Surveys[type];

        analytics.event(survey.key + 'SurveySkip');

        switch (type) {
            case 'pmf':
                Storage.set('lastPMFSurveyCanceled', 1);
                Storage.set('lastPMFSurveyTime', Util.time());
                break;

            case 'new':
                Storage.set('newUserSurveyComplete', 1);
                break;

            case 'deletion':
                Storage.set('deletionSurveyComplete', 1);
                break;

            case 'fiftyObjects':
                Storage.set('fiftyObjectsSurveyComplete', 1);
                break;

        };
    };

    PMF () {
        const lastTime = Number(Storage.get('lastSurveyTime')) || Number(Storage.get('lastPMFSurveyTime')) || 0;
        const lastCanceled = Number(Storage.get('lastSurveyCanceled')) || Number(Storage.get('lastPMFSurveyCanceled')) || 0;
        const askSurvey = Number(Storage.get('askSurvey')) || 0;
        const days = lastTime ? 90 : 30;
        const surveyTime = (lastTime <= Util.time() - 86400 * days);

        if (askSurvey && !popupStore.isOpen() && !lastCanceled && surveyTime) {
            this.show('pmf');
        };
    };

    newUser () {
        const isComplete = Number(Storage.get('newUserSurveyComplete')) || 0;
        const registrationTime = Number(Storage.get('registrationTime')) || 0;
        const surveyTime = registrationTime && Util.time() - 86400 * 7 - registrationTime > 0;

        if (!isComplete && surveyTime && !popupStore.isOpen()) {
            this.show('new');
        };
    };

    deletion () {
        const isComplete = Number(Storage.get('deletionSurveyComplete')) || 0;

        if (!isComplete) {
            this.show('deletion');
        };
    };

    fiftyObjects () {
        const isComplete = Number(Storage.get('fiftyObjectsSurveyComplete')) || 0;
        const registrationTime = Number(Storage.get('registrationTime')) || 0;

        if (!isComplete && registrationTime) {
            const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
            const filters: I.Filter[] = [
                { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types },
                { operator: I.FilterOperator.And, relationKey: 'createdDate', condition: I.FilterCondition.Greater, value: registrationTime + 30 },
            ];

            C.ObjectSearch(filters, [], [], '', 0, 50, (message: any) => {
                if (message.error.code) {
                    return;
                };

                if (message.records.length >= 50) {
                    this.show('fiftyObjects');
                };
            });
        };
    };

}

export default new Survey();