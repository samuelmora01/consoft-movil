import dynamoose, { model } from 'dynamoose';

const EntityName = 'OrgProfile';

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
  orgName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
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
  timestamps: false, // Usar timestamps manuales como string
  saveUnknown: false
});

export const OrgProfile_Model = model(EntityName, schema, { create: true, waitForActive: true});
