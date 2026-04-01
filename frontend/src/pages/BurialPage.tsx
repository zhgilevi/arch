import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBurial } from "../api";
import type { BurialObject } from "../types";

export function BurialPage() {
  const { shortName = "" } = useParams();
  const [items, setItems] = useState<BurialObject[]>([]);
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
          setItems(data);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить информацию о погребении.");
          setItems([]);
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
          <h2>Погребения с short_name: {shortName}</h2>
        </div>

        <Link className="secondary-link" to="/clusters">
          Вернуться к кластерам
        </Link>
      </div>

      {isLoading ? <div className="panel">Загрузка данных о погребении...</div> : null}
      {error ? <div className="message-box message-error">{error}</div> : null}

      {!isLoading && !error ? (
        <div className="burial-list">
          {items.map((item) => (
            <article key={item.burial_id} className="panel burial-card">
              <div className="burial-card-header">
                <div>
                  <p className="panel-tag">{item.kkm}({item.burial_short_name})</p>
                  <h3>{item.burial_name}</h3>
                </div>
                <span className="pill">ID {item.burial_id}</span>
              </div>

              <div>
                <h4>Предметы</h4>
                {item.items.length > 0 ? (
                  <div className="pill-group">
                    {item.items.map((subject, index) => (
                      <span key={`${item.burial_id}-${subject}-${index}`} className="pill">
                        {subject}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="panel-text">У этого объекта список предметов пуст.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
