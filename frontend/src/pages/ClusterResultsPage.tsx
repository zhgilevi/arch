import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getClusters } from "../api";
import type { ClusterGroup } from "../types";

function ClusterMembers({ cluster }: { cluster: ClusterGroup }) {
  return (
    <details className="cluster-details">
      <summary>Объекты в кластере: {cluster.count}</summary>
      <div className="cluster-links">
        {cluster.ids.map((id, index) => {
          const shortName = cluster.short_name[index] ?? "";
          return (
            <Link key={`${cluster.cluster}-${id}-${index}`} className="object-link" to={`/burial/${encodeURIComponent(shortName)}`}>
              {id}({shortName})
            </Link>
          );
        })}
      </div>
    </details>
  );
}

export function ClusterResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCount = Number(searchParams.get("count") ?? 3);
  const [clusterCount, setClusterCount] = useState(Number.isFinite(initialCount) && initialCount > 0 ? initialCount : 3);
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadClusters() {
      try {
        setIsLoading(true);
        setError("");
        const data = await getClusters(clusterCount);

        if (isActive) {
          setClusters(data);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить кластеры.");
          setClusters([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadClusters();
    setSearchParams({ count: String(clusterCount) }, { replace: true });

    return () => {
      isActive = false;
    };
  }, [clusterCount, setSearchParams]);

  return (
    <section className="results-page">
      <div className="results-toolbar">
        <div>
          <p className="eyebrow">Cluster Results</p>
          <h2>Результаты кластеризации</h2>
        </div>

        <label className="inline-control">
          Количество кластеров
          <input
            type="number"
            min={1}
            value={clusterCount}
            onChange={(event) => setClusterCount(Number(event.target.value) || 1)}
          />
        </label>
      </div>

      {isLoading ? <div className="panel">Идёт расчёт кластеров...</div> : null}
      {error ? <div className="message-box message-error">{error}</div> : null}

      {!isLoading && !error ? (
        <div className="cluster-grid">
          {clusters.map((cluster) => (
            <article key={cluster.cluster} className="cluster-card">
              <div className="cluster-card-header">
                <div>
                  <p className="panel-tag">Кластер {cluster.cluster + 1}</p>
                  <h3>{cluster.count} объектов</h3>
                </div>
              </div>

              <ClusterMembers cluster={cluster} />

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
      ) : null}
    </section>
  );
}
