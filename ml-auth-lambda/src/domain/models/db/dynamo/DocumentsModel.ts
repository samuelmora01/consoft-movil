import dynamoose, { model } from 'dynamoose';

const EntityName = 'Documents';

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
  documentTypeId: {
    type: String,
    required: true
  },
  details: {
    type: Object,
    required: true,
    default: {}
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
  saveUnknown: true // Permitir campos dinámicos en details
});

export const Documents_Model = model(EntityName, schema, { create: true, waitForActive: true});
