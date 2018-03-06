import customScalars from './customScalars';
import Mutation from './mutations';
import Query from './queries';
import Subscription from './subscriptions';
import ResponseTemplate from './responseTemplate';
import Integration from './integration';
import Channel from './channel';
import Brand from './brand';
import Form from './form';
import EngageMessage from './engage';
import InternalNote from './internalNote';
import Customer from './customer';
import Company from './company';
import Segment from './segment';
import Conversation from './conversation';
import ConversationMessage from './conversationMessage';
import Notification from './notification';
import KnowledgeBaseArticle from './knowledgeBaseArticle';
import KnowledgeBaseCategory from './knowledgeBaseCategory';
import KnowledgeBaseTopic from './knowledgeBaseTopic';
import ActivityLog from './activityLog';
import ActivityLogForMonth from './activityLogForMonth';
import { Field, FieldsGroup } from './field';

export default {
  ...customScalars,

  ResponseTemplate,
  Integration,
  Channel,
  Brand,
  Form,
  InternalNote,
  Customer,
  Company,
  Segment,
  EngageMessage,
  Conversation,
  ConversationMessage,

  Mutation,
  Query,
  Subscription,

  KnowledgeBaseArticle,
  KnowledgeBaseCategory,
  KnowledgeBaseTopic,

  Notification,

  ActivityLog,
  ActivityLogForMonth,
  FieldsGroup,
  Field,
};
