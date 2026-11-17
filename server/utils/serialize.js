// MongoDB returns _id; the frontend uses a plain `id`. These helpers convert once, in one place.
function withId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { id: String(_id), ...rest };
}
const withIds = (list) => list.map(withId);
module.exports = { withId, withIds };
