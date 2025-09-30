import dynamoose, { model } from 'dynamoose';

const EntityName = 'Users';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  email: {
    type: String,
    required: true,
    index: {
      name: 'EmailIndex',
      type: 'global'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['unconfirmed', 'confirmed', 'suspended'],
    default: 'unconfirmed'
  },
  userTypeId: {
    type: String,
    required: true
  },
  countryId: {
    type: String,
    required: true,
    default: '170'
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

export const User_Model = model(EntityName, schema, { create: true, waitForActive: true });
