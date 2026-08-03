import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { SECTIONS, NavItem } from "../../../shared/components/AdminLayout";

import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import "./HomePage.css";

interface Shortcut {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newShortcut, setNewShortcut] = useState<Partial<Shortcut>>({ icon: "🔗" });
  const [myEmployee, setMyEmployee] = useState<EmployeeRecord | null>(null);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`lii-nexus-shortcuts-${user.id}`);
    if (stored) {
      try {
        setShortcuts(JSON.parse(stored));
      } catch (err) {}
    }
    
    // Fetch my employee record for celebrations
    employeesApi.getMe().then(setMyEmployee).catch(() => {});
  }, [user]);

  function saveShortcuts(list: Shortcut[]) {
    setShortcuts(list);
    if (user) {
      localStorage.setItem(`lii-nexus-shortcuts-${user.id}`, JSON.stringify(list));
    }
  }

  function handleAddShortcut() {
    if (!newShortcut.title || !newShortcut.route) return;
    const item: Shortcut = {
      id: Date.now().toString(),
      title: newShortcut.title,
      description: newShortcut.description || "",
      icon: newShortcut.icon || "🔗",
      route: newShortcut.route,
    };
    saveShortcuts([...shortcuts, item]);
    setNewShortcut({ icon: "🔗" });
    setShowModal(false);
  }

  function handleRemoveShortcut(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    saveShortcuts(shortcuts.filter(s => s.id !== id));
  }

  function getGreeting() {
    const hour = new Date().getHours(); // 0 to 23
    if (hour >= 5 && hour < 12) return "Good Morning! 🌅";
    if (hour >= 12 && hour < 17) return "Good Afternoon! ☀️";
    if (hour >= 17 && hour < 21) return "Good Evening! 🌇";
    return "Good Night! 🌙";
  }

  // Calculate available routes based on roles
  const availableRoutes = React.useMemo(() => {
    const routes: { label: string, to: string }[] = [];
    if (!user) return routes;

    SECTIONS.forEach(section => {
      // Check section role permissions
      if (section.allowedRoles && !section.allowedRoles.some(role => user.roles.includes(role))) {
        return; // Skip section if not allowed
      }

      // Only take top-level items in each section
      section.items.forEach(item => {
        if (item.to) {
          routes.push({ label: `${section.label} > ${item.label}`, to: item.to });
        }
      });
    });

    return routes;
  }, [user]);

  // Set default route when modal opens if none selected
  useEffect(() => {
    if (showModal && !newShortcut.route && availableRoutes.length > 0) {
      setNewShortcut(prev => ({ ...prev, route: availableRoutes[0].to }));
    }
  }, [showModal, availableRoutes]);

  // Determine if there are any events today
  const todayEvent = React.useMemo(() => {
    if (!myEmployee) return null;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    const isMatch = (dateStr: string | null) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getDate() === currentDay;
    };

    const firstName = user?.fullName?.split(' ')[0] || "User";

    if (isMatch(myEmployee.birthday)) {
      return {
        type: 'birthday',
        title: 'जन्मदिन की हार्दिक शुभकामनाएँ!',
        message: `Happy Birthday, ${firstName}! We wish you a fantastic day and a wonderful year ahead.`,
        bg: 'url("/birthday-bg.svg")'
      };
    }
    if (isMatch(myEmployee.anniversary)) {
      return {
        type: 'anniversary',
        title: 'विवाह वर्षगांठ की शुभकामनाएँ!',
        message: `Happy Anniversary, ${firstName}! Wishing you a lifetime of joy and happiness.`,
        bg: 'url("/marriage-bg.svg")'
      };
    }
    if (isMatch(myEmployee.dateOfJoining)) {
      const joinYear = new Date(myEmployee.dateOfJoining!).getFullYear();
      const years = currentYear - joinYear;
      if (years > 0) {
        return {
          type: 'work-anniversary',
          title: 'कार्य वर्षगांठ की शुभकामनाएँ!',
          message: `Happy Work Anniversary, ${firstName}! Celebrating ${years} year${years > 1 ? 's' : ''} of your dedication and hard work with us.`,
          bg: 'url("/anniversary-bg.svg")'
        };
      }
    }
    return null;
  }, [myEmployee, user]);

  return (
    <div className="home-page-container">
      {todayEvent && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} gravity={0.15} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} />}
      <div className="home-hero">
        <div className="home-logo-wrapper">
          <img src="/logo.jpg" alt="Laxmi Ideal Interiors" className="home-logo" />
        </div>
        <h1 className="home-title">{getGreeting()}</h1>
        <p className="home-subtitle">Welcome back, {user?.fullName || "User"}</p>
        <p className="home-subtitle" style={{ marginTop: 8, fontSize: '0.95rem', color: '#6b7280', fontWeight: 500 }}>
          {currentDateTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentDateTime.toLocaleTimeString()}
        </p>
      </div>

      {todayEvent && (
        <div style={{
          marginBottom: 32,
          padding: 40,
          borderRadius: 16,
          backgroundImage: todayEvent.bg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            zIndex: 1
          }}></div>
          <div style={{ position: "relative", zIndex: 2, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <h2 style={{ 
              margin: "0 0 16px 0", 
              fontSize: 32, 
              fontWeight: 800, 
              color: "#0f172a", // Dark slate / professional deep color
              letterSpacing: "-0.02em"
            }}>
              {todayEvent.title}
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: 18, 
              color: "#334155", // Slate grey
              fontWeight: 500, 
              maxWidth: 600, 
              marginLeft: "auto", 
              marginRight: "auto",
              lineHeight: 1.6
            }}>
              {todayEvent.message}
            </p>
          </div>
        </div>
      )}

      <div className="home-shortcuts-header">
        <h2>My Shortcuts</h2>
        <button className="add-shortcut-btn" onClick={() => setShowModal(true)}>+ Add Shortcut</button>
      </div>

      <div className="home-grid">
        {shortcuts.map((link) => (
          <div 
            key={link.id} 
            className="home-card"
            onClick={() => navigate(link.route)}
          >
            <div className="home-card-header">
              <div className="home-card-icon">{link.icon}</div>
              <button 
                className="remove-shortcut-btn" 
                onClick={(e) => handleRemoveShortcut(e, link.id)}
                title="Remove Shortcut"
              >
                ✕
              </button>
            </div>
            <h3 className="home-card-title">{link.title}</h3>
            <p className="home-card-desc">{link.description}</p>
          </div>
        ))}
        {shortcuts.length === 0 && (
          <div className="home-card empty-card" onClick={() => setShowModal(true)}>
            <div className="home-card-icon">➕</div>
            <h3 className="home-card-title">No shortcuts yet</h3>
            <p className="home-card-desc">Click here to add your first quick link.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Shortcut</h3>
            <div className="modal-form">
              <label>Icon (Emoji)</label>
              <input 
                type="text" 
                value={newShortcut.icon} 
                onChange={e => setNewShortcut({...newShortcut, icon: e.target.value})} 
                placeholder="🔗"
              />
              <label>Title</label>
              <input 
                type="text" 
                value={newShortcut.title || ""} 
                onChange={e => setNewShortcut({...newShortcut, title: e.target.value})} 
                placeholder="e.g. Reports"
              />
              <label>Description</label>
              <input 
                type="text" 
                value={newShortcut.description || ""} 
                onChange={e => setNewShortcut({...newShortcut, description: e.target.value})} 
                placeholder="Quick access to reports"
              />
              <label>Module / Route</label>
              <select 
                value={newShortcut.route || ""} 
                onChange={e => {
                  const to = e.target.value;
                  const found = availableRoutes.find(r => r.to === to);
                  setNewShortcut({
                    ...newShortcut, 
                    route: to,
                    // Auto-fill title if empty
                    title: newShortcut.title || (found ? found.label.split(" > ").pop() : "")
                  });
                }}
                className="modal-select"
              >
                {availableRoutes.map((r, i) => (
                  <option key={i} value={r.to}>{r.label}</option>
                ))}
              </select>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleAddShortcut} disabled={!newShortcut.title || !newShortcut.route}>Save Shortcut</button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
