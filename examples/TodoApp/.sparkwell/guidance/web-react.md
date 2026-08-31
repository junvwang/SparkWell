# Web React Implementation Guidance

- Place Spark-derived product code by feature under `src/web/src/features/<feature>/`. Keep `src/web/src/App.tsx` as the feature composition boundary and `src/web/src/main.tsx` limited to application bootstrap.
- Each feature owns its state through a feature hook; do not introduce an app-wide state container or external state library.
- Keep working state in memory. Route durable persistence through a feature-owned adapter that alone accesses `localStorage`; UI components do not access browser storage directly.
- Load data from the adapter into the owning hook and then into components. User actions update the owned state and persist through the adapter. There is no remote data source or synchronization layer.