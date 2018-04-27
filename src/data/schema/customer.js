export const types = `
  type CustomerConnectionChangedResponse {
    _id: String!
    status: String!
  }

  type CustomerLinks {
    linkedIn: String
    twitter: String
    facebook: String
    youtube: String
    github: String
    website: String
  }

  type Customer {
    _id: String!
    integrationId: String
    firstName: String
    lastName: String
    email: String
    phone: String
    isUser: Boolean
    createdAt: Date
    tagIds: [String]
    remoteAddress: String
    internalNotes: JSON
    location: JSON
    visitorContactInfo: JSON
    customFieldsData: JSON
    messengerData: JSON
    twitterData: JSON
    facebookData: JSON
    ownerId: String
    position: String
    department: String
    leadStatus: String
    lifecycleState: String
    hasAuthority: String
    description: String
    doNotDisturb: String
    links: CustomerLinks
    companies: [Company]
    conversations: [Conversation]
    deals: [Deal]
    getIntegrationData: JSON
    getMessengerCustomData: JSON
    getTags: [Tag]
    owner: User
  }

  type CustomersListResponse {
    list: [Customer],
    totalCount: Float,
  }
`;

const queryParams = `
  page: Int,
  perPage: Int,
  segment: String,
  tag: String,
  ids: [String],
  searchValue: String,
  brand: String,
  integration: String
`;

export const queries = `
  customersMain(${queryParams}): CustomersListResponse
  customers(${queryParams}): [Customer]
  customerCounts(${queryParams}, byFakeSegment: JSON): JSON
  customerDetail(_id: String!): Customer
  customerListForSegmentPreview(segment: JSON, limit: Int): [Customer]
`;

const fields = `
  firstName: String
  lastName: String
  email: String
  phone: String
  ownerId: String
  position: String
  department: String
  leadStatus: String
  lifecycleState:  String
  hasAuthority: String
  description: String
  doNotDisturb: String
  links: JSON
  customFieldsData: JSON
`;

export const mutations = `
  customersAdd(${fields}): Customer
  customersEdit(_id: String!, ${fields}): Customer
  customersAddCompany(_id: String!, name: String!, website: String): Company
  customersEditCompanies(_id: String!, companyIds: [String]): Customer
  customersMerge(customerIds: [String], customerFields: JSON): Customer
  customersRemove(customerIds: [String]): [String]
`;
