import dynamoose, { model } from 'dynamoose';

const EntityName = 'DocumentTypes';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  attributes: {
    type: Array,
    schema: [String],
    required: true
  },
  countryId: {
    type: String,
    required: true
  },
  createdAt: {
    type: String,
    required: false
  },
  updatedAt: {
    type: String,
    required: false
  }
}, {
  timestamps: false,
  saveUnknown: false
});

export const DocumentTypes_Model = model(EntityName, schema, { create: true, waitForActive: true});
