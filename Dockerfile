FROM ubuntu:18.04

RUN apt -y update && \
    apt -y install nodejs && \
    apt -y install npm && \
    echo done

WORKDIR /src
COPY ./ ./

RUN cd /src && \
    rm -rf node_modules && \
    npm install && \
    npm install -g yarn && \
    echo done

CMD npm run build
ENTRYPOINT ["node", "build/bin/index.js"]
