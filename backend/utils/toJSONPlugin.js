// Shared toJSON behaviour: expose Mongo's _id as a plain string `id`,
// and hide internal fields (__v, and anything explicitly listed) from API responses.
function toJSONPlugin(schema, hidden = []) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      hidden.forEach((field) => delete ret[field]);
      return ret;
    },
  });
}
module.exports = toJSONPlugin;
