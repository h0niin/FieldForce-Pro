import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'contacts',
          columns: [
            { name: 'first_name', type: 'string', isOptional: true },
            { name: 'last_name', type: 'string', isOptional: true },
            { name: 'company_id', type: 'string', isOptional: true },
            { name: 'tags', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
