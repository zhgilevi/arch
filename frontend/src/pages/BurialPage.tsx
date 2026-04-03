import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBurial, getBurialClusters } from "../api";
import type { BurialDetailsResponse, ClusterGroup } from "../types";

function BurialClusterMembers({ cluster }: { cluster: ClusterGroup }) {
  return (
    <details className="cluster-details">
      <summary>Захоронения в кластере: {cluster.count}</summary>
      <div className="cluster-links">
        {cluster.ids.map((id, index) => {
          const shortName = cluster.short_name[index] ?? "";
          return (
            <span key={`${cluster.cluster}-${id}-${index}`} className="object-link">
              {id}({shortName})
            </span>
          );
        })}
      </div>
    </details>
  );
}

export function BurialPage() {
  const { shortName = "" } = useParams();
  const [details, setDetails] = useState<BurialDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [clusterCount, setClusterCount] = useState(3);
  const [burialClusters, setBurialClusters] = useState<ClusterGroup[]>([]);
  const [isClusterLoading, setIsClusterLoading] = useState(false);
  const [clusterError, setClusterError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadBurial() {
      try {
        setIsLoading(true);
        setError("");
        const data = await getBurial(shortName);

        if (isActive) {
          setDetails(data);
          setBurialClusters([]);
          setClusterError("");
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить информацию о могильнике.");
          setDetails(null);
          setBurialClusters([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadBurial();

    return () => {
      isActive = false;
    };
  }, [shortName]);

  async function handleClusterizeBurial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsClusterLoading(true);
      setClusterError("");
      const data = await getBurialClusters({
        clustersNum: clusterCount,
        burialShortName: shortName,
      });
      setBurialClusters(data);
    } catch (loadError) {
      setClusterError(loadError instanceof Error ? loadError.message : "Не удалось кластеризовать могильник.");
      setBurialClusters([]);
    } finally {
      setIsClusterLoading(false);
    }
  }

  return (
    <section className="burial-page">
      <div className="results-toolbar">
        <div>
          <p className="eyebrow">Burial Details</p>
          <h2>{details?.burial_name ?? `Могильник: ${shortName}`}</h2>
          <p className="panel-text">
            short_name: <code>{details?.burial_short_name ?? shortName}</code>
          </p>
        </div>

        <Link className="secondary-link" to="/clusters">
          Вернуться к кластерам
        </Link>
      </div>

      {isLoading ? <div className="panel">Загрузка информации о могильнике...</div> : null}
      {error ? <div className="message-box message-error">{error}</div> : null}

      {!isLoading && !error && details ? (
        <section className="panel">
          <p className="panel-tag">Кластеризация могильника</p>
          <h3>Сгруппировать захоронения внутри могильника</h3>
          <p className="panel-text">
            Эта форма вызывает <code>/cluster/burial_clusters</code> и строит кластеры только для захоронений из текущего
            могильника.
          </p>

          <form className="form-stack" onSubmit={handleClusterizeBurial}>
            <label>
              Количество кластеров
              <input
                type="number"
                min={1}
                required
                value={clusterCount}
                onChange={(event) => setClusterCount(Number(event.target.value) || 1)}
              />
            </label>

            <button className="primary-button" type="submit" disabled={isClusterLoading}>
              {isClusterLoading ? "Кластеризация..." : "Кластеризовать могильник"}
            </button>
          </form>

          {clusterError ? <div className="message-box message-error">{clusterError}</div> : null}
        </section>
      ) : null}

      {!isLoading && !error && details && burialClusters.length > 0 ? (
        <section className="results-page">
          <div className="cluster-grid">
            {burialClusters.map((cluster) => (
              <article key={cluster.cluster} className="cluster-card">
                <div className="cluster-card-header">
                  <div>
                    <p className="panel-tag">Кластер {cluster.cluster + 1}</p>
                    <h3>{cluster.count} захоронений</h3>
                  </div>
                </div>

                <BurialClusterMembers cluster={cluster} />

                <div>
                  <h4>Топ 10 предметов</h4>
                  {cluster.top_subjects.length > 0 ? (
                    <ul className="subject-list">
                      {cluster.top_subjects.map((subject) => (
                        <li key={`${cluster.cluster}-${subject.subject}`}>
                          <span>{subject.subject}</span>
                          <strong>{subject.count}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="panel-text">Для этого кластера нет предметов.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading && !error && details && details.burials.length > 0 ? (
        <div className="burial-list">
          {details.burials.map((burial) => (
            <article key={burial.burial_id} className="panel burial-card">
              <div className="burial-card-header">
                <div>
                  <p className="panel-tag">
                    {burial.kkm}({details.burial_short_name})
                  </p>
                  <h3>Захоронение {burial.kkm}</h3>
                </div>
                <span className="pill">ID {burial.burial_id}</span>
              </div>

              <div>
                <h4>Предметы</h4>
                {burial.items.length > 0 ? (
                  <div className="pill-group">
                    {burial.items.map((subject, index) => (
                      <span key={`${burial.burial_id}-${subject}-${index}`} className="pill">
                        {subject}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="panel-text">У этого захоронения список предметов пуст.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!isLoading && !error && details && details.burials.length === 0 ? (
        <div className="panel">Для этого могильника пока нет захоронений.</div>
      ) : null}
    </section>
  );
}
