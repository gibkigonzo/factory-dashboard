# Makiety

Wzorzec wyglądu aplikacji. Pliki pochodzą z Claude Design i zmienia je tylko właściciel (strefa `shared`).

- `<ekran>.html`: makieta jednego ekranu, np. `projects.html` albo `board.html`. Nazwa ekranu jest taka sama jak w `e2e/screenshots/screens.spec.ts`.
- `theme.css`: motyw makiet ze zmiennymi CSS shadcn. Ten sam motyw trafia do `src/styles/theme.css`.
- Makieta ma stałe dane, bez losowości i bieżącej daty, a szerokość ustawia okno przeglądarki.

Wzorce `<ekran>@390.ref.png` i `<ekran>@1280.ref.png` renderuje `npm run screenshots` w tej samej przeglądarce co ekrany aplikacji, więc obrazów z Claude Design nie trzymamy w repo.
