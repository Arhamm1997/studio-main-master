// src/app/contacts/page.tsx
'use client';

import useSWR from 'swr';

const fetchContacts = async () => {
  const res = await fetch('/api/contacts'); // API endpoint jo contacts data dega
  return res.json();
};

const ContactsPage = () => {
  const { data, error, mutate } = useSWR('/api/contacts', fetchContacts, { refreshInterval: 3000 });

  if (error) return <div>Error loading contacts</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Contacts</h1>
      <ul>
        {data.map(contact => (
          <li key={contact.id}>
            {contact.name} - {contact.status} - {new Date(contact.openedAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactsPage;
