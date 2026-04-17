FROM node:22-alpine

WORKDIR /workspace/StratOS

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile && pnpm build

EXPOSE 4310

CMD ["pnpm", "finance:web:start"]
