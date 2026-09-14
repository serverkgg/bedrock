FROM debian:12-slim

ARG BRIDGE_VERSION

LABEL gg.serverk.bridge.version="${BRIDGE_VERSION}"

LABEL org.opencontainers.image.source="https://github.com/serverkgg/minecraft-bedrock"
LABEL gg.serverk.game="minecraft-bedrock"

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      tini ca-certificates curl unzip zip util-linux tzdata locales \
      libstdc++6 libgcc-s1 zlib1g libcurl4 libssl3; \
    apt-get purge -y --auto-remove; \
    rm -rf /var/lib/apt/lists/*; \
    sed -i 's/^# *en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen; \
    locale-gen en_US.UTF-8; \
    if getent passwd 1000 > /dev/null; then \
      userdel -r "$(getent passwd 1000 | cut -d: -f1)"; \
    fi; \
    groupadd -g 1000 container; \
    useradd -M -d /home/container -u 1000 -g 1000 -s /usr/sbin/nologin container; \
    mkdir -p /home/container /serverk/run

ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    TZ=UTC \
    HOME=/home/container \
    LD_LIBRARY_PATH=.

COPY dist/bridge /serverk/bridge

RUN chmod 0755 /serverk/bridge

WORKDIR /home/container

ENTRYPOINT ["/usr/bin/tini", "--", "/serverk/bridge"]
