import React from 'react';
import { Users, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

const UserList = ({ users, onSelectUser, selectedUserId, currentUserId }) => {
  return (
    <div className="glass" style={{
      width: '200px',
      maxHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      padding: '15px',
      gap: '12px'
    }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <Users size={20} color="var(--color-primary)" />
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>ACTIVE NAVIGATORS</span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {users.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectUser(user.id)}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: selectedUserId === user.id ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${selectedUserId === user.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {user.name} {user.id === currentUserId && "(You)"}
              </span>
              {selectedUserId === user.id && <Radio size={12} className="pulse" color="var(--color-primary)" />}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div>
                <span>{user.speed.toFixed(1)} KM/H</span>
              </div>
              <div style={{ opacity: 0.8, fontSize: '9px' }}>📍 {user.location}</div>
            </div>

          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
