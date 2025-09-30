import dynamoose, { model } from 'dynamoose';

const EntityName = 'UserRoles';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  userId: {
    type: String,
    required: true,
    index: {
      name: 'UserIdIndex',
      type: 'global'
    }
  },
  roleId: {
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

export const UserRoles_Model = model(EntityName, schema, { create: true, waitForActive: true});
