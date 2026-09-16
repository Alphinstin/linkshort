import { buildApp } from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = buildApp();

app.listen(PORT, () => {
  console.log(`linkshort listening on port ${PORT}`);
});
