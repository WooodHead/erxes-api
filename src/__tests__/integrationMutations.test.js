/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import faker from 'faker';
import sinon from 'sinon';
import { connect, disconnect } from '../db/connection';
import { FORM_LOAD_TYPES, MESSENGER_DATA_AVAILABILITY } from '../data/constants';
import { Integrations, ActivityLogs } from '../db/models';
import { ROLES } from '../data/constants';
import integrationMutations from '../data/resolvers/mutations/integrations';
import { socUtils } from '../social/twitterTracker';
import { gmailUtils } from '../social/gmail';
import { integrationFactory } from '../db/factories';

beforeAll(() => connect());
afterAll(() => disconnect());

describe('mutations', () => {
  const _fakeBrandId = 'fakeBrandId';
  const _fakeFormId = 'fakeFormId';
  const _fakeIntegrationId = '_fakeIntegrationId';

  const _user = { _id: 'fakeId', role: ROLES.CONTRIBUTOR };
  const _adminUser = { _id: 'fakeId', role: ROLES.ADMIN };

  test(`test if Error('Login required') exception is working as intended`, () => {
    expect.assertions(11);

    // Login required ==================
    const check = mutation => {
      try {
        mutation(null, {}, {});
      } catch (e) {
        expect(e.message).toBe('Login required');
      }
    };

    check(integrationMutations.integrationsCreateMessengerIntegration);
    check(integrationMutations.integrationsEditMessengerIntegration);
    check(integrationMutations.integrationsSaveMessengerConfigs);
    check(integrationMutations.integrationsSaveMessengerAppearanceData);
    check(integrationMutations.integrationsCreateFormIntegration);
    check(integrationMutations.integrationsEditFormIntegration);
    check(integrationMutations.integrationsEditFormIntegration);
    check(integrationMutations.integrationsRemove);
    check(integrationMutations.integrationsCreateTwitterIntegration);
    check(integrationMutations.integrationsCreateFacebookIntegration);
    check(integrationMutations.integrationsCreateGmailIntegration);
  });

  test(`test if Error('Permission required') exception is working as intended`, async () => {
    expect.assertions(1);

    const expectError = async func => {
      try {
        await func(null, {}, { user: _user });
      } catch (e) {
        expect(e.message).toBe('Permission required');
      }
    };

    // Login required ==================
    expectError(integrationMutations.integrationsRemove);
  });

  test('test Integrations.createMessengerIntegration', async () => {
    const doc = {
      name: 'Integration test',
      brandId: _fakeBrandId,
    };

    Integrations.createMessengerIntegration = jest.fn();

    await integrationMutations.integrationsCreateMessengerIntegration(null, doc, { user: _user });

    expect(Integrations.createMessengerIntegration).toBeCalledWith(doc);
    expect(Integrations.createMessengerIntegration.mock.calls.length).toBe(1);
  });

  test('test Integrations.updateMessengerIntegration', async () => {
    const doc = {
      _id: _fakeIntegrationId,
      name: 'Integration test 2',
      brandId: _fakeBrandId,
    };

    Integrations.updateMessengerIntegration = jest.fn();

    await integrationMutations.integrationsEditMessengerIntegration(null, doc, { user: _user });

    delete doc._id;

    expect(Integrations.updateMessengerIntegration).toBeCalledWith(_fakeIntegrationId, doc);
    expect(Integrations.updateMessengerIntegration.mock.calls.length).toBe(1);
  });

  test('test Integrations.saveMessengerConfigs', async () => {
    const uiOptions = {
      color: faker.random.word(),
      wallpaper: faker.random.word(),
      logo: faker.random.word(),
    };

    Integrations.saveMessengerAppearanceData = jest.fn();

    await integrationMutations.integrationsSaveMessengerAppearanceData(
      null,
      {
        _id: _fakeIntegrationId,
        uiOptions,
      },
      { user: _user },
    );

    expect(Integrations.saveMessengerAppearanceData).toBeCalledWith(_fakeIntegrationId, uiOptions);
    expect(Integrations.saveMessengerAppearanceData.mock.calls.length).toBe(1);
  });

  test('test Integrations.saveMessengerConfigs', async () => {
    const messengerData = {
      notifyCustomer: true,
      availabilityMethod: MESSENGER_DATA_AVAILABILITY.AUTO,
      isOnline: false,
      onlineHours: [
        {
          day: 'Monday',
          from: '8am',
          to: '12pm',
        },
        {
          day: 'Monday',
          from: '2pm',
          to: '6pm',
        },
      ],
      timezone: 'CET',
      welcomeMessage: 'Welcome user',
      awayMessage: 'Bye bye',
      thankYouMessage: 'Thank you',
    };

    Integrations.saveMessengerConfigs = jest.fn();

    await integrationMutations.integrationsSaveMessengerConfigs(
      null,
      {
        _id: _fakeIntegrationId,
        messengerData,
      },
      { user: _user },
    );

    expect(Integrations.saveMessengerConfigs).toBeCalledWith(_fakeIntegrationId, messengerData);
    expect(Integrations.saveMessengerConfigs.mock.calls.length).toBe(1);
  });

  test('test Integrations.createFormIntegration', async () => {
    const mainDoc = {
      name: 'form integration test',
      brandId: _fakeBrandId,
      formId: _fakeFormId,
    };

    const formData = {
      loadType: FORM_LOAD_TYPES.EMBEDDED,
    };

    Integrations.createFormIntegration = jest.fn();

    const doc = {
      ...mainDoc,
      formData,
    };

    await integrationMutations.integrationsCreateFormIntegration(null, doc, { user: _user });

    expect(Integrations.createFormIntegration).toBeCalledWith(doc);
    expect(Integrations.createFormIntegration.mock.calls.length).toBe(1);
  });

  test('test Integrations.updateFormIntegration', async () => {
    const mainDoc = {
      name: 'form integration test 2',
      brandId: _fakeBrandId,
      formId: _fakeFormId,
    };

    const formData = {
      loadType: FORM_LOAD_TYPES.SHOUTBOX,
    };

    const doc = {
      _id: _fakeIntegrationId,
      ...mainDoc,
      formData,
    };

    Integrations.updateFormIntegration = jest.fn();

    await integrationMutations.integrationsEditFormIntegration(null, doc, { user: _user });

    delete doc._id;

    expect(Integrations.updateFormIntegration).toBeCalledWith(_fakeIntegrationId, doc);
    expect(Integrations.updateFormIntegration.mock.calls.length).toBe(1);
  });

  test('test Integrations.removeIntegration', async () => {
    Integrations.removeIntegration = jest.fn();

    await integrationMutations.integrationsRemove(
      null,
      { _id: _fakeIntegrationId },
      { user: _adminUser },
    );

    expect(Integrations.removeIntegration).toBeCalledWith(_fakeIntegrationId);
    expect(Integrations.removeIntegration.mock.calls.length).toBe(1);
  });

  test('create twitter integration', async () => {
    const integrationDoc = { _id: 'id', name: 'name' };
    Integrations.createTwitterIntegration = jest.fn(() => integrationDoc);

    const authenticateDoc = {
      info: {
        name: 'name',
        id: 1,
      },

      tokens: {
        auth: {
          token: 'token',
          tokenSecret: 'secret',
        },
      },
    };

    socUtils.authenticate = jest.fn(() => authenticateDoc);
    socUtils.trackIntegration = jest.fn();

    const doc = {
      name: authenticateDoc.info.name,
      brandId: 'brandId',
      twitterData: {
        info: authenticateDoc.info,
        token: authenticateDoc.tokens.auth.token,
        tokenSecret: authenticateDoc.tokens.auth.token_secret,
      },
    };

    await integrationMutations.integrationsCreateTwitterIntegration(null, doc, {
      user: _adminUser,
    });

    expect(Integrations.createTwitterIntegration).toBeCalledWith(doc);
    expect(socUtils.trackIntegration).toBeCalledWith(integrationDoc);
  });

  test('create facebook integration', async () => {
    Integrations.createFacebookIntegration = jest.fn();

    const doc = {
      name: 'name',
      brandId: 'brandId',
      appId: '1',
      pageIds: ['1'],
    };

    await integrationMutations.integrationsCreateFacebookIntegration(null, doc, {
      user: _adminUser,
    });

    expect(Integrations.createFacebookIntegration).toBeCalledWith({
      name: 'name',
      brandId: 'brandId',
      facebookData: {
        appId: '1',
        pageIds: ['1'],
      },
    });
  });

  test('create gmail integration', async () => {
    // Integrations.createGmailIntegration = jest.fn();

    const fakeToken = {
      "access_token": "access_token",
      "refresh_token": "refresh_token",
      "token_type":"Bearer", "expiry_date":1518420087675};

    const testEmail = 'munkhbold.d@nmtec.co';
    const authorize = sinon.stub(gmailUtils, 'authorize').callsFake(() => (fakeToken));
    const getUserProfile = sinon.stub(gmailUtils, 'getUserProfile').callsFake(() => ({
      emailAddress: testEmail}));

    await integrationMutations.integrationsCreateGmailIntegration({}, 
      { code: '123' }, {
      user: _adminUser,
    });

    expect(authorize.calledWith('123')).toBe(true);
    expect(getUserProfile.calledWith(fakeToken)).toBe(true);

    const integration = await Integrations.findOne({
      'gmailData.email': testEmail
    });

    expect(integration).toBeDefined();
  });


  test('send gmail', async () => {
    const email = 'munkhbold.d@nmtec.co';
    const _integration = await integrationFactory({gmailData: {'email': email}});
    const args = {
      integrationId: _integration._id,
      cocType: 'customer',
      cocId: 'cocId',
      subject: 'subject',
      body: 'body',
      toEmails: email};

    // fake sendEmail function
    const sendEmail = sinon.stub(gmailUtils, 'sendEmail').callsFake(() => (null));

      // call mutation
    await integrationMutations.integrationsSendGmail({}, args, {
      user: _adminUser,
    });
    const [ tokens, subject, body, toEmails, fromEmail, cc ] = sendEmail.firstCall.args;
    expect(tokens._doc).toEqual({ email: 'munkhbold.d@nmtec.co' });
    expect(subject).toEqual(args.subject);
    expect(body).toEqual(args.body);
    expect(toEmails).toEqual(args.toEmails);
    expect(fromEmail).toEqual(email);
    expect(cc).toEqual(undefined);

    const newLog = await ActivityLogs.findOne({
      'coc.type': 'customer',
      'coc.id': 'cocId',
      'activity.type': 'email',
      'activity.action': 'send'
    });

    expect(newLog).toBeDefined();
  });
});
