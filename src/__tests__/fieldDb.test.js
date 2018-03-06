/* eslint-env jest */
/* eslint-disable no-underscore-dangle */

import { connect, disconnect } from '../db/connection';
import { FIELDS_GROUPS_CONTENT_TYPES } from '../data/constants';
import { Forms, Fields, Customers, FieldsGroups } from '../db/models';
import {
  formFactory,
  fieldFactory,
  userFactory,
  fieldGroupFactory,
  customerFactory,
} from '../db/factories';

beforeAll(() => connect());

afterAll(() => disconnect());

/**
 * Field related tests
 */
describe('Fields', () => {
  let _field;

  beforeEach(async () => {
    // creating field with contentType other than customer
    _field = await fieldFactory({ contentType: 'form', order: 1 });
  });

  afterEach(async () => {
    // Clearing test data
    await Forms.remove();
    await Fields.remove({});
    await FieldsGroups.remove({});
  });

  test('createField() without contentTypeId', async () => {
    const group = await fieldGroupFactory({ contentType: 'customer' });

    // first attempt
    let field = await Fields.createField({ contentType: 'customer' });
    expect(field.order).toBe(0);

    // second attempt
    field = await Fields.createField({ contentType: 'customer' });
    expect(field.order).toBe(1);

    // third attempt
    field = await Fields.createField({ contentType: 'customer' });
    expect(field.order).toBe(2);

    field = await Fields.createField({ contentType: 'customer', groupId: group._id });
    expect(field.order).toBe(0);
  });

  test('createField() with contentTypeId', async () => {
    const contentType = 'form';
    const form1 = await formFactory({});
    const form2 = await formFactory({});

    // first attempt
    let field = await Fields.createField({
      contentType,
      contentTypeId: form1._id,
    });
    expect(field.order).toBe(0);

    // second attempt
    field = await Fields.createField({ contentType, contentTypeId: form1._id });
    expect(field.order).toBe(1);

    // must create new order
    field = await Fields.createField({ contentType, contentTypeId: form2._id });
    expect(field.order).toBe(0);
  });

  test('createField() required contentTypeId when form', async () => {
    expect.assertions(1);

    try {
      await Fields.createField({ contentType: 'form' });
    } catch (e) {
      expect(e.message).toEqual('Content type id is required');
    }
  });

  test('createField() check contentTypeId existence', async () => {
    expect.assertions(1);

    try {
      await Fields.createField({
        contentType: 'form',
        contentTypeId: 'DFAFDFADS',
      });
    } catch (e) {
      expect(e.message).toEqual('Form not found with _id of DFAFDFADS');
    }
  });

  test('updateOrder()', async () => {
    const field1 = await fieldFactory();
    const field2 = await fieldFactory();

    const [updatedField1, updatedField2] = await Fields.updateOrder([
      { _id: field1._id, order: 10 },
      { _id: field2._id, order: 11 },
    ]);

    expect(updatedField1.order).toBe(10);
    expect(updatedField2.order).toBe(11);
  });

  test('Update field valid', async () => {
    const doc = await fieldFactory();
    const testField = await fieldFactory({ isDefinedByErxes: true });

    doc._id = undefined;

    const fieldObj = await Fields.updateField(_field._id, doc);

    try {
      await Fields.updateField(testField._id);
    } catch (e) {
      expect(e.message).toBe('Cant update this field');
    }

    // check updates
    expect(fieldObj.contentType).toBe(doc.contentType);
    expect(fieldObj.contentTypeId).toBe(doc.contentTypeId);
    expect(fieldObj.type).toBe(doc.type);
    expect(fieldObj.validation).toBe(doc.validation);
    expect(fieldObj.text).toBe(doc.text);
    expect(fieldObj.description).toBe(doc.description);
    expect(fieldObj.options).toEqual(expect.arrayContaining(doc.options));
    expect(fieldObj.isRequired).toBe(doc.isRequired);
    expect(fieldObj.order).toBe(doc.order);
  });

  test('Remove field valid', async () => {
    expect.assertions(5);

    await customerFactory({ customFieldsData: { [_field._id]: '1231' } });
    const testField = await fieldFactory({ isDefinedByErxes: true });

    try {
      await Fields.removeField('DFFFDSFD');
    } catch (e) {
      expect(e.message).toBe('Field not found with id DFFFDSFD');
    }

    try {
      await Fields.updateField(testField._id);
    } catch (e) {
      expect(e.message).toBe('Cant update this field');
    }

    const fieldDeletedObj = await Fields.removeField(_field.id);

    const index = `customFieldsData.${_field._id}`;

    // Checking if field  value removed from customer
    expect(await Customers.find({ [index]: { $exists: true } })).toHaveLength(0);

    expect(fieldDeletedObj.id).toBe(_field.id);

    const fieldObj = await Fields.findOne({ _id: _field.id });
    expect(fieldObj).toBeNull();
  });

  test('Validate submission: field not found', async () => {
    expect.assertions(1);

    const _id = 'INVALID_ID';

    try {
      await Fields.clean(_id, '');
    } catch (e) {
      expect(e.message).toBe(`Field not found with the _id of ${_id}`);
    }
  });

  test('Validate submission: invalid values', async () => {
    expect.assertions(4);

    const expectError = async (message, value) => {
      try {
        await Fields.clean(_field._id, value);
      } catch (e) {
        expect(e.message).toBe(`${_field.text}: ${message}`);
      }
    };

    const changeValidation = validation => {
      _field.validation = validation;
      return _field.save();
    };

    // required =====
    _field.isRequired = true;
    await _field.save();
    await expectError('required', '');

    // email =====
    await changeValidation('email');
    await expectError('Invalid email', 'wrongValue');

    // number =====
    await changeValidation('number');
    await expectError('Invalid number', 'wrongValue');

    // date =====
    await changeValidation('date');
    await expectError('Invalid date', 'wrongValue');
  });

  test('Validate submission: valid values', async () => {
    const expectValid = async value => {
      const res = await Fields.clean(_field._id, value);
      expect(res).toBe(value);
    };

    const changeValidation = validation => {
      _field.validation = validation;
      return _field.save();
    };

    // required =====
    _field.isRequired = true;
    await changeValidation(null);
    expectValid('value');

    // email =====
    await changeValidation('email');
    expectValid('email@gmail.com');

    // number =====
    await changeValidation('number');
    expectValid('2.333');
    expectValid('2');

    // date =====
    // date values must be convert to date object
    await changeValidation('date');
    const res = await Fields.clean(_field._id, '2017-01-01');
    expect(res).toEqual(expect.any(Date));
  });

  test('Validate fields: invalid values', async () => {
    expect.assertions(1);

    // required =====
    _field.isRequired = true;
    await _field.save();

    try {
      await Fields.cleanMulti({ [_field._id]: '' });
    } catch (e) {
      expect(e.message).toBe(`${_field.text}: required`);
    }
  });

  test('Update field visible', async () => {
    expect.assertions(2);

    const field = await fieldFactory({ isVisible: true });
    const user = await userFactory({});
    const testField = await fieldFactory({ isDefinedByErxes: true });

    const isVisible = false;

    try {
      await Fields.updateFieldsVisible(testField._id);
    } catch (e) {
      expect(e.message).toBe('Cant update this field');
    }

    const fieldObj = await Fields.updateFieldsVisible(field._id, isVisible, user._id);

    expect(fieldObj.isVisible).toBe(isVisible);
  });
});

/**
 * Fields groups related tests
 */
describe('Fields groups', () => {
  let _fieldGroup;

  beforeEach(async () => {
    // creating field group
    _fieldGroup = await fieldGroupFactory({
      contentType: FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
      isDefinedByErxes: true,
    });
  });

  afterEach(async () => {
    // Clearing test data
    await FieldsGroups.remove({});
  });

  test('Create group', async () => {
    expect.assertions(5);

    const doc = {
      name: 'Name',
      description: 'Description',
      contentType: FIELDS_GROUPS_CONTENT_TYPES.CUSTOMER,
    };

    let groupObj = await FieldsGroups.createGroup(doc);

    expect(groupObj.name).toBe(doc.name);
    expect(groupObj.description).toBe(doc.description);
    expect(groupObj.contentType).toBe(doc.contentType);
    expect(groupObj.order).toBe(1);

    groupObj = await FieldsGroups.createGroup(doc);

    expect(groupObj.order).toBe(2);
  });

  test('Update group', async () => {
    expect.assertions(3);

    const fieldGroup = await fieldGroupFactory({});

    const doc = {
      name: 'test name',
      description: 'test description',
    };

    try {
      await FieldsGroups.updateGroup(_fieldGroup._id, doc);
    } catch (e) {
      expect(e.message).toBe('Cant update this group');
    }

    const groupObj = await FieldsGroups.updateGroup(fieldGroup._id, doc);

    expect(groupObj.name).toBe(doc.name);
    expect(groupObj.description).toBe(doc.description);
  });

  test('Remove group', async () => {
    expect.assertions(3);

    const fieldGroup = await fieldGroupFactory({});
    await fieldFactory({ groupId: fieldGroup._id });

    try {
      await FieldsGroups.removeGroup(_fieldGroup._id);
    } catch (e) {
      expect(e.message).toBe('Cant update this group');
    }

    await FieldsGroups.removeGroup(fieldGroup._id);

    expect(await Fields.find({ groupId: fieldGroup._id })).toHaveLength(0);
    expect(await FieldsGroups.findOne({ _id: fieldGroup._id })).toBeNull();
  });

  test('Remove group with fake group, with exception', async () => {
    expect.assertions(1);

    const _id = '1333131';

    try {
      await FieldsGroups.removeGroup(_id);
    } catch (e) {
      expect(e.message).toBe(`Group not found with id of ${_id}`);
    }
  });

  test('Update group visible', async () => {
    expect.assertions(2);

    const fieldGroup = await fieldGroupFactory({ isVisible: true });
    const user = await userFactory({});

    try {
      await FieldsGroups.updateGroupVisible(_fieldGroup._id, true, user._id);
    } catch (e) {
      expect(e.message).toBe('Cant update this group');
    }

    const isVisible = false;
    const groupObj = await FieldsGroups.updateGroupVisible(fieldGroup._id, isVisible, user._id);

    expect(groupObj.isVisible).toBe(isVisible);
  });
});
