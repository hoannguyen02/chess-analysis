## touch .env - locally same as development
NEXT_PUBLIC_LIMA_BE_DOMAIN=http://localhost:8000
SESSION_SECRET= [same as backend repo value]
NEXT_PUBLIC_BASE_URL=http://localhost:3000

## Getting Started
Local:
```bash
# or
yarn dev
```


## Deploy Development & Production:

1. Add environment files
2. npm run build
2. Prod: pm2 start yarn --name "fe" -- start



## User guides

- [Setup Board: lesson import and keyboard shortcuts](docs/setup-board.md) — **B** before the move, **N** replay; **←/→** switch positions.
