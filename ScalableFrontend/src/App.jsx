import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./Components/Auth/Auth";
import Dashboard from './Components/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
         <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;