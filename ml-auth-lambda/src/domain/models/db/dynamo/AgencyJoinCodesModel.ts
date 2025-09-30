import dynamoose, { model } from 'dynamoose';

const EntityName = 'AgencyJoinCodes';

const schema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true
  },
  orgProfileId: {
    type: String,
    required: true,
    index: {
      name: 'OrgProfileIndex',
      type: 'global'
    }
  },
  joinCode: {
    type: String,
    required: true,
    index: {
      name: 'JoinCodeIndex',
      type: 'global'
    }
  },
  title: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: true,
    default: 'multi-use',
    enum: ['one-time', 'multi-use']
  },
  maxUses: {
    type: Number,
    required: false,
    default: 3
  },
  expiresAt: {
    type: String,
    required: false
  },
  createdBy: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  saveUnknown: false
});

export const AgencyJoinCodes_Model = model(EntityName, schema, { create: true, waitForActive: true});
