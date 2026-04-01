import { NavLink, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Archaeology Clustering UI</p>
          <h1>Интерфейс кластеризации погребений</h1>
        </div>

        <nav className="top-nav">
          <NavLink to="/">Загрузка и запуск</NavLink>
          <NavLink to="/clusters">Результаты</NavLink>
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
