import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllBurials, uploadBurial } from "../api";
import type { BurialSummary } from "../types";

export function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [clusterCount, setClusterCount] = useState(3);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [burials, setBurials] = useState<BurialSummary[]>([]);
  const [isBurialListOpen, setIsBurialListOpen] = useState(false);
  const [isBurialListLoading, setIsBurialListLoading] = useState(false);
  const [burialListError, setBurialListError] = useState("");

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setUploadState("error");
      setUploadMessage("Выберите Excel-файл для загрузки.");
      return;
    }

    try {
      setUploadState("loading");
      setUploadMessage("");
      await uploadBurial({ file, name, shortName });
      setUploadState("success");
      setUploadMessage("Файл успешно загружен.");
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Не удалось загрузить данные.");
    }
  }

  function handleClusterize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/clusters?count=${clusterCount}`);
  }

  async function handleShowBurials() {
    if (isBurialListOpen) {
      setIsBurialListOpen(false);
      return;
    }

    try {
      setIsBurialListLoading(true);
      setBurialListError("");
      const data = await getAllBurials();
      setBurials(data);
      setIsBurialListOpen(true);
    } catch (error) {
      setBurialListError(error instanceof Error ? error.message : "Не удалось загрузить список могильников.");
      setIsBurialListOpen(true);
    } finally {
      setIsBurialListLoading(false);
    }
  }

  return (
    <div className="page-content">
      <div className="grid-layout">
        <section className="panel">
          <p className="panel-tag">Шаг 1</p>
          <h2>Загрузка данных</h2>
          <p className="panel-text">
            Отправьте Excel-файл вместе с полным и коротким именем погребения.
          </p>

          <form className="form-stack" onSubmit={handleUpload}>
            <label>
              Название набора
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Например, Маяцкое городище"
              />
            </label>

            <label>
              Короткое имя
              <input
                required
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
                placeholder="Например, mayatskoe"
              />
            </label>

            <label>
              Excel-файл
              <input
                required
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <button className="primary-button" type="submit" disabled={uploadState === "loading"}>
              {uploadState === "loading" ? "Загрузка..." : "Загрузить данные"}
            </button>
          </form>

          {uploadMessage ? (
            <div className={`message-box ${uploadState === "error" ? "message-error" : "message-success"}`}>
              {uploadMessage}
            </div>
          ) : null}
        </section>

        <section className="panel accent-panel">
          <p className="panel-tag">Шаг 2</p>
          <h2>Кластеризация</h2>
          <p className="panel-text">
            Укажите количество кластеров и откройте страницу результатов.
          </p>

          <form className="form-stack" onSubmit={handleClusterize}>
            <label>
              Количество кластеров
              <input
                type="number"
                min={1}
                required
                value={clusterCount}
                onChange={(event) => setClusterCount(Number(event.target.value))}
              />
            </label>

            <button className="primary-button light-button" type="submit">
              Кластеризовать
            </button>
          </form>
        </section>
      </div>

      <section className="panel">
        <p className="panel-tag">Шаг 3</p>
        <h2>Список могильников</h2>
        <p className="panel-text">
          По кнопке ниже загружается список могильников. Нажатие на карточку
          открывает информацию о могильнике.
        </p>

        <button className="primary-button" type="button" onClick={handleShowBurials} disabled={isBurialListLoading}>
          {isBurialListLoading ? "Загрузка..." : isBurialListOpen ? "Скрыть список могильников" : "Показать список могильников"}
        </button>

        {burialListError ? <div className="message-box message-error">{burialListError}</div> : null}

        {isBurialListOpen && !burialListError && burials.length > 0 ? (
          <div className="burial-list">
            {burials.map((burial) => (
              <Link
                key={burial.burial_short_name}
                className="panel burial-card"
                to={`/burial/${encodeURIComponent(burial.burial_short_name)}`}
              >
                <div className="burial-card-header">
                  <div>
                    <p className="panel-tag">{burial.burial_short_name}</p>
                    <h3>{burial.burial_name}</h3>
                  </div>
                  <span className="pill">{burial.burials.length} захоронений</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {isBurialListOpen && !burialListError && !isBurialListLoading && burials.length === 0 ? (
          <div className="message-box">Список могильников пуст.</div>
        ) : null}
      </section>
    </div>
  );
}
