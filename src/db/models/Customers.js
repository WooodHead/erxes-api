import mongoose from 'mongoose';
import { Fields, Companies, ActivityLogs, Conversations, InternalNotes, EngageMessages } from './';
import { field } from './utils';

/* location schema */
const locationSchema = mongoose.Schema(
  {
    remoteAddress: String,
    country: String,
    city: String,
    region: String,
    hostname: String,
    language: String,
    userAgent: String,
  },
  { _id: false },
);

const VisitorContactSchema = mongoose.Schema(
  {
    email: String,
    phone: String,
  },
  { _id: false },
);

/*
 * messenger schema
 */
const messengerSchema = mongoose.Schema(
  {
    lastSeenAt: field({
      type: Date,
      label: 'Last seen at',
    }),
    sessionCount: field({
      type: Number,
      label: 'Session count',
    }),
    isActive: field({
      type: Boolean,
      label: 'Is online',
    }),
    customData: field({
      type: Object,
      optional: true,
    }),
  },
  { _id: false },
);

/*
 * twitter schema
 */
const twitterSchema = mongoose.Schema(
  {
    idStr: field({
      type: String,
      label: 'Twitter ID',
    }),
    id: field({
      type: Number,
      label: 'Twitter ID (Number)',
    }),
    name: field({
      type: String,
      label: 'Twitter name',
    }),
    screenName: field({
      type: String,
      label: 'Twitter screen name',
    }),
    profileImageUrl: field({
      type: String,
      label: 'Twitter photo',
    }),
  },
  { _id: false },
);

/*
 * facebook schema
 */
const facebookSchema = mongoose.Schema(
  {
    id: field({
      type: String,
      label: 'Facebook ID',
    }),
    profilePic: field({
      type: String,
      optional: true,
      label: 'Facebook photo',
    }),
  },
  { _id: false },
);

const CustomerSchema = mongoose.Schema({
  _id: field({ pkey: true }),

  firstName: field({ type: String, label: 'First name', optional: true }),
  lastName: field({ type: String, label: 'Last name', optional: true }),

  email: field({ type: String, label: 'Email', optional: true }),
  phone: field({ type: String, label: 'Phone', optional: true }),
  isUser: field({ type: Boolean, label: 'Is user', optional: true }),
  createdAt: field({ type: Date, label: 'Created at' }),

  integrationId: field({ type: String }),
  tagIds: field({ type: [String], optional: true }),
  companyIds: field({ type: [String], optional: true }),

  customFieldsData: field({ type: Object, optional: true }),
  messengerData: field({ type: messengerSchema, optional: true }),
  twitterData: field({ type: twitterSchema, optional: true }),
  facebookData: field({ type: facebookSchema, optional: true }),

  location: field({ type: locationSchema, optional: true }),

  // if customer is not a user then we will contact with this visitor using
  // this information
  visitorContactInfo: field({ type: VisitorContactSchema, optional: true }),
});

class Customer {
  getFullName() {
    return `${this.firstName || ''} ${this.lastName || ''}`;
  }

  /**
   * Checking if customer has duplicated unique properties
   * @param  {Object} customerFields - Customer fields to check duplications
   * @param  {String[]} idsToExclude - Customer ids to exclude
   * @return {Promise} - Result
   */
  static async checkDuplication(customerFields, idsToExclude) {
    const query = {};
    let previousEntry = null;

    // Adding exclude operator to the query
    if (idsToExclude) {
      if (idsToExclude instanceof Array) {
        query._id = { $nin: idsToExclude };
      } else {
        query._id = { $ne: idsToExclude };
      }
    }

    // Checking if customer has email
    if (customerFields.email) {
      query.email = customerFields.email;
      previousEntry = await this.find(query);

      // Checking if duplicated
      if (previousEntry.length > 0) {
        throw new Error('Duplicated email');
      }
    }

    // Checking if cuostomer has twitter data
    if (customerFields.twitterData) {
      query['twitterData.id'] = customerFields.twitterData.id;
      previousEntry = await this.find(query);

      // Checking if duplicated
      if (previousEntry.length > 0) {
        throw new Error('Duplicated twitter');
      }
    }
  }

  /**
   * Create a customer
   * @param  {Object} customerObj object
   * @return {Promise} Newly created customer object
   */
  static async createCustomer(doc) {
    // Checking duplicated fields of customer
    await this.checkDuplication(doc);

    // clean custom field values
    doc.customFieldsData = await Fields.cleanMulti(doc.customFieldsData || {});

    doc.createdAt = new Date();

    return this.create(doc);
  }

  /*
   * Update customer
   * @param {String} _id customer id to update
   * @param {Object} doc field values to update
   * @return {Promise} updated customer object
   */
  static async updateCustomer(_id, doc) {
    // Checking duplicated fields of customer
    await this.checkDuplication(doc, _id);

    if (doc.customFieldsData) {
      // clean custom field values
      doc.customFieldsData = await Fields.cleanMulti(doc.customFieldsData || {});
    }

    await this.update({ _id }, { $set: doc });

    return this.findOne({ _id });
  }

  /**
   * Mark customer as inactive
   * @param  {String} _id
   * @return {Promise} Updated customer
   */
  static async markCustomerAsNotActive(_id) {
    await this.findByIdAndUpdate(
      _id,
      {
        $set: {
          'messengerData.isActive': false,
          'messengerData.lastSeenAt': new Date(),
        },
      },
      { new: true },
    );

    return this.findOne({ _id });
  }

  /*
   * Create new company and add to customer's company list
   * @param {String} name - Company name
   * @param {String} website - Company website
   * @return {Promise} newly created company
   */
  static async addCompany({ _id, name, website }) {
    // create company
    const company = await Companies.createCompany({ name, website });

    // add to companyIds list
    await this.findByIdAndUpdate(_id, {
      $addToSet: { companyIds: company._id },
    });

    return company;
  }

  /**
   * Update customer companies
   * @param {String} _id - Customer id to update
   * @param {String[]} companyIds - Company ids to update
   * @return {Promise} updated customer object
   */
  static async updateCompanies(_id, companyIds) {
    // updating companyIds field
    await this.findByIdAndUpdate(_id, { $set: { companyIds } });

    return this.findOne({ _id });
  }

  /**
   * Removes customer
   * @param {String} customerId - Customer id of customer to remove
   * @return {Promise} result
   */
  static async removeCustomer(customerId) {
    // Removing every modules that associated with customer
    await ActivityLogs.removeCustomerActivityLog(customerId);
    await Conversations.removeCustomerConversations(customerId);
    await EngageMessages.removeCustomerEngages(customerId);
    await InternalNotes.removeCustomerInternalNotes(customerId);

    return await this.remove({ _id: customerId });
  }

  /**
   * Merge customers
   * @param {String[]} customerIds - Customer ids to merge
   * @param {Object} customerFields - Customer infos to create with
   * @return {Promise} Customer object
   */
  static async mergeCustomers(customerIds, customerFields) {
    // Checking duplicated fields of customer
    await this.checkDuplication(customerFields, customerIds);

    let tagIds = [];
    let companyIds = [];

    // Merging customer tags and companies
    for (let customerId of customerIds) {
      const customer = await this.findOne({ _id: customerId });

      if (customer) {
        const customerTags = customer.tagIds || [];
        const customerCompanies = customer.companyIds || [];

        // Merging customer's tag and companies into 1 array
        tagIds = tagIds.concat(customerTags);
        companyIds = companyIds.concat(customerCompanies);

        // Removing Customers
        await this.remove({ _id: customerId });
      }
    }

    // Removing Duplicated Tags from customer
    tagIds = Array.from(new Set(tagIds));

    // Removing Duplicated Companies from customer
    companyIds = Array.from(new Set(companyIds));

    // Creating customer with properties
    const customer = await this.createCustomer({
      ...customerFields,
      tagIds,
      companyIds,
    });

    // Updating every modules associated with customers
    await ActivityLogs.changeCustomer(customer._id, customerIds);
    await Conversations.changeCustomer(customer._id, customerIds);
    await EngageMessages.changeCustomer(customer._id, customerIds);
    await InternalNotes.changeCustomer(customer._id, customerIds);

    return customer;
  }
}

CustomerSchema.loadClass(Customer);

const Customers = mongoose.model('customers', CustomerSchema);

export default Customers;
