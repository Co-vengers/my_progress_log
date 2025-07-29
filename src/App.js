// App.js
// To run this:
// 1. npx create-react-app my-progress-log
// 2. cd my-progress-log
// 3. npm install axios firebase
// 4. Replace the content of src/App.js with this code.
// 5. Add your Firebase config from your project settings.
// 6. npm start

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, getIdToken, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// --- Configuration ---
// This will use the environment's Firebase config if available.
const firebaseConfig = {
  apiKey: "AIzaSyCSZUjXH8EkdNXewsYO5HT_aKrhYJb9vo4",
  authDomain: "daily-logs-a7a41.firebaseapp.com",
  projectId: "daily-logs-a7a41",
  storageBucket: "daily-logs-a7a41.firebasestorage.app",
  messagingSenderId: "720923839667",
  appId: "1:720923839667:web:6e9d3b8f8e4d02888db4c6",
  measurementId: "G-9YCBWGMLE4"
};


// The base URL for your FastAPI backend
const API_URL = 'https://progress-log-api.onrender.com/';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Helper Functions & Components ---

const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold uppercase rounded-full tracking-wider";
    const statusMap = {
        'Not Started': 'bg-gray-200 text-gray-800',
        'In Progress': 'bg-blue-200 text-blue-800',
        'Completed': 'bg-green-200 text-green-800',
        'Blocked': 'bg-red-200 text-red-800',
    };
    return <span className={`${baseClasses} ${statusMap[status] || 'bg-gray-200'}`}>{status}</span>;
};

const PriorityIndicator = ({ priority }) => {
    const priorityMap = {
        'High': 'border-l-4 border-red-500',
        'Medium': 'border-l-4 border-orange-500',
        'Low': 'border-l-4 border-green-500',
    };
    return <div className={priorityMap[priority]}></div>;
};

// Represents the structure of a single task entry in the form
const createNewTaskEntry = () => ({
    id: crypto.randomUUID(),
    taskDescription: '',
    project: '',
    status: 'Not Started',
    priority: 'Medium',
    startTime: '',
    endTime: '',
});

// --- Edit Modal Component ---
const EditLogModal = ({ log, onSave, onCancel }) => {
    const [editState, setEditState] = useState(log);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSave(editState);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Edit Log Entry</h2>
                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="edit-taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                            <textarea id="edit-taskDescription" name="taskDescription" value={editState.taskDescription} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label htmlFor="edit-project" className="block text-sm font-medium text-gray-700 mb-1">Project / Category</label>
                            <input type="text" id="edit-project" name="project" value={editState.project} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select id="edit-priority" name="priority" value={editState.priority} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                <option>High</option><option>Medium</option><option>Low</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="edit-status" name="status" value={editState.status} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                <option>Not Started</option><option>In Progress</option><option>Completed</option><option>Blocked</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="edit-startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                <input type="time" id="edit-startTime" name="startTime" value={editState.startTime || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="edit-endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                <input type="time" id="edit-endTime" name="endTime" value={editState.endTime || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="edit-comments" className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                            <textarea id="edit-comments" name="comments" value={editState.comments || ''} onChange={handleChange} rows="2" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LoginScreen = ({ onLogin }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Daily Progress Log</h1>
            <p className="text-lg text-gray-600 mb-8">Sign in to continue</p>
            <button
                onClick={onLogin}
                className="flex items-center gap-3 bg-white text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-50 transition"
            >
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M24 9.5c3.23 0 5.89 1.34 7.87 3.21l-3.32 3.32c-.97-.92-2.2-1.47-3.55-1.47-2.73 0-4.96 2.23-4.96 4.96s2.23 4.96 4.96 4.96c1.55 0 2.89-.63 3.8-1.55l3.41 3.41C30.3 32.44 27.39 34 24 34c-5.52 0-10-4.48-10-10s4.48-10 10-10z"/>
                    <path fill="#34A853" d="M43.64 24.54c0-.87-.07-1.72-.21-2.54H24v4.84h11.02c-.48 3.14-2.84 5.4-5.82 5.4-3.51 0-6.36-2.85-6.36-6.36s2.85-6.36 6.36-6.36c1.98 0 3.7.89 4.92 2.19l3.82-3.82C33.64 10.38 29.27 8 24 8c-8.84 0-16 7.16-16 16s7.16 16 16 16c9.4 0 15.2-6.52 15.2-15.28 0-.9-.08-1.78-.22-2.64z"/>
                </svg>
                Sign in with Google
            </button>
        </div>
    );
};


export default function App() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [taskEntries, setTaskEntries] = useState([createNewTaskEntry()]);
    const [comments, setComments] = useState('');
    const [editingLog, setEditingLog] = useState(null);

    const getApiClient = async () => {
        if (!auth.currentUser) throw new Error("User not authenticated.");
        const token = await getIdToken(auth.currentUser);
        return axios.create({
            baseURL: API_URL,
            headers: { 'Authorization': `Bearer ${token}` }
        });
    };

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const apiClient = await getApiClient();
            const response = await apiClient.get('/logs');
            setLogs(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching logs:", err);
            setError(err.response?.data?.detail || "Failed to fetch logs. Is the backend server running?");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            fetchLogs();
        }
    }, [user, fetchLogs]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Google sign-in error:", error);
            setError("Failed to sign in with Google.");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    const handleTaskEntryChange = (index, event) => {
        const { name, value } = event.target;
        const updatedEntries = [...taskEntries];
        updatedEntries[index] = { ...updatedEntries[index], [name]: value };
        setTaskEntries(updatedEntries);
    };

    const addTaskEntry = () => {
        setTaskEntries([...taskEntries, createNewTaskEntry()]);
    };

    const removeTaskEntry = (index) => {
        if (taskEntries.length <= 1) return;
        const updatedEntries = taskEntries.filter((_, i) => i !== index);
        setTaskEntries(updatedEntries);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validEntries = taskEntries.filter(entry => entry.taskDescription.trim() && entry.project.trim());
        if (validEntries.length === 0) {
            alert("Please fill out at least one complete task entry.");
            return;
        }
        const promises = validEntries.map(entry => {
            let duration = '';
            if (entry.startTime && entry.endTime) {
                const start = new Date(`1970-01-01T${entry.startTime}`);
                const end = new Date(`1970-01-01T${entry.endTime}`);
                let diffMs = end - start;
                if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
            const payload = { ...entry, duration, comments };
            delete payload.id;
            return getApiClient().then(client => client.post('/logs', payload));
        });
        try {
            await Promise.all(promises);
            setTaskEntries([createNewTaskEntry()]);
            setComments('');
            fetchLogs();
        } catch (err) {
            console.error("Error adding log(s):", err);
            setError(err.response?.data?.detail || "Failed to add one or more logs.");
        }
    };
    
    const handleDelete = async (logId) => {
        if (window.confirm('Are you sure you want to delete this log?')) {
            try {
                const apiClient = await getApiClient();
                await apiClient.delete(`/logs/${logId}`);
                fetchLogs();
            } catch (err) {
                console.error("Error deleting log:", err);
                setError(err.response?.data?.detail || "Failed to delete log.");
            }
        }
    };

    const handleUpdate = async (updatedLog) => {
        try {
            const apiClient = await getApiClient();
            let duration = '';
            if (updatedLog.startTime && updatedLog.endTime) {
                const start = new Date(`1970-01-01T${updatedLog.startTime}`);
                const end = new Date(`1970-01-01T${updatedLog.endTime}`);
                let diffMs = end - start;
                if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
            const payload = { ...updatedLog, duration };
            delete payload.id;
            await apiClient.put(`/logs/${updatedLog.id}`, payload);
            setEditingLog(null);
            fetchLogs();
        } catch (err) {
            console.error("Error updating log:", err);
            setError(err.response?.data?.detail || "Failed to update log.");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            {editingLog && <EditLogModal log={editingLog} onSave={handleUpdate} onCancel={() => setEditingLog(null)} />}
            <div className="container mx-auto px-4 py-8 md:py-12">
                <header className="flex justify-between items-center mb-8 md:mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Daily Progress Log</h1>
                        <p className="text-md text-gray-600 mt-2">React + FastAPI Edition</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full" />
                        <div>
                            <p className="font-semibold">{user.displayName}</p>
                            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Sign Out</button>
                        </div>
                    </div>
                </header>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-8 md:mb-12 max-w-6xl mx-auto">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add Daily Tasks</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {taskEntries.map((entry, index) => (
                                <div key={entry.id} className="p-4 border border-gray-200 rounded-lg space-y-4 relative">
                                    {taskEntries.length > 1 && (
                                        <button type="button" onClick={() => removeTaskEntry(index)} className="absolute -top-3 -right-3 p-1 text-red-500 bg-red-100 rounded-full hover:bg-red-200 transition">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="lg:col-span-2">
                                            <label htmlFor={`taskDescription-${entry.id}`} className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                                            <input type="text" id={`taskDescription-${entry.id}`} name="taskDescription" placeholder="What did you work on?" value={entry.taskDescription} onChange={(e) => handleTaskEntryChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor={`project-${entry.id}`} className="block text-sm font-medium text-gray-700 mb-1">Project / Category</label>
                                            <input type="text" id={`project-${entry.id}`} name="project" placeholder="e.g., Project Phoenix" value={entry.project} onChange={(e) => handleTaskEntryChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                                        </div>
                                        <div>
                                            <label htmlFor={`priority-${entry.id}`} className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                            <select id={`priority-${entry.id}`} name="priority" value={entry.priority} onChange={(e) => handleTaskEntryChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                                                <option>High</option><option>Medium</option><option>Low</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={`status-${entry.id}`} className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select id={`status-${entry.id}`} name="status" value={entry.status} onChange={(e) => handleTaskEntryChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                                                <option>Not Started</option><option>In Progress</option><option>Completed</option><option>Blocked</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor={`startTime-${entry.id}`} className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                <input type="time" id={`startTime-${entry.id}`} name="startTime" value={entry.startTime} onChange={(e) => handleTaskEntryChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label htmlFor={`endTime-${entry.id}`} className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                                <input type="time" id={`endTime-${entry.id}`} name="endTime" value={entry.endTime} onChange={(e) => handleTaskEntryChange(index, e)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addTaskEntry} className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Add Another Task
                        </button>
                        
                        <div className="mt-6 pt-6 border-t border-gray-200">
                             <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">Overall Comments / Notes for the Day</label>
                             <textarea id="comments" name="comments" value={comments} onChange={(e) => setComments(e.target.value)} rows="2" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Any general summary or notes..."></textarea>
                        </div>

                        <div className="mt-6 text-right">
                            <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">Add All Logs for the Day</button>
                        </div>
                    </form>
                </div>

                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Logged Tasks</h2>
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Project</th>
                                    <th className="px-6 py-3">Task</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-center">Duration</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center p-8">Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center p-8">No logs found.</td></tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 flex items-center">
                                                <PriorityIndicator priority={log.priority} />
                                                <span className="pl-2 font-medium text-gray-900">{new Date(log.date).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-6 py-4">{log.project}</td>
                                            <td className="px-6 py-4 whitespace-pre-line">{log.taskDescription}</td>
                                            <td className="px-6 py-4 text-center"><StatusBadge status={log.status} /></td>
                                            <td className="px-6 py-4 text-center font-mono">{log.duration || 'N/A'}</td>
                                            <td className="px-6 py-4 text-center flex justify-center items-center gap-4">
                                                <button onClick={() => setEditingLog(log)} className="text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                                                <button onClick={() => handleDelete(log.id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
