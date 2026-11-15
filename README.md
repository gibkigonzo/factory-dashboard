# Factory Dashboard

Aplikacja do prowadzenia projektów fabryki oprogramowania na macOS i Androida: tablica zadań taśmy, decyzje właściciela, komendy, koszty i stan taśmy. Tauri 2, React 19, Vite, TypeScript i shadcn/ui, bez serwera, ze stanem w GitHubie.

Zmiany robi taśma fabryki z issue z etykietą `ready`. Konwencje projektu są w [CLAUDE.md](CLAUDE.md), a kontrakt z fabryką w [factory.yml](factory.yml).

## Komendy

| Komenda               | Co robi                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`         | front w przeglądarce (Vite, port 1420)                                          |
| `npm run tauri dev`   | aplikacja desktopowa w trybie deweloperskim                                     |
| `npm run lint`        | ESLint, Prettier, `cargo fmt --check` i `clippy` z błędem na ostrzeżenie        |
| `npm run typecheck`   | `tsc` dla aplikacji i plików narzędzi                                           |
| `npm test`            | Vitest i `cargo test`                                                           |
| `npm run e2e`         | Playwright na froncie z podmienionym IPC                                        |
| `npm run screenshots` | zrzuty ekranów i makiet z `design/` dla taśmy                                   |
| `npm run build`       | aplikacja `.app` na macOS (debug)                                               |
| `npm run android`     | APK debug dla arm64, gdy zmiana dotyka Rusta, zależności albo projektu Androida |
