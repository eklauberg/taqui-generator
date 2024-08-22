FROM oven/bun:debian

ENV PATH="~/.bun/bin:${PATH}"
RUN ln -s /usr/local/bin/bun /usr/local/bin/node

RUN apt-get update
RUN apt-get install -y git \
  libvips-dev \
  libfontconfig1 \

RUN rm -rf /var/lib/apt/lists/*

