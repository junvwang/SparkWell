# Windows WinUI 3 Implementation Guidance

## Architecture

Preserve the existing C# and WinUI 3 project. Use XAML for views and code-behind for event handling, presentation state, and application orchestration. Keep plain product models under `Models` and app-local data access under `Services`; do not introduce view models or an MVVM framework unless a later configuration revision changes this architecture.

## State and Data Flow

Each window or page owns the in-memory state it presents and projects that state into its controls. A dedicated service loads and saves the product models as JSON in the application's local data folder using asynchronous file I/O. Views and code-behind use that service rather than accessing files directly.

Data flows from the JSON service into code-behind state and then into the XAML controls. User actions flow through code-behind operations, update the owned state, and then persist through the service. There is no remote data source or synchronization layer. Observable persistence and failure behavior remains governed by the reviewed Sparks.

## Artifact Placement and Ownership

Spark-derived XAML, code-behind, models, and services belong under `src/windows`. The Spark implementation workflow may maintain those product artifacts and the application composition needed to connect them.

The project file, application and package manifests, dependency versions, generated output, and build configuration remain authoritative native artifacts and are not duplicated here.