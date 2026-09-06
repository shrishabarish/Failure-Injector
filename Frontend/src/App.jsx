import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login1 from "./pages/Login1";
import Dashboard from "./pages/Dashboard";
import SubmitCode1 from "./pages/SubmitCode1";
import Review from "./pages/Review";
import Register from "./pages/Register";
import Logs from "./pages/Logs";
import FailureInjection from "./pages/FailureInjection";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Landing />} />
        <Route path="/login"             element={<Login1 />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/submit"            element={<SubmitCode1 />} />
        <Route path="/review"            element={<Review />} />
        <Route path="/logs"              element={<Logs />} />
        <Route path="/faults"            element={<FailureInjection />} />
        <Route path="/failure-injection" element={<Navigate to="/faults" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;