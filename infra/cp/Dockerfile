# syntax=docker/dockerfile:1
#
# Self-contained image for the Varde control plane. Clones the public
# grendalaget/varde repo at VARDE_REF, builds the dashboard SPA, embeds it
# into the CP binary, and ships a minimal runtime image.
#
#   docker build --build-arg VARDE_REF=v1.2.3 -f infra/cp/Dockerfile infra/cp

ARG VARDE_REF=main

# --- Stage 1: build the dashboard SPA (apps/web) --------------------------
FROM mirror.gcr.io/library/node:22-slim AS web
ARG VARDE_REF
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.9.1
RUN git clone --depth 1 --branch "${VARDE_REF}" \
      https://github.com/grendalaget/varde.git /src
WORKDIR /src
RUN pnpm install --frozen-lockfile \
 && pnpm --dir apps/web build

# --- Stage 2: build the CP binary with the embedded webui -----------------
FROM mirror.gcr.io/library/golang:1.27-bookworm AS cp
COPY --from=web /src /src
WORKDIR /src
# Same recipe as `make webui-dist && go build` (see repo Makefile).
RUN rm -rf apps/controlplane/internal/webui/dist \
 && cp -r apps/web/dist apps/controlplane/internal/webui/dist \
 && cd apps/controlplane \
 && CGO_ENABLED=0 go build -o /out/varde-control-plane .

# --- Runtime ---------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=cp /out/varde-control-plane /varde-control-plane
EXPOSE 8080
# Flags are all env-driven: VARDE_LISTEN, VARDE_DB, VARDE_PUBLIC_URL,
# VARDE_SIGNUP, VARDE_EMBEDDED_RELAY(_ADDR), VARDE_LOG_LEVEL (see main.go).
ENTRYPOINT ["/varde-control-plane"]
