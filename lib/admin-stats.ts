/**
 * Accounts an admin has removed stay stored and drop out of every admin number.
 * Mongo leaves the field unset until then, and `{ deletedAt: null }` does not
 * match an unset field, so both shapes count.
 */
export const countedAccount = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};
