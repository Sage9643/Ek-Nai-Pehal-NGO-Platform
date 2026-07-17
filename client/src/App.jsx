import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Volunteer from './pages/Volunteer';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import ProtectedRoute from './admin/components/ProtectedRoute';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminVolunteers from './admin/pages/AdminVolunteers';
import AdminContactRequests from './admin/pages/AdminContactRequests';
import AdminEvents from './admin/pages/AdminEvents';
import AdminDonations from './admin/pages/AdminDonations';
import AdminGallery from './admin/pages/AdminGallery';

/**
 * Mounts AdminAuthProvider only for routes under /admin. The public site
 * must never trigger an admin session check (GET /api/admin/me) or depend
 * on admin authentication state in any way — scoping the provider to this
 * layout route (instead of wrapping the whole app) is what guarantees that.
 */
function AdminSection() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/admin" element={<AdminSection />}>
            <Route path="login" element={<AdminLogin />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="volunteers"
              element={
                <ProtectedRoute>
                  <AdminVolunteers />
                </ProtectedRoute>
              }
            />
            <Route
              path="contact-requests"
              element={
                <ProtectedRoute>
                  <AdminContactRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="events"
              element={
                <ProtectedRoute>
                  <AdminEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="donations"
              element={
                <ProtectedRoute>
                  <AdminDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="gallery"
              element={
                <ProtectedRoute>
                  <AdminGallery />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ChatWidget />}
    </div>
  );
}

export default App;