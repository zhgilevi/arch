import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadBurial } from "../api";

export function HomePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [clusterCount, setClusterCount] = useState(3);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

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
      setUploadMessage("Файл успешно загружен в backend.");
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Не удалось загрузить данные.");
    }
  }

  function handleClusterize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/clusters?count=${clusterCount}`);
  }

  return (
    <div className="grid-layout">
      <section className="panel">
        <p className="panel-tag">Шаг 1</p>
        <h2>Загрузка данных</h2>
        <p className="panel-text">
          Отправьте Excel-файл на эндпоинт <code>/burial/upload</code> вместе с полным и коротким именем погребения.
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
          Укажите количество кластеров и откройте страницу результатов. На ней автоматически вызывается эндпоинт{" "}
          <code>/cluster/clusters</code>.
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
  );
}
