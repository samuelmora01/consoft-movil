import dynamoose, { model } from 'dynamoose';

const EntityName = 'UserTypes';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
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
  timestamps: false, // Deshabilitamos los timestamps automáticos
  saveUnknown: false
});

export const UserTypes_Model = model(EntityName, schema, { create: true, waitForActive: true});
