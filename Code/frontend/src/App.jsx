import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Camera, Settings, Activity, User, Monitor, Globe, MessageSquare, Send, X } from 'lucide-react';

import { useGPS } from './hooks/useGPS';
import { useAccelerometer } from './hooks/useAccelerometer';
import { useVoice } from './hooks/useVoice';
import { SureStepWS } from './api/websocket';

import MapView from './components/Map/MapView';
import RiskMeter from './components/HUD/RiskMeter';
import AlertBanner from './components/HUD/AlertBanner';
import SOSButton from './components/Controls/SOSButton';
import VoiceToggle from './components/Controls/VoiceToggle';
import SearchPanel from './components/Panels/SearchPanel';
import UserList from './components/HUD/UserList';
import JoinScreen from './components/Panels/JoinScreen';
import LocalVision from './components/HUD/LocalVision';

import './styles/global.css';

// Dynamic API Base to support Ngrok deployment
const DEFAULT_API_BASE = 'http://localhost:8000/api';

function App() {
  const [apiBase, setApiBase] = useState(localStorage.getItem('SURESTEP_API_URL') || DEFAULT_API_BASE);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(apiBase);

  const gps = useGPS();
  const accel = useAccelerometer();
  const { isEnabled: voiceEnabled, toggleVoice, speak } = useVoice();

  const [hasJoined, setHasJoined] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState({ risk_score: 0, alert_level: 'safe', dominant_hazard: '', detections: [] });
  const [hazards, setHazards] = useState([]);
  const [destination, setDestination] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [remoteFrame, setRemoteFrame] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);
  const visionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateApiUrl = () => {
    localStorage.setItem('SURESTEP_API_URL', tempApiUrl);
    setApiBase(tempApiUrl);
    setShowApiSettings(false);
    window.location.reload(); 
  };

  // 1. Initial User/Session Setup
  const handleJoin = async (name) => {
    try {
      const userRes = await axios.post(`${apiBase}/users`, {
        name: name,
        phone: "0000000000",
        email: `${name.toLowerCase().replace(/\s/g, '')}@surestep.local`
      });
      const dbUser = userRes.data;
      setUser(dbUser);

      const sessionRes = await axios.post(`${apiBase}/sessions`, {
        user_id: dbUser.id,
        start_lat: gps.lat || 0,
        start_lon: gps.lon || 0,
        end_lat: gps.lat || 0,
        end_lon: gps.lon || 0
      });
      setSession(sessionRes.data);

      const wsUrl = apiBase.replace('http', 'ws').replace('/api', '');
      wsRef.current = new SureStepWS(
        sessionRes.data.id,
        (data) => {
          if (data.type === 'alert') {
            setAlert(data);
            if (data.alert_level !== 'safe' && voiceEnabled) {
              speak(`Warning: ${data.dominant_hazard} detected.`);
            }
          } else if (data.type === 'user_list') {
            setActiveUsers(data.users);
          } else if (data.type === 'remote_frame') {
            setRemoteFrame(data.frame);
          } else if (data.type === 'fall_alert') {
            speak("Fall detected!");
          } else if (data.type === 'chat') {
            setMessages(prev => [...prev, data]);
          }
        },
        (err) => console.error("WS Error:", err),
        wsUrl
      );

      const checkOpen = setInterval(() => {
        if (wsRef.current?.ws?.readyState === 1) {
          wsRef.current.send({
            type: "join",
            user_id: dbUser.id,
            name: dbUser.name
          });
          setHasJoined(true);
          clearInterval(checkOpen);
        }
      }, 100);

    } catch (err) {
      console.error("Join failed:", err);
      alert("Connection to backend failed. Please check your API URL settings.");
      setShowApiSettings(true);
    }
  };

  // 2. Processing Loop (500ms)
  useEffect(() => {
    if (!wsRef.current || !session || !user || !hasJoined) return;

    const interval = setInterval(() => {
      const frame = visionRef.current?.captureFrame();
      wsRef.current.send({
        type: "frame",
        session_id: session.id,
        user_id: user.id,
        gps: { lat: gps.lat, lon: gps.lon, speed_mps: gps.speed },
        accelerometer: { x: accel.x, y: accel.y, z: accel.z },
        frame_b64: frame
      });
    }, 500);

    return () => clearInterval(interval);
  }, [session, user, gps, accel, hasJoined]);

  // 3. Subscription Management
  useEffect(() => {
    if (!wsRef.current || !viewingUserId || !user || viewingUserId === user.id) {
      setRemoteFrame(null);
      return;
    }

    wsRef.current.send({
      type: "subscribe",
      target_id: viewingUserId
    });
  }, [viewingUserId, user]);

  const sendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !wsRef.current) return;
    wsRef.current.send({
      type: "chat",
      text: chatInput
    });
    setChatInput("");
  };

  const handleSOS = async () => {
    if (!user) return;
    try {
      await axios.post(`${apiBase}/sos`, {
        user_id: user.id,
        session_id: session?.id,
        lat: gps.lat,
        lon: gps.lon
      });
      alert("SOS Sent!");
    } catch (e) {
      console.error("SOS failed:", e);
    }
  };

  if (!hasJoined) {
    return (
      <>
        <JoinScreen onJoin={handleJoin} />
        <button 
          onClick={() => setShowApiSettings(true)}
          style={{ position: 'fixed', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', zIndex: 10000 }}
        >
          <Settings size={20} />
        </button>

        <AnimatePresence>
          {showApiSettings && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div className="glass" style={{ padding: '30px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                <Globe size={40} color="var(--color-primary)" style={{ marginBottom: '20px' }} />
                <h3>API Configuration</h3>
                <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>Enter the public Ngrok URL for the backend (including /api)</p>
                <input 
                  type="text" 
                  value={tempApiUrl} 
                  onChange={(e) => setTempApiUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'white', marginBottom: '20px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowApiSettings(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px' }}>Cancel</button>
                  <button onClick={updateApiUrl} style={{ flex: 1, padding: '12px', background: 'var(--color-primary)', border: 'none', color: 'black', fontWeight: 'bold', borderRadius: '8px' }}>Save & Reload</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="app-container" style={{ position: 'relative', height: '100vh', width: '100vw', background: '#0a0a14', overflow: 'hidden' }}>
      
      {/* Background Map View */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <MapView lat={gps.lat} lon={gps.lon} hazards={hazards} destination={destination} />
      </div>

      {/* Left Side User Panel */}
      <div style={{ position: 'absolute', top: '100px', left: '20px', zIndex: 100 }}>
        <UserList 
          users={activeUsers} 
          onSelectUser={setViewingUserId} 
          selectedUserId={viewingUserId}
          currentUserId={user?.id}
        />
      </div>

      {/* Local AI Vision Window */}
      <LocalVision ref={visionRef} detections={alert.detections} />

      {/* Remote View Window + Chat */}
      <AnimatePresence>
        {viewingUserId && viewingUserId !== user.id && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '800px',
              maxWidth: '95vw',
              height: '500px',
              maxHeight: '80vh',
              zIndex: 1000,
              padding: '10px',
              display: 'flex',
              gap: '10px',
              border: '2px solid var(--color-primary)'
            }}
          >
            {/* Left: Video Feed */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Monitor size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 'bold' }}>{activeUsers.find(u => u.id === viewingUserId)?.name}'S FEED</span>
                </div>
              </div>
              <div style={{ flex: 1, background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                {remoteFrame ? (
                  <img src={`data:image/jpeg;base64,${remoteFrame}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Remote Feed" />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>WAITING FOR FEED...</div>
                )}
              </div>
            </div>

            {/* Right: Chat Interface */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>NETWORK CHAT</span>
                <X size={18} style={{ cursor: 'pointer' }} onClick={() => setViewingUserId(null)} />
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ fontSize: '12px', background: msg.from_id === user.id ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '10px' }}>{msg.from_name}</div>
                    <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChat} style={{ display: 'flex', gap: '5px' }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: 'white', fontSize: '12px' }}
                />
                <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}>
                  <Send size={16} color="black" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Chat Overlay */}
      <AnimatePresence>
        {!viewingUserId && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ position: 'absolute', bottom: '100px', left: '280px', width: '300px', height: '200px', zIndex: 100, display: 'flex', flexDirection: 'column' }}
          >
            <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', fontSize: '12px' }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '5px' }}>
                {messages.slice(-5).map((msg, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{msg.from_name}: </span>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChat} style={{ display: 'flex', gap: '5px' }}>
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat with network..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '4px', color: 'white', fontSize: '11px' }}
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Interface - Controls & Search */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <VoiceToggle isEnabled={voiceEnabled} onToggle={toggleVoice} />
          <SearchPanel onLocationSelect={setDestination} />
        </div>
        <SOSButton onTrigger={handleSOS} />
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {alert.alert_level !== 'safe' && (
          <AlertBanner level={alert.alert_level} hazard={alert.dominant_hazard} />
        )}
      </AnimatePresence>

      {/* Bottom Interface Dock */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="glass" style={{ padding: '15px 25px', display: 'flex', gap: '30px', alignItems: 'center', border: '1px solid var(--color-primary)' }}>
          <RiskMeter score={alert.risk_score} level={alert.alert_level} />
          <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '30px' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, color: 'var(--color-primary)', fontWeight: 'bold' }}>YOUR SPEED</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>{(gps.speed * 3.6).toFixed(1)} <span style={{ fontSize: '14px', opacity: 0.6 }}>KM/H</span></div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', opacity: 0.8, display: 'flex', gap: '15px', zIndex: 100, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px' }}>
        <span>USER: {user?.name}</span>
        <span>GPS: {gps.lat ? 'FIX' : 'WAIT'}</span>
        <span>WS: {wsRef.current?.ws?.readyState === 1 ? 'LIVE' : 'DISC'}</span>
        <button onClick={() => setShowApiSettings(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><Settings size={10} /></button>
      </div>

    </div>
  );
}

export default App;
