import React, { useEffect, useState } from 'react';
import { trainingApi, TrainingCalendar, TrainingSession } from '../api/trainingApi';
import AdminGate from '../../../shared/guards/AdminGate';

export default function AnnualTrainingPlannerPage() {
  const [calendars, setCalendars] = useState<TrainingCalendar[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  
  const [showAddCalendarModal, setShowAddCalendarModal] = useState(false);
  const [newFinYear, setNewFinYear] = useState('');

  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState<Partial<TrainingSession>>({
    title: '', category: '', training_type: 'internal', priority: 'medium', duration_hours: 1, budget: 0
  });

  const loadCalendars = async () => {
    try {
      const cals = await trainingApi.getCalendars();
      setCalendars(cals);
      if (cals.length > 0 && !selectedCalendarId) {
        setSelectedCalendarId(cals[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSessions = async () => {
    if (!selectedCalendarId) return;
    try {
      const s = await trainingApi.getSessions(selectedCalendarId);
      setSessions(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadCalendars(); }, []);
  useEffect(() => { loadSessions(); }, [selectedCalendarId]);

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinYear) return;
    try {
      const c = await trainingApi.createCalendar(newFinYear);
      setCalendars([c, ...calendars]);
      setSelectedCalendarId(c.id);
      setShowAddCalendarModal(false);
      setNewFinYear('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendarId || !sessionForm.title) return;
    try {
      const s = await trainingApi.createSession({ ...sessionForm, calendar_id: selectedCalendarId });
      setSessions([s, ...sessions]);
      setShowAddSessionModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    try {
      await trainingApi.updateSessionStatus(sessionId, newStatus);
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this training session?")) return;
    try {
      await trainingApi.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0, color: '#333' }}>Annual Training Planner</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={selectedCalendarId} 
            onChange={e => setSelectedCalendarId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          >
            {calendars.length === 0 && <option value="">No Calendars Available</option>}
            {calendars.map(c => <option key={c.id} value={c.id}>{c.financial_year}</option>)}
          </select>
          <button onClick={() => setShowAddCalendarModal(true)} style={{ padding: '8px 16px', borderRadius: 6, background: '#f0f0f0', border: '1px solid #ddd', cursor: 'pointer' }}>+ New Year</button>
          <button onClick={() => setShowAddSessionModal(true)} disabled={!selectedCalendarId} style={{ padding: '8px 16px', borderRadius: 6, background: '#4a90e2', color: 'white', border: 'none', cursor: 'pointer' }}>+ Add Training</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Total Trainings</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{sessions.length}</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Completed</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2ecc71' }}>{sessions.filter(s => s.status === 'completed').length}</div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Total Budget (Est)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>Rs. {sessions.reduce((acc, s) => acc + Number(s.budget || 0), 0).toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9f9f9', borderBottom: '1px solid #eaeaea' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#555', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#555', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#555', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#555', fontWeight: 600 }}>Trainer</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#555', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#555', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{s.title}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{s.category || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString() : 'TBD'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{s.trainer || '—'}</td>

                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  <select 
                    value={s.status}
                    onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 12, border: 'none',
                      background: s.status === 'completed' ? '#d4edda' : s.status === 'cancelled' ? '#f8d7da' : '#fff3cd', 
                      color: s.status === 'completed' ? '#155724' : s.status === 'cancelled' ? '#721c24' : '#856404', 
                      textTransform: 'capitalize', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value="planned">Planned</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  <AdminGate>
                    <button 
                      onClick={() => handleDeleteSession(s.id)}
                      style={{ padding: '4px 8px', borderRadius: 4, background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </AdminGate>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: '#999' }}>
                  No training sessions planned for this calendar yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddCalendarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginTop: 0 }}>Create Training Calendar</h3>
            <form onSubmit={handleCreateCalendar}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Financial Year (e.g., 2026-2027)</label>
                <input required type="text" value={newFinYear} onChange={e => setNewFinYear(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowAddCalendarModal(false)} style={{ padding: '6px 12px', border: '1px solid #ccc', background: 'transparent', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '6px 12px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSessionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Add Training Session</h3>
            <form onSubmit={handleCreateSession}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Title</label>
                <input required type="text" value={sessionForm.title} onChange={e => setSessionForm({...sessionForm, title: e.target.value})} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Category</label>
                  <input type="text" value={sessionForm.category} onChange={e => setSessionForm({...sessionForm, category: e.target.value})} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Scheduled Date</label>
                  <input type="date" value={sessionForm.scheduled_date} onChange={e => setSessionForm({...sessionForm, scheduled_date: e.target.value})} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Trainer</label>
                  <input type="text" value={sessionForm.trainer} onChange={e => setSessionForm({...sessionForm, trainer: e.target.value})} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Budget</label>
                  <input type="number" value={sessionForm.budget} onChange={e => setSessionForm({...sessionForm, budget: Number(e.target.value)})} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button type="button" onClick={() => setShowAddSessionModal(false)} style={{ padding: '6px 12px', border: '1px solid #ccc', background: 'transparent', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '6px 12px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
