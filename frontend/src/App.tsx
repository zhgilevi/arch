import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BurialPage } from "./pages/BurialPage";
import { ClusterResultsPage } from "./pages/ClusterResultsPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/clusters" element={<ClusterResultsPage />} />
        <Route path="/burial/:shortName" element={<BurialPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
