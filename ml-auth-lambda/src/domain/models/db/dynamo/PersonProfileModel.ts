import dynamoose, { model } from 'dynamoose';

const EntityName = 'PersonProfile';

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
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  birthDate: {
    type: String,
    required: false
  },
  hasOrgMembership: {
    type: Boolean,
    required: true,
    default: false
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

export const PersonProfile_Model = model(EntityName, schema, { create: true, waitForActive: true});
