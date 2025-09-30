import dynamoose, { model } from 'dynamoose';

const EntityName = 'Sessions';

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
  lastSession: {
    type: String,
    required: true
  },
  appVersion: {
    type: String,
    required: false
  },
  platform: {
    type: String,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  geo: {
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

export const Sessions_Model = model(EntityName, schema, { create: true, waitForActive: true});
