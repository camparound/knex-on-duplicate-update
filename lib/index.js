const Knex = require('knex');

module.exports.attachOnDuplicateUpdate = function attachOnDuplicateUpdate() {
  Knex.QueryBuilder.extend('onDuplicateUpdate', function onDuplicateUpdate(uniqueCol, ...columns) {
    if (this._method !== 'insert') {
      throw new Error('onDuplicateUpdate error: should be used only with insert query.');
    }

    if (this.client.config.client === 'sqlite' && uniqueCol == null) {
      throw new Error('onDuplicateUpdate error: please specify a target column which should be checked for conflict.');
    }


    if (columns.length === 0) {
      throw new Error('onDuplicateUpdate error: please specify at least one column name.');
    }

    const { placeholders, bindings } = columns.reduce((result, column) => {
      if (typeof column === 'string') {
        if (this.client.config.client === 'sqlite') {
          result.placeholders.push(`??=??`);
        } else {
          result.placeholders.push(`??=Values(??)`);
        }
        result.bindings.push(column, column);
      } else if (column && typeof column === 'object') {
        Object.keys(column).forEach((key) => {
          result.placeholders.push(`??=?`);
          result.bindings.push(key, column[key]);
        });
      } else {
        throw new Error('onDuplicateUpdate error: expected column name to be string or object.');
      }

      return result;
    }, { placeholders: [], bindings: [] });

    const {
      sql: originalSQL,
      bindings: originalBindings,
    } = this.toSQL();

    const newBindings = [...originalBindings, ...bindings];

    if (this.client.config.client === 'sqlite') {
      return this.client.raw(
        `${originalSQL} on conflict(${uniqueCol}) do update set ${placeholders.join(', ')}`,
        newBindings,
      );
    } else {
      return this.client.raw(
        `${originalSQL} on duplicate key update ${placeholders.join(', ')}`,
        newBindings,
      );
    }
  });
};
