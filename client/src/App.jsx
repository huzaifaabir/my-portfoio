
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import { RequirePermission, RequireStaff } from './components/RequireStaff.jsx';
import Home from './pages/public/Home.jsx';
import About from './pages/public/About.jsx';
import Projects from './pages/public/Projects.jsx';
import ProjectDetail from './pages/public/ProjectDetail.jsx';
import Contact from './pages/public/Contact.jsx';
import NotFound from './pages/public/NotFound.jsx';
import Login from './pages/admin/Login.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ProfileEditor from './pages/admin/ProfileEditor.jsx';
import ResumeEditor from './pages/admin/ResumeEditor.jsx';
import ProjectsList from './pages/admin/ProjectsList.jsx';
import ProjectEditor from './pages/admin/ProjectEditor.jsx';
import Messages from './pages/admin/Messages.jsx';
import Users from './pages/admin/Users.jsx';
import Account from './pages/admin/Account.jsx';
import BrandPartners from './pages/admin/BrandPartners.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="admin/login" element={<Login />} />

      <Route
        path="admin"
        element={
          <RequireStaff>
            <AdminLayout />
          </RequireStaff>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfileEditor />} />
        <Route path="resume" element={<ResumeEditor />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/new" element={<ProjectEditor />} />
        <Route path="projects/:id/edit" element={<ProjectEditor />} />

        <Route
          path="brand-partners"
          element={
            <RequirePermission permission="manageContent">
              <BrandPartners />
            </RequirePermission>
          }
        />

        <Route
          path="messages"
          element={
            <RequirePermission permission="manageMessages">
              <Messages />
            </RequirePermission>
          }
        />

        <Route
          path="users"
          element={
            <RequirePermission permission="manageUsers">
              <Users />
            </RequirePermission>
          }
        />

        <Route path="account" element={<Account />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
