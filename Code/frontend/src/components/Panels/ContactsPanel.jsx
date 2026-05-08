import React from 'react';
import { User, Phone, Mail } from 'lucide-react';

const ContactsPanel = ({ contacts }) => {
  return (
    <div className="glass contacts-panel" style={{
      padding: '20px',
      maxHeight: '300px',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', opacity: 0.8 }}>TRUSTED CONTACTS</h3>
      {contacts.length === 0 ? (
        <div style={{ fontSize: '14px', opacity: 0.5 }}>No contacts added.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} /> {c.contact_name}
              </div>
              <div style={{ opacity: 0.7, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={12} /> {c.contact_phone}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsPanel;
