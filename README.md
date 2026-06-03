# Football Empire Manager

Prototype game quan ly bong da chay truc tiep tren GitHub Pages.

## Cong nghe

- React
- Vite
- TypeScript
- LocalStorage save game
- GitHub Actions deploy GitHub Pages

## Tinh nang MVP

- Tao cau lac bo
- Tu sinh 22 cau thu
- Chon 11 cau thu da chinh
- Chon chien thuat
- Huan luyen doi bong
- Tao giai dau 8 doi
- Gia lap tran dau dang timeline text
- Cap nhat bang xep hang
- Luu game tren trinh duyet

## Chay local

```bash
npm install
npm run dev
```

Mo dia chi Vite hien tren terminal.

## Build

```bash
npm run build
```

## Deploy GitHub Pages

Repo da co workflow tai `.github/workflows/deploy.yml`.

Can vao GitHub repository:

1. Settings
2. Pages
3. Build and deployment
4. Source: GitHub Actions
5. Chay workflow `Deploy to GitHub Pages`

Sau khi deploy xong, app se co dang:

```text
https://trankhacvinh.github.io/football-manager/
```

## Ghi chu

Day la ban frontend-only, du lieu luu bang LocalStorage cua trinh duyet. Xoa cache hoac doi may co the mat save game.
