# TodoApp Starter

Pre-created runtime shells for the TodoApp example:

- `src/web`: empty React, TypeScript, and Vite application.
- `src/windows`: empty C# and WinUI 3 application.

The starter contains no Todo behavior, Sparks, realization state, or tests. Those artifacts can be added during the demo without spending time on framework scaffolding.

## Validate

```powershell
Push-Location src/web
npm install
npm run build
npm run lint
Pop-Location

dotnet build src/windows/TodoApp.slnx
dotnet format src/windows/TodoApp.slnx --verify-no-changes
```