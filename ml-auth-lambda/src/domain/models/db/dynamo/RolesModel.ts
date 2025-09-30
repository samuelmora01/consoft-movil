import dynamoose, { model } from 'dynamoose';

const EntityName = 'Roles';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  code: {
    type: String,
    required: true,
    index: {
      name: 'CodeIndex',
      type: 'global'
    }
  },
  description: {
    type: String,
    required: false
  },
  scope: {
    type: String,
    required: true
  },
  permissions: {
    type: Array,
    schema: [String],
    required: true
  },
  status: {
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

export const Roles_Model = model(EntityName, schema, { create: true, waitForActive: true});
