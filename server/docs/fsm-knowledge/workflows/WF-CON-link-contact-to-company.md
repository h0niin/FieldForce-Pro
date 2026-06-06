# WF-CON-link-contact-to-company — Link a Contact to a Company

## Codebase Audit Finding

A thorough read of all six source files reveals that **no UI currently exists to link a contact to a company**:

- `ContactFormPage.tsx` — form fields are: `first_name`, `last_name`, `email`, `phone`, `address`, `tags`. No `company_id` selector is rendered.
- `ContactDetailPage.tsx` — `Descriptions` items are: First Name, Last Name, Email, Phone, Address, Tags, Created At, Updated At, Custom Fields. No company association field is displayed.
- `ContactListPage.tsx` — table columns are: Name, Email, Phone, Tags, Created, Actions. No company column.
- `CompanyDetailPage.tsx` — displays Company Name, Industry, Tax ID, Website, Billing Address, Notes, Created At, Updated At, Custom Fields. No linked-contacts list or "Add Contact" action.
- `CompanyFormPage.tsx` — form fields are: `name`, `industry`, `tax_id`, `website`, `billing_address`, `notes`. No contact-linking control.
- `CompanyListPage.tsx` — table columns are: Company Name, Industry, Tax ID, Website, Created, Actions. No contact-count column.

**This workflow cannot be documented from observable UI code because the feature is not yet implemented in the frontend.**

## Action Required

When the feature is implemented, this file should be updated with the full numbered steps following the same conventions as the other SOP files in this directory.

Typical expected implementation would include:
- A `company_id` Select field in `ContactFormPage` populated from the companies list.
- A "Contacts" section or tab in `CompanyDetailPage` listing associated contacts.
- Corresponding permission guards (e.g., `contacts:update`).
