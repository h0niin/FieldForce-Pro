-- Update Contacts permissions to lowercase contacts
UPDATE permissions 
SET name = REPLACE(name, 'Contacts:', 'contacts:'),
    module = 'contacts'
WHERE name LIKE 'Contacts:%';

-- Verify the update
SELECT id, name, module, action, description 
FROM permissions 
WHERE module = 'contacts'
ORDER BY name;
