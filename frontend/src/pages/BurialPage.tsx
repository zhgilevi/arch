import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBurial } from "../api";
import type { BurialDetailsResponse } from "../types";

export function BurialPage() {
  const { shortName = "" } = useParams();
  const [details, setDetails] = useState<BurialDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadBurial() {
      try {
        setIsLoading(true);
        setError("");
        const data = await getBurial(shortName);

        if (isActive) {
          setDetails(data);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить информацию о могильнике.");
          setDetails(null);
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
