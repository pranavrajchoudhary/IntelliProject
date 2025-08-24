import React, { useState } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthGuard from './components/auth/AuthGuard';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ProjectDetail from './components/projects/ProjectDetail';
import ProjectsPage from './components/projects/ProjectsPage';
import MessagesPage from './components/messages/MessagesPage';
import DocumentsPage from './components/documents/DocumentsPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import SettingsPage from './components/settings/SettingsPage';
import BackendLoader from './components/BackendLoader';
import KanbanBoard from './components/KanbanBoard';
import { CurrentProjectProvider } from './context/CurrentProjectContext';
import MeetingsPage from './components/meetings/MeetingsPage';
import MeetingRoom from './components/meetings/MeetingRoom';

function App() {
  const [backendReady, setBackendReady] = useState(false);

  const handleBackendReady = () => {
    setBackendReady(true);
  };

   if (!backendReady) {
    return <BackendLoader onBackendReady={handleBackendReady} />;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <CurrentProjectProvider>
        <Router>
          <div className="min-h-screen bg-white text-black">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                path="/project/:id"
                element={
                  <AuthGuard>
                    <Layout>
                      <ProjectDetail />
                    </Layout>
                  </AuthGuard>
                }
              />
              <Route
                  path="/projects"
                  element={
                    <AuthGuard>
                      <Layout>
                        <ProjectsPage />
                      </Layout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/kanban"
                  element={
                    <AuthGuard>
                      <Layout>
                        <KanbanBoard />
                      </Layout>
                    </AuthGuard>
                  }
                />
              <Route path="/messages" element={
                <AuthGuard>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </AuthGuard>
              } />

              <Route path="/meetings" element={
                <AuthGuard>
                  <Layout>
                    <MeetingsPage />
                  </Layout>
                </AuthGuard>
              } />

              <Route path="/meetings/:roomId" element={
                <AuthGuard>
                  <MeetingRoom />
                </AuthGuard>
              } />
              
              <Route path="/documents" element={
                <AuthGuard>
                  <Layout>
                    <DocumentsPage />
                  </Layout>
                </AuthGuard>
              } />
              
              <Route path="/analytics" element={
                <AuthGuard>
                  <Layout>
                    <AnalyticsPage />
                  </Layout>
                </AuthGuard>
              } />
              
              <Route path="/settings" element={
                <AuthGuard>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </AuthGuard>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1f2937',
                  color: '#ffffff',
                  border: '1px solid #374151',
                },
              }}
            />
          </div>
        </Router>
        </CurrentProjectProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
